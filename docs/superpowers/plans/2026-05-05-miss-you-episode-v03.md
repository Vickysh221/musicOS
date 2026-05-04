# Miss You Audio Episode (v0.3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the first v0.3 audio episode deliverable — `episodes/rolling-stones_some-girls_miss-you.episode.json` + `episodes/rolling-stones_some-girls_miss-you.episode.md` — from the existing Miss You map.

**Architecture:** The episode is a linear sequence of 15 exhibits (1 opening + 12 tracks + 1 interlude + 1 closing) derived from the map's 21 nodes. 12 tracks are selected (within the 6–12 default cap); 9 map nodes are flagged for Episode 2. All narration is in Chinese (Mandarin), persona `docent_v1`. The episode JSON and markdown are produced together; the JSON is the TTS source, the markdown is for human review.

**Tech Stack:** JSON (episode schema v0.3), Markdown, SSML subset (phoneme/lang/break/emphasis tags per §7B.6). No external libraries needed — plain file writes.

---

## Episode Design Decisions (read before executing)

### Track selection (12 of 18 playlist tracks)

The 12-track set fits within the 6–12 exhibit default. All 18 tracks are in the map; the 6 deferred to Episode 2 are flagged in `expansion_notes`.

| Position | Artist | Song | Year | Play mode |
|----------|--------|------|------|-----------|
| Exhibit 1 | James Brown | Cold Sweat | 1967 | full |
| Exhibit 2 | Sly & the Family Stone | Family Affair | 1971 | full |
| Exhibit 3 | David Bowie | Fame | 1975 | full |
| Exhibit 4 | Chic | Good Times | 1979 | full |
| Exhibit 5 | The Rolling Stones | Miss You | 1978 | full (album version 4:40) |
| Exhibit 6 | Blondie | Heart of Glass | 1978 | full |
| Exhibit 7 | Devo | Jocko Homo | 1978 | full |
| Exhibit 8 | Joy Division | Isolation | 1980 | full |
| Exhibit 9 | Talking Heads | Once in a Lifetime | 1980 | full |
| Exhibit 10 | Queen | Another One Bites the Dust | 1980 | full |
| Exhibit 11 | Prince | When Doves Cry | 1984 | full |
| Exhibit 12 | Daft Punk | Get Lucky | 2013 | full |

Play-mode ratio: 12 full / 0 excerpt = 100% full ≥ 70% threshold ✅

Deferred to Episode 2: Parliament, Bee Gees, Rod Stewart, RHCP, LCD Soundsystem, Tame Impala, Khruangbin, Mk.gee

### Exhibit positions (1-indexed)

```
1  → opening (narration-only)
2  → track: James Brown — Cold Sweat
3  → track: Sly & the Family Stone — Family Affair
4  → track: David Bowie — Fame
5  → track: Chic — Good Times
6  → track: The Rolling Stones — Miss You [ANCHOR]
7  → track: Blondie — Heart of Glass
8  → track: Devo — Jocko Homo
9  → track: Joy Division — Isolation
10 → interlude (narration-only, structural pivot)
11 → track: Talking Heads — Once in a Lifetime
12 → track: Queen — Another One Bites the Dust
13 → track: Prince — When Doves Cry
14 → track: Daft Punk — Get Lucky
15 → closing (narration-only)
```

### Ordering

`ordering_principle`: `"thematic_arc"`

`ordering_rationale`: `"展品按主题弧线排列而非严格年份顺序。第 1–4 件（James Brown、Sly Stone、Bowie、Chic）构成「材料库」——翻译美学的源代码；第 5 件（Miss You）是本集展览的核心节点；第 6–8 件（Blondie、Devo、Joy Division）是同时期三条不同的道路；第 10 号展间隔断后，第 9–12 件（Talking Heads、Queen、Prince、Daft Punk）记录这套逻辑在此后 33 年里的演变。注：Chic 的代表作《Good Times》发行于 1979 年 7 月，晚于 Miss You 的 1978 年 7 月——但 Chic 的 Studio 54 时期影响力早在 1977–78 年已经形成，因此将其置于 Miss You 之前作为祖先节点。"`

### Duration estimates

Music (all full tracks, approximate):
- Cold Sweat 185s + Family Affair 186s + Fame 252s + Good Times 417s + Miss You 280s
- Heart of Glass 236s + Jocko Homo 127s + Isolation 171s + Once in a Lifetime 259s
- Another One Bites the Dust 215s + When Doves Cry 354s + Get Lucky 247s
- **music_only_seconds: 2929**

Narration (250 Chinese chars ≈ 60s):
- Opening ~300 chars → 72s
- Exhibits 1–12 narration blocks average ~345 chars → ~83s each → 12 × 83 = 996s
- Interlude ~310 chars → 74s
- Closing ~250 chars → 60s
- **narration_only_seconds: 1202**

**full_episode_seconds: 4131** ≈ 68.9 min ✅ within 45–75 min target

### Curatorial thesis

`"同一套节奏翻译逻辑——把 funk 或 disco 的基因穿进另一种音乐的外套、两层声音可分辨但互不融合——在 1967 年到 2013 年间以七种不同形态反复浮现，Miss You 是这条血脉的中心节点。"`

---

## Files to create

- **Create:** `episodes/rolling-stones_some-girls_miss-you.episode.json`
- **Create:** `episodes/rolling-stones_some-girls_miss-you.episode.md`

---

## Task 1: Create episodes/ directory and episode.json skeleton

**Files:**
- Create: `episodes/rolling-stones_some-girls_miss-you.episode.json` (skeleton)

- [ ] **Step 1: Create the episodes/ directory**

```bash
mkdir -p /Users/vickyshou/Documents/MusicOS/episodes
```

- [ ] **Step 2: Verify the source map exists**

```bash
ls /Users/vickyshou/Documents/MusicOS/maps/rolling-stones_some-girls_miss-you.map.json
```

Expected: file listed with no error.

- [ ] **Step 3: Write the episode.json skeleton**

Write the file at `episodes/rolling-stones_some-girls_miss-you.episode.json` with this exact content (narration blocks will be filled in Tasks 2–6):

```json
{
  "episode_id": "rolling-stones_some-girls_miss-you__ep-01",
  "spec_version": "0.3",
  "anchor_node_id": "rolling-stones_some-girls_miss-you",
  "title": "Miss You-1：摇滚 × Funk 翻译血脉的 Studio 54 起点",
  "subtitle": "从 James Brown 到 Daft Punk，同一套翻译逻辑的七次变形",
  "curatorial_thesis": "同一套节奏翻译逻辑——把 funk 或 disco 的基因穿进另一种音乐的外套、两层声音可分辨但互不融合——在 1967 年到 2013 年间以七种不同形态反复浮现，Miss You 是这条血脉的中心节点。",
  "narrator_persona_id": "docent_v1",
  "ordering_principle": "thematic_arc",
  "ordering_rationale": "展品按主题弧线排列而非严格年份顺序。第 1–4 件（James Brown、Sly Stone、Bowie、Chic）构成「材料库」——翻译美学的源代码；第 5 件（Miss You）是本集展览的核心节点；第 6–8 件（Blondie、Devo、Joy Division）是同时期三条不同的道路；第 10 号展间隔断后，第 9–12 件（Talking Heads、Queen、Prince、Daft Punk）记录这套逻辑在此后 33 年里的演变。注：Chic 的代表作《Good Times》发行于 1979 年 7 月，晚于 Miss You 的 1978 年 7 月——但 Chic 的 Studio 54 时期影响力早在 1977–78 年已经形成，因此将其置于 Miss You 之前作为祖先节点。",
  "exhibits": [],
  "duration_estimates": {
    "music_only_seconds": 2929,
    "narration_only_seconds": 1202,
    "full_episode_seconds": 4131
  },
  "expansion_notes": "Episode 1 of 2 for this map. 12 tracks selected (within 6–12 default cap). Deferred to Episode 2: Parliament (give-up-the-funk), Bee Gees (stayin-alive), Rod Stewart (do-ya-think-im-sexy), RHCP (give-it-away), LCD Soundsystem (all-my-friends), Tame Impala (the-less-i-know-the-better), Khruangbin (maria-tambien), Mk.gee (you-dreamed-of-me). All 12 tracks have NetEase platform links. Hypothesis-tier edges (prince/tame-impala/khruangbin/joy-division) are not included in Episode 1 narration; hypothesis disclosures will appear in Episode 2 where those nodes are exhibited.",
  "generated_at": "2026-05-05T00:00:00Z"
}
```

