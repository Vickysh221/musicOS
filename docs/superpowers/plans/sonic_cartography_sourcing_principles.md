# Sonic Cartography — Sourcing Principles for Generative Tasks

**Document type**: Operational rules for agent research behavior
**Primary reader**: Claude Code agent
**Scope**: Applies to every task in the Sonic Cartography pipeline that produces written content — map node descriptions, edge evidence, playlist annotations, episode narration, fact-check passes.
**Status**: Standalone reference. Read this **before** beginning any generative task. Re-read when in doubt.

---

## 0. What this document is

This is not a spec patch. The Sonic Cartography spec (v0.3) defines **what** the agent produces. This document defines **how the agent must research** the content of that production — specifically, the standard of evidence required to make any factual claim.

The single core rule: **Double reference for fact-tier claims.**

Everything else in this document elaborates that rule: what counts as independent reference, when the rule is more strictly applied, when downgrading is mandatory, and how to handle the budget pressure this rule creates.

---

## 1. The double reference rule

> **Any claim tagged or implied as `fact` must be supported by ≥2 independent sources, where at least 1 source is Tier 1 or Tier 2 (per spec §4.3).**

If the agent cannot meet this standard for a particular claim, the claim must be either:

- **(a)** Rewritten so it is no longer presented as a fact-tier statement
- **(b)** Downgraded to `consensus` (if there is ≥1 Tier 3 source)
- **(c)** Downgraded to `hypothesis` (if there is no source, or only Tier 4-5 / forum / fan content)
- **(d)** Removed entirely (if the claim is not load-bearing for the surrounding text)

The agent does NOT proceed with an unsupported fact-tier claim and "hope it's right." That behavior is the failure mode this document exists to prevent.

---

## 2. What "independent" means

Two sources are independent only if they were produced by separate research processes. The following are **not** independent:

### 2.1 Same-document repeats
- Two different sentences from the same Wikipedia article = 1 source, not 2.
- An article and its bibliography entry of the same article = 1 source.
- The same artist interview quoted in three different blogs = 1 source (the interview).

### 2.2 Mirror sites and content farms
- Wikipedia and any Wikipedia mirror (Fandom wikis, simplified-language Wikipedia clones, AI-rewritten Wikipedia summaries) count as 1 source.
- Any site whose content visibly tracks Wikipedia's structure and phrasing is a mirror.

### 2.3 Citation chains
- If Source B cites Source A as its origin for a claim, B does not constitute an independent verification of A. B is part of A's citation chain.
- The agent must trace each apparent independent source back to its actual origin. If two "independent" sources both trace to the same primary source, that primary source counts as 1.

### 2.4 AI-generated or AI-rewritten content
- Content from sites that openly use generative AI for music encyclopedia entries (some recent Substacks, some SEO-driven music blogs) is NOT a valid source at any tier. The agent should recognize and exclude such sources.
- A general signal: if a site has dozens of detailed encyclopedia-style entries on niche topics with no human author bylines, treat as AI-generated and exclude.

### 2.5 What IS independent
Independent sources include:
- A Wikipedia article AND a separate book / academic source
- A primary interview in The Guardian AND a Wikipedia article that cites that interview AND adds its own corroborating personnel data → counts as 2, because the Wikipedia entry is sourcing additional facts beyond the interview
- Two separate primary interviews with the same artist in different outlets at different times
- A chart archive (Billboard.com, Official Charts) AND an interview citing the same chart event
- Liner notes of a release AND a contemporary review of the same release

---

## 3. Claim types and their evidentiary thresholds

Not all claims need the same level of support. The agent calibrates by claim type.

### 3.1 Hard facts (highest bar)

These include:
- Chart positions, dates, peak weeks
- Release dates (singles, albums)
- Personnel listings (who played what)
- Direct quotations attributed to a named person
- Recording dates and locations
- Equipment used (specific synthesizer model, guitar, drum machine)
- Sales / certifications

**Required**: ≥2 independent sources, at least 1 Tier 1-2.

For direct quotations specifically: the agent should locate the **original publication** of the quote whenever possible, not rely on transcribed versions in fan sites or social media. If only a secondary source can be found, the quotation is downgraded to consensus and rephrased indirectly ("Parker has described the experience as...") rather than presented as a direct quote.

### 3.2 Interpretive consensus claims (medium bar)

These include:
- "X influenced Y" (where the influence is widely discussed but not declared by the artists themselves)
- Genre lineage statements
- Comparisons of style or technique that are commonly accepted in critical literature
- Album reception summaries

**Required**: ≥1 Tier 3 source (music journalism, in-depth blog, scholarly secondary literature). Multiple Tier 3 sources strengthen the claim. **Tag as `consensus`.**

If only fan-tier sources exist, downgrade to hypothesis.

