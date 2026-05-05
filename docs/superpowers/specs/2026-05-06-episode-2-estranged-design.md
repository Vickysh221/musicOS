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

## 4. 节点入选原则（critical）

**入选标准 = 节点对 `aria_solo_dialectic` 谱系的事实重要性**，由 spec §3.3 stopping rules + §4.3 epistemic tiering 决定。**用户红心命中状态不是过滤器**——它是叙事侧重信号，作用于：
- Phase 0：focus 选择的灵感来源（已完成）
- CLOSING template：点名"在你库里也命中"的接收者作收束
- 标注 `red_heart_tier: hit / adjacent / blind_spot` 作为节点元数据，用于 transcript 的语气调节（"你早就听过的"/"你没碰过的"）

参考第 1 期：James Brown — Cold Sweat、Parliament — Give Up the Funk 都不在用户红心里，仍是主干站点。本期同等处理。

## 5. 谱系草图（提交给 track-curator 之前的预拓展）

> 下表 `library_overlay` 列只用于 closing/语气调节，**不影响入选**。
> `hit` = 此曲在红心；`adj` = 艺人在红心但此曲不在；`blind` = 艺人不在红心。

### 上溯（祖先 / upward, depth cap 15）

| 节点 | 年份 | library_overlay | 在谱系中的角色 |
|---|---|---|---|
| 19c 意大利歌剧 aria–cabaletta 形式（Bellini *Norma* "Casta Diva" + cabaletta "Ah! bello a me ritorna" / 早期 Verdi） | ~1830–1850 | blind | 双段式"慢咏叹+快炫技"形式的原型；这一跳标 `consensus` 而非 `fact`（"摇滚音乐家是否真的听过 cabaletta"无法直接证据化）|
| Layla (Derek and the Dominos) | 1970 | hit | 极端切分的人声半 + 器乐半 coda |
| Child in Time (Deep Purple) | 1970 | adj | Gillan 无词咏叹 + Blackmore 古典背景延展 solo——**aria↔solo 在 rock 里最早最纯的样本**，必须入选 |
| Stairway to Heaven (Led Zeppelin) | 1971 | adj | Plant 抒情线 + Page 阶梯式 solo——这一手法在白人摇滚里的成型节点，必须入选 |
| Won't Get Fooled Again (The Who) | 1971 | hit | Daltrey 嘶吼 + Townshend solo 的辩证 |
| Free Bird (Lynyrd Skynyrd) | 1973 | hit | 最极端的 aria→solo 段落式接力 |
| Bohemian Rhapsody (Queen) | 1975 | hit（双 album 收录）| 歌剧段 + May solo 并置——最直接的 Estranged 致敬源 |

### 同代对话（lateral, depth cap 12）

| 节点 | 年份 | library_overlay | 在谱系中的角色 |
|---|---|---|---|
| November Rain (GnR) | 1991 | hit（原版 + 2022 Version 双重）| 同三部曲双胞胎，强 lateral 站点 |
| Fade to Black (Metallica) | 1984 | hit | 金属版 aria-solo 辩证；轻起重落+延展 solo 收尾 |
| Nothing Else Matters (Metallica) | 1991 | adj | 同年同形态金属版本 |

### 下溯（接收者 / downward, depth cap 20）

| 节点 | 年份 | library_overlay | 在谱系中的角色 |
|---|---|---|---|
| Champagne Supernova (Oasis) | 1995 | adj | 长 instrumental coda 接抒情人声——本期下溯到 Britpop 的关键节点，必须入选 |
| 椎名林檎 — 丸ノ内サディスティック | 1999 | hit | 日本一侧接收者；solo 与人声轮流叙事 |
| Welcome to the Black Parade (MCR) | 2006 | blind | 21 世纪剧场摇滚里的 aria-solo 新解 |
| 椎名林檎 — 丸ノ内サディスティック / APPLE | 2000s | hit | 后期接收延展 |
| 黑豹乐队 — Don't Break My Heart | 1991 | hit | 中国一侧同年同形态独立发生（地理对位）|
| Knights of Cydonia (Muse) | 2006 | blind | 21 世纪英国版 epic-rock 的双主角接续，候选 |

### 研究问题 (research questions for track-curator / connections-author)

