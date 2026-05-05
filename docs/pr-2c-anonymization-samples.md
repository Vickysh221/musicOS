# PR-2C anonymization samples — Miss You ep 1

> **R3 §6.2 stop-gate**: this file is the user-review checkpoint before bulk migration of `playlists/rolling-stones_some-girls_miss-you.connections.json` to v0.4 schema. 8 representative pairs anonymized below. Approve, request edits, or reject the anonymization style — bulk migration of remaining 33 pairs proceeds only after sign-off.

## Migration rules applied per pair

1. Drop `direction` (deprecated; from/to ordering + foreshadow modes carry the semantics).
2. Convert `narration_at_from` → `narration_modes.foreshadow_anonymous_at_from`. **Rewrite voice_zh / voice_en to strip forward-position artist + song names.** Use anonymized handles: year + scene + role + sound description. Never name a future track.
3. Convert `narration_at_to` → `narration_modes.callback_named_at_to`. Names preserved (callbacks may name; forbidden in foreshadow only).
4. Add `narration_modes.foreshadow_named_at_from: null` for all pairs (populated only on Phase-2 explicit demand for Opening / Interlude / Closing).
5. Add `intrinsic_score: { value: null, dimensions: {...}, rationale: null }` placeholder. PR-3B fills the values.

## Anonymized handle vocabulary used below

- year + city/scene ("1971 年那个把整支乐队收进一个人脑子里的密度实验")
- year + role ("1978 年同年那条同一个动作的 CBGB 翻译")
- specific personnel-only when forward track itself isn't named ("Nile Rodgers 那把琴 34 年后又会出现")
- pure year + sonic move ("等会儿那条 1979 年最被引用的贝斯线")

Hard rule: zero forward-position artist names AND zero forward-position song titles in `foreshadow_anonymous_at_from.voice_zh / voice_en`. Backward callbacks (`callback_named_at_to`) name freely.

---

## Sample 1 — `conn_001_to_002_groove_dna` (1 → 2)

**Before** (`narration_at_from.voice_zh`):
> 等会儿到 Sly & the Family Stone 的 Family Affair，这种锁死的底部会被一个人独吞进去。

**After** (`foreshadow_anonymous_at_from.voice_zh`):
> 等会儿到 1971 年的下一站，这条锁死的底部会被一个人独吞进去——整支乐队的密度收进一个人的脑子。

**Before** (`narration_at_from.voice_en`):
> Soon in Sly & the Family Stone's Family Affair, one person will internalize this locked groove entirely alone.

**After** (`foreshadow_anonymous_at_from.voice_en`):
> A few years on, in 1971, this locked groove gets internalized by one person alone — a whole band's density compressed into one head.

**Callback (unchanged, names retained)** — `callback_named_at_to.voice_zh`:
> 你刚才在 James Brown 的 Cold Sweat 已经听见这种贝斯鼓咬死的逻辑——Sly 把它收进了一个人的脑子里。

---

## Sample 2 — `conn_001_to_006_groove_dna` (1 → 6, anchor inbound)

**Before**:
> 等会儿到 The Rolling Stones 的 Miss You，这条"贝斯和鼓是主体"的逻辑通过 Billy Preston 的 demo 直接传了进去。

**After** (`foreshadow_anonymous_at_from.voice_zh`):
> 这条"贝斯和鼓是主体"的逻辑后面会经过 Billy Preston 的手，进到 1978 年那间纽约的录音棚——那是这一集的落点。

**Before (en)**:
> Ahead in The Rolling Stones' Miss You, this philosophy — bass and drums as the body — passed directly through Billy Preston's demo.

**After (en)**:
> This philosophy — bass and drums as the body — eventually moves through Billy Preston's hands into a 1978 New York session that anchors this episode.

**Note**: anchor is referenced as "this episode's landing point / 这一集的落点" rather than named. Personnel name (Billy Preston) is preserved because he is not a forward-track artist — he is a session musician whose presence is itself the carrier.

---

## Sample 3 — `conn_002_to_006_personnel_bridge_bass` (2 → 6)

**Before**:
> 等会儿到 The Rolling Stones 的 Miss You，Billy Preston 就是从 Sly 这边拉过来的那条线。

**After** (`foreshadow_anonymous_at_from.voice_zh`):
> Billy Preston 就是从 Sly 这边拉过来的那条线——这一集的落点会用到他。

**Before (en)**:
> Ahead in The Rolling Stones' Miss You, Billy Preston is the human thread pulled from Sly's world into Jagger's.

**After (en)**:
> Billy Preston is the human thread pulled out of Sly's world — and this episode's anchor will lean on him.

---

## Sample 4 — `conn_006_to_007_groove_dna` (6 → 7, anchor outbound)

**Before**:
> Blondie 的 Heart of Glass 同年在 CBGB 那边做了完全一样的翻译——两支乐队，同一个动作，同一年。

**After** (`foreshadow_anonymous_at_from.voice_zh`):
> 同年在 CBGB 那边，另一支乐队做了完全一样的翻译——两支乐队，同一个动作，1978。

**Before (en)**:
> Blondie's Heart of Glass made the exact same translation from the CBGB side — two bands, one move, same year.

