# Anchor-Aligned Fusion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reverse-compute music start position so the moment fusion music ramps to 100% lands on the in-song anchor named by the narration; add a Mode 3 (说—唱—说) fusion style for pillar tracks.

**Architecture:** Two new ffmpeg stitching styles in `tools/stitch_track.py`: `stitch_c_aligned` (C with anchor-driven `atrim` start) and `stitch_b` (narration_a → clean anchor segment → narration_b). Per-track `fusion_style` and `anchor_timestamp_seconds` move into `episodes/<slug>.episode.json`. `batch_fusion.py` becomes JSON-driven; `batch_synthesize_episode.py` learns to emit `_a.mp3` / `_b.mp3` for split-narration pillars. Pure timing math is unit-tested; ffmpeg integration is smoke-tested on real fixtures.

**Tech Stack:** Python 3, pytest, ffmpeg/ffprobe, MiniMax TTS API.

**Spec:** `docs/superpowers/specs/2026-05-07-anchor-aligned-fusion-design.md`

---

## File Structure

**Modified:**
- `tools/stitch_track.py` — add constants, `compute_aligned_music_start()`, `compute_b_timings()`, `stitch_c_aligned()`, `stitch_b()`. Existing `stitch_a` / `stitch_c` unchanged.
- `tools/batch_fusion.py` — read `fusion_style` and `anchor_timestamp_seconds` from JSON; new dispatch arms for `B` and `C_ALIGNED`; keep `STYLE_BY_POSITION` as fallback.
- `tools/batch_synthesize_episode.py` — when an exhibit has `transcript_zh_a`/`_b`, synth two mp3s with `_a` / `_b` suffix.
- `episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json` — add `fusion_style` + `anchor_timestamp_seconds` to every track exhibit; pillars 1/2/6/10 also get `transcript_zh_a` / `transcript_zh_b` (and `transcript_zh: null`).
- `docs/episode_audio_pipeline.md` — append Style B + C_ALIGNED section in Step 4.

**New:**
- `tests/test_stitch_track_timings.py` — pure-function tests for the new timing helpers.
- `tests/test_batch_fusion_style_resolution.py` — JSON-driven style lookup with fallback.

---

## Task 1: Pure timing helper for C_ALIGNED

**Files:**
- Modify: `tools/stitch_track.py` (add helper at module top, after constants)
- Create: `tests/test_stitch_track_timings.py`

**Background:** Style C plays `preroll(8) → duck_down(1) → narration(n_dur) → duck_up(1) → post(60) → fadeout(5.5)`. To make ramp-up land at `anchor − LEAD_IN`, music must start at `anchor − LEAD_IN − (preroll + duck_down + n_dur + duck_up)` seconds into the song.

- [ ] **Step 1.1: Write the failing test**

```python
# tests/test_stitch_track_timings.py
"""Tests for the pure timing helpers in tools/stitch_track.py."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from tools.stitch_track import (  # noqa: E402
    compute_aligned_music_start,
    OutOfBounds,
    C_PREROLL, C_DUCK_RAMP, C_LEAD_IN,
)


def test_aligned_music_start_basic():
    # Estranged: anchor 452s, narration 60s
    # ramp_up_end = 452 - 2 = 450
    # music_start = 450 - (8 + 1 + 60 + 1) = 380
    start = compute_aligned_music_start(
        anchor_seconds=452.0,
        n_dur=60.0,
        music_total=563.0,
        post_roll=60.0,
        fadeout=5.5,
    )
    assert start == pytest.approx(380.0, abs=0.01)


def test_aligned_music_start_lead_in_default_2s():
    # Anchor 100, narration 30s → ramp_end = 98 → start = 98 - (8+1+30+1) = 58
    assert compute_aligned_music_start(
        anchor_seconds=100.0, n_dur=30.0,
        music_total=300.0, post_roll=60.0, fadeout=5.5,
    ) == pytest.approx(58.0, abs=0.01)


def test_aligned_music_start_underflow_raises():
    # Narration too long for the song's pre-anchor runway
    with pytest.raises(OutOfBounds, match="music_start.*<.*0"):
        compute_aligned_music_start(
            anchor_seconds=20.0, n_dur=60.0,
            music_total=300.0, post_roll=60.0, fadeout=5.5,
        )


def test_aligned_music_start_overflow_raises():
    # Song too short to cover required clip
    with pytest.raises(OutOfBounds, match="music_clip.*exceeds"):
        compute_aligned_music_start(
            anchor_seconds=200.0, n_dur=10.0,
            music_total=210.0, post_roll=60.0, fadeout=5.5,
        )
```

- [ ] **Step 1.2: Run test, verify failure**

Run: `cd /Users/vickyshou/Documents/MusicOS && python3 -m pytest tests/test_stitch_track_timings.py -v`
Expected: ImportError on `compute_aligned_music_start`, `OutOfBounds`, `C_LEAD_IN`.

- [ ] **Step 1.3: Add helper + custom exception to `tools/stitch_track.py`**

In `tools/stitch_track.py`, after the existing constants (`C_DUCK_LEVEL = 0.10` line), add:

```python
C_LEAD_IN = 2.0          # seconds before anchor that ramp-up to 100% completes


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
```

- [ ] **Step 1.4: Run test, verify pass**

Run: `cd /Users/vickyshou/Documents/MusicOS && python3 -m pytest tests/test_stitch_track_timings.py -v`
Expected: 4 passed.

