# Anchor-Aligned Fusion — Design

**Date:** 2026-05-07
**Scope:** Episode 2 (Estranged · aria↔solo dialectic) and forward
**Status:** Approved, ready for implementation plan

---

## Problem

Episode 2's transcript organizes nearly every track around a precise in-song
timestamp — "5:34 那一下", "7:30 那一下", "2:37 那段", "4:30 一直撑到歌结束",
etc. 13 of 18 tracks have at least one such anchor. The existing fusion
pipeline (`tools/batch_fusion.py`) always plays music from `0:00`
(`atrim=0:music_clip`), so when narration finishes and music ramps to 100%,
the listener is hearing the song's intro — not the anchor moment the
narration just pointed at.

Two listening-experience problems follow:

1. **Time mismatch.** Style C ramps music back to 100% at a position that has
   nothing to do with the narrative anchor. The "pay-off" segment is wrong.
2. **Missing Mode 3.** The library currently has Mode 1 (preroll → duck →
   narration → post-roll = Style C) and Mode 2 (narration first, music after
   = Style A). It does not have Mode 3 (说—唱—说), which is the natural shape
   for narratives built around a single mid-song hit.

Goal: the moment music returns to 100% volume must equal the in-song
timestamp the narration just named. Add a Mode 3 style for pillar tracks
where the editorial weight justifies splitting the narration in two.

---

## Editorial principle (preserved)

Narration and music **continue to play simultaneously** during talking
sections. The fix is not to separate them — it is to make sure the moment
the listener's attention shifts to music (the ramp-up to 100%) lands on
the actual anchor.

Mode 3 (Style B) permits a thin transition layer between narration and
clean-music sections.

---

## Data model

Each `kind: "track"` exhibit in `episodes/<slug>.episode.json` gains:

```json
{
  "anchor_timestamp_seconds": 454,
  "fusion_style": "C_ALIGNED"
}
```

### `anchor_timestamp_seconds` (number, optional)

The in-song second at which the listener should hear music at 100% volume,
**not** the second printed in the transcript. If the transcript says "7:30
那一下", `anchor_timestamp_seconds` is typically `T_transcript + 2s` lead-in
buffer (so the ramp-up completes 2 seconds before the hit; listener hears
the build-in at full volume, then the hit lands at 100%).

If absent, the track falls back to legacy behavior (`atrim=0`).

### `fusion_style` (string, required for tracks)

Moves out of `STYLE_BY_POSITION` in `tools/batch_fusion.py` and into the
episode JSON itself. Allowed values:

- `"A"` — sequential (Mode 2). Unchanged.
- `"C"` — preroll + ducked bed (Mode 1), legacy from-zero behavior.
- `"C_ALIGNED"` — same shape as C, but music start is reverse-computed from
  `anchor_timestamp_seconds`. **Default for any track that has an anchor.**
- `"B"` — Mode 3 (说—唱—说). Pillar-only.
- `"C_SHORT"` — short-music variant for muted bridges. Unchanged.
- `"PASSTHROUGH"` — opening/interlude/closing, no music. Unchanged.

Bridge tracks (`muted_this_episode: true`) keep their existing style.

---

## Style `C_ALIGNED` (default for tracks with anchors)

Same envelope as the existing Style C:

```
preroll 8s  →  duck-down 1s  →  narration on bed @ 10%  →  ramp-up 1s
            →  60s clean post-roll  →  5.5s fadeout
```

Difference: music start in song is reverse-computed.

```
LEAD_IN          = 2.0s              # listener hears 2s of lead-in at 100% before the hit
ramp_up_end_in_song  = anchor - LEAD_IN
music_start_in_song  = ramp_up_end_in_song - (preroll + duck_down + n_dur + duck_up)
ffmpeg input: atrim = music_start_in_song : music_start_in_song + music_clip
```

Where:
- `preroll = 8.0`, `duck_down = 1.0`, `duck_up = 1.0` (existing constants)
- `n_dur` = duration of the narration mp3 for this track (probed at fusion
  time)
- `music_clip = preroll + duck_down + n_dur + duck_up + post_roll + fadeout`
  (unchanged)

**Validation at fusion time:**
- If `music_start_in_song < 0` → fail loud. The song doesn't have enough
  pre-anchor runway for this narration length. Editor must shorten the
  narration, lower the anchor offset, or switch to Style B.
- If `music_start_in_song + music_clip > music_total_duration` → fail loud.
  Need a longer source file or shorter post-roll.

Tracks without `anchor_timestamp_seconds` fall back to the legacy
from-zero atrim — guaranteeing backward compatibility with episode 1.

---

## Style `B` (Mode 3 — pillar tracks only)

For episode 2 the pillar tracks are: **Child in Time, Layla, Bohemian
Rhapsody, Estranged**. Other episodes assign by `narrative_weight: pillar`.

### Editorial split

`transcript_zh` is replaced (for Style B tracks only) by:

```json
{
  "transcript_zh_a": "...",
  "transcript_zh_b": "...",
  "transcript_zh": null
}
```

Split point is editorial. The natural breakpoint is usually the callback
paragraph ("你刚才在 X 里听到 Y——这里 Z"), which moves to `_b`.
`narration_a` sets up the anchor; the clean music excerpt plays the anchor;
`narration_b` does the meaning-making/callback.

### Time line

```
[ bed @ 30% + narration_a + thin transition ]
   ↓ ramp-up 1s ending at anchor − LEAD_IN  (so 100% lands ~LEAD_IN before the named hit)
[ 30s clean anchor segment at 100% ]
   ↓ duck-down 1s
[ bed @ 30% + narration_b ]
   ↓ ramp-up 1s
[ 20s tail at 100% ]
   ↓ 5.5s fadeout
```

