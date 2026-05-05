# 第二轮指令:授权起草 spec 0.4 + 修订路线 PR 计划

**文件性质:** 这是对 Claude Code 自查报告(`2026-05-05-transcript-workflow-self-audit.md`)的回应 + 下一轮工作授权。
**预期产出:** Claude Code 起草 **spec 0.4 草案** + **修订路线 PR 计划**(分阶段、可独立合并的修订步骤),不直接动代码。
**前置假定:** 你已读过自查报告并认可它的工作流地图、D1–D7 验证、5.3 节"看到我们没看到的问题"、5.4 节修订路线建议。本文件只在你的诊断之上补充用户决断,不否定你的判断。

---

## 一、自查报告的接收回应

报告质量很好。你不只验证了 D1–D7,更重要的是揭示了几件我们从产物反推时看不到的事:

- **污染源是三层装配,不只在 Phase 2。** Phase 1 的 connections.json 里 `narration_at_from / narration_at_to` 已经把"等会儿到 Miss You..."这种点名前指写死成了成品语料。Phase 2 的 LLM 是在抄 Phase 1 的语调。这意味着任何只动 Phase 2 prompt 的修订都会被上游污染回去。
- **`validate_episode_connections.py` 是"全量铺出"的强制方,反向锁死了 D2 的解决路径。** 这是一处主动阻止简洁性的质量保护机制——必须连带松开。
- **§7B.4 的 `musicological_connection` 组件早就定义了"声音先到"维度,但 SKILL 没接住,validator 没检查。** spec 写得对,实现没到位。这是 D5 修订成本最低的入口。
- **`bass_dna_signature` 是死引用。** SKILL 和 taxonomy 把它当主要素材源,但 schema 里没这个字段,18 个节点 JSON 里没一个填了它。这是当前 FOCUS 段持续退化为"建立 X 哲学"空话的根因。
- **DJ 人设 vs spec §7B.1 的 docent 是真实合同冲突。** 不是 prompt 调参能解决的。
- **跨期复用风险**(报告 5.3 §7)和 **exhibition-json.test.ts 的 16 个隐形断言**(报告 5.3 §8):任何 schema 改动会牵动 3 个 skill + 18 个 JSON + 3 个校验器 + 前端展览。spec 0.4 的修订路线必须考虑这些下游连锁。

我们采纳你 5.4 节提出的修订顺序:**spec → data → upstream skill → downstream skill → validator**。本指令文件不改这个顺序,只补充用户决断。

---

## 二、用户决断:对你报告里两处待决断点的明确回应

### 决断 #1 · Persona 冲突的解决方向

**保留 spec §7B.1 的 docent 知识深度,但放松成 DJ 场景。** 重写为:

> **a knowledgeable docent-like DJ with a soul of music love, passion, and storytelling — the scene is still DJ.**

落到 spec §7B.1 的具体改动方向:

- **场景设定(scene):** DJ booth / 深夜电台 / 旁边播着歌,音量稍低。讲述伴随音乐,不是悬空讲解。
- **底色(epistemic ground):** 保持 docent 的研究厚度——具体的人、具体的录音棚、具体的乐器、具体的年份。**不放弃事实密度。**
- **灵魂(stance):** 音乐爱者 + 讲故事的人。有热情但不表演热情。有热爱但不外化为亢奋。
- **对原 spec 的具体松绑:**
  - `first_person_use: rare` → 改为 `first_person_use: occasional, for guidance`("我想让你注意一件事"、"我们到了"这种**引导性**第一人称允许;**自传性**第一人称仍然 never)。
  - `personal_anecdote_use: never` → 保持 never。讲述者不讲自己的故事,只讲音乐的故事。
  - `direct_address: rare` → 改为 `direct_address: encouraged at sonic cues`(在指认正在响的声音时鼓励第二人称——"听这条贝斯"、"你听这个鼓"、"你想想这件事")。
  - 新增明示禁止项:**不表演亢奋**(no performed energy)、**不讲段子**(no banter)、**不卖弄熟络**(no false intimacy)。
- **辨识界线:**
  - **像 docent 但不是 docent** — 比博物馆讲解员更近距离、更口语、更允许引导性第二人称。
  - **像 DJ 但不是普通 DJ** — 不报歌名、不喊口号、不做电台 jingle。是带着研究的 DJ。
  - **像作者但不是作者** — 不在文本里出现"我认为"、"我觉得";判断融在叙事里。

**这个 persona 适用于所有 NarrationBlock,不只是 Track 段落。** Opening / Interlude / Closing 同样按这套。

### 决断 #2 · 强连接 vs 弱连接的处理

