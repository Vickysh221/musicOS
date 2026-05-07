# Episode 04 Design — Dorantes / Orobroy

**Date:** 2026-05-07
**Status:** Approved — entering anchor expansion (spec §3 workflow)
**Prior episodes:** ep1 Miss You (Rolling Stones), ep2 Estranged (Guns N' Roses), ep3 Black Sabbath / riff genealogy (in flight per `2026-05-08-ep3-riff-genealogy-design.md`)

---

## Anchor

**Song:** Orobroy — Dorantes
**Special framing:** Dual-version anchor. The episode embeds **both** the 1998 original (from album *Orobroy*) and the 2010 *Nueva versión* (from *El tiempo por testigo... A Sevilla*) and treats the gap between them as a narrative device — the composer self-translating across 12 years.

**Slug:** `dorantes_orobroy_orobroy`

## Why this anchor

The user's red-heart library shows a 5-year, three-wave evolution toward this exact point:

1. **2023-08 → 2024-01** — Latin/Iberian periphery: Buena Vista Social Club, Otros Aires, Gotan Project, Piazzolla, Gipsy Kings, Rodrigo y Gabriela, Spanish-guitar series.
2. **2025-05** — Cuban jazz/funk hardening: PALO!, Irakere, Patato Valdés, Chico Mendoza.
3. **2025-11 → 2026-05 (live)** — Flamenco hondo descent: Dorantes (Orobroy + Agua, Aire y Fuego with Lebrijano), Carmen Linares (Lorca songs), David Lagos, Manuel Carrasco. The most recent red-heart hits (2026-05-04) are deep flamenco — the user is still inside this line.

**User aesthetic fit (spec §6):**
- **M1 translation_aesthetic:** Orobroy is a textbook M1 case — jazz piano language + bulería compás + cante jondo melisma + Caló-language title. Triple-coated, all layers still legible. The dual-version anchor sharpens M1 by adding self-translation as a second axis.
- **M4 frequency_hollowing:** Orobroy (especially 1998 version) is exceptionally sparse — solo piano, wordless vocal, large silences. Matches the user's documented hollowing preference.
- **Female art-pop sub-line:** flamenco's strong female vocal tradition (Carmen Linares, Esperanza Fernández, Buika, Silvia Pérez Cruz, Rosalía, María José Llergo) extends the user's existing female-led art-pop pattern (王菲 / 椎名林檎 / L'Impératrice / Caro Emerald).

**Triangle with prior episodes:**
- Miss You — Anglo rock × Black music translation
- Estranged — Anglo rock × orchestral/classical
- Orobroy — Iberian/Romani roots × jazz × classical (first non-Anglo, non-Asian episode in the vault)

## Scope

- **Axis weights (R4 balanced):** upward 15 / lateral 12 / downward 20 — spec defaults
- **Length:** ~20 stops, aligned with Miss You and Estranged
- **Mode:** audio episode (per spec §7B) plus playlist; pipeline TBD per `docs/episode_audio_pipeline.md`

## Narrative arc (preliminary 20-stop sketch)

| # | Function | Track (placeholder — track-curator will finalize) |
|---|---|---|
| 1 | Anchor entry (user's ear) | **Dorantes — Orobroy (2010 Nueva versión)** |
| 2–7 | Upward (6 stops) | Bill Evans / Keith Jarrett · Chano Domínguez · Paco de Lucía · Camarón de la Isla · Pata Negra (*Blues de la Frontera*) · Albéniz or Falla |
| 8–12 | Lateral (5 stops) | Diego El Cigala × Bebo Valdés (*Lágrimas Negras*) · Tomatito × Michel Camilo (*Spain*) · Vicente Amigo · Lebrijano (in-library closure via *Agua, Aire y Fuego*) · Esperanza Fernández / Niña Pastori |
| 13 | Anchor return — naked | **Dorantes — Orobroy (1998 original)** |
| 14–19 | Downward (6 stops) | Buika · Silvia Pérez Cruz · María José Llergo · Rosalía · C. Tangana / Niño de Elche · Nathy Peluso |
| 20 | Library closing signal | David Lagos or Carmen Linares (user red-heart, 2026 — closes the listening arc) |

**Why 1998 sits at stop 13, not stop 20:** by the time the listener has been through 12 stops of context, the bare 1998 version becomes anti-climactic in a productive way — they can hear what the 2010 orchestration *added* and what it *covered*. The episode becomes a perceptual recalibration, not a chronology.

## In-library closure signals (for self-check §9.3)

- Lebrijano voice already in red-heart (*Agua, Aire y Fuego*, 2025-11-27) — upward root evidence is present in user's own ear
- Carmen Linares, David Lagos, Manuel Carrasco — three deep-flamenco singers in red-heart, available for stop 20
- Buena Vista Social Club cluster — provides the lateral bridge to Cigala × Bebo
- Rodrigo y Gabriela / Gipsy Kings — downward popularization counterweight if needed

## Sourcing constraints (per `docs/superpowers/plans/sonic_cartography_sourcing_principles.md`)

- Fact-tier claims (chart positions, personnel, recording dates, Caló etymology, compás identification) require ≥2 independent sources, ≥1 Tier 1–2.
- Extra caution on: Pata Negra session personnel · Camarón / Paco partnership timeline · Dorantes biography (Lebrija family lineage) · Caló vocabulary · Rosalía's specific flamenco-form citations.
- Run §8 self-check before delivery.

## Hard stops to watch

- If upward axis can't reach 15 with ≥60% platform-linked tracks, scope down rather than pad with hypothesis-tier nodes.
- If hypothesis-tier edges exceed 30% during expansion, pause and downgrade or drop.

## Next step

Hand off to **track-curator** skill with `(anchor_song = Dorantes — Orobroy, episode_focus = self-translation across the 1998↔2010 gap, with R4 balanced axes)`.
