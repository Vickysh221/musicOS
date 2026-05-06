# MusicOS · 从锚点歌曲到完整剧集的生成工作流

> 输入：（锚点歌曲 + episode focus + 用户红心歌单 1690 首）
> 输出：（18 首歌单 + 18 段旁白 + 一个可视化展览）
>
> 本文档讲清楚每一步的逻辑、每一步的定义文件、每一步的验证手段。

---

## 0. 总览：四阶段管线

```
用户输入 (锚点歌 + episode focus)
        │
        ▼
┌──────────────────────────────────────────────────────┐
│  Phase −1：锚点扩展（Anchor Expansion）              │
│  产出：maps/<slug>.map.json                          │
│  定义：Foundations/sonic_cartography_spec_v0.4.md §3 │
└──────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────┐
│  Phase 0：Track Curator                              │
│  产出：playlists/<slug>.tracklist.json               │
│  定义：~/.claude/skills/track-curator/SKILL.md       │
└──────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────┐
│  Phase 1：Connections Author                         │
│  产出：playlists/<slug>.connections.json             │
│  定义：~/.claude/skills/connections-author/SKILL.md  │
└──────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────┐
│  Phase 2：Transcript Author                          │
│  产出：episodes/<slug>.episode.{md,json}             │
│  定义：~/.claude/skills/transcript-author/SKILL.md   │
│        + spec §7B（人格、长度、6 层顺序）            │
└──────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────┐
│  Phase 3：Exhibition Build                           │
│  产出：musicos-exhibition/data/exhibition-epN.json   │
│  定义：musicos-exhibition/scripts/build-exhibition-  │
│        json.ts                                       │
└──────────────────────────────────────────────────────┘
        │
        ▼
   音频融合 (TTS narration + music stems)
   定义：docs/episode_audio_pipeline.md
```

每一阶段必须 validator 通过才允许进入下一阶段。中间产物可独立审计。

---

## Phase −1：锚点扩展（前置条件）

**这一步不在 episode 管线里**，但 Phase 0 依赖它的产物。如果 `maps/<slug>.map.json` 不存在，必须先跑这一步。

### 输入

- 用户提供的锚点歌（如 Miss You / Estranged）
- `data/user_tracks.json`（1690 首红心曲库，由 `data/convert_tracks.py` 从网易云导出转换而来）
- `data/nodes/*.json`（已有的节点注册表）

### 算法

来源：`Foundations/sonic_cartography_spec_v0.4.md` §3.1–§3.5

从锚点向**三轴**扩展：
| 轴 | 方向 | 硬上限 |
|---|---|---|
| upward | 影响来源（祖先） | 15 |
| lateral | 同期对话 | 12 |
| downward | 影响后继 | 20 |

**节点是永久单例**：写新节点前必查 `tools/node_registry.py:node_exists()`，已有节点用 `put_node(enrich=True)` 增补，不重复建。

**双源核验**（`docs/superpowers/plans/sonic_cartography_sourcing_principles.md`）：
- 每条 `fact`-tier 主张 ≥2 个独立源，至少 1 个 Tier 1–2
- Tier 1：学术 / 参考书；Tier 2：长篇报道（Mojo、Rolling Stone、Bass Player）；Tier 3：访谈、liner notes；Tier 4：粉丝数据库

**研究预算**：≤25 次 web search，≤15 次 web fetch。

### 产出

`maps/<slug>.map.json`：
```json
{
  "anchor_node_id": "<slug>",
  "node_ids": ["...", "..."],   // 引用，不内嵌
  "edges": [
    {
      "id": "edge_...",
      "type": "direct_influence | same_era_dialogue | genealogical_descent | ...",
      "source_node_id": "...",
      "target_node_id": "...",
      "evidence": "...",
      "epistemic_layer": "fact | consensus | hypothesis"
    }
  ]
}
```

### Hard stops（spec §9.1）

- 任一轴打到硬上限且用户未扩预算
- hypothesis-tier 边占比 > 30%
- 歌单可链接率 < 60%

---

## Phase 0：Track Curator

**目的**：从锚点扩展产生的庞大候选池里，根据用户红心 + 评分，挑出 18 首组成单期歌单。

**定义文件**：`~/.claude/skills/track-curator/SKILL.md`

### 输入

