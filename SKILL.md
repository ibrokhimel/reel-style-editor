---
name: reel-style-editor
description: Edit a raw vertical video (talking head, selfie, podcast clip, screen recording) or a voice-over into a finished 15-35 s Reel/TikTok/Short. Default output ("v2 look"): silence-cut talking head with smooth glide zooms, plain bold white word-by-word captions, realistic dark-mode iPhone app inserts (Messages, Clock timer, Reminders, Calendar, Photos) that open with the iOS app-launch transition, real royalty-free music with its drop on the first scene change, real sound effects, and -14 LUFS mastering. Alternate looks on request - LUX (paper-texture typographic slides) and KINETIC (purple motion graphics). Word-timed captions via Whisper, rendered with Remotion. Use whenever the user wants to edit, cut, caption or "make a reel/short/tiktok" from their footage or voice-over, asks for "the reels style", "iPhone UI edit", "app-style edit", "clean captions", or drops a raw .mp4/.mov/.wav and says edit it - even if they don't name the skill.
---

# Reel style editor

Turns raw footage or a voice-over into a reel in a measured, tested house style (`references/STYLE_GUIDE.md` holds the measurements behind the numbers below). Remotion renders it; Python scripts do the deterministic parts. You make the creative decisions in one file: `plan.json`.

```
raw.mp4 / vo.wav
  └ transcribe.py ──► words.json + transcript.txt
      └ cut_silence.py ──► aroll.mp4 + voice.wav + words_cut.json (output timeline)
          └ fetch_audio.py ──► audio/ (real SFX kit + music candidates)  └ music_info.py ──► pick track + music_start
              └ YOU write plan.json (start from references/plan_v2.example.json)
                  └ compile_edit.py ──► public/edit.json + pacing report (fix every WARN)
                      └ mix.py ──► public/mix.wav (-14 LUFS)
                          └ render.py --preview ──► contact sheets (look at EVERY one)
                              └ render.py ──► out/final.mp4  └ qa.py (all PASS)
```

Paths: `SK` = this skill folder, `P` = the Remotion project (any folder, e.g. `~/reel-studio`), `WK` = a work folder per video. Run the scripts from `SK/scripts` with plain `python`. Needs Python 3.10+ (`pip install -r requirements.txt`), Node 18+, and `ffmpeg`/`ffprobe` on PATH. If Whisper can't be imported under `python -I`, drop `-I` (the packages live in user site-packages).

## The default look ("v2") — what the skill produces unless told otherwise
These defaults are built into `compile_edit.py`, so a plan that only lists sections already gets them:
- **Captions: `caption_style: "clean"`** — plain bold white (Inter Tight 800, 68 px), soft shadow, 2–4 words at a time, each word fades + rises as it is spoken. No pills, glow, coloured plates, checklists or neon script: tested users found those cheap and hard to read over busy footage.
- **Base style `ios`** with **realistic dark-mode iPhone screens** (`src/scenes/IosReal.tsx`: `timer`, `messages`, `reminders`, `calendar`, `photos`). They enter with `enter: "app"` (iOS app-launch zoom) — set automatically. Dark mode keeps white captions readable and matches dark screen recordings. No hand-drawn light mockups, iris wipes or emoji-icon UI.
- **Glide zooms**: consecutive `face` sections ease between framings over 12 frames (default); use hard cuts only deliberately. Screen recordings get a `zoom` 1.25–1.45 with `y` focus on the part being discussed.
- **Real audio only**: a real instrumental (Mixkit, free licence) at **−9 dB under the voice**, ducked under speech, its drop placed on the first scene change with `music_start`; real SFX (whoosh on app opens, message pop, tick, checkbox pop, UI click) placed automatically, ≤ 0.24 per second. The synthesized bed/kit in `sound_assets.py` exists only as a loud-warning fallback — never ship it.
- Alternates, only when the user asks: `style: "lux"` (paper slides, serif accents), `style: "kinetic"` (purple motion graphics), `caption_style: "styled"` (per-style caption presets). See STYLE_GUIDE and `references/scenes.md`.

