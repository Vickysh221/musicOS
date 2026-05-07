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
from dataclasses import dataclass
from pathlib import Path

FADEOUT = 5.5
A_OVERLAP = 4.0          # music starts 4s before narration ends
A_BED_LEVEL = 0.30       # music volume during overlap (under narration tail)
A_RAMP_AFTER = 1.0       # ramp 0.30 → 1.0 over 1s after narration

C_PREROLL = 8.0          # music plays full for 8s before ducking
C_DUCK_RAMP = 1.0        # 1s to duck down (and 1s to ramp back up)
C_DUCK_LEVEL = 0.10      # music volume under narration
C_LEAD_IN = 2.0          # seconds before anchor that ramp-up to 100% completes

B_LEAD_IN = 2.0          # ramp-up to 100% completes this many sec before anchor
B_BED_LEVEL = 0.30       # bed volume under narration_a / narration_b
B_INTRO_PAD = 4.0        # 100% music before narration_a starts
B_DUCK_RAMP = 1.0        # ramp-down / ramp-up duration
B_ANCHOR_CLEAN = 30.0    # clean anchor segment at 100%
B_TAIL = 20.0            # post-narration_b 100% tail
B_FADEOUT = 5.5


class OutOfBounds(Exception):
    """Raised when the song cannot fit the requested aligned clip."""


def compute_aligned_music_start(
    anchor_seconds: float,
    n_dur: float,
    music_total: float,
    post_roll: float,
    fadeout: float,
    preroll: float = C_PREROLL,
    duck_ramp: float = C_DUCK_RAMP,
    lead_in: float = C_LEAD_IN,
) -> float:
    """Reverse-compute the in-song second at which a Style C_ALIGNED clip
    should begin so that the post-narration ramp-up to 100% completes
    `lead_in` seconds before `anchor_seconds`.

    Raises OutOfBounds if the song lacks pre-anchor runway or post-anchor
    duration to cover the full clip.
    """
    ramp_up_end_in_song = anchor_seconds - lead_in
    music_start = ramp_up_end_in_song - (preroll + duck_ramp + n_dur + duck_ramp)
    if music_start < 0:
        raise OutOfBounds(
            f"music_start={music_start:.2f}s < 0; "
            f"anchor {anchor_seconds:.1f}s too early for "
            f"narration {n_dur:.1f}s + preroll/duck "
            f"{preroll + 2 * duck_ramp:.1f}s + lead_in {lead_in:.1f}s"
        )
    music_clip = preroll + duck_ramp + n_dur + duck_ramp + post_roll + fadeout
    if music_start + music_clip > music_total:
        raise OutOfBounds(
            f"music_clip end={music_start + music_clip:.1f}s exceeds "
            f"music_total={music_total:.1f}s"
        )
    return music_start


@dataclass(frozen=True)
class BTimings:
    music_start_in_song: float
    first_rampup_end: float
    anchor_clean_start: float
    anchor_clean_end: float
    duck_b_end: float
    narration_b_end: float
    second_rampup_end: float
    tail_end: float
    fadeout_start: float
    total_output: float
    music_clip: float


def compute_b_timings(
    anchor_seconds: float,
    n_dur_a: float,
    n_dur_b: float,
    music_total: float,
    intro_pad: float = B_INTRO_PAD,
    duck_ramp: float = B_DUCK_RAMP,
    anchor_clean: float = B_ANCHOR_CLEAN,
    tail: float = B_TAIL,
    fadeout: float = B_FADEOUT,
    lead_in: float = B_LEAD_IN,
) -> BTimings:
    """Reverse-compute Style B timings; return all checkpoints in
    fusion-output time plus the music_start offset into the source song.

    Raises OutOfBounds when source song cannot fit the required clip.
    """
    first_rampup_end = intro_pad + duck_ramp + n_dur_a + duck_ramp
    anchor_clean_start = first_rampup_end
    anchor_clean_end = anchor_clean_start + anchor_clean
    duck_b_end = anchor_clean_end + duck_ramp
    narration_b_end = duck_b_end + n_dur_b
    second_rampup_end = narration_b_end + duck_ramp
    tail_end = second_rampup_end + tail
    fadeout_start = tail_end
    total_output = tail_end + fadeout

    music_start_in_song = (anchor_seconds - lead_in) - first_rampup_end
    if music_start_in_song < 0:
        raise OutOfBounds(
            f"music_start={music_start_in_song:.2f}s < 0; anchor "
            f"{anchor_seconds:.1f}s too early for narration_a "
            f"{n_dur_a:.1f}s + intro_pad {intro_pad}s + ramps {2 * duck_ramp}s "
            f"+ lead_in {lead_in}s"
        )
    music_clip = total_output
    if music_start_in_song + music_clip > music_total:
        raise OutOfBounds(
            f"music_clip end={music_start_in_song + music_clip:.1f}s "
            f"exceeds music_total={music_total:.1f}s"
        )
    return BTimings(
        music_start_in_song=music_start_in_song,
        first_rampup_end=first_rampup_end,
        anchor_clean_start=anchor_clean_start,
        anchor_clean_end=anchor_clean_end,
        duck_b_end=duck_b_end,
        narration_b_end=narration_b_end,
        second_rampup_end=second_rampup_end,
        tail_end=tail_end,
        fadeout_start=fadeout_start,
        total_output=total_output,
        music_clip=music_clip,
    )


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


