# MusicOS · 小红书发布脚本

> 五一假期音乐播客项目 · 第一篇 XHS 发文的完整剧本与剪辑指南
>
> 生成时间：2026-05-06

---

## Part 1 — 项目可吹的"硬料"清单

写讲稿时随时回到这一节挑素材。这些是项目里真正的产品力，不能省。

### 1. 数据规模

- `data/user_tracks.json` — 1690 首红心歌曲做底
- 一期节目 18 首歌，跨度 50+ 年
  - **Miss You 期**：1967 James Brown → 2024 Mk.gee 卧室节拍机（57 年）
  - **Estranged 期**：1970 Deep Purple → 2006 Muse（36 年）

### 2. "音乐谱系"——一种全新的听法（最大卖点）

- 不是相似推荐，是**血缘考古**：从 Estranged 倒推到 19 世纪意大利歌剧 Bellini《Norma》的 aria-cabaletta 双段式咏叹调
- 每首歌讲清楚：录音日期、录音棚、用的什么吉他/贝斯、谁做的什么决定
  - Stairway 那段：Page 砍掉吉他 outro 让 Plant 清唱收尾
  - Bohemian Rhapsody：Brian May 用六便士硬币当 pick 弹九小节 solo
  - Get Lucky：Nile Rodgers 带着当年录 Good Times 的同一把白色 Stratocaster 回到棚里
- 这种"我现在听的这首歌，它的爷爷是谁"的视角，普通推荐算法做不到

### 3. 工程层面的反算法叙事

- **节点是永久单例**：一首歌是一个历史节点，不属于任何一次推荐
- **双源核验**（sourcing principles）：fact-tier 主张要 ≥2 个独立来源，至少 1 个是 Tier 1–2 的权威源
- 与 Spotify/网易"算你可能喜欢"的逻辑根本相反——做的是音乐学，不是消费

### 4. 自做的展览站

- `musicos-exhibition/`：Timeline 弧形布局、NowPlayingBar、TTS 旁白 + 音乐 stems 融合（`audio_fusion/`）
- 一期节目 = 一个可视化展览，不是一段音频

### 5. AI DJ 真的"懂"你

- 系统看到最近常听 Estranged → 推荐"人声 vs 吉他双主线"母题
- 看到 Miss You + 想听 disco → 给 bassline DNA 谱系
- 不是关键词匹配，是**风格基因识别**

---

## Part 2 — Hook 与文案策略

### Hook 候选（三选一）

**A. 身份反差（最稳）**
> 我不会乐理，但我让 AI 给我做了一档音乐播客——
> 它带我从 Estranged 一路倒推到 19 世纪的意大利歌剧。

**B. 数字硬钩**
> 五一假期我做了一件事：让 AI 把我 1690 首红心歌曲，
> 拆成了一条 57 年的谱系链。

**C. 画面反差（最有 XHS 味）**
> 当我知道 Estranged 里 Slash 的 solo 和 Axl 的人声，
> 是 1830 年贝里尼《诺尔玛》同一种结构的时候，我整个人坐直了。
> 然后我决定做一档自己的播客。

### 文案核心原则

- **把"门外汉"身份放最前面**——XHS 的 identity hook 数据上最稳
- "我不会 X 但我做出了 Y" 是经典爆款套路
- 一个不会乐理的人靠 AI 做出有学术严谨度的音乐谱系系统，这个反差必须榨干

### 推荐图文卡片结构

| 卡片 | 内容 |
|---|---|
| 封面 | "AI 给我做了一档音乐播客 / 1690 首红心 → 57 年谱系" + Timeline 弧形布局截图 |
| P1 痛点 | "听歌软件总推我'相似的'，但我想知道这首歌的**爷爷是谁**" |
| P2 反常识案例 | Estranged → Bellini 那条线，让用户"哦原来还能这么听" |
| P3 系统怎么工作 | 你给锚点（Miss You + bassline DNA）→ 18 站；或 AI 主动推母题 |
| P4 工程细节 | 节点永久化 + 双源核验——区别于算法推荐的"音乐学"立场 |
| P5 展览站 | NowPlayingBar + Timeline 截图，"每一期不是音频，是个展览" |
| P6 钩子 | "下一期想做 XX，评论区点歌" or "想看完整剧集文稿评论 1" |

