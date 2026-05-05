# Transcript 工作流自查报告

> **触发**：用户提交《诉求文件：transcript 生成工作流的下一轮修订》，要求 Claude Code 阅读 spec 0.3 当前 transcript + 工作流源码，回写诊断报告（不改代码、不改 prompt、不改 schema）。
> **作者**：Claude Code（Opus 4.7）
> **日期**：2026-05-05
> **状态**：诊断已交付，等待用户下一轮指令再决定 spec 0.4 修订方向。

---

## 5.1 工作流地图

```
[原始数据层]
  data/user_tracks.json          ← 红心库（1690 条）
  data/nodes/<node_id>.json      ← 全局节点注册表（spec §2.1 schema）
  maps/<slug>.map.json           ← 节点引用 + edges + epistemic_layer

[Phase 0 — track-curator skill]
  → playlists/<slug>.tracklist.json
     字段: position, artist, song, year, tier(hit/adjacent/blind_spot),
           is_base_node, muted_this_episode, focus_relevance_note,
           evidence_basis, netease_song_id

[Phase 1 — connections-author skill]
  → playlists/<slug>.connections.json
     每条 ConnectionPair: from_position, to_position, direction,
     kind, system_sensory_note,
     **narration_at_from.voice_zh**   ← "等会儿到 X 的 Y..." (前指)
     **narration_at_to.voice_zh**     ← "你刚才在 X 的 Y..." (回望)

[Phase 2 — transcript-author skill]  ← 当前问题层
  Skill: ~/.claude/skills/transcript-author/SKILL.md
  Prompt 模板: SKILL.md Stage 2.2 (5 段式 OPENING/FOCUS/NETWORK/RESONANCE/HANDOFF)
  RESONANCE 措辞: Foundations/episode_focus_taxonomy.md  bassline_dna 章节
  Spec 上位: Foundations/sonic_cartography_spec_v0.3.md §7B.1–§7B.5
  → episodes/<slug>.episode.md
  → episodes/<slug>.episode.json

[Phase 3 — 校验]
  tools/validate_episode_transcripts.py   字数 250–400 / 禁用词 / md↔json 同步
  tools/validate_episode_connections.py   每条 ConnectionPair 的对侧 artist+song
                                          必须出现在对应 ## Track N 段落
  musicos-exhibition/scripts/build-exhibition-json.ts + 16-assertion test
```

**关键认知**：本工作流没有"一段大 prompt"。Phase 2 的"prompt"是**三层装配**：
1. SKILL.md Stage 2.2 的 5 段式骨架（结构）
2. focus_taxonomy 里按 tier 绑死的 RESONANCE 措辞（句式）
3. connections.json 里**已经写好**的 `narration_at_from / narration_at_to` 句子（具体语料）

所以问题不只在"Phase 2 prompt 怎么写"——一部分污染源在 Phase 1 产物里就固化了。

---

## 5.2 D1–D7 逐条验证

### D1 · 模板槽位污染了叙事 — **完全成立**

- 强制 5 段 (`OPENING/FOCUS/NETWORK/RESONANCE/HANDOFF`)：`SKILL.md:52-64`
- "角色：xxx" 句式：来自 `OPENING — ... Focus role of this track in 1 sentence` 与 `tracklist.json.focus_relevance_note`（一句英文功能定位，被 LLM 直译成"角色："开头）
- "你的红心里有这首——旧路被点亮 / 这是扩张为你点亮的盲区"：直接对应 `episode_focus_taxonomy.md:20-23` 三个 tier 的 RESONANCE 模板。模板写的是**抽象指令**（"强调用户对这条贝斯线索的熟悉感"），但因为指令对每条 hit 永远一样，LLM 退化成固定句式
- "下一首，..."：来自 `HANDOFF — 1 sentence bridge to next track`
- 难度：**中等**。砍掉硬性 5 段切割容易，但 RESONANCE 的"按 tier 翻译"是 spec §7B.4 `personal_resonance` 组件的实现路径，要重设计而非简单删除

### D2 · 横向链接被一次性倾倒 — **完全成立，且有强约束加固**