1. 黑豹《无地自容》、唐朝《国际歌》（如有）、声音玩具长曲是否也属同支——track-curator 阶段核
2. Bellini *Norma* 那两站要 ≥2 来源（音乐学层面）核 cabaletta 形式定义本身，再 ≥2 来源核"摇滚长曲传承自意大利歌剧"这一文化判断
3. Free Bird → Estranged 的直接文化链是否有具体证词（Slash/Axl 引用 Skynyrd？），影响 epistemic tier
4. Achilles Last Stand 是否单独入选作 Page 第二个 stop（与 Stairway 并列），还是让位（避免 Led Zep 占两站）

---

## 6. 站点目标与预算

- **目标 stop 数**：~18 站（含锚点），与第 1 期等量
- **年份跨度**：~1830 (歌剧 aria–cabaletta 背景节点) → 1970–1991 主干 → 现役接收者
- **Hard caps（spec §9.1）**：上溯 15 / 同代 12 / 下溯 20，达到任一上限即停
- **Web 预算**：≤25 searches, ≤15 fetches
- **Hypothesis 比例上限**：30%（spec §9.1 hard stop）。本 focus 在"19 世纪歌剧 → 70s 摇滚"那一跳天然偏 hypothesis，需特别审慎，建议这一跳标 `consensus` 而非 `fact`，并明确说"摇滚音乐家是否真的听过 cabaletta"无法直接证据化

---

## 7. M-机制对接 (spec §6)

- **M1 translation_aesthetic** ✓ 主轴。本期把 M1 从"跨流派"应用到"歌内双声部"
- **M3 member_period_attention** ✓ 强相关：Estranged 制作期的 Axl–Slash 关系（Use Your Illusion 后期已紧张），是本期 `member_dynamics` 的核心叙述点
- **M4 frequency_hollowing** ✗ 不相关，本期不强调留白
- **M2 ancestor_visit_only** 中性

---

## 8. Out of scope

- ❌ 不做 portrait anthology（合集型）
- ❌ 不把 Initials B.B. / How Soon Is Now? 收进本期——它们各自是独立 episode
- ❌ Crazy Train / Randy Rhoads 不作为独立段落出现（虽然属于"主奏吉他英雄"线，但偏 `epic_lead_protagonist`，与本期双主角辩证的 focus 错位）；如出现仅作 1 站背景对照
- ❌ 不写 Slash 的全部 GnR 作品综述——本期只为 aria↔solo 辩证的谱系服务
- ❌ **不**用"红心命中"作为节点过滤器（参见 §4）——这是反原则

---

## 9. 自检（spec §9.3 草拟版）

- [ ] 锚点理由是否说清"为什么不是 November Rain"
- [ ] 上溯里的"歌剧祖源"那一跳标了 consensus 而非 fact，且双源
- [ ] 下溯到日本/中国两侧各至少 1 个 confirmed 命中节点
- [ ] >60% 站点有 platform link
- [ ] 任何引用具体小节/时间码的描述都有源
- [ ] 双主角辩证的"具体瞬间"在每一站都被点名（不是抽象赞美）
- [ ] §8 sourcing principles self-check 通过

---

## 10. Pipeline 接续

设计被批准 → writing-plans skill 产出实施计划 → track-curator (Phase 0) → connections-author (Phase 1) → transcript-author (Phase 2) → episode_audio_pipeline.md 走 TTS → fusion → exhibition wiring。

输出文件最终落点：

- `maps/guns-n-roses_use-your-illusion-ii_estranged.map.json`
- `playlists/guns-n-roses_use-your-illusion-ii_estranged.playlist.md`
- `episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.json`
- `episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.md`
- 封面资产 `musicos-exhibition/public/covers/`（按 NN_artist_track 命名规则补齐缺失项）

---

## 11. Open decisions for user

1. **Episode 标题中文（ZH）**——候选：
   - "双主角 — Estranged"
   - "咏叹与独奏 — Estranged"
   - "两个主角 — 当 Slash 的吉他和 Axl 的人声谁也不让位"
2. **歌剧祖源是否作为独立 stop 出现**？还是融在锚点 OPENING 的背景叙述里（不占站点数）？建议后者——保护第 1 期那种"具体声响"的开场质感，不让概念性祖源稀释开篇
3. November Rain 已确认命中（且双版本红心），lateral 段进入并作为**主要同代对照站**——OK 吗？