| 来源 | 路径 | 提供 |
|---|---|---|
| 用户红心导出 | `Foundations/网易云红心歌单_全量.md` | `hit` / `adjacent` 段位种子 |
| 锚点 map | `maps/<slug>.map.json` | 三轴邻居 + edge 类型 |
| 节点注册表 | `data/nodes/*.json` | 已研究节点的 tags / signature |
| Episode focus 分类 | `Foundations/episode_focus_taxonomy.md` | 当前 focus 在范围内的 connection kind / mute 规则 |
| Sourcing principles | `docs/superpowers/plans/sonic_cartography_sourcing_principles.md` | §8 自检 + 双源规则 |

### 算法（5 步）

#### 1. 候选池

合并：
- map 里的所有 `node_ids`
- map edges 里距锚点 ±2 跳的红心命中和邻接
- 节点注册表里 `tags` 或 focus-equivalent 字段（如 `bass_dna_signature`）匹配 focus 的节点

#### 2. 打分

| 信号 | 权重 |
|---|---|
| 红心 tier `hit` | +3 |
| 红心 tier `adjacent` | +1 |
| 直接连到锚点的 focus-aligned edge（`direct_influence`、`methodological_descent`、`genealogical_descent`、on-focus `same_era_dialogue`） | +2 |
| 每个 fact-tier 源支持 focus 相关 | +1 / 源 |
| focus 相关只有 hypothesis-tier 证据 | −2 |

#### 3. 截 18 首

按分数降序取 18。同分时优先 `fact`-tier > `consensus`，upward 轴 > lateral。Episode 预算可在 `episode_config.yaml` 改。

#### 4. 弧线定位（assign `position` 1..18）

按 spec §7B 弧线规则：
- 开场（最早年份的根节点）
- 上升弧穿过中段
- **锚点放在大约 N/3 位置**
- 下游节点穿过收束
- coda 在 position N

#### 5. 标记 + 加权重

每行都要写 `narrative_weight`（spec v0.4 §2.4），驱动 Phase 2 长度卡：

| weight | 数量 | 长度卡 |
|---|---|---|
| `anchor` | 必须正好 1 | 600–900 ZH 字符 |
| `pillar` | 3–5 | 350–500 |
| `bridge` | ≤10% 行（与 `muted_this_episode` 一致） | 60–150 |
| `supporting` | 其余 | 220–340 |

### Hard stops

- 音频可解析率 < 60%（即 `netease_song_id` 非空的占比）
- hypothesis-tier focus 主张占非 muted 行 > 30%
- 任一轴打满硬上限

### 产出

`playlists/<slug>.tracklist.json`（18 行）：
```json
{
  "position": 6,
  "node_id": "rolling-stones_some-girls_miss-you",
  "artist": "The Rolling Stones",
  "song": "Miss You",
  "year": 1978,
  "tier": "adjacent",
  "is_base_node": true,
  "muted_this_episode": false,
  "narrative_weight": "anchor",
  "netease_song_id": 21968201,
  "evidence_basis": "fact",
  "focus_relevance_note": "Bill Wyman's walking disco bassline is the episode's pivot."
}
```

加上 `playlists/<slug>.tracklist.audit.md`（人类可读的审计稿，必须含 §8 自检 5 项 + validator 输出）。

### 验证

```bash
python3 tools/validate_tracklist.py <slug>
```

通过条件：18 行齐全 + 1 个 anchor + 禁忌词无（`Track N`、`[`、`]`、`第N首`）+ 红心 §8 自检通过。

---

## Phase 1：Connections Author

**目的**：在 18 首之间画出 ConnectionPair（"这首和那首之间因为什么连着"），并给每对打 `intrinsic_score`。Phase 2 后面会从每首歌的连接候选里**挑一个最强**作为旁白的 echo 层。

**定义文件**：`~/.claude/skills/connections-author/SKILL.md`

### 输入

| 来源 | 提供 |
|---|---|
| `playlists/<slug>.tracklist.json` | 位置、tier、muted、node_id |
| `maps/<slug>.map.json` | edges + epistemic_layer |
| spec §6 + episode_focus_taxonomy | 当前 focus 在范围内的 connection kinds |
| `musicos-exhibition/scripts/lib/parse-connections.ts` | ConnectionPair canonical schema |

### 过程

#### Step 1：建 position → node_id 映射

#### Step 2：找候选对

对每个有序对 `(i, j)` where `i < j` 且 i、j 都不是 muted：
- **Criterion A**：map 里有一条 edge 连这两个 node
- **Criterion B**：focus 对齐的 thematic kinship（同一贝斯手谱系、同一设备、同一方法论）哪怕没直接 edge