## 1. Gather inputs (ask only what's missing)
- The raw file(s). Talking head → **video mode**; narration only → **audio mode** (graphics then carry the picture; use `--mode audio` and `style: "kinetic"` or app scenes).
- Optional: B-roll, photos/cutouts, a music track the user prefers (otherwise you pick one in step 4), a handle for the watermark.
- Language: captions follow the spoken language (Inter covers Latin + Cyrillic).

## 2. Project (once)
```bash
python setup_project.py ~/reel-studio
```
Copies `SK/template` and runs `npm install` (~400 MB). After changing the template, refresh with `--update-src`.

## 3. Transcribe and cut
```bash
python transcribe.py RAW WK                       # --lang xx and --model medium for non-English speech
python cut_silence.py RAW WK/words.json WK --mode video --max-gap 0.30
```
- `--max-gap`: talking head **0.30**, story **0.60**, voice-over **0.55** (leave breaths so animations land).
- Non-English speech: `--lang ru|uz|… --model medium` (the small model garbles words; medium ≈ 2 min for 37 s on CPU).
- Read `WK/transcript.txt`. Remove retakes/false starts with `--remove "12-18,40"` (word indices); fillers (um, uh) drop automatically.
- Proof-read `transcript_cut.txt` and fix mis-heard words with `"corrections": {"<index>": "text"}` in the plan — English terms inside other languages and brand names are the usual misses. Captions show exactly these words.
- Screen recordings in the a-roll: make a 1 fps contact sheet first to map what is on screen when, and grab stills for `photos` scenes with ffmpeg.
- Landscape source: `--focus-x 0.4` moves the 9:16 crop onto the face. Plan against `WK/transcript_cut.txt` (output times).

## 4. Real music + SFX
```bash
python fetch_audio.py WK/audio                    # lists the SFX kit + music candidates with sizes, downloads nothing
python fetch_audio.py WK/audio --yes --music 33,1167,175
python music_info.py WK/audio/music_*.mp3 --target 2.7
```
1. Run the first command, tell the user what will be downloaded (Mixkit, free licence, ~16 MB) and **wait for a yes** before `--yes`. To look beyond the candidates, browse https://mixkit.co/free-stock-music/ (tag pages) and use the id from the preview URL.
2. `music_info.py` reports BPM, energy curve and the track's biggest rise (the drop). Pick the track with steady energy and 90–125 BPM; `--target` is the time of the first scene change in the edit (e.g. the first app screen) and prints the `music_start` for the plan.
3. `WK/audio/sfx.json` is picked up by `compile_edit.py` automatically. Tell the user which track you chose and why.

## 5. Write `WK/plan.json`
Start from `references/plan_v2.example.json` (annotated, generic). Schema: `references/plan_schema.md`; scene props: `references/scenes.md`. Read both before the first plan.

Pacing rules that matter most (why: they are what make the references feel "expensive" rather than busy):
- **Hook text on screen at frame 0**, first visual change by **0.6 s**.
- **Something new at least every 2.0 s** (cut, scene item, punch-in, caption chunk). Sections average **1.8–2.6 s**; a face shot never runs past **5.1 s**.
- **Alternate dark footage and bright/UI screens** every 2.4–4.3 s. The eye resets on each flip.
- ~**4 transitions per 10 s**: mostly `app` openings, glides and hard cuts; invert flash ≤ 1 per 12 s.
- **Match the app to the meaning**: time/urgency → `timer`; an offer or dialogue → `messages`; a list or lessons → `reminders` (tick items with `checkAt`); a schedule or exam format → `calendar`; a document/screenshot → `photos`.
- Anchor sections with `"w:N"` at the first word of a new clause; anchor items inside scenes with phrases or numeric seconds.
- Structure: hook → pain → offer → proof sections in the order the speaker lists them → closing line on camera. The video ends ≤ 0.35 s after the last word — no outro.

## 6. Compile and fix the report
```bash
python compile_edit.py WK/plan.json WK/words_cut.json P
```
Prints section stats, max visual-change gap, first change, longest face shot, transitions per 10 s, luma runs, tail, then `WARN`/`ERROR`. Fix the plan until there is no `ERROR` and no `WARN` (each says what to add). `anchor not found` means the phrase isn't spoken that way — check `transcript_cut.txt`. Paths in the plan may be relative to the plan file.

