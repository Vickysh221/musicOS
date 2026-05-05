"""Tests for tools/validate_episode_transcripts.py.

Uses the Miss You episode as the green fixture.
Each mutation test copies fixture files into tmp_path, injects a defect,
then asserts exit code 1 and an informative stderr message.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
SLUG = "rolling-stones_some-girls_miss-you"

# Import the module under test so we can call validate() in-process
sys.path.insert(0, str(ROOT / "tools"))
from validate_episode_transcripts import validate  # noqa: E402


# ── helpers ─────────────────────────────────────────────────────────────────

def _copy_fixture(tmp_path: Path) -> tuple[Path, Path]:
    """Copy Miss You fixture files into tmp_path/episodes/ and return (md, json) paths."""
    ep_src = ROOT / "episodes"
    ep_dst = tmp_path / "episodes"
    ep_dst.mkdir(parents=True, exist_ok=True)
    md_src = ep_src / f"{SLUG}.episode.md"
    json_src = ep_src / f"{SLUG}.episode.json"
    shutil.copy(md_src, ep_dst / md_src.name)
    shutil.copy(json_src, ep_dst / json_src.name)
    return ep_dst / md_src.name, ep_dst / json_src.name


def _run_cli(slug: str) -> subprocess.CompletedProcess:
    cmd = [sys.executable, str(ROOT / "tools" / "validate_episode_transcripts.py"), slug]
    return subprocess.run(cmd, capture_output=True, text=True)


# ── tests ───────────────────────────────────────────────────────────────────

class TestMissYouPasses:
    def test_miss_you_passes(self):
        """The green fixture must exit 0 via the CLI."""
        result = _run_cli(SLUG)
        assert result.returncode == 0, (
            f"Expected exit 0 on Miss You green fixture.\n"
            f"stdout: {result.stdout}\nstderr: {result.stderr}"
        )
        assert "OK:" in result.stdout


class TestDetectsOverlongTranscript:
    def test_detects_overlong_transcript(self, tmp_path):
        """A 1000-char transcript_zh must trigger exit 1 mentioning the position."""
        _md, json_path = _copy_fixture(tmp_path)
        data = json.loads(json_path.read_text(encoding="utf-8"))

        # Find the first non-muted track exhibit and bloat its transcript
        target_pos = None
        for ex in data["exhibits"]:
            if ex.get("kind") == "track" and not ex.get("muted_this_episode"):
                target_pos = ex["position"]
                ex["transcript_zh"] = "贝" * 1000
                break

        assert target_pos is not None, "No non-muted track found in fixture"
        json_path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

        failures = validate(SLUG, tmp_path)
        assert any(str(target_pos) in f for f in failures), (
            f"Expected failure mentioning position {target_pos}.\nGot: {failures}"
        )
        # Also confirm the length is mentioned
        assert any("1000" in f or "length" in f for f in failures), (
            f"Expected failure to mention length 1000.\nGot: {failures}"
        )

    def test_detects_overlong_transcript_exit_code(self, tmp_path):
        """Same mutation via validate() confirms non-empty failure list."""
        _md, json_path = _copy_fixture(tmp_path)
        data = json.loads(json_path.read_text(encoding="utf-8"))
        for ex in data["exhibits"]:
            if ex.get("kind") == "track" and not ex.get("muted_this_episode"):
                ex["transcript_zh"] = "贝" * 1000
                break
        json_path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

        failures = validate(SLUG, tmp_path)
        assert len(failures) > 0, "Expected at least one failure for 1000-char transcript"


class TestDetectsForbiddenToken:
    def test_detects_forbidden_token(self, tmp_path):
        """A 'Track 5' substring in transcript_zh must trigger a failure."""
        _md, json_path = _copy_fixture(tmp_path)
        data = json.loads(json_path.read_text(encoding="utf-8"))

        for ex in data["exhibits"]:
            if ex.get("kind") == "track" and not ex.get("muted_this_episode"):
                # Inject forbidden token while keeping char count in range
                original = ex["transcript_zh"] or ""
                # Replace last 7 chars with the forbidden token (same byte budget approx)
                ex["transcript_zh"] = original[:250] + "Track 5 某某某"
                break

        json_path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

        failures = validate(SLUG, tmp_path)
        assert any("forbidden" in f.lower() or "Track 5" in f for f in failures), (
            f"Expected failure about forbidden token.\nGot: {failures}"
        )

    def test_detects_forbidden_bracket(self, tmp_path):
        """Square brackets in transcript_zh are also forbidden."""
        _md, json_path = _copy_fixture(tmp_path)
        data = json.loads(json_path.read_text(encoding="utf-8"))

        for ex in data["exhibits"]:
            if ex.get("kind") == "track" and not ex.get("muted_this_episode"):
                original = ex["transcript_zh"] or ""
                ex["transcript_zh"] = original[:250] + "[注释]某某某某某"
                break

        json_path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

        failures = validate(SLUG, tmp_path)
        assert any("forbidden" in f.lower() for f in failures), (
            f"Expected failure about forbidden token.\nGot: {failures}"
        )


class TestDetectsMdJsonDrift:
    def test_detects_md_json_drift(self, tmp_path):
        """Mutating one paragraph in the .md must produce a drift/mismatch failure."""
        md_path, _json = _copy_fixture(tmp_path)
        md_text = md_path.read_text(encoding="utf-8")

        # Replace the Track 1 narration body with something different
        drift_text = "这是被篡改的文本，与 JSON 不同。"
        # Find and replace the first narration body after Track 1
        original_line = "Cincinnati 的 King Studio"
        assert original_line in md_text, "Fixture sanity check failed: expected line not in MD"
        mutated = md_text.replace(original_line, "DRIFT_CONTENT 被修改了", 1)
        md_path.write_text(mutated, encoding="utf-8")

        failures = validate(SLUG, tmp_path)
        drift_failures = [
            f for f in failures
            if "drift" in f.lower() or "mismatch" in f.lower()
        ]
        assert len(drift_failures) > 0, (
            f"Expected at least one drift/mismatch failure.\nGot: {failures}"
        )

    def test_detects_md_json_drift_position_mentioned(self, tmp_path):
        """The drift failure must mention the track position."""
        md_path, _json = _copy_fixture(tmp_path)
        md_text = md_path.read_text(encoding="utf-8")

        original_line = "Cincinnati 的 King Studio"
        mutated = md_text.replace(original_line, "DRIFT_CONTENT 被修改了", 1)
        md_path.write_text(mutated, encoding="utf-8")

        failures = validate(SLUG, tmp_path)
        # Position 1 should appear in at least one drift failure
        drift_failures = [
            f for f in failures
            if ("drift" in f.lower() or "mismatch" in f.lower()) and "1" in f
        ]
        assert len(drift_failures) > 0, (
            f"Expected drift failure mentioning position 1.\nGot: {failures}"
        )


class TestDetectsShortBridge:
    def test_detects_short_bridge(self, tmp_path):
        """A bridge_narration_zh of 20 chars must trigger a failure."""
        _md, json_path = _copy_fixture(tmp_path)
        data = json.loads(json_path.read_text(encoding="utf-8"))

        muted_pos = None
        for ex in data["exhibits"]:
            if ex.get("kind") == "track" and ex.get("muted_this_episode"):
                muted_pos = ex["position"]
                ex["bridge_narration_zh"] = "短桥接" * 5  # exactly 15 chars — too short
                break

        assert muted_pos is not None, "No muted track found in Miss You fixture"
        json_path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

        failures = validate(SLUG, tmp_path)
        assert any(str(muted_pos) in f for f in failures), (
            f"Expected failure mentioning muted position {muted_pos}.\nGot: {failures}"
        )
        assert any("bridge" in f.lower() or "40" in f for f in failures), (
            f"Expected failure about bridge length.\nGot: {failures}"
        )

    def test_detects_missing_bridge(self, tmp_path):
        """A muted track with no bridge_narration_zh must trigger a failure."""
        _md, json_path = _copy_fixture(tmp_path)
        data = json.loads(json_path.read_text(encoding="utf-8"))

        for ex in data["exhibits"]:
            if ex.get("kind") == "track" and ex.get("muted_this_episode"):
                del ex["bridge_narration_zh"]
                break

        json_path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

        failures = validate(SLUG, tmp_path)
        assert any("bridge_narration_zh missing" in f for f in failures), (
            f"Expected 'bridge_narration_zh missing' failure.\nGot: {failures}"
        )