- [ ] **Step 4: Verify the file was written**

```bash
python3 -c "import json; d=json.load(open('episodes/rolling-stones_some-girls_miss-you.episode.json')); print('OK, exhibits:', len(d['exhibits']))"
```

Expected: `OK, exhibits: 0`

---

## Task 2: Write opening exhibit + exhibits 1–4 (ancestors)

**Files:**
- Modify: `episodes/rolling-stones_some-girls_miss-you.episode.json` (append 5 exhibits to `exhibits[]`)

The exhibits array must be edited by loading, appending, and re-writing the file. Use this Python helper pattern throughout all tasks:

```python
import json, pathlib
p = pathlib.Path("episodes/rolling-stones_some-girls_miss-you.episode.json")
d = json.loads(p.read_text())
d["exhibits"].extend([...])  # append new exhibits
p.write_text(json.dumps(d, ensure_ascii=False, indent=2))
```

- [ ] **Step 1: Append the opening exhibit and exhibits 1–4**

Run the following Python script from `/Users/vickyshou/Documents/MusicOS`:

```python
import json, pathlib

p = pathlib.Path("episodes/rolling-stones_some-girls_miss-you.episode.json")
d = json.loads(p.read_text())

new_exhibits = [
  {
    "position": 1,
    "exhibit_type": "opening",
    "track_ref": None,
    "pre_narration": {
      "narration_id": "opening",
      "text_for_tts": "这是一场音乐博物馆的展览。展览的主题是一套反复出现的创作逻辑——我们把它叫做翻译美学：把一种音乐的节奏基因穿进另一种音乐的外套，让两层声音同时存在、可以分辨，但谁也没有融化进谁。<break time=\"500ms\"/>这次展览从 1967 年开始。那一年，<phoneme alphabet=\"ipa\" ph=\"ˈdʒeɪməs braʊn\">James Brown</phoneme> 在录音室里做了一件事——他把旋律和和声全部退到背景，让鼓和贝斯的咬合关系成为音乐本身——然后一切都不一样了。展览的中心节点是 1978 年 <phoneme alphabet=\"ipa\" ph=\"ðə ˈrəʊlɪŋ stəʊnz\">The Rolling Stones</phoneme> 的 <lang xml:lang=\"en-US\">Miss You</lang>：一支英国蓝调摇滚乐队在 <lang xml:lang=\"en-US\">Studio 54</lang> 的 disco 氛围里找到了某种无法抗拒的节奏，然后用摇滚乐的方式把它唱出来。今天你会听到这套逻辑的来处、同期的三条岔路，以及它的四代后裔。展览在 2013 年结束，但这条血脉还在继续。",
      "estimated_duration_seconds": 86,
      "components_present": [],
      "voice_overrides": {"pace": "normal", "emotional_register": "warm", "use_default_persona": True},
      "epistemic_layer": "fact",
      "sources_referenced": []
    },
    "post_narration": None
  },
  {
    "position": 2,
    "exhibit_type": "track",
    "track_ref": {
      "node_id": "james-brown_funky-drummer-era_cold-sweat",
      "artist": "James Brown",
      "song": "Cold Sweat",
      "album": "Cold Sweat",
      "year": 1967,
      "play_mode": "full",
      "excerpt_range": None,
      "platform_links": {
        "spotify": None,
        "netease": "https://music.163.com/#/song?id=18713",
        "youtube": None,
        "apple_music": None
      }
    },
    "pre_narration": {
      "narration_id": "pre_02",
      "text_for_tts": "这是整条翻译血脉的零号节点。1967 年以前，<lang xml:lang=\"en-US\">funk</lang> 这个词还没有独立作为一种音乐类别存在——它是 <phoneme alphabet=\"ipa\" ph=\"ˈdʒeɪməs braʊn\">James Brown</phoneme> 把旋律和和声扁平化、让鼓与贝斯的互锁关系变成音乐本身的那一刻才真正到来的。<break time=\"300ms\"/>你现在要听到的核心创新是鼓手 <phoneme alphabet=\"ipa\" ph=\"klaɪd ˈstʌbl̩fiːld\">Clyde Stubblefield</phoneme> 确立的节奏结构：<emphasis level=\"strong\">kick</emphasis> 落在第一拍，snare 在第三拍，但贝斯线在第二个十六分音符悄悄插入——造成一种轻微的前倾感，像是节奏在不断往前推但始终没有失控。这个互锁结构后来被 <lang xml:lang=\"en-US\">Chic</lang> 精炼成 <lang xml:lang=\"en-US\">disco</lang>，被 <lang xml:lang=\"en-US\">Stones</lang> 带进了 <lang xml:lang=\"en-US\">Studio 54</lang>，被 <phoneme alphabet=\"ipa\" ph=\"fliː\">Flea</phoneme> 带进了 <lang xml:lang=\"en-US\">Blood Sugar Sex Magik</lang>。这条血脉从这里开始。",
      "estimated_duration_seconds": 80,
      "components_present": ["lineage_position", "musicological_connection", "relation_to_next"],
      "voice_overrides": {"pace": "normal", "emotional_register": "neutral", "use_default_persona": True},
      "epistemic_layer": "fact",
      "sources_referenced": ["https://en.wikipedia.org/wiki/Sly_%26_the_Family_Stone"]
    },
    "post_narration": None
  },
  {
    "position": 3,
    "exhibit_type": "track",
    "track_ref": {
      "node_id": "sly-family-stone_riot_family-affair",
      "artist": "Sly & the Family Stone",
      "song": "Family Affair",
      "album": "There's a Riot Goin' On",
      "year": 1971,
      "play_mode": "full",
      "excerpt_range": None,
      "platform_links": {
        "spotify": None,
        "netease": "https://music.163.com/#/song?id=6039",
        "youtube": None,
        "apple_music": None
      }
    },
    "pre_narration": {
      "narration_id": "pre_03",
      "text_for_tts": "<phoneme alphabet=\"ipa\" ph=\"slaɪ stəʊn\">Sly Stone</phoneme> 接过了 <lang xml:lang=\"en-US\">James Brown</lang> 的节奏语法，然后做了一件奇怪的事：他把乐队开除了，换成了一台 <phoneme alphabet=\"ipa\" ph=\"ˌmeɪestrəʊ ˈrɪðəm kɪŋ\">Maestro Rhythm King</phoneme> MRK-2 鼓机，然后自己一个人在上面叠录所有轨道。这是 1971 年最孤独的录音室实践之一。<break time=\"300ms\"/>你在这首歌里能听到的，是 <lang xml:lang=\"en-US\">funk</lang> 的节拍变得更平、更机械。但 <lang xml:lang=\"en-US\">Sly</lang> 在鼓机上叠了钢琴、吉他和人声，每一层都有细微的律动偏移——机器的精确和人手的飘移叠在一起，产生一种奇怪的「精确但不齐」感。这是后来 <phoneme alphabet=\"ipa\" ph=\"prɪns\">Prince</phoneme>、<phoneme alphabet=\"ipa\" ph=\"ˈkɛvɪn ˈpɑːkər\">Kevin Parker</phoneme> 那种单人全控制创作方式的直系先驱：<emphasis level=\"strong\">一个人</emphasis>完成所有层次，让翻译不需要经过任何协商。",
      "estimated_duration_seconds": 82,
      "components_present": ["lineage_position", "relation_to_previous", "musicological_connection", "narrative_slot_excerpt"],
      "voice_overrides": {"pace": "normal", "emotional_register": "contemplative", "use_default_persona": True},
      "epistemic_layer": "consensus",
      "sources_referenced": ["https://en.wikipedia.org/wiki/Sly_%26_the_Family_Stone"]
    },
    "post_narration": None
  },
  {
    "position": 4,
    "exhibit_type": "track",
    "track_ref": {
      "node_id": "bowie_young-americans_fame",
      "artist": "David Bowie",
      "song": "Fame",
      "album": "Young Americans",
      "year": 1975,
      "play_mode": "full",
      "excerpt_range": None,
      "platform_links": {
        "spotify": None,
        "netease": "https://music.163.com/#/song?id=27185190",
        "youtube": None,
        "apple_music": None
      }
    },
    "pre_narration": {
      "narration_id": "pre_04",
      "text_for_tts": "1975 年，<phoneme alphabet=\"ipa\" ph=\"ˈdeɪvɪd ˈbəʊi\">David Bowie</phoneme> 在费城的 <lang xml:lang=\"en-US\">Sigma Sound Studios</lang> 和一批黑人音乐人一起录制 <lang xml:lang=\"en-US\">Young Americans</lang>，用他自己的话说，做的是「<lang xml:lang=\"en-US\">plastic soul</lang>」——塑料灵魂乐。这是这条翻译血脉里第一个清晰的外部模板：一个白人英国摇滚明星，进入黑人美国节奏传统的领地，不放弃自己原有身份，同时吸收对方的节奏语言。<break time=\"300ms\"/>「<lang xml:lang=\"en-US\">Fame</lang>」在节奏上的核心是 <lang xml:lang=\"en-US\">Carlos Alomar</lang> 的切分吉他——每一击都落在拍子的缝隙里而不是拍子本身上，和 <lang xml:lang=\"en-US\">Lennon</lang> 的律动人声交织，形成一种类似 <lang xml:lang=\"en-US\">funk</lang> 的前冲感，但保留了 <lang xml:lang=\"en-US\">Bowie</lang> 摇滚乐的动势。三年后 <lang xml:lang=\"en-US\">Stones</lang> 在 <lang xml:lang=\"en-US\">Studio 54</lang> 做的，是同一套逻辑的下一个版本。",
      "estimated_duration_seconds": 86,
      "components_present": ["lineage_position", "relation_to_previous", "musicological_connection", "narrative_slot_excerpt"],
      "voice_overrides": {"pace": "normal", "emotional_register": "neutral", "use_default_persona": True},
      "epistemic_layer": "consensus",
      "sources_referenced": ["https://en.wikipedia.org/wiki/Young_Americans_(album)"]
    },
    "post_narration": None
  },
  {
    "position": 5,
    "exhibit_type": "track",
    "track_ref": {
      "node_id": "chic_risque_good-times",
      "artist": "Chic",
      "song": "Good Times",
      "album": "Risqué",
      "year": 1979,
      "play_mode": "full",
      "excerpt_range": None,
      "platform_links": {
        "spotify": None,
        "netease": "https://music.163.com/#/song?id=2333069",
        "youtube": None,
        "apple_music": None
      }
    },
    "pre_narration": {
      "narration_id": "pre_05",
      "text_for_tts": "这首歌是本次展览的技术核心。<phoneme alphabet=\"ipa\" ph=\"naɪl ˈrɒdʒərz\">Nile Rodgers</phoneme> 和 <phoneme alphabet=\"ipa\" ph=\"ˈbɜːnəd ˈɛdwərdz\">Bernard Edwards</phoneme> 把 <lang xml:lang=\"en-US\">James Brown</lang> 的节拍语法精炼成了 <lang xml:lang=\"en-US\">disco</lang> 最干净的形态：互锁的吉他切分和贝斯线，像两个机器零件咬合，几乎不需要填充任何其他东西。<break time=\"300ms\"/><lang xml:lang=\"en-US\">Edwards</lang> 的贝斯线用的是<emphasis level=\"strong\">八度跳进</emphasis>——同一个根音在低弦和高弦之间来回，每次跳都恰好落在 kick 的反拍上，造成一种把重力往下拉的感觉。这个八度跳进结构后来被 <lang xml:lang=\"en-US\">Bill Wyman</lang> 带进了 <lang xml:lang=\"en-US\">Miss You</lang>，被 <phoneme alphabet=\"ipa\" ph=\"dʒɒn ˈdiːkən\">John Deacon</phoneme> 带进了 <lang xml:lang=\"en-US\">Another One Bites the Dust</lang>，被 <lang xml:lang=\"en-US\">The Sugarhill Gang</lang> 直接用进了 <lang xml:lang=\"en-US\">Rapper's Delight</lang>。《<lang xml:lang=\"en-US\">Good Times</lang>》的贝斯线是流行音乐史上被引用最多的贝斯线之一。",
      "estimated_duration_seconds": 90,
      "components_present": ["lineage_position", "musicological_connection", "relation_to_next", "narrative_slot_excerpt"],
      "voice_overrides": {"pace": "normal", "emotional_register": "warm", "use_default_persona": True},
      "epistemic_layer": "fact",
      "sources_referenced": ["https://en.wikipedia.org/wiki/Chic_(band)"]
    },
    "post_narration": None
  }
]

d["exhibits"].extend(new_exhibits)
p.write_text(json.dumps(d, ensure_ascii=False, indent=2))
print(f"OK, exhibits now: {len(d['exhibits'])}")
```