- [ ] **Step 1.5: Commit**

```bash
git add tools/stitch_track.py tests/test_stitch_track_timings.py
git commit -m "feat(stitch): add compute_aligned_music_start helper for C_ALIGNED"
```

---

## Task 2: `stitch_c_aligned()` ffmpeg wrapper

**Files:**
- Modify: `tools/stitch_track.py`

**Background:** Same ffmpeg filter as `stitch_c`, but `atrim` starts at `music_start` rather than 0.

- [ ] **Step 2.1: Implement `stitch_c_aligned()` in `tools/stitch_track.py`**

Add after `stitch_c`:

```python
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
```

- [ ] **Step 2.2: Smoke test against an episode-2 source**

Run:

```bash
cd /Users/vickyshou/Documents/MusicOS
python3 -c "
from pathlib import Path
from tools.stitch_track import stitch_c_aligned
nar = Path('episodes/audio/narration/03_led-zeppelin_stairway-to-heaven.mp3')
mus = Path('musicos-exhibition/public/audio/03_led-zeppelin_stairway-to-heaven.mp3')
out = Path('/tmp/03_stairway_aligned_smoke.mp3')
stitch_c_aligned(nar, mus, out, excerpt=60.0, anchor_seconds=336.0)
print('wrote', out)
"
ffprobe -v error -show_entries format=duration -of csv=p=0 /tmp/03_stairway_aligned_smoke.mp3
```

Expected: `wrote /tmp/03_stairway_aligned_smoke.mp3`, duration > 100s, no ffmpeg errors.

If narration mp3 is missing, skip this smoke step — Task 5 will regenerate.

- [ ] **Step 2.3: Commit**

```bash
git add tools/stitch_track.py
git commit -m "feat(stitch): add stitch_c_aligned style wrapper"
```

---

## Task 3: Pure timing helper for Style B

**Files:**
- Modify: `tools/stitch_track.py`
- Modify: `tests/test_stitch_track_timings.py`

**Background:** Style B time line:
```
narration_a (n_dur_a) on bed @ B_BED_LEVEL
  → ramp-up 1s ending at (anchor - B_LEAD_IN)
  → B_ANCHOR_CLEAN (30s) at 100%
  → duck-down 1s
  → narration_b (n_dur_b) on bed @ B_BED_LEVEL
  → ramp-up 1s
  → B_TAIL (20s) at 100%
  → B_FADEOUT (5.5s)
```
Music intro pad (`B_INTRO_PAD = 4s`) plays at 100% before narration_a starts.

`music_start_in_song = anchor - B_LEAD_IN - (B_INTRO_PAD + 1s ramp_down + n_dur_a + 1s ramp_up)`

Wait — re-derive carefully. The first ramp-up reaches 100% at `anchor - B_LEAD_IN`. Before that, working backwards in the timeline:
1. ramp-up duration = 1s
2. narration_a duration = n_dur_a
3. ramp-down (start of narration_a) = 1s
4. intro pad at 100% = `B_INTRO_PAD`

So music plays from `t=0` to `t=B_INTRO_PAD` at 100%, then `t=B_INTRO_PAD..B_INTRO_PAD+1` ramps to 30%, `t=B_INTRO_PAD+1..B_INTRO_PAD+1+n_dur_a` is narration_a on bed, `t=B_INTRO_PAD+1+n_dur_a..B_INTRO_PAD+2+n_dur_a` ramps to 100%, then `t=B_INTRO_PAD+2+n_dur_a..B_INTRO_PAD+2+n_dur_a+B_ANCHOR_CLEAN` is the clean anchor.

For ramp-up end (in fusion-output time) `T1 = B_INTRO_PAD + 2 + n_dur_a`. The song position at `T1` should be `anchor - B_LEAD_IN`. Therefore `music_start_in_song = (anchor - B_LEAD_IN) - T1`.

- [ ] **Step 3.1: Add tests**

Append to `tests/test_stitch_track_timings.py`:

```python
from tools.stitch_track import (  # noqa: E402
    compute_b_timings,
    BTimings,
    B_LEAD_IN, B_BED_LEVEL, B_ANCHOR_CLEAN, B_TAIL, B_FADEOUT,
    B_INTRO_PAD, B_DUCK_RAMP,
)


def test_b_timings_basic():
    # Estranged: anchor=452, n_dur_a=40, n_dur_b=40, m_dur=563
    # T1 (first ramp-up end) = 4 + 1 + 40 + 1 = 46s into output
    # music_start = (452 - 2) - 46 = 404
    # output_total = 4 + 1 + 40 + 1 + 30 + 1 + 40 + 1 + 20 + 5.5 = 143.5
    t = compute_b_timings(
        anchor_seconds=452.0,
        n_dur_a=40.0,
        n_dur_b=40.0,
        music_total=563.0,
    )
    assert t.music_start_in_song == pytest.approx(404.0, abs=0.01)
    assert t.first_rampup_end == pytest.approx(46.0, abs=0.01)
    assert t.anchor_clean_start == pytest.approx(46.0, abs=0.01)
    assert t.anchor_clean_end == pytest.approx(76.0, abs=0.01)
    assert t.duck_b_end == pytest.approx(77.0, abs=0.01)
    assert t.narration_b_end == pytest.approx(117.0, abs=0.01)
    assert t.second_rampup_end == pytest.approx(118.0, abs=0.01)
    assert t.tail_end == pytest.approx(138.0, abs=0.01)
    assert t.fadeout_start == pytest.approx(138.0, abs=0.01)
    assert t.total_output == pytest.approx(143.5, abs=0.01)
    assert t.music_clip == pytest.approx(143.5, abs=0.01)


def test_b_timings_underflow_raises():
    with pytest.raises(OutOfBounds, match="music_start"):
        compute_b_timings(
            anchor_seconds=20.0,
            n_dur_a=40.0,
            n_dur_b=40.0,
            music_total=600.0,
        )


def test_b_timings_overflow_raises():
    # Song just barely too short for the clip
    with pytest.raises(OutOfBounds, match="music_clip"):
        compute_b_timings(
            anchor_seconds=100.0,
            n_dur_a=10.0,
            n_dur_b=10.0,
            music_total=140.0,
        )
```

