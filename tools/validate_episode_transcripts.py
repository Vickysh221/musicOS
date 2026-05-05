"""Validate episodes/<slug>.episode.{md,json} transcript integrity.

Usage: python3 tools/validate_episode_transcripts.py <slug>

Asserts:
  a. Both episode files exist.
  b. Per-track char caps (250-400 ZH chars for active; 40-80 for muted bridges).
  c. Forbidden tokens not present in any transcript field.
  d. EN word cap: no single paragraph in transcript_en exceeds 30 words.
  e. Focus tag: every exhibit's episode_focus matches the top-level focus
     (narration exhibits—opening/interlude/closing—that lack the field are skipped
      but a warning is emitted).
  f. MD ↔ JSON sync: each track section body matches the JSON transcript_zh.
  g. Position contiguity: track positions 1..18, narration positions contain 0
     plus two non-track exhibits, muted_positions matches exhibits.

Exits 0 on green; exits 1 with all failures printed to stderr (no short-circuit).
"""
from __future__ import annotations

import difflib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TRACK_CHAR_MIN = 250
TRACK_CHAR_MAX = 400
BRIDGE_CHAR_MIN = 40
BRIDGE_CHAR_MAX = 80

FORBIDDEN_RE = re.compile(r"(Track\s+\d+|第\s*\d+\s*首|\[|\])")

FOCUS_TAXONOMY = ROOT / "Foundations" / "episode_focus_taxonomy.md"


def _codepoint_len(s: str) -> int:
    return len(list(s))


def _paragraphs(text: str) -> list[str]:
    """Split text on blank lines, stripping each paragraph."""
    return [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]


def _focus_exists_in_taxonomy(focus: str) -> bool:
    if not FOCUS_TAXONOMY.exists():
        return False
    taxonomy_text = FOCUS_TAXONOMY.read_text(encoding="utf-8")
    return bool(re.search(rf"^##\s+{re.escape(focus)}\s*$", taxonomy_text, re.MULTILINE))


def _parse_md_track_sections(md_text: str) -> dict[int, str]:
    """Return {position: transcript_body_str} by parsing ## Track N: ... / ### Narration."""
    sections: dict[int, str] = {}
    # Split md into blocks on `## Track N` headers
    # We capture everything after `### Narration` until the next `---` or `##` header.
    track_block_re = re.compile(r"^##\s+Track\s+(\d+):", re.MULTILINE)
    narration_re = re.compile(r"###\s+Narration\s*\n(.*?)(?=\n---|\n##|\Z)", re.DOTALL)

    positions_found = list(track_block_re.finditer(md_text))
    for i, m in enumerate(positions_found):
        pos = int(m.group(1))
        # Slice from this match to start of next match (or end)
        start = m.start()
        end = positions_found[i + 1].start() if i + 1 < len(positions_found) else len(md_text)
        block = md_text[start:end]
        narr_m = narration_re.search(block)
        if narr_m:
            body = narr_m.group(1).strip()
            sections[pos] = body
    return sections