### 必备素材

1. Timeline 弧形布局的截图——视觉锚点
2. 18 站歌单的纵向时间轴图（1967 → 2024）
3. 一段 30s 旁白 + 音乐融合的视频（`audio_fusion/` 里有）——reels 形式比图文涨粉快
4. 节点 JSON 截图（带 `production_facts`、`sources` 字段）——证明"不是 AI 瞎编的"

---

## Part 3 — 视频剪辑脚本（约 140 秒）

### 整体结构

In medias res（先抛悬念再补叙）：
- **0** Estranged 短开场抛悬念
- **1–5** 顺时间线建立线索
- **6** Estranged 完整 payoff 解谜
- **7** Champagne Supernova 收束血脉
- **8** Timeline UI 收尾导回项目

### 段落总览

| # | 片段 | 时长 | 作用 |
|---|---|---|---|
| 0 | Estranged 短开场（只 7:30 + 一句） | ~10s | 抛悬念，不解释 |
| 1 | Bohemian Rhapsody 2:37 | ~15s | 建立"吉他可以唱词"概念 |
| 2 | Miss You 贝斯 intro | ~15s | 第一期主线进入 |
| 3 | Good Times 贝斯 riff | ~15s | 留 Strat 扣子 |
| 4 | Get Lucky 同把 Strat | ~15s | 回声砸下来 |
| 5 | María También | ~20s | AI DJ 叙事点 |
| 6 | Estranged 完整 payoff | ~25s | 中心节点解谜 |
| 7 | Champagne Supernova 5:00 outro | ~15s | Estranged 下游收束 |
| 8 | Timeline UI 收尾 | ~10s | 导回项目 |

---

### 段落详细脚本

#### Seg 0 — Estranged 短开场（hook）

- **时长：** ~10s
- **音频入点：** Estranged 7:30，Slash 推音量旋钮的瞬间
- **画面：** 黑屏 → 7:30 时码浮现
- **旁白：**
  > 「7:30 那一下——两个声部第一次真正叠在一起，谁也没融化进谁。」
  > （**停顿，黑屏一秒**）
  > 「这是我五一假期做的一档音乐播客。第二期的中心节点。」
- **剪辑要点：** 只放 3 秒音频 + 一句旁白就切走，第 6 段再回来播完整段。这个"未完成的悬念"是结构 hook。

---

#### Seg 1 — Bohemian Rhapsody（1975）

- **时长：** ~15s
- **音频入点：** 2:37 Brian May solo 进入
- **画面：** Brian May Red Special 特写或 1975 年录音棚旧照
- **旁白：**
  > 「2:37 那段——Brian May 的 Red Special 进来，九小节 solo，用六便士硬币当 pick。
  > 在他之前，吉他独奏是间奏；在他之后，吉他独奏是另一个声部的咏叹。」
- **字幕硬料：** `Wessex Studios · 1975 · 六便士硬币当 pick`

---

#### Seg 2 — Miss You（1978）

- **时长：** ~15s
- **音频入点：** 0:00 Bill Wyman 贝斯 intro
- **画面：** Some Girls 专辑封面 → Bill Wyman 弹 Fender 贝斯的旧照
- **旁白：**
  > 「贝斯先开口。
  > 1978 年，Bill Wyman 的贝斯线在你听见 Mick Jagger 之前就已经走完了一个完整的乐句——四四拍迪斯科的骨架，蓝调摇滚的呼吸。两层都听得见，谁也没融化进谁。」
- **字幕硬料：** `1978 · Some Girls · 迪斯科骨架 + 蓝调呼吸`

---

#### Seg 3 — Good Times（1979）