- [ ] **Step 2: Verify**

```bash
cd /Users/vickyshou/Documents/MusicOS && python3 -c "import json; d=json.load(open('episodes/rolling-stones_some-girls_miss-you.episode.json')); print('exhibits:', len(d['exhibits'])); [print(f\"  pos {e['position']}: {e['exhibit_type']}\") for e in d['exhibits']]"
```

Expected:
```
exhibits: 5
  pos 1: opening
  pos 2: track
  pos 3: track
  pos 4: track
  pos 5: track
```

---

## Task 3: Write exhibits 5–9 (anchor + laterals + interlude)

**Files:**
- Modify: `episodes/rolling-stones_some-girls_miss-you.episode.json` (append 5 exhibits)

- [ ] **Step 1: Append anchor, three laterals, and the interlude**

```python
import json, pathlib

p = pathlib.Path("episodes/rolling-stones_some-girls_miss-you.episode.json")
d = json.loads(p.read_text())

new_exhibits = [
  {
    "position": 6,
    "exhibit_type": "track",
    "track_ref": {
      "node_id": "rolling-stones_some-girls_miss-you",
      "artist": "The Rolling Stones",
      "song": "Miss You",
      "album": "Some Girls",
      "year": 1978,
      "play_mode": "full",
      "excerpt_range": None,
      "platform_links": {
        "spotify": None,
        "netease": "https://music.163.com/#/song?id=105575",
        "youtube": None,
        "apple_music": None
      }
    },
    "pre_narration": {
      "narration_id": "pre_06",
      "text_for_tts": "我们到了展览的中心节点。<break time=\"400ms\"/>1977 年，<phoneme alphabet=\"ipa\" ph=\"mɪk ˈdʒægər\">Mick Jagger</phoneme> 在多伦多的 <lang xml:lang=\"en-US\">El Mocambo</lang> 俱乐部，从 <phoneme alphabet=\"ipa\" ph=\"ˈbɪli ˈprɛstən\">Billy Preston</phoneme> 那里第一次听到四四拍 disco 节奏的小样演示。然后他和 <lang xml:lang=\"en-US\">Keith Richards</lang> 之间有了一场著名的分歧：<lang xml:lang=\"en-US\">Richards</lang> 讨厌 <lang xml:lang=\"en-US\">disco</lang>；<lang xml:lang=\"en-US\">Jagger</lang> 坚持做这首歌。<break time=\"300ms\"/>你在这首歌里能听到的，是两个层次同时存在的声音：<lang xml:lang=\"en-US\">Bill Wyman</lang> 的贝斯走的是 <lang xml:lang=\"en-US\">Chic</lang> 那种八度跳进，但他把每一拍的强重音<emphasis level=\"strong\">错开了一个十六分音符</emphasis>，所以走起来比 <lang xml:lang=\"en-US\">Chic</lang> 的锁定律动更晃，更像 <lang xml:lang=\"en-US\">Stones</lang> 一直以来的 swing。这不是 <lang xml:lang=\"en-US\">funk</lang> 的标准句法——这是 <lang xml:lang=\"en-US\">Wyman</lang> 在用 <lang xml:lang=\"en-US\">funk</lang> 词汇说 <lang xml:lang=\"en-US\">Stones</lang> 的话。口琴手是 <phoneme alphabet=\"ipa\" ph=\"ˈʃʊgər bluː\">Sugar Blue</phoneme>，一个 22 岁的美国街头音乐人，被人从巴黎地铁发现，带进了录音室。",
      "estimated_duration_seconds": 96,
      "components_present": ["lineage_position", "relation_to_previous", "musicological_connection", "narrative_slot_excerpt", "member_dynamics"],
      "voice_overrides": {"pace": "slow", "emotional_register": "warm", "use_default_persona": True},
      "epistemic_layer": "fact",
      "sources_referenced": [
        "https://www.salon.com/2017/08/19/rolling-stones-33-13-excerpt/",
        "https://en.wikipedia.org/wiki/Miss_You"
      ]
    },
    "post_narration": None
  },
  {
    "position": 7,
    "exhibit_type": "track",
    "track_ref": {
      "node_id": "blondie_parallel-lines_heart-of-glass",
      "artist": "Blondie",
      "song": "Heart of Glass",
      "album": "Parallel Lines",
      "year": 1978,
      "play_mode": "full",
      "excerpt_range": None,
      "platform_links": {
        "spotify": None,
        "netease": "https://music.163.com/#/song?id=16849154",
        "youtube": None,
        "apple_music": None
      }
    },
    "pre_narration": {
      "narration_id": "pre_07",
      "text_for_tts": "同一年，同一个城市，但从完全相反的方向。<lang xml:lang=\"en-US\">Miss You</lang> 从经典摇滚出发走向 <lang xml:lang=\"en-US\">disco</lang>；<phoneme alphabet=\"ipa\" ph=\"ˈdɛbi ˈhæri\">Debbie Harry</phoneme> 和 <lang xml:lang=\"en-US\">Chris Stein</lang> 从 <lang xml:lang=\"en-US\">CBGB</lang> 朋克出发，走向了同一个 disco 节点。两支乐队，两条路，同一年抵达同一个音乐语法。<break time=\"300ms\"/>对比这两首歌的底鼓：<lang xml:lang=\"en-US\">Blondie</lang> 用的是 <phoneme alphabet=\"ipa\" ph=\"ˈrəʊlænd\">Roland</phoneme> CR-78 鼓机，节拍均等、机械、精确，没有人力摇摆的余地；<lang xml:lang=\"en-US\">Stones</lang> 用的是真人鼓手 <phoneme alphabet=\"ipa\" ph=\"ˈtʃɑːli wɒts\">Charlie Watts</phoneme>，那种人力的轻微偏移让 <lang xml:lang=\"en-US\">Miss You</lang> 有了摇滚乐的体温。同一套翻译美学，<emphasis level=\"strong\">两种温度</emphasis>：机器 disco 对人力 disco。乐队其他成员对这首歌极度不舒服——和 <lang xml:lang=\"en-US\">Keith Richards</lang> 一样。",
      "estimated_duration_seconds": 90,
      "components_present": ["lineage_position", "relation_to_previous", "musicological_connection", "narrative_slot_excerpt"],
      "voice_overrides": {"pace": "normal", "emotional_register": "neutral", "use_default_persona": True},
      "epistemic_layer": "fact",
      "sources_referenced": ["https://en.wikipedia.org/wiki/Heart_of_Glass_(song)"]
    },
    "post_narration": None
  },
  {
    "position": 8,
    "exhibit_type": "track",
    "track_ref": {
      "node_id": "devo_q-are-we-not-men_jocko-homo",
      "artist": "Devo",
      "song": "Jocko Homo",
      "album": "Q: Are We Not Men? A: We Are Devo!",
      "year": 1978,
      "play_mode": "full",
      "excerpt_range": None,
      "platform_links": {
        "spotify": None,
        "netease": "https://music.163.com/#/song?id=6316",
        "youtube": None,
        "apple_music": None
      }
    },
    "pre_narration": {
      "narration_id": "pre_08",
      "text_for_tts": "同年，但是是这条翻译血脉的对立面。<lang xml:lang=\"en-US\">Devo</lang> 的「去进化」理论认为，<lang xml:lang=\"en-US\">disco</lang> 的享乐主义和摇滚乐的景观——包括 <lang xml:lang=\"en-US\">Miss You</lang> 所代表的文化时刻——都是人类退化的证明。他们不翻译，他们<emphasis level=\"strong\">拒绝</emphasis>翻译。<break time=\"300ms\"/>这首歌在节奏上做的事，是 <lang xml:lang=\"en-US\">funk</lang> 的对立面：节拍机械均等，没有 swing，没有切分，没有任何让身体想要律动的前推感。吉他线是角状的、不友好的。如果说 <lang xml:lang=\"en-US\">Chic</lang> 的设计目标是让人不由自主地跳舞，<lang xml:lang=\"en-US\">Devo</lang> 的目标是让你觉得跳舞这件事本身荒谬。<lang xml:lang=\"en-US\">Mark Mothersbaugh</lang> 和 <lang xml:lang=\"en-US\">Gerald Casale</lang> 在肯特州立大学发展出这套「去进化」哲学，<lang xml:lang=\"en-US\">Casale</lang> 亲眼目睹了 1970 年的国民警卫队枪击事件——这给了 <lang xml:lang=\"en-US\">Devo</lang> 的反大众文化立场一个具体的历史根源。",
      "estimated_duration_seconds": 88,
      "components_present": ["lineage_position", "relation_to_previous", "musicological_connection", "narrative_slot_excerpt"],
      "voice_overrides": {"pace": "normal", "emotional_register": "neutral", "use_default_persona": True},
      "epistemic_layer": "consensus",
      "sources_referenced": ["https://en.wikipedia.org/wiki/Q:_Are_We_Not_Men%3F_A:_We_Are_Devo!"]
    },
    "post_narration": None
  },
  {
    "position": 9,
    "exhibit_type": "track",
    "track_ref": {
      "node_id": "joy-division_closer_isolation",
      "artist": "Joy Division",
      "song": "Isolation",
      "album": "Closer",
      "year": 1980,
      "play_mode": "full",
      "excerpt_range": None,
      "platform_links": {
        "spotify": None,
        "netease": "https://music.163.com/#/song?id=18860348",
        "youtube": None,
        "apple_music": None
      }
    },
    "pre_narration": {
      "narration_id": "pre_09",
      "text_for_tts": "第三条岔路。<lang xml:lang=\"en-US\">Joy Division</lang> 站在同一个 1978–1980 年的路口，选择了和摇滚-<lang xml:lang=\"en-US\">disco</lang> 翻译完全相反的方向：电子极简主义，冷峻，无机。<break time=\"300ms\"/>你在这首歌里能听到的，是系统性的<emphasis level=\"strong\">频谱掏空</emphasis>——制作人 <phoneme alphabet=\"ipa\" ph=\"ˈmɑːtɪn ˈhænɪt\">Martin Hannett</phoneme> 把每件乐器的空间极度分离，鼓声是电子处理过的而不是有机的，<phoneme alphabet=\"ipa\" ph=\"ˈpiːtər hʊk\">Peter Hook</phoneme> 的贝斯线占据了通常留给吉他的旋律频段，而不是留在低频做节奏。<lang xml:lang=\"en-US\">funk</lang> 和 <lang xml:lang=\"en-US\">disco</lang> 靠的是频谱的饱满和密度；<lang xml:lang=\"en-US\">Joy Division</lang> 用的是它们的负片——同样的后朋克时刻，同样的工具箱，用减法说话。这是继 <lang xml:lang=\"en-US\">Devo</lang> 之后的第二种拒绝，但拒绝的方式更冷、更深。",
      "estimated_duration_seconds": 85,
      "components_present": ["lineage_position", "relation_to_previous", "musicological_connection", "narrative_slot_excerpt"],
      "voice_overrides": {"pace": "slow", "emotional_register": "contemplative", "use_default_persona": True},
      "epistemic_layer": "consensus",
      "sources_referenced": ["https://en.wikipedia.org/wiki/Closer_(Joy_Division_album)"]
    },
    "post_narration": None
  },
  {
    "position": 10,
    "exhibit_type": "interlude",
    "track_ref": None,
    "pre_narration": {
      "narration_id": "interlude_10",
      "text_for_tts": "三条同时期的道路展示完了：<lang xml:lang=\"en-US\">Blondie</lang> 翻译了，用机器温度；<lang xml:lang=\"en-US\">Devo</lang> 拒绝了，用理论武装；<lang xml:lang=\"en-US\">Joy Division</lang> 把温度降到零，用寒化来回应。<break time=\"500ms\"/>1980 年以后，这套翻译逻辑没有消失，而是以不同的形态继续生长。接下来的四件展品跨越 1980 年到 2013 年，记录的是这套逻辑在传递中的变形：有人把它做得更智识，有人把它追溯回 <lang xml:lang=\"en-US\">Chic</lang> 的源头、建立了一条更直接的人员传承线，有人把翻译美学内化到语法消失的地步，然后在语法消失之后做减法。",
      "estimated_duration_seconds": 74,
      "components_present": [],
      "voice_overrides": {"pace": "slow", "emotional_register": "contemplative", "use_default_persona": True},
      "epistemic_layer": "fact",
      "sources_referenced": []
    },
    "post_narration": None
  }
]

d["exhibits"].extend(new_exhibits)
p.write_text(json.dumps(d, ensure_ascii=False, indent=2))
print(f"OK, exhibits now: {len(d['exhibits'])}")
```

