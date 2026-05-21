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
    stitch_a, stitch_c, stitch_c_aligned, stitch_b, probe_duration,
    FADEOUT, MUSIC_FADE_IN, A_OVERLAP, A_BED_LEVEL, A_RAMP_AFTER,
    C_DUCK_LEVEL, C_PREROLL, C_DUCK_RAMP,
    B_INTRO_PAD, B_DUCK_RAMP, B_ANCHOR_CLEAN, B_LEAD_IN,
    compute_b_timings, OutOfBounds,
)

ROOT = Path(__file__).resolve().parent.parent

# Style assignment: position → 'A' | 'C' | 'C_SHORT' | 'PASSTHROUGH'

# Episode 1 — Miss You · Bassline DNA (calibrated 2026-05-06; ACTIVE for ep1 re-fusion 2026-05-21)
STYLE_BY_POSITION: dict[int, str] = {
    0: "PASSTHROUGH",
    1: "C",   # JB anchor — bass intro should land first
    2: "C",   # Family Affair — needs preroll for groove
    3: "C",
    4: "C",   # Give Up the Funk — preroll for P-Funk entry
    5: "C",   # Stayin' Alive — preroll for the famous intro
    6: "C",   # Miss You anchor, 622-char narration
    7: "A",
    8: "C_SHORT",  # muted, 30s music only
    9: "C",
    10: "C",  # Isolation — preroll for the bassline
    11: "C",
    12: "C",  # Another One Bites the Dust — preroll for that bassline
    13: "A",
    14: "A",
    15: "A",
    16: "A",
    17: "C",
    18: "A",
    19: "PASSTHROUGH",
    20: "PASSTHROUGH",
}

# Episode 5 — Cloudyな午後 · translation_aesthetic (2026-05-10)
# EN narrations all 600-1684ch → C for all tracks; opening/closing → PASSTHROUGH
# STYLE_BY_POSITION_EP5: dict[int, str] = {
#     0:  "PASSTHROUGH",   # opening
#     1:  "C",   # James Taylor — 646ch EN
#     2:  "C",   # Carole King — 793ch EN (pillar)
#     3:  "C",   # Boz Scaggs — 695ch EN (pillar)
#     4:  "C",   # Steely Dan — 794ch EN (pillar)
#     5:  "C",   # Toto — 627ch EN
#     6:  "C",   # 大瀧詠一 — 711ch EN
#     7:  "C",   # 山下達郎 — 815ch EN (pillar)
#     8:  "C",   # 竹内まりや — 822ch EN (pillar)
#     9:  "C",   # 角松敏生 — 814ch EN
#     10: "C",   # 稲垣潤一 — 730ch EN
#     11: "C",   # ラ・ムー — 689ch EN
#     12: "C",   # 杏里 — 739ch EN
#     13: "C",   # 濱田金吾 — 749ch EN
#     14: "C",   # 中原めいこ Fantasy — 770ch EN
#     15: "C",   # 中原めいこ Cloudyな午後 — ANCHOR 1684ch EN
#     16: "C",   # Ginger Root — 660ch EN
#     17: "C",   # RYUSENKEI — 600ch EN
#     18: "PASSTHROUGH",   # closing
# }

