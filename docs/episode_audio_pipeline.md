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
  --output-dir episodes/audio/narration
```

Output naming:
- track exhibits → match the music filename stem in `musicos-exhibition/public/audio/`
  (e.g. `06_the-rolling-stones_miss-you.mp3`).
- opening / interlude / closing → `NN_<kind>.mp3`.
- muted tracks → use `bridge_narration_zh` instead of `transcript_zh`, same stem.

Idempotent — skips outputs that already exist. Pass `--force` to re-synth.
Each run appends to `episodes/audio/narration/synthesis_log.jsonl` with
`usage_characters` (MiniMax billing unit, ≠ input chars).

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
| `PASSTHROUGH` | opening / interlude / closing — copies narration mp3 as-is, no music | n/a |

Edit `STYLE_BY_POSITION` in `tools/batch_fusion.py` for the new episode, then:

```
python3 -m tools.batch_fusion \
  --episode episodes/<slug>.episode.json \
  --narration-dir episodes/audio/narration \
  --music-dir musicos-exhibition/public/audio \
  --output-dir episodes/audio/fusion
```

Idempotent (skip if exists; `--force` to overwrite). Refuses to silently
truncate — if music is too short for the chosen style, it fails loud and
points at the gap. That's your signal to go back to Step 2.

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
