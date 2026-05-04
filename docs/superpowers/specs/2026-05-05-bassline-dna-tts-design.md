# Bassline DNA TTS 叙事化 — 设计稿

**日期**:2026-05-05
**关联**:`musicos-exhibition/`、`playlists/rolling-stones_some-girls_miss-you.*`、`episodes/rolling-stones_some-girls_miss-you.episode.*`
**前置 spec**:`Foundations/sonic_cartography_spec_v0.3.md`
**状态**:待实施(brainstorming → 待生成 implementation plan)

---

## 1. 问题与目标

### 1.1 问题
当前展览主页与 transcript 没有把"歌与歌之间的关联"暴露出来:用户看到 18 首歌的列表,但看不到它们之间的影响关系、乐理连续性,也看不到这条线和自己红心歌单的共鸣。所有联系都埋在 playlist.md 的散文里,没有被结构化、没有被双向引用、没有被 TTS 朗读出来。

### 1.2 目标
让每首歌的呈现(视觉 + TTS)能让人听见**它在网内的位置**:
- 它继承了谁的 bass(上游)
- 它启发了谁的 bass(下游)
- 它和同代谁走了相反的路(横向)
- 它和你的红心歌单是命中、邻接,还是盲区

口播气质:**一位有热情的乐评人/音乐人在带你走这条线**,不是内心独白,是面向听众的解说。允许主观感官指认("这个 bassline 是那个的雏形"),但要有迹可循。

### 1.3 本期范围(scope discipline)
本轮只做 **Miss You · 第 1 期 · bassline DNA 谱系**——这一期的所有联系**只**讨论贝斯线传承,从 James Brown 一路到 Khruangbin。其他维度(voicing、人声切分、鼓机谱系…)留给后续期次。

---

## 2. 架构决定:两层分离

| 层 | 文件 | 内容 | 生命周期 |
|---|---|---|---|
| **L1 结构边** | `maps/<slug>.map.json` 的 `edges[]` | A 影响 B 的历史事实(已有结构) | 全局,跨地图共用 |
| **L2 策展引用** | `playlists/<slug>.connections.json`(新) | 本播单内 A↔B 的可口播叙事化引用 | 本期专属 |

L2 的每条引用可以(但不必)关联到 L1 的某条 edge。**纯听感引用**(例如"这个 hi-hat 切分让我想起第 11 首"——历史上无影响关系)合法存在,标 `backed_by_edge_id: null` + `evidence_basis: "sensory"`。

**为什么不直接扩 map.edges**:同一条 A→B 边可以被多张播单、多期不同视角各自包装成不同叙事。把可朗读层放在 playlist 维度,既保持 map 事实纯净,也允许同节点在不同期里被讲不同的故事。

---

## 3. 数据模型

### 3.1 `playlists/<slug>.connections.json`

```json
{
  "playlist_slug": "rolling-stones_some-girls_miss-you",
  "episode_number": 1,
  "episode_focus": "bassline_dna",
  "episode_title_zh": "Miss You · 第 1 期 · bassline DNA 谱系",
  "episode_title_en": "Miss You · Episode 1 · The Bassline DNA Lineage",
  "episode_arc": {
    "from": { "position": 1, "label": "James Brown — Cold Sweat (1967)" },
    "to":   { "position": 17, "label": "Khruangbin — María También (2018)" },
    "coda": { "position": 18, "label": "Mk.gee — You Dreamed of Me (2024)" }
  },
  "connection_kinds_in_scope": [
    "bassline_prototype",
    "groove_dna",
    "personnel_bridge_bass",
    "gear_lineage_bass"
  ],
  "muted_positions": [8],
  "connection_pairs": [ /* see 3.2 */ ]
}
```

### 3.2 `connection_pair` 对象

```json
{
  "id": "conn_005_to_009_bassline_pushed_forward",
  "from_position": 5,
  "to_position": 9,
  "direction": "from_inspires_to",
  "kind": "bassline_prototype",
  "evidence_basis": "musicological",
  "backed_by_edge_id": "edge_003_or_null",
  "system_sensory_note": "Bee Gees 已经把贝斯顶到 falsetto 之下的第一线,Edwards 把它做得更冷、更精细。",
  "narration_at_from": {
    "voice_zh": "等会儿到 Chic 的 Good Times 你会再撞见一次,只是更冷、更精细。",
    "voice_en": "..."
  },
  "narration_at_to": {
    "voice_zh": "你刚才在 Bee Gees 的 Stayin' Alive 已经听过它的雏形——同一种四四拍底下被顶上来的低音。",
    "voice_en": "..."
  },
  "user_overrides": []
}
```