**After (en)**:
> The same year, on the CBGB side, another band performs the exact same translation — two bands, one move, 1978.

---

## Sample 5 — `conn_009_to_012_bassline_prototype` (9 → 12)

**Before**:
> 等会儿到 Queen 的 Another One Bites the Dust，Deacon 把 Good Times 的贝斯线搬进了摇滚——有据可查。

**After** (`foreshadow_anonymous_at_from.voice_zh`):
> 等会儿——次年那条贝斯线会被一个英国摇滚乐队的贝斯手原样搬进摇滚，Deacon 本人后来公开承认。

**Before (en)**:
> Ahead in Queen's Another One Bites the Dust, Deacon transplants Good Times' bassline into rock — documented.

**After (en)**:
> Soon — by the following year, a British rock band's bassist transplants this line wholesale into rock, and he openly admits it.

**Note**: personnel name (Deacon) is the future-track personnel — should it be stripped too? Provisional rule: if the personnel name uniquely identifies the future band (Deacon → Queen), strip it. If the personnel is a session musician with multiple credits (Billy Preston), retain. **Flagging for user**: confirm "Deacon" should be stripped here.

---

## Sample 6 — `conn_009_to_015_personnel_bridge_bass` (9 → 15)

**Before**:
> 等会儿到 Daft Punk 的 Get Lucky，Nile Rodgers 本人还在——那把琴就是录 Good Times 用的那把。

**After** (`foreshadow_anonymous_at_from.voice_zh`):
> Nile Rodgers 这把琴 34 年后还会再用一次——同一个吉他手，同一把 Stratocaster。

**Before (en)**:
> Ahead in Daft Punk's Get Lucky, Nile Rodgers himself returns — the same Stratocaster he used on Good Times.

**After (en)**:
> Thirty-four years later this same guitar comes back — same player, same Stratocaster.

**Note**: Nile Rodgers is the *current* track's (position 9) personnel; he is also the carrier into the future track. Naming him in foreshadow is naming a current-track person, not a forward-track artist. Retained.

---

## Sample 7 — `conn_010_to_011_groove_dna` (10 → 11)

**Before**:
> Talking Heads 的 Once in a Lifetime 在同一年把贝斯放进了一套完全不同的多节奏层——Afrobeat 的逻辑。

**After** (`foreshadow_anonymous_at_from.voice_zh`):
> 同一年的另一支乐队把贝斯放进了一套完全不同的多节奏层——Afrobeat 的逻辑。

**Before (en)**:
> Talking Heads' Once in a Lifetime puts bass inside a completely different polyrhythmic stack that same year — Afrobeat logic.

**After (en)**:
> Another band the same year places bass inside a completely different polyrhythmic stack — Afrobeat logic.

---

## Sample 8 — `conn_010_to_016_bassline_prototype` (10 → 16)

**Before**:
> 等会儿到 Tame Impala 的 The Less I Know the Better，高音区旋律贝斯这件事被 Parker 用迷幻的方式重新演了一遍。

**After** (`foreshadow_anonymous_at_from.voice_zh`):
> 高音区旋律贝斯这件事，35 年后会被一个澳洲卧室流行的独立乐手用迷幻的方式重新演一遍。

**Before (en)**:
> Ahead in Tame Impala's The Less I Know the Better, Parker reprises high-register melodic bass — through a psychedelic lens.

**After (en)**:
> Thirty-five years later, an Australian bedroom-pop solo act reprises high-register melodic bass through a psychedelic lens.

---

## Open questions for user gate

1. **Forward-track personnel naming** (Sample 5, Deacon): strip or retain when the personnel name uniquely identifies the future band?
   - Strict rule: strip ("a British rock band's bassist later admits…")
   - Lenient rule: retain ("Deacon later admits…") — risks identification by knowledgeable listeners
   - **Provisional**: strict (strip). Confirm.

2. **Anchor referencing** (Sample 2, 3): "1978 年那间纽约的录音棚" / "这一集的落点". Acceptable as anonymized references to the anchor, or too telegraphic?
   - **Provisional**: acceptable; anchor reveal is structural, listener already knows the episode is about Miss You.

3. **Year-based handles** (Samples 1, 4, 7, 8): is "等会儿到 1979 年" / "次年" / "35 年后" sufficient as a handle, or does the prose feel hollow without the artist?
   - **Provisional**: sufficient when year + scene + sonic move are all present. Hollow when only year is given.

4. **Voice consistency**: anonymized prose tends toward narrator omniscience ("会被…重新演一遍"). Does this feel like `near_listener_v1` (peer-tone, docent-grounded), or does it drift toward DJ-omniscient?
   - **Provisional**: borderline. Final SKILL rewrite (PR-4A) will surface these and constrain via persona examples; PR-2C is the data-layer migration only and need not perfect prose voice.

---

## Decision needed before bulk migration

Approve / edit / reject this anonymization style for the remaining 33 pairs. After approval, PR-2C bulk migration runs in one pass and lands the v0.4 schema (`narration_modes` tri-state, `intrinsic_score` placeholder, `direction` removed).

— end of samples —