- **时长：** ~15s
- **音频入点：** Bernard Edwards 那条招牌 bass riff
- **画面：** Risque 封面 → Bernard Edwards + Nile Rodgers 录音棚合影（拿白色 Stratocaster）
- **旁白：**
  > 「1979 年，Bernard Edwards 把贝斯从底部拎到歌的最前面，和 Nile Rodgers 的吉他形成几何咬合。
  > Edwards 弹的那条 Stratocaster——是一把白色的。**记住这把琴。**」
- **字幕硬料：** `1979 · Risque · 白色 Stratocaster`
- **剪辑要点：** "记住这把琴"是为下一段加的扣子（原文里没有），必须加上。

---

#### Seg 4 — Get Lucky（2013）

- **时长：** ~15s
- **音频入点：** Nile Rodgers 那条 funk 节奏吉他进场
- **画面：** **Nile Rodgers 拿白色 Strat 的真实照片/MV 截图（必须兑现）**
- **旁白：**
  > 「2013 年——三十四年后。
  > Nile Rodgers 走进录音棚，带着的是当年录 Good Times 用的同一把白色 Stratocaster——同一把琴、同一双手、同一种几何对位。
  > 这条贝斯线，被亲手确认了。」
- **字幕硬料：** `2013 · Random Access Memories · 同一把 1959 White Strat`
- **剪辑要点：** Good Times → Get Lucky 之间用白色 Stratocaster 的特写做转场，强化"同一把琴"的视觉钩子。

---

#### Seg 5 — María También（2018）⭐ AI DJ 叙事落点

- **时长：** ~20s
- **音频入点：** Laura Lee 那条慵懒贝斯线
- **画面：** Khruangbin 三人组 Texas 谷仓棚的照片 → 切到你 `music companion` 推荐界面截图（系统给你这首歌的那一刻）
- **旁白：**
  > 「这首歌不是我以前听过的。
  > 是我的 music companion 看了我 1690 首红心歌单之后，主动推给我的。
  > ——Khruangbin 的 María También，2018 年。Texas 一座谷仓改的录音棚，Laura Lee 的贝斯先于一切录下：鼓定脉冲，贝斯定骨架，吉他最后才加进去。
  > 短句、留白、不打满——这是 James Brown 那条贝斯先于一切的逻辑，五十一年后还在结果。」
- **字幕硬料：** `2018 · Texas 谷仓棚 · 贝斯先录的颠倒逻辑`
- **剪辑要点：** 旁白和音乐必须**同时存在**——不要先讲完再放歌。让 Khruangbin 的贝斯铺底，旁白叠在上面。"被 AI 推荐的歌"这件事必须**让观众的耳朵此刻正在被它说服**。这是整条视频产品叙事最强的一锤。

---

#### Seg 6 — Estranged 完整 payoff（1991）

- **时长：** ~25s
- **音频入点：** 重新回到 7:30，让它播完整两分钟里最关键的 30 秒（到 Slash lead 在右声道、Axl 在左声道并行那段）
- **画面：** 左右声道波形可视化（Slash 右、Axl 左）
- **旁白：**
  > 「现在回到开头那一下——
  > 7:30。Slash 的 Les Paul Gold Top，rhythm pickup，tone 旋钮拧到底，音色是温的、被吃掉锋芒的。
  > Axl 的最后那段哀告进来，没有让位给吉他。
  > 1991 年洛杉矶 A&M Studios。这条线从 1970 年 Deep Purple 开始问的那个问题——人声和吉他能不能同时占据前景——到这里第一次有了"同时"这个答案。
  > 九分钟二十三秒里，吉他没有取代人声，人声也没有压住吉他。」
- **字幕硬料：** `1991 · A&M Studios · Les Paul Gold Top tone roll-off`
- **剪辑要点：** 左右声道分轨视觉化是这段旁白的 visual 兑现，必须做。

---

#### Seg 7 — Champagne Supernova（1995）