### 3.3 Working hypotheses (lowest bar but most explicit)

These include:
- Connections drawn by the agent that are not present in any documented source
- Methodological lineage observations (e.g. the Talking Heads → Khruangbin loop-method connection)
- Aesthetic pattern recognition that synthesizes multiple documented facts into a new claim
- Inversions / contrasts that the agent identifies for narrative purposes

**Required**: explicit labeling as `hypothesis`. No source verification needed because no source claim is being made — the agent is openly synthesizing.

**However**: the surface-level facts the hypothesis is built ON must each meet their own evidentiary threshold. A hypothesis that connects two fact-tier observations is legitimate. A hypothesis that connects two unverified observations is double-speculation and not acceptable.

The phrase "agent synthesis — connection not previously documented in published sources" must appear in the `sources` field for hypothesis-tier edges.

### 3.4 Direct quotations (most strict)

When quoting a person directly (using quotation marks around their alleged words), the agent must:
1. Locate the **original publication** of the quote (the magazine, book, interview transcript)
2. Verify the wording matches the original within reasonable transcription tolerance
3. Cite the original publication, not a secondary aggregator

If the original cannot be found within reasonable search budget:
- Convert to indirect speech ("X has described / X has said that...")
- Mark `consensus` instead of `fact`
- Remove the quotation marks

**Never invent or paraphrase a quote into quotation marks.** This is the most damaging form of fabrication because it puts words in real people's mouths.

---

## 4. Search budget — making the rule sustainable

The double reference rule, applied naively to every claim in a 30-node map, would cost hundreds of searches. This is unsustainable. The agent calibrates search effort per claim using these rules.

### 4.1 Budget allocation per claim

Not all claims deserve equal effort. The agent allocates based on:

**(i) Load-bearing**: how essential is this claim to the surrounding narrative?
- Anchor node central facts (chart success, recording date, personnel) → high effort, full double reference
- Peripheral color (a stray statistic, an interesting aside) → low effort, downgrade to consensus or remove if not easily verified

**(ii) Risk of error**: how plausible is it that the agent's training data is wrong?
- Specific chart events, exact dates, exact personnel: HIGH risk (training data has many subtle errors here) → full double reference
- Broad stylistic descriptions, well-known facts about famous works: LOWER risk (still verify, but a single Tier 1-2 source can suffice if doubly-cross-checked is impractical)

**(iii) Citability of the topic**: some facts have abundant documentation, others have none.
- 1970s major-label rock: well documented → easy double reference
- Niche international music, obscure session musicians: poorly documented → may legitimately have only 1 source. In that case, downgrade to consensus, do not pretend to fact.

### 4.2 Budget pressure decision tree

When the agent realizes a particular claim will require disproportionate search effort:

```
Is this claim load-bearing for the surrounding text?
├── Yes → invest the search effort, even if it goes over typical budget
│         If still cannot verify after reasonable effort → downgrade and rewrite
└── No  → downgrade or remove without further search
```

When the agent realizes the **task as a whole** is approaching its overall search budget:

```
Are there still load-bearing fact-tier claims un-verified?
├── Yes → continue searching for those, allow other claims to remain at consensus
└── No  → wrap up; what's done is good enough; mark unsearched claims appropriately
```

The agent does NOT silently reduce evidence quality to stay under budget. It either invests the search or downgrades the claim. **Both are honest choices; secretly fact-claiming an unverified statement is not.**

### 4.3 Reporting search activity

In the final deliverable's `expansion_notes` (per spec §3.2 and §7B.2), the agent reports:
- Total web searches performed
- Number of fact-tier claims, consensus claims, hypothesis claims
- Any specific claims where the agent ran out of search budget and had to downgrade — name them, so the user can manually verify if they care

This transparency is what allows the user to trust the rest of the output.

---

## 5. Failure paths and degraded delivery

### 5.1 No source found

If the agent searches and finds no source for a claim it had intended to make:
- **Default action**: remove the claim, do not write it
- **Exception**: if removing it leaves a structural gap (e.g., the claim is the connecting tissue between two exhibits), rewrite as `hypothesis` with explicit "agent synthesis — no documented source" tag

### 5.2 Single source found

If only 1 source is found and double reference cannot be met:
- **If Tier 1-2 source**: downgrade to `consensus`, keep the claim, cite the single source
- **If Tier 3 source**: downgrade to `consensus`, keep with caution
- **If Tier 4-5 source**: downgrade to `hypothesis`, mark as such, OR remove

### 5.3 Conflicting sources

If two sources contradict each other:
- **DO NOT silently pick one and omit the other.** This is the worst-case behavior — the agent appearing certain about a contested fact.
- **Action**: write the claim as a contested fact, naming both versions.
  - Example: "Sources differ on whether [X] occurred in 1977 (per [source A]) or 1978 (per [source B]); the question has not been definitively resolved."
