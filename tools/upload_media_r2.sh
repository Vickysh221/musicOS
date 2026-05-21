#!/usr/bin/env bash
# Mirror exhibition media (audio + covers) to a Cloudflare R2 bucket.
#
# Production playback resolves URLs against VITE_AUDIO_BASE (set in Vercel) via
# src/lib/asset-url.ts. This script pushes the local public/ media to R2 using
# the SAME relative paths the app requests, so /audio_fusion/ep1/01_x.mp3 maps to
# <VITE_AUDIO_BASE>/audio_fusion/ep1/01_x.mp3.
#
# Prerequisites:
#   1. brew install rclone   (or see https://rclone.org/install/)
#   2. Configure an R2 remote once:  rclone config
#        - name:    r2   (or override with R2_REMOTE below)
#        - type:    s3
#        - provider: Cloudflare
#        - access_key_id / secret_access_key: from R2 > Manage API Tokens
#        - endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
#      Leave region blank.
#
# Usage:
#   R2_BUCKET=musicos-media bash tools/upload_media_r2.sh           # full sync
#   R2_BUCKET=musicos-media bash tools/upload_media_r2.sh --dry-run # preview only
#
# Env overrides:
#   R2_REMOTE   rclone remote name (default: r2)
#   R2_BUCKET   target bucket name (required)
set -euo pipefail

R2_REMOTE="${R2_REMOTE:-r2}"
R2_BUCKET="${R2_BUCKET:?set R2_BUCKET to your R2 bucket name}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PUBLIC_DIR="$SCRIPT_DIR/../musicos-exhibition/public"

if ! command -v rclone >/dev/null 2>&1; then
  echo "error: rclone not found. Install with 'brew install rclone' or see https://rclone.org/install/" >&2
  exit 1
fi

DEST="${R2_REMOTE}:${R2_BUCKET}"

# Long-lived, content-addressed-ish media → cache hard at the CDN edge.
COMMON_FLAGS=(
  --progress
  --transfers 16
  --checkers 32
  --s3-no-check-bucket
  --header-upload "Cache-Control: public, max-age=31536000, immutable"
)
# Pass --dry-run (or any extra rclone flags) straight through.
EXTRA_FLAGS=("$@")

for sub in audio_fusion audio covers; do
  src="$PUBLIC_DIR/$sub"
  if [ ! -d "$src" ]; then
    echo "skip: $src does not exist"
    continue
  fi
  echo "==> uploading $sub -> $DEST/$sub"
  # 'copy' never deletes remote files. To prune files removed locally, swap to
  # 'rclone sync' manually after a --dry-run.
  # EXTRA_FLAGS may be empty; the ${arr[@]+...} guard avoids "unbound variable"
  # under `set -u` on macOS's bash 3.2.
  rclone copy "$src" "$DEST/$sub" "${COMMON_FLAGS[@]}" ${EXTRA_FLAGS[@]+"${EXTRA_FLAGS[@]}"}
done

echo "done. Set VITE_AUDIO_BASE in Vercel to your bucket's public URL (no trailing slash)."