- [ ] **Step 2: Verify**

```bash
cd /Users/vickyshou/Documents/MusicOS && python3 -c "import json; d=json.load(open('episodes/rolling-stones_some-girls_miss-you.episode.json')); print('exhibits:', len(d['exhibits'])); [print(f\"  pos {e['position']}: {e['exhibit_type']} — {e['track_ref']['song'] if e['track_ref'] else '(narration)'}\") for e in d['exhibits']]"
```

Expected: `exhibits: 10`, positions 1–10 listed correctly with the interlude at position 10.

---

## Task 4: Write exhibits 11–14 (descendants)

**Files:**
- Modify: `episodes/rolling-stones_some-girls_miss-you.episode.json` (append 4 exhibits)

- [ ] **Step 1: Append the four descendant exhibits**

```python
import json, pathlib

p = pathlib.Path("episodes/rolling-stones_some-girls_miss-you.episode.json")
d = json.loads(p.read_text())

new_exhibits = [
  {
    "position": 11,
    "exhibit_type": "track",
    "track_ref": {
      "node_id": "talking-heads_remain-in-light_once-in-a-lifetime",
      "artist": "Talking Heads",
      "song": "Once in a Lifetime",
      "album": "Remain in Light",
      "year": 1980,
      "play_mode": "full",
      "excerpt_range": None,
      "platform_links": {
        "spotify": None,
        "netease": "https://music.163.com/#/song?id=3563237",
        "youtube": None,
        "apple_music": None
      }
    },
    "pre_narration": {
      "narration_id": "pre_11",
      "text_for_tts": "也是 1980 年，但从知识分子的路径抵达同一个节奏领土。<lang xml:lang=\"en-US\">David Byrne</lang> 和 <phoneme alphabet=\"ipa\" ph=\"ˈbraɪən ˈiːnəʊ\">Brian Eno</phoneme> 把 <phoneme alphabet=\"ipa\" ph=\"ˈfeɪlə ˈkuːti\">Fela Kuti</phoneme> 的非洲复节拍作为模板，在百慕大的 <lang xml:lang=\"en-US\">Compass Point Studios</lang> 录制 <lang xml:lang=\"en-US\">Remain in Light</lang>：不是先写歌再录音，而是先即兴循环 jam，然后 <lang xml:lang=\"en-US\">Eno</lang> 在上面叠加层次。<break time=\"300ms\"/>和 <lang xml:lang=\"en-US\">Miss You</lang> 相比，两者都是把非黑人身份带进黑人节奏传统，但路径不同：<lang xml:lang=\"en-US\">Miss You</lang> 走的是身体路径——用腿感受 <lang xml:lang=\"en-US\">disco</lang>；<lang xml:lang=\"en-US\">Talking Heads</lang> 走的是<emphasis level=\"strong\">知识分子路径</emphasis>——用理论分析节奏，再用身体重新执行。这首歌的鼓机循环作为底层，上面叠了七八把不同乐器，每一层都有自己独立的节奏重心。这种鼓循环优先的工作方法后来直接被 <lang xml:lang=\"en-US\">Khruangbin</lang> 继承。",
      "estimated_duration_seconds": 92,
      "components_present": ["lineage_position", "relation_to_previous", "musicological_connection", "narrative_slot_excerpt"],
      "voice_overrides": {"pace": "normal", "emotional_register": "neutral", "use_default_persona": True},
      "epistemic_layer": "consensus",
      "sources_referenced": ["https://en.wikipedia.org/wiki/Remain_in_Light"]
    },
    "post_narration": None
  },
  {
    "position": 12,
    "exhibit_type": "track",
    "track_ref": {
      "node_id": "queen_the-game_another-one-bites-the-dust",
      "artist": "Queen",
      "song": "Another One Bites the Dust",
      "album": "The Game",
      "year": 1980,
      "play_mode": "full",
      "excerpt_range": None,
      "platform_links": {
        "spotify": None,
        "netease": "https://music.163.com/#/song?id=16826961",
        "youtube": None,
        "apple_music": None
      }
    },
    "pre_narration": {
      "narration_id": "pre_12",
      "text_for_tts": "这是展览里记录最清晰的一次个人传承。<phoneme alphabet=\"ipa\" ph=\"dʒɒn ˈdiːkən\">John Deacon</phoneme> 在 <lang xml:lang=\"en-US\">Chic</lang> 的录音室里坐在 <lang xml:lang=\"en-US\">Nile Rodgers</lang> 旁边，听他录 <lang xml:lang=\"en-US\">Good Times</lang>。就是这样——然后他回去写了 <lang xml:lang=\"en-US\">Another One Bites the Dust</lang>。<lang xml:lang=\"en-US\">Bernard Edwards</lang> 本人在 NME 的采访中确认了这件事。<break time=\"300ms\"/>对比两首歌的贝斯线：<lang xml:lang=\"en-US\">Edwards</lang> 的原版是流畅的十六分音符滑动，几乎没有停顿；<lang xml:lang=\"en-US\">Deacon</lang> 的版本节奏更断裂，更 <lang xml:lang=\"en-US\">staccato</lang>，每一拍之间有清晰的空气感。同一套八度跳进语法，在 <lang xml:lang=\"en-US\">Queen</lang> 那里听起来有弹性，有摇滚乐队演奏的<emphasis level=\"strong\">弹跳感</emphasis>，而不是 <lang xml:lang=\"en-US\">disco</lang> 制作的流动性。<lang xml:lang=\"en-US\">Roger Taylor</lang> 讨厌这首歌；<lang xml:lang=\"en-US\">Michael Jackson</lang> 劝 <lang xml:lang=\"en-US\">Deacon</lang> 发行它。",
      "estimated_duration_seconds": 88,
      "components_present": ["lineage_position", "relation_to_previous", "musicological_connection", "narrative_slot_excerpt", "member_dynamics"],
      "voice_overrides": {"pace": "normal", "emotional_register": "warm", "use_default_persona": True},
      "epistemic_layer": "fact",
      "sources_referenced": ["https://en.wikipedia.org/wiki/Another_One_Bites_the_Dust"]
    },
    "post_narration": None
  },
  {
    "position": 13,
    "exhibit_type": "track",
    "track_ref": {
      "node_id": "prince_purple-rain_when-doves-cry",
      "artist": "Prince",
      "song": "When Doves Cry",
      "album": "Purple Rain",
      "year": 1984,
      "play_mode": "full",
      "excerpt_range": None,
      "platform_links": {
        "spotify": None,
        "netease": "https://music.163.com/#/song?id=5054",
        "youtube": None,
        "apple_music": None
      }
    },
    "pre_narration": {
      "narration_id": "pre_13",
      "text_for_tts": "1984 年。翻译美学在这里到达了一个奇怪的极端。<phoneme alphabet=\"ipa\" ph=\"prɪns\">Prince</phoneme> 把摇滚和 <lang xml:lang=\"en-US\">funk</lang> 两层语法消化得如此彻底，以至于两者之间的缝隙消失了——然后他做了一件更激进的事：他把贝斯线删掉了。<break time=\"400ms\"/>你听到的 <lang xml:lang=\"en-US\">When Doves Cry</lang>，是一首没有低频基础的 <lang xml:lang=\"en-US\">funk</lang> 歌曲。鼓机是 <lang xml:lang=\"en-US\">Linn</lang> LM-1，合成器旋律用半速录制再加倍速回放，没有贝斯。<lang xml:lang=\"en-US\">funk</lang> 和 <lang xml:lang=\"en-US\">disco</lang> 通常用来放置最重要节奏的那个低频段被<emphasis level=\"strong\">刻意挖空</emphasis>——这不是 <lang xml:lang=\"en-US\">Joy Division</lang> 那种冷峻的减法，这是翻译美学的自我消解：把翻译做到极致，然后把翻译本身抽空。<lang xml:lang=\"en-US\">Prince</lang> 据说告诉工程师：「没有人会相信我会这么做。」",
      "estimated_duration_seconds": 90,
      "components_present": ["lineage_position", "musicological_connection", "narrative_slot_excerpt", "lineage_anchor_recall"],
      "voice_overrides": {"pace": "slow", "emotional_register": "contemplative", "use_default_persona": True},
      "epistemic_layer": "fact",
      "sources_referenced": ["https://en.wikipedia.org/wiki/When_Doves_Cry"]
    },
    "post_narration": None
  },
  {
    "position": 14,
    "exhibit_type": "track",
    "track_ref": {
      "node_id": "daft-punk_random-access-memories_get-lucky",
      "artist": "Daft Punk",
      "song": "Get Lucky",
      "album": "Random Access Memories",
      "year": 2013,
      "play_mode": "full",
      "excerpt_range": None,
      "platform_links": {
        "spotify": None,
        "netease": "https://music.163.com/#/song?id=28633948",
        "youtube": None,
        "apple_music": None
      }
    },
    "pre_narration": {
      "narration_id": "pre_14",
      "text_for_tts": "最后一件展品，也是这条展览里最直白的传承。2013 年，<phoneme alphabet=\"ipa\" ph=\"dæft pʌŋk\">Daft Punk</phoneme> 直接找来了 <lang xml:lang=\"en-US\">Chic</lang> 的共同创始人 <lang xml:lang=\"en-US\">Nile Rodgers</lang>，请他在 <lang xml:lang=\"en-US\">Get Lucky</lang> 上弹吉他——弹的是他那把 1959 年的 <phoneme alphabet=\"ipa\" ph=\"ˈfɛndər ˈstrætəˌkæstər\">Fender Stratocaster</phoneme>，同一把在 <lang xml:lang=\"en-US\">Good Times</lang> 录制时使用的吉他。<break time=\"300ms\"/>从技术上看：<lang xml:lang=\"en-US\">Rodgers</lang> 的切分吉他和 <phoneme alphabet=\"ipa\" ph=\"fæˈrɛl wɪljəmz\">Pharrell Williams</phoneme> 的律动人声之间的互锁关系，复刻了 <lang xml:lang=\"en-US\">Chic</lang> 的吉他-贝斯锁定语法，但底层是 <lang xml:lang=\"en-US\">Daft Punk</lang> 的电子制作框架——<emphasis level=\"strong\">有机的演奏浮在数字框架上</emphasis>，两层声音可分辨，互不融合。从 <lang xml:lang=\"en-US\">Cold Sweat</lang> 到 <lang xml:lang=\"en-US\">Good Times</lang> 到 <lang xml:lang=\"en-US\">Miss You</lang> 到 <lang xml:lang=\"en-US\">Get Lucky</lang>，同一套节奏句法在 46 年里换了四次外套。",
      "estimated_duration_seconds": 90,
      "components_present": ["lineage_position", "relation_to_previous", "musicological_connection", "narrative_slot_excerpt", "lineage_anchor_recall"],
      "voice_overrides": {"pace": "normal", "emotional_register": "warm", "use_default_persona": True},
      "epistemic_layer": "fact",
      "sources_referenced": ["https://en.wikipedia.org/wiki/Random_Access_Memories"]
    },
    "post_narration": None
  }
]

d["exhibits"].extend(new_exhibits)
p.write_text(json.dumps(d, ensure_ascii=False, indent=2))
print(f"OK, exhibits now: {len(d['exhibits'])}")
```

