# plan.json — the edit decision list you write

`compile_edit.py` turns this into `PROJECT/public/edit.json`. You only decide **what** happens **when**; the script resolves timings from `words_cut.json`, builds captions, copies media, places SFX and prints the pacing report. Relative paths in the plan resolve against the plan file's folder.

**Start from `plan_v2.example.json`** — the default look (iOS base, clean white captions, dark iPhone app screens opened with the app-launch transition, glide zooms, real music + SFX). The tables below list every key; the LUX/KINETIC/`styled` material in §4–§7 applies only when the user asks for those looks.

## Contents
1. Top level
2. Time anchors
3. Sections
4. Captions (auto rules + explicit `lines`)
5. Word flags: emphasis, colours, emoji
6. SFX and music
7. Full examples (LUX, iOS, KINETIC)

---

## 1. Top level

| key | type | default | meaning |
|---|---|---|---|
| `style` | `"ios"` \| `"lux"` \| `"kinetic"` | `"ios"` | base look (STYLE_GUIDE §1); `ios` = the default v2 look |
| `aroll` | path \| null | null | the silence-cut `aroll.mp4` (talking head). null for voice-over-only |
| `music` | path \| `"auto"` \| `"none"` | `"auto"` | a REAL track (looped/trimmed; get one with `fetch_audio.py`). `"auto"` falls back to a synthesized placeholder bed and prints a warning — don't ship that |
| `bed_db` | number | −9 | music loudness relative to the voice |
| `tail` | s | 0.3 | silence after the last word (guide: 0.10–0.35) |
| `duration` | s | last word end + tail | override |
| `watermark` | string | none | tiny handle bottom-centre (y 0.93) |
| `caption_style` | `"clean"` \| `"styled"` | `"clean"` | **Default `clean`.** Every section gets plain bold white captions (Inter Tight 800, 68 px, soft shadow, no box/glow/colour), 2–4 words, words fade+rise 4 f as spoken. Per-section `captionY` moves them (e.g. 0.705 over a timer, 0.72 under a photo). `"styled"` = the legacy per-style presets of §4 |
| `music_start` | s | 0 | offset into the music file; put the track's drop on the first scene change |
| `sfx_files` | object | `audio/sfx.json` next to the plan | `{"whoosh": "path.mp3", ...}` real sound files (names: `whoosh`, `whoosh2`, `tick`, `msg`, `pop`, `click`; `fetch_audio.py` writes the map). Each file's peak is measured and set 6 dB under the voice peak, plus the event's `gain` (dB) |
| `corrections` | object | {} | fix mis-heard words before captions: `{"37": "reading", "50": "listening,"}` (keys = indices in `transcript_cut.txt`; keep punctuation). Always proof-read the transcript — Whisper garbles English terms inside Russian/Uzbek speech and brand names |
| `ui` | object | {} | UI labels for the iPhone scenes, merged into every app scene's props (English by default). Russian example: `{"cancel": "Отменить", "pause": "Пауза", "tabs": ["Мировые часы", "Будильники", "Секундомер", "Таймеры"], "back": "Списки", "add": "Новое напоминание", "time": "Сегодня 16:04", "month": "Июнь", "days": ["П","В","С","Ч","П","С","В"], "edit": "Править"}`. Per-section props still win |
| `emphasis`, `colors`, `emoji` | lists | [] | §5 |
| `sfx` | `"auto"` \| `"none"` \| list | `"auto"` | §6 |
| `sfx_min_gap` | s | 1.2 | spacing for auto SFX (also capped at 0.24 per second) |
| `sections` | list | required | §3 |

## 2. Time anchors

Everything is on the **output** timeline (`transcript_cut.txt`).

| form | example | resolves to |
|---|---|---|
| number in `sections[].at` | `12.4` | absolute seconds |
| number in a scene `at`/`*At` | `0.3` | seconds **after the section start** |
| `"w:N"` | `"w:17"` | onset of word N − lead (sections 2 f, items 4 f) |
| phrase | `"reading"` / `"twenty texts"` | first match at/after the section start, − 4 f |

Use `"w:N"` for section starts (unambiguous). Use phrases for items inside a scene.

## 3. Sections

Sections tile the timeline: each runs from its `at` to the next one's `at`. First section always starts at 0.