#### Step 3：上限剪裁

- Anchor 位置：≤ 7 对（作 from 或 to 加起来）
- 非 anchor 位置：≤ 5 对
- Muted 位置：0 对

超了砍最低置信度的（sensory < musicological < historical）。

#### Step 4：每对填字段

| 字段 | 规则 |
|---|---|
| `id` | `conn_{from:03d}_to_{to:03d}_{kind}` |
| `kind` | 必须在 `connection_kinds_in_scope`，如 `bassline_dna` 用 `bassline_prototype` / `groove_dna` / `personnel_bridge_bass` / `gear_lineage_bass` |
| `evidence_basis` | `historical`（≥2 源） / `musicological`（学术共识） / `sensory`（可听见但无文献） |
| `backed_by_edge_id` | 必须能在 map.edges 里 resolve；只在 Criterion B 且无对应 edge 时为 `null` |
| `system_sensory_note` | 1–3 句内部推理 trace（不进 TTS） |
| `narration_modes.foreshadow_anonymous_at_from.voice_zh` | ≤80 ZH 字符；**禁止点名未来 to-position 的艺人或歌**；用匿名 handle（年份+场景+角色+声音动作） |
| `narration_modes.callback_named_at_to.voice_zh` | ≤80 ZH 字符；回望 ("你刚才在…")；**允许**点名前作 |
| `narration_modes.foreshadow_named_at_from` | 默认 `null`；只在 Phase 2 显式要求 Opening/Interlude/Closing 时才填 |
| `intrinsic_score` | 见 Step 4b |

**关键设计：双 voice 制度**
- Foreshadow 默认匿名（"等会儿到 1979 年那条最被引用的迪斯科贝斯…"）
- Callback 允许点名（"你刚才在 Cold Sweat 已经听见…"）
- 回望可叙事性更强，前望保持悬念

这是 v0.3 → v0.4 最关键的一次修复：v0.3 的 Phase 1 默认会泄漏未来曲名，导致 Phase 2 的旁白 prompt 怎么改都改不掉。v0.4 在 Phase 1 截断了污染源。

#### Step 4b：`intrinsic_score` 评分 rubric

四维 [0, 1] 加权：

| 维度 | 权重 | 衡量 |
|---|---|---|
| `story_drive` | 0.30 | 这对是否承载一个让听众感到"转"的叙事节拍 |
| `concrete_carrier` | 0.25 | 是否有具体声音/人员/设备/场景锚（不仅是亲缘宣称） |
| `evidential_strength` | 0.20 | `evidence_basis` × 源质量；`historical` ≥2 个 Tier 1–2 源得分高 |
| `focus_relevance` | 0.25 | 是否说到本期 focus（`gear_lineage_bass` 在贝斯期分高于通用 `groove_dna`） |

`value = 0.30 * story_drive + 0.25 * concrete_carrier + 0.20 * evidential_strength + 0.25 * focus_relevance`

写完后做分布检查：std ≥ 0.1（不能全部 ≈0.5 或 ≈1.0，那说明 rubric 没真的在用）。

### 验证

```bash
cd musicos-exhibition && npx tsx scripts/check-connections.ts
```

检查：schema 齐全 + kind 在 scope 内 + voice_zh ≤80 + voice_en ≤30 词 + 禁忌词无 + **forward voice 字段不含 to-position 艺人/歌名**（grep-style 零匹配）。

---

## Phase 2：Transcript Author

**目的**：把 18 行 + 连接对 + 每首歌的节点 JSON，组装成 18 段旁白。

**定义文件**：
- `~/.claude/skills/transcript-author/SKILL.md`（写作约束）
- `Foundations/sonic_cartography_spec_v0.4.md` §7B（人格 + 长度 + 6 层顺序）
- `docs/dj_persona_and_transcript_prompt.md`（本仓库内的人格独立文档）

### 输入装配（每首歌）

| 字段 | 来源 |
|---|---|
| 位置、艺人、歌、年份、tier、`narrative_weight`、`is_base_node`、`muted_this_episode` | tracklist.json |
| `production_facts`、`member_dynamics`、`cultural_venue`、`instrumentation_details`、`release_circumstances` | `data/nodes/<node_id>.json` |
| 入向 + 出向 ConnectionPair（含 `narration_modes` + `intrinsic_score`） | connections.json |
| edge `evidence` + `epistemic_layer` | maps.json via `backed_by_edge_id` |
| OPENING/CLOSING 模板 seed + `connection_kinds_in_scope` | episode_focus_taxonomy.md |
| 红心上下文（OPENING 用） | `python3 tools/build_calibration_digest.py` |