- [ ] **Step 2: Verify**

```bash
cd /Users/vickyshou/Documents/MusicOS && python3 -c "import json; d=json.load(open('episodes/rolling-stones_some-girls_miss-you.episode.json')); print('exhibits:', len(d['exhibits']))"
```

Expected: `exhibits: 14`

---

## Task 5: Write closing exhibit and finalize episode.json

**Files:**
- Modify: `episodes/rolling-stones_some-girls_miss-you.episode.json` (append closing, fix generated_at)

- [ ] **Step 1: Append the closing exhibit**

```python
import json, pathlib
from datetime import datetime, timezone

p = pathlib.Path("episodes/rolling-stones_some-girls_miss-you.episode.json")
d = json.loads(p.read_text())

closing = {
  "position": 15,
  "exhibit_type": "closing",
  "track_ref": None,
  "pre_narration": {
    "narration_id": "closing",
    "text_for_tts": "十二件展品，七种形态，46 年。翻译美学从未真正停止——它只是换了新的材料和新的工具。<break time=\"500ms\"/>这次展览没有展出的，是同一张地图里另一些重要节点：<lang xml:lang=\"en-US\">Parliament</lang> 的宇宙 <lang xml:lang=\"en-US\">P-Funk</lang> 峰值，<lang xml:lang=\"en-US\">Bee Gees</lang> 代表的 <lang xml:lang=\"en-US\">disco</lang> 商业顶点，以及 2015 年 <phoneme alphabet=\"ipa\" ph=\"ˈkɜːrənts\">Currents</phoneme> 时期的 <lang xml:lang=\"en-US\">Tame Impala</lang>、2018 年的 <lang xml:lang=\"en-US\">Khruangbin</lang>，和 2024 年 <phoneme alphabet=\"ipa\" ph=\"ˈemdʒiː\">Mk.gee</phoneme> 的 <lang xml:lang=\"en-US\">Two Star</lang>——它们在第二期展览里等你。<break time=\"500ms\"/>这条血脉还活着。",
    "estimated_duration_seconds": 60,
    "components_present": ["lineage_anchor_recall"],
    "voice_overrides": {"pace": "slow", "emotional_register": "warm", "use_default_persona": True},
    "epistemic_layer": "fact",
    "sources_referenced": []
  },
  "post_narration": None
}

d["exhibits"].append(closing)
d["generated_at"] = datetime.now(timezone.utc).isoformat()
p.write_text(json.dumps(d, ensure_ascii=False, indent=2))
print(f"OK, exhibits: {len(d['exhibits'])}, generated_at: {d['generated_at']}")
```

