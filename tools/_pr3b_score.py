"""Backfill intrinsic_score on every ConnectionPair in Miss You ep 1.

Rubric (spec v0.4 §7B.12; connections-author SKILL Step 4b):
- story_drive       weight 0.30  (does the pair carry a narrative beat?)
- concrete_carrier  weight 0.25  (is there a concrete sonic/personnel/gear/scene anchor?)
- evidential_strength weight 0.20 (evidence_basis quality + source count)
- focus_relevance   weight 0.25  (does the pair speak to bassline_dna specifically?)

value = 0.30*sd + 0.25*cc + 0.20*es + 0.25*fr.

Scores below were authored by reading each pair's evidence basis,
kind, system_sensory_note, and the relative position of the two tracks
in the lineage. Higher score = stronger candidate for selected_as_strong.
"""
from __future__ import annotations
import json
from pathlib import Path
import statistics

PATH = Path("playlists/rolling-stones_some-girls_miss-you.connections.json")

# (story_drive, concrete_carrier, evidential_strength, focus_relevance, rationale)
SCORES: dict[str, tuple[float, float, float, float, str]] = {
    "conn_001_to_002_groove_dna": (0.85, 0.80, 0.85, 0.80, "Origin of locked drum-bass philosophy moving from a band format to one-person internalization — strong narrative beat, concrete personnel/scene anchor."),
    "conn_001_to_003_groove_dna": (0.90, 0.85, 0.90, 0.85, "Sigma Sound 'plastic soul' move with named studio + artist quote; strong story beat that frames the white-rock-borrows-funk arc the anchor inherits."),
    "conn_001_to_004_personnel_bridge_bass": (0.80, 0.95, 0.95, 0.90, "Named personnel (Bootsy Collins) bridging two named bands — concrete, well-documented, focus-relevant for bass lineage."),
    "conn_001_to_006_groove_dna": (0.80, 0.75, 0.80, 0.95, "Direct route into the anchor via Billy Preston demo; high focus relevance because anchor is the episode's pivot, slightly lower concrete carrier (demo provenance is partly oral)."),
    "conn_001_to_009_groove_dna": (0.65, 0.55, 0.65, 0.85, "Genealogical descent into disco bass refinement; story is real but the carrier here is methodological rather than personnel/gear-specific."),
    "conn_002_to_006_personnel_bridge_bass": (0.95, 0.95, 0.95, 0.95, "Billy Preston is the literal human bridge between Sly's circle and the Miss You session — most narratively load-bearing pair into the anchor."),
    "conn_002_to_007_groove_dna": (0.70, 0.85, 0.80, 0.70, "Concrete gear carrier (CR-78) parallels the rhythm-box-drives-bass logic; mid focus-relevance because primary kinship is rhythm-machine not bass per se."),
    "conn_002_to_011_groove_dna": (0.65, 0.55, 0.70, 0.65, "Eno's drum-loop methodology echoes Sly's one-person density; story is real but the specific bass evidence is thin."),
    "conn_002_to_013_groove_dna": (0.70, 0.65, 0.65, 0.55, "One-person-plays-everything thread; the inversion-by-deletion is striking but only tangentially about bass."),
    "conn_003_to_005_groove_dna": (0.65, 0.60, 0.70, 0.60, "Two white-pop borrowings of Black bass syntax; lateral kinship, mid-strength on each axis."),
    "conn_003_to_006_groove_dna": (0.90, 0.85, 0.85, 0.95, "Bowie's Fame is the anchor's direct US precedent — very high focus relevance and narrative drive into the pivot."),
    "conn_003_to_007_groove_dna": (0.55, 0.45, 0.55, 0.50, "Lateral peer pair; the punk-side translation is narratively interesting but not the strongest of Blondie's inbound lines."),
    "conn_003_to_013_groove_dna": (0.60, 0.55, 0.55, 0.50, "Sole-artistic-authority thread; thematic but a long jump from Bowie to Prince in bass terms."),
    "conn_004_to_012_groove_dna": (0.55, 0.50, 0.55, 0.60, "Possible P-Funk weight in Deacon's riff is musicological but not the load-bearing line into Queen — Chic→Queen is the documented one."),
    "conn_004_to_014_bassline_prototype": (0.85, 0.90, 0.90, 0.95, "Bootsy lineage to Flea is documented + audible; very high focus relevance for bass slap."),
    "conn_004_to_015_groove_dna": (0.70, 0.75, 0.80, 0.75, "P-Funk low end resampled by nu-disco revival; the loop-sample lineage is concrete and well-traced."),
    "conn_004_to_017_groove_dna": (0.65, 0.55, 0.55, 0.85, "Bass-as-anchor recording-order shared between two bass-priority units; high focus relevance, weaker historical evidence."),
    "conn_005_to_006_groove_dna": (0.95, 0.85, 0.90, 0.95, "Stayin' Alive is the disco template Miss You explicitly borrows-and-distances from — top-tier story drive into the anchor."),
    "conn_005_to_009_bassline_prototype": (0.75, 0.70, 0.75, 0.85, "Disco bass-front-line idea refined from Bee Gees to Chic; clear genealogical descent in bass priority."),
    "conn_005_to_016_bassline_prototype": (0.70, 0.85, 0.85, 0.75, "Kevin Parker has named Saturday Night Fever as a starting point — concrete artist quote, but the throughline crosses 38 years."),
    "conn_005_to_018_groove_dna": (0.55, 0.45, 0.45, 0.55, "Bass-driven dance-pop feel into Mk.gee's bedroom; thematic but evidence is sensory-only."),
    "conn_006_to_007_groove_dna": (0.90, 0.85, 0.85, 0.85, "Same-year same-move lateral pair; the 1978 doubling is the most quotable beat in the episode's middle."),
    "conn_006_to_009_groove_dna": (0.85, 0.80, 0.80, 0.95, "Miss You's outbound to Chic — anchor → most-sampled disco bassline ever; the lineage's downstream pivot."),
    "conn_006_to_012_groove_dna": (0.70, 0.65, 0.70, 0.75, "Miss You template echoed by Queen two years later; valid but Chic→Queen tells the same story more directly."),
    "conn_007_to_010_groove_dna": (0.65, 0.60, 0.60, 0.65, "Same-year post-punk inversion; the up-but-cold direction is narratively useful, evidence is musicological."),
    "conn_007_to_011_groove_dna": (0.70, 0.65, 0.70, 0.60, "Drum-machine/loop-first lineage from Blondie into Talking Heads; relevant but methodological more than bass-specific."),
    "conn_009_to_012_bassline_prototype": (0.95, 0.95, 0.95, 0.95, "Deacon at Edwards' side, then Another One Bites the Dust — the cleanest documented bassline transplant in pop."),
    "conn_009_to_015_personnel_bridge_bass": (0.85, 0.95, 0.95, 0.85, "Same player, same Stratocaster, 34 years apart — rare gear+personnel double bridge with strong public record."),
    "conn_010_to_011_groove_dna": (0.55, 0.50, 0.55, 0.55, "Same-year polyrhythmic vs cold-space split; useful as a same-moment-two-paths beat but kinship is broad."),
    "conn_010_to_016_bassline_prototype": (0.70, 0.75, 0.70, 0.80, "Peter Hook's high-register voicing reprised in Tame Impala; concrete voicing-choice pairing."),
    "conn_011_to_015_groove_dna": (0.65, 0.55, 0.55, 0.60, "Build-rhythm-first method revived in Daft Punk's RAM; valid lineage, sensory-leaning evidence."),
    "conn_011_to_017_groove_dna": (0.75, 0.70, 0.65, 0.85, "Tina Weymouth → Laura Lee clean-melodic-phrase bass; high focus-relevance, well-observed but musicological."),
    "conn_012_to_014_groove_dna": (0.60, 0.60, 0.60, 0.65, "Bass-leads-skeleton stance Queen→RHCP; valid but RHCP's stronger lineage is via Bootsy."),
    "conn_012_to_017_groove_dna": (0.55, 0.50, 0.50, 0.65, "Bass-as-axis priority from Queen to Khruangbin; thematic, weak evidence beyond audible kinship."),
    "conn_013_to_014_groove_dna": (0.60, 0.55, 0.60, 0.55, "Two divergent Bootsy descendants (delete-the-bass vs maximize-the-bass); narrative inversion but not bass-canonical."),
    "conn_013_to_016_groove_dna": (0.75, 0.85, 0.80, 0.75, "One-person-records-everything line Prince→Parker; documented and sonically traceable in the home-studio aesthetic."),
    "conn_013_to_018_groove_dna": (0.70, 0.65, 0.70, 0.65, "Critic-named lineage Prince→Mk.gee; the 'bedroom auteur' frame is real and current."),
    "conn_014_to_018_groove_dna": (0.55, 0.55, 0.50, 0.60, "Bass-locks-to-drum-pulse ported into bedroom programming; thematic but largely sensory."),
    "conn_015_to_016_groove_dna": (0.65, 0.60, 0.60, 0.65, "Same-window nu-disco low end into psychedelia; concurrence is the story, not a hand-to-hand transfer."),
    "conn_015_to_017_gear_lineage_bass": (0.75, 0.85, 0.75, 0.95, "Analog-warm bass texture shared across Daft Punk/Khruangbin recording aesthetics — high focus relevance for gear lineage."),
    "conn_016_to_018_groove_dna": (0.60, 0.55, 0.55, 0.65, "Bedroom one-person-bass-programming continuum into 2024; valid coda kinship, sensory-evidence."),
}


def aggregate(sd: float, cc: float, es: float, fr: float) -> float:
    return round(0.30 * sd + 0.25 * cc + 0.20 * es + 0.25 * fr, 3)


def main() -> None:
    data = json.loads(PATH.read_text())
    pairs = data["connection_pairs"]
    if set(p["id"] for p in pairs) != set(SCORES):
        diff = set(p["id"] for p in pairs) ^ set(SCORES)
        raise SystemExit(f"id set mismatch; symmetric diff: {sorted(diff)}")
    values = []
    for p in pairs:
        sd, cc, es, fr, rationale = SCORES[p["id"]]
        v = aggregate(sd, cc, es, fr)
        values.append(v)
        p["intrinsic_score"] = {
            "value": v,
            "dimensions": {
                "story_drive": sd,
                "concrete_carrier": cc,
                "evidential_strength": es,
                "focus_relevance": fr,
            },
            "rationale": rationale,
        }
    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"OK: scored {len(pairs)} pairs")
    print(f"  value range: {min(values):.3f} – {max(values):.3f}")
    print(f"  median:      {statistics.median(values):.3f}")
    print(f"  stdev:       {statistics.stdev(values):.3f}")


if __name__ == "__main__":
    main()
