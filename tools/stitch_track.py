"""
Stitch a narration MP3 with a track's music MP3 into a single fusion file.

Two approved styles (calibrated 2026-05-06 spike with Track 17 / Khruangbin):

Style A — sequential
    narration plays clean → music fades in at 30% during last 4s of narration →
    music ramps to 100% over 1s after narration ends → music plays full →
    5.5s fadeout.
    Best for: tracks where you want the narrator's last sentence to land
    cleanly before the song takes over.

Style C — pre-roll + ducked bed + post-roll
    8s music intro at full volume → music ducks to 10% over 1s →
    narration plays over very-soft music bed → music ramps back to 100% over 1s
    after narration → music plays full for `excerpt-seconds` more →
    5.5s fadeout.
    Best for: tracks where the song's intro IS the point (the bass line, the
    drum entry) and you want the listener to hear it before context lands.

Per-track style choice is editorial — record it on the track's exhibit entry.

Usage:
    python3 -m tools.stitch_track \\
        --style A \\
        --narration episodes/audio/spike/06_miss-you__gentleman.mp3 \\
        --music musicos-exhibition/public/audio/06_the-rolling-stones_miss-you.mp3 \\
        --output episodes/audio/06_miss-you__fusion.mp3 \\
        --excerpt-seconds 100

The tool requires the music file to be at least `excerpt-seconds + 5.5` long
(style A) or `8 + 1 + narration_dur + 1 + excerpt-seconds + 5.5` long (style C).
It refuses to silently produce a truncated output.
"""
from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

FADEOUT = 5.5
A_OVERLAP = 4.0          # music starts 4s before narration ends
A_BED_LEVEL = 0.30       # music volume during overlap (under narration tail)
A_RAMP_AFTER = 1.0       # ramp 0.30 → 1.0 over 1s after narration

C_PREROLL = 8.0          # music plays full for 8s before ducking
C_DUCK_RAMP = 1.0        # 1s to duck down (and 1s to ramp back up)
C_DUCK_LEVEL = 0.10      # music volume under narration


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        text=True,
    )
    return float(out.strip())


def stitch_a(narration: Path, music: Path, output: Path, excerpt: float) -> None:
    n_dur = probe_duration(narration)
    needed = excerpt + FADEOUT
    m_dur = probe_duration(music)
    if m_dur < needed:
        raise SystemExit(
            f"music {music.name} is {m_dur:.1f}s; style A needs ≥{needed:.1f}s "
            f"(excerpt {excerpt}s + fadeout {FADEOUT}s)"
        )
    if n_dur < A_OVERLAP:
        raise SystemExit(f"narration {n_dur:.1f}s shorter than overlap {A_OVERLAP}s")
    music_start_ms = int((n_dur - A_OVERLAP) * 1000)
    fadeout_st = excerpt
    music_clip = excerpt + FADEOUT
    # Music timeline (after delay): 0..A_OVERLAP ramp 0→A_BED_LEVEL,
    # A_OVERLAP..A_OVERLAP+A_RAMP_AFTER ramp A_BED_LEVEL→1, then 1.
    vol_expr = (
        f"if(lt(t,{A_OVERLAP}),t/{A_OVERLAP}*{A_BED_LEVEL},"
        f"if(lt(t,{A_OVERLAP + A_RAMP_AFTER}),"
        f"{A_BED_LEVEL}+(t-{A_OVERLAP})*{(1.0 - A_BED_LEVEL) / A_RAMP_AFTER},"
        f"1))"
    )
    filt = (
        f"[1:a]atrim=0:{music_clip},asetpts=PTS-STARTPTS,"
        f"volume='{vol_expr}':eval=frame,"
        f"afade=t=out:st={fadeout_st}:d={FADEOUT},"
        f"adelay={music_start_ms}|{music_start_ms}[m];"
        f"[0:a][m]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0"
    )
    _run(narration, music, filt, output)


def stitch_c(narration: Path, music: Path, output: Path, excerpt: float) -> None:
    n_dur = probe_duration(narration)
    timeline = C_PREROLL + C_DUCK_RAMP + n_dur + C_DUCK_RAMP + excerpt
    needed = timeline + FADEOUT
    m_dur = probe_duration(music)
    if m_dur < needed:
        raise SystemExit(
            f"music {music.name} is {m_dur:.1f}s; style C needs ≥{needed:.1f}s "
            f"(8s preroll + 1s duck + {n_dur:.1f}s narration + 1s ramp + "
            f"{excerpt}s post-roll + {FADEOUT}s fadeout)"
        )
    duck_start = C_PREROLL
    duck_end = C_PREROLL + C_DUCK_RAMP
    rampup_start = duck_end + n_dur
    rampup_end = rampup_start + C_DUCK_RAMP
    duck_drop = 1.0 - C_DUCK_LEVEL
    duck_rise = duck_drop / C_DUCK_RAMP
    vol_expr = (
        f"if(lt(t,{duck_start}),1,"
        f"if(lt(t,{duck_end}),1-(t-{duck_start})*{duck_drop / C_DUCK_RAMP},"
        f"if(lt(t,{rampup_start}),{C_DUCK_LEVEL},"
        f"if(lt(t,{rampup_end}),{C_DUCK_LEVEL}+(t-{rampup_start})*{duck_rise},"
        f"1))))"
    )
    fadeout_st = timeline
    music_clip = timeline + FADEOUT
    narration_delay_ms = int(duck_end * 1000)
    filt = (
        f"[0:a]atrim=0:{music_clip},asetpts=PTS-STARTPTS,"
        f"volume='{vol_expr}':eval=frame,"
        f"afade=t=out:st={fadeout_st}:d={FADEOUT}[m];"
        f"[1:a]adelay={narration_delay_ms}|{narration_delay_ms}[n];"
        f"[m][n]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0"
    )
    # Note: for style C, music is input 0 and narration is input 1 (different from A).
    _run(music, narration, filt, output)


def _run(input0: Path, input1: Path, filt: str, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-i", str(input0),
        "-i", str(input1),
        "-filter_complex", filt,
        "-ac", "2", "-ar", "44100", "-b:a", "192k",
        str(output),
    ]
    subprocess.run(cmd, check=True)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--style", required=True, choices=["A", "C"])
    p.add_argument("--narration", required=True, type=Path)
    p.add_argument("--music", required=True, type=Path)
    p.add_argument("--output", required=True, type=Path)
    p.add_argument("--excerpt-seconds", type=float, default=100.0,
                   help="Style A: total music excerpt length. "
                        "Style C: post-roll length after narration.")
    args = p.parse_args()
    if args.style == "A":
        stitch_a(args.narration, args.music, args.output, args.excerpt_seconds)
    else:
        stitch_c(args.narration, args.music, args.output, args.excerpt_seconds)
    print(f"wrote {args.output}")


if __name__ == "__main__":
    main()
