# EP1 复盘：主题、选歌、转写、融合、技术架构

记录日期：2026-05-16
对象：Miss You · 第 1 期 · bassline DNA 谱系

---

## 1. EP1 主题与选歌逻辑

**Slug：** `rolling-stones_some-girls_miss-you`
**Episode ID：** `rolling-stones_some-girls_miss-you__ep-01`
**主题（episode_focus）：** `bassline_dna` — 一条贝斯线索的五十年家谱
**标题：** Miss You · 第 1 期 · bassline DNA 谱系
**Curatorial thesis：** "贝斯不是陪衬，而是骨架——从 1967 年 James Brown 锁死鼓和贝斯的那一刻，到 2018 年 Khruangbin 把贝斯先录变成录音规矩，这条逻辑在不同场景里反复浮现、变形、传承。Miss You 是这条线上最坦诚的翻译节点。"

**锚点（anchor）：** The Rolling Stones — Miss You (Some Girls, 1978)
**Episode arc：** from `James Brown — Cold Sweat (1967)` → to `Khruangbin — María También (2018)` → coda `Mk.gee — You Dreamed of Me (2024)`，共 18 站 / 57 年（外加 opening / interlude / closing）。

**选歌逻辑（CLAUDE.md + spec v0.4 工作流）：**
1. `maps/<slug>.map.json`：以锚点为中心做 **upward / lateral / downward** 三轴扩展（深度上限 15/12/20），命中停止规则 §3.3。
2. 所有候选节点都过 `tools/node_registry.py` 的单例注册表（`data/nodes/<node_id>.json`），不会因不同 anchor 重复。
3. 命中 **用户美学机制 M1–M4**（translation_aesthetic、ancestor_visit_only、member_period_attention、frequency_hollowing）的节点优先入选。
4. 进一步用 `playlists/<slug>.connections.json` 里的 `intrinsic_score`（story_drive / concrete_carrier / evidential_strength / focus_relevance 四维加权）对边做排序，每首歌只挑一条 `strong_connection_id`，其余进 `archived_weak_connections`。
5. 选择标准：每条入选边都要能被 fact-tier 双源印证（spec §4 + `docs/superpowers/plans/sonic_cartography_sourcing_principles.md`）。

---

## 2. 主题生成的 transcript 在哪里

最终带配音文案的文件是 **`episodes/<slug>.episode.json`**（人审版 = `.episode.md`）。EP1 对应：

- `episodes/rolling-stones_some-girls_miss-you.episode.json` — 程序消费的 source of truth
- `episodes/rolling-stones_some-girls_miss-you.episode.md` — 人审稿
- 同目录还有 `v0.1` / `v0.3` 历史版本

里面每一站是一个 `exhibits[i]` 对象，关键字段：

- `position`、`kind`（`opening` / `track` / `interlude` / `closing`）
- `transcript_zh`（被 TTS 朗读的那段）
- pillar 站（Style B）会有 `transcript_zh_a` / `transcript_zh_b`
- muted 站使用 `bridge_narration_zh`
- 锚定播放位置：`anchor_timestamp_seconds`
- 与上下游关系：`strong_connection_id`、`archived_weak_connections`

---

## 3. "歌和歌之间的关联"字段在哪儿

关联**不写在 episode.json 里**，写在 **`playlists/<slug>.connections.json`** 的 `connection_pairs[]`：

```jsonc
{
  "id": "conn_001_to_004_personnel_bridge_bass",
  "from_position": 1, "to_position": 4,
  "kind": "personnel_bridge_bass",        // 关系类型
  "evidence_basis": "historical",
  "backed_by_edge_id": null,              // 可回链到 maps/<slug>.map.json 的 edges[]
  "system_sensory_note": "...",
  "narration_modes": {
    "foreshadow_anonymous_at_from": {...},
    "foreshadow_named_at_from": null,
    "callback_named_at_to": {...}
  },
  "intrinsic_score": { value, dimensions{...}, rationale }
}
```

关键关联字段：

- **`from_position` / `to_position`** — 在曲序里指向具体两首歌
- **`kind`** — EP1 的 `connection_kinds_in_scope` 是 `bassline_prototype`、`groove_dna`、`personnel_bridge_bass`、`gear_lineage_bass`
- **`backed_by_edge_id`** — 反向链到 `maps/<slug>.map.json` 的 `edges[]`（"图层"层级的关系）
- **`narration_modes`** — 转化为 transcript 时的 callback / foreshadow 文案模板
- 在每个 `exhibits[i]` 里以 **`strong_connection_id`** 选定主线，**`archived_weak_connections[]`** 标注其余被合并/抑制的关系

---

## 4. 歌和 transcript 的 fusion 怎么做

完整 runbook 在 `docs/episode_audio_pipeline.md`。EP1 是这条管线的校准用例。五步：

**Step 1 · 旁白合成** — `python3 -m tools.batch_synthesize_episode --episode ... --voice 'Chinese (Mandarin)_Gentleman'`
- 走 MiniMax `speech-02-hd`，从 `transcript_zh` 生成 `episodes/audio/narration/NN_<artist>_<track>.mp3`
- 同时请求 `subtitle_enable: true`，落地 `<stem>.subtitle.json`（毫秒级句级时间戳，**narration 时间轴**）