```json
{"at": "w:9", "kind": "face", "enter": "cut", "exit": "none", "invertFlash": false,
 "captions": "auto", "lines": [...], "props": {...}}
```

- `enter`: `cut` | `blur` (6 f) | `defocus` (8 f, back to face after a graphic) | `whip` (6 f, between graphics) | `slide` (7 f, between app screens) | `pop` (6 f) | `iris` (black circle opens, 6 f)
- `exit`: `none` | `whip` (5 f fly-through) | `blur` (6 f) | `iris` (black circle closes, 8 f — use before a `black` section)
- `invertFlash`: 1–2 negative frames at the start (≤ 1 per 12 s, face → B-roll)
- `captions`: `auto` | `none` | lux: `broll` (one word at a time) | ios: `pill` `notes` `plain` `checklist`

Scene kinds and their `props`: see `scenes.md`.

## 4. Captions

### Auto rules (when no `lines`)
| style | section kind | preset |
|---|---|---|
| lux | `face` | `LUX_KARAOKE` chunks of 2–5 words (break on punctuation / gap > 0.25 s); a chunk that hits an `emphasis` phrase becomes `LUX_TWOTIER` (≤ 3 setup words small, phrase big) |
| lux | `broll`, `image`, or `captions:"broll"` | `LUX_BROLL_WORD` |
| lux | `stat` `redsun` `framed` `collage` | none (scene text carries it) |
| ios | `face` | `props.captions` or `captions`: `plain` (default), `pill`, `notes` (default when `props.chrome:"notes"`), `checklist` |
| ios | `black` | `IOS_TYPE` |
| ios | app scenes | none |
| kinetic | `hero` (y .47), `cutout` (y .17), `emoji` (y .68) | `KINETIC_HERO`, 1–3 words, last word = hero |
| kinetic | `poster`, `namecard` | none |

### Explicit `lines` (any section; overrides auto)
Each line is matched to the spoken words in order, so write the words exactly as spoken (punctuation optional):
```json
"lines": [
  {"small": "ever had", "big": "problem?", "bigInPill": true},
  {"small": "So, let's make", "big": "something", "pill": "good.", "y": 0.47},
  {"preset": "LUX_TWOTIER", "small": "the secret", "big": "behind the style"},
  {"preset": "IOS_CHECKLIST", "rows": ["I could sleep better", "I can handle problems better"]}
]
```
Default preset for `lines`: `KINETIC_HERO` in kinetic, `LUX_TWOTIER` otherwise.

## 5. Word flags

```json
"emphasis": [{"phrase": "behind the style"}, {"phrase": "magic", "serif": true}],
"colors":   [{"word": "sleep", "c": "pos"}, {"word": "problems", "c": "neg"}],
"emoji":    [{"word": "alcohol", "x": "🍺"}]
```
- `emphasis` (lux): two-tier big line; `serif:true` = Instrument Serif italic (1 per ~10 s, emotional/premium words only).
- `colors` (ios checklist/plain): `pos` #5DD238, `neg` #C83544, `accent` #E8C92F.
- `emoji`: appended after the word (Notes captions pop it in).
- Add `"after": <anchor>` to any entry to match a later occurrence.

## 6. SFX and music

`"sfx": "auto"` (default) places real sounds from the kit (`audio/sfx.json` / `sfx_files`): `whoosh` (−3 dB) on the first app opening and `whoosh2` (−6 dB) on later ones, `msg` on each received chat bubble, `pop` when a reminder item is ticked (`checkAt`), `click` on a calendar tap (`tapAt`), a quiet `tick` under a timer. At most one sound per `sfx_min_gap` (1.2 s) and 0.24 per second overall. Without a kit it falls back to the synthetic placeholder sounds (with a warning).

Manual list (types are the kit names; `offset` shifts in seconds, `gain` trims in dB): `[{"at": "w:8", "type": "whoosh", "offset": -0.15, "gain": -3}]`.

## 7. Legacy examples (LUX, styled iOS, KINETIC — only when the user asks for those looks; the default plan is `plan_v2.example.json`)