**字段约束**:
- `kind`(枚举,本期只用 4 种,见 §3.1 `connection_kinds_in_scope`)
- `evidence_basis`:`musicological` | `historical` | `sensory`
- `direction`:`from_inspires_to` | `lateral_dialogue` | `inversion_counterpoint`
- 两端 narration 文本**必须**:(a) 念出他歌的"艺人 + 曲名"全名;(b) 不含括号、ID、技术符号;(c) 中文 ≤80 字 / 英文 ≤30 words

### 3.3 联系配额(per track)

| 类型 | 上限/首 | 锚点(Miss You)放宽到 |
|---|---|---|
| 上游(被谁影响)| 2 | 3 |
| 下游(影响了谁)| 2 | 3 |
| 横向(同代对话/反例)| 1 | 1 |
| **合计** | **≤5** | **≤7** |

**筛选原则**:不是"有任何关系"都进,而是该联系的乐理/听感/人际证据足够具体到可以被乐评人讲出口。模糊的"都是 funk"不算。

### 3.4 `user_override` 子对象

```json
{
  "type": "append" | "replace" | "reject",
  "applies_to": "narration_at_from" | "narration_at_to" | "sensory_note",
  "user_note": "我觉得这条 bassline 更像 Pino Palladino 在 D'Angelo Voodoo 上的 pocket,不是 Bootsy 路数",
  "created_at": "2026-05-05T12:00:00Z"
}
```

---

## 4. TTS 脚本模板

### 4.1 普通曲目结构

```
[OPENING]    艺人 · 年份 · 专辑 · 流派(一句念出)
[FOCUS]      一句策展定调 —— 这首歌在 bass DNA 谱系上的角色
[NETWORK]    ≤5 条网内引用,织进散文(上游+下游+横向)
[RESONANCE]  一句红心共鸣(命中/邻接/盲区,见 §5)
[HANDOFF]    一句过渡到下一首
```

约束:
- 全段中文 250–400 字 / 英文 100–180 words
- 引用其他歌**必须**念全名(艺人 + 曲名),不能用"刚才那首""第 5 首"
- NETWORK 段必须叠加上游与下游各至少一条(锚点除外,锚点可全下游)

### 4.2 哑歌(本期 mute)结构

```
[BRIDGE]     40–80 字 / 20–35 words 的过门:
             承认它本期不是主角,指出它在哪一期会成为主角,简短承接到下一首。
```

字段:`muted_this_episode: true` + `bridge_narration_zh` / `bridge_narration_en`。
本期 muted_positions:`[8]`(Devo · Jocko Homo)。

### 4.3 渲染示例(Track 9 · Chic — Good Times)

> "Chic,1979 年的 *Risque*——后期 disco 最干净的一面。 *Good Times*。
> Bernard Edwards 那条 bassline 是这一期的腰部支柱:他把贝斯从'底下垫着'推到了'歌的第一线',这是后面所有人都要交学费学的一课。
> 你刚才在 Bee Gees 的 *Stayin' Alive* 已经听过它的雏形——同一种四四拍底下被顶上来的低音,只是 Edwards 把它做得更冷、更精细。再往前一首是 James Brown 的 *Cold Sweat*,贝斯和军鼓咬死的那种逻辑,Edwards 是直接继承的。
> 等会儿到 Queen 的 *Another One Bites the Dust*——John Deacon 听了 *Good Times* 之后写出的那条 bass riff,本质是 Edwards 这条线被搬进体育场摇滚的版本;再往后到 Daft Punk 的 *Get Lucky*,Nile Rodgers 本人还在,贝斯由 Nathan East 接手,那是这条 DNA 在数字时代的复活。
> 这首你的歌单里有——这条线对你不是新的,是旧路被点亮。
> 听完它的两遍 chorus,我们就跳到 1980 年,曼彻斯特,Joy Division 的 Peter Hook 把贝斯做了一件完全不一样的事。"

---

## 5. 红心共鸣三档

| 档 | 检测规则 | TTS 句式(中文) |
|---|---|---|
| 🔴 hit | artist + song 在 `Foundations/网易云红心歌单_全量.md` 命中 | "这首你的歌单里有——这条线对你不是新的,是旧路被点亮。" |
| 🟡 adjacent | song 没命中,但 artist / album / 同厂牌在歌单里 | "这位你认识——你心里收着 [matched_song],只是没收过这首。" |
| ⚪ blind-spot | 0 命中 | "这首、这位 bassist,你的歌单里完全没出现过——这是这次扩张为你点亮的盲区。" |