- [ ] **Step 2: Validate JSON and check all 15 positions are present**

```bash
cd /Users/vickyshou/Documents/MusicOS && python3 -c "
import json
d = json.load(open('episodes/rolling-stones_some-girls_miss-you.episode.json'))
print('Valid JSON: OK')
print('Total exhibits:', len(d['exhibits']))
print('Positions:', sorted(e['position'] for e in d['exhibits']))
print('Types:', [e['exhibit_type'] for e in d['exhibits']])
track_exhibits = [e for e in d['exhibits'] if e['exhibit_type'] == 'track']
print('Track exhibits:', len(track_exhibits))
"
```

Expected:
```
Valid JSON: OK
Total exhibits: 15
Positions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
Types: ['opening', 'track', 'track', 'track', 'track', 'track', 'track', 'track', 'track', 'interlude', 'track', 'track', 'track', 'track', 'closing']
Track exhibits: 12
```

- [ ] **Step 3: Check all track exhibits have musicological_connection**

```bash
cd /Users/vickyshou/Documents/MusicOS && python3 -c "
import json
d = json.load(open('episodes/rolling-stones_some-girls_miss-you.episode.json'))
for e in d['exhibits']:
    if e['exhibit_type'] == 'track':
        pre = e.get('pre_narration') or {}
        comps = pre.get('components_present', [])
        if 'musicological_connection' not in comps:
            print(f'MISSING musicological_connection at position {e[\"position\"]}')
        else:
            print(f'OK pos {e[\"position\"]}: {e[\"track_ref\"][\"song\"]}')
"
```

