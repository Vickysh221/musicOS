"""
Fetch full-length track MP3s from YouTube via yt-dlp, into
musicos-exhibition/public/audio/, named to match the existing
${position:02d}_${artist-slug}_${song-slug}.mp3 convention.

Manifest format (one per line, blank/# ignored):
    <video_id>|<filename_stem>

The resulting filename will be `<filename_stem>.mp3`.

Usage:
    python3 -m tools.fetch_audio_youtube tools/youtube_manifest.txt

Existing same-name MP3s are backed up to /tmp/audio_backup/ before overwrite.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "musicos-exhibition" / "public" / "audio"
BACKUP_DIR = Path("/tmp/audio_backup")


def fetch(video_id: str, stem: str) -> tuple[str, float | None]:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    target = AUDIO_DIR / f"{stem}.mp3"
    if target.exists():
        shutil.copy2(target, BACKUP_DIR / target.name)
    cmd = [
        "yt-dlp",
        "-x", "--audio-format", "mp3", "--audio-quality", "192K",
        "--force-overwrites",
        "-o", f"{stem}.%(ext)s",
        f"https://www.youtube.com/watch?v={video_id}",
    ]
    result = subprocess.run(cmd, cwd=AUDIO_DIR, capture_output=True, text=True)
    if result.returncode != 0:
        return f"FAIL: {result.stderr.strip().splitlines()[-1] if result.stderr else 'unknown'}", None
    if not target.exists():
        return "FAIL: no output mp3", None
    dur = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(target)], text=True).strip())
    return "OK", dur


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("usage: python3 -m tools.fetch_audio_youtube <manifest.txt>")
    manifest = Path(sys.argv[1])
    for raw in manifest.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        vid, _, stem = line.partition("|")
        vid, stem = vid.strip(), stem.strip()
        if not vid or not stem:
            print(f"skip (malformed): {raw}")
            continue
        status, dur = fetch(vid, stem)
        dur_s = f"{dur:.1f}s" if dur else "—"
        print(f"  {stem:<60} {dur_s:>8}  {status}")


if __name__ == "__main__":
    main()