Constants:
- `B_LEAD_IN = 2.0s`
- `B_BED_LEVEL = 0.30` (vs C's 0.10 — slightly louder bed since narration is
  shorter per segment)
- `B_ANCHOR_CLEAN = 30s`
- `B_TAIL = 20s`
- `B_FADEOUT = 5.5s`

Reverse computation for music start (so the first ramp-up lands at
`anchor − LEAD_IN`):

```
preroll_b = duration of narration_a + 1s ramp-down + 1s ramp-up + intro pad (default 4s)
ramp_up_end_in_song = anchor - B_LEAD_IN
music_start_in_song = ramp_up_end_in_song - preroll_b
```

`music_clip_b = preroll_b + B_ANCHOR_CLEAN + 1.0 (duck) + n_dur_b + 1.0 (ramp) + B_TAIL + B_FADEOUT`

Same out-of-bounds validation as C_ALIGNED.

### Permitted simultaneity

Bed at 30% under narration is allowed (and expected). The "thin transition"
is the 1s ramp-down / ramp-up — no hard cuts. This satisfies the user
constraint: voice and music coexist throughout, only the foreground shifts.

---

## Implementation surface

### 1. Episode JSON updates (`episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json`)

- Add `anchor_timestamp_seconds` + `fusion_style` to every track exhibit
  (positions 1–18). Bridge positions (4, 9) keep existing muted style.
- For pillars (positions 1, 2, 6, 10): split `transcript_zh` into
  `transcript_zh_a` / `transcript_zh_b`, set `transcript_zh: null`,
  `fusion_style: "B"`.
- Anchor values to start from (editor will tune ±1s per track):

  | Pos | Track | Transcript stamp | `anchor_timestamp_seconds` |
  |---|---|---|---|
  | 1 | Child in Time | Blackmore solo apex (no transcript stamp) | ~240 (4:00, tunable) |
  | 2 | Layla | piano coda entry ~3:10 | ~192 |
  | 3 | Stairway | 5:34 | 336 |
  | 5 | Free Bird | 5:08 | 310 |
  | 6 | Bohemian Rhapsody | 2:37 | 159 |
  | 7 | Comfortably Numb | 4:30 | 272 |
  | 8 | Fade to Black | 6:55 | 417 |
  | 10 | Estranged | 7:30 | 452 |
  | 11 | November Rain | 8:00 | 482 |
  | 12 | Nothing Else Matters | 3:31 | 213 |
  | 13 | 黑豹 — Don't Break My Heart | 2:30 | 152 |
  | 14 | Champagne Supernova | 5:00 | 302 |
  | 15 | Paranoid Android | 2:43 | 165 |
  | 16 | 丸ノ内サディスティック | (no precise stamp; short song, may skip anchor) | optional |
  | 17 | Welcome to the Black Parade | (transitions, not single hit; may skip) | optional |
  | 18 | Knights of Cydonia | 2:03 | 125 |

  (Positions left blank fall back to `atrim=0`.)

### 2. `tools/batch_fusion.py`

- Read `fusion_style` from each exhibit (replacing `STYLE_BY_POSITION` dict).
  Keep dict as a final fallback for episodes without the new field.
- Modify `stitch_c()` to accept optional `anchor_seconds`; if provided,
  reverse-compute `atrim` start; otherwise behave as today.
- Add `stitch_b()` implementing the Style B time line above. Inputs: two
  narration mp3s, one music mp3, anchor seconds, output path.
- Add bounds validation for both styles. On failure: print the computed
  `music_start_in_song` and required `music_clip` length, exit non-zero.

### 3. `tools/batch_synthesize_episode.py`

- For tracks with `transcript_zh_a` / `transcript_zh_b`: emit two narration
  mp3s with suffix `_a` / `_b` (e.g. `01_deep-purple_child-in-time_a.mp3`,
  `01_deep-purple_child-in-time_b.mp3`).
- Existing tracks (single `transcript_zh`) unchanged.

### 4. Documentation (`docs/episode_audio_pipeline.md`)

Add a section for Style B and C_ALIGNED in the Step 4 table, including the
reverse-computation formula and the bounds-failure modes.

### 5. Exhibition

No changes. `scripts/build-exhibition-json.ts` already picks up
`/audio_fusion/<NN>_*.mp3` from disk; fusion stems and exhibit positions
stay identical.

---

## Explicit non-goals

- **No automatic silence-detection split** of single-narration mp3s. Style B
  requires a hand-authored `_a`/`_b` split.
- **No multi-anchor support** in this iteration. If a track has two hits
  (e.g. Comfortably Numb's "first chorus" + "4:30"), only the primary anchor
  drives fusion. Multi-anchor is future work.
- **No change to non-pillar narration text.** Style C_ALIGNED is a pure
  alignment fix — narration content is unchanged.
- **No changes to episode 1 (Miss You).** Backward-compatible: missing
  `anchor_timestamp_seconds` + missing `fusion_style` → legacy behavior
  preserved.

---

## Validation / acceptance

- Re-run fusion on all 18 positions of episode 2.
- Spot-check 4 pillars by ear: at the moment narration ends and ramp-up
  completes, the song should be at the named hit (±1s).
- Spot-check 3 supporting tracks (Stairway 5:34, Free Bird 5:08,
  November Rain 8:00) the same way.
- Audition in exhibition (`npx vite`): confirm fusion mp3 plays in tile,
  no truncation warnings from `batch_fusion.py`.
- Episode 1 (Miss You) tile playback unchanged — sanity check only, no
  re-render expected.