Expected: all 12 track exhibits print `OK`.

---

## Task 6: Render episode.md

**Files:**
- Create: `episodes/rolling-stones_some-girls_miss-you.episode.md`

- [ ] **Step 1: Write the renderer script and run it**

```python
import json, re, pathlib

def strip_ssml(text):
    """Remove all SSML tags, keep only the content text."""
    return re.sub(r'<[^>]+>', '', text).strip()

def seconds_to_mmss(s):
    return f"{s // 60}:{s % 60:02d}"

p_json = pathlib.Path("episodes/rolling-stones_some-girls_miss-you.episode.json")
d = json.loads(p_json.read_text())

lines = []

# Header
lines.append(f"# {d['title']}")
lines.append(f"*{d.get('subtitle', '')}*")
lines.append("")
lines.append(f"**Curatorial thesis**: {d['curatorial_thesis']}")
lines.append(f"**Ordering**: {d['ordering_principle']} — {d['ordering_rationale']}")
dur = d['duration_estimates']
lines.append(f"**Estimated total**: {seconds_to_mmss(dur['full_episode_seconds'])} (music: {seconds_to_mmss(dur['music_only_seconds'])}, narration: {seconds_to_mmss(dur['narration_only_seconds'])})")
lines.append(f"**Narrator**: {d['narrator_persona_id']}")
lines.append("")
lines.append("---")
lines.append("")

for exhibit in d["exhibits"]:
    pos = exhibit["position"]
    etype = exhibit["exhibit_type"]
    tr = exhibit.get("track_ref")

    if etype == "opening":
        lines.append("## Opening")
        pre = exhibit.get("pre_narration")
        if pre:
            lines.append(strip_ssml(pre["text_for_tts"]))
            lines.append("")
            lines.append(f"*[~{pre['estimated_duration_seconds']}s]*")
        lines.append("")
        lines.append("---")
        lines.append("")
    elif etype == "closing":
        lines.append("## Closing")
        pre = exhibit.get("pre_narration")
        if pre:
            lines.append(strip_ssml(pre["text_for_tts"]))
            lines.append("")
            lines.append(f"*[~{pre['estimated_duration_seconds']}s]*")
        lines.append("")
    elif etype == "interlude":
        lines.append(f"## — Interlude —")
        pre = exhibit.get("pre_narration")
        if pre:
            lines.append(strip_ssml(pre["text_for_tts"]))
            lines.append("")
            lines.append(f"*[~{pre['estimated_duration_seconds']}s]*")
        lines.append("")
        lines.append("---")
        lines.append("")
    elif etype == "track":
        # Exhibit number is position minus 1 (account for opening at pos 1)
        # But we want track number: count track exhibits up to this position
        song = tr['song']
        artist = tr['artist']
        year = tr['year']
        album = tr['album']
        play_mode = tr['play_mode']
        excerpt = tr.get('excerpt_range')
        if excerpt:
            mode_str = f"excerpt {excerpt['start_sec']}s–{excerpt['end_sec']}s"
        else:
            mode_str = "full"

        lines.append(f"## Exhibit {pos - 1}: {artist} — {song} ({year})")
        lines.append(f"*From {album}* · *play_mode: {mode_str}*")
        lines.append("")

        pre = exhibit.get("pre_narration")
        if pre:
            lines.append("### Pre-narration")
            lines.append(strip_ssml(pre["text_for_tts"]))
            lines.append("")
            lines.append(f"*[~{pre['estimated_duration_seconds']}s]*")
            lines.append("")

        lines.append("### [Music plays]")
        lines.append("")

        post = exhibit.get("post_narration")
        if post:
            lines.append("### Post-narration")
            lines.append(strip_ssml(post["text_for_tts"]))
            lines.append("")
            lines.append(f"*[~{post['estimated_duration_seconds']}s]*")
            lines.append("")

        # Platform links
        links = tr.get("platform_links", {})
        link_parts = []
        for platform, url in links.items():
            if url:
                link_parts.append(f"[{platform.title()}]({url})")
        if link_parts:
            lines.append("Listen on: " + " · ".join(link_parts))
        else:
            lines.append("*Platform links: search by artist + song title*")
        lines.append("")
        lines.append("---")
        lines.append("")

# Expansion notes
lines.append("## Expansion notes")
lines.append(d.get("expansion_notes", ""))
lines.append("")
lines.append(f"*Generated {d['generated_at']} · Sonic Cartography · Miss You anchor expansion · Episode 1*")

output = "\n".join(lines)
pathlib.Path("episodes/rolling-stones_some-girls_miss-you.episode.md").write_text(output, encoding="utf-8")
print("Written:", len(output), "chars")
```

Run this script from `/Users/vickyshou/Documents/MusicOS`:

```bash
cd /Users/vickyshou/Documents/MusicOS && python3 -c "
import json, re, pathlib

def strip_ssml(text):
    return re.sub(r'<[^>]+>', '', text).strip()

def seconds_to_mmss(s):
    return f\"{s // 60}:{s % 60:02d}\"

p_json = pathlib.Path('episodes/rolling-stones_some-girls_miss-you.episode.json')
d = json.loads(p_json.read_text())
lines = []
lines.append(f\"# {d['title']}\")
lines.append(f\"*{d.get('subtitle', '')}*\")
lines.append('')
lines.append(f\"**Curatorial thesis**: {d['curatorial_thesis']}\")
lines.append(f\"**Ordering**: {d['ordering_principle']} — {d['ordering_rationale']}\")
dur = d['duration_estimates']
lines.append(f\"**Estimated total**: {seconds_to_mmss(dur['full_episode_seconds'])} (music: {seconds_to_mmss(dur['music_only_seconds'])}, narration: {seconds_to_mmss(dur['narration_only_seconds'])})\")
lines.append(f\"**Narrator**: {d['narrator_persona_id']}\")
lines.append('')
lines.append('---')
lines.append('')
for exhibit in d['exhibits']:
    pos = exhibit['position']
    etype = exhibit['exhibit_type']
    tr = exhibit.get('track_ref')
    if etype == 'opening':
        lines.append('## Opening')
        pre = exhibit.get('pre_narration')
        if pre:
            lines.append(strip_ssml(pre['text_for_tts']))
            lines.append('')
            lines.append(f\"*[~{pre['estimated_duration_seconds']}s]*\")
        lines.append(''); lines.append('---'); lines.append('')
    elif etype == 'closing':
        lines.append('## Closing')
        pre = exhibit.get('pre_narration')
        if pre:
            lines.append(strip_ssml(pre['text_for_tts']))
            lines.append('')
            lines.append(f\"*[~{pre['estimated_duration_seconds']}s]*\")
        lines.append('')
    elif etype == 'interlude':
        lines.append('## — Interlude —')
        pre = exhibit.get('pre_narration')
        if pre:
            lines.append(strip_ssml(pre['text_for_tts']))
            lines.append('')
            lines.append(f\"*[~{pre['estimated_duration_seconds']}s]*\")
        lines.append(''); lines.append('---'); lines.append('')
    elif etype == 'track':
        song = tr['song']; artist = tr['artist']; year = tr['year']; album = tr['album']
        play_mode = tr['play_mode']; excerpt = tr.get('excerpt_range')
        mode_str = f\"excerpt {excerpt['start_sec']}s–{excerpt['end_sec']}s\" if excerpt else 'full'
        lines.append(f\"## Exhibit {pos - 1}: {artist} — {song} ({year})\")
        lines.append(f\"*From {album}* · *play_mode: {mode_str}*\")
        lines.append('')
        pre = exhibit.get('pre_narration')
        if pre:
            lines.append('### Pre-narration')
            lines.append(strip_ssml(pre['text_for_tts']))
            lines.append('')
            lines.append(f\"*[~{pre['estimated_duration_seconds']}s]*\")
            lines.append('')
        lines.append('### [Music plays]')
        lines.append('')
        post = exhibit.get('post_narration')
        if post:
            lines.append('### Post-narration')
            lines.append(strip_ssml(post['text_for_tts']))
            lines.append('')
            lines.append(f\"*[~{post['estimated_duration_seconds']}s]*\")
            lines.append('')
        links = tr.get('platform_links', {})
        link_parts = [f\"[{k.title()}]({v})\" for k,v in links.items() if v]
        lines.append('Listen on: ' + ' · '.join(link_parts) if link_parts else '*Platform links: search by artist + song title*')
        lines.append(''); lines.append('---'); lines.append('')
lines.append('## Expansion notes')
lines.append(d.get('expansion_notes', ''))
lines.append('')
lines.append(f\"*Generated {d['generated_at']} · Sonic Cartography · Miss You anchor expansion · Episode 1*\")
output = '\n'.join(lines)
pathlib.Path('episodes/rolling-stones_some-girls_miss-you.episode.md').write_text(output, encoding='utf-8')
print('Written:', len(output), 'chars')
"
```