- `SKILL.md:56` 明文："2–4 forward/backward references drawn from ConnectionPairs for this position"
- connections.json 里每个 to_position 的入边密度本来就高（如 position 6 Miss You 的入边有 4 条来自 1/3/5/2，出边有 4 条到 7/9/12 等），但**ConnectionPair 没有 `strength` / `priority` 字段**——LLM 没有信息来"挑最强一条"
- **关键放大器**：`validate_episode_connections.py` 强制每条 ConnectionPair 的对侧 artist+song 必须出现在指定 `## Track N` 段。校验器**强制下游必须把所有连接铺出来**，否则构建失败
- 难度：**困难**。光改 prompt 说"挑一条"行不通——会被 Validator 2 卡死。必须同时：(a) 给 ConnectionPair 加优先级字段，(b) 改 Validator 2 改成"对侧曲只在被选中那一首里强制出现"，(c) 决定那些"未被叙述但已经收集"的连接去哪里（弃 / 写入 episode.json 隐藏元数据）

### D3 · 单向性没有被强制 — **成立，且根因在 Phase 1，不在 Phase 2**

- ConnectionPair 已有 `direction` / `from_position` / `to_position`，schema 上是有方向的
- 但 Phase 1 产物 `narration_at_from.voice_zh` 已经**点名**未来曲目：例如 conn_001_to_006 的 narration_at_from 写的是"等会儿到 The Rolling Stones 的 Miss You,这条'贝斯和鼓是主体'的逻辑通过 Billy Preston 的 demo 直接传了进去"——这是在第 1 首讲第 6 首，**点名**Miss You
- Phase 2 模板 `SKILL.md:58` 又明确给出"等会儿到 X 的 Y"语法
- 你诉求里允许"匿名前指"（"会有另一支英国乐队"），当前 schema 并没有"是否点名"的开关——所有前指默认点名
- 难度：**中等**。要拆成 `foreshadow_anonymous` / `foreshadow_named` / `callback_named`，并且 Phase 1 的 narration_at_from 模板要重写

### D4 · 破折号承担所有连接 — **部分成立**

- Phase 2 prompt 没有标点约束（SKILL.md 只禁 `Track N` / `[ ]` / `第N首`）
- 但破折号污染**也来自 Phase 1**：connections.json 的 `system_sensory_note` 和 `narration_at_*` 段全是 `——`。Phase 2 LLM 在抄 Phase 1 的语调
- 难度：**容易**。在 prompt 加"避免 `——` 作主要连接，用句子结构承担"，并把 connections.json 的 narration_at_* 也按同一规则重写

### D5 · 缺少"现在响着的是什么"这一层 — **完全成立，且有 schema gap**

- node JSON schema (spec §2.1) 没有 `sound_cue` / `now_sounding` 字段
- SKILL.md:35 引用 `bass_dna_signature` 作为 FOCUS 段的素材源——**但全 vault 里没有任何节点 JSON 包含这个字段**（grep 只在 SKILL 和 taxonomy 自身里出现）。node JSON 里最接近的是 `instrumentation_details` 和 `production_facts`，但这两者都是"幕后工艺"而非"此刻可听"
- 这就是为什么 FOCUS 段持续退化为"建立 X 哲学 / 奠定 Y 模型"——LLM 抓不到具体声音，只能抓抽象功能
- spec §7B.4 `musicological_connection` 组件实际上**已经定义了**这个维度（"bass line construction (interval pattern, syncopation type ...)"），但 Phase 2 skill 里没有强制使用，validator 也没有检查
- 难度：**困难**。需要回填 18 个节点的"声音先到"字段（bass riff 描述、鼓位、声响质感），是数据层的工作量，不是 prompt 调整

### D6 · 篇幅平摊 — **完全成立**

- tracklist.json 有 `tier`（红心关系）和 `is_base_node`（仅锚点 true），但**没有 `narrative_weight`**
- SKILL.md:50 字数硬上限 250–400 对所有非 muted 曲一致
- Validator 1 同样按 250–400 卡所有曲，不分锚点/支柱/支撑
- spec §7B.5 也只给了"per NarrationBlock 250–500 ZH chars"，没有按"叙事重量"分级的概念
- 难度：**中等**。引入 `narrative_weight: anchor | pillar | supporting | bridge`，按 weight 区分字数带、组件最少集合，并改写 validator

