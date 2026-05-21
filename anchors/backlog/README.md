# Anchor backlog

Parking lot for anchor ideas that aren't ready for expansion yet — a record store find, a passing thought, a friend's recommendation. Each idea lives as a single `*.idea.md` file with structured frontmatter + free-form notes. Future agent sessions can `ls anchors/backlog/` to recover them.

This folder is **upstream** of `maps/`, `playlists/`, `episodes/`. Once an idea is greenlit, run the standard Anchor expansion workflow (see `CLAUDE.md`) using the idea file as the starting brief, then update the idea's `status` to `in_progress` / `done` (or move to `shelved/` if dropped).

---

## File naming

`<artist-slug>_<album-slug>_<primary-track-slug>.idea.md` — same slug convention as maps/. If the anchor track is undecided, pick the most likely default and flag it under `open_decisions`.

## Frontmatter schema

```yaml
---
slug: <slug>                          # matches filename
candidate_anchor:
  artist: <string>
  album: <string>
  album_year: <int | string>
  label: <string>
  track_default: <string>             # the default track within the album; may change
status: idea | scoped | in_progress | done | shelved
surfaced_on: YYYY-MM-DD               # date the idea was first parked
source: <one-line origin>             # e.g. "record-store find", "user red-heart deep cut", "friend rec @alex"
tags: [<freeform>, ...]               # optional: scene/era/mood keywords for grep
---
```

## Body sections (suggested, not required)

- **Why it's a candidate** — what hooked you (or the user)
- **Coverage signal in user library** — overlap with `data/user_tracks.json` red hearts
- **Possible focus axes** — Phase 0 candidates per spec §3.5
- **Open decisions** — checklist of unresolved choices before kickoff
- **Research breadcrumbs** — links, half-formed thoughts, source URLs gathered casually

Keep entries lightweight. The point is recall, not completeness — full research happens during actual expansion.

## Status lifecycle

- `idea` — parked, no commitment to expand
- `scoped` — focus axis + paradigm decided, ready to start
- `in_progress` — map being built; the corresponding `maps/<slug>.map.json` exists
- `done` — fully expanded; map + playlist (+ episode if applicable) shipped
- `shelved` — decided not to pursue; keep the file for memory but skip in active triage

## Current backlog

<!-- Maintain this list manually when adding/removing idea files. One line each. -->

- [ramsey-lewis-trio_the-in-crowd_the-in-crowd](ramsey-lewis-trio_the-in-crowd_the-in-crowd.idea.md) — Soul-jazz crossover (1965 Bohemian Caverns live). Record-store find, 2026-05-11. Status: `in_progress` (2026-05-18, map written, 20 nodes / 29 edges, awaiting Phase 0 track-curator).