# Episode 6 — Ramsey Lewis Trio · The 'In' Crowd · translation_aesthetic (2026-05-18)
# ZH narrations 313-845ch → C for all tracks; opening/closing → PASSTHROUGH
# STYLE_BY_POSITION_EP6: dict[int, str] = {
_STYLE_BY_POSITION_EP6: dict[int, str] = {
    0:  "PASSTHROUGH",   # opening (397ch)
    1:  "C",   # Erroll Garner — Misty (314ch)
    2:  "C",   # Ahmad Jamal — Poinciana (449ch, pillar)
    3:  "C",   # Herbie Hancock — Cantaloupe Island (332ch)
    4:  "C",   # The Animals — House of the Rising Sun (325ch)
    5:  "C",   # Dobie Gray — The In Crowd (455ch, pillar)
    6:  "C",   # Ramsey Lewis Trio — The 'In' Crowd — ANCHOR (845ch)
    7:  "C",   # Mamas & Papas — The 'In' Crowd (464ch, pillar)
    8:  "C",   # Georgie Fame — Yeh Yeh (486ch, pillar)
    9:  "C",   # Ramsey Lewis — Hang On Sloopy (337ch)
    10: "C",   # Ramsey Lewis — Wade in the Water (326ch)
    11: "C",   # Cannonball Adderley — Mercy Mercy Mercy (335ch)
    12: "C",   # Young-Holt Unlimited — Soulful Strut (334ch)
    13: "C",   # Driscoll/Auger — Wheels on Fire (334ch)
    14: "C",   # Ramsey Lewis — Sun Goddess (321ch)
    15: "C",   # James Taylor Quartet — Mission Impossible (339ch)
    16: "C",   # Brand New Heavies — Never Stop (340ch)
    17: "C",   # Us3 — Cantaloop (458ch, pillar)
    18: "C",   # Jamiroquai — Too Young to Die (313ch)
    19: "PASSTHROUGH",   # closing (162ch)
}


# Style → narration start offset in the fusion-output timeline (seconds).
# Mirrors the adelay values in stitch_track.py — keep in sync with that file.
NARRATION_OFFSET_BY_STYLE: dict[str, float] = {
    "A": 0.0,
    "C": C_PREROLL + C_DUCK_RAMP,
    "C_ALIGNED": C_PREROLL + C_DUCK_RAMP,
    "C_SHORT": 3.5 + 0.5,        # stitch_c_short preroll + duck_ramp
    "PASSTHROUGH": 0.0,
}


def _normalize_segments(raw: list) -> list[dict]:
    """MiniMax subtitle segments → list of {text, start, end} in *seconds*.
    Tolerates both ms (`time_begin`/`time_end`) and seconds keys."""
    out: list[dict] = []
    for seg in raw or []:
        if "time_begin" in seg or "time_end" in seg:
            start = float(seg.get("time_begin", 0)) / 1000.0
            end = float(seg.get("time_end", 0)) / 1000.0
        else:
            start = float(seg.get("start", 0))
            end = float(seg.get("end", 0))
        out.append({"text": seg.get("text", ""), "start": start, "end": end})
    return out


def _shifted(segments: list[dict], offset: float) -> list[dict]:
    return [{"text": s["text"], "start": s["start"] + offset, "end": s["end"] + offset}
            for s in segments]


def compute_b_offsets_no_music(anchor_seconds: float, n_dur_a: float):
    """Compute the two narration offsets needed for Style B subtitle alignment
    without requiring access to the source music file. The bounds-check arms of
    compute_b_timings depend on music_total, but the offsets we need
    (a_offset, b_offset) are purely a function of n_dur_a and the style
    constants. Returns (a_offset, b_offset) in fusion-timeline seconds.
    """
    a_offset = B_INTRO_PAD + B_DUCK_RAMP
    first_rampup_end = B_INTRO_PAD + B_DUCK_RAMP + n_dur_a + B_DUCK_RAMP
    anchor_clean_end = first_rampup_end + B_ANCHOR_CLEAN
    b_offset = anchor_clean_end + B_DUCK_RAMP  # == duck_b_end
    return a_offset, b_offset