### D7 · 缺少音乐窗口标记 — **部分成立**

- spec §7B.7 已有 `play_mode: full | excerpt` + `excerpt_range`（秒级），SSML §7B.6 已允许 `<break time="500ms"/>`
- **但 Phase 2 的 episode.md/json 既没有发出 break 标记，也没有发出 excerpt_range**——pipeline 把这些字段空着
- 数据源层面：节点 JSON 里没有歌曲段落标注（intro/verse/breakdown 时间戳）。要嘛跑 audio analyser，要嘛由作者人工加 hint
- 难度：**中等**。如果接受语义提示（"停顿,让贝斯独自走 15 秒"），改 Phase 2 prompt 加可选 `music_window` 字段即可。如果要精确秒数，需要外部数据源（Spotify API audio_analysis 或 madmom）

---

## 5.3 你看到的、我们没看到的问题

**1. 诉求文件里的"近距离 DJ"人设与 spec §7B.1 的"docent"人设直接冲突。**
spec 0.3 §7B.1 明确写："Not a DJ (the narrator does not perform energy or banter)"，`first_person_use: rare`，`personal_anecdote_use: never`。诉求 4.2 的样本里"我想让你注意一件事"、"听到了吗"、"我们到了"——这些是第二人称呼吸感强、第一人称偶发的近距离讲述者，**和 docent 是两个 persona**。这不是 prompt 调参能解决的，需要先改 spec §7B.1。

**2. `bass_dna_signature` 是死引用。**
SKILL.md 和 focus_taxonomy 都把它当主要素材源，但 node JSON schema 没有这个字段，18 个节点 JSON 里也没有任何一个填了它。当前所有 FOCUS 段都是 LLM 在 `production_facts + historical_role` 上做二次抽象——这就是"建立锚点哲学"这种空话的源头。修订时，要么把 `bass_dna_signature` 升格为 schema 必填字段并回填数据，要么改名为更通用的 `sound_cue` 并按 focus 决定填什么。

**3. 校验器是"全量铺出"的强制方。**
`validate_episode_connections.py` 把"每条 ConnectionPair 的对侧曲名必须出现在被引段"作为硬约束。这是为防"沉默回退" bug 设计的，但同时也**把 D2 的解决路径堵死了**——任何"挑一条最强"的方案都要先松开这条校验。这是诉求和现有质量保护机制的真实冲突点。

**4. Connection 信息的"无落点"问题。**
当前 connections.json 收集了大量 ConnectionPair，并且每条都自带成品 narration（system_sensory_note + voice_zh × 2）。如果 spec 0.4 决定"每首只讲一条最强连接"，剩下 70% 的连接数据要么浪费要么需要新去处。可能的去处：episode.json 隐藏元数据 / 听众端"延伸阅读" / 跨期复用。这是个产品决策，不只是工程改动。

**5. tier 和 narrative_weight 在概念上被压缩成一维。**
现在 `tier` (hit/adjacent/blind_spot) 同时承担"用户对此曲的熟悉度"和（隐式地）"叙述时该侧重个人还是公共"。但诉求 4.2 样本里 Cold Sweat (blind_spot) 篇幅大、Fame (hit) 篇幅中等、Miss You (adjacent + is_base_node) 篇幅最大——说明叙事重量主要由"在弧线上的位置"决定，与 tier 几乎正交。要分两个维度，spec 当前模型不分。

**6. spec §7B.4 里的 `musicological_connection` 组件已经"被允许"，但被遗忘。**
诉求里"声音先到"这一层，spec §7B.4 早就用具体例子写好了（"Bill Wyman 在 Miss You 里的 bass line 用的是 Chic 那种 octave-jumping 八度跳进——但他把每一拍的强重音错开了一个十六分音符..."）。这条组件被定义为 REQUIRED，但 Phase 2 skill 没有把它操作化，validator 也没有检查它的存在。**spec 写得对，skill 没接住。** 这是修订成本最低的一处——spec 不必大改，把 skill 接上去就行。