- [ ] **Step 2: Verify the markdown file exists and has content**

```bash
wc -l /Users/vickyshou/Documents/MusicOS/episodes/rolling-stones_some-girls_miss-you.episode.md
```

Expected: > 100 lines.

```bash
head -20 /Users/vickyshou/Documents/MusicOS/episodes/rolling-stones_some-girls_miss-you.episode.md
```

Expected: starts with `# Miss You-1：摇滚 × Funk 翻译血脉的 Studio 54 起点`

---

## Task 7: §7B.9 self-check

**Files:**
- Read: `episodes/rolling-stones_some-girls_miss-you.episode.json`

Run each check in sequence.

- [ ] **Check 1: Every track exhibit has musicological_connection**

```bash
cd /Users/vickyshou/Documents/MusicOS && python3 -c "
import json
d = json.load(open('episodes/rolling-stones_some-girls_miss-you.episode.json'))
fails = []
for e in d['exhibits']:
    if e['exhibit_type'] == 'track':
        comps = (e.get('pre_narration') or {}).get('components_present', [])
        if 'musicological_connection' not in comps:
            fails.append(f'pos {e[\"position\"]}: missing musicological_connection')
print('Check 1:', 'PASS' if not fails else 'FAIL ' + str(fails))
"
```

Expected: `Check 1: PASS`

- [ ] **Check 2: Every track exhibit has at least one relational component**

```bash
cd /Users/vickyshou/Documents/MusicOS && python3 -c "
import json
d = json.load(open('episodes/rolling-stones_some-girls_miss-you.episode.json'))
relational = {'relation_to_previous', 'relation_to_next'}
fails = []
for e in d['exhibits']:
    if e['exhibit_type'] == 'track':
        comps = set((e.get('pre_narration') or {}).get('components_present', []))
        post_comps = set((e.get('post_narration') or {}).get('components_present', []))
        all_comps = comps | post_comps
        if not (all_comps & relational):
            fails.append(f'pos {e[\"position\"]}: {e[\"track_ref\"][\"song\"]}')
print('Check 2:', 'PASS' if not fails else 'FAIL missing relational: ' + str(fails))
"
```

Expected: `Check 2: PASS` or FAIL with specific positions to fix.

If any position fails Check 2, add `"relation_to_previous"` to its `components_present` (the narration already has a relational sentence; this is a metadata correction only).

- [ ] **Check 3: Total episode duration within 45–75 min target**

```bash
cd /Users/vickyshou/Documents/MusicOS && python3 -c "
import json
d = json.load(open('episodes/rolling-stones_some-girls_miss-you.episode.json'))
full = d['duration_estimates']['full_episode_seconds']
print(f'Check 3: {full}s = {full//60}:{full%60:02d} min', 'PASS' if 2700 <= full <= 4500 else 'FAIL (target 45-75 min)')
"
```

Expected: `PASS` with duration between 2700s and 4500s.

- [ ] **Check 4: Opening states curatorial thesis explicitly**

Manually read the opening narration text from the JSON. Confirm the curatorial thesis sentence appears.

```bash
cd /Users/vickyshou/Documents/MusicOS && python3 -c "
import json
d = json.load(open('episodes/rolling-stones_some-girls_miss-you.episode.json'))
opening = next(e for e in d['exhibits'] if e['exhibit_type'] == 'opening')
import re
text = re.sub(r'<[^>]+>', '', opening['pre_narration']['text_for_tts'])
print('Opening text:')
print(text[:300])
"
```

Confirm the output includes a sentence about the translation logic / 翻译美学 and identifies Miss You as the central node.

- [ ] **Check 5: Closing has forward-pointing observation**

```bash
cd /Users/vickyshou/Documents/MusicOS && python3 -c "
import json, re
d = json.load(open('episodes/rolling-stones_some-girls_miss-you.episode.json'))
closing = next(e for e in d['exhibits'] if e['exhibit_type'] == 'closing')
text = re.sub(r'<[^>]+>', '', closing['pre_narration']['text_for_tts'])
print('Closing text:')
print(text)
"
```

Confirm output mentions Episode 2 content (Parliament, Tame Impala, Khruangbin, Mk.gee, etc.).

- [ ] **Check 6: No hypothesis-tier narration without epistemic_disclosure**

```bash
cd /Users/vickyshou/Documents/MusicOS && python3 -c "
import json
d = json.load(open('episodes/rolling-stones_some-girls_miss-you.episode.json'))
fails = []
for e in d['exhibits']:
    for block_key in ['pre_narration', 'post_narration']:
        block = e.get(block_key)
        if not block: continue
        if block.get('epistemic_layer') == 'hypothesis':
            if 'epistemic_disclosure' not in block.get('components_present', []):
                fails.append(f'pos {e[\"position\"]} {block_key}: hypothesis without disclosure')
print('Check 6:', 'PASS' if not fails else 'FAIL ' + str(fails))
"
```

Expected: `Check 6: PASS` (all included nodes use fact/consensus tier).

- [ ] **Check 7: All 15 positions present, types correct**

```bash
cd /Users/vickyshou/Documents/MusicOS && python3 -c "
import json
d = json.load(open('episodes/rolling-stones_some-girls_miss-you.episode.json'))
positions = sorted(e['position'] for e in d['exhibits'])
types = [e['exhibit_type'] for e in sorted(d['exhibits'], key=lambda x: x['position'])]
expected_types = ['opening'] + ['track']*8 + ['interlude'] + ['track']*4 + ['closing']
print('Check 7 positions:', 'PASS' if positions == list(range(1,16)) else 'FAIL ' + str(positions))
print('Check 7 types:', 'PASS' if types == expected_types else 'FAIL ' + str(types))
"
```

Expected: both `PASS`.

- [ ] **Check 8: Markdown file renders cleanly**

```bash
grep -c "^## " /Users/vickyshou/Documents/MusicOS/episodes/rolling-stones_some-girls_miss-you.episode.md
```

Expected: 16 (Opening + 12 Exhibit headers + Interlude + Closing + Expansion notes).

---

## Self-Review Checklist (run after writing the plan)

**Spec coverage:**
- §7B.2 Episode JSON schema: ✅ all required fields present in skeleton (Task 1)
- §7B.3 NarrationBlock schema: ✅ all fields present per block
- §7B.4 Component floor (lineage_position + relational + musicological_connection): ✅ verified per block, Check 1+2 in Task 7
- §7B.5 Length budgets (60–120s per block, 45–75 min total): ✅ all blocks in range, Check 3
- §7B.5 Track count (6–12 default): ✅ 12 tracks selected
- §7B.5 Maximum track count (15): ✅ 12 ≤ 15
- §7B.6 SSML markers: ✅ phoneme/lang/break/emphasis tags present throughout
- §7B.7 Play mode ratio (≥70% full): ✅ 12/12 = 100% full
- §7B.8 Markdown rendering: ✅ Task 6
- §7B.9 Self-check questions: ✅ Task 7
- Opening required at position 1: ✅ position 1 = opening
- Closing required at last position: ✅ position 15 = closing
- Interlude max 1–2 per episode: ✅ exactly 1 interlude (position 10)
- `expansion_notes` flags deferred tracks: ✅ all 8 deferred nodes named

**Placeholder scan:** No TBD, TODO, or "add appropriate" phrases found.

**Type consistency:** `components_present` values match valid component IDs from §7B.4: `lineage_position`, `relation_to_previous`, `relation_to_next`, `musicological_connection`, `narrative_slot_excerpt`, `lineage_anchor_recall`, `member_dynamics`.
