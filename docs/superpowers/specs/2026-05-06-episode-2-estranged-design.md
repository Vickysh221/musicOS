# Episode 2 — Estranged: aria↔solo dialectic 设计稿

**Status:** draft for user review
**Date:** 2026-05-06
**Spec version targeted:** 0.4
**Episode id (proposed):** `guns-n-roses_use-your-illusion-ii_estranged__ep-02`
**Anchor track:** Guns N' Roses — Estranged (Use Your Illusion II, 1991)
**Focus slug (new):** `aria_solo_dialectic`
**Narrator persona:** `near_listener_v1`

---

## 1. 这是什么 episode

**形态**：单锚长链（与第 1 期 bassline_dna 同形态），不是 portrait anthology。Initials B.B.（Episode 3）和 How Soon Is Now?（Episode 4）已分别落入 parking-lot stub，本 spec 不覆盖。

**核心提问**：当一首歌里**人声咏叹**与**延展主奏吉他**作为**两个互不让位的主角**并置时，这条手法谱系从哪里来、到哪里去？

**与第 1 期的关系**：第 1 期 (Miss You · bassline_dna) 讲的是"两层声音听得见，谁也没融化进谁"——但它在**跨流派**层面（rock 走进 disco 节奏语法）。本期把同一个 M1 (translation_aesthetic / 基因穿外套, spec §6) 命题转到**一首歌内部**：两个主角声部的并置而非融合。两期是同一审美机制的两个尺度。

---

## 2. 新 focus 注册：`aria_solo_dialectic`

要补进 `Foundations/episode_focus_taxonomy.md`：

- **Slug**: `aria_solo_dialectic`
- **Episode title pattern (ZH)**: `双主角 — <anchor song>` 或 `咏叹与独奏 — <anchor song>`
- **`connection_kinds_in_scope`**:
  - `dual_protagonist_structure`（新边类型）—— 一首歌内部"声部 A / 声部 B 并置不融合"的结构借用
  - `aria_form_descent`（新）—— 歌剧/咏叹形式向摇滚的渗透
  - `extended_solo_as_movement`（新）—— solo 被写成一个独立乐章而非装饰
  - 加上既有 `direct_influence` / `methodological_descent` / `genealogical_descent` / `same_era_dialogue`，当对话内容是双主角结构本身
- **Node fields the prompt should read** (§7B.5 priority): `production_facts` → `member_dynamics` → `release_circumstances` → `instrumentation_details` → `cultural_venue`
- **Mute rule**: 节点没有可记录的"双主角并置"事实 → `narrative_weight: bridge`、`muted_this_episode: true`
- **OPENING template seed**: 一句 16–30 字的具体声响微描述（建议落在 Estranged 第 7:30–9:00 的 Slash 那段长 solo 与 Axl 末段哀求人声同时在场的瞬间），然后"今天这一集我们沿着这种'两个主角同时在场'的写法往外走"，再加一句弧线概览（站点数 + 年份跨度）
- **CLOSING template seed**: 回到 Estranged 末段那个双声并置的画面，用一个新形容词；点名两条 `selected_as_strong` 且在用户红心里 `red_heart_tier: hit` 的最强回声
- **`intrinsic_score_weight_overrides`**: 提高 `concrete_carrier` 至 0.30（双主角是结构性事实，需要具体可指的时刻锚定，不能停在概念层）；其余按默认

---

## 3. 锚点选择：为什么是 Estranged

候选过的：Estranged / November Rain / Slash 的吉他（泛指）。
**选 Estranged**：

1. November Rain 知名度过高，已被流行文化反复讨论，留给本期的"新发现感"低
2. Estranged 是同三部曲里**结构最极端**的一首：9'23"，**4 段式咏叹（aria-recitative-aria-cabaletta 式）+ 三段独立 solo**，是这一手法的**饱和样本**
3. 用户红心里命中 Estranged，且明确点出"Slash 的吉他 + Axl 的咏叹调"——已抓住双主角辩证，不是单看 lead

---

## 4. 谱系草图（提交给 track-curator 之前的预拓展）

> 命中状态来自 `data/user_tracks.json` grep（2026-05-06）。命中=用户红心里有此具体曲；艺人在=艺人有红心曲但锚定的代表作不在；缺=艺人不在红心。

### 上溯（祖先 / upward, depth cap 15）

| 节点 | 年份 | 用户库状态 | 角色 |
|---|---|---|---|
| 19c 意大利歌剧 aria–cabaletta 形式（Bellini / Donizetti / 早期 Verdi） | ~1830–1850 | 缺（祖源节点，作背景叙述非曲目）| 双段式"慢咏叹+快炫技"原型 |
| Layla (Derek and the Dominos) | 1970 | **命中** | 极端切分的人声半 + 器乐半 |
| Child in Time (Deep Purple) | 1970 | 艺人在（8首，未命中本曲）| 原型——但用户库没此曲，**降级为简述**，主用 Deep Purple **Burn** 作为同手法替身 |
| Stairway to Heaven (Led Zeppelin) | 1971 | 艺人在（8首，未命中本曲）| 原型——同样降级，主用 **Achilles Last Stand** 作为 Page 双段式叙事的替身 |
| Free Bird (Lynyrd Skynyrd) | 1973 | **命中** | 最极端的 aria→solo 段落式接力 |
| Bohemian Rhapsody (Queen) | 1975 | **命中**（双 album 收录）| 歌剧段 + May solo 的并置——最直接的 Estranged 致敬源 |
| Won't Get Fooled Again (The Who) | 1971 | **命中** | Daltrey 嘶吼 + Townshend solo 的辩证（同代对话节点）|

