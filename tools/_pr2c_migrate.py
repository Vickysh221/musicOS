"""One-shot migration of connections.json to v0.4 schema.

- Drops `direction`.
- Restructures `narration_at_from` / `narration_at_to` into `narration_modes`:
  - foreshadow_anonymous_at_from (NEW prose; forward artist+song stripped)
  - foreshadow_named_at_from = null (filled on demand by Phase 2)
  - callback_named_at_to (preserved verbatim from narration_at_to)
- Adds `intrinsic_score` placeholder.
- Bumps spec_version metadata.

Run once. Idempotent if rerun (writes from REWRITES dict regardless of current state).
"""
from __future__ import annotations
import json
from pathlib import Path

PATH = Path("playlists/rolling-stones_some-girls_miss-you.connections.json")

# Anonymized foreshadow prose per pair_id. Forward-position artist + song
# names stripped; year + scene + role + sonic move retained.
REWRITES: dict[str, dict[str, dict[str, str]]] = {
    "conn_001_to_002_groove_dna": {
        "voice_zh": "等会儿到 1971 年的下一站，这条锁死的底部会被一个人独吞进去——整支乐队的密度收进一个人的脑子。",
        "voice_en": "A few years on, in 1971, this locked groove gets internalized by one person alone — a whole band's density compressed into one head.",
    },
    "conn_001_to_003_groove_dna": {
        "voice_zh": "等会儿到 1975 年那次最有名的'白人摇滚向放克借外套'的实验，这条放克根脉直接被吸进了 Sigma Sound——艺人本人管它叫'塑料灵魂'。",
        "voice_en": "By 1975, in the most-cited white-rock-borrows-funk experiment, this funk root gets pulled straight into Sigma Sound — the artist himself called it 'plastic soul'.",
    },
    "conn_001_to_004_personnel_bridge_bass": {
        "voice_zh": "等会儿到 1975 年那张飞船一样的 P-Funk 专辑，Bootsy Collins 就是从这里把贝斯课带走的——整个宇宙都建在那一课上。",
        "voice_en": "By 1975, on the spaceship-shaped P-Funk record, Bootsy Collins carries this bass lesson out the door — a whole universe built on it.",
    },
    "conn_001_to_006_groove_dna": {
        "voice_zh": "这条'贝斯和鼓是主体'的逻辑后面会经过 Billy Preston 的手，进到 1978 年那间纽约的录音棚——那是这一集的落点。",
        "voice_en": "This philosophy — bass and drums as the body — eventually moves through Billy Preston's hands into a 1978 New York session that anchors this episode.",
    },
    "conn_001_to_009_groove_dna": {
        "voice_zh": "等会儿到 1979 年那条最被引用的迪斯科贝斯，这种锁死会被做得更冷、更精细——同一套放克基因，换了一个棚。",
        "voice_en": "Ahead in 1979, on the most-sampled disco bassline ever, this lock gets colder and more refined — same funk DNA, a different room.",
    },
    "conn_002_to_006_personnel_bridge_bass": {
        "voice_zh": "Billy Preston 就是从 Sly 这边拉过来的那条线——这一集的落点会用到他。",
        "voice_en": "Billy Preston is the human thread pulled out of Sly's world — and this episode's anchor will lean on him.",
    },
    "conn_002_to_007_groove_dna": {
        "voice_zh": "等会儿到 1978 年同年那条 CBGB 出来的迪斯科翻译，鼓机驱动贝斯脉冲这件事会被一台 CR-78 再演一遍。",
        "voice_en": "Ahead the same 1978, on a disco translation that comes out of CBGB, this drum-machine-drives-bass move gets replayed — by a CR-78.",
    },
    "conn_002_to_011_groove_dna": {
        "voice_zh": "等会儿到 1980 年那张 Eno 监制的纽约新浪潮专辑，鼓循环叠贝斯这件事会被做成一整套方法论。",
        "voice_en": "By 1980, on an Eno-produced New York new-wave record, the drum-loop-then-bass move becomes an entire methodology.",
    },
    "conn_002_to_013_groove_dna": {
        "voice_zh": "等会儿到 1984 年那条最有名的'一个人包办所有乐器'的紫色血脉，这种独占式的声部统治会被推到极端——他直接把贝斯删了。",
        "voice_en": "By 1984, on the most-cited one-person-plays-everything purple lineage, this solitary kind of authorship gets pushed to the limit — he simply deletes the bass.",
    },
    "conn_003_to_005_groove_dna": {
        "voice_zh": "等会儿到 1977 年那张定义舞厅的 Saturday Night Fever 时刻，同样的挪用逻辑——白人流行包着黑人舞曲的贝斯骨架。",
        "voice_en": "Ahead in 1977, on the Saturday Night Fever moment that defined the dance floor, the same borrowing — white pop wrapped around a Black dance bass skeleton.",
    },
    "conn_003_to_006_groove_dna": {
        "voice_zh": "等会儿到 1978 年那间纽约录音棚——这一集的落点——同一套'白人摇滚翻译黑人贝斯'的脚印会被照着再走一遍。",
        "voice_en": "By 1978, in a New York session that lands this episode, the same white-rock-translates-Black-bass footprint gets walked again.",
    },
    "conn_003_to_007_groove_dna": {
        "voice_zh": "等会儿到 1978 年同年那条 CBGB 出来的迪斯科翻译，朋克场景会做同一件翻译——出发点不同。",
        "voice_en": "Ahead the same 1978, on a CBGB-side disco translation, the punk scene does the same kind of translation — from a different vantage.",
    },
    "conn_003_to_013_groove_dna": {
        "voice_zh": "等会儿到 1984 年那张紫色专辑，艺人全权决定声音这件事会走到最极端——贝斯直接消失。",
        "voice_en": "By 1984, on the purple record, sole-artistic-authority over sound goes to its extreme — the bass simply vanishes.",
    },
    "conn_004_to_012_groove_dna": {
        "voice_zh": "等会儿到 1980 年那条最公开的'摇滚乐队照搬迪斯科贝斯'的英伦例子，那条 riff 的重量感有一部分来自现在这条 P-Funk 遗产。",
        "voice_en": "By 1980, on the most public British example of a rock band copying a disco bassline, the weight of that riff partly comes from this P-Funk inheritance.",
    },
    "conn_004_to_014_bassline_prototype": {
        "voice_zh": "等会儿到 1991 年那条把放克 slap 推进 alt-rock 的洛杉矶贝斯，Bootsy 这条线会直接传下去——Flea 自己承认。",
        "voice_en": "Ahead in 1991, on a Los Angeles bass that pushed funk slap into alt-rock, this Bootsy lineage passes straight through — the player admits it.",
    },
    "conn_004_to_015_groove_dna": {
        "voice_zh": "等会儿到 2013 年那次 nu-disco 复活，他们要复活的那条低频基础设施就是从现在这一段采样出来的。",
        "voice_en": "By 2013, in the nu-disco revival, the low-end infrastructure they bring back gets sampled straight from this passage.",
    },
    "conn_004_to_017_groove_dna": {
        "voice_zh": "等会儿到 2018 年那个德克萨斯三人乐队的录音里，贝斯作锚点这件事会被做成录音时的优先级。",
        "voice_en": "By 2018, in a Texas three-piece's recording, bass-as-anchor becomes a recording-order priority.",
    },
    "conn_005_to_006_groove_dna": {
        "voice_zh": "这套四四拍贝斯前置逻辑，就是 1978 年那次最公开的摇滚翻译——这一集的落点——要借的那件外套。",
        "voice_en": "This four-on-the-floor bass-forward logic is the very jacket that 1978's most public rock translation — this episode's anchor — borrows.",
    },
    "conn_005_to_009_bassline_prototype": {
        "voice_zh": "等会儿到 1979 年那条最被引用的迪斯科贝斯，把贝斯顶到第一线这件事会被精炼到顶点——更冷、更克制。",
        "voice_en": "Ahead in 1979, on the most-sampled disco bassline ever, putting bass front-line gets refined to its peak — colder, more restrained.",
    },
    "conn_005_to_016_bassline_prototype": {
        "voice_zh": "等会儿到 2015 年那张澳洲卧室迷幻流行专辑，作者亲口说，那首歌就是从听 1977 年这首开始的。",
        "voice_en": "By 2015, on an Australian bedroom-pop psych record, the maker says it started from listening to this 1977 cut.",
    },
    "conn_005_to_018_groove_dna": {
        "voice_zh": "等会儿到 2024 年那个新泽西卧室独立乐手，这种贝斯驱动的舞曲流行感会在卧室里找到最新的形状。",
        "voice_en": "By 2024, with a New Jersey bedroom indie act, this bass-driven dance-pop feel finds its newest shape — recorded at home.",
    },
    "conn_006_to_007_groove_dna": {
        "voice_zh": "同年在 CBGB 那边，另一支乐队做了完全一样的翻译——两支乐队，同一个动作，1978。",
        "voice_en": "The same year, on the CBGB side, another band performs the exact same translation — two bands, one move, 1978.",
    },
    "conn_006_to_009_groove_dna": {
        "voice_zh": "等会儿到 1979 年那条最被引用的迪斯科贝斯——迪斯科贝斯在黑人场域被做到了精炼顶点，那是 Miss You 试图近似的东西。",
        "voice_en": "Ahead in 1979, on the most-sampled disco bassline ever, that bass gets refined to its peak in the Black-music sphere — that's what Miss You is approximating.",
    },
    "conn_006_to_012_groove_dna": {
        "voice_zh": "等会儿——两年后那条最公开的'摇滚乐队照搬迪斯科贝斯'的英伦例子，会把同一个模板放进体育场摇滚。",
        "voice_en": "Soon — two years later, the most public British example of a rock band copying a disco bassline drops the same template into stadium rock.",
    },
    "conn_007_to_010_groove_dna": {
        "voice_zh": "等会儿到 1980 年那张曼彻斯特后朋克最冷的专辑，贝斯会做出相反的选择——往上走，但往冷的方向。",
        "voice_en": "By 1980, on the coldest of Manchester's post-punk records, the bass makes the opposite choice — up the register, but toward cold.",
    },
    "conn_007_to_011_groove_dna": {
        "voice_zh": "等会儿到 1980 年那张 Eno 监制的纽约新浪潮专辑，机器/循环鼓先行的建歌逻辑会被做成整张专辑的方法论。",
        "voice_en": "By 1980, on an Eno-produced New York new-wave record, the machine-and-loop-first-then-bass build-order becomes an album-wide method.",
    },
    "conn_009_to_012_bassline_prototype": {
        "voice_zh": "等会儿——次年那条最公开的'摇滚乐队照搬迪斯科贝斯'的英伦例子，作者本人坐在 Edwards 旁边亲耳听完了这段，回去写出了那条 riff。",
        "voice_en": "Soon — by the following year, the most public British example of a rock band copying a disco bassline: the writer sat next to Edwards, listened, then wrote that riff.",
    },
    "conn_009_to_015_personnel_bridge_bass": {
        "voice_zh": "Nile Rodgers 这把琴 34 年后还会再用一次——同一个吉他手，同一把 Stratocaster。",
        "voice_en": "Thirty-four years later this same guitar comes back — same player, same Stratocaster.",
    },
    "conn_010_to_011_groove_dna": {
        "voice_zh": "同一年的另一支乐队会把贝斯放进一套完全不同的多节奏层——Afrobeat 的逻辑。",
        "voice_en": "Another band the same year places bass inside a completely different polyrhythmic stack — Afrobeat logic.",
    },
    "conn_010_to_016_bassline_prototype": {
        "voice_zh": "高音区旋律贝斯这件事，35 年后会被一个澳洲卧室流行的独立乐手用迷幻的方式重新演一遍。",
        "voice_en": "Thirty-five years later, an Australian bedroom-pop solo act reprises high-register melodic bass through a psychedelic lens.",
    },
    "conn_011_to_015_groove_dna": {
        "voice_zh": "等会儿到 2013 年那次 nu-disco 复活，先建节奏骨架、再叠旋律这件事会在数字时代复活——方法一脉相承。",
        "voice_en": "Ahead in 2013, in the nu-disco revival, build-the-rhythm-skeleton-first-then-add-melody comes back in the digital era — same method, different decade.",
    },
    "conn_011_to_017_groove_dna": {
        "voice_zh": "等会儿到 2018 年那个德克萨斯三人乐队的录音里，干净的旋律短句贝斯会接同一种灵魂——同样的克制。",
        "voice_en": "By 2018, in a Texas three-piece's recording, the clean melodic-phrase bass picks up the same spirit — the same restraint.",
    },
    "conn_012_to_014_groove_dna": {
        "voice_zh": "等会儿到 1991 年那条把放克 slap 推进 alt-rock 的洛杉矶贝斯，贝斯主导歌曲骨架这件事会被重新烧一遍——这次是用 slap。",
        "voice_en": "Ahead in 1991, on a Los Angeles bass that pushed funk slap into alt-rock, the bass-leads-the-skeleton stance gets re-fired — this time with slap.",
    },
    "conn_012_to_017_groove_dna": {
        "voice_zh": "等会儿到 2018 年那个德克萨斯三人乐队的录音里，贝斯作结构主轴这件事会跨越 38 年——同一种优先级。",
        "voice_en": "By 2018, in a Texas three-piece's recording, bass-as-structural-axis crosses thirty-eight years — same priority.",
    },
    "conn_013_to_014_groove_dna": {
        "voice_zh": "等会儿到 1991 年那条把放克 slap 推进 alt-rock 的洛杉矶贝斯，Flea 会从同一个 Bootsy 教材出发，但把贝斯做到最响。",
        "voice_en": "Ahead in 1991, on a Los Angeles bass that pushed funk slap into alt-rock, Flea works from the same Bootsy textbook — but pushes the bass to maximum loudness.",
    },
    "conn_013_to_016_groove_dna": {
        "voice_zh": "等会儿到 2015 年那张澳洲卧室迷幻流行专辑，作者会一个人在家录所有声部——走的是这条紫色一人制作线。",
        "voice_en": "By 2015, on an Australian bedroom-pop psych record, the maker plays every part himself at home — walking the same one-person purple lineage.",
    },
    "conn_013_to_018_groove_dna": {
        "voice_zh": "等会儿到 2024 年那个新泽西卧室独立乐手，一人制作、自己编贝斯这件事到了 2024 年还在——评论界直接把他和这条紫色血脉并排放。",
        "voice_en": "By 2024, with a New Jersey bedroom indie act, one-person production with self-programmed bass is still alive — critics line him up next to this purple lineage.",
    },
    "conn_014_to_018_groove_dna": {
        "voice_zh": "等会儿到 2024 年那个新泽西卧室独立乐手，贝斯锁死鼓脉冲的逻辑会进卧室——用编程代替演奏。",
        "voice_en": "By 2024, with a New Jersey bedroom indie act, the bass-locked-to-drum-pulse logic moves into the bedroom — programming replaces playing.",
    },
    "conn_015_to_016_groove_dna": {
        "voice_zh": "等会儿到 2015 年那张澳洲卧室迷幻流行专辑，这股 nu-disco 低频会在迷幻里重新烧——同期录的那张唱片把它点亮了。",
        "voice_en": "By 2015, on an Australian bedroom-pop psych record, this nu-disco low end re-ignites inside psychedelia — a record cut in the same window lights it up.",
    },
    "conn_015_to_017_gear_lineage_bass": {
        "voice_zh": "等会儿到 2018 年那个德克萨斯三人乐队的录音里，模拟温暖的贝斯质感是同一种基因——德克萨斯谷仓里养出来的。",
        "voice_en": "By 2018, in a Texas three-piece's recording, the analog-warm bass texture is the same DNA — raised inside a Texas barn studio.",
    },
    "conn_016_to_018_groove_dna": {
        "voice_zh": "等会儿到 2024 年那个新泽西卧室独立乐手，卧室里一个人编贝斯这件事到 2024 年还没停——同一种极简的制作惯性。",
        "voice_en": "By 2024, with a New Jersey bedroom indie act, one-person bedroom bass programming hasn't stopped — the same minimal production inertia.",
    },
}