**核心判定:每首 track 只在 narration 中讲透一条**强连接**。其余连接归档为弱连接,进入 `episode.json` 的隐藏元数据,供前端展览(musicos-exhibition)消费,不进口播文本。**

下面是这个机制需要表达的复杂性,请在 spec 0.4 schema 里设计。

#### 强连接的四个特征(用于 LLM 评分)

ConnectionPair 在某个 track 的入边集合中被排为"强"的标准:

1. **能驱动叙事推进。** 不仅说明 X 影响了 Y,而是这个连接本身是一个**故事**——有动作、有动机、有结果。Cold Sweat → Miss You(Billy Preston 把贝斯线带进 Miss You)是故事;"Cold Sweat 也影响了 Miss You 的低频"不是故事。
2. **有具体的、可指认的载体。** Billy Preston 这个人 / Sigma Sound 这个录音棚 / Bernard Edwards 那把琴 / John Deacon 坐在 Edwards 旁边——具体可被讲述的事物。不是抽象的"哲学传承"。
3. **有据可查或有强公共共识。** 经得起追问:谁说的、什么时候说的、有没有访谈/纪录片/乐手亲口承认。
4. **和本期 focus 直接相关。** bassline DNA 这一期里,关于贝斯线传承的连接强;关于歌词主题的连接弱(不管多有趣)。

#### 弱连接的四种典型形态(用于 LLM 排除)

1. **同范畴的并列关系。** "X 同年也做了同一件事"——并行不是因果。除非这种"同时性"本身是叙事点(比如双子时刻 Heart of Glass / Miss You),否则不进 narration。
2. **氛围相似但无证据链。** 仅靠声音感觉相近作出的关联,没有具体的人/录音/事件作为载体。
3. **多跳间接关系。** "X→Y→Z 所以 X→Z"。三跳以上一般要排除,除非中介本身值得讲。
4. **重复的同类回声。** 同一种关系类型(例如"贝斯锁鼓")在前面已被讲透,后面再讲是冗余。**这条尤其重要——它是动态的,取决于讲述顺序,不是 ConnectionPair 的固有属性。**

#### 关键设计:per-track 排序 + 已用降权

强弱不是 ConnectionPair 的全局属性,而是:

```
strength_in_track(pair, track) = f(
    intrinsic_score(pair),        # 基于上述四特征,LLM 评一次
    focus_relevance(pair, focus), # 和本期 focus 的相关度
    already_used_penalty(pair),   # 在前面 track 已被讲透过则大幅降权
    redundancy_penalty(pair)      # 同类型连接已讲过则降权
)
```

**这意味着同一条 ConnectionPair:**

- 在 from 端可能排第 1(被讲透),在 to 端排名会自动降低(避免重复)。这给作者**换档拿别的**的可能——例如 Cold Sweat 段讲透 Cold Sweat → Bootsy 之后,到 Give Up the Funk 段时这条连接降权,作者可以选 Sly → Bootsy 这条作为强连接(Bootsy 如何接收 Sly 的鼓机驱动经验)。
- 在 anchor track(Miss You)前后地位特殊——anchor 之前所有连接都是"通往 anchor"的,anchor 之后所有连接是"从 anchor 出发分叉的"。强度评分需要感知 anchor 位置。

#### 判定流程:LLM 排序 + 作者终决

- **LLM 自动:** 对每个 track 的入边集合,基于上面四特征 + 已用降权打分,产出**排序后的候选清单**(top 3 候选 + 它们的故事核要点 + 为什么排在这个位置)。
- **作者终决:** 人工选一条作为该 track 的强连接,其余自动归档为弱连接。
- **schema 需要表达:**
  - 每个 ConnectionPair 的 `intrinsic_score`(全局,LLM 评)。
  - 每个 ConnectionPair 在每个 track 上的 `selected_as_strong: bool`(作者填,默认 false)。
  - 每个 track 的 `chosen_strong_connection_id`(单选,引用一条 ConnectionPair)。

#### 弱连接的去处

**不丢、不弃用,归档到 episode.json 的隐藏元数据。** 前端展览 / 跨期检索 / 后续期可重新调用。具体落点:

```
episode.json:
  tracks:
    - position: N
      narration: "..."  # markdown
      strong_connection_id: "conn_xxx_to_N"  # 单条
      archived_weak_connections:             # 数组,不进 narration
        - connection_id: "conn_yyy_to_N"
          intrinsic_score: 0.7
          archive_reason: "redundant_with_strong" | "low_focus_relevance" | "no_concrete_anchor" | "off_topic_for_episode"
        - ...
```

**Validator 改动方向:**

