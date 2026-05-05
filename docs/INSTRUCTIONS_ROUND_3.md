# 第三轮指令:用户决断 + 范围收紧 + PR 推进授权

**文件性质:** 对 `docs/spec-0.4-decisions-log.md` 中 4 个 `[NEEDS_USER_DECISION]` 的回应,以及对本轮工作范围的收紧。
**前置文档:**
- `Foundations/sonic_cartography_spec_v0.4-draft.md`
- `docs/spec-0.3-to-0.4-pr-plan.md`
- `docs/spec-0.4-decisions-log.md`
- `docs/INSTRUCTIONS_ROUND_2.md`(上一轮指令)
**预期产出:** Claude Code 按本文件调整 spec 0.4 草案 + PR 计划 + decisions-log,然后**开始 PR-1 的实际执行**(本轮终于动代码了)。

---

## 一、本轮核心目标的重新声明

**本轮工作的唯一核心目标:优化叙事方式。**

不是数据基建。不是 schema 完美化。不是把所有自查报告里发现的问题一次性解决。

具体地说,本轮要让 Miss You ep 1 的 v0.4 transcript 在以下维度上明显胜过 v0.3:

- 读起来像一个人在讲故事,不像数据拼接
- 每首歌只讲一条强连接,讲透,其余归档
- 前指都是匿名的,不点名后面的歌
- 篇幅按叙事重量分级,锚点显著更长
- "下一首,..."这种过场消失
- "你的红心里有这首"这种模板句式消失
- persona 是 near_listener_v1(知识深度的 docent + DJ 场景 + 音乐爱者灵魂)

**任何与上述目标无直接关系的工作,在本轮被剥离。**

---

## 二、对 4 个 [NEEDS_USER_DECISION] 的回应

### #5 — Miss You ep 1 narrative_weight 分配:确认 + 一处调整

**最终分配:**

| Position | Track | weight |
|---|---|---|
| 1 | James Brown — Cold Sweat | pillar |
| 2 | Sly & the Family Stone — Family Affair | supporting |
| 3 | David Bowie — Fame | **pillar**(从 supporting 升级)|
| 4 | Parliament — Give Up the Funk | supporting |
| 5 | Bee Gees — Stayin' Alive | supporting |
| 6 | The Rolling Stones — Miss You | anchor |
| 7 | Blondie — Heart of Glass | supporting |
| 8 | Devo — Jocko Homo | bridge |
| 9 | Chic — Good Times | pillar |
| 10 | Joy Division — Isolation | supporting |
| 11 | Talking Heads — Once in a Lifetime | pillar |
| 12 | Queen — Another One Bites the Dust | supporting |
| 13 | Prince — When Doves Cry | supporting |
| 14 | Red Hot Chili Peppers — Give It Away | supporting |
| 15 | Daft Punk — Get Lucky | supporting |
| 16 | Tame Impala — The Less I Know the Better | supporting |
| 17 | Khruangbin — María También | pillar |
| 18 | Mk.gee — You Dreamed of Me | supporting |

**Bowie/Fame 升 pillar 的理由:** Fame 是 anchor 在美学上的直接前驱(白人摇滚艺人主动进入黑人放克低频,塑料灵魂的命名动作),讲 Miss You 时会回望它。它在叙事弧线上承担"anchor 三年前的预演"这一结构性角色。

**Mk.gee 维持 supporting:** 它是尾声而非主弧线节点,但仍是完整的一首独立 narration,不是过桥用途的极简结构。

**结构对称性:** anchor 之前两个 pillar(1 源头 + 3 anchor 直接前驱),anchor 之后三个 pillar(9 disco 精炼 + 11 方法论转折 + 17 终点)。Decision-log #5 状态从 pending → resolved。

### #14 — agent 怎么"听" musicological_signature:**整个问题悬置,本轮不需回答**

**关键决定:musicological_signature 字段的回填工作整体推迟到 v0.4.1 或之后。本轮不做。**

