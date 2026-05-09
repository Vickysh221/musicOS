"""
Synthesize every narratable exhibit in an episode.json into an mp3, using the
locked voice/model from MiniMax. Idempotent: skips entries whose output already
exists. Writes a per-run record to episodes/audio/narration/synthesis_log.jsonl.

Output naming:
    track exhibits        → match the existing music filename stem in
                            musicos-exhibition/public/audio/, suffix .mp3
                            (e.g. 06_the-rolling-stones_miss-you.mp3)
    opening / interlude   → NN_<kind>.mp3 (e.g. 00_opening.mp3, 19_interlude.mp3)
    closing               → NN_closing.mp3
    muted track           → uses bridge_narration_zh; same track stem

Usage:
    python3 -m tools.batch_synthesize_episode \\
        --episode episodes/rolling-stones_some-girls_miss-you.episode.json \\
        --voice 'Chinese (Mandarin)_Gentleman' \\
        --output-dir episodes/audio/narration
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from tools.tts_minimax import load_env_local, synthesize

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MUSIC_DIR = ROOT / "musicos-exhibition" / "public" / "audio"


def music_stem_for_position(music_dir: Path, pos: int) -> str | None:
    prefix = f"{pos:02d}_"
    for f in music_dir.glob(f"{prefix}*.mp3"):
        return f.stem
    return None


def output_stem(exhibit: dict, music_dir: Path) -> str:
    pos = exhibit["position"]
    kind = exhibit["kind"]
    if kind == "track":
        stem = music_stem_for_position(music_dir, pos)
        if stem:
            return stem
        return f"{pos:02d}_track"
    return f"{pos:02d}_{kind}"


def text_for(exhibit: dict, lang: str = "zh") -> list[tuple[str, str, str]]:
    """Return list of (text, source_field, suffix) for this exhibit.

    suffix is '' for the single-mp3 case, or '_a' / '_b' for split pillars.

    When lang='en', transcript_en is used for non-muted track/narration exhibits.
    Bridge narration always comes from bridge_narration_zh regardless of lang
    (no EN bridge field exists yet).
    """
    if exhibit.get("muted_this_episode"):
        text = exhibit.get("bridge_narration_zh")
        return [(text, "bridge_narration_zh", "")] if text else []

    if lang == "en":
        text = exhibit.get("transcript_en")
        if not text:
            return []
        return [(text, "transcript_en", "")]

    parts: list[tuple[str, str, str]] = []
    text_a = exhibit.get("transcript_zh_a")
    text_b = exhibit.get("transcript_zh_b")
    if text_a and text_b:
        parts.append((text_a, "transcript_zh_a", "_a"))
        parts.append((text_b, "transcript_zh_b", "_b"))
        return parts

    text = exhibit.get("transcript_zh")
    return [(text, "transcript_zh", "")] if text else []


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--episode", required=True, type=Path)
    p.add_argument("--voice", required=True)
    p.add_argument("--output-dir", required=True, type=Path)
    p.add_argument("--music-dir", type=Path, default=DEFAULT_MUSIC_DIR,
                   help="dir containing NN_<artist>_<track>.mp3 source files; used to derive narration stems")
    p.add_argument("--model", default="speech-02-hd")
    p.add_argument("--force", action="store_true",
                   help="re-synth even if output exists")
    p.add_argument("--only-position", type=int, action="append", default=[],
                   help="only synth this exhibit position; repeatable")
    p.add_argument("--subtitle", action="store_true",
                   help="request sentence-level timestamps; saves <stem>.subtitle.json next to mp3")
    p.add_argument("--lang", default="zh", choices=["zh", "en"],
                   help="which transcript field to synthesize: zh (default) or en. "
                        "Bridge narration always uses bridge_narration_zh regardless of --lang.")
    args = p.parse_args()

    load_env_local()
    api_key = os.environ.get("MINIMAX_API_KEY")
    group_id = os.environ.get("MINIMAX_GROUP_ID")
    if not api_key:
        sys.exit("MINIMAX_API_KEY not set (check .env.local)")

    ep = json.loads(args.episode.read_text(encoding="utf-8"))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    log_path = args.output_dir / "synthesis_log.jsonl"

    total_runs = 0
    total_skipped = 0
    total_chars = 0
    total_usage_chars = 0

    for ex in ep["exhibits"]:
        pos = ex["position"]
        kind = ex["kind"]
        if args.only_position and pos not in args.only_position:
            continue
        parts = text_for(ex, lang=args.lang)
        if not parts:
            if args.lang == "en" and not ex.get("muted_this_episode") and not ex.get("transcript_en"):
                print(f"  warn  {pos:02d} {kind}: transcript_en is null/empty, skipping")
            else:
                print(f"  skip {pos:02d} {kind}: no narration text")
            continue
        stem = output_stem(ex, args.music_dir)

        for text, source_field, suffix in parts:
            out_path = args.output_dir / f"{stem}{suffix}.mp3"

            if out_path.exists() and not args.force:
                print(f"  skip {stem}{suffix}: already exists")
                total_skipped += 1
                continue

            print(f"  synth {stem}{suffix}: {len(text)} chars from {source_field}")
            audio, meta = synthesize(
                text, args.voice, api_key, group_id or "", model=args.model,
                subtitle=args.subtitle,
            )
            out_path.write_bytes(audio)
            if args.subtitle:
                sub_data = meta.get("subtitle")
                if sub_data:
                    sub_path = out_path.with_suffix(".subtitle.json")
                    sub_path.write_text(
                        json.dumps(sub_data, ensure_ascii=False, indent=2),
                        encoding="utf-8",
                    )
                    print(f"        + {sub_path.name} ({len(sub_data)} segments)")
                else:
                    print(f"        ! subtitle requested but missing: {meta.get('subtitle_error', 'no subtitle_file in response')}")

            usage = (meta.get("extra_info") or {}).get(
                "usage_characters", len(text)
            )
            total_runs += 1
            total_chars += len(text)
            total_usage_chars += usage

            with log_path.open("a", encoding="utf-8") as f:
                f.write(json.dumps({
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "episode": str(args.episode),
                    "position": pos,
                    "kind": kind,
                    "source_field": source_field,
                    "suffix": suffix,
                    "voice_id": args.voice,
                    "model": args.model,
                    "input_chars": len(text),
                    "usage_characters": usage,
                    "output_bytes": len(audio),
                    "latency_ms": meta["latency_ms"],
                    "output_path": str(out_path.resolve().relative_to(ROOT)),
                }, ensure_ascii=False) + "\n")

    print(f"\nDone: {total_runs} synthesized, {total_skipped} skipped")
    print(f"  input chars: {total_chars}")
    print(f"  usage chars: {total_usage_chars}")


if __name__ == "__main__":
    main()
