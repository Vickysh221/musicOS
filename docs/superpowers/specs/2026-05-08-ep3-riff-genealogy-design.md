---
date: 2026-05-08
topic: ep3 riff genealogy — Black Sabbath as origin of riff-as-work aesthetic
status: design
mode: audio episode (ep3)
---

# ep3 — Riff Genealogy: From Black Sabbath's Tritone to Seven Nation Army's Single Note

## 1. Anchor

- **Anchor track:** Black Sabbath — *Black Sabbath* (1970-02-13, Vertigo)
- **Anchor album:** Black Sabbath (debut, self-titled)
- **Slug:** `black-sabbath_black-sabbath_black-sabbath`
- **Why this anchor:** the title track is widely cited as the inaugural artifact of "riff as work" — a song whose identity is its riff, built from the tritone (diabolus in musica), slow tempo, minimal motivic material, weight-prioritized arrangement. It defines a vocabulary that subsequent riff history either inherits, mutates, or rebels against.

## 2. Narrative axis

**Inversion axis (spec §6 mechanism extended):** the anchor's riff aesthetic — *tritone / slow / minimal motif / weight-first* — serves as an unchanging reference point. Every other node in the map is positioned by *how it responds to this aesthetic*:

- **Heirs** — direct inheritance of the weight-first contract (`direct_influence` edges)
- **Mutations** — preserve the "riff governs the song" logic but swap the underlying language (`hybridization` edges)
- **Inversions** — explicitly reject weight as the aesthetic center; use the riff slot for opposite values (`inversion` edges)

This axis was chosen over a pure timeline axis or a pure taxonomy axis because it best answers the user's underlying question (*"what are the mutual influences?"*) by making the influence relationship structural rather than chronological.

## 3. Tracklist (16 nodes)

### Pre-anchor — 2 tracks (Iommi's toolbox)

1. **Cream — *Sunshine of Your Love* (1967)** — heavy-blues riff template; single-line motif foregrounded
2. **Jimi Hendrix Experience — *Purple Haze* (1967)** — first mainstream tritone in an intro + distortion vocabulary; foreshadows doom

### Anchor — 1 track

3. **Black Sabbath — *Black Sabbath* (1970)** ★ — tritone, slow, minimal, weight-defining

### Heirs (direct_influence) — 3 tracks

4. **Black Sabbath — *Iron Man* (1970)** — descending "concrete-step" riff
5. **Black Sabbath — *Paranoid* (1970)** ★user-library — high-tempo inversion that proves riff logic is independent of speed
6. **Metallica — *Master of Puppets* (1986)** — riff scaled to architectural duration

### Mutations (hybridization) — 7 tracks

7. **Deep Purple — *Smoke on the Water* (1972)** ★user-library — minimization (4-note motif)
8. **Led Zeppelin — *Immigrant Song* (1970)** ★user-library — war-cry mutation (parallel/dialogic)
9. **Aerosmith — *Walk This Way* (1975)** ★user-library — funk-rock groove riff (head of groove sub-lineage)
10. **AC/DC — *Back In Black* (1980)** ★user-library — boogie purified into riff
11. **Ozzy Osbourne — *Crazy Train* (1980)** — neoclassical mutation (Rhoads); Ozzy's deliberate move *away* from Iommi's tritone vocabulary
12. **Rage Against the Machine — *Killing in the Name* (1992)** — funk-groove sub-lineage terminus (descendant of Walk This Way + Sabbath weight)
13. **Metallica — *Enter Sandman* (1991)** — hookification (weight + pop)

### Inversions — 3 tracks

14. **Guns N' Roses — *Sweet Child O' Mine* (1987)** — sweet arpeggio occupies the riff slot
15. **Nirvana — *Come As You Are* (1991)** ★user-library — chorus effect makes riff "weightless" / unsteady
16. **The White Stripes — *Seven Nation Army* (2003)** — bass single-note line impersonates a riff; rejection of riff complexity itself; **closing**

## 4. Four-act narrative arc

- **Act I · Origin (1967)** — tracks 1–2 — Iommi's toolbox before the riff was a thing
- **Act II · Day Zero (1970)** — tracks 3–6 — tritone touches ground; immediate heirs
- **Act III · Mutations (1972–1992)** — tracks 7–13 — seven translations of the weight contract
- **Act IV · Inversions (1987–2003)** — tracks 14–16 — three rejections; close on Seven Nation Army's extreme minimalism, which loops back to the anchor's own minimalism — inheritance and rebellion meet

## 5. Edge type budget