### 同代对话（lateral, depth cap 12）

| 节点 | 年份 | 用户库状态 | 角色 |
|---|---|---|---|
| November Rain (GnR) | 1991 | **命中**（原版 + 2022 Version 双重红心，Use Your Illusion I） | 同三部曲双胞胎；用户对此曲有重复信号，应作为强 lateral 站点 |
| Fade to Black (Metallica) | 1984 | **命中** | 金属版 aria-solo 辩证；构造非常类似（轻起重落+延展 solo 收尾）|

### 下溯（接收者 / downward, depth cap 20）

| 节点 | 年份 | 用户库状态 | 角色 |
|---|---|---|---|
| 椎名林檎 — 丸ノ内サディスティック | 1999 | **命中** | 日本一侧的接收者；solo 与人声轮流叙事 |
| 黑豹乐队 — Don't Break My Heart | 1991 | **命中** | 中国一侧；同年同形态独立发生（地理对位） |
| Oasis — The Masterplan / Whatever | 1990s | 艺人在（11首，未命中 Champagne Supernova）| 长 instrumental coda 接抒情人声 |
| 椎名林檎 — APPLE / MY FOOLISH HEART | 2000s | **命中** | 后期接收延展 |

### 待研究 (research questions for track-curator/connections-author)

1. ~~November Rain 是否命中？~~ **已确认命中**（原版 + 2022 Version 双重红心）
2. 用户红心里是否有其他可作为"Stairway 替身"的 Led Zep 长篇（Achilles 是首选，但要 track-curator 阶段核实其双主角结构强度）
3. 黑豹《无地自容》是否也命中（《Don't Break My Heart》已确认）
4. 唐朝乐队整艺人不在红心——确认中国一侧只走黑豹这一支
5. 19 世纪 aria–cabaletta 用作叙述背景而非曲目时，需要具体援引一首作品（候选：Bellini *Norma* "Casta Diva" + cabaletta "Ah! bello a me ritorna"）以保证 fact 层的 ≥2 source 双重引用规则

---

## 5. 站点目标与预算

- **目标 stop 数**：~18 站（含锚点），与第 1 期等量
- **年份跨度**：~1830 (歌剧 aria–cabaletta 背景节点) → 1970–1991 主干 → 现役接收者
- **Hard caps（spec §9.1）**：上溯 15 / 同代 12 / 下溯 20，达到任一上限即停
- **Web 预算**：≤25 searches, ≤15 fetches
- **Hypothesis 比例上限**：30%（spec §9.1 hard stop）。本 focus 在"19 世纪歌剧 → 70s 摇滚"那一跳天然偏 hypothesis，需特别审慎，建议这一跳标 `consensus` 而非 `fact`，并明确说"摇滚音乐家是否真的听过 cabaletta"无法直接证据化

---

## 6. M-机制对接 (spec §6)

- **M1 translation_aesthetic** ✓ 主轴。本期把 M1 从"跨流派"应用到"歌内双声部"
- **M3 member_period_attention** ✓ 强相关：Estranged 制作期的 Axl–Slash 关系（Use Your Illusion 后期已紧张），是本期 `member_dynamics` 的核心叙述点
- **M4 frequency_hollowing** ✗ 不相关，本期不强调留白
- **M2 ancestor_visit_only** 中性

---

## 7. Out of scope

- ❌ 不做 portrait anthology（合集型）
- ❌ 不把 Initials B.B. / How Soon Is Now? 收进本期——它们各自是独立 episode
- ❌ Crazy Train / Randy Rhoads 不作为独立段落出现（虽然属于"主奏吉他英雄"线，但偏 `epic_lead_protagonist`，与本期双主角辩证的 focus 错位）；如出现仅作 1 站背景对照
- ❌ 不写 Slash 的全部 GnR 作品综述——本期只为 aria↔solo 辩证的谱系服务

---

## 8. 自检（spec §9.3 草拟版）

- [ ] 锚点理由是否说清"为什么不是 November Rain"
- [ ] 上溯里的"歌剧祖源"那一跳标了 consensus 而非 fact，且双源
- [ ] 下溯到日本/中国两侧各至少 1 个 confirmed 命中节点
- [ ] >60% 站点有 platform link
- [ ] 任何引用具体小节/时间码的描述都有源
- [ ] 双主角辩证的"具体瞬间"在每一站都被点名（不是抽象赞美）
- [ ] §8 sourcing principles self-check 通过

---

## 9. Pipeline 接续

设计被批准 → writing-plans skill 产出实施计划 → track-curator (Phase 0) → connections-author (Phase 1) → transcript-author (Phase 2) → episode_audio_pipeline.md 走 TTS → fusion → exhibition wiring。

输出文件最终落点：

- `maps/guns-n-roses_use-your-illusion-ii_estranged.map.json`
- `playlists/guns-n-roses_use-your-illusion-ii_estranged.playlist.md`
- `episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json`
- `episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.md`
- 封面资产 `musicos-exhibition/public/covers/`（按 NN_artist_track 命名规则补齐缺失项）

---

## 10. Open decisions for user

1. **Episode 标题中文（ZH）**——候选：
   - "双主角 — Estranged"
   - "咏叹与独奏 — Estranged"
   - "两个主角 — 当 Slash 的吉他和 Axl 的人声谁也不让位"
2. **歌剧祖源是否作为独立 stop 出现**？还是融在锚点 OPENING 的背景叙述里（不占站点数）？建议后者——保护第 1 期那种"具体声响"的开场质感，不让概念性祖源稀释开篇
3. November Rain 已确认命中（且双版本红心），lateral 段进入并作为**主要同代对照站**——OK 吗？
