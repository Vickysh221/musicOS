"""Tests for fusion_style resolution: prefer exhibit field, fall back to dict."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from tools.batch_fusion import resolve_style  # noqa: E402


def test_resolve_style_prefers_exhibit_field():
    ex = {"position": 5, "fusion_style": "B"}
    assert resolve_style(ex, fallback={5: "C"}) == "B"


def test_resolve_style_falls_back_to_dict():
    ex = {"position": 5}
    assert resolve_style(ex, fallback={5: "C"}) == "C"


def test_resolve_style_returns_none_if_neither():
    ex = {"position": 99}
    assert resolve_style(ex, fallback={5: "C"}) is None


def test_resolve_style_ignores_dict_when_field_present():
    ex = {"position": 5, "fusion_style": "PASSTHROUGH"}
    assert resolve_style(ex, fallback={5: "C"}) == "PASSTHROUGH"
