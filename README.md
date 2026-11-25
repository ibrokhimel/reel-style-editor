# reel-style-editor

A [Claude Code](https://claude.com/claude-code) skill that edits a raw vertical video (talking head, selfie, podcast clip, screen recording) or a voice-over into a finished 15–35 s Reel / TikTok / Short — end to end, from silence cutting to a mastered, rendered MP4.

**Default look ("v2"):**

- silence-cut talking head with smooth glide zooms between framings
- plain bold white captions, 2–4 words at a time, each word fading in as it is spoken (no boxes, glow or colour)
- realistic **dark-mode iPhone screens** — Clock timer, Messages, Reminders, Calendar, Photos — that open with the iOS app-launch zoom, matched to what the speaker is saying
- a **real royalty-free music track** placed so its drop lands on the first scene change, ducked under the voice
- **real sound effects** (whoosh, message pop, tick, checkbox pop, click) placed automatically
- mastered to −14 LUFS / −1 dBTP, 1080×1920 @ 30 fps

Alternate looks on request: **LUX** (paper-texture typographic slides, serif accents) and **KINETIC** (purple motion graphics on a dot grid). The numbers behind all three come from frame-by-frame measurements of reference reels — see [`references/STYLE_GUIDE.md`](references/STYLE_GUIDE.md).

## How it works

```
raw video ─► transcribe (Whisper, word timestamps) ─► cut silences ─► fetch real audio + pick track
        ─► Claude writes plan.json (sections, app scenes, anchors) ─► compile (+ pacing report)
        ─► mix (-14 LUFS) ─► Remotion preview (contact sheets, reviewed) ─► final render ─► QA (13 numeric checks)
```

Python scripts do everything deterministic; Remotion (React) renders the captions, scenes and transitions; Claude makes the creative decisions in one small JSON file and reviews the previews. `compile_edit.py` prints a pacing report (max gap between visual changes, first change, face-shot length, transitions per 10 s, …) and `qa.py` checks the rendered file.

## Install

Requirements: Python 3.10+, Node 18+, `ffmpeg` and `ffprobe` on PATH.

```bash
git clone https://github.com/ibrokhimel/reel-style-editor ~/.claude/skills/reel-style-editor
pip install -r ~/.claude/skills/reel-style-editor/requirements.txt
```

Then, in Claude Code, ask for an edit — "edit this video into a reel" with the file attached — and the skill takes over. It creates a Remotion project once (`scripts/setup_project.py`, ~400 MB of `node_modules`) and reuses it. The first render also lets Remotion download its headless Chrome.

## Audio and licences

- **Music and SFX are not bundled.** `scripts/fetch_audio.py` downloads a small SFX kit and music candidates from [Mixkit](https://mixkit.co) (Mixkit License: free for commercial use, no attribution) and only after you pass `--yes`. Use your own tracks if you prefer (`"music": "path/to/track.mp3"` in the plan).
- **Remotion** is free for individuals and small companies; companies above its size threshold need a [Remotion licence](https://remotion.dev/license).
- Fonts (Inter, Inter Tight, Instrument Serif, Dancing Script) load from Google Fonts under the SIL Open Font License.
- Transcription uses [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (MIT) on CPU; no audio leaves your machine.
- The iPhone-style screens are original approximations drawn in React/CSS. This project is not affiliated with or endorsed by Apple.

## Layout

| path | what |
|---|---|
| `SKILL.md` | the instructions Claude follows (workflow, defaults, pacing rules, gotchas) |
| `scripts/` | `setup_project`, `transcribe`, `cut_silence`, `fetch_audio`, `music_info`, `compile_edit`, `mix`, `render`, `qa` (+ `sound_assets`, a last-resort placeholder) |
| `template/` | the Remotion project: captions, iOS/LUX/KINETIC scenes, transitions, grades |
| `references/` | style guide with measurements, plan schema, annotated default plan, scene catalogue |

## License

[MIT](LICENSE)
