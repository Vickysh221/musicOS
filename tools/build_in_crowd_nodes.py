"""
Build the 20 nodes for the Ramsey Lewis Trio — The 'In' Crowd map.
Episode 6, focus: translation_aesthetic (A+B axes — cover topology + UK Mod reception).

Run: python3 tools/build_in_crowd_nodes.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from node_registry import put_node, node_exists, update_coverage_for_node
from coverage import load_tracks

NODES = [
    # ============================================================
    # ANCHOR
    # ============================================================
    {
        "id": "ramsey-lewis-trio_the-in-crowd_the-in-crowd",
        "artist": "Ramsey Lewis Trio",
        "period": {
            "label": "Argo crossover era — Bohemian Caverns live (1965)",
            "year_start": 1965,
            "year_end": 1966,
        },
        "works": [
            {"title": "The 'In' Crowd", "type": "track", "year": 1965},
            {"title": "The In Crowd", "type": "album", "year": 1965},
            {"title": "The In Crowd - The Ultimate Mod Collection from the Original Style Movement 1958 - 1967", "type": "album", "year": 2008},
        ],
        "position_in_era": {
            "primary_genre_lineage": "soul-jazz × piano-trio crossover × cover-as-authorship",
            "geographic_locus": "Chicago (band base, Argo/Chess label) → Washington D.C. (Bohemian Caverns recording venue)",
            "historical_role": (
                "Three-night live recording (May 13–15, 1965) at Bohemian Caverns, Washington D.C., that crystallized the soul-jazz piano-trio cover-as-authorship method. "
                "Lewis takes Dobie Gray's Top-40 R&B single from late 1964 — heard the morning of the session in a DC coffee shop after a waitress (Nettie) suggested it — and renders it as an instrumental groove, "
                "with audience hand-claps and shouted encouragement built into the rhythm rather than mixed under it. The title cut became a #5 Hot 100 / #2 R&B single; the album hit #2 on Billboard's Top 200 LPs; "
                "the trio won the 1966 Grammy for Best Instrumental Jazz Performance by an Individual or Group, and the single was inducted into the Grammy Hall of Fame in 2009. "
                "The album is structurally a covers set: Dobie Gray (1964), Buddy Johnson ('Since I Fell for You'), Pee Wee King/Redd Stewart ('Tennessee Waltz'), Gale Garnett/Ray Rivers, Alex North ('Spartacus' love theme), "
                "Antônio Carlos Jobim & Vinicius de Moraes ('Felicidade'), Duke Ellington ('Come Sunday'). Lewis's phrasing — Lewis's own words from his memoir: looking for 'a song — not a jazz song — that we thought jazz people could play that could reach out to a wide audience' — became the template for the entire soul-jazz crossover wave of 1965–69."
            ),
        },
        "narrative_slots": {
            "production_facts": (
                "Recorded live at Bohemian Caverns, Washington D.C., on May 13–15, 1965. Released July 1965 on Argo Records, LP-757 (Chess Records' jazz subsidiary; renamed Cadet later in 1965/66). "
                "Producer: Esmond Edwards (Argo / Cadet house producer). The 'audience as instrument' approach was intentional — claps, whistles, and the room ambience are mixed forward in the final master rather than treated as background; "
                "Lewis told WBGO they wanted to reach a wide audience 'with the music: melody, rhythm, harmony' rather than gimmicks. The waitress-suggestion origin story (Nettie at a DC coffee shop near Howard Theatre) appears in both Lewis's memoir and Redd Holt's recollection."
            ),
            "member_dynamics": (
                "Ramsey Lewis (piano), Eldee Young (acoustic bass and cello — the cello featured on certain album tracks), Redd Holt (drums). "
                "This 1956-formed working trio had its 1956–65 run culminate in this record; within 12 months Young and Holt would leave to form Young-Holt Unlimited (1968 hit 'Soulful Strut') and Lewis would recruit Cleveland Eaton (bass) plus a young Chicago session drummer named Maurice White — who later mentored under Lewis for three years before founding Earth, Wind & Fire (1970). "
                "Lewis would co-produce Maurice White's 'Sun Goddess' (1974) when White returned the favour. The Bohemian Caverns recording captures the final months of the original trio."
            ),
            "cultural_venue": (
                "Bohemian Caverns, an underground jazz club at 11th & U Streets NW, Washington D.C. — sat at the centre of DC's Black middle-class entertainment district (the Howard Theatre, the U Street corridor) "
                "and was a 1960s circuit stop for Black jazz acts working between New York and Chicago. The cover photo shows Lewis and the trio on the venue's small stage with the crowd visible at table-level. "
                "The room's tight reverb and close audience are inseparable from the record's sound."
            ),
            "instrumentation_details": (
                "Piano trio in its purest form: grand piano, upright bass (Young doubling on cello for select cuts), traditional jazz drum kit. "
                "Lewis's right hand carries the melody mostly in single-note lines and octave doublings; his left hand voices block-chord stabs in the lower middle register, syncopated against the snare backbeat. "
                "The signature texture is the contrast between Lewis's restrained piano dynamics and the foregrounded crowd handclaps — a stripped, almost gospel-tempo backbeat that doesn't try to swing in the bebop sense. "
                "On 'The In Crowd' specifically, Lewis builds the head on a vamping left-hand 4-bar figure, lets the audience lock to it via claps, then opens the right hand into a blues-rooted solo over the same loop — the form is closer to a soul groove than a jazz chorus structure."
            ),
            "release_circumstances": (
                "Released July 1965 on Argo (Chess subsidiary) as LP-757. The 'In' Crowd single was the breakout: #5 Hot 100, #2 R&B, eventually inducted into the Grammy Hall of Fame (2009). "
                "The album reached #2 on Billboard's Top LPs and earned the trio the 1966 Grammy for Best Instrumental Jazz Performance by Individual or Group. "
                "The user's red-heart hit is the 2008 UK 'Ultimate Mod Collection' compilation — physical evidence that the record's secondary life passed through the UK Mod / Northern Soul / early-acid-jazz dancefloor canon decades after release."
            ),
        },
        "tags": ["translation_aesthetic", "anchor", "soul_jazz", "piano_trio_crossover", "audience_as_instrument", "cover_as_authorship", "uk_mod_reception", "argo_chess", "1965"],
        "red_heart_tier": "hit",
        "red_heart_evidence": [
            "红心: Ramsey Lewis Trio — The In Crowd (via 'The In Crowd - The Ultimate Mod Collection 1958–1967' UK compilation — the user's track-level hit on the anchor song, contextualized as Mod-era canon)",
        ],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/The_In_Crowd_(Ramsey_Lewis_album)  [T2-3 — recording dates/venue, personnel, tracklist, chart, Grammy]",
            "https://www.wbgo.org/music/2023-05-08/book-excerpt-ramsey-lewis-on-the-genesis-of-his-smash-hit-the-in-crowd  [T1-2 — Lewis's own memoir on the song's discovery and recording philosophy]",
            "https://www.npr.org/2015/05/13/406453504/the-in-crowd-an-audience-fueled-jazz-pop-crossover-hit  [T2 — audience-as-instrument framing]",
            "https://www.udiscovermusic.com/stories/the-ramsey-lewis-trio-the-in-crowd-feature/  [T2 — backstory feature]",
            "https://www.discogs.com/master/56896-The-Ramsey-Lewis-Trio-The-In-Crowd  [T4 — discography]",
            "data/user_tracks.json  [user red-heart hit via UK Mod compilation]",
        ],
        "is_anchor": True,
    },

    # ============================================================
    # AXIS A — COVER TOPOLOGY: upstream sources + same-song translations
    # ============================================================
    {
        "id": "dobie-gray_dobie-gray-sings_the-in-crowd",
        "artist": "Dobie Gray",
        "period": {"label": "Pre-Drift Away R&B career", "year_start": 1964, "year_end": 1965},
        "works": [
            {"title": "The 'In' Crowd", "type": "track", "year": 1964},
            {"title": "Dobie Gray Sings for 'In' Crowders That 'Go Go' Around", "type": "album", "year": 1965},
        ],
        "position_in_era": {
            "primary_genre_lineage": "early-60s R&B / soul vocal pop",
            "geographic_locus": "Los Angeles — Charger Records (Liberty subsidiary)",
            "historical_role": (
                "The original recording of 'The In Crowd', the song Lewis would translate into instrumental soul-jazz six months later. "
                "Written by Billy Page, arranged by his brother Gene Page (later a major Motown / Barry White arranger), released as a Charger single in late 1964. "
                "Charted Billboard Hot 100 #13 (peak week Feb 27 1965, 12 weeks on chart), R&B #11, UK #25, Canada #8. "
                "The lyric — an in-group manifesto for the cool kids — was the cultural hook; Lewis stripped the words and kept the gesture."
            ),
        },
        "narrative_slots": {
            "production_facts": "Recorded late 1964, released as Charger Records single. Producer/label connection through the Page brothers (Billy wrote; Gene arranged). Album 'Dobie Gray Sings for \"In\" Crowders That \"Go Go\" Around' followed in 1965.",
            "member_dynamics": "Dobie Gray (b. Lawrence Darrow Brown, 1940 Texas) was an itinerant R&B vocalist working LA sessions before this break. He would not match the chart success until 'Drift Away' (1973).",
            "cultural_venue": "Los Angeles R&B / pop production circuit; Charger Records distributed via Liberty.",
            "instrumentation_details": "Standard mid-60s LA R&B band: drums, electric bass, piano, horn section, female backing vocals; Gray's tenor lead on the verses and the punchy 'I'm in / with the in-crowd' hook chorus.",
            "release_circumstances": "Late-1964 single peaking early 1965. The song's life beyond Gray begins almost immediately: Lewis records it May 1965; Mamas & Papas record it for their February 1966 debut. Few songs travel three distinct genre dialects within 14 months.",
        },
        "tags": ["translation_aesthetic", "cover_source", "upstream_of_anchor", "rnb", "1964"],
        "red_heart_tier": "blind_spot",
        "red_heart_evidence": [],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/The_In_Crowd_(song)  [T2-3 — writer, charts, original]",
            "https://www.discogs.com/release/2856984-Dobie-Gray-The-In-Crowd  [T4 — single discography]",
            "http://www.soulwalking.co.uk/Dobie%20Gray.html  [T3 — UK soul reference]",
        ],
    },

    {
        "id": "mamas-and-the-papas_if-you-can-believe-your-eyes-and-ears_the-in-crowd",
        "artist": "The Mamas & the Papas",
        "period": {"label": "Dunhill debut", "year_start": 1966, "year_end": 1966},
        "works": [
            {"title": "The 'In' Crowd", "type": "track", "year": 1966},
            {"title": "If You Can Believe Your Eyes and Ears", "type": "album", "year": 1966},
        ],
        "position_in_era": {
            "primary_genre_lineage": "Laurel Canyon folk-rock vocal harmony",
            "geographic_locus": "Los Angeles (Dunhill Records, Lou Adler production)",
            "historical_role": (
                "Third cover of 'The In Crowd' within 14 months: Cass Elliot leads on a folk-rock vocal harmony arrangement that closes the group's debut album (released February 28, 1966 on Dunhill). "
                "The same song now exists in three dialects within a 14-month window — Dobie Gray (R&B vocal, late 1964), Ramsey Lewis Trio (soul-jazz instrumental, July 1965), Mamas & Papas (folk-rock vocal, February 1966). "
                "Functions as the third panel in the episode's opening triptych: same song, three genres, audibly separable lineages."
            ),
        },
        "narrative_slots": {
            "production_facts": "Produced by Lou Adler; recorded late 1965 at Western Recorders, Hollywood. Closes the debut album.",
            "member_dynamics": "Cass Elliot lead vocal — her voice provides the bridge between the R&B original and the Laurel Canyon vocal-harmony surface; the rest of the group provides the close-harmony bed.",
            "cultural_venue": "Laurel Canyon / Dunhill Records LA pop scene of 1965–66.",
            "instrumentation_details": "Folk-rock band textures: acoustic and electric guitars, drums, electric bass, the four-voice vocal harmony stack. The arrangement keeps Billy Page's melodic skeleton intact and translates the R&B punch into a more flowing folk-rock pulse.",
            "release_circumstances": "Album debut #1 Billboard 200 in May 1966; the single 'California Dreamin' did the commercial work, with 'The In Crowd' cover sitting as the album closer.",
        },
        "tags": ["translation_aesthetic", "cover_translation", "same_song_lateral", "folk_rock", "1966"],
        "red_heart_tier": "blind_spot",
        "red_heart_evidence": [],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/If_You_Can_Believe_Your_Eyes_and_Ears  [T2-3 — album, tracklist]",
            "https://halfhearteddude.com/2009/05/great-covers-the-mamas-and-the-papas-if-you-can-believe-your-eyes-and-ears/  [T3-4 — covers-focused commentary]",
        ],
    },

    {
        "id": "ahmad-jamal_at-the-pershing_poinciana",
        "artist": "Ahmad Jamal",
        "period": {"label": "Pershing residency", "year_start": 1958, "year_end": 1959},
        "works": [
            {"title": "Poinciana", "type": "track", "year": 1958},
            {"title": "At the Pershing: But Not for Me", "type": "album", "year": 1958},
        ],
        "position_in_era": {
            "primary_genre_lineage": "modern piano-trio jazz with space-and-dynamics aesthetic",
            "geographic_locus": "Chicago — Pershing Hotel lounge, residency 1956–59",
            "historical_role": (
                "The defining methodological precursor to Lewis. Jamal's trio (Israel Crosby bass, Vernell Fournier drums) refined a piano-trio language built on space, sustained vamps, and groove-locked left-hand patterns rather than virtuosic improvisation. "
                "'At the Pershing: But Not for Me' (recorded January 16, 1958 at the Pershing Hotel) remained on the Billboard top-selling LP chart for ~100 weeks — proof that a jazz piano trio could become mainstream pop in 1958. "
                "Ramsey Lewis explicitly cited Jamal as a primary influence: Jamal 'uses a whole 88 keys on the piano… one of the both-hands piano players'. Lewis's Chicago, Lewis's piano trio, Lewis's live-room crossover all descend directly from this template."
            ),
        },
        "narrative_slots": {
            "production_facts": "Recorded live January 16, 1958, at the Pershing Hotel lounge (Chicago) by engineer Malcolm Chisholm; producer Argo Records. The Pershing was a Black-owned hotel-bar where Jamal had a multi-year residency.",
            "member_dynamics": "Ahmad Jamal (piano), Israel Crosby (bass — Chicago jazz veteran), Vernell Fournier (drums — New Orleans-via-Chicago, brought the second-line shuffle that defines Jamal's groove). The trio's interlocked telepathy from years of nightly playing is the hidden weapon.",
            "cultural_venue": "Pershing Hotel, 6400 S. Cottage Grove, Chicago — center of Black South Side jazz nightlife in the 1950s. Same city, same Argo/Chess label home as Lewis seven years later.",
            "instrumentation_details": "'Poinciana' built on Fournier's military-shuffle snare pattern and Crosby's two-note descending bass figure — a 16-bar vamp that loops the entire piece. Jamal floats melodic fragments over the top, leaves large rests, and lets the room's natural decay carry the harmonic implication. This is the template Lewis would echo with audience claps instead of shuffle snare.",
            "release_circumstances": "Argo LP-628, released 1958. Ran nearly two years on Billboard's top LP chart; established Argo Records as a jazz pop crossover label and provided the model that Lewis would build on at the same label with 'The In Crowd' in 1965.",
        },
        "tags": ["translation_aesthetic", "methodological_precursor", "piano_trio", "chicago_argo", "1958"],
        "red_heart_tier": "touched",
        "red_heart_evidence": ["红心 (同艺人): Ahmad Jamal — Saturday Morning (later album, same artist) — confirms user has Jamal in the library context"],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/At_the_Pershing:_But_Not_for_Me  [T2-3 — recording details]",
            "https://magazine.waxpoetics.com/article/an-interview-with-ahmad-jamal/  [T2 — Jamal interview]",
            "https://ahmadjamal.com/history  [T1 — artist official site]",
            "https://chicago.suntimes.com/obituaries/2023/4/16/23685773/  [T2 — Sun-Times obit citing Lewis on Jamal]",
        ],
    },

    {
        "id": "erroll-garner_concert-by-the-sea_misty",
        "artist": "Erroll Garner",
        "period": {"label": "Concert by the Sea era", "year_start": 1954, "year_end": 1956},
        "works": [
            {"title": "Misty", "type": "track", "year": 1954},
            {"title": "Concert by the Sea", "type": "album", "year": 1955},
        ],
        "position_in_era": {
            "primary_genre_lineage": "swing-era jazz piano → pop standard composition",
            "geographic_locus": "Sunset School auditorium, Carmel-by-the-Sea, California (Sept 1955 live recording)",
            "historical_role": (
                "Concert by the Sea (Columbia, 1955) — Garner trio live in Carmel — was a million-selling jazz LP at a time when that was nearly impossible, and one of the earliest models for the live-recording-as-pop-event format that 'The In Crowd' later perfected. "
                "Garner's composition 'Misty' (1954, dictated to George Shearing because Garner couldn't read music) became a pop standard via Johnny Mathis's 1959 vocal. "
                "Garner's combination of solo-piano-as-pop, behind-the-beat right hand and steady left-hand 4/4 chord stride is the swing-era template for what Jamal then refined and Lewis then translated for the soul-jazz crowd."
            ),
        },
        "narrative_slots": {
            "production_facts": "Live recording at Sunset School auditorium, Carmel CA, September 19, 1955; produced for Columbia by Martha Glaser (Garner's manager-producer). Album sold over 1 million copies — almost unheard of for solo jazz.",
            "member_dynamics": "Erroll Garner (piano), Eddie Calhoun (bass), Denzil Best (drums). Garner famously could not read music — composed 'Misty' in his head and dictated it.",
            "cultural_venue": "Carmel-by-the-Sea is one of the early cases of a jazz live-recording venue chosen for ambience as much as audience.",
            "instrumentation_details": "Garner's signature is the 'orchestral piano' approach — left hand maintains a steady 4/4 chord-comp (like a rhythm guitar in a swing big band), right hand plays melody behind the beat with rolling tremolos and grace-note flourishes. The technique foreshadows Lewis's right-hand restraint plus left-hand vamping.",
            "release_circumstances": "Concert by the Sea released February 1956 on Columbia. Remained a perennial seller; treated by the industry as the proof-point that a jazz piano LP could compete with vocal pop on commercial terms.",
        },
        "tags": ["translation_aesthetic", "methodological_precursor", "live_recording_as_pop", "solo_piano_crossover", "1955"],
        "red_heart_tier": "blind_spot",
        "red_heart_evidence": [],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/Concert_by_the_Sea  [T2-3]",
            "https://en.wikipedia.org/wiki/Misty_(song)  [T2-3]",
        ],
    },

    {
        "id": "vince-guaraldi_jazz-impressions-of-black-orpheus_cast-your-fate-to-the-wind",
        "artist": "Vince Guaraldi Trio",
        "period": {"label": "Pre-Peanuts crossover", "year_start": 1962, "year_end": 1963},
        "works": [
            {"title": "Cast Your Fate to the Wind", "type": "track", "year": 1962},
            {"title": "Jazz Impressions of Black Orpheus", "type": "album", "year": 1962},
        ],
        "position_in_era": {
            "primary_genre_lineage": "West Coast piano-trio jazz with bossa nova influence",
            "geographic_locus": "San Francisco — Fantasy Records",
            "historical_role": (
                "The immediate three-year precedent for 'The In Crowd' — a piano-trio instrumental that crossed onto pop radio (#22 Hot 100, #9 Easy Listening) and won the 1963 Grammy for Best Original Jazz Composition. "
                "Released as the B-side of 'Samba de Orpheus' (April 1962, Fantasy Records); US DJs flipped the single to the catchier 'Cast Your Fate' side. "
                "Guaraldi's piano language is melodically simpler than bebop, harmonically open enough to feel pop, with a propulsive but unobtrusive trio groove — the exact mix Lewis would scale up at Bohemian Caverns three years later."
            ),
        },
        "narrative_slots": {
            "production_facts": "Recorded February 1962 at Fantasy Records' San Francisco studio; producer Max Weiss. Released April 18, 1962 on Fantasy LP-3337 (originally titled 'Jazz Impressions of Black Orpheus'). 'Cast Your Fate' originally the B-side, surfaced by radio play.",
            "member_dynamics": "Vince Guaraldi (piano), Monty Budwig (bass), Colin Bailey (drums). Guaraldi was about to be commissioned for the Peanuts TV specials (1965 onward) — the soul-jazz crossover sensibility carried directly into that work.",
            "cultural_venue": "San Francisco's Fantasy Records ecosystem — independent jazz label that also released Dave Brubeck's early West Coast LPs.",
            "instrumentation_details": "Open piano voicings with bossa-influenced rhythmic floor; the piece is essentially a 16-bar AABA tune in F minor that loops to vamp Guaraldi's right-hand improvisation. The trio interlock is tighter than Garner, more melodic than Jamal.",
            "release_circumstances": "Fantasy LP-3337, April 1962. Grammy 1963 (Best Original Jazz Composition); #22 Hot 100. Sound Education + Sounds Orchestra later covered it to higher chart heights in 1965. Direct precedent the Argo team would have been watching when they signed Lewis to make a crossover record.",
        },
        "tags": ["translation_aesthetic", "methodological_precursor", "piano_trio_crossover", "grammy_1963", "1962"],
        "red_heart_tier": "blind_spot",
        "red_heart_evidence": [],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/Cast_Your_Fate_to_the_Wind  [T2-3 — chart, Grammy, recording]",
            "https://swingandbeyond.com/2017/04/08/cast-your-fate-to-the-wind-1962-vince-guaraldi/  [T3 — jazz musicology blog]",
        ],
    },

    {
        "id": "cannonball-adderley_mercy-mercy-mercy_mercy-mercy-mercy",
        "artist": "Cannonball Adderley Quintet",
        "period": {"label": "Capitol crossover era", "year_start": 1966, "year_end": 1967},
        "works": [
            {"title": "Mercy, Mercy, Mercy", "type": "track", "year": 1966},
            {"title": "Mercy, Mercy, Mercy! Live at 'The Club'", "type": "album", "year": 1967},
        ],
        "position_in_era": {
            "primary_genre_lineage": "soul-jazz hard-bop with audience-fueled crossover",
            "geographic_locus": "Capitol Studios, Hollywood (staged-live recording)",
            "historical_role": (
                "The lateral peer of 'The In Crowd' — same gesture, one year later, one Grammy category over. Recorded October 20, 1966 at Capitol Studios in Hollywood in front of an invited audience with an open bar, then released as 'Live at The Club' (Capitol-friendly fiction — actually a staged live recording, not at the closed Chicago club of that name). "
                "Composed by Joe Zawinul, featuring his Wurlitzer electric piano (one of the earliest prominent jazz uses). Hit #11 Billboard Hot 100; won the 1967 Grammy for Best Instrumental Jazz Performance — the same award Lewis took in 1966. "
                "Same audience-as-instrument production trick, same soul-jazz crossover demographic, same Grammy seat — direct same-era dialogue with the anchor."
            ),
        },
        "narrative_slots": {
            "production_facts": "Recorded October 20, 1966 at Capitol Studios, Hollywood. Producer: David Axelrod. The live ambience was created by inviting friends/fans into the studio with an open bar; Capitol's liner notes claimed the recording was at 'The Club' (Chicago) for narrative effect.",
            "member_dynamics": "Cannonball Adderley (alto sax), Nat Adderley (cornet), Joe Zawinul (Wurlitzer electric piano, composer), Victor Gaskin (bass), Roy McCurdy (drums). Zawinul would leave 1970 to co-found Weather Report — same fusion arc as Maurice White / EWF emerging from the Lewis trio.",
            "cultural_venue": "Hollywood-studio-as-club-room — the fictionalized live setting underlines how studied the 'live crossover' format had become by 1966.",
            "instrumentation_details": "Zawinul's Wurlitzer carries the gospel-derived 16-bar head; Cannonball's alto answers in calls; the audience claps locked to the backbeat. Same texture as Lewis's 'In Crowd' but with horn front-line instead of piano.",
            "release_circumstances": "Capitol Records, ST-2663, released early 1967. #11 Hot 100; album #2 Billboard Top 200. Grammy 1967 for Best Instrumental Jazz Performance — Lewis's exact Grammy category, one year on. Grammy Hall of Fame inducted 2021.",
        },
        "tags": ["translation_aesthetic", "same_era_dialogue", "soul_jazz", "audience_as_instrument", "1966"],
        "red_heart_tier": "blind_spot",
        "red_heart_evidence": [],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/Mercy,_Mercy,_Mercy  [T2-3]",
            "https://en.wikipedia.org/wiki/Mercy,_Mercy,_Mercy!_Live_at_%22The_Club%22  [T2-3 — album, staged-live recording disclosure]",
            "https://www.udiscovermusic.com/stories/cannonball-adderley-mercy-mercy-mercy/  [T2 — feature]",
        ],
    },

    # Lewis's own follow-ups (downstream extension of the same method)
    {
        "id": "ramsey-lewis_hang-on-ramsey_hang-on-sloopy",
        "artist": "Ramsey Lewis Trio",
        "period": {"label": "Argo follow-up", "year_start": 1965, "year_end": 1966},
        "works": [
            {"title": "Hang On Sloopy", "type": "track", "year": 1965},
            {"title": "Hang On Ramsey!", "type": "album", "year": 1965},
        ],
        "position_in_era": {
            "primary_genre_lineage": "soul-jazz piano-trio cover-as-authorship (self-extension of anchor)",
            "geographic_locus": "Chicago / Argo Records",
            "historical_role": (
                "Released months after 'The In Crowd' to capitalize on the formula. Covers the McCoys' 1965 #1 garage-rock hit (itself a translation of the song's earlier R&B incarnation by The Vibrations as 'My Girl Sloopy'). "
                "Single charted #11 Hot 100 / #6 R&B. Demonstrates that the Lewis crossover method was a method, not a single trick — and that the trio was prepared to translate rock-pop hits as fluently as R&B ones."
            ),
        },
        "narrative_slots": {
            "production_facts": "Recorded live at Bohemian Caverns same engagement series; released late 1965 on Cadet (Argo had been renamed Cadet by this point). Album 'Hang On Ramsey!' followed early 1966.",
            "member_dynamics": "Same original trio: Lewis / Young / Holt. Last major release before the trio split in mid-1966.",
            "cultural_venue": "Bohemian Caverns again — the formula required the room.",
            "instrumentation_details": "Same piano-trio + audience formula; the McCoys' garage-rock riff converted into a left-hand piano vamp.",
            "release_circumstances": "Cadet single, late 1965; Hot 100 #11, R&B #6. Grammy 1966 Best Rhythm & Blues Group Performance for 'Hold It Right There' (from the same period).",
        },
        "tags": ["translation_aesthetic", "self_extension", "soul_jazz", "piano_trio_crossover", "1965"],
        "red_heart_tier": "blind_spot",
        "red_heart_evidence": [],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/Hang_On_Ramsey!  [T3]",
            "https://en.wikipedia.org/wiki/Ramsey_Lewis  [T2-3]",
        ],
    },

    {
        "id": "ramsey-lewis_wade-in-the-water_wade-in-the-water",
        "artist": "Ramsey Lewis",
        "period": {"label": "Post-split trio, Maurice White era", "year_start": 1966, "year_end": 1969},
        "works": [
            {"title": "Wade in the Water", "type": "track", "year": 1966},
            {"title": "Wade in the Water", "type": "album", "year": 1966},
        ],
        "position_in_era": {
            "primary_genre_lineage": "soul-jazz piano with gospel-spiritual translation",
            "geographic_locus": "Chicago — Cadet Records (Argo renamed)",
            "historical_role": (
                "First album with the reconstituted trio (Cleveland Eaton bass + Maurice White drums replacing Young/Holt). Title track — a 19th-century spiritual — hit #19 Pop / #5 R&B; the album reached #2 R&B and #10 Pop. "
                "Translates the cover-as-authorship method from R&B (Gray) and pop (McCoys) into the gospel-spiritual canon. Critically: this is the record where a young Maurice White first plays on a hit, the start of a three-year apprenticeship before founding Earth, Wind & Fire."
            ),
        },
        "narrative_slots": {
            "production_facts": "Released 1966 on Cadet Records; producer Esmond Edwards. Big-band charts by Chicago arranger Richard Evans share the spotlight with the trio.",
            "member_dynamics": "First Lewis record with Cleveland Eaton (bass) and Maurice White (drums). White's tenure 1966–69 would include 'Up Pops Ramsey Lewis' (1968), 'Maiden Voyage' (1968), 'Another Voyage' (1969 — first recorded kalimba). White left mid-1970 to form Earth, Wind & Fire; co-produced Lewis's 'Sun Goddess' (1974) in return.",
            "cultural_venue": "Chicago Cadet/Chess studio ecosystem.",
            "instrumentation_details": "Lewis's gospel-blues piano with brass charts behind. The shift away from the small-room handclap aesthetic toward bigger arrangement — but the cover-as-authorship logic continues.",
            "release_circumstances": "Cadet LPS-774, 1966; #2 R&B LPs, #10 Top 200 LPs. 'Hold It Right There' from this album won the Grammy for Best R&B Group Performance.",
        },
        "tags": ["translation_aesthetic", "self_extension", "personnel_pivot_maurice_white", "soul_jazz", "gospel_translation", "1966"],
        "red_heart_tier": "blind_spot",
        "red_heart_evidence": [],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/Wade_in_the_Water_(album)  [T2-3]",
            "https://en.wikipedia.org/wiki/Maurice_White  [T2-3 — White's tenure with Lewis 1966-69, EWF founding]",
            "https://www.allmusic.com/album/wade-in-the-water-mw0000192767  [T3]",
        ],
    },

    {
        "id": "young-holt-unlimited_soulful-strut_soulful-strut",
        "artist": "Young-Holt Unlimited",
        "period": {"label": "Post-Lewis-trio breakaway", "year_start": 1966, "year_end": 1968},
        "works": [
            {"title": "Soulful Strut", "type": "track", "year": 1968},
            {"title": "Soulful Strut", "type": "album", "year": 1969},
        ],
        "position_in_era": {
            "primary_genre_lineage": "soul-jazz / R&B instrumental hit by Lewis-trio personnel diaspora",
            "geographic_locus": "Chicago — Brunswick Records",
            "historical_role": (
                "Eldee Young (bass) and Redd Holt (drums) — the rhythm section of the original Lewis trio that recorded 'The In Crowd' — left in mid-1966, formed Young-Holt Trio (with pianist Don Walker), renamed Young-Holt Unlimited in 1968 (with Ken Chaney on piano). "
                "'Soulful Strut' (Brunswick, 1968) hit #3 Hot 100 / #3 R&B and went gold. Footnote that matters for the lineage: the actual instrumental track was recorded by Brunswick's studio band as the karaoke instrumental for Barbara Acklin's vocal 'Am I the Same Girl' — Carl Davis (producer) flipped it as a Young-Holt single without them present on the recording. The Lewis-trio brand carried a #3 hit even when its members weren't in the room."
            ),
        },
        "narrative_slots": {
            "production_facts": "Recorded by Brunswick Records studio band — actual personnel Sonny Sanders / Tom Tom Washington / Floyd Morris — and credited to Young-Holt Unlimited for marketing. Producer Carl Davis. Released 1968.",
            "member_dynamics": "Eldee Young (b. 1936 Chicago, d. 2007 Bangkok) and Redd Holt (b. 1932 Chicago) — Lewis's rhythm partners 1956–66. Don Walker (piano) and Ken Chaney (piano, post-1968).",
            "cultural_venue": "Brunswick / Chicago R&B production circuit.",
            "instrumentation_details": "Piano-led R&B instrumental with horn section. The 16-bar vamp + soulful melodic figure is structurally close to 'The In Crowd' — same DNA, no longer in the original room.",
            "release_circumstances": "Brunswick single 55391, 1968; #3 Hot 100, #3 R&B, gold record January 1969 (1 million copies).",
        },
        "tags": ["translation_aesthetic", "personnel_diaspora", "soul_jazz", "lewis_trio_split", "1968"],
        "red_heart_tier": "blind_spot",
        "red_heart_evidence": [],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/Young-Holt_Unlimited  [T2-3]",
            "https://www.brunswickrecords.com/the-young-holt-unlimited  [T3 — label history]",
            "https://internetfm.com/song-of-the-day-soulful-strut-by-young-holt-unlimited/  [T4]",
        ],
    },

    {
        "id": "ramsey-lewis_sun-goddess_sun-goddess",
        "artist": "Ramsey Lewis",
        "period": {"label": "EWF-collab fusion era", "year_start": 1974, "year_end": 1974},
        "works": [
            {"title": "Sun Goddess", "type": "track", "year": 1974},
            {"title": "Sun Goddess", "type": "album", "year": 1974},
        ],
        "position_in_era": {
            "primary_genre_lineage": "jazz-funk fusion (Lewis acoustic piano + Fender Rhodes; EWF backing)",
            "geographic_locus": "Chicago — Columbia Records",
            "historical_role": (
                "Maurice White's gratitude record to his mentor. By 1974 White's Earth, Wind & Fire was a global force; he returned to Lewis with his band, co-produced the album and lent EWF as the backing group. "
                "'Sun Goddess' (the title track) became a major fusion hit — proof that the soul-jazz crossover Lewis pioneered in 1965 had matured into the 1970s fusion mainstream via the same person who started as Lewis's apprentice drummer. "
                "Late-axis-A node: the cover-as-authorship method now becomes mentor-as-coauthor."
            ),
        },
        "narrative_slots": {
            "production_facts": "Released October 1974 on Columbia Records. Co-produced by Lewis and Maurice White. Charles Stepney involvement in arrangements.",
            "member_dynamics": "Ramsey Lewis (piano, Fender Rhodes), Maurice White (drums, vocals, kalimba), Verdine White (bass), Philip Bailey (vocals, percussion), Larry Dunn (synthesizer) — essentially EWF backing Lewis.",
            "cultural_venue": "Chicago jazz/R&B continuum; Columbia Records.",
            "instrumentation_details": "Lewis acoustic piano + Fender Rhodes layered with EWF horn punctuation, kalimba breaks, Verdine White bass funk. Tempo and texture closer to mid-70s fusion than soul-jazz; cover-as-authorship method now applied at the band-as-text scale.",
            "release_circumstances": "Columbia CK 33194, October 1974. Album #1 R&B, #12 Pop, double platinum eventually. 'Sun Goddess' single #20 R&B / #44 Pop.",
        },
        "tags": ["translation_aesthetic", "mentor_apprentice_return", "fusion", "ewf_collab", "1974"],
        "red_heart_tier": "blind_spot",
        "red_heart_evidence": [],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/Sun_Goddess_(album)  [T2-3]",
            "https://somethingelsereviews.com/2016/02/05/maurice-whites-gratitude-gave-formed-mentor-ramsey-lewis-a-hit-with-sun-goddess/  [T3]",
        ],
    },

    # ============================================================
    # AXIS B — UK MOD RECEPTION → NORTHERN SOUL → ACID JAZZ
    # ============================================================
    {
        "id": "georgie-fame-blue-flames_yeh-yeh_yeh-yeh",
        "artist": "Georgie Fame and the Blue Flames",
        "period": {"label": "UK Mod organ-soul era", "year_start": 1964, "year_end": 1965},
        "works": [
            {"title": "Yeh Yeh", "type": "track", "year": 1964},
            {"title": "Yeh Yeh", "type": "album", "year": 1965},
        ],
        "position_in_era": {
            "primary_genre_lineage": "UK Mod / R&B-jazz Hammond organ vocal",
            "geographic_locus": "London — Flamingo Club, Wardour Street",
            "historical_role": (
                "Exact-year UK parallel to 'The In Crowd': Georgie Fame's cover of Mongo Santamaria's 'Yeh Yeh' (with Jon Hendricks's lyric) hit UK #1 for two weeks in January 1965, displacing the Beatles. "
                "Same gesture — Black American jazz material rendered through a UK Mod Hammond/vocal vehicle — recorded almost in parallel with Lewis's translation of Dobie Gray. Fame's residency at the Flamingo Club (Soho) was the central UK Mod venue, and 'Yeh Yeh' is the recorded artifact of how Mod culture consumed Black American jazz live, not as a curiosity but as dance music."
            ),
        },
        "narrative_slots": {
            "production_facts": "Recorded autumn 1964, released as Columbia (UK) single late 1964; reached UK #1 January 14, 1965 (2 weeks). Original by Mongo Santamaria with lyric by Jon Hendricks (Lambert, Hendricks & Ross).",
            "member_dynamics": "Georgie Fame (b. Clive Powell, 1943 Lancashire) on Hammond organ and lead vocal. The Blue Flames band varied; the 1964 lineup included Mick Eve (sax), John McLaughlin (briefly, on guitar).",
            "cultural_venue": "Flamingo Club, 33–37 Wardour Street, Soho — the central UK Mod all-nighter venue, where Black American jazz singles and US R&B records were the diet of the Mod audience.",
            "instrumentation_details": "Hammond organ-led arrangement with the Blue Flames' soul-jazz horn section. Fame's vocal is laconic, scat-influenced; the harmonic content stays close to the bop-rooted Santamaria original.",
            "release_circumstances": "Columbia (EMI) DB 7428, late 1964. UK #1 (2 weeks Jan 1965), US #21. Exact parallel to Lewis's anchor: same year, same translation gesture (American jazz → organ-led popular vehicle), but from the UK Mod side of the Atlantic.",
        },
        "tags": ["translation_aesthetic", "uk_mod_parallel", "cover_translation", "hammond_organ", "1965"],
        "red_heart_tier": "blind_spot",
        "red_heart_evidence": [],
        "epistemic_layer": "fact",
        "sources": [
            "https://www.songfacts.com/facts/georgie-fame/yeh-yeh  [T3]",
            "https://www.officialcharts.com/songs/georgie-fame-yeh-yeh/  [T1 — Official Charts UK]",
            "https://en.wikipedia.org/wiki/Yeh,_Yeh  [T2-3]",
        ],
    },

    {
        "id": "the-animals_animals_house-of-the-rising-sun",
        "artist": "The Animals",
        "period": {"label": "UK Mod-era R&B breakthrough", "year_start": 1964, "year_end": 1964},
        "works": [
            {"title": "House of the Rising Sun", "type": "track", "year": 1964},
            {"title": "The Animals", "type": "album", "year": 1964},
        ],
        "position_in_era": {
            "primary_genre_lineage": "UK Mod-era R&B / British blues with organ-led arrangement",
            "geographic_locus": "Newcastle / London (UK touring R&B circuit)",
            "historical_role": (
                "The 1964 #1-on-both-sides-of-the-Atlantic hit that proved a UK R&B band could translate American folk-blues material (the song goes back to early-20th-century field recordings; the band heard Dylan's 1962 version) "
                "into a Hammond-organ-and-vocal arrangement that became its own genre-defining text. "
                "Same-era UK Mod context as the anchor: the user's UK-Mod-compilation hit on 'The In Crowd' lands in the same scene that consumed The Animals as canon. Bridge node anchoring the UK Mod cultural moment in which Lewis's record had its UK afterlife."
            ),
        },
        "narrative_slots": {
            "production_facts": "Recorded May 18, 1964 at De Lane Lea Studios, London. Produced by Mickie Most. The single was reportedly recorded in a single take. Released as Columbia (UK) single June 1964.",
            "member_dynamics": "Eric Burdon (vocals), Alan Price (Vox Continental organ — the song's most identifiable sound), Hilton Valentine (guitar — arpeggiated intro), John Steel (drums), Chas Chandler (bass).",
            "cultural_venue": "British R&B touring circuit and the same UK Mod club ecosystem (Flamingo, Marquee) that elevated Georgie Fame.",
            "instrumentation_details": "Vox Continental organ provides the harmonic carpet; Valentine's arpeggiated guitar intro is the iconic gesture. Burdon's vocal is the bridge from American blues phrasing to UK Mod swagger.",
            "release_circumstances": "Columbia (EMI) DB 7301, June 1964. UK #1 (1 week July 1964), US #1 (3 weeks September 1964). One of the defining records of the UK Mod-era cross-Atlantic translation cycle.",
        },
        "tags": ["uk_mod_anchor", "translation_aesthetic", "british_invasion_blues", "hammond_organ", "1964"],
        "red_heart_tier": "hit",
        "red_heart_evidence": ["红心: The Animals — House of the Rising Sun"],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/The_House_of_the_Rising_Sun  [T2-3]",
            "https://en.wikipedia.org/wiki/The_Animals_(The_Animals_album)  [T2-3]",
        ],
    },

    {
        "id": "julie-driscoll-brian-auger-trinity_streetnoise_this-wheels-on-fire",
        "artist": "Julie Driscoll, Brian Auger and the Trinity",
        "period": {"label": "Late-60s UK Mod organ peak", "year_start": 1968, "year_end": 1968},
        "works": [
            {"title": "This Wheel's on Fire", "type": "track", "year": 1968},
            {"title": "Open", "type": "album", "year": 1967},
            {"title": "Streetnoise", "type": "album", "year": 1969},
        ],
        "position_in_era": {
            "primary_genre_lineage": "UK Mod / progressive R&B with Hammond organ + female vocal cover-as-authorship",
            "geographic_locus": "London",
            "historical_role": (
                "Direct UK Mod-organ heir to Georgie Fame, three years on. Brian Auger's Hammond-led Trinity covered Bob Dylan and The Band's 'This Wheel's on Fire' (still unreleased Basement Tapes material at the time) "
                "and made the UK #5 in 1968 with Julie Driscoll on lead vocal. Auger would go on to be central to the late-60s/early-70s UK soul-jazz Hammond tradition that fed directly into the acid-jazz revival twenty years later. "
                "The cover-as-authorship gesture is now in UK Mod's late phase — covering an unreleased American song before the original is available is a translation under unique conditions."
            ),
        },
        "narrative_slots": {
            "production_facts": "Recorded 1968, released as Marmalade Records single April 1968. Produced by Giorgio Gomelsky (the Yardbirds' manager-producer).",
            "member_dynamics": "Brian Auger (Hammond organ, keys), Julie Driscoll (lead vocal — became a 1968 UK style icon), Dave Ambrose (bass), Clive Thacker (drums).",
            "cultural_venue": "London Marmalade / late-Mod club circuit; Marquee, Speakeasy.",
            "instrumentation_details": "Heavy Hammond B3 organ throughout — Auger plays the riff that defines the arrangement. Driscoll's vocal lower-register and slightly aloof, in contrast to the urgent original demo. Drums and bass lock to a heavy backbeat suited for Mod dancefloors.",
            "release_circumstances": "Marmalade single 598-006, April 1968. UK #5, Canada #13.",
        },
        "tags": ["uk_mod_heir", "translation_aesthetic", "cover_translation", "hammond_organ", "1968"],
        "red_heart_tier": "blind_spot",
        "red_heart_evidence": [],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/This_Wheel%27s_on_Fire  [T2-3]",
            "https://en.wikipedia.org/wiki/Brian_Auger_and_the_Trinity  [T2-3]",
        ],
    },

    {
        "id": "bryan-ferry_these-foolish-things_these-foolish-things",
        "artist": "Bryan Ferry",
        "period": {"label": "Solo debut from Roxy Music", "year_start": 1973, "year_end": 1973},
        "works": [
            {"title": "These Foolish Things", "type": "track", "year": 1973},
            {"title": "These Foolish Things", "type": "album", "year": 1973},
        ],
        "position_in_era": {
            "primary_genre_lineage": "Glam-Mod descended cover-as-authorship art-rock",
            "geographic_locus": "London — Island Records",
            "historical_role": (
                "Ferry's 1973 solo debut is a full covers album — Roxy Music (minus Eno) playing material spanning 1930s standards (the title track) through Elvis, Bob Dylan, the Rolling Stones, and Ketty Lester. "
                "Released October 1973 on Island (UK) / Atlantic (US), UK #5, gold-certified by May 1974. The Mod-descended UK lineage's most explicit 1970s statement of 'a cover is authorship': not an aesthetic to recover, but the entire premise of the record. "
                "Direct heir to the cover-as-method gesture that Lewis crystallized in 1965 — except now the translator is a UK art-rock singer using American pop standards as the source material rather than the other way round."
            ),
        },
        "narrative_slots": {
            "production_facts": "Recorded mid-1973 at AIR Studios London. Produced by Bryan Ferry and John Punter. Released October 5, 1973 on Island ILPS-9249.",
            "member_dynamics": "Ferry on lead vocal, plus Roxy Music personnel (Phil Manzanera, Andy Mackay, Paul Thompson) and session players. Brian Eno had left Roxy Music two months earlier.",
            "cultural_venue": "Post-glam UK art-rock; Island Records' songwriter-led aesthetic.",
            "instrumentation_details": "Each cover wears a different stylistic costume — strings on 'These Foolish Things', country pedal-steel on others, soul-revue arrangements on the Motown covers. The album's coherence is in Ferry's vocal posture rather than in arrangement.",
            "release_circumstances": "Island ILPS-9249, October 1973. UK #5; gold-certified May 1974 BPI. Direct commercial proof that the cover-as-authorship method could carry a major rock-singer's solo debut as the entire concept.",
        },
        "tags": ["translation_aesthetic", "cover_as_authorship_concept", "uk_post_mod_heir", "art_rock", "1973"],
        "red_heart_tier": "blind_spot",
        "red_heart_evidence": [],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/These_Foolish_Things_(album)  [T2-3]",
            "https://www.bryanferry.com/collections/these-foolish-things  [T1 — artist official]",
        ],
    },

    {
        "id": "james-taylor-quartet_mission-impossible_mission-impossible",
        "artist": "The James Taylor Quartet",
        "period": {"label": "Acid Jazz Records founding-era", "year_start": 1986, "year_end": 1988},
        "works": [
            {"title": "Mission Impossible", "type": "track", "year": 1987},
            {"title": "Mission Impossible", "type": "album", "year": 1987},
        ],
        "position_in_era": {
            "primary_genre_lineage": "Hammond-organ UK acid-jazz revival of 60s soul-jazz/mod material",
            "geographic_locus": "London — Re Elect The President / Polydor",
            "historical_role": (
                "Cleanest UK descent line to the anchor's Mod / soul-jazz aesthetic. James Taylor had been Hammond B3 organist in The Prisoners, a 1980s UK Mod-revival band; after the Prisoners broke up he formed the JTQ around the Hammond, "
                "the first single 'Blow-Up' came out on Re Elect The President (the label that would soon morph into Acid Jazz Records), and the debut album 'Mission Impossible' (1987) is almost entirely covers of 1960s spy/film themes — Mission Impossible, Goldfinger, Alfie, Mrs. Robinson. "
                "A Hammond-led UK band in 1987 making cover-as-authorship an entire artistic identity: the Mod / soul-jazz / Lewis-trio lineage made literal."
            ),
        },
        "narrative_slots": {
            "production_facts": "Recorded 1986–87; released 1987 on Re Elect The President (label founded by Eddie Piller, soon to relaunch as Acid Jazz Records).",
            "member_dynamics": "James Taylor (Hammond B3 organ), David Taylor (guitar, James's brother), original Prisoners bassist (Allan Crockford), drummer Simon Howard.",
            "cultural_venue": "Late-80s London acid-jazz / rare-groove scene (clubs: Dingwalls, the WAG Club, Talkin' Loud).",
            "instrumentation_details": "Hammond B3 + Leslie cabinet leads every track; backed by drums/bass/guitar. The arrangements treat the 60s film-theme melodies as soul-jazz vamps in the Jimmy Smith / Jack McDuff tradition.",
            "release_circumstances": "Re Elect The President RTP-LP-1, 1987. Cult success that established JTQ as the Hammond-led face of UK acid-jazz revival.",
        },
        "tags": ["translation_aesthetic", "uk_acid_jazz_revival", "cover_as_authorship", "hammond_organ", "1987"],
        "red_heart_tier": "blind_spot",
        "red_heart_evidence": [],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/James_Taylor_Quartet  [T2-3]",
            "https://stollerhall.com/shows/james-taylor-quartet/  [T3 — venue bio]",
        ],
    },

    {
        "id": "the-brand-new-heavies_the-brand-new-heavies_never-stop",
        "artist": "The Brand New Heavies",
        "period": {"label": "Acid Jazz Records breakthrough", "year_start": 1990, "year_end": 1991},
        "works": [
            {"title": "Never Stop", "type": "track", "year": 1991},
            {"title": "The Brand New Heavies", "type": "album", "year": 1990},
        ],
        "position_in_era": {
            "primary_genre_lineage": "UK acid jazz / rare-groove revival of 70s jazz-funk",
            "geographic_locus": "Ealing, London — Acid Jazz Records",
            "historical_role": (
                "The flagship release of Acid Jazz Records' breakthrough wave. Debut LP recorded on an £8,000 budget, released April 16 1990, UK-only; the 1991 US Delicious Vinyl licensing deal turned the band into the international face of acid jazz. "
                "'Never Stop' (Sept 1991 single) reached UK #43 / US Hot 100 #54 / US Hot R&B #4. The group's stated influences (per their own press): 'Donald Byrd, the Mizell Brothers, 70s jazz-funk, two-step soul, mixed with a London warehouse party vibe' — direct descent from the soul-jazz crossover tradition Lewis crystallized."
            ),
        },
        "narrative_slots": {
            "production_facts": "Recorded 1989–90 in London; budget £8,000. Released April 16, 1990 on Acid Jazz Records (founder Eddie Piller — same lineage as JTQ). 1991 US release on Delicious Vinyl.",
            "member_dynamics": "Founded 1985 in Ealing by Simon Bartholomew (guitar), Andrew Levy (bass), Jan Kincaid (drums) — clubbing the London rare-groove scene, influenced by James Brown / Meters / Donald Byrd. Vocalist N'Dea Davenport joined for the debut album.",
            "cultural_venue": "London warehouse-party / rare-groove circuit; clubs Talkin' Loud, the WAG Club, Dingwalls.",
            "instrumentation_details": "Funk rhythm section + Rhodes/Hammond keys + horn section — direct 70s soul-jazz instrumental template; vocals added on top.",
            "release_circumstances": "Acid Jazz Records AJXLP-2, April 1990 (UK). US release with Delicious Vinyl 1991. 'Never Stop' single 1991: UK #43, US Hot R&B #4. The album charted UK #69 on re-release.",
        },
        "tags": ["translation_aesthetic", "uk_acid_jazz_revival", "soul_jazz_descent", "rare_groove", "1991"],
        "red_heart_tier": "blind_spot",
        "red_heart_evidence": [],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/The_Brand_New_Heavies_(album)  [T2-3]",
            "https://en.wikipedia.org/wiki/The_Brand_New_Heavies  [T2-3]",
            "https://en.wikipedia.org/wiki/Acid_jazz  [T2-3]",
        ],
    },

    {
        "id": "us3_hand-on-the-torch_cantaloop-flip-fantasia",
        "artist": "Us3",
        "period": {"label": "Blue Note acid-jazz crossover", "year_start": 1992, "year_end": 1993},
        "works": [
            {"title": "Cantaloop (Flip Fantasia)", "type": "track", "year": 1992},
            {"title": "Hand on the Torch", "type": "album", "year": 1993},
            {"title": "100% Acid Jazz", "type": "album", "year": 1994},
        ],
        "position_in_era": {
            "primary_genre_lineage": "UK acid-jazz / jazz-hip-hop hybrid built on direct Blue Note sampling",
            "geographic_locus": "London — Blue Note Records (the first non-American act signed to the historic jazz label)",
            "historical_role": (
                "The lineage's full circle: a UK acid-jazz act samples Herbie Hancock's 'Cantaloupe Island' (Empyrean Isles, 1964) — a 1960s soul-jazz piece in the exact same scene Lewis's 'In Crowd' emerged from — and turns it into a Hot 100 #9 hit on Blue Note itself, "
                "becoming the first album in Blue Note's history to reach platinum. 'Cantaloop (Flip Fantasia)' was called 'probably the best acid jazz single ever' (AllMusic). "
                "The UK Mod / Northern Soul / acid-jazz axis is now publicly fed back into the Blue Note canon it descended from — translation aesthetic gone meta."
            ),
        },
        "narrative_slots": {
            "production_facts": "Produced by Geoff Wilkinson and Mel Simpson. Built around a chopped sample of Hancock's 'Cantaloupe Island' (1964, Empyrean Isles, Blue Note) — Blue Note granted Us3 unprecedented access to its master tapes after Wilkinson pitched the project. Released October 1992 (single), 1993 (album).",
            "member_dynamics": "Geoff Wilkinson (producer/programmer), Mel Simpson (producer/keys), rappers Rahsaan Kelly and Kobie Powell, plus session jazz musicians. Built around producer + rapper + jazz session player triangle.",
            "cultural_venue": "London acid-jazz club scene + Blue Note's New York/LA jazz heritage infrastructure.",
            "instrumentation_details": "Hancock 'Cantaloupe Island' sample as backbone (the 2-bar piano vamp and bass), live trumpet (Gerard Presencer), live alto sax solos, hip-hop drums and rap verses on top.",
            "release_circumstances": "Blue Note single October 1992, album 'Hand on the Torch' Sept 1993. 'Cantaloop' Hot 100 #9, Cash Box #7. Album: 2.3 million copies, first Blue Note platinum LP, Grammy nominated. The user's red-heart hit is on a '100% Acid Jazz' compilation including this track.",
        },
        "tags": ["translation_aesthetic", "acid_jazz", "blue_note_sample_meta", "soul_jazz_descent", "1993"],
        "red_heart_tier": "hit",
        "red_heart_evidence": ["红心: Us3 — Cantaloop (Flip Fantasia) (via '100% Acid Jazz' compilation)"],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/Cantaloop_(Flip_Fantasia)  [T2-3]",
            "https://en.wikipedia.org/wiki/Hand_On_the_Torch  [T2-3]",
            "https://www.udiscovermusic.com/stories/us3-hand-on-the-torch-feature/  [T2 — feature]",
            "https://www.whosampled.com/sample/172/Us3-Cantaloop-(Flip-Fantasia)-Herbie-Hancock-Cantaloupe-Island/  [T3-4 — sample provenance]",
        ],
    },

    {
        "id": "herbie-hancock_empyrean-isles_cantaloupe-island",
        "artist": "Herbie Hancock",
        "period": {"label": "Blue Note quintet era", "year_start": 1964, "year_end": 1964},
        "works": [
            {"title": "Cantaloupe Island", "type": "track", "year": 1964},
            {"title": "Empyrean Isles", "type": "album", "year": 1964},
            {"title": "Watermelon Man", "type": "track", "year": 1973},
            {"title": "Head Hunters", "type": "album", "year": 1973},
        ],
        "position_in_era": {
            "primary_genre_lineage": "Blue Note soul-jazz / modal funk pivot, then 1970s jazz-fusion",
            "geographic_locus": "New York (Blue Note era), then LA / global (Head Hunters)",
            "historical_role": (
                "Same-year peer to Lewis on the soul-jazz crossover axis. 'Cantaloupe Island' (recorded June 17, 1964 at Van Gelder Studio, NJ) is one of the canonical Blue Note soul-jazz pieces — a 16-bar modal vamp with a 4-chord hook that became the most-sampled 1960s jazz track of the hip-hop era. "
                "Direct upstream of Us3's 1992 hit; methodological cousin to the Lewis trio's 1965 anchor. "
                "Hancock also recorded 'Watermelon Man' on Head Hunters (1973) — the same composition he wrote in 1962 that helped invent the soul-jazz pop crossover formula; user has the Head Hunters version. Hancock's career arc connects this map's soul-jazz / acid-jazz endpoints across 30 years."
            ),
        },
        "narrative_slots": {
            "production_facts": "Empyrean Isles recorded June 17 1964, Rudy Van Gelder Studio, Englewood Cliffs NJ. Producer Alfred Lion. Blue Note BLP-4175, released August 1964. Head Hunters recorded September 1973 at Wally Heider Studios SF, producer David Rubinson; Columbia 32731.",
            "member_dynamics": "Empyrean Isles quartet: Herbie Hancock (piano), Freddie Hubbard (cornet), Ron Carter (bass), Tony Williams (drums) — the Miles Davis 1960s rhythm-section nucleus. Head Hunters era band: Hancock (Rhodes, clavinet, synth), Bennie Maupin (sax/flute/bass clarinet), Paul Jackson (bass), Harvey Mason (drums), Bill Summers (percussion).",
            "cultural_venue": "Blue Note studio jazz / 1970s LA fusion ecosystem.",
            "instrumentation_details": "'Cantaloupe Island' built on F minor → Db7 → D minor 7 → F minor 7 / E♭ 4-chord vamp; sparse piano comping leaves the bass and drums as the carrying voice. The piece's structural simplicity is what makes it endlessly samplable. 'Watermelon Man' on Head Hunters reimagines the 1962 composition with Bill Summers's beer-bottle hindewhu intro and the Mwandishi-era funk band.",
            "release_circumstances": "Empyrean Isles BLP-4175, Aug 1964. Head Hunters released Oct 1973, charted #13 Billboard 200, eventually 2x platinum — the first jazz album to be certified platinum. Both records are direct lineage-companions to the soul-jazz crossover Lewis pioneered.",
        },
        "tags": ["translation_aesthetic", "same_era_dialogue", "soul_jazz", "blue_note", "sample_source_of_us3", "1964"],
        "red_heart_tier": "hit",
        "red_heart_evidence": ["红心: Herbie Hancock — Watermelon Man (from Head Hunters)"],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/Empyrean_Isles  [T2-3]",
            "https://en.wikipedia.org/wiki/Cantaloupe_Island  [T2-3]",
            "https://en.wikipedia.org/wiki/Head_Hunters  [T2-3]",
        ],
    },

    {
        "id": "jamiroquai_emergency-on-planet-earth_too-young-to-die",
        "artist": "Jamiroquai",
        "period": {"label": "Acid jazz mainstream peak", "year_start": 1992, "year_end": 1993},
        "works": [
            {"title": "Too Young to Die", "type": "track", "year": 1993},
            {"title": "Emergency on Planet Earth", "type": "album", "year": 1993},
        ],
        "position_in_era": {
            "primary_genre_lineage": "UK acid-jazz mainstream / Stevie Wonder–Roy Ayers–Donald Byrd descent",
            "geographic_locus": "London — Acid Jazz Records (debut), then Sony S2",
            "historical_role": (
                "The acid-jazz movement's most commercially successful global act. Formed 1992 by Jay Kay; debut single 'When You Gonna Learn' came out on Acid Jazz Records before a Sony deal. "
                "Emergency on Planet Earth (June 1993) hit UK #1; 'Too Young to Die' single reached UK #10. Stated influences across all interviews: Stevie Wonder (Innervisions era), Roy Ayers, Donald Byrd, Herbie Hancock. "
                "The episode's mainstream-pop endpoint for the soul-jazz translation lineage — a record selling stadium tickets in 1993 whose musical DNA traces directly through 70s jazz-funk and 60s soul-jazz back to the Lewis crossover moment."
            ),
        },
        "narrative_slots": {
            "production_facts": "Recorded 1992–93; released 14 June 1993 on Sony S2 (after the Acid Jazz Records debut single deal). Producer Mike Nielsen with Jamiroquai.",
            "member_dynamics": "Jay Kay (vocals), Toby Smith (keyboards/co-writer), Stuart Zender (bass), Nick van Gelder (drums), Wallis Buchanan (didgeridoo). Smith and Kay co-wrote most material studying Innervisions-era Stevie Wonder records.",
            "cultural_venue": "Late-1980s/early-90s London acid-jazz club scene; same label founding context as Brand New Heavies (Acid Jazz Records, Eddie Piller).",
            "instrumentation_details": "Clavinet / Rhodes-keyboard heavy arrangements; funk bass front-mixed; falsetto vocal phrasing modeled on Wonder. 'Too Young to Die' opens with a moaning chord vamp + funk drum break — direct soul-jazz textural inheritance.",
            "release_circumstances": "Sony S2 467921, June 1993. UK Albums Chart #1; eventually 6× platinum UK. Single 'Too Young to Die' reached UK #10. The episode's most public proof that the lineage Lewis started in 1965 still drove mainstream pop in 1993.",
        },
        "tags": ["translation_aesthetic", "uk_acid_jazz_mainstream_peak", "soul_jazz_descent", "1993"],
        "red_heart_tier": "blind_spot",
        "red_heart_evidence": [],
        "epistemic_layer": "fact",
        "sources": [
            "https://en.wikipedia.org/wiki/Emergency_on_Planet_Earth  [T2-3]",
            "https://en.wikipedia.org/wiki/Jamiroquai  [T2-3]",
        ],
    },
]


def main():
    tracks_path = Path(__file__).parent.parent / 'data' / 'user_tracks.json'
    tracks = load_tracks(str(tracks_path))
    created = []
    enriched = []
    for node in NODES:
        nid = node['id']
        if node_exists(nid):
            put_node(node, enrich=True)
            enriched.append(nid)
        else:
            put_node(node)
            created.append(nid)
        # Compute coverage
        update_coverage_for_node(nid, tracks)

    print(f"Created {len(created)} new nodes:")
    for nid in created:
        print(f"  + {nid}")
    if enriched:
        print(f"\nEnriched {len(enriched)} existing nodes:")
        for nid in enriched:
            print(f"  ~ {nid}")


if __name__ == '__main__':
    main()