def write_fusion_subtitle(
    style: str,
    narration: Path | None,
    out_path: Path,
    *,
    narration_a: Path | None = None,
    narration_b: Path | None = None,
    b_timings=None,
) -> Path | None:
    """If a narration subtitle sidecar exists, emit a fusion-aligned subtitle
    JSON next to the fusion mp3. Returns the written path, or None if no
    sidecar was found (fusion still succeeds; UI falls back to estimation).
    """
    sub_out = out_path.with_suffix(".subtitle.json")
    if style == "B":
        if not narration_a or not narration_b or b_timings is None:
            return None
        a_path = narration_a.with_suffix(".subtitle.json")
        b_path = narration_b.with_suffix(".subtitle.json")
        if not a_path.exists() or not b_path.exists():
            return None
        a_segs = _normalize_segments(json.loads(a_path.read_text(encoding="utf-8")))
        b_segs = _normalize_segments(json.loads(b_path.read_text(encoding="utf-8")))
        # narration_a starts at duck_a_end; narration_b starts at b_timings.duck_b_end.
        a_offset = B_INTRO_PAD + B_DUCK_RAMP
        b_offset = b_timings.duck_b_end
        merged = _shifted(a_segs, a_offset) + _shifted(b_segs, b_offset)
        sub_out.write_text(json.dumps(merged, ensure_ascii=False, indent=2),
                           encoding="utf-8")
        return sub_out

    if not narration:
        return None
    sidecar = narration.with_suffix(".subtitle.json")
    if not sidecar.exists():
        return None
    offset = NARRATION_OFFSET_BY_STYLE.get(style)
    if offset is None:
        return None
    segs = _normalize_segments(json.loads(sidecar.read_text(encoding="utf-8")))
    sub_out.write_text(
        json.dumps(_shifted(segs, offset), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return sub_out


def resolve_style(exhibit: dict, fallback: dict[int, str]) -> str | None:
    """Pick fusion style: exhibit['fusion_style'] wins; else fallback dict."""
    style = exhibit.get("fusion_style")
    if style:
        return style
    return fallback.get(exhibit["position"])


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
        f"afade=t=in:st=0:d={MUSIC_FADE_IN},"
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


def find_match(directory: Path, prefix: str, suffix: str = "", exact_stem: str | None = None) -> Path | None:
    """Find first `<prefix>*<suffix>.mp3`. With empty suffix, skip split-narration `_a`/`_b` files (Style B fetches them explicitly).
    If exact_stem is given, look for <directory>/<exact_stem>.mp3 directly."""
    if exact_stem:
        p = directory / f"{exact_stem}.mp3"
        return p if p.exists() else None
    pattern = f"{prefix}*{suffix}.mp3" if suffix else f"{prefix}*.mp3"
    matches = sorted(directory.glob(pattern))
    for f in matches:
        if not suffix and (f.stem.endswith("_a") or f.stem.endswith("_b")):
            continue
        return f
    return None


def emit_subtitles_only(ep: dict, args) -> None:
    """Walk every exhibit, find the existing fusion mp3 in --output-dir, and
    write a `<stem>.subtitle.json` next to it by shifting the narration sidecar
    by the per-style fusion offset. Skips silently when sidecars are missing.
    """
    out_dir = args.output_dir
    fusion_files = {p.stem: p for p in out_dir.glob("*.mp3")}
    if not fusion_files:
        print(f"  no fusion mp3s found in {out_dir}; nothing to subtitle")
        return

    for ex in ep["exhibits"]:
        pos = ex["position"]
        if args.only_position and pos not in args.only_position:
            continue
        style = resolve_style(ex, STYLE_BY_POSITION)
        if style is None:
            print(f"  skip {pos}: no style assigned")
            continue

        prefix = f"{pos:02d}_"
        # Locate the existing fusion mp3 by prefix (skipping split-narration `_a`/`_b`).
        fusion = None
        for stem in sorted(fusion_files):
            if stem.startswith(prefix) and not stem.endswith(("_a", "_b")):
                fusion = fusion_files[stem]
                break
        if not fusion:
            print(f"  skip {pos}: no fusion mp3 in {out_dir} matching {prefix}*")
            continue

        sub_out = fusion.with_suffix(".subtitle.json")
        if sub_out.exists() and not args.force:
            print(f"  skip {fusion.stem}: subtitle already exists")
            continue

        if style == "B":
            anchor = ex.get("anchor_timestamp_seconds")
            if anchor is None:
                print(f"  FAIL  pos {pos}: style B requires anchor_timestamp_seconds")
                continue
            nar_a = find_match(args.narration_dir, prefix, suffix="_a")
            nar_b = find_match(args.narration_dir, prefix, suffix="_b")
            if not nar_a or not nar_b:
                print(f"  skip {pos}: style B needs {prefix}*_a.mp3 and {prefix}*_b.mp3")
                continue
            sub_a = nar_a.with_suffix(".subtitle.json")
            sub_b = nar_b.with_suffix(".subtitle.json")
            if not sub_a.exists() or not sub_b.exists():
                print(f"  skip {pos}: missing narration subtitle sidecars ({sub_a.name} / {sub_b.name})")
                continue
            n_dur_a = probe_duration(nar_a)
            a_off, b_off = compute_b_offsets_no_music(float(anchor), n_dur_a)
            a_segs = _normalize_segments(json.loads(sub_a.read_text(encoding="utf-8")))
            b_segs = _normalize_segments(json.loads(sub_b.read_text(encoding="utf-8")))
            merged = _shifted(a_segs, a_off) + _shifted(b_segs, b_off)
            sub_out.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"  sub   {fusion.stem}: B (a@{a_off:.1f}s, b@{b_off:.1f}s) → {sub_out.name}")
            continue

        # PASSTHROUGH / A / C / C_ALIGNED / C_SHORT — single narration file.
        if style == "PASSTHROUGH":
            nar_stem = ex.get("narration_stem") or fusion.stem
        else:
            nar_stem = ex.get("narration_stem") or fusion.stem
        narration = find_match(args.narration_dir, prefix, exact_stem=nar_stem)
        if not narration:
            print(f"  skip {pos}: no narration mp3 '{nar_stem}.mp3'")
            continue
        sidecar = narration.with_suffix(".subtitle.json")
        if not sidecar.exists():
            print(f"  skip {pos}: narration subtitle sidecar missing ({sidecar.name})")
            continue
        offset = NARRATION_OFFSET_BY_STYLE.get(style)
        if offset is None:
            print(f"  skip {pos}: no offset known for style {style}")
            continue
        segs = _normalize_segments(json.loads(sidecar.read_text(encoding="utf-8")))
        sub_out.write_text(
            json.dumps(_shifted(segs, offset), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"  sub   {fusion.stem}: {style} (offset {offset:.1f}s) → {sub_out.name}")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--episode", required=True, type=Path)
    p.add_argument("--narration-dir", required=True, type=Path)
    p.add_argument("--music-dir", required=True, type=Path)
    p.add_argument("--output-dir", required=True, type=Path)
    p.add_argument("--excerpt-seconds-a", type=float, default=100.0)
    p.add_argument("--postroll-seconds-c", type=float, default=60.0)
    p.add_argument("--force", action="store_true")
    p.add_argument("--only-position", type=int, action="append", default=[],
                   help="only fuse this exhibit position; repeatable")
    p.add_argument("--subtitle-only", action="store_true",
                   help="don't re-fuse audio; only emit fusion-aligned subtitle JSON next to "
                        "existing fusion mp3s. Useful for retrofitting subtitle sidecars onto "
                        "episodes whose narration was synthesized before subtitle support landed. "
                        "Requires narration .subtitle.json sidecars in --narration-dir; source "
                        "music files are NOT required (B-style offsets are computed from "
                        "narration durations alone).")
    args = p.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    ep = json.loads(args.episode.read_text(encoding="utf-8"))

    if args.subtitle_only:
        emit_subtitles_only(ep, args)
        return

    for ex in ep["exhibits"]:
        pos = ex["position"]
        if args.only_position and pos not in args.only_position:
            continue
        style = resolve_style(ex, STYLE_BY_POSITION)
        if style is None:
            print(f"  skip {pos}: no style assigned")
            continue

        prefix = f"{pos:02d}_"

        music_match = find_match(args.music_dir, prefix)

        if style == "PASSTHROUGH":
            # No music: use the narration filename as-is (e.g. `00_opening.mp3`).
            narration = find_match(args.narration_dir, prefix, exact_stem=ex.get("narration_stem"))
            if not narration:
                print(f"  skip {pos}: no narration mp3 matching {prefix}*")
                continue
            out_path = args.output_dir / narration.name
            if out_path.exists() and not args.force:
                print(f"  skip {narration.stem}: already exists")
                continue
            shutil.copy2(narration, out_path)
            print(f"  copy  {narration.stem}: passthrough (no music)")
            sub_written = write_fusion_subtitle("PASSTHROUGH", narration, out_path)
            if sub_written:
                print(f"        + {sub_written.name}")
            continue

        # Music-bearing styles: stem follows the music filename for downstream wiring.
        out_stem = music_match.stem if music_match else f"{pos:02d}_track"
        out_path = args.output_dir / f"{out_stem}.mp3"
        if out_path.exists() and not args.force:
            print(f"  skip {out_stem}: already exists")
            continue

        if not music_match:
            print(f"  skip {pos}: no music mp3 matching {prefix}*")
            continue
        music = music_match

        if style != "B":
            # Derive narration stem from exhibit field or music filename (same
            # naming convention as batch_synthesize_episode) so we never pick
            # a stem from a different episode that happens to share the NN_ prefix.
            nar_stem = ex.get("narration_stem") or music_match.stem
            narration = find_match(args.narration_dir, prefix, exact_stem=nar_stem)
            if not narration:
                print(f"  skip {pos}: no narration mp3 '{nar_stem}.mp3'")
                continue

        try:
            if style == "A":
                stitch_a(narration, music, out_path, args.excerpt_seconds_a)
                tag = f"A excerpt={args.excerpt_seconds_a}s"
            elif style == "C":
                stitch_c(narration, music, out_path, args.postroll_seconds_c)
                tag = f"C postroll={args.postroll_seconds_c}s"
            elif style == "C_ALIGNED":
                anchor = ex.get("anchor_timestamp_seconds")
                if anchor is None:
                    stitch_c(narration, music, out_path, args.postroll_seconds_c)
                    tag = f"C (no-anchor fallback) postroll={args.postroll_seconds_c}s"
                else:
                    stitch_c_aligned(narration, music, out_path,
                                     excerpt=args.postroll_seconds_c,
                                     anchor_seconds=float(anchor))
                    tag = f"C_ALIGNED anchor={anchor}s postroll={args.postroll_seconds_c}s"
            elif style == "B":
                anchor = ex.get("anchor_timestamp_seconds")
                if anchor is None:
                    print(f"  FAIL  pos {pos}: style B requires anchor_timestamp_seconds")
                    continue
                nar_a = find_match(args.narration_dir, prefix, suffix="_a")
                nar_b = find_match(args.narration_dir, prefix, suffix="_b")
                if not nar_a or not nar_b:
                    print(f"  FAIL  pos {pos}: style B needs {prefix}*_a.mp3 and {prefix}*_b.mp3")
                    continue
                stitch_b(nar_a, nar_b, music, out_path, anchor_seconds=float(anchor))
                tag = f"B anchor={anchor}s"
            elif style == "C_SHORT":
                stitch_c_short(narration, music, out_path)
                tag = "C-short (30s music)"
            else:
                print(f"  unknown style {style} for pos {pos}")
                continue
            print(f"  fuse  {out_stem}: {tag}")

            if style == "B":
                b_t = compute_b_timings(
                    anchor_seconds=float(anchor),
                    n_dur_a=probe_duration(nar_a),
                    n_dur_b=probe_duration(nar_b),
                    music_total=probe_duration(music),
                )
                sub_written = write_fusion_subtitle(
                    style, None, out_path,
                    narration_a=nar_a, narration_b=nar_b, b_timings=b_t,
                )
            else:
                sub_written = write_fusion_subtitle(style, narration, out_path)
            if sub_written:
                print(f"        + {sub_written.name}")
        except (SystemExit, OutOfBounds) as e:
            print(f"  FAIL  {out_stem}: {e}")


if __name__ == "__main__":
    main()