**7. 跨期复用风险。**
Miss You 这一期的修订如果改 schema（加 `narrative_weight` / `sound_cue`），所有未来的期都要重做这两个字段。这意味着：(a) `track-curator` 和 `connections-author` 这两个上游 skill 都要同步改，(b) Mk.gee/Khruangbin 等已存在的 18 个节点 JSON 需要回填，(c) 现有 tools/validate_*.py 都要改。修订一次，下游 3 个 skill + 18 个 JSON + 3 个校验器全动。

**8. exhibition-json.test.ts 的 16 个断言是隐形地基。**
musicos-exhibition 前端展览构建依赖 episode.md 的精确格式（## Track N 标题正则、Narration / Bridge 子标题、连接 artist+song 落点）。**任何 transcript 结构改动都会撞它**。修订前需要先盘清前端到底依赖哪些字段。

---

## 5.4 修订路线建议

不给具体方案，只给顺序和理由。

### 第 1 轮（spec 层，必须先动）

- 重写 spec §7B.1 narrator persona：从 "expert museum docent" → "近距离讲述者"。这是所有下游修订的合法性基础
- 在 spec §2.1 node schema 引入 `sound_cue`（或在 focus_taxonomy 把 `bass_dna_signature` 提升为 schema 必填）
- 在 spec §7B 引入 `narrative_weight` 维度，与 tier 解耦
- 重新审视 §7B.4 组件清单：`musicological_connection`（保留并上架）、`relation_to_previous`/`relation_to_next`（拆成 callback / foreshadow_anonymous / foreshadow_named 三态）、`personal_resonance`（去模板化，从硬性 RESONANCE 模板改为可选）

### 第 2 轮（数据层回填）

- 18 个节点 JSON 回填 `sound_cue`
- tracklist.json 加 `narrative_weight`
- ConnectionPair 加 `strength_score` + 拆 `foreshadow_kind`

### 第 3 轮（上游 skill 修订：connections-author）

- 现在的 `narration_at_from` 默认点名未来曲目——必须先改 Phase 1，让前指默认匿名
- 否则 Phase 2 无论怎么改都会从输入污染回去

### 第 4 轮（Phase 2 skill 重写）

- 砍掉 5 段式硬切割，换成诉求 §3 的 6 层逻辑顺序（声音先到 → 画面 → 动机 → 行动 → 一个回声 → 留白）
- 字数按 narrative_weight 分级
- "一个回声"硬约束为 ≤1 条 ConnectionPair
- HANDOFF 改为可选（仅在 anchor 前后或叙事跨度跳跃时使用），不再强制每首末尾出现
- RESONANCE 模板退役，融入"动机/画面"层

### 第 5 轮（校验器跟进，最后做）

- 放宽 `validate_episode_transcripts.py` 字数为按 weight 分段
- 重写 `validate_episode_connections.py`：从"每条都必须出现"改为"被选中的强连接必须出现，未被选中的连接归档到 episode.json 元数据"
- 新增 `validate_sound_cue_present.py`、`validate_no_named_foreshadowing.py`
- exhibition-json.test.ts 同步更新

### 为什么这个顺序

spec 是合同；data 是物料；upstream skill 是物料生产；downstream skill 消费物料；validator 是合同执行。从合同改到执行才不会反复返工。如果先改 prompt，会被校验器和上游污染源双向夹击，看似改了但产物会被打回原形。

---

## 6. 边界声明

- 本轮**没有改动任何代码、prompt、schema、validator、文档**。仅产出此报告
- 没有模仿诉求 4.2 样本措辞，只对照其结构性差异做诊断
- 已识别的两处自相矛盾：
  - (a) 诉求的 DJ 人设 vs spec §7B.1 docent
  - (b) 诉求"挑一条最强" vs validator 强制铺全
- 这两处必须用户先决断方向，再开 spec 0.4

---

*End of self-audit.*