def migrate_pair(p: dict) -> dict:
    pair_id = p["id"]
    new_at_from = REWRITES.get(pair_id)
    if new_at_from is None:
        raise SystemExit(f"missing rewrite for {pair_id}")

    out = {
        "id": pair_id,
        "from_position": p["from_position"],
        "to_position": p["to_position"],
        "kind": p["kind"],
        "evidence_basis": p.get("evidence_basis"),
        "backed_by_edge_id": p.get("backed_by_edge_id"),
        "system_sensory_note": p.get("system_sensory_note"),
        "narration_modes": {
            "foreshadow_anonymous_at_from": {
                "voice_zh": new_at_from["voice_zh"],
                "voice_en": new_at_from["voice_en"],
            },
            "foreshadow_named_at_from": None,
            "callback_named_at_to": {
                "voice_zh": p["narration_at_to"]["voice_zh"],
                "voice_en": p["narration_at_to"]["voice_en"],
            },
        },
        "intrinsic_score": {
            "value": None,
            "dimensions": {
                "story_drive": None,
                "concrete_carrier": None,
                "evidential_strength": None,
                "focus_relevance": None,
            },
            "rationale": None,
        },
        "user_overrides": p.get("user_overrides", []),
    }
    return out


def main() -> None:
    data = json.loads(PATH.read_text())
    pairs = data["connection_pairs"]
    if len(pairs) != len(REWRITES):
        raise SystemExit(
            f"pair count mismatch: file has {len(pairs)}, REWRITES has {len(REWRITES)}"
        )
    data["connection_pairs"] = [migrate_pair(p) for p in pairs]
    data["spec_version"] = "0.4"

    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"OK: migrated {len(pairs)} pairs to v0.4 schema")


if __name__ == "__main__":
    main()