**Step 2 · 音频体检** — `ffprobe` 检查每首歌长度，<120s 的标记为待补。

**Step 3 · YouTube 补齐** — `tools/youtube_manifest.txt` + `python3 -m tools.fetch_audio_youtube`，替换太短的 NetEase preview。

**Step 4 · 风格分配 + 批量融合** — `python3 -m tools.batch_fusion`（核心是 `tools/batch_fusion.py` 里的 `STYLE_BY_POSITION`）。五种风格：

| Style | 用途 | 包络 |
|---|---|---|
| `A` | 短旁白 | 旁白 clean → 4s 内淡入 30% → 升至 100% → 100s 音乐 → 5.5s 淡出 |
| `C` | 长旁白 / anchor 曲 | 8s 前奏 → duck 到 10% → 旁白铺在 bed 上 → ramp 回 → 60s 后奏 |
| `C_ALIGNED` | 用 `anchor_timestamp_seconds` 反推 `atrim`，让 ramp-to-100% 落在 `anchor − 2s` |
| `B` | pillar（说—唱—说） | `transcript_zh_a` → 30s 干净 anchor 段 → `transcript_zh_b` → 尾巴 |
| `PASSTHROUGH` | opening / interlude / closing | 直接拷贝旁白 mp3 |

同步把 `<stem>.subtitle.json` 的毫秒级时间戳按 `NARRATION_OFFSET_BY_STYLE`（A=0, C=9, C_SHORT=4, B 分两段）整体平移到 **fusion 时间轴**，输出秒为单位的 `[{text, start, end}]` 旁注。

**Step 5 · 装入前端** — `cp -r episodes/audio/fusion → musicos-exhibition/public/audio_fusion/`，跑 `npx tsx scripts/build-exhibition-json.ts` 让 `fusion_audio_url` 自动填好。前端 `useFusionSubtitle.ts` 拿 `fusionUrl` 把 `.mp3` 换成 `.subtitle.json` 去 fetch，200 走句级高亮，404 退回字符比例估计。

---

## 5. 整体技术架构

**仓库分两半：内容/数据管线（Python + Markdown/JSON） + 展览前端（React + Vite）**

### 数据/内容层（Python，根目录）

- `Foundations/sonic_cartography_spec_v0.4.md` — 系统规范
- `data/nodes/<node_id>.json` — 全局歌曲节点单例注册表（`tools/node_registry.py` 是其 CRUD）
- `data/user_tracks.json` — 1690 条网易云红心导出
- `maps/<slug>.map.json` — 谱系图（节点引用 + 边）
- `playlists/<slug>.{tracklist,connections}.json` + `.playlist.md` — 选歌 + 关系评分 + 阅读稿
- `episodes/<slug>.episode.{json,md}` — 配音剧本
- `episodes/audio/{narration,fusion,spike}/` — 音频中间产物
- `anchors/backlog/*.idea.md` — 未启动的锚点候选
- `tools/*.py` — `batch_synthesize_episode`（MiniMax TTS）、`batch_fusion` + `stitch_track`（ffmpeg）、`fetch_audio_youtube`（yt-dlp）、`tts_minimax`、`coverage`、`compress_cover.sh` 等

### 展览前端 `musicos-exhibition/`

- **栈：** React 19 + TypeScript + Vite 8；状态 zustand（`src/store/exhibition.ts`、`tuning.ts`）；路由 wouter；动效 framer-motion；样式 **plain CSS + BEM**（无 Tailwind、无 CSS-in-JS、无图标库）
- **本地 import 强制带 `.js` 后缀**（ESM 约定），`@/` 别名 → `src/`
- **组件分区：** `src/components/focal/`（焦点圆盘场景）、`src/components/timeline/`（剧集时间轴）、`src/routes/`、共享壳（`Sidebar.tsx`、`GlobalPlayer.tsx`、`NowPlayingBar.tsx`）
- **数据接入：** `data/exhibition*.json` 由 `scripts/build-exhibition-json.ts` 从根目录的 `episodes/` + `playlists/` 编译而成，`npm run sync-data` 拷到 `public/data/`
- **音频/字幕装配：** `public/audio_fusion/ep<N>/NN_*.mp3` + `.subtitle.json` sidecar，由 `useFusionSubtitle.ts` runtime fetch；`asset-url.ts` 处理可切 CDN 的音频路径
- **测试/构建：** vitest + `vite build`

### 外部服务

MiniMax TTS（`speech-02-hd`，锁声音 `Chinese (Mandarin)_Gentleman`）、yt-dlp / ffmpeg、网易云开放接口、Figma MCP（设计→代码桥）。

---

## 一句话总结

根目录是离线"研究 + 生产"管线（图谱、文稿、配音、混音），`musicos-exhibition/` 是消费这些产物的展览前端；两者通过 `public/data/exhibition*.json` 和 `public/audio_fusion/` 的文件契约联通。
