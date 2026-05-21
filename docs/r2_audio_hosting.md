# Hosting exhibition audio on Cloudflare R2

**Problem this solves:** the `public/audio_fusion/`, `public/audio/`, and `public/covers/`
folders total ~460MB. Shipping them inside the git repo and the Vercel build made the
repo balloon with every episode and broke audio playback on Vercel (the media exceeded
deploy limits / wasn't included). The fix: host media on R2 and point the app at it via
`VITE_AUDIO_BASE`.

## This project's R2 values

| | |
|---|---|
| Bucket | `viimusicpodcast` |
| Account ID | `375947c6e514350f2ae6470b8ae9fca7` |
| S3 endpoint | `https://375947c6e514350f2ae6470b8ae9fca7.r2.cloudflarestorage.com` |
| rclone remote name | `r2` (the upload script expects this exact name) |

## How the app resolves media URLs

Every cover/audio reference goes through `assetUrl()` (`src/lib/asset-url.ts`):

```ts
assetUrl('/audio_fusion/ep1/01_x.mp3')
// VITE_AUDIO_BASE unset (local dev)  -> /audio_fusion/ep1/01_x.mp3   (served from public/)
// VITE_AUDIO_BASE = https://cdn...   -> https://cdn.../audio_fusion/ep1/01_x.mp3
```

So R2 must mirror the local `public/` layout exactly: an object at
`audio_fusion/ep1/01_x.mp3`, `covers/01_x.jpg`, etc.

> Subtitle sidecars (`*.subtitle.json`) are fetched by raw path in
> `useFusionSubtitle` and are NOT routed through `assetUrl`. They stay in the repo and
> ship with the Vercel build, so they keep working regardless of `VITE_AUDIO_BASE`.
> (The upload script copies them to R2 too, harmlessly — they're just unused there.)

## One-time setup

### 1. Create the bucket
Cloudflare dashboard → R2 → Create bucket. (Already done: `viimusicpodcast`.)

### 2. Make it publicly readable
Either:
- **Custom domain (recommended):** bucket → Settings → Public access → Connect a domain
  (e.g. `media.yourdomain.com`). Gives clean URLs + Cloudflare CDN caching.
- **r2.dev dev URL:** bucket → Settings → enable "Public Development URL". Fine for
  testing; rate-limited and not for production.

### 2b. Add a CORS policy (REQUIRED — not optional)
The `<audio>` elements set `crossOrigin="anonymous"` so the spectrum visualizer's Web
Audio analyser (`useAudioAnalyser` → `createMediaElementSource`) can read cross-origin
audio without tainting. **Consequence:** if the bucket does not return CORS headers, the
browser refuses to load the audio at all — playback breaks. So CORS must be configured.

Bucket → Settings → CORS Policy:
```json
[
  {
    "AllowedOrigins": ["https://your-site.vercel.app", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```
Include every origin the app is served from (production domain + the `*.vercel.app`
deployment URL, and `http://localhost:5173` only if you test local builds against R2).
Covers loaded via `<img>` don't need CORS, but the policy above covers them harmlessly.

### 3. Create an R2 API token (gets you the S3 keys)
**Important:** use the **R2-specific** token page, not the generic "My Profile → API
Tokens → Create Custom Token" page. The generic one only outputs a single bearer token;
the R2 one shows the **Access Key ID + Secret Access Key** pair that rclone needs.

Path: **R2 Object Storage → Overview** (the bucket-LIST page, not inside a bucket) →
bottom-right **Account Details** panel → **API Tokens → `{ } Manage`** → **Create API
token**. Then:
- Token name: anything (e.g. `musicpodcast`)
- Permissions: **Object Read & Write**
- Specify bucket(s): `viimusicpodcast` (or all buckets)
- Create → **copy the Access Key ID and Secret Access Key** (the secret is shown once).

You can tell you're on the right page if the permission choices are
`Admin Read & Write / Object Read & Write / Object Read only` (radio). If you instead see
`Account / Zone` dropdowns with "Cloudflare Pages / Workers R2 Storage", you're on the
wrong (generic) page — back out.

### 4. Configure rclone
```bash
brew install rclone   # or https://rclone.org/install/
rclone config
```
Answer the interactive prompts exactly like this (`>` is rclone's prompt):
```
n/s/q>  n                          # New remote
name>  r2                          # MUST be "r2" — the upload script expects it

Storage>  s3                       # or pick "Amazon S3 Compliant Storage Providers"
provider>  Cloudflare              # pick the Cloudflare R2 entry
env_auth>  1                       # 1 = enter keys manually (false)
access_key_id>  <your Access Key ID>
secret_access_key>  <your Secret Access Key>
region>                            # leave blank, press Enter
endpoint>  https://375947c6e514350f2ae6470b8ae9fca7.r2.cloudflarestorage.com
location_constraint>               # blank
acl>                               # blank

Edit advanced config?>  n
Keep this remote?>  y
                                   # then press q to quit
```
Verify the connection:
```bash
rclone lsd r2:                     # should list the viimusicpodcast bucket
```

## Upload media

```bash
# preview first
R2_BUCKET=viimusicpodcast bash tools/upload_media_r2.sh --dry-run
# then upload (~460MB)
R2_BUCKET=viimusicpodcast bash tools/upload_media_r2.sh
```

The script uploads `audio_fusion/`, `audio/`, and `covers/` with a long
`Cache-Control: immutable` header. It uses `rclone copy` (never deletes remote files);
re-run it after adding a new episode to push only the new files.

## Point Vercel at R2

Vercel project → Settings → Environment Variables:

```
VITE_AUDIO_BASE = https://media.yourdomain.com      # your public bucket URL, NO trailing slash
```

Set it for Production (and Preview if you want previews to play audio), then redeploy.
Because `VITE_AUDIO_BASE` is read at build time (Vite inlines `import.meta.env`), a
**new deploy is required** after changing it.

## Verify

1. Open the deployed site, hit play → audio loads from `media.yourdomain.com` (check the
   Network tab; the request should 200 with `audio/mpeg`).
2. Covers load from the same host.
3. Local `npm run dev` still works with no `VITE_AUDIO_BASE` (serves from `public/`).

## Notes

- **Repo history still contains the old mp3s.** `.gitignore` + `git rm --cached` stop
  *future* growth, but past commits keep the binaries, so a fresh clone is still large.
  Slimming history requires a rewrite (`git filter-repo`) — a separate, destructive op;
  do it deliberately, not as part of this change.
- **CORS is mandatory** (see step 2b) because the audio elements use
  `crossOrigin="anonymous"` for the spectrum visualizer. Symptom of a missing/wrong CORS
  policy: audio silently fails to load on the deployed site while local dev works.