def validate(slug: str, base_dir: Path | None = None) -> list[str]:
    """Run all assertions; return list of failure messages (empty = green)."""
    if base_dir is None:
        base_dir = ROOT

    failures: list[str] = []

    md_path = base_dir / "episodes" / f"{slug}.episode.md"
    json_path = base_dir / "episodes" / f"{slug}.episode.json"

    # ── a. File presence ────────────────────────────────────────────────────
    if not md_path.exists():
        failures.append(f"missing file: {md_path}")
    if not json_path.exists():
        failures.append(f"missing file: {json_path}")

    if not md_path.exists() or not json_path.exists():
        # Cannot continue without both files
        return failures

    data = json.loads(json_path.read_text(encoding="utf-8"))
    md_text = md_path.read_text(encoding="utf-8")

    top_focus = data.get("episode_focus", "")
    muted_positions_declared: list[int] = data.get("muted_positions", [])
    exhibits: list[dict] = data.get("exhibits", [])

    # ── e. Focus tag in taxonomy ─────────────────────────────────────────────
    if top_focus and not _focus_exists_in_taxonomy(top_focus):
        failures.append(
            f"episode_focus '{top_focus}' not found as '## {top_focus}' in {FOCUS_TAXONOMY}"
        )

    # ── g. Position contiguity ───────────────────────────────────────────────
    track_exhibits = [ex for ex in exhibits if ex.get("kind") == "track"]
    narration_exhibits = [ex for ex in exhibits if ex.get("kind") != "track"]

    track_positions = sorted(int(ex["position"]) for ex in track_exhibits)
    expected_track_positions = list(range(1, 19))  # 1..18
    if track_positions != expected_track_positions:
        failures.append(
            f"track positions mismatch: got {track_positions}, expected {expected_track_positions}"
        )

    narration_positions = [ex["position"] for ex in narration_exhibits]
    if 0 not in narration_positions:
        failures.append("narration exhibits missing position 0 (opening)")
    if len(narration_exhibits) != 3:
        failures.append(
            f"expected 3 narration exhibits (opening + interlude + closing), "
            f"got {len(narration_exhibits)}"
        )

    muted_actual = {int(ex["position"]) for ex in track_exhibits if ex.get("muted_this_episode")}
    muted_declared = set(muted_positions_declared)
    if muted_actual != muted_declared:
        failures.append(
            f"muted_positions declared {sorted(muted_declared)} but "
            f"exhibits show muted at {sorted(muted_actual)}"
        )

    # ── b, c, d, e per-exhibit ───────────────────────────────────────────────
    for ex in exhibits:
        pos = ex.get("position")
        kind = ex.get("kind", "")

        # e. Focus tag on track exhibits
        if kind == "track":
            ex_focus = ex.get("episode_focus")
            if ex_focus != top_focus:
                failures.append(
                    f"position {pos}: episode_focus '{ex_focus}' != top-level '{top_focus}'"
                )

        if kind == "track":
            muted = ex.get("muted_this_episode", False)

            if not muted:
                # b. Active track char cap
                tz = ex.get("transcript_zh") or ""
                n = _codepoint_len(tz)
                if not (TRACK_CHAR_MIN <= n <= TRACK_CHAR_MAX):
                    failures.append(
                        f"position {pos}: transcript_zh length {n} not in "
                        f"[{TRACK_CHAR_MIN}, {TRACK_CHAR_MAX}]"
                    )

                # c. Forbidden tokens in transcript_zh
                if tz and FORBIDDEN_RE.search(tz):
                    match = FORBIDDEN_RE.search(tz)
                    failures.append(
                        f"position {pos}: forbidden token '{match.group()}' in transcript_zh"
                    )

                # d. EN word cap
                te = ex.get("transcript_en")
                if te:
                    for p_idx, para in enumerate(_paragraphs(te), 1):
                        wc = len(para.split())
                        if wc > 30:
                            failures.append(
                                f"position {pos}: transcript_en paragraph {p_idx} "
                                f"has {wc} words (cap 30)"
                            )

            else:
                # b. Muted track bridge cap
                bridge = ex.get("bridge_narration_zh")
                if bridge is None:
                    failures.append(
                        f"position {pos}: muted_this_episode=true but bridge_narration_zh missing"
                    )
                else:
                    n = _codepoint_len(bridge)
                    if not (BRIDGE_CHAR_MIN <= n <= BRIDGE_CHAR_MAX):
                        failures.append(
                            f"position {pos}: bridge_narration_zh length {n} not in "
                            f"[{BRIDGE_CHAR_MIN}, {BRIDGE_CHAR_MAX}]"
                        )

                    # c. Forbidden tokens in bridge
                    if FORBIDDEN_RE.search(bridge):
                        match = FORBIDDEN_RE.search(bridge)
                        failures.append(
                            f"position {pos}: forbidden token '{match.group()}' "
                            f"in bridge_narration_zh"
                        )

        elif kind in ("opening", "interlude", "closing", "narration"):
            # c. Forbidden tokens in narration exhibits
            tz = ex.get("transcript_zh") or ""
            if tz and FORBIDDEN_RE.search(tz):
                match = FORBIDDEN_RE.search(tz)
                failures.append(
                    f"position {pos} ({kind}): forbidden token '{match.group()}' in transcript_zh"
                )

    # ── f. MD ↔ JSON sync ────────────────────────────────────────────────────
    md_sections = _parse_md_track_sections(md_text)

    for ex in track_exhibits:
        pos = int(ex["position"])
        muted = ex.get("muted_this_episode", False)

        if muted:
            # Muted tracks use a Bridge line in MD — skip full narration sync
            continue

        json_tz = (ex.get("transcript_zh") or "").strip()
        md_body = md_sections.get(pos, "").strip()

        if json_tz != md_body:
            diff = list(
                difflib.unified_diff(
                    json_tz.splitlines(),
                    md_body.splitlines(),
                    fromfile=f"json[{pos}].transcript_zh",
                    tofile=f"md[Track {pos}]",
                    lineterm="",
                )
            )
            diff_str = "\n".join(diff[:30])  # cap diff output
            failures.append(
                f"position {pos}: MD/JSON transcript mismatch (drift)\n{diff_str}"
            )

    return failures


def main(slug: str, base_dir: Path | None = None) -> None:
    if base_dir is None:
        base_dir = ROOT

    failures = validate(slug, base_dir)

    if failures:
        for f in failures:
            print(f"FAIL: {f}", file=sys.stderr)
        sys.exit(1)

    # ── h. Audit summary ─────────────────────────────────────────────────────
    json_path = base_dir / "episodes" / f"{slug}.episode.json"
    data = json.loads(json_path.read_text(encoding="utf-8"))
    exhibits = data.get("exhibits", [])
    track_exhibits = [ex for ex in exhibits if ex.get("kind") == "track"]
    muted_count = sum(1 for ex in track_exhibits if ex.get("muted_this_episode"))
    active_lengths = [
        len(list(ex.get("transcript_zh") or ""))
        for ex in track_exhibits
        if not ex.get("muted_this_episode")
    ]
    lo = min(active_lengths) if active_lengths else 0
    hi = max(active_lengths) if active_lengths else 0
    print(
        f"OK: {slug} transcripts green "
        f"(18 tracks, {muted_count} muted, char range [{lo}..{hi}])"
    )


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: python3 tools/validate_episode_transcripts.py <slug>", file=sys.stderr)
        sys.exit(2)
    main(sys.argv[1])
