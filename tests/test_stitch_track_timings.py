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