新工具 `tools/red_heart_match.py`:
- 输入:node(含 artist / song / album)
- 输出:`{ tier: "hit"|"adjacent"|"blind_spot", matched_seeds: [{type, value, source_line}] }`
- 数据源:`Foundations/网易云红心歌单_全量.md`(每行一条 `艺人 - 曲名`)

---

## 6. 用户修订回路(iii-轻量版)

### 6.1 UI 触点
每条 NETWORK 引用旁有"我想加一句 / 我不同意"按钮 → 写入对应 `connection_pair.user_overrides[]`。

### 6.2 回灌
- `tools/build_calibration_digest.py` 扫所有 playlist 的 `connections.json`,聚合 `user_overrides`,生成 `Foundations/user_calibration_corpus.md`
- 后续扩张时,所有 generative agent 的 system prompt 自动读取此 digest 作为"已知用户耳朵校准"
- **绝不**回写或覆盖历史叙事——修订是只增累积层

### 6.3 不在本期范围
UI 编辑器、按钮交互、回写后端 API。本期只定义数据 schema 与文件路径,UI 实现可作为后续 plan。

---

## 7. 文件改动清单

### 7.1 新增
- `playlists/rolling-stones_some-girls_miss-you.connections.json`
- `tools/red_heart_match.py`
- `tools/connection_renderer.py`(pair → TTS 段落)
- `tools/build_calibration_digest.py`
- `Foundations/user_calibration_corpus.md`(初始空文件 + 头部说明)

### 7.2 修改
- `musicos-exhibition/src/types.ts`:`TrackExhibit` 新增字段:
  ```ts
  genre: string | null;
  episode_focus: string;          // "bassline_dna"
  red_heart_tier: 'hit' | 'adjacent' | 'blind_spot';
  red_heart_matched_seeds: { type: string; value: string }[];
  muted_this_episode: boolean;
  bridge_narration_zh: string | null;
  bridge_narration_en: string | null;
  // 网内引用从 connections.json join 而来,运行时拼接到:
  connections_in:  ConnectionRef[];
  connections_out: ConnectionRef[];
  connections_lateral: ConnectionRef[];
  ```
- `musicos-exhibition/data/exhibition.json`:回填上述字段
- `episodes/rolling-stones_some-girls_miss-you.episode.json`:
  - 顶层新增 `episode_number`, `episode_focus`, `episode_arc`
  - 每首歌的 transcript 按 §4 模板**重生成**(旧文本归档为 `.episode.v0.1.json`)
- `playlists/rolling-stones_some-girls_miss-you.playlist.md`:重写为 bass DNA 视角;现 v0.2 自动归档

### 7.3 不动
- `maps/rolling-stones_some-girls_miss-you.map.json` 结构(必要时补充缺失的 bass 相关 edge 描述,但 schema 不变)
- `data/nodes/*.json`
- `tools/node_registry.py` / `tools/coverage.py`

---

## 8. 不在本期范围(YAGNI)

- 多期(episode 2+)的具体内容
- 视觉端的网状节点图(用户已明确否决)
- 卡片首屏徽章信息墙(用户已明确否决)
- 用户修订 UI 的交互实现(只定义数据 schema)
- 跨地图引用("此节点也出现在你的另一张地图里")
- 自动生成不同地图之间的二级关联

---

## 9. 验收标准

- `playlists/.../connections.json` 存在且包含 ≥40 条 `connection_pair`(18 首,平均 ~2.5 上游 + ~2.5 下游 / 首,去重后)
- 每首非 muted 曲目的 TTS 段落:NETWORK 段同时含 ≥1 上游 + ≥1 下游引用,且全部以"艺人 + 曲名"全称引用
- Track 8(Devo)使用 BRIDGE 模板,40–80 字,显式承接到 Track 9
- 每首歌都有非空的 `red_heart_tier`,且当 tier 非 blind-spot 时 `matched_seeds` 非空
- exhibition.json 中所有新字段无 null(允许的 nullable 除外)
- 没有任何 TTS 文本里出现 "Track N" / 方括号 / ID

---

## 10. 待 implementation plan 决定的细节

- L2 → exhibition.json 的 join 时机:运行时(loader)还是构建时(脚本)
- connections.json 生成方式:LLM 一次性生成全部 pair 还是按 track 逐首生成
- 红心歌单匹配的模糊规则细节(大小写、副标题、重制版处理)
- TTS 重生成时如何确保跨曲目的引用文本一致(避免 Track 5 说"等会儿到 Chic Good Times",而 Track 9 那端用了不一样的曲名/标点)