叙事槽优先级（spec §8）：`production_facts` → `member_dynamics` → `cultural_venue` → `instrumentation_details` → `release_circumstances`。

### 写作约束（每首非 bridge 严格走 6 层）

1. **Sonic identification (OPENER)** — 头 1-2 句，10 秒内能验证的具体声音；**禁止抽象角色描述**
2. **Scene** — 时间、地点、人
3. **Motivation** — 为什么选这个声音
4. **Action** — 具体的音乐动作（focus 维度真正落地的一层）
5. **One echo** — 从 `intrinsic_score` 排序的 top-3 候选里选**一个** strong connection
6. **Restraint** — 不去做什么，留给下一站；**禁止"下一首…"模板**

### 选 strong connection 的规则（§7B.4 + §7B.12）

每首非锚点非 bridge：
1. 收集所有入向 + 出向 ConnectionPair
2. 按 `intrinsic_score.value` 排序，取 top 3
3. 在 top 3 里挑**最干净服务 6 层 action 层 echo** 的那一对
   - 入向 → 用 `callback_named_at_to.voice_zh` 作 seed（**可点名**前作）
   - 出向 → 用 `foreshadow_anonymous_at_from.voice_zh` 作 seed（**禁止点名**未来）
4. 标记 `selected_as_strong: true`
5. 其他 pair 进 `archived_weak_connections[]`，每条贴一个 `archive_reason`：
   - `redundant_with_strong | low_focus_relevance | no_concrete_anchor | already_told | off_topic_for_episode`

**Anchor 例外**：`strong_connection_id: null`，靠自由 callback 散文回顾多首前作（"汇流回顾"），不受 ≤1 限制。所有入向仍然归档。

**Bridge 例外**：`strong_connection_id: null`，只写 `bridge_narration_zh`（60–150 ZH）。无 6 层、无 echo、无"下一首"。

### 长度硬卡（validator 强制）

| weight | ZH 字符 |
|---|---|
| anchor | 600–900 |
| pillar | 350–500 |
| supporting | 220–340 |
| bridge | 60–150 |

validator 失败时问的不是"剪还是补"——是"weight 分类是否对"。

### 产出

两个文件，**字符级同步**：

`episodes/<slug>.episode.md`（人类可读）
```markdown
# <title> — 完整剧集文稿
**Narrator persona:** near_listener_v1
...

## Track 1: Artist — Song (Year)

### Narration

<旁白正文>
```

`episodes/<slug>.episode.json`（机器镜像）
```json
{
  "narrator_persona_id": "near_listener_v1",
  "spec_version": "0.4",
  "exhibits": [
    {
      "position": 1,
      "transcript_zh": "<与 .md 完全一致>",
      "strong_connection_id": "conn_001_to_006_groove_dna",
      "archived_weak_connections": [
        { "connection_id": "...", "archive_reason": "redundant_with_strong" }
      ]
    }
  ]
}
```

### 验证（三个 validator）

```bash
# 1. 长度 + 禁忌词 + md↔json 同步 + position 连号
python3 tools/validate_episode_transcripts.py <slug>

# 2. strong/archived 语义 + connection orphan 检测
python3 -m tools.validate_episode_connections <slug>

# 3. 构建管线 + 测试套件
cd musicos-exhibition && npm run build-data && npm test
```

或一键：
```bash
make validate-episode SLUG=<slug>
```

---

## Phase 3：Exhibition Build

**定义文件**：`musicos-exhibition/scripts/build-exhibition-json.ts`

把 episode.json + tracklist.json + connections.json 合成展览站消费的单文件 `data/exhibition-epN.json`，包含：
- 18 个 exhibit（含 transcript_zh、platform_links、cover、archived_connections 渲染）
- Timeline 弧形布局所需的 position / year / tier 数据
- NowPlayingBar 所需的 audio_fusion 路径

展览站读这一份 JSON 渲染（`musicos-exhibition/src/`）。

### 音频融合

`docs/episode_audio_pipeline.md` 定义独立的运行手册：
1. 旁白文本 → TTS 生成 narration audio
2. 每首原曲 → 切 stem 段（按 `excerpt_range` 或人工选段）
3. 旁白 + 音乐 stem 融合 → `musicos-exhibition/public/audio_fusion/<episode>/<position>.mp3`
4. 写回 exhibition JSON 的 audio 路径字段

