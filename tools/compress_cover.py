#!/usr/bin/env python3
"""
Compress album covers to standard format: long edge ≤ 1200px, JPEG q=82, target ≤ 500KB.
Usage:
  python tools/compress_cover.py <input_path> [output_path]
  python tools/compress_cover.py --batch musicos-exhibition/public/covers/
"""
import sys
from pathlib import Path
from PIL import Image
import os

def compress_cover(input_path: str, output_path: str = None) -> bool:
    """
    Compress a single cover image.
    Returns True if file was modified, False if already optimized.
    """
    infile = Path(input_path)
    if not infile.exists():
        print(f"❌ File not found: {input_path}")
        return False

    outfile = Path(output_path) if output_path else infile

    try:
        img = Image.open(infile)
        w, h = img.size

        # Resize if needed
        long_edge = max(w, h)
        target = 1200
        if long_edge > target:
            ratio = target / long_edge
            new_w, new_h = int(w * ratio), int(h * ratio)
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            print(f"  ↓ Resized {w}×{h} → {new_w}×{new_h}")

        # Convert RGBA to RGB if needed
        if img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = rgb_img

        # Save as JPEG with quality 82
        img.save(outfile, 'JPEG', quality=82, optimize=True)
        size_kb = outfile.stat().st_size / 1024

        if size_kb > 500:
            print(f"⚠️  {outfile.name}: {size_kb:.0f}KB (exceeds 500KB target, retrying q=75)")
            img.save(outfile, 'JPEG', quality=75, optimize=True)
            size_kb = outfile.stat().st_size / 1024

        status = "✓" if size_kb <= 500 else "⚠️"
        print(f"{status} {outfile.name}: {size_kb:.0f}KB")
        return True

    except Exception as e:
        print(f"❌ {infile.name}: {e}")
        return False

def batch_compress(dir_path: str) -> int:
    """Compress all covers in a directory."""
    covers_dir = Path(dir_path)
    if not covers_dir.is_dir():
        print(f"❌ Directory not found: {dir_path}")
        return 1

    patterns = ['*.jpg', '*.jpeg', '*.png', '*.webp']
    files = []
    for pattern in patterns:
        files.extend(covers_dir.glob(pattern))

    if not files:
        print(f"No cover images found in {dir_path}")
        return 0

    print(f"Compressing {len(files)} covers...")
    count = 0
    for f in sorted(files):
        if compress_cover(str(f)):
            count += 1

    print(f"\n✓ Compressed {count} files")
    return 0

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python tools/compress_cover.py <input_path> [output_path]")
        print("  python tools/compress_cover.py --batch <dir>")
        sys.exit(1)

    if sys.argv[1] == '--batch':
        if len(sys.argv) < 3:
            print("Usage: python tools/compress_cover.py --batch <dir>")
            sys.exit(1)
        sys.exit(batch_compress(sys.argv[2]))
    else:
        output_path = sys.argv[3] if len(sys.argv) > 3 else None
        compress_cover(sys.argv[1], output_path)