理由:

- 本轮核心目标是优化叙事方式,不是建数据基建。
- 18 个节点的精细听感字段是巨大的物料工程,会把本轮拖成多周工作。
- 没有这个字段不影响 D5 的核心动作("声音先到")的实现——D5 改用 prompt 引导而非数据驱动(见下面 §3 的方案变更)。

Decision-log #14 状态从 pending → **deferred to v0.4.1**。Decision-log #4(allowing "agent listening" tag)也随之 deferred。

### #15 — archive_reason enum 闭合:接受默认(closed enum)

枚举值固定为:`redundant_with_strong | low_focus_relevance | no_concrete_anchor | already_told | off_topic_for_episode`。

如果 v0.4 实际跑下来发现枚举不够用,在 v0.5 重新评估。Decision-log #15 状态从 pending → resolved。

### #16 — persona alias 保留期:接受默认(v0.4 一版,v0.5 删)

`docent_v1` 作为 `near_listener_v1` 的 legacy alias 保留一版,v0.5 删除。Decision-log #16 状态从 pending → resolved。

---

## 三、本轮范围收紧:musicological_signature 路径变更

这是本轮最大的范围调整,影响多个 PR 和 spec 章节。

### 3.1 不做的事(从 PR 计划中移除)

- **PR-2A(节点 musicological_signature 回填)** — **整个 PR 移除本轮**。推到 v0.4.1。
- **PR-5C(validate_sound_cue_present.py 新校验器)** — **整个 PR 移除本轮**。没有结构化字段就没有可校验的对象。
- spec §2.1 中关于 `musicological_signature` 节点字段的"REQUIRED"标记 — 改为 **OPTIONAL**(允许字段存在,但不强制填充,留作 v0.4.1 接力)。

### 3.2 D5("声音先到")的替代实现路径

**核心动作不变:** 每首歌的 narration 仍然要求**先指认正在响的具体声音,再讲历史/动机/动作**。这是叙事方式的核心改造,不能丢。

**实现方式从"数据驱动"改为"prompt 引导":**

在 PR-4A(transcript-author SKILL 重写)中,加入一段写作指引,大致表达以下内容(具体措辞由 SKILL 作者定):

> **开场指引(软要求):**
>
> 鼓励每首 track narration 从一个**具体的、可指认的声音元素**开场——一句话指认听者此刻耳朵里正响的东西(那条贝斯怎么走、那个鼓在哪里落、那把吉他的拨弦质感、那个人声的处理)。
>
> 调用顺序:
> 1. **优先**:从 LLM 自身音乐知识中提取该曲的具体声音元素(对著名曲目通常可行)。
> 2. **其次**:从 node JSON 的 `production_facts` / `instrumentation_details` / `historical_role` 中反推一个具体的声音描述(乐器、效果器、节奏型、混音位置)。
> 3. **回退**:如果上述两步都调不出具体声音,允许从**场景**(谁在哪里录的、什么年份、什么处境)或**动机**(为什么要做这件事)入手开场——但**绝不允许**回到 "建立 X 哲学" / "奠定 Y 模型" / "定义 Z 语法" 这种抽象功能描述。
>
> **明确禁止:** 所有把声音抽象为"角色/哲学/语法/模型"的开场。如果一句话讲不出具体的人物/动作/声音,这一句不该作为开场。

**这条是软要求,不上 validator。** 质量在 PR-4C 的人工审稿环节兜底——审稿人发现某首歌仍然以"建立锚点哲学"这种空话开场,打回重写。

### 3.3 spec §7B.4 musicological_connection 组件的处理

spec §7B.4 已定义此组件。本轮:

- **保留** §7B.4 中关于 `musicological_connection` 的定义和示例(那段 Bill Wyman 的描述非常好,作为示范继续在 spec 里)。
- **不强制** 该组件由结构化字段(`musicological_signature`)驱动。组件来源标记为"prompt-elicited from LLM knowledge + node facts"。
- v0.4.1 引入 `musicological_signature` 字段后,组件可升级为"data-driven"。