- **Or**: downgrade to consensus and use hedged language.
- **Mark `epistemic_layer` as `consensus` with a note about the conflict in the `notes` field.**

### 5.4 Source found but it's clearly wrong

Sometimes a Tier 1-2 source contains an obvious error (a factual contradiction with other Tier 1-2 sources, an internal inconsistency). When this is detected:
- The agent does NOT propagate the error.
- The agent reports the apparent error in `expansion_notes`.
- The claim is rewritten or removed based on what the **other** sources say.

---

## 6. Categories where extra caution is required

These topic areas have higher rates of error in casual sources, including in the agent's training data. Apply double reference particularly strictly:

### 6.1 Billboard / chart history
Specific peak positions, peak dates, weeks at #1 — these are constantly misstated even in major outlets. **Verify against Billboard.com directly or chart archive sites whenever possible.**

### 6.2 Personnel attribution
Who played bass / drums / produced on a famous track is often misattributed. Session musicians are particularly underattributed. Verify via Discogs, AllMusic, or liner notes.

### 6.3 Equipment specifics
"Recorded with a Linn LM-1" vs "Linn LM-2" vs "LinnDrum" — these are consistently confused even in equipment-focused press. Cross-reference at least one equipment-specialist source (Reverb, Sound on Sound, MusicRadar gear features).

### 6.4 Specific anecdotes about songwriting / studio events
These tend to mythologize over time. Find the **earliest** documented version of the anecdote whenever possible — later retellings often add details that weren't in the original.

### 6.5 Cross-cultural claims
"X is influenced by Thai funk" / "Y was inspired by Japanese kayōkyoku" — these claims often appear without solid sourcing because they're appealing narratives. Look for the artist's own statement of the influence, not a third-party assertion.

### 6.6 Death dates, ages at recording, family relationships
Surprisingly error-prone. Cross-reference at least 2 sources.

---

## 7. What this rule is NOT

To prevent over-application:

### 7.1 Not for hypothesis-tier content
Working hypotheses that the agent identifies as such (per §3.3) do not require double reference. The hypothesis label IS the evidentiary disclosure.

### 7.2 Not for stylistic / interpretive language
"Stevie Wonder's bassline grooves harder than..." or "the harmonica feels untethered from the song's nominal key" are interpretive observations, not fact claims. They don't need sources unless presented as someone else's interpretation.

### 7.3 Not for direct musical observation
"The drum pattern is four-on-the-floor" or "the song is in A minor" are observations the agent makes from the music itself. As long as these are correct, they're fact-tier without needing literary citation. (However: if the agent is unsure, it can verify against music theory analyses, which are usually Tier 3.)

### 7.4 Not for the user's own data
Coverage status (whether a track is in the user's red-heart library) is determined from the user's data, not from web search. No double reference needed.

---

## 8. Self-check before delivery

Before submitting any deliverable, the agent runs through this list:

1. For each `fact` tag in the output, is there ≥2 independent sources cited (with ≥1 Tier 1-2)?
2. For each direct quotation (in quotation marks), does the agent have access to the original publication?
3. Are there any Wikipedia mirrors / Fandom wikis / AI-generated summaries among the cited sources? If so, are they being correctly counted as the same source as their parent?
4. Are there any conflicting sources where the agent silently chose one? Have all conflicts been surfaced?
5. Is the `expansion_notes` field populated with: total searches performed, layer breakdown counts, and any specific claims that hit the budget wall?
6. Are there any `fact` claims supported by zero sources? (This should be impossible, but check.)
7. Have all `hypothesis` claims been explicitly labeled with the "agent synthesis" disclosure?

If any answer reveals a problem, fix before delivering.

---

## 9. Why this rule exists

A note on motivation, for the agent and for any human reviewing this document:

The Sonic Cartography project produces content the user intends to share — playlists with annotations, audio episodes with narration. These will be consumed by listeners who are not in a position to verify each claim. The user will reach a point where they vouch for the work in front of others.

If the work contains undetected fabrications — invented quotes, misstated chart positions, fictional personnel attributions — the user's credibility takes the damage, not the agent's. The agent's only honest path is to make its evidentiary standard transparent and rigorous.

The double reference rule is the floor of that honesty. It is not a bureaucratic burden; it is the user's protection.

When the agent feels tempted to write a confident-sounding fact without doing the verification — perhaps because the search would take too long, perhaps because the agent is "pretty sure" from training data — the agent should pause and recognize: that confidence is not yours to spend. It belongs to the user, and you are spending it without their permission.

Verify, downgrade, or remove. There is no fourth option.

---

End of sourcing principles.