- [ ] **Step 3.2: Run test, verify failure**

Run: `python3 -m pytest tests/test_stitch_track_timings.py -v`
Expected: ImportError on `compute_b_timings`, `BTimings`, etc.

- [ ] **Step 3.3: Implement `compute_b_timings()` and constants in `tools/stitch_track.py`**

Add after `C_LEAD_IN`:

```python
B_LEAD_IN = 2.0          # ramp-up to 100% completes this many sec before anchor
B_BED_LEVEL = 0.30       # bed volume under narration_a / narration_b
B_INTRO_PAD = 4.0        # 100% music before narration_a starts
B_DUCK_RAMP = 1.0        # ramp-down / ramp-up duration
B_ANCHOR_CLEAN = 30.0    # clean anchor segment at 100%
B_TAIL = 20.0            # post-narration_b 100% tail
B_FADEOUT = 5.5
```

And after `compute_aligned_music_start`:

```python
from dataclasses import dataclass


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
```

- [ ] **Step 3.4: Run test, verify pass**

Run: `python3 -m pytest tests/test_stitch_track_timings.py -v`
Expected: 7 passed.

- [ ] **Step 3.5: Commit**

```bash
git add tools/stitch_track.py tests/test_stitch_track_timings.py
git commit -m "feat(stitch): add compute_b_timings for Mode 3 fusion"
```

---

## Task 4: `stitch_b()` ffmpeg wrapper

**Files:**
- Modify: `tools/stitch_track.py`

**Background:** Two narration inputs + one music input. Music volume envelope follows the BTimings checkpoints. Narrations are delayed via `adelay`: narration_a starts at `intro_pad + duck_ramp`, narration_b starts at `anchor_clean_end + duck_ramp`.

- [ ] **Step 4.1: Implement `stitch_b()` in `tools/stitch_track.py`**

Add after `stitch_c_aligned`:

```python
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
```

- [ ] **Step 4.2: Commit**

```bash
git add tools/stitch_track.py
git commit -m "feat(stitch): add stitch_b for Mode 3 (说—唱—说) fusion"
```

---

## Task 5: `batch_synthesize_episode.py` — split-narration support

**Files:**
- Modify: `tools/batch_synthesize_episode.py`

**Background:** When an exhibit has both `transcript_zh_a` and `transcript_zh_b` (and `transcript_zh: null`), emit two mp3s: `<stem>_a.mp3` and `<stem>_b.mp3`. Skip `transcript_zh` if null. Otherwise behavior is unchanged.

- [ ] **Step 5.1: Modify `text_for()` to return a list of (text, field, suffix) tuples**

Replace the existing `text_for(exhibit)` function in `tools/batch_synthesize_episode.py` with:

```python
def text_for(exhibit: dict) -> list[tuple[str, str, str]]:
    """Return list of (text, source_field, suffix) for this exhibit.

    suffix is '' for the single-mp3 case, or '_a' / '_b' for split pillars.
    """
    if exhibit.get("muted_this_episode"):
        text = exhibit.get("bridge_narration_zh")
        return [(text, "bridge_narration_zh", "")] if text else []

    parts: list[tuple[str, str, str]] = []
    text_a = exhibit.get("transcript_zh_a")
    text_b = exhibit.get("transcript_zh_b")
    if text_a and text_b:
        parts.append((text_a, "transcript_zh_a", "_a"))
        parts.append((text_b, "transcript_zh_b", "_b"))
        return parts

    text = exhibit.get("transcript_zh")
    return [(text, "transcript_zh", "")] if text else []
```

- [ ] **Step 5.2: Update `main()` loop to iterate parts**

Replace the inner exhibit loop body (the section starting `text_pair = text_for(ex)` through the `with log_path.open(...)` block) with:

```python
        parts = text_for(ex)
        if not parts:
            print(f"  skip {pos:02d} {kind}: no narration text")
            continue
        stem = output_stem(ex)

        for text, source_field, suffix in parts:
            out_path = args.output_dir / f"{stem}{suffix}.mp3"

            if out_path.exists() and not args.force:
                print(f"  skip {stem}{suffix}: already exists")
                total_skipped += 1
                continue

            print(f"  synth {stem}{suffix}: {len(text)} chars from {source_field}")
            audio, meta = synthesize(
                text, args.voice, api_key, group_id or "", model=args.model
            )
            out_path.write_bytes(audio)

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
```

- [ ] **Step 5.3: Smoke test on episode 1 (regression)**