decisions-log 新增 **#17**:`musicological_connection` 组件本轮以 prompt-elicited 方式实现,v0.4.1 升级为 data-driven。

---

## 四、PR 计划调整后的最终形态

### 4.1 PR 数量与 wave 结构

| Wave | 原 PR | 调整后 PR | 状态 |
|---|---|---|---|
| Wave 0/1 | PR-1 | PR-1 | 不变 |
| Wave 2 | PR-2A, PR-2B, PR-2C | PR-2B, PR-2C | **PR-2A 移除** |
| Wave 3 | PR-3A, PR-3B | PR-3A, PR-3B | 不变 |
| Wave 4 | PR-4A, PR-4B, PR-4C | PR-4A, PR-4B, PR-4C | 不变(PR-4A 加 §3.2 的开场指引) |
| Wave 5 | PR-5A, PR-5B, PR-5C, PR-5D | PR-5A, PR-5B, PR-5D | **PR-5C 移除** |
| Wave 6 | PR-6 | PR-6 | 不变 |

**PR 总数:13 → 11。**

### 4.2 关键路径

不变,仍然 7 步串行:

**PR-1 → PR-2C → PR-3A → PR-4A → PR-4C → PR-5D → PR-6**

### 4.3 工时预期调整

decisions-log #13 估的 PR-2C "67 ConnectionPair × 1 分钟 = 1–2 小时" 偏低。匿名化是内容重写而非纯字段操作,实际平均 3–5 分钟一条,**真实工时预期 3–5 小时**。建议 PR-2C 的执行流程:

1. **先做 5–10 条样本 anonymization**,产出 diff 给用户审。
2. 用户批准措辞风格后,批量处理剩余条目。
3. 批量完成后再一次 grep 校验:`foreshadow_anonymous_at_from.voice_zh` 中不出现任何 future-position artist names。