- `direct_influence` × ~5: Cream→Sabbath, Hendrix→Sabbath (tritone transmission), anchor→Iron Man, anchor→Paranoid, Sabbath→Master of Puppets
- `hybridization` × ~7: each mutation node has one edge to anchor or anchor-aesthetic
- `inversion` × ~3: each inversion node
- `same_era_dialogue` × ~1–2: 1970 Sabbath ↔ Immigrant Song parallel
- `methodological_descent` × 1: Walk This Way → Killing in the Name (groove method as the canonical classification for this pair, not direct_influence)

**Hypothesis-tier cap:** ≤ 15% of edges (spec §9.1 hard stop is 30%).

## 6. User library signals (★)

Five red-heart hits embedded as ground signals (not selection filters; per memory `feedback_episode_node_selection`):

- Paranoid (Sabbath) — focus signal in Act II
- Smoke on the Water, Immigrant Song, Back In Black, Walk This Way — Act III ground
- Come As You Are — Act IV pivot

These tracks anchor the listener's recognition; their density rises through Acts II–IV, supporting the closing-signal logic.

Ep2 already consumed: Layla, Free Bird, November Rain, Estranged, Don't Break My Heart, Won't Get Fooled Again, Paranoid Android, Fade to Black, Comfortably Numb. These are *not* re-used here even when present in the user library.

## 7. M-mechanism hooks (spec §6)

- **M1 translation_aesthetic (基因穿外套):** Crazy Train (neoclassical jacket over metal genes), Killing in the Name (funk jacket over metal weight)
- **M3 member_period_attention:** Ozzy's departure from Sabbath and choice of Rhoads is itself a *rejection of Iommi's tritone vocabulary*. Write into `crazy-train` node `member_dynamics` slot.

## 8. Sourcing red lines (per sourcing-principles §8)

Fact-tier double-source required for:
- Anchor release date (1970-02-13, Friday the 13th, Vertigo) — Wikipedia + AllMusic + Sabbath official
- Iommi industrial accident: year, age, affected fingers (right-hand middle + ring fingertips), date 1965 — Iommi memoir + interview source
- Riff key/mode for analytic claims (e.g., "Black Sabbath" in G, tritone G→C♯; Crazy Train in F♯m) — Hooktheory + sheet/score source
- Rhoads classical training (Musonia school, Dolores Rhoads) — biography + interview

Single-source-only material to **omit**:
- Specific equipment (amp head models, exact pickup years) unless dual-confirmed
- Personnel session details
- Chart positions beyond top-10 milestones

## 9. Production parameters

- **Form:** audio episode (ep3), parallel to ep1 (Miss You) and ep2 (Estranged)
- **Output paths:**
  - `maps/black-sabbath_black-sabbath_black-sabbath.map.json`
  - `playlists/black-sabbath_black-sabbath_black-sabbath.tracklist.json`
  - `playlists/black-sabbath_black-sabbath_black-sabbath.connections.json`
  - `episodes/black-sabbath_black-sabbath_black-sabbath.episode.md` (human-readable, review-first)
  - `episodes/black-sabbath_black-sabbath_black-sabbath.episode.json` (stitching manifest)
  - `data/nodes/<node_id>.json` × ~16 (reuse where existing)
- **Audio fusion dir:** `musicos-exhibition/public/audio_fusion/ep3/01..16_<artist-slug>_<track-slug>.mp3`
- **TTS pipeline:** existing (see `docs/episode_audio_pipeline.md`); apply YouTube fallback for any source unavailable in NetEase
- **Cover assets:** ensure all 16 covers in `musicos-exhibition/public/covers/` per CLAUDE.md naming `NN_<artist-slug>_<track-slug>.jpg`; use `tools/compress_cover.sh` after sourcing
- **Research budget:** ≤ 25 web_search, ≤ 15 web_fetch (spec §3 caps)

## 10. Scope cap (S1 confirmed)

16 tracks (1 over the 12–15 S1 cap, accepted because the two added tracks — Walk This Way + Killing in the Name — form a self-contained groove sub-lineage with explicit ancestor-descendant pairing, which strengthens rather than dilutes the inversion axis).

## 11. Hard stops (spec §9.1)

Stop and report if:
- Hypothesis-tier edges exceed 30%
- Any axis hits a hard cap and user has not extended budget
- < 60% of tracklist has working platform links

## 12. Out of scope

- Re-narrating tracks already in ep1/ep2 (no overlap, even when in user library)
- Doom/sludge/stoner deep dives (Sleep, Sunn O))), Electric Wizard) — these belong to a separate downstream-only episode if pursued later
- Pure timeline-axis treatment of "riff history" — explicitly rejected in favor of inversion axis (§2)
