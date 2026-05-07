#!/bin/bash
# Compress album covers: long edge ≤ 1200px, JPEG q=82, target ≤ 500KB
# Usage: ./tools/compress_cover.sh <file_or_dir>

if [[ -z "$1" ]]; then
  echo "Usage: ./tools/compress_cover.sh <file_or_dir>"
  exit 1
fi

target="$1"

compress_file() {
  local infile="$1"
  if [[ ! -f "$infile" ]]; then
    echo "❌ File not found: $infile"
    return 1
  fi

  # Get dimensions
  local dims=$(identify -format "%wx%h" "$infile" 2>/dev/null)
  if [[ -z "$dims" ]]; then
    echo "❌ $infile: Not a valid image"
    return 1
  fi

  local w=${dims%x*}
  local h=${dims#*x}
  local long_edge=$((w > h ? w : h))

  # Resize if needed (ImageMagick scales to long edge ≤ 1200)
  if [[ $long_edge -gt 1200 ]]; then
    convert "$infile" -resize 1200x1200\> -strip -quality 82 "$infile"
    echo "  ↓ Resized $w×$h → $(identify -format '%wx%h' "$infile")"
  else
    # Just recompress if already small enough
    convert "$infile" -strip -quality 82 "$infile"
  fi

  local size_kb=$(($(stat -f%z "$infile" 2>/dev/null || stat -c%s "$infile") / 1024))
  if [[ $size_kb -gt 500 ]]; then
    echo "⚠️  $(basename "$infile"): ${size_kb}KB (retrying q=75)"
    convert "$infile" -strip -quality 75 "$infile"
    size_kb=$(($(stat -f%z "$infile" 2>/dev/null || stat -c%s "$infile") / 1024))
  fi

  echo "✓ $(basename "$infile"): ${size_kb}KB"
  return 0
}

if [[ -f "$target" ]]; then
  compress_file "$target"
elif [[ -d "$target" ]]; then
  echo "Compressing covers in $target..."
  find "$target" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" \) | while read f; do
    compress_file "$f"
  done
  echo "✓ Done"
else
  echo "❌ Not a file or directory: $target"
  exit 1
fi