Run: `cd /Users/vickyshou/Documents/MusicOS && python3 -m tools.batch_synthesize_episode --episode episodes/rolling-stones_some-girls_miss-you.episode.json --voice 'Chinese (Mandarin)_Gentleman' --output-dir episodes/audio/narration`
Expected: every line is `skip <stem>: already exists`. Zero new synthesis.

- [ ] **Step 5.4: Commit**

```bash
git add tools/batch_synthesize_episode.py
git commit -m "feat(synth): emit _a/_b narration mp3s for split-pillar exhibits"
```

---

## Task 6: `batch_fusion.py` — JSON-driven style + new dispatch arms

**Files:**
- Modify: `tools/batch_fusion.py`
- Create: `tests/test_batch_fusion_style_resolution.py`

**Background:** `fusion_style` now lives on each exhibit. `STYLE_BY_POSITION` becomes a fallback for episodes that haven't migrated. Also add new dispatch arms for `B` and `C_ALIGNED`.

- [ ] **Step 6.1: Write the failing test**

```python
# tests/test_batch_fusion_style_resolution.py
"""Tests for fusion_style resolution: prefer exhibit field, fall back to dict."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from tools.batch_fusion import resolve_style  # noqa: E402


def test_resolve_style_prefers_exhibit_field():
    ex = {"position": 5, "fusion_style": "B"}
    assert resolve_style(ex, fallback={5: "C"}) == "B"


def test_resolve_style_falls_back_to_dict():
    ex = {"position": 5}
    assert resolve_style(ex, fallback={5: "C"}) == "C"


def test_resolve_style_returns_none_if_neither():
    ex = {"position": 99}
    assert resolve_style(ex, fallback={5: "C"}) is None


def test_resolve_style_ignores_dict_when_field_present():
    ex = {"position": 5, "fusion_style": "PASSTHROUGH"}
    assert resolve_style(ex, fallback={5: "C"}) == "PASSTHROUGH"
```

- [ ] **Step 6.2: Run test, verify failure**

Run: `python3 -m pytest tests/test_batch_fusion_style_resolution.py -v`
Expected: ImportError on `resolve_style`.

- [ ] **Step 6.3: Add `resolve_style()` and update imports/dispatch in `tools/batch_fusion.py`**

At the top of `tools/batch_fusion.py`, change the import line:

```python
from tools.stitch_track import (
    stitch_a, stitch_c, stitch_c_aligned, stitch_b, probe_duration,
    FADEOUT, A_OVERLAP, A_BED_LEVEL, A_RAMP_AFTER,
    C_DUCK_LEVEL, OutOfBounds,
)
```

Add the resolver helper above `stitch_c_short()`:

```python
def resolve_style(exhibit: dict, fallback: dict[int, str]) -> str | None:
    """Pick fusion style: exhibit['fusion_style'] wins; else fallback dict."""
    style = exhibit.get("fusion_style")
    if style:
        return style
    return fallback.get(exhibit["position"])
```

Replace the dispatch block in `main()` (the `try: if style == "A": ... except SystemExit` section) with:

```python
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
                    # No anchor: degrade to legacy C
                    stitch_c(narration, music, out_path, args.postroll_seconds_c)
                    tag = f"C (no-anchor fallback) postroll={args.postroll_seconds_c}s"
                else:
                    stitch_c_aligned(
                        narration, music, out_path,
                        excerpt=args.postroll_seconds_c,
                        anchor_seconds=float(anchor),
                    )
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
            print(f"  fuse  {narration.stem}: {tag}")
        except (SystemExit, OutOfBounds) as e:
            print(f"  FAIL  {narration.stem}: {e}")
```

Also extend `find_match()` to accept an optional `suffix`:

```python
def find_match(directory: Path, prefix: str, suffix: str = "") -> Path | None:
    pattern = f"{prefix}*{suffix}.mp3" if suffix else f"{prefix}*.mp3"
    for f in directory.glob(pattern):
        # When suffix is empty, exclude split-narration files (`_a` / `_b`).
        if not suffix and (f.stem.endswith("_a") or f.stem.endswith("_b")):
            continue
        return f
    return None
```

For Style B, `narration` (the no-suffix variable used earlier in the loop) may be None — guard the path:

In the loop, before `if not narration:`, change to:

```python
        # Style B uses _a/_b narrations; skip the single-mp3 lookup for B.
        style_for_lookup = resolve_style(ex, STYLE_BY_POSITION)
        if style_for_lookup == "B":
            narration = None
            out_path = args.output_dir / f"{prefix.rstrip('_')}.mp3"  # placeholder
            # Reconstruct out_path from the music stem (or _a stem) below.
        else:
            narration = find_match(args.narration_dir, prefix)
            if not narration:
                print(f"  skip {pos}: no narration mp3 matching {prefix}*")
                continue
            out_path = args.output_dir / narration.name
```

Actually, simpler: keep the single-narration lookup, derive `out_path` from a stable stem, and let the dispatch arms fetch `_a`/`_b` themselves.

Replace the lookup block with:

```python
        # Stable output stem: prefer the music filename, fall back to single-narration.
        music_match = find_match(args.music_dir, prefix)
        out_stem = music_match.stem if music_match else f"{pos:02d}_track"
        out_path = args.output_dir / f"{out_stem}.mp3"
        if out_path.exists() and not args.force:
            print(f"  skip {out_stem}: already exists")
            continue

        if style == "PASSTHROUGH":
            # Copy the single narration mp3
            narration = find_match(args.narration_dir, prefix)
            if not narration:
                print(f"  skip {pos}: no narration mp3 matching {prefix}*")
                continue
            shutil.copy2(narration, out_path)
            print(f"  copy  {out_stem}: passthrough (no music)")
            continue

        if not music_match:
            print(f"  skip {pos}: no music mp3 matching {prefix}*")
            continue
        music = music_match

        # Single-narration styles need a single mp3; B fetches _a/_b inside dispatch.
        if style == "B":
            narration = None
        else:
            narration = find_match(args.narration_dir, prefix)
            if not narration:
                print(f"  skip {pos}: no narration mp3 matching {prefix}*")
                continue
```

This replaces the previous logic (lines 168–192 of the current file). The `style` variable is set just above by `style = resolve_style(ex, STYLE_BY_POSITION)` (replacing `style = STYLE_BY_POSITION.get(pos)`).

- [ ] **Step 6.4: Run unit tests, verify pass**

Run: `python3 -m pytest tests/test_batch_fusion_style_resolution.py tests/test_stitch_track_timings.py -v`
Expected: all 11 passed.

- [ ] **Step 6.5: Smoke test on episode 1 (regression)**

Run: `cd /Users/vickyshou/Documents/MusicOS && python3 -m tools.batch_fusion --episode episodes/rolling-stones_some-girls_miss-you.episode.json --narration-dir episodes/audio/narration --music-dir musicos-exhibition/public/audio --output-dir episodes/audio/fusion`
Expected: every output is `skip <stem>: already exists`. No new fusions, no failures.

- [ ] **Step 6.6: Commit**

```bash
git add tools/batch_fusion.py tests/test_batch_fusion_style_resolution.py
git commit -m "feat(fusion): JSON-driven fusion_style with B and C_ALIGNED dispatch"
```

---

## Task 7: Annotate episode 2 JSON with anchors + styles

**Files:**
- Modify: `episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json`

**Background:** Add `fusion_style` and `anchor_timestamp_seconds` to every track exhibit. Pillar tracks (positions 1, 2, 6, 10) additionally get `transcript_zh_a` / `transcript_zh_b` (split at the callback paragraph — the one starting "你刚才在 ..."). Set their `transcript_zh: null`.

Anchor values from spec table (editor may tune ±2s after auditioning):

| Pos | Track | Style | Anchor (s) |
|---|---|---|---|
| 0 | opening | PASSTHROUGH | — |
| 1 | Child in Time | B | 240 |
| 2 | Layla | B | 192 |
| 3 | Stairway | C_ALIGNED | 336 |
| 4 | The Who | C_SHORT | — |
| 5 | Free Bird | C_ALIGNED | 310 |
| 6 | Bohemian Rhapsody | B | 159 |
| 7 | Comfortably Numb | C_ALIGNED | 272 |
| 8 | Fade to Black | C_ALIGNED | 417 |
| 9 | Metallica One | C_SHORT | — |
| 10 | Estranged | B | 452 |
| 11 | November Rain | C_ALIGNED | 482 |
| 12 | Nothing Else Matters | C_ALIGNED | 213 |
| 13 | 黑豹 — Don't Break My Heart | C_ALIGNED | 152 |
| 14 | Champagne Supernova | C_ALIGNED | 302 |
| 15 | Paranoid Android | C_ALIGNED | 165 |
| 16 | 丸ノ内サディスティック | C | — (no anchor; legacy from-zero) |
| 17 | Welcome to the Black Parade | C | — (transitions, no single hit) |
| 18 | Knights of Cydonia | C_ALIGNED | 125 |
| 19 | closing | PASSTHROUGH | — |

- [ ] **Step 7.1: Add `fusion_style` + `anchor_timestamp_seconds` to all track exhibits**

Use `Edit` tool to update each track exhibit in `episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json`. For each non-pillar track exhibit (positions 3, 5, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18), add the two fields after `"play_mode"`:

```json
      "play_mode": "full",
      "fusion_style": "C_ALIGNED",
      "anchor_timestamp_seconds": 336,
```

Use the table above for each position's values. For position 16 and 17 use `"fusion_style": "C"` and omit `anchor_timestamp_seconds`.

For bridge positions (4, 9), add only `"fusion_style": "C_SHORT"`.

For opening/closing (0, 19), add `"fusion_style": "PASSTHROUGH"`.

- [ ] **Step 7.2: Split pillar narrations**

For each pillar (positions 1, 2, 6, 10), do the following in the JSON file:

1. Replace `"transcript_zh": "<full text>"` with `"transcript_zh": null`
2. Add `"transcript_zh_a": "<paragraphs before the callback paragraph>"`
3. Add `"transcript_zh_b": "<callback paragraph onward, including any closing paragraphs>"`
4. Add `"fusion_style": "B"` and `"anchor_timestamp_seconds": <value>` after `"play_mode"`

Split rule: `_b` starts at the paragraph beginning with `"你刚才在 ..."`. All paragraphs from that point through the end of the original `transcript_zh` go into `_b`. Everything before goes into `_a`.

Concrete splits (see `episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.md` for the full text — copy paragraphs verbatim):

