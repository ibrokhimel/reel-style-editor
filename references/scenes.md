# Scene kinds and props

All `at` / `*At` values accept the anchors from `plan_schema.md` §2. `src`/`img` accept absolute paths (copied into `public/media/`) or paths already under `public/`. Images may be PNG/JPG/SVG/WebP; videos MP4/MOV/WebM (muted — sound always comes from the mix).

Cutouts (`redsun`, `collage`, `namecard`, `cutout`, `poster`) need a **transparent PNG**. Getting one: `python -m rembg i in.jpg out.png` if `rembg` is installed; otherwise ask the user for one, or use an image-tool connector's background remover if the session has one (it costs the user credits, so ask first). Without a cutout these scenes still work with a normal photo, just less polished.

## Shared
| kind | look | props |
|---|---|---|
| `face` | the a-roll (silence-cut talking head), style grade (lux warm low-key + vignette; ios bottom gradient) | `zoom` 1.0 wide / 1.15–1.25 punch-in, `push` extra scale over the section (default 0.04), `x`,`y` zoom focus 0–1 (default 0.5, 0.35), `chrome:"notes"` (ios Notes UI) |
| `image` | full-frame still, slow 3% push | `src` |
| `broll` | full-frame clip, lux grade, push | `src`, `startFrom` s |

## LUX (paper #E9E6E3 + window-blind gobo shadow)
| kind | look | props | typical length |
|---|---|---|---|
| `stat` | huge charcoal-gradient number, glyphs blur in 3 f apart; sub-line mixes grotesk + serif italic | `big` ("90%"), `bigAt`, `sub: [{text, serif?, at}]` | 2–4 s |
| `redsun` | red #BF0203 circle Ø 0.95 W behind a cutout, small circles bleeding off edges, title stack top third typed at 20 chars/s | `img` (cutout), `lines: [{text, size:"s"\|"l", serif?, at}]` | 1.5–2.5 s |
| `framed` | 16:9 clip inset on paper, title types above, caption below | `src`, `startFrom`, `title`, `titleAt`, `caption`, `captionAt` | 2–2.5 s |
| `collage` | sepia panel #C3B9A4, navy square, cutout, heavy headline + serif overlay word | `img`, `headline`, `headlineAt`, `script`, `scriptAt`, `note` | 1–3 s |

## iOS (dark-mode, realistic — `src/scenes/IosReal.tsx`, drawn at 2.75 px/pt like a real iPhone)
Use `enter: "app"` (iOS launch: grows from 86% with rounded corners, 10 f). Dark mode keeps clean white captions readable. `messages`, `calendar`, `reminders`, `photos` now map to these; `timer` is new.
| kind | look | props |
|---|---|---|
| `messages` | dark iMessage thread, header avatar + name, typing dots before received bubbles, tails | `name`, `avatar`, `time`, `fontPt` (17 real, 22 reads better), `bubbles: [{me, text, at}]` |
| `timer` | Clock app timer counting down, orange ring, Cancel/Pause, tab bar | `seconds`, `endTime`, `drain`, `buttonsTop` |
| `reminders` | Reminders list: coloured large title + count, rows with circle checkboxes that fill at `checkAt` | `title`, `color`, `back`, `items: [{text, note?, at, checkAt?}]` |
| `calendar` | day view: week strip, red today circle, hour grid, tinted events, press state at `tapAt`, red now-line | `month`, `day`, `days`, `dates`, `today`, `startHour`, `nowLine`, `events: [{title, sub, hour, dur, color, at}]`, `tapAt`, `tapIndex` |
| `photos` | photo viewer: date/time header, image area to 0.6 H, toolbar icons | `img`/`src`, `date`, `time`, `imgBottom` |

Don't scale whole iOS screens up (`uiZoom`): left-aligned UI gets cut at the edge. Enlarge text with the scene's own props instead.

## iOS legacy (light-mode `src/scenes/Ios.tsx`; only `clock`, `black` and the Notes chrome remain mapped — the user found the old light inserts cheap)
| kind | look | props |
|---|---|---|
| `calendar` | day view, red date header, yellow/blue events, cyan tap ring | `month`, `day`, `events: [{title, hour, dur, color:"yellow"\|"blue", at}]`, `tapAt` |
| `timer` | dark iOS Clock timer counting down, orange ring, Cancel/Pause buttons | `seconds`, `endTime` "16:05", `drain` 0-1, `buttonsTop` pt |
| `clock` | frosted widget, hands sweep `spinHours` across the section, optional label below | `start` "10:10", `spinHours`, `label`, `labelAt` |
| `reminders` | periwinkle bg, frosted panel, sticky cards fly up | `title`, `cards: [{text, at, color?}]` |
| `photos` | Photos viewer, image with neon script words | `img` or `src`, `startFrom`, `lines: [{text, at, script?}]` |
| `black` | #090909 pause beat for `IOS_TYPE` captions | – |

App choice by meaning: time → `clock`/`calendar`, decision or rule → face with `chrome:"notes"`, conversation → `messages`, list/to-do → `reminders` or `checklist` captions, memory/emotion → `photos`, dramatic pause → `black`.

## KINETIC (dot grid #EDEDED + dashed arcs, plum accent)
| kind | look | props |
|---|---|---|
| `hero` | backdrop only; text from `KINETIC_HERO` lines | – |
| `poster` | 594×864 plum card, subject silhouette breaks out of the top, caption bottom-left | `img`, `silhouette` (default true = blacked out), `small`, `big`, `at` |
| `namecard` | 842×538 plum card, B/W cutout, giant first/last name around the head, timeline list grows down | `img`, `first`, `last`, `tag`, `items: [{text, at}]` |
| `cutout` | B/W cutout bottom-anchored 72% H with focus pull | `img` (pair with a hero line at y 0.17) |
| `emoji` | 300 px emoji standing on a plum pill | `emoji` (pair with a hero line at y 0.68) |