### LUX (talking head)
```json
{
  "style": "lux", "aroll": "work/aroll.mp4", "music": "D:/music/calm.mp3",
  "emphasis": [{"phrase": "behind this style"}, {"phrase": "magic", "serif": true}],
  "sections": [
    {"at": 0, "kind": "face", "props": {"zoom": 1.0}},
    {"at": "w:2", "kind": "stat", "props": {"big": "90%", "sub": [{"text": "of my students", "at": "of"}, {"text": "admire", "serif": true, "at": "admire"}]}},
    {"at": "w:10", "kind": "face", "invertFlash": true, "props": {"zoom": 1.2}},
    {"at": "w:15", "kind": "redsun", "props": {"img": "work/me_cutout.png", "lines": [{"text": "it's the", "size": "s", "at": "it's"}, {"text": "minimal", "at": "minimal"}, {"text": "luxurious", "serif": true, "at": "luxurious"}]}},
    {"at": "w:22", "kind": "broll", "props": {"src": "D:/clips/desk.mp4", "startFrom": 3.0}},
    {"at": "w:30", "kind": "face", "enter": "defocus", "props": {"zoom": 1.15}}
  ]
}
```

### iOS (story clip)
```json
{
  "style": "ios", "aroll": "work/aroll.mp4",
  "colors": [{"word": "sleep", "c": "pos"}, {"word": "problems", "c": "neg"}],
  "emoji": [{"word": "alcohol", "x": "🍺"}],
  "sections": [
    {"at": 0, "kind": "face", "captions": "pill", "props": {"zoom": 1.1}},
    {"at": "w:6", "kind": "messages", "enter": "slide", "exit": "iris", "props": {"name": "Mum", "bubbles": [{"me": true, "text": "Hey!", "at": 0.1}, {"me": false, "text": "Yes?", "at": 0.5}, {"me": true, "text": "I have a problem", "at": "problem"}]}},
    {"at": "w:12", "kind": "black"},
    {"at": "w:15", "kind": "face", "enter": "iris"},
    {"at": "w:20", "kind": "calendar", "enter": "slide", "props": {"day": "Sunday 1 June", "events": [{"title": "My birthday 🎂", "hour": 0, "dur": 4, "at": "birthday"}], "tapAt": "June"}},
    {"at": "w:26", "kind": "face", "props": {"chrome": "notes", "zoom": 1.2}},
    {"at": "w:44", "kind": "clock", "enter": "pop", "props": {"start": "10:10", "spinHours": 8}},
    {"at": "w:50", "kind": "reminders", "enter": "slide", "props": {"title": "June 1st", "cards": [{"text": "Do laundry", "at": 0.1}, {"text": "I'm sober", "at": "sober"}]}},
    {"at": "w:56", "kind": "photos", "props": {"img": "work/happy.jpg", "lines": [{"text": "The", "at": "the"}, {"text": "Happiest", "script": true, "at": "happiest"}]}},
    {"at": "w:66", "kind": "face", "enter": "defocus", "captions": "checklist"}
  ]
}
```

### KINETIC (voice-over)
```json
{
  "style": "kinetic", "aroll": null,
  "sections": [
    {"at": 0, "kind": "hero", "lines": [{"small": "ever had a", "big": "problem?", "bigInPill": true}]},
    {"at": "w:4", "kind": "poster", "enter": "whip", "exit": "whip", "props": {"img": "work/silhouette.png", "small": "one guy could", "big": "fix it all", "at": "fix"}},
    {"at": "w:12", "kind": "namecard", "enter": "whip", "props": {"img": "work/cutout.png", "first": "Alex", "last": "Rivera", "tag": "not an editor", "items": [{"text": "doctor", "at": "doctor"}, {"text": "astronaut", "at": "astronaut"}]}},
    {"at": "w:30", "kind": "hero", "enter": "pop", "lines": [{"small": "the", "big": "allrounder"}]},
    {"at": "w:33", "kind": "cutout", "props": {"img": "work/cutout.png"}, "lines": [{"small": "can do", "big": "everything", "y": 0.17}]},
    {"at": "w:40", "kind": "emoji", "props": {"emoji": "🧑‍💻"}, "lines": [{"small": "that's", "big": "my job", "y": 0.68}]},
    {"at": "w:44", "kind": "hero", "lines": [{"small": "let's make", "big": "something", "pill": "good."}]}
  ]
}
```