YouTube fallback：当原曲缺失或被删时，按 docs 里定义的合规来源拉素材。

---

## 你那句"AI 帮我推荐母题"具体发生在哪里

用户描述：「看到我最近常听 estranged 就推荐'人声和吉他双主线'这个命题」

这件事**逻辑上发生在 Phase 0 之前**，但目前还没沉淀成独立的 skill 文档。当前形态：
- 用户对 Claude 说"我最近常听 X，推荐几个 episode focus"
- Claude 读 `data/user_tracks.json` + `Foundations/episode_focus_taxonomy.md` 里已定义的 focus 列表（如 `bassline_dna`、`aria_solo_dialectic`、`frequency_hollowing` 等）
- 看红心歌单的曲风分布，匹配最契合的 focus 维度，提议 2–4 个候选
- 用户选定一个 (anchor, focus) → 进入 Phase −1

**这一步定义在哪里？**——目前**没有独立文档**，是 CLAUDE.md §"Anchor expansion workflow" 第 3 步"Confirm anchor"的一个隐含前置环节。如果要工程化，应该补一个 `topic-suggester` skill。

---

## 一张图总结：每个文件回答了什么问题

| 文件 | 回答 |
|---|---|
| `Foundations/sonic_cartography_spec_v0.4.md` | 这个系统**整体规则**是什么 |
| `Foundations/episode_focus_taxonomy.md` | 一期节目可以围绕**什么命题** |
| `Foundations/网易云红心歌单_全量.md` | 用户**听过/喜欢**什么 |
| `data/user_tracks.json` | 红心曲库的**结构化版本**（机器读） |
| `data/nodes/*.json` | 每首歌的**事实档案**（永久单例） |
| `maps/<slug>.map.json` | 锚点的**三轴血脉**（节点 ID + edges） |
| `playlists/<slug>.tracklist.json` | 这一期**选哪 18 首**、什么权重 |
| `playlists/<slug>.connections.json` | 这 18 首之间**哪些对连着**、哪一对最强 |
| `episodes/<slug>.episode.{md,json}` | 这 18 首的**最终旁白**（人 + 机器双版本） |
| `musicos-exhibition/data/exhibition-epN.json` | **展览站**消费的合并视图 |
| `~/.claude/skills/track-curator/` | Phase 0 **怎么写** |
| `~/.claude/skills/connections-author/` | Phase 1 **怎么写** |
| `~/.claude/skills/transcript-author/` | Phase 2 **怎么写** |
| `tools/validate_*.py` | 每一步**怎么验** |
| `tools/node_registry.py` | 节点 CRUD 工具 |
| `tools/coverage.py` | 覆盖度计算工具 |
| `Makefile` | 一键跑全套验证 |

---

## 设计哲学：为什么分四阶段，而不是 end-to-end

如果让一个 LLM 拿到（锚点 + 红心 + map）就直接出 18 段旁白，理论上能生成，但会坏在：

1. **结构坏掉**——旁白会随机点名未来曲目（spoiler），因为模型没有约束"哪条 connection 是 strong、哪条 archived"
2. **长度失控**——每段都会膨胀到 anchor 段位（模型默认想"讲全"）
3. **证据失控**——hypothesis-tier 的主张会被以 fact 语气说出来
4. **不可迭代**——出问题时无法定位是选歌坏了、连接坏了，还是写作坏了

四阶段的**核心**是：**把 LLM 的不同自由度限制在不同阶段**——
- Phase 0 决定"讲哪些歌"，但不写一字旁白
- Phase 1 决定"哪些歌之间连着、谁强谁弱"，但每条 voice 都 ≤80 字
- Phase 2 才写正文，**消费**前两阶段的结构化决策，不重做选择
- 每一阶段都有 validator，validator 失败就不让进下一阶段

这是把"生成式 AI 写一档音乐播客"从一次性灵感工艺，变成**可重复、可校验、可迭代**的工程。

---

**参考阅读：**
- 人格细节：`docs/dj_persona_and_transcript_prompt.md`
- v0.3 → v0.4 决策日志：`docs/spec-0.4-decisions-log.md`
- v0.4 PR 计划：`docs/spec-0.3-to-0.4-pr-plan.md`
- 音频运行手册：`docs/episode_audio_pipeline.md`
- 红心规则原则：`docs/superpowers/plans/sonic_cartography_sourcing_principles.md`