- `validate_episode_connections.py` 当前的"每条 ConnectionPair 对侧曲名必须出现"必须松开。
- 改为:**被 `selected_as_strong` 标记的 ConnectionPair**,其对侧 artist+song 必须出现在该 track 段落。
- 未被选中的 ConnectionPair 必须出现在 `archived_weak_connections` 里(防止丢失)。
- 这样既保留了"防沉默回退"的初衷,又给了 narration 自由。

---

## 三、新增设计原则(本轮决断引出的新约束)

下面这些是这次决断带来的新原则,请在 spec 0.4 中表达。

### 3.1 narration 内连接表达的硬约束

- 每个 track 段落 narration 中**最多出现 1 条 ConnectionPair 的具名指认**,即被 `selected_as_strong` 标记的那条。
- 但允许 narration 中**回望前面已讲过的多个 track**(callback) — 这不是 ConnectionPair 的"使用",而是叙事的呼应。例如 Miss You 段可以一句话扫过"James Brown 的鼓贝斯、Sly 的鼓机、Bowie 的塑料灵魂、Parliament 的贝斯飞船、Bee Gees 的舞池贝斯"作为汇流回顾——这是叙事回望,不算"使用 ConnectionPair"。
- **匿名前指**(foreshadow_anonymous)被允许但不与 ConnectionPair 强弱机制挂钩 — 它是讲述者对未来的暗示,不是结构性引用。

### 3.2 三态 foreshadow 拆分

ConnectionPair 当前的 `direction` 字段需要细化。从用户角度看,有三种合法的关系叙述模式:

| 模式 | 描述 | 是否点名后续曲目 | 何时使用 |
|---|---|---|---|
| `callback_named` | 在当前 track 回望前面已讲过的 track | 可点名(已讲过) | 任何 track 都可,适合 anchor 之后的汇流 |
| `foreshadow_anonymous` | 在当前 track 暗示未来会发生的事 | **不可点名** | 任何 track 都可,适合制造悬念 |
| `foreshadow_named` | 在当前 track 明示未来某 track | 可点名 | **谨慎使用,默认禁止** —— 仅在 Opening / Interlude 这种结构性篇章允许;track narration 中不允许 |

**Phase 1 connections-author 的 `narration_at_from` 默认行为必须从 `foreshadow_named` 切到 `foreshadow_anonymous`。** 这是污染源头,不改这里下游怎么改都没用。

### 3.3 narrative_weight 的引入与篇幅分级

引入新字段 `narrative_weight: anchor | pillar | supporting | bridge`,与 `tier` 完全正交(tier 是用户红心关系,weight 是叙事位置)。

| weight | 篇幅(中文字数) | 内在结构要求 | 强连接数 |
|---|---|---|---|
| anchor | 600–900 | 6 层全展开,声音先到 → 处境 → 动机 → 行动 → 多条回望 + 前指 → 留白 | 0 条(因为它是所有连接的目的地;不是引用别人,而是别人引用它) |
| pillar | 350–500 | 6 层皆有,但每层精炼 | 1 条 |
| supporting | 220–340 | 可省略 1–2 层(例如处境一句带过) | 1 条 |
| bridge | 60–150 | 一两句过桥,只承担"贝斯线在这里短暂沉默/转折"等结构功能 | 0–1 条 |

**注:** 当前 spec §7B.5 的 250–500 一刀切,validator 的 250–400 同样一刀切——必须按 weight 重写。

### 3.4 sound_cue 的激活路径

报告 5.3 §6 指出:**§7B.4 的 `musicological_connection` 组件已经定义了"声音先到"维度,只是 SKILL 没接住。**

修订时优先选这条路径——**激活已有的 §7B.4 组件,而不是新增字段**。具体:

- 在 §7B.4 把 `musicological_connection` 标为每个 NarrationBlock 的 **REQUIRED 开场组件**(必须出现在叙述前 1/3)。
- 现有定义里举例的 "Bill Wyman 在 Miss You 里的 bass line 用的是 Chic 那种 octave-jumping 八度跳进——但他把每一拍的强重音错开了一个十六分音符" 这种粒度,作为标准。
- 数据来源:回填 18 个节点 JSON 的 `musicological_signature` 字段(把当前的死引用 `bass_dna_signature` 重命名并实做)。
- Validator 新增 `validate_sound_cue_present.py` —— 检查每个 track 的 narration 前 1/3 是否出现了 musicological_signature 里的具体声音元素(可用关键词匹配或 LLM 判断)。

### 3.5 篇章间过场的去模板化

当前每首 track 末尾的"下一首,..."是模板化过场。修订方向:

- **删除强制 HANDOFF 段**,不再要求每首末尾出现过场。
- **结构性间奏(Interlude)承担大段落之间的连接** —— 例如锚点 Miss You 之后到 Khruangbin 之前可以有一段 Interlude("五十年过去了。从 James Brown 锁死鼓贝斯的那个录音室,经过 disco 的舞池..."),做整期的几何节点。
- **track 之间的连接由叙事内部张力承担** —— 一段 narration 的结尾可以是一个开放性悬念("但今天先听这一首。听 kick 和贝斯怎么咬。"),下一段直接进入,不需要过场。
- spec §7B 新增 **Interlude block type**,与 Opening / Track / Closing 并列。

---

## 四、给 Claude Code 的工作授权

### 4.1 你被授权产出的文档(本轮交付)

1. **`Foundations/sonic_cartography_spec_v0.4-draft.md`**
   - 基于 v0.3 全文 diff 改写。在每处变更点旁边用注释或 changelog 表说明:**改了什么 / 为什么改 / 对应本指令文件第几节 / 对应自查报告 D 几**。
   - 不必一次写完所有细节——优先级最高的章节(§2.1 node schema、§7B.1 persona、§7B.4 components、§7B.5 length/weight、§7B.7 connection schema、新增 Interlude block)写完整;次要章节可以先标占位 + 决策方向。

2. **`docs/spec-0.3-to-0.4-pr-plan.md`**
   - 基于自查报告 5.4 节的修订顺序展开。每一步要包含:
     - 改什么(文件 / 字段 / 函数)
     - 为什么(链回 spec / 决断)
     - 阻塞依赖(上一步必须完成)
     - 风险点(尤其跨期 / exhibition test 影响)
     - 验收标准
   - 拆成可独立合并的 PR。每个 PR 不要太大(目标:单 PR ≤ 300 行 diff)。
   - 标出**哪些 PR 可以并行**、**哪些必须串行**。

3. **`docs/spec-0.4-decisions-log.md`**(新增)
   - 记录本轮所有重要决策的"为什么"。例如:为什么不新增 sound_cue 字段而是激活 musicological_connection?为什么 anchor 的强连接数是 0?为什么 callback_named 不受 ≤1 条约束?
   - 这是为了未来跨期一致性 + 防止下次修订重复讨论。

### 4.2 明确的边界

- **本轮仍不改任何代码 / prompt / validator 实际实现。** 只产出上述三份文档。
- spec 0.4 草案要做到**实现路径清晰**——读完知道下一步动哪个文件、改哪一行——但不要附实际代码。
- PR 计划要**自洽**——每个 PR 是独立的工作包,不依赖未规划的工作。
- **遇到本指令文件没写清楚或自相矛盾的地方,请在 decisions-log 里标 `[NEEDS_USER_DECISION]` 并继续推进**——不要为了等回答而停摆。**用户会在 decisions-log 上回应,不在 spec/PR 计划上来回改**。
- **如果发现自查报告里有判断不准的地方,可以修正——但要在 decisions-log 里说明。** 自查报告是工作底稿不是合同。

### 4.3 优先级提示

如果时间或复杂度迫使你必须取舍,以下是优先级:

1. **必做:** persona 重写 (§7B.1) + Foreshadow 三态拆分 (§7B.7) + connections-author 的 narration_at_from 默认行为修改建议。**这三件是污染源头,不改这里下游一切修订无效。**
2. **强烈建议做:** narrative_weight 引入 + sound_cue 通过 musicological_connection 激活 + validator 松绑路线。
3. **可以放到 v0.4.1 / v0.5:** Interlude block type 设计、跨期复用机制、exhibition-json 同步策略。

### 4.4 不要做的事

- 不要试图模仿前一轮诉求文件 4.2 节样本的措辞;那是这一期 Miss You 的特定文本,不是模板。spec 应保持抽象。
- 不要为了"看起来兼容"而保留明显需要废弃的字段(例如 RESONANCE 模板)。**该砍就砍,在 changelog 里记录废弃理由。**
- 不要在 spec 草案里塞满"未来可能..."的扩展点。spec 是合同,合同要硬。可选未来在 decisions-log 里记。

---

## 五、回到一个根本问题

整套修订的目的不是让 transcript "好看一点",而是让它**真正成为口播文稿**——一个人在你耳边讲故事的样子。所有 schema 字段、prompt 改动、validator 调整,最终都服务于这一件事。

如果某条修订和这个目的没对上,请在 decisions-log 里指出来。我们宁可少改、改对,不要全改、改歪。

---

*开始工作。完成后等用户读三份文档,再决定第三轮(实施)怎么开。*