- **Position 1 (Child in Time):** `_a` = paragraphs 1–3 ("你听到的那段管风琴循环..." through "...在十分钟里跑了好几次。"); `_b` = paragraphs 4–5 ("后来 Brian May 提出..." through "...两个主角都没下场。"). Note: this pillar's `_b` does NOT begin with "你刚才在" — the callback is forward-looking ("后来 Brian May 提出"). Use the "后来" paragraph as the `_b` start.
- **Position 2 (Layla):** `_a` = paragraphs 1–3 ("那七个音的下行 riff..." through "...是先后住进同一首歌的两个房间。"); `_b` = paragraphs 4–5 ("你刚才在 Child in Time 里听到那种轮流升高..." through "...只能先把房间分好。").
- **Position 6 (Bohemian Rhapsody):** `_a` = paragraphs 1–3 ("2:37 那段..." through "...是另一个声部的咏叹。"); `_b` = paragraphs 4–5 ("你刚才在 Stairway to Heaven 里听到独奏..." through "...都是从 May 这句\"吉他在唱词\"开始的。").
- **Position 10 (Estranged):** `_a` = paragraphs 1–4 ("7:30 那一下..." through "...用两种语言，谁也没等谁说完。"); `_b` = paragraphs 5–7 ("更深一层——这首歌也是从 Bohemian Rhapsody..." through "...是这条线第一次到达它的顶点。" + closing paragraphs through "...这条线第一次有了\"同时\"这个答案。" through "...但这一刻——七点半到九点之间——是这条线第一次到达它的顶点。"). Estranged's narration is 1092 chars; the natural midpoint is the "更深一层" paragraph since it pivots to historical depth.

- [ ] **Step 7.3: Validate JSON**

Run: `python3 -c "import json; json.loads(open('episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json').read()); print('OK')"`
Expected: `OK`.

- [ ] **Step 7.4: Verify counts**

Run:
```bash
cd /Users/vickyshou/Documents/MusicOS && python3 -c "
import json
ep = json.load(open('episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json'))
styles = {}
for ex in ep['exhibits']:
    s = ex.get('fusion_style', 'NONE')
    styles[s] = styles.get(s, 0) + 1
print(styles)
"
```
Expected: `{'PASSTHROUGH': 2, 'B': 4, 'C_ALIGNED': 11, 'C': 2, 'C_SHORT': 2}` (totals 21 = 19 episode positions + 2 — check: positions 0, 1–18, 19 = 20. Recount: PASSTHROUGH=2, B=4, C_ALIGNED=11, C=2, C_SHORT=2 → 21. There are only 20 positions. Re-tally: B={1,2,6,10}=4, C_ALIGNED={3,5,7,8,11,12,13,14,15,18}=10, C={16,17}=2, C_SHORT={4,9}=2, PASSTHROUGH={0,19}=2 → total 20 ✓). Expected dict: `{'PASSTHROUGH': 2, 'B': 4, 'C_ALIGNED': 10, 'C': 2, 'C_SHORT': 2}`.

- [ ] **Step 7.5: Commit**

```bash
git add episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json
git commit -m "data(episode-2): annotate anchors + fusion styles, split pillar narrations"
```

---

## Task 8: Re-synthesize narration for split pillars

**Files:**
- Output: `episodes/audio/narration/01_deep-purple_child-in-time_a.mp3`, `_b.mp3`, etc. (8 new mp3s)

**Background:** Pillar exhibits now have `transcript_zh: null` + `transcript_zh_a` / `_b`. The previous single mp3s (e.g. `01_deep-purple_child-in-time.mp3`) are stale — they correspond to the old combined `transcript_zh`. Style B in `batch_fusion.py` looks for `*_a.mp3` / `*_b.mp3`, not the single mp3, so the stale single mp3s are harmless but should be removed for hygiene.

- [ ] **Step 8.1: Move stale single-mp3 pillar narrations aside**

```bash
cd /Users/vickyshou/Documents/MusicOS
mkdir -p /tmp/episode2_stale_narration
mv episodes/audio/narration/01_deep-purple_child-in-time.mp3 \
   episodes/audio/narration/02_derek-and-the-dominos_layla.mp3 \
   episodes/audio/narration/06_queen_bohemian-rhapsody.mp3 \
   episodes/audio/narration/10_guns-n-roses_estranged.mp3 \
   /tmp/episode2_stale_narration/
```

- [ ] **Step 8.2: Run synthesis**

```bash
cd /Users/vickyshou/Documents/MusicOS
python3 -m tools.batch_synthesize_episode \
  --episode episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json \
  --voice 'Chinese (Mandarin)_Gentleman' \
  --output-dir episodes/audio/narration
```

Expected output mentions:
```
synth 01_deep-purple_child-in-time_a: <N> chars from transcript_zh_a
synth 01_deep-purple_child-in-time_b: <N> chars from transcript_zh_b
synth 02_derek-and-the-dominos_layla_a: ...
synth 02_derek-and-the-dominos_layla_b: ...
synth 06_queen_bohemian-rhapsody_a: ...
synth 06_queen_bohemian-rhapsody_b: ...
synth 10_guns-n-roses_estranged_a: ...
synth 10_guns-n-roses_estranged_b: ...
```
All other tracks: `skip <stem>: already exists`.

- [ ] **Step 8.3: Verify outputs**

Run: `ls -1 /Users/vickyshou/Documents/MusicOS/episodes/audio/narration/ | grep -E '^(01|02|06|10)_.*_(a|b)\.mp3$'`
Expected: 8 lines (4 pillars × 2 splits).

