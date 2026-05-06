"""
Batch-stitch all 18 tracks of an episode into per-track fusion mp3s.

Style assignment for Miss You ep 1 (calibrated 2026-05-06):
    A (sequential)            : positions 2, 4, 5, 7, 10, 12, 13, 14, 15, 16, 18
    C (pre-roll + ducked bed) : positions 1, 3, 6, 9, 11, 17
    C-short (muted 30s music) : position 8
    non-track (passthrough)   : positions 0, 19, 20 — copies narration mp3,
                                no music (open/interlude/close are spoken only)

Defaults: 100s music excerpt for A; 60s post-roll for C; voice locked to
'Chinese (Mandarin)_Gentleman' (chosen during spike).

Usage:
    python3 -m tools.batch_fusion \\
        --episode episodes/rolling-stones_some-girls_miss-you.episode.json \\
        --narration-dir episodes/audio/narration \\
        --music-dir musicos-exhibition/public/audio \\
        --output-dir episodes/audio/fusion
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path

from tools.stitch_track import (
    stitch_a, stitch_c, probe_duration,
    FADEOUT, A_OVERLAP, A_BED_LEVEL, A_RAMP_AFTER,
    C_DUCK_LEVEL,
)

ROOT = Path(__file__).resolve().parent.parent

# Style assignment: position → 'A' | 'C' | 'C_SHORT' | 'PASSTHROUGH'

# Episode 1 — Miss You · Bassline DNA (calibrated 2026-05-06)
# STYLE_BY_POSITION_EP1: dict[int, str] = {
#     0: "PASSTHROUGH",
#     1: "C",   # JB anchor — bass intro should land first
#     2: "C",   # Family Affair — needs preroll for groove
#     3: "C",
#     4: "C",   # Give Up the Funk — preroll for P-Funk entry
#     5: "C",   # Stayin' Alive — preroll for the famous intro
#     6: "C",   # Miss You anchor, 622-char narration
#     7: "A",
#     8: "C_SHORT",  # muted, 30s music only
#     9: "C",
#     10: "C",  # Isolation — preroll for the bassline
#     11: "C",
#     12: "C",  # Another One Bites the Dust — preroll for that bassline
#     13: "A",
#     14: "A",
#     15: "A",
#     16: "A",
#     17: "C",
#     18: "A",
#     19: "PASSTHROUGH",
#     20: "PASSTHROUGH",
# }

# Episode 2 — Estranged · aria↔solo dialectic (2026-05-06)
# All narrations >350ch → C; muted tracks → C_SHORT; opening/closing → PASSTHROUGH
STYLE_BY_POSITION: dict[int, str] = {
    0:  "PASSTHROUGH",   # opening
    1:  "C",   # Child in Time — 576ch
    2:  "C",   # Layla — 559ch
    3:  "C",   # Stairway to Heaven — 491ch
    4:  "C_SHORT",       # The Who — muted bridge 131ch
    5:  "C",   # Free Bird — 565ch
    6:  "C",   # Bohemian Rhapsody — 606ch
    7:  "C",   # Comfortably Numb — 546ch
    8:  "C",   # Fade to Black — 516ch
    9:  "C_SHORT",       # Metallica One — muted bridge 144ch
    10: "C",   # Estranged — ANCHOR 1092ch
    11: "C",   # November Rain — 639ch
    12: "C",   # Nothing Else Matters — 532ch
    13: "C",   # Don't Break My Heart — 426ch
    14: "C",   # Champagne Supernova — 611ch
    15: "C",   # Paranoid Android — 575ch
    16: "C",   # 丸ノ内サディスティック — 482ch
    17: "C",   # Welcome to the Black Parade — 621ch
    18: "C",   # Knights of Cydonia — 623ch
    19: "PASSTHROUGH",   # closing
}


def stitch_c_short(narration: Path, music: Path, output: Path) -> None:
    """Custom C variant fitted to a 30s music clip for muted tracks.

    Layout (target ~28-29s total for ~6s narration):
        0-3.5s:   music full
        3.5-4s:   duck to 10%
        4-(4+ndur)s: narration + ducked music
        ndur+4 to ndur+4.5s: ramp back to 100%
        ndur+4.5 to (ndur+4.5 + post): full music
        + 5.5s fadeout
    Caller must supply music ≥ (4 + ndur + 0.5 + post + 5.5) seconds.
    """
    n_dur = probe_duration(narration)
    m_dur = probe_duration(music)
    preroll = 3.5
    duck_ramp = 0.5
    fadeout = 5.5
    # Use whatever post-roll fits in available music minus pre/duck/narration/fadeout
    available = m_dur - (preroll + duck_ramp + n_dur + duck_ramp + fadeout)
    post = max(2.0, min(available, 12.0))
    timeline = preroll + duck_ramp + n_dur + duck_ramp + post
    needed = timeline + fadeout
    if m_dur < needed:
        raise SystemExit(
            f"music {music.name} is {m_dur:.1f}s; C-short needs ≥{needed:.1f}s"
        )
    duck_start = preroll
    duck_end = preroll + duck_ramp
    rampup_start = duck_end + n_dur
    rampup_end = rampup_start + duck_ramp
    duck_drop_per_s = (1.0 - C_DUCK_LEVEL) / duck_ramp
    duck_rise_per_s = (1.0 - C_DUCK_LEVEL) / duck_ramp
    vol_expr = (
        f"if(lt(t,{duck_start}),1,"
        f"if(lt(t,{duck_end}),1-(t-{duck_start})*{duck_drop_per_s},"
        f"if(lt(t,{rampup_start}),{C_DUCK_LEVEL},"
        f"if(lt(t,{rampup_end}),{C_DUCK_LEVEL}+(t-{rampup_start})*{duck_rise_per_s},"
        f"1))))"
    )
    music_clip = timeline + fadeout
    narration_delay_ms = int(duck_end * 1000)
    filt = (
        f"[0:a]atrim=0:{music_clip},asetpts=PTS-STARTPTS,"
        f"volume='{vol_expr}':eval=frame,"
        f"afade=t=out:st={timeline}:d={fadeout}[m];"
        f"[1:a]adelay={narration_delay_ms}|{narration_delay_ms}[n];"
        f"[m][n]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0"
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        "ffmpeg", "-y", "-i", str(music), "-i", str(narration),
        "-filter_complex", filt,
        "-ac", "2", "-ar", "44100", "-b:a", "192k",
        str(output),
    ], check=True)


def find_match(directory: Path, prefix: str) -> Path | None:
    for f in directory.glob(f"{prefix}*.mp3"):
        return f
    return None


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--episode", required=True, type=Path)
    p.add_argument("--narration-dir", required=True, type=Path)
    p.add_argument("--music-dir", required=True, type=Path)
    p.add_argument("--output-dir", required=True, type=Path)
    p.add_argument("--excerpt-seconds-a", type=float, default=100.0)
    p.add_argument("--postroll-seconds-c", type=float, default=60.0)
    p.add_argument("--force", action="store_true")
    args = p.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    ep = json.loads(args.episode.read_text(encoding="utf-8"))

    for ex in ep["exhibits"]:
        pos = ex["position"]
        style = STYLE_BY_POSITION.get(pos)
        if style is None:
            print(f"  skip {pos}: no style assigned")
            continue

        prefix = f"{pos:02d}_"
        narration = find_match(args.narration_dir, prefix)
        if not narration:
            print(f"  skip {pos}: no narration mp3 matching {prefix}*")
            continue
        out_path = args.output_dir / narration.name
        if out_path.exists() and not args.force:
            print(f"  skip {narration.stem}: already exists")
            continue

        if style == "PASSTHROUGH":
            shutil.copy2(narration, out_path)
            print(f"  copy  {narration.stem}: passthrough (no music)")
            continue

        music = find_match(args.music_dir, prefix)
        if not music:
            print(f"  skip {pos}: no music mp3 matching {prefix}*")
            continue

        try:
            if style == "A":
                stitch_a(narration, music, out_path, args.excerpt_seconds_a)
                tag = f"A excerpt={args.excerpt_seconds_a}s"
            elif style == "C":
                stitch_c(narration, music, out_path, args.postroll_seconds_c)
                tag = f"C postroll={args.postroll_seconds_c}s"
            elif style == "C_SHORT":
                stitch_c_short(narration, music, out_path)
                tag = "C-short (30s music)"
            else:
                print(f"  unknown style {style} for pos {pos}")
                continue
            print(f"  fuse  {narration.stem}: {tag}")
        except SystemExit as e:
            print(f"  FAIL  {narration.stem}: {e}")


if __name__ == "__main__":
    main()
