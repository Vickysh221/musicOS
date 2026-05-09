"""
MiniMax T2A v2 — synthesize a transcript_zh from an episode.json into MP3.

Usage:
    python3 -m tools.tts_minimax \
        --episode episodes/rolling-stones_some-girls_miss-you.episode.json \
        --position 6 \
        --voice 'Chinese (Mandarin)_Sincere_Adult' \
        --output episodes/audio/spike/06_miss-you__sincere-adult.mp3

Reads MINIMAX_API_KEY and MINIMAX_GROUP_ID from environment, optionally
loading them from .env.local at the repo root.

Appends a record to episodes/audio/spike/spike_log.jsonl on every run.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parent.parent
LOG_PATH = ROOT / "episodes" / "audio" / "spike" / "spike_log.jsonl"
ENDPOINT = os.environ.get("MINIMAX_ENDPOINT", "https://api.minimaxi.com/v1/t2a_v2")
DEFAULT_MODEL = "speech-02-hd"


def load_env_local() -> None:
    env = ROOT / ".env.local"
    if not env.exists():
        return
    for raw in env.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip().strip("'").strip('"')
        if k and v and k not in os.environ:
            os.environ[k] = v


def get_transcript(episode_path: Path, position: int) -> tuple[str, dict]:
    data = json.loads(episode_path.read_text(encoding="utf-8"))
    for ex in data["exhibits"]:
        if ex.get("position") == position:
            text = ex.get("transcript_zh")
            if not text:
                raise SystemExit(f"position {position}: empty transcript_zh")
            return text, ex
    raise SystemExit(f"position {position}: not found in {episode_path}")


def synthesize(text: str, voice_id: str, api_key: str, group_id: str,
               model: str = DEFAULT_MODEL, subtitle: bool = False) -> tuple[bytes, dict]:
    body = {
        "model": model,
        "text": text,
        "stream": False,
        "voice_setting": {
            "voice_id": voice_id,
            "speed": 1.0,
            "vol": 1.0,
            "pitch": 0,
        },
        "audio_setting": {
            "sample_rate": 32000,
            "bitrate": 128000,
            "format": "mp3",
            "channel": 1,
        },
        "language_boost": "auto",
    }
    if subtitle:
        body["subtitle_enable"] = True
    url = ENDPOINT
    if "minimaxi.chat" in ENDPOINT:
        url = f"{ENDPOINT}?GroupId={group_id}"
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"HTTP {e.code}: {e.read().decode('utf-8', errors='replace')}")
    latency_ms = int((time.time() - t0) * 1000)

    base = payload.get("base_resp") or {}
    if base.get("status_code") not in (0, None):
        raise SystemExit(f"MiniMax error: {base}")

    audio_hex = (payload.get("data") or {}).get("audio")
    if not audio_hex:
        raise SystemExit(f"no audio in response: {payload}")
    meta = {"latency_ms": latency_ms, "extra_info": payload.get("extra_info")}
    # MiniMax returns subtitle as a URL (subtitle_file) when subtitle_enable=true.
    # Fetch it inline so callers receive a parsed [{text,time_begin,time_end}] list.
    sub_url = (payload.get("data") or {}).get("subtitle_file")
    if sub_url:
        try:
            with urllib.request.urlopen(sub_url, timeout=30) as r:
                meta["subtitle"] = json.loads(r.read().decode("utf-8"))
                meta["subtitle_source_url"] = sub_url
        except Exception as e:
            meta["subtitle_error"] = repr(e)
    return bytes.fromhex(audio_hex), meta


def log_run(record: dict) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--episode", required=True, type=Path)
    p.add_argument("--position", required=True, type=int)
    p.add_argument("--voice", required=True)
    p.add_argument("--output", required=True, type=Path)
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--subtitle", action="store_true",
                   help="request sentence-level timestamps; saves <output>.subtitle.json next to mp3")
    args = p.parse_args()

    load_env_local()
    api_key = os.environ.get("MINIMAX_API_KEY")
    group_id = os.environ.get("MINIMAX_GROUP_ID")
    if not api_key or not group_id:
        sys.exit("MINIMAX_API_KEY / MINIMAX_GROUP_ID not set (check .env.local)")

    text, exhibit = get_transcript(args.episode, args.position)
    print(f"position {args.position} · {len(text)} chars · voice={args.voice}")

    audio, meta = synthesize(text, args.voice, api_key, group_id, model=args.model,
                             subtitle=args.subtitle)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(audio)
    print(f"wrote {args.output} ({len(audio):,} bytes, {meta['latency_ms']} ms)")
    if args.subtitle and meta.get("subtitle"):
        sub_path = args.output.with_suffix(".subtitle.json")
        sub_path.write_text(json.dumps(meta["subtitle"], ensure_ascii=False, indent=2),
                            encoding="utf-8")
        print(f"wrote {sub_path} ({len(meta['subtitle'])} segments)")

    log_run({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "episode": str(args.episode.relative_to(ROOT)) if args.episode.is_absolute() else str(args.episode),
        "position": args.position,
        "artist": exhibit.get("artist"),
        "song": exhibit.get("song"),
        "voice_id": args.voice,
        "model": args.model,
        "input_chars": len(text),
        "output_bytes": len(audio),
        "latency_ms": meta["latency_ms"],
        "output_path": str(args.output.relative_to(ROOT)) if args.output.is_absolute() else str(args.output),
        "extra_info": meta.get("extra_info"),
    })


if __name__ == "__main__":
    main()