---

## Task 9: Re-fuse episode 2

**Files:**
- Output: `episodes/audio/fusion/*.mp3` (re-render)

**Background:** Now all 18 track positions plus opening/closing get re-fused with the new alignment.

- [ ] **Step 9.1: Move stale fusions aside**

```bash
cd /Users/vickyshou/Documents/MusicOS
mkdir -p /tmp/episode2_stale_fusion
# Episode-2 stems differ from episode-1 stems; these are episode-2's
mv episodes/audio/fusion/01_deep-purple_child-in-time.mp3 \
   episodes/audio/fusion/02_derek-and-the-dominos_layla.mp3 \
   episodes/audio/fusion/03_led-zeppelin_stairway-to-heaven.mp3 \
   episodes/audio/fusion/04_the-who_wont-get-fooled-again.mp3 \
   episodes/audio/fusion/05_lynyrd-skynyrd_free-bird.mp3 \
   episodes/audio/fusion/06_queen_bohemian-rhapsody.mp3 \
   episodes/audio/fusion/07_pink-floyd_comfortably-numb.mp3 \
   episodes/audio/fusion/08_metallica_fade-to-black.mp3 \
   episodes/audio/fusion/09_metallica_one.mp3 \
   episodes/audio/fusion/10_guns-n-roses_estranged.mp3 \
   episodes/audio/fusion/11_guns-n-roses_november-rain.mp3 \
   episodes/audio/fusion/12_metallica_nothing-else-matters.mp3 \
   /tmp/episode2_stale_fusion/ 2>/dev/null || true
ls episodes/audio/fusion/*.mp3 | grep -vE '_(james-brown|sly|david-bowie|parliament|bee-gees|the-rolling-stones|blondie|devo|chic|joy-division|talking-heads|queen_another)' > /tmp/may_remove.txt
# inspect /tmp/may_remove.txt for any episode-2 stems still present, move them
for f in $(cat /tmp/may_remove.txt); do
  name=$(basename "$f")
  case "$name" in
    13_*|14_*|15_*|16_*|17_*|18_*) mv "$f" /tmp/episode2_stale_fusion/ ;;
    00_opening.mp3|19_closing.mp3) mv "$f" /tmp/episode2_stale_fusion/ ;;
  esac
done
```

(Episode 1's fusion stems use the same `NN_` prefixes 01–18 but with different artist slugs — `01_james-brown_cold-sweat.mp3` etc. Only move episode-2 stems.)

- [ ] **Step 9.2: Run fusion**

```bash
cd /Users/vickyshou/Documents/MusicOS
python3 -m tools.batch_fusion \
  --episode episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json \
  --narration-dir episodes/audio/narration \
  --music-dir musicos-exhibition/public/audio \
  --output-dir episodes/audio/fusion
```

Expected: 20 lines, 18 `fuse` + 2 `copy` (opening, closing). No `FAIL`.

If any FAIL with `OutOfBounds: music_start < 0` → narration_a too long for that anchor. Either (a) lower the anchor by ±5s, or (b) trim narration_a (split closer to the start). The plan stops here for editor decision.

If FAIL with `OutOfBounds: music_clip exceeds music_total` → song source is too short. Refetch via Step 3 of `docs/episode_audio_pipeline.md`.

- [ ] **Step 9.3: Spot-check anchor alignment**

For each pillar and 3 supporting tracks, verify the anchor lands correctly. Quick visual check via duration:

```bash
cd /Users/vickyshou/Documents/MusicOS
for f in episodes/audio/fusion/01_*.mp3 episodes/audio/fusion/03_*.mp3 \
         episodes/audio/fusion/06_*.mp3 episodes/audio/fusion/10_*.mp3 \
         episodes/audio/fusion/11_*.mp3; do
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  printf "%6.1fs  %s\n" "$d" "$(basename "$f")"
done
```

Expected: pillars (Style B) ≈ 145–160s; C_ALIGNED ≈ 75s + n_dur. No file < 100s, no file > 250s.

Manual ear-check (one pillar): play `episodes/audio/fusion/10_guns-n-roses_estranged.mp3`. The first ramp-to-100% should land on the song's 7:28-ish moment (Slash's tone-rolled-off lead entry). If it sounds early/late by more than ~3s, adjust `anchor_timestamp_seconds` for position 10 in the JSON and re-fuse.

- [ ] **Step 9.4: Commit (audio is in .gitignore / large; only commit if repo tracks it)**

```bash
cd /Users/vickyshou/Documents/MusicOS
git status episodes/audio/ 2>&1 | head
# If any new mp3s show as untracked: they should NOT be committed (large binaries).
# Confirm .gitignore covers episodes/audio/fusion if needed.
```

No commit step here unless the repo policy changes — fusion mp3s are build artifacts.

---

## Task 10: Push to exhibition + audition

**Files:**
- Sync: `musicos-exhibition/public/audio_fusion/` ← `episodes/audio/fusion/`

**Background:** Episode 1's fusions live alongside episode 2's in `audio_fusion/`. The build script picks them up by stem.

- [ ] **Step 10.1: Sync fusion mp3s into exhibition**

```bash
cd /Users/vickyshou/Documents/MusicOS
# Don't rm -rf — episode 1 lives there too. Use cp -r which overwrites in place.
cp -r episodes/audio/fusion/. musicos-exhibition/public/audio_fusion/
```