PR-2C 的 acceptance criteria 已包含上述步骤,工时调整在 decisions-log 中记录(新增 **#18**)。

---

## 五、PR-4A 的几条强化要求

PR-4A 是整套修订的最高杠杆 PR。以下要求是本轮指令对 PR-4A 的强化:

### 5.1 必须包含 §3.2 的"声音先到"开场指引

详见上面 §3.2 全文。这是 D5 在没有 musicological_signature 字段情况下的替代实现,不能省。

### 5.2 必须强制 dry-run 才能合并 PR-4C

acceptance criteria 已要求 "Dry run on a fictional 4-track mini-episode"。本轮强化:

- dry-run 的 4-track mini-episode 必须包含**至少一种 weight 类型**(anchor / pillar / supporting / bridge 各至少一首,虽然 4 首装不下全部 4 种但至少要 anchor + 一种其他)。
- dry-run 的输出必须经过 PR-5A、PR-5B 校验器(不需要 PR-5C,因已移除)。
- dry-run 输出必须经过人工审稿,审稿人对照本指令文件 §1 列出的目标维度逐项判定。
- dry-run 不通过则 PR-4A 不能合并;PR-4A 不合并则 PR-4C 不能开始。

### 5.3 SKILL 中的写作指引必须包含具体反例

不仅写"该怎么做",还要写"不该怎么做",并附具体例句。例如:

- ❌ "James Brown,1967 年的 Cold Sweat——funk 的零号节点。贝斯 DNA 角色:..."
- ✅ "先听这个鼓。听到了吗,kick 落下来的那一下,贝斯就跟上去——它们不是两件乐器,它们是一件事。1967 年,James Brown 在 King Records 的录音棚里..."

(注:上述例句仅作 SKILL 内部对照参照,**不是 transcript 模板**——SKILL 必须明确告诉 LLM "不要模仿措辞,要模仿结构"。)

### 5.4 persona near_listener_v1 的具体边界要写在 SKILL 里

上一轮指令(ROUND_2)§2 决断 #1 已给了 persona 完整描述,SKILL 必须把那段措辞**完整搬入或在 SKILL 中链回 spec §7B.1**,不能只写"绑定 near_listener_v1 即可"——LLM 看不到隐式约束,要把"鼓励引导性第二人称"、"禁止表演亢奋"、"禁止讲段子"等具体边界明示。

---

## 六、本轮授权:开始执行

### 6.1 你被授权开始的工作

按 PR 计划顺序执行。从 PR-1 开始动代码。

每个 PR 合并前:

- 自我对照 acceptance criteria 是否全部满足
- 关键 PR(PR-2C 样本批准、PR-4A dry-run、PR-4C 人工审稿)在用户审核前不要标 ready

### 6.2 仍需用户介入的节点

下列节点需要 stop-and-confirm,你不要在用户回复前继续:

1. **PR-2C 样本** — 5–10 条 anonymization 样本完成后停下,让用户审核措辞风格。
2. **PR-4A dry-run 输出** — 4-track mini-episode 跑出来后停下,让用户判定是否达到 §1 的目标维度。
3. **PR-4C 完整重生成** — Miss You v0.4 transcript 全文跑出来后停下,让用户审稿。

其他节点 Claude Code 自主推进。

### 6.3 处理意外的方式

执行过程中如果发现:

- 本轮指令与 spec 0.4 草案某处冲突 → 在 decisions-log 新建条目记录,采纳本指令文件的判断(本指令文件优先级高于 spec 0.4 草案)。
- 本轮指令未覆盖的边界情况 → 在 decisions-log 标 `[NEEDS_USER_DECISION #N]` 并继续推进,采用合理 default。
- 实际工时严重偏离预期(单 PR > 估值 2 倍) → 暂停,说明原因,询问是否继续 / 拆分 / 推迟。

### 6.4 不要做的事

- 不要把 musicological_signature 偷偷塞回本轮(它整个推到 v0.4.1)。
- 不要在 PR-4A 的 SKILL 中**强制**任何 prompt 字数 / 句式 / 节奏(persona、6 层逻辑顺序、强连接 ≤1 这些是结构性约束;具体怎么写是 LLM 的判断)。
- 不要在 PR-4C 的 transcript 里模仿 INSTRUCTIONS_ROUND_1.md 4.2 节样本的措辞。结构对齐即可。
- 不要试图在本轮把 spec §7B.11(Interlude)展开 — 仍 v0.4.1。

---

## 七、验收标志(本轮做完什么算成功)

11 个 PR 全部合并 + 以下条件成立:

1. `make validate-episode SLUG=rolling-stones_some-girls_miss-you` 通过(基于 v0.4 校验器)。
2. `episodes/rolling-stones_some-girls_miss-you.episode.md` 在以下维度对照 v0.3 显著改进:
   - persona 是 near_listener_v1 的近距离讲述者
   - 每首 non-anchor non-bridge track 在 narration 中只点名一条 ConnectionPair 的对侧曲
   - 所有前指都是匿名的(grep 不到 future-position artist names 在 foreshadow 文本中)
   - 篇幅按 weight 分级:anchor 600–900 / pillar 350–500 / supporting 220–340 / bridge 60–150,全部在带内
   - 没有"下一首,..."模式
   - 没有"你的红心里有这首"模式
   - 大部分 track 从具体声音元素开场(软要求,人工抽检通过即可)
3. `archived_weak_connections` 在所有 non-anchor non-bridge track 上非空。
4. exhibition front-end build 通过。
5. v0.5 backlog 中包含:musicological_signature 数据回填、validate_sound_cue_present.py 上线、Interlude 详细设计、agent listening tier、跨期 reuse 等。

完成上述全部 → 本轮收尾,等用户决定下一轮(可能是 v0.4.1,可能是 ep 2 试跑,可能是其他方向)。

---

*开始执行。从 PR-1 出发。*
