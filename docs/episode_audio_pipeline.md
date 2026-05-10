# Episode Audio Pipeline — Runbook

How to take an `episodes/<slug>.episode.json` (with `transcript_zh` populated) all
the way to playable per-track fusion mp3s wired into the exhibition. Calibrated
on Miss You · Bassline DNA · ep 1 (2026-05-06).

This is a **runbook**, not a spec. The pipeline below is fixed; only the
per-episode style assignment changes between runs.

---

## Prereqs (one-time)

1. **MiniMax key** in `.env.local` at vault root (gitignored):
   ```
   MINIMAX_API_KEY=sk-api-...
   MINIMAX_GROUP_ID=...
   ```
   Endpoint is hard-coded to `https://api.minimaxi.com/v1/t2a_v2`. The
   `sk-api-` (pay-as-you-go) key format is required; legacy JWT keys do **not**
   work on this endpoint.
2. **`yt-dlp` + `ffmpeg`** on `PATH` for the audio-fill and stitching steps.
3. **Voice lock** — every episode uses `Chinese (Mandarin)_Gentleman` on
   model `speech-02-hd`. Don't change without a fresh A/B spike.

---

## Step 1 · Narration synthesis

Inputs: `episodes/<slug>.episode.json` with `transcript_zh` (and
`bridge_narration_zh` for `muted_this_episode: true` tracks).

```
python3 -m tools.batch_synthesize_episode \
  --episode episodes/<slug>.episode.json \
  --voice 'Chinese (Mandarin)_Gentleman' \
  --output-dir episodes/audio/narration \
  --music-dir musicos-exhibition/public/audio/ep<N>
```

`--music-dir` must point at the per-episode subdir (`ep1`, `ep2`, …) so narration stems resolve to the right `NN_<artist>_<track>` slug — different episodes share `NN_` prefixes.

Output naming:
- track exhibits → match the music filename stem in `--music-dir`
  (e.g. `06_the-rolling-stones_miss-you.mp3`).
- opening / interlude / closing → `NN_<kind>.mp3`.
- muted tracks → use `bridge_narration_zh` instead of `transcript_zh`, same stem.
- pillar tracks with `transcript_zh_a` + `transcript_zh_b` → emit `NN_<stem>_a.mp3` and `NN_<stem>_b.mp3` (Style B fusion).

Idempotent — skips outputs that already exist. Pass `--force` to re-synth.
Pass `--only-position N` (repeatable) to re-synth a single exhibit.
Each run appends to `episodes/audio/narration/synthesis_log.jsonl` with
`usage_characters` (MiniMax billing unit, ≠ input chars).

**Sentence-level timestamps (`--subtitle`, default ON):** the script
requests MiniMax's native sentence-level timing on every synthesis unless
you pass `--no-subtitle`. The TTS request sets `subtitle_enable: true` and
the API returns a `subtitle_file` URL; we fetch it inline and write a
sidecar `<stem>.subtitle.json` next to each narration mp3.

**These sidecars are required.** Without them, Step 4 cannot emit a
fusion-aligned subtitle, and the front-end falls back to a
character-count estimate that drifts by seconds across the music
preroll/postroll and any pause in the narration. If you ever run with
`--no-subtitle`, plan to re-synth before fusion. Format is the raw MiniMax payload —
`[{text, time_begin, time_end, ...}]` with times in **milliseconds** in the
**narration timeline** (t=0 at narration start). Step 4 reads these and
emits a fusion-aligned variant.

These timestamps replace the old proportional-by-character estimate in
`NowPlayingBar.tsx`, which assumed (a) narration starts at t=0 of the
fusion file and (b) characters are read at uniform speed — both wrong
for any music-bearing fusion style. When the sidecar exists, the bar
switches to sentence-level highlighting.

---

## Step 2 · Audit music sources

For each track position 1..N, the fusion step needs music ≥ a minimum
duration (depends on style, see Step 4). NetEase exports often give 30s
previews and will silently truncate fusion output.

Quick audit:

```
for f in musicos-exhibition/public/audio/*.mp3; do
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  printf "%6.1fs  %s\n" "$d" "$(basename "$f")"
done | sort -n
```

Anything `< ~120s` is a candidate for refetch.

---

## Step 3 · Fill missing audio (YouTube fallback)

Build a manifest (`tools/youtube_manifest.txt`):

```
# <video_id>|<filename_stem>
KuRxXRuAz-I|06_the-rolling-stones_miss-you
```

The stem must match the existing `NN_<artist-slug>_<song-slug>` so that the
narration mp3 (Step 1) and fusion script (Step 4) line up by position.

```
python3 -m tools.fetch_audio_youtube tools/youtube_manifest.txt
```

- Existing files are backed up to `/tmp/audio_backup/` before overwrite.
- `--force-overwrites` is on, so reruns refresh in place.
- Uses `-x --audio-format mp3 --audio-quality 192K`.

If a video is region-locked or removed, swap the `video_id` and rerun — it's
idempotent.

---

## Step 4 · Style assignment + batch fusion

Per-position style choice is editorial. The approved styles:

| Style | Used for | Music min duration |
|---|---|---|
| `A` (sequential) | shorter narration (~≤ 350 ZH chars); narration plays clean → music fades in at 30% over last 4s → ramps to 100% → 100s music → 5.5s fadeout | `excerpt + 5.5s` ≈ 105.5s |
| `C` (preroll + ducked bed) | longer narration or anchor tracks where the intro IS the point; 8s music intro → duck to 10% over 1s → narration on bed → ramp back → 60s post-roll → 5.5s fadeout | `8 + 1 + ndur + 1 + 60 + 5.5` ≈ 75s + ndur |
| `C_SHORT` | muted tracks with only ~30s of music; same shape, dynamic post-roll | ≥ 30s |
| `C_ALIGNED` | tracks with `anchor_timestamp_seconds`; reverse-computes `atrim` start so the post-narration ramp-to-100% lands at `anchor − 2s`. Same envelope as C otherwise. | song must extend to `anchor + post_roll + fadeout` and have `≥ anchor − preroll − duck − n_dur − duck − lead_in` of pre-anchor runway |
| `B` | pillar tracks (Mode 3, 说—唱—说). Requires `transcript_zh_a` + `_b` and `anchor_timestamp_seconds`. Plays narration_a on bed → 30s clean anchor segment → narration_b on bed → 20s tail → fadeout. | song must extend to `anchor − 2s + 30s + duck + n_dur_b + duck + 20s + 5.5s` and have `≥ (anchor − 2s) − (intro_pad + duck + n_dur_a + duck)` of pre-anchor runway |
| `PASSTHROUGH` | opening / interlude / closing — copies narration mp3 as-is, no music | n/a |

**Anchor authoring:** `anchor_timestamp_seconds` is the in-song second the listener should hear at 100% volume. If the transcript reads "5:34 那一下", the anchor is typically `T_transcript + 2s` so the 1s ramp-up completes 2 seconds before the named hit, giving a brief lead-in at full volume before the hit lands. Pillars (Style B) need split narration: set `transcript_zh: null` and split the original prose into `transcript_zh_a` (setup before the anchor) and `transcript_zh_b` (callback after).

**Failure modes:** both `C_ALIGNED` and `B` raise `OutOfBounds` rather than silently truncating. `music_start < 0` means the song doesn't have enough pre-anchor runway for the chosen narration length — either trim the narration (for B, split closer to the start) or move the anchor later. `music_clip exceeds music_total` means the source mp3 is too short — refetch via Step 3 or pick an earlier anchor (e.g. Episode 2's Fade to Black moved from 6:55 → 5:50 because the named moment was at the song's tail).

Edit `STYLE_BY_POSITION` in `tools/batch_fusion.py` for the new episode, then:

```
python3 -m tools.batch_fusion \
  --episode episodes/<slug>.episode.json \
  --narration-dir episodes/audio/narration \
  --music-dir musicos-exhibition/public/audio \
  --output-dir episodes/audio/fusion
```

Idempotent (skip if exists; `--force` to overwrite). Pass `--only-position N`
(repeatable) to re-fuse a single exhibit. Refuses to silently truncate —
if music is too short for the chosen style, it fails loud and points at
the gap. That's your signal to go back to Step 2.

**Fusion-aligned subtitles:** if a `<stem>.subtitle.json` sidecar exists
next to the narration mp3 (Step 1's `--subtitle`), fusion writes a
companion `<out_stem>.subtitle.json` next to the fused mp3. Times are
shifted from the narration timeline to the fusion-output timeline by
adding the per-style narration start offset:

| Style | Narration start in fusion timeline (s) |
|---|---|
| `A` | `0` |
| `C` / `C_ALIGNED` | `C_PREROLL + C_DUCK_RAMP` = `9` |
| `C_SHORT` | `3.5 + 0.5` = `4` |
| `B` | narration_a at `B_INTRO_PAD + B_DUCK_RAMP` = `5`; narration_b at `b_timings.duck_b_end` |
| `PASSTHROUGH` | `0` |

Output JSON is normalized: `[{text, start, end}]` with times in **seconds**
in the fusion timeline. Source of truth for offsets is
`NARRATION_OFFSET_BY_STYLE` in `tools/batch_fusion.py` — keep in sync with
the `adelay` values in `tools/stitch_track.py`.

---

## Step 5 · Exhibition integration

Copy fusion mp3s into the exhibition public dir, then rebuild data:

```
rm -rf musicos-exhibition/public/audio_fusion
cp -r episodes/audio/fusion musicos-exhibition/public/audio_fusion

cd musicos-exhibition
npx tsx scripts/build-exhibition-json.ts   # repopulates fusion_audio_url from disk
```

`scripts/build-exhibition-json.ts` auto-detects `/audio_fusion/<NN>_*.mp3`
on disk and writes `fusion_audio_url` per exhibit. The `TrackDetail` route
prefers `fusion_audio_url` over the bare `audio_url` for playback.

`NowPlayingBar.tsx` derives the subtitle URL at runtime by replacing the
`.mp3` suffix on `fusion_audio_url` with `.subtitle.json` and attempting a
fetch; on 200 it switches to sentence-level highlighting, on 404 it falls
back to paragraph-proportional estimation. No exhibit-data schema change
is required to enable subtitles for a track — drop the JSON file next to
the fusion mp3 and the bar picks it up.

Audition with `npx vite` — every track tile should now play the narrated
fusion, not the bare music.

---

## Recovery / common failures

- **Auth 2049 from MiniMax** — wrong endpoint (`api.minimaxi.com` is the only
  one that takes `sk-api-` keys) or you copied the JWT key into a sk-api slot.
- **Fusion output truncated (~30s)** — your music source is a NetEase preview.
  Refetch via Step 3.
- **`stitch_a` raises "narration shorter than overlap"** — narration is
  <4s; either reassign to `A` is wrong (use `PASSTHROUGH` for vestigial
  segments) or text is too short for an episode beat.
- **`batch_synthesize_episode` skips an exhibit** — output already exists OR
  the exhibit has no `transcript_zh` / `bridge_narration_zh`. Inspect the
  episode.json before assuming the synth tool is broken.

---

## Cost note

speech-02-hd bills **`usage_characters`** from the API response, not the
length of your prompt. For Miss You ep 1: 6296 input chars → 9053 billed.
Plan accordingly when sizing future episodes.