- [ ] **Step 10.2: Rebuild exhibition data**

```bash
cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition
npx tsx scripts/build-exhibition-json.ts
```

Expected: script completes; `data/exhibition-ep2.json` updated with `fusion_audio_url` for each track.

- [ ] **Step 10.3: Audition**

Run `cd /Users/vickyshou/Documents/MusicOS/musicos-exhibition && npx vite` and open the local URL. Click into episode 2, play track 10 (Estranged) tile — ramp to 100% should land at ~7:28 of the song. Click track 3 (Stairway), ramp should land at ~5:32.

- [ ] **Step 10.4: Commit data updates**

```bash
cd /Users/vickyshou/Documents/MusicOS
git add musicos-exhibition/data/exhibition-ep2.json musicos-exhibition/data/exhibition.json
git commit -m "data(exhibition): rebuild episode-2 with anchor-aligned fusions"
```

---

## Task 11: Documentation update

**Files:**
- Modify: `docs/episode_audio_pipeline.md`

- [ ] **Step 11.1: Append B + C_ALIGNED rows to the Step 4 style table**

Find the existing style table in `docs/episode_audio_pipeline.md` (Step 4 section, the `| Style | Used for | Music min duration |` table) and append two rows after `C_SHORT`:

```markdown
| `C_ALIGNED` | tracks with `anchor_timestamp_seconds`; reverse-computes `atrim` start so post-narration ramp-to-100% lands at `anchor − 2s`. Same envelope as C otherwise. | song must extend to `anchor + post_roll + fadeout` and have `≥ anchor − preroll − duck − n_dur − duck − lead_in` of pre-anchor runway |
| `B` | pillar tracks (Mode 3, 说—唱—说). Requires `transcript_zh_a` + `_b` and `anchor_timestamp_seconds`. Plays narration_a on bed → 30s clean anchor segment → narration_b on bed → 20s tail → fadeout. | song must extend to `anchor − 2s + 30s + duck + n_dur_b + duck + 20s + 5.5s` and have `≥ (anchor − 2s) − (intro_pad + duck + n_dur_a + duck)` of pre-anchor runway |
```

Also append a short section after the table:

```markdown
**Anchor authoring:** `anchor_timestamp_seconds` is the in-song second the
listener should hear at 100% volume. If the transcript reads "5:34 那一下",
the anchor is typically `T_transcript + 2s` (so the 1s ramp-up completes
2 seconds before the named hit, giving a brief lead-in at full volume
before the hit lands).

**Failure modes:** both `C_ALIGNED` and `B` raise `OutOfBounds` rather than
silently truncating. If you see `music_start < 0`, the song doesn't have
enough pre-anchor runway for the chosen narration length — either trim the
narration (for B, split closer to the start) or move the anchor later.
If you see `music_clip exceeds music_total`, the source mp3 is too short
— refetch via Step 3.
```

- [ ] **Step 11.2: Commit**

```bash
git add docs/episode_audio_pipeline.md
git commit -m "docs(pipeline): document Style B and C_ALIGNED"
```

---

## Done Criteria

- [ ] All unit tests pass: `python3 -m pytest tests/test_stitch_track_timings.py tests/test_batch_fusion_style_resolution.py -v` → 11+ passed.
- [ ] Episode 1 fusion regression: re-running `batch_fusion.py` on Miss You produces only `skip` lines — no re-renders, no failures.
- [ ] Episode 2 has 20 fresh fusion mp3s with new alignment.
- [ ] Pillar tracks 1, 2, 6, 10 audibly demonstrate Mode 3 (clean music between two narration halves).
- [ ] Track 10 (Estranged) ramp-to-100% lands at ~7:28 (anchor 452s − 2s lead-in − 1s ramp = first ramp-up end at song-time 449s, ramp begins at 448s; listener hears 100% by 450s — i.e. ~7:30 transcript moment).
- [ ] `docs/episode_audio_pipeline.md` documents the two new styles.
- [ ] No regressions in episode 1 (Miss You) playback in the exhibition.

---

## Self-Review Notes

**Spec coverage:**
- ✅ `anchor_timestamp_seconds` field — Task 7
- ✅ `fusion_style` field on exhibit — Task 6 (resolver) + Task 7 (data)
- ✅ Style C_ALIGNED with reverse-compute — Tasks 1, 2
- ✅ Style B (Mode 3) with split narration — Tasks 3, 4, 5
- ✅ Bounds validation — Task 1, Task 3 (`OutOfBounds`)
- ✅ Backward compat (no anchor → atrim=0) — Task 6 (`C_ALIGNED` falls back to `stitch_c`)
- ✅ Pillar identification (1, 2, 6, 10) — Task 7
- ✅ Pipeline doc update — Task 11
- ✅ Episode-1 unaffected — verified in Tasks 5.3 and 6.5

**Type/name consistency:**
- `compute_aligned_music_start` (Task 1), `compute_b_timings` returning `BTimings` (Task 3) — used by `stitch_c_aligned` (Task 2) and `stitch_b` (Task 4) consistently.
- `OutOfBounds` exception (Task 1) — caught in `batch_fusion.py` (Task 6) alongside `SystemExit`.
- `resolve_style` (Task 6) — used in `main()` loop in same task.
- `find_match` extended with `suffix` parameter (Task 6) — `_a`/`_b` lookup in Style B dispatch uses it.