## 7. Mix
```bash
python mix.py P --voice WK/voice.wav            # music/sfx come from the plan + WK/audio/sfx.json
```
Two-pass loudnorm to **−14 LUFS, −1 dBTP, LRA ≤ 4**; SFX are normalised by their measured peak to 6 dB under the voice peak (+ per-event `gain`). If it prints `WARN … SYNTHETIC`, a real file is missing — fix that.

## 8. Preview, look, fix
```bash
python render.py P --preview                     # half scale, ~4 min for 35 s; --frames 120-630 renders a range
```
Writes `P/out/preview_sheet_NN.jpg` (8×4 frames, 4 fps, timestamps). Look at **every** sheet. Check: captions readable and inside y 0.10–0.86 (move with a section's `captionY`); nothing over the speaker's eyes; scene text not clipped; transitions where planned; no black frames; app screens fill the frame. If a hook refuses a big image Read, pass `limit: 1`.

Common fixes: caption hard to read over a bright area → `captionY` onto a darker area; UI text too small → scene props (`fontPt`) rather than scaling the screen (left-aligned UI gets clipped); a long static scene → add a tick/check/tap item or split with a glide.

## 9. Final render and QA
```bash
python render.py P --out out/<name>.mp4
python qa.py P/out/<name>.mp4 P/public/edit.json
```
`qa.py` checks 1080×1920, 30 fps, 15–35 s, text at frame 0, first change ≤ 0.6 s, gap ≤ 2.0 s, face ≤ 5.1 s, mean section 1.8–2.8 s, −14 ±1 LUFS, peak ≤ −1 dBFS, LRA ≤ 4.5, tail, SFX ≤ 0.25/s. Report each FAIL with the reason if you keep it (glide-zoom sections can pull the mean section length slightly under 1.8 s — they are camera moves, not cuts). Deliver the final mp4 path plus a 3-line summary: style, duration, what each section does, and which music/SFX were used with their licence.

## Gotchas
- One compile→render at a time per project: render reads `public/edit.json` and `public/mix.wav`.
- `render.py` points TEMP at `P/tmp` and deletes its webpack bundles afterwards (Remotion otherwise leaves a copy of `public/` in the system temp on every render — it can fill a drive). Delete old `public/media` between videos.
- Props named `at` or ending in `At` are time anchors and get resolved — don't use such names for other data (`endTime`, not `endsAt`).
- ffmpeg 9 removed `-filter_complex_script`; the scripts use `-/filter_complex FILE`.
- Whisper splits/merges words differently from how a phrase reads; when a `lines`/phrase match fails, copy the words from `transcript_cut.txt`.
- The a-roll plays continuously under every section; non-face sections cover it. To show the speaker again after a graphic use `enter: "defocus"` or `"app"`.
- Sections stay mounted 8 frames under the next one, so animated entries never reveal black.
- Emoji render with the system emoji font (Segoe UI Emoji on Windows, Apple Color Emoji on macOS, Noto on Linux).
- The first render downloads Remotion's headless Chrome (~100 MB) automatically.
- Remotion is free for individuals and small companies; larger companies need a Remotion licence (https://remotion.dev/license).

## Files
- `references/STYLE_GUIDE.md` — measurements (pacing, caption geometry, palettes, motion frame counts, audio) for all three looks.
- `references/plan_schema.md` — plan format; `references/plan_v2.example.json` — the default plan template; `references/scenes.md` — scene kinds and props.
- `scripts/` — `setup_project.py`, `transcribe.py`, `cut_silence.py`, `fetch_audio.py`, `music_info.py`, `compile_edit.py`, `mix.py`, `render.py`, `qa.py`, `sound_assets.py` (placeholder audio only).
- `template/` — the Remotion project (captions in `src/captions/Captions.tsx`, scenes in `src/scenes/`, transitions/backgrounds/grades in `src/fx/Fx.tsx`).