def stitch_c_aligned(
    narration: Path,
    music: Path,
    output: Path,
    excerpt: float,
    anchor_seconds: float,
) -> None:
    """Style C with reverse-computed music start so the post-narration
    ramp-up to 100% lands at (anchor_seconds - C_LEAD_IN) in the song."""
    n_dur = probe_duration(narration)
    m_dur = probe_duration(music)
    music_start = compute_aligned_music_start(
        anchor_seconds=anchor_seconds,
        n_dur=n_dur,
        music_total=m_dur,
        post_roll=excerpt,
        fadeout=FADEOUT,
    )
    timeline = C_PREROLL + C_DUCK_RAMP + n_dur + C_DUCK_RAMP + excerpt
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
        f"[0:a]atrim={music_start}:{music_start + music_clip},"
        f"asetpts=PTS-STARTPTS,"
        f"volume='{vol_expr}':eval=frame,"
        f"afade=t=out:st={fadeout_st}:d={FADEOUT}[m];"
        f"[1:a]adelay={narration_delay_ms}|{narration_delay_ms}[n];"
        f"[m][n]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0"
    )
    _run(music, narration, filt, output)


def stitch_b(
    narration_a: Path,
    narration_b: Path,
    music: Path,
    output: Path,
    anchor_seconds: float,
) -> None:
    """Style B (Mode 3): narration_a → clean anchor segment → narration_b.

    Music plays continuously underneath at varying volume; the first
    ramp-to-100% lands at (anchor_seconds - B_LEAD_IN) in the song.
    """
    n_dur_a = probe_duration(narration_a)
    n_dur_b = probe_duration(narration_b)
    m_dur = probe_duration(music)
    t = compute_b_timings(
        anchor_seconds=anchor_seconds,
        n_dur_a=n_dur_a,
        n_dur_b=n_dur_b,
        music_total=m_dur,
    )

    # Volume envelope checkpoints (in fusion-output time)
    duck_a_start = B_INTRO_PAD                              # ramp 1.0 → BED
    duck_a_end   = B_INTRO_PAD + B_DUCK_RAMP
    rampup_a_start = duck_a_end + n_dur_a                   # ramp BED → 1.0
    rampup_a_end = t.first_rampup_end
    # clean anchor: rampup_a_end .. anchor_clean_end @ 1.0
    duck_b_start = t.anchor_clean_end                       # ramp 1.0 → BED
    duck_b_end   = t.duck_b_end
    rampup_b_start = duck_b_end + n_dur_b                   # ramp BED → 1.0
    rampup_b_end = t.second_rampup_end
    # tail: rampup_b_end .. tail_end @ 1.0
    fadeout_st = t.fadeout_start

    drop = (1.0 - B_BED_LEVEL) / B_DUCK_RAMP
    rise = (1.0 - B_BED_LEVEL) / B_DUCK_RAMP
    BED = B_BED_LEVEL

    vol_expr = (
        f"if(lt(t,{duck_a_start}),1,"
        f"if(lt(t,{duck_a_end}),1-(t-{duck_a_start})*{drop},"
        f"if(lt(t,{rampup_a_start}),{BED},"
        f"if(lt(t,{rampup_a_end}),{BED}+(t-{rampup_a_start})*{rise},"
        f"if(lt(t,{duck_b_start}),1,"
        f"if(lt(t,{duck_b_end}),1-(t-{duck_b_start})*{drop},"
        f"if(lt(t,{rampup_b_start}),{BED},"
        f"if(lt(t,{rampup_b_end}),{BED}+(t-{rampup_b_start})*{rise},"
        f"1))))))))"
    )

    delay_a_ms = int(duck_a_end * 1000)              # narration_a starts here
    delay_b_ms = int(duck_b_end * 1000)              # narration_b starts here

    filt = (
        f"[0:a]atrim={t.music_start_in_song}:{t.music_start_in_song + t.music_clip},"
        f"asetpts=PTS-STARTPTS,"
        f"volume='{vol_expr}':eval=frame,"
        f"afade=t=out:st={fadeout_st}:d={B_FADEOUT}[m];"
        f"[1:a]adelay={delay_a_ms}|{delay_a_ms}[na];"
        f"[2:a]adelay={delay_b_ms}|{delay_b_ms}[nb];"
        f"[m][na][nb]amix=inputs=3:duration=longest:dropout_transition=0:normalize=0"
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        "ffmpeg", "-y",
        "-i", str(music),
        "-i", str(narration_a),
        "-i", str(narration_b),
        "-filter_complex", filt,
        "-ac", "2", "-ar", "44100", "-b:a", "192k",
        str(output),
    ], check=True)


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