- **时长：** ~15s
- **音频入点：** 5:00 之后 Noel + Paul Weller 双吉他 outro
- **画面：** Oasis 兄弟合影 → 切到 Use Your Illusion II 封面 → 再切回 Oasis（暗示血脉转移）
- **旁白：**
  > 「5:00 之后——Noel 和 Paul Weller 同时弹的那段 outro，专辑版拉了两分多钟。
  > Noel Gallagher 公开承认，Use Your Illusion 是他写 Morning Glory 时的对照物。Liam 和 Noel 之间的兄弟张力，正好对应 Axl 和 Slash 那种作曲者—吉他手的张力——同样的结构需要同样的内部冲突来驱动。
  > 同一种形式，换了北英格兰口音。」
- **字幕硬料：** `1995 · Rockfield Studios · 兄弟张力 = Axl/Slash 张力`
- **剪辑要点：** Estranged → Champagne Supernova 过渡加一行字幕：`1991 洛杉矶 → 1995 威尔士 Rockfield`——血脉转移，地理也转移了。

---

#### Seg 8 — 收尾（Timeline UI）

- **时长：** ~10s
- **画面：** `musicos-exhibition` Timeline 弧形布局滑动 + NowPlayingBar
- **旁白：**
  > 「这就是这条线——从 1967 年的 King Studio，到 2024 年一个人卧室里的节拍机，五十七年。
  > 我做了十八站，每一首都有自己的录音棚、自己的设备、自己的决定。
  > 我不会乐理，但我让 AI 帮我把它们连成了一张地图。」
- **结尾字幕：** `MusicOS · 18 站 · 57 年 · 1690 首红心起点`

---

## Part 4 — 剪辑技术 SOP

### 音量曲线（每段通用）

1. 段开头**先静音 0.5s** 让旁白进
2. 然后让原曲低音量铺底（**-12dB 左右**）
3. 旁白结束最后那句再让原曲爆出来到 **0dB 持续 2-3s**
4. 然后再切下一段

这是音乐播客视频最稳的节奏。

### 字幕规则

每段必上的关键词字幕（小红书用户喜欢截图保存"硬料"）：
- 录音棚名（King Studio、A&M、Rockfield）
- 年份
- 设备名（Les Paul Gold Top、Red Special、白色 Stratocaster）

### 关键视觉兑现清单

| 段 | 必须出现的画面 | 没有就废的钩子 |
|---|---|---|
| Seg 4 | Nile Rodgers 拿白色 Strat 的真实图 | "同一把琴" |
| Seg 5 | 你 music companion 的推荐界面截图 | "AI 给我推的" |
| Seg 6 | 左右声道波形分轨可视化 | "两个主角同时在场" |
| Seg 8 | Timeline 弧形布局动态 + NowPlayingBar | "连成一张地图" |

### 转场建议

- Seg 3 → 4：**白色 Stratocaster 特写** zoom in/out
- Seg 5 → 6：从 Khruangbin 的贝斯淡出 → 切到 Estranged 7:30 时码硬切
- Seg 6 → 7：字幕过渡 `1991 洛杉矶 → 1995 威尔士 Rockfield`
- Seg 7 → 8：Oasis 实拍 → 你的 Timeline UI 全屏过渡

---

## Part 5 — 发布前自检清单

- [ ] 封面有数字（1690 / 57 年 / 18 站 任选）
- [ ] 标题含"门外汉"或"我不会乐理"身份反差词
- [ ] 视频前 3 秒有具体声音锚点（7:30 那一下）
- [ ] AI DJ 叙事在视频里被音乐**当下兑现**（Seg 5）
- [ ] Timeline UI 截图至少出现两次（封面 + 结尾）
- [ ] 评论区钩子准备好（"想看完整剧集文稿评论 1" / "下一期点歌"）
- [ ] hashtag：#音乐播客 #音乐谱系 #AI工具 #摇滚乐 #音乐制作 #DIY项目

---

**素材源文件参考：**
- 旁白原文：`episodes/rolling-stones_some-girls_miss-you.episode.md`、`episodes/guns-n-roses_use-your-illusion-ii_estranged.episode.md`
- 融合音频：`musicos-exhibition/public/audio_fusion/`
- 展览站截图：本地 `npm run dev` 启 `musicos-exhibition/`
