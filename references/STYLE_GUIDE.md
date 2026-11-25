# Reels Editing Style Guide — measured from 3 references

Measurement basis of the `reel-style-editor` skill, taken from three short vertical reels (not distributed here). Every number below was **measured** (ffprobe, ffmpeg scene detection, per-frame strips at 30 fps, pixel sampling, k-means palettes, STFT audio analysis, Whisper word timestamps) unless marked `≈` (visual estimate) or `RULE` (derived instruction).

All positions are **normalized** (0–1) to the *edited video canvas*, then converted to **1080×1920** px. Reference A and B are "showcase" layouts (raw vs edited side by side); only the **edited card** was measured. The showcase wrapper itself is documented in §13 as an optional format.

---

## 0. Source inventory

| Ref | Source | Container | Res | FPS | Dur (s) | Video kbps | Audio | Integrated loudness | LRA |
|---|---|---|---|---|---|---|---|---|---|
| A "Luxury-minimal talking head" | (short-form reel) | H.264 | 576×1024 (edited card = 290×514 inside) | 30 | 30.07 | 207 | AAC 44.1k st, 32 kbps | **−13.0 LUFS** | 3.1 LU |
| B "iOS-UI podcast clip" | (short-form reel) | HEVC | 720×1280 (edited card = 400×704 inside) | 30 | 21.97 | 209 | AAC 44.1k st, 65 kbps | **−18.8 LUFS** | 4.5 LU |
| C "Purple kinetic-type promo" | (short-form reel) | H.264 | 576×1024 full-frame | 29.97 | 18.26 | 190 | AAC 44.1k st, 32 kbps | **−15.0 LUFS** | 2.4 LU |

Output spec RULE: **1080×1920, 30 fps CFR, H.264 High, CRF 16–18, yuv420p, AAC 48 kHz 320 kbps, 15–35 s** (refs: 18.3 / 22.0 / 30.1 s, mean 23.4 s).

---

## 1. Three style DNA strands (what to blend)

| Strand | Ref | One-line definition | Use when |
|---|---|---|---|
| **LUX** | A | Low-key warm talking head ↔ high-key paper-texture typographic slides, bold grotesk + italic serif pairing, blur-in words | Expert / educational / personal-brand talking head |
| **iOS** | B | Each sentence re-skinned as a native iPhone app (Messages, Notes, Calendar, Clock, Reminders, Photos), captions change style per "app" | Storytelling clip, podcast excerpt, emotional narrative |
| **KINETIC** | C | Pure motion-graphics on light-grey dot grid, one purple accent, pills + cards + cutouts + emoji, huge bold-italic words | Voice-over promo, ad, list/joke format, intro/outro |

RULE: one video = one **base strand** + max 2 borrowed devices from other strands. Never mix all three palettes.

---

## 2. Pacing (numbers)

### 2.1 Shot / section lengths

Hard cuts detected (`select=gt(scene,0.25)` + manual frame review):

| Ref | Section boundaries (s) | # sections | Mean len | Median | Min | Max |
|---|---|---|---|---|---|---|
| A | 0, 0.60, 4.30, 6.20, 8.25, 10.67, 14.20, 16.20, 19.75, 23.00, 24.93, 27.17, 28.73 | 13 | **2.31 s** | 2.20 s | 0.60 s | 3.70 s |
| B | 0, 1.75, 3.75, 4.75, 6.00, 8.00, 13.10, 14.70, 15.90, 18.40 | 10 | **2.20 s** | 1.88 s | 1.00 s | 5.10 s |
| C | 0, 1.25, 2.75, 10.70, 12.55, 14.10, 16.60 | 7 | 2.61 s | 1.66 s | 1.25 s | 7.95 s* |

\*C's 7.95 s section is a single name-card that **adds a new element every 1.0–2.0 s** (list items at 4.25, 6.40, 8.25, 9.00, 9.85 s), so visual change interval stays ≤2 s.

RULE — **Visual change interval (VCI)**: something new must happen on screen at least every **2.0 s** (target mean 1.2 s). "New" = cut, new caption tier, new element, punch-in, or style switch. Measured micro-event rate (caption word reveals + elements): A ≈ 2.6 events/s, B ≈ 3.0/s, C ≈ 2.7/s.

RULE — **First cut ≤ 0.6 s** (A cuts at 0.60 s from hook face to a full-screen stat slide; C changes layout at 0.50 s; B adds "?" doodles at 0.75 s).

RULE — **Longest uninterrupted face shot: 5.1 s** (B Notes section) and only if captions change every ≤ 0.75 s inside it.

### 2.2 Speech rate & silence

| Ref | Words | Speech span | Words/s | WPM | Mean word dur | Gaps > 0.25 s | Longest gap |
|---|---|---|---|---|---|---|---|
| A | 77 | 29.7 s | **2.59** | 155 | 0.362 s | 3 | 0.34 s |
| B | 80 | 21.9 s | **3.66** | 220 | 0.235 s | 6 | 0.76 s |
| C | 48 | 18.0 s | **2.66** | 160 | 0.262 s | 11 | 0.54 s |

RULES:
- Talking head (A-style): **remove every silence > 0.30 s**, leave 0.08–0.15 s handles before/after words. Result ≈ 2.6 words/s, max gap 0.34 s.
- Story clip (B-style): allow up to **0.6–0.8 s** gaps only at a section/app change (gaps at 3.64, 12.54, 19.68 s coincide with transitions).
- Voice-over promo (C-style): deliberate **0.26–0.54 s breaths** after each punch line so the animation lands (11 gaps in 18 s ≈ 1 per 1.6 s).
- Never speed-ramp voice above 1.15×; B's 3.66 w/s is natural fast speech.

### 2.3 Sync offsets (visual vs audio)

| Event | Measured | RULE |
|---|---|---|
| C list item appears vs spoken word | items visible 0.0–0.39 s **before** the word, mean ≈ 0.15 s | Element **lead = 4 frames (0.13 s)** before word onset |
| A/B word caption appear vs word onset | within ±2 frames | Caption word **starts its animation 2 frames before** onset, fully legible at onset |
| Section change vs sentence boundary | A: 9/12 cuts within 0.25 s of a sentence/clause start | Cut on the first syllable of the new clause, −2 frames |
| B section change vs music grid | boundaries at 1.75, 3.75, 6.00, 8.00, 13.10, 14.70, 15.90, 18.40 → all within ±0.25 s of a 0.5 s (120 BPM) beat | Snap transitions to nearest beat if within ±0.25 s; else snap to speech |

---

## 3. Canvas grid & safe zones (1080×1920)

Measured caption/element placement (normalized y = center of text block):

| Element | Ref | y-center | y-range | x-center | Width | → px (y-center) |
|---|---|---|---|---|---|---|
| Hook caption on face | A | 0.56 | 0.543–0.580 | 0.45 | 27% | 1075 |
| Single line on face | A | 0.56 | 0.549–0.576 | 0.46 | 43% | 1075 |
| Two-tier caption block | A | 0.55 | 0.506–0.593 | 0.47–0.50 | 28–36% | 1056 |
| B-roll single word | A | **0.50** | 0.488–0.512 | 0.50 | 5% | 960 |
| Stat slide number | A | 0.44 | 0.409–0.465 | 0.50 | ~60% | 845 |
| Stat slide sub-line | A | 0.54 | 0.525–0.558 | 0.50 | ~60% | 1037 |
| Title over cutout | A | 0.26 | 0.19–0.38 | 0.55 | ~55% | 500 |
| Blue pill caption | B | 0.74 | 0.705–0.771 | 0.65 (pill) | 62% | 1421 |
| Notes yellow caption | B | 0.69 | 0.668–0.706 | 0.53 | 68% | 1325 |
| Plain white caption | B | 0.635 | 0.614–0.655 | 0.50 | 55% | 1219 |
| Checklist captions | B | 0.71 / 0.79 | 0.688–0.855 | 0.47 | 76–79% | 1363 / 1517 |
| Black-screen typing | B | 0.48 | 0.470–0.489 | left-aligned x=0.21 | — | 922 |
| Hero word | C | 0.44–0.50 | 0.42–0.56 | 0.50 | 60–80% | 845–960 |
| Name card | C | 0.36 | 0.21–0.50 | 0.50 | 78% | 690 |

RULES:
- **Primary caption band: y 0.50–0.78** (960–1500 px). Face-over captions live at **chest level, just under the chin, above any mic** (A: 0.56; B: 0.64–0.74).
- **Never place text below y 0.86** (1650 px) — platform UI. **Never above y 0.10** except UI-mock headers.
- Horizontal safe margin: **x 0.08–0.92** (86–994 px). Max caption width **80% W** (864 px).
- B-roll / full-screen graphics: center captions at **y 0.50 dead center**.
- Faces: eyes at **y 0.28–0.36** (A talking head ≈ 0.30; B close-up ≈ 0.33).

---

## 4. Subtitle presets (the core)

Sizes are font-size in px on a 1080×1920 canvas, derived from measured bbox width ÷ char count and bbox height (≈ ±10%).

### 4.1 `LUX_KARAOKE` (A, talking head)
- **Font**: bold neo-grotesk, tight. Use *Inter Tight ExtraBold* / *Helvetica Now Display Bold* / *Neue Haas Grotesk Display 65*.
- **Size**: 50–60 px (hook 60 px). Letter-spacing **−3%**, word-spacing **−15%** (words nearly touch: "ofmystudents" look).
- **Color**: `#F5F7FB` (measured mean of glyph pixels `#F2F4F8`–`#F5F7FB`), no stroke.
- **Shadow**: 0 4 px, blur 14 px, `#000` @ 45%.
- **Chunk**: one line, **2–5 words**, sentence-case, keep punctuation ("So, which one is it?").
- **Reveal**: per word. Unrevealed words **not drawn**; current word animates **blur 10→0 px, opacity 0→1, y +6→0 px over 6 frames** (ease-out cubic). Previous words stay solid. Line is laid out at full width from frame 0 (no re-centering jump).
- **Out**: whole line cuts away with the next line (hard), or blur-out 4 frames on section change.

### 4.2 `LUX_TWOTIER` (A, emphasis lines)
- **Small tier** (setup words): 36–40 px, same grotesk, `#F4F1EF`, tracking −2%. Sits **directly above** big tier, gap 0.1 em, left-aligned to big tier's left edge or centered.
- **Big tier** (payload words): **2.3–3.4× small** → 88–130 px.
  - Normal payload: grotesk ExtraBold 88 px ("behind the style", "genius part", "the execution").
  - **Emotional / premium word**: *italic display serif* 120–130 px ("magic", "luxurious", "admire") — *Instrument Serif Italic* / *Playfair Display Italic* / *Bodoni Moda Italic*.
- **Ghost effect**: big tier words not yet spoken are drawn at **opacity 0.25, blur 3 px** (visible at 12.0 s "behind ~~the~~" and 13.5 s "~~amazes~~"), then snap to 100% on onset (4 frames).
- Ratio: ~1 big-tier line per 2.5 s of talking head; 1 serif-italic word per ~10 s (A: 3 serif words in 30 s).

### 4.3 `LUX_BROLL_WORD` (A, over B-roll)
- **One word at a time**, lowercase, 40–44 px, grotesk Medium, `#F0ECEC`, center **(0.50, 0.50)**.
- Each word on screen for its spoken duration (mean 0.36 s), hard swap, no animation, soft shadow 0 2 12 @ 50%.
- Rationale: quiet text so B-roll reads.

### 4.4 `IOS_PILL` (B, hook)
- Rounded rectangle **670×130 px**, radius 14 px, fill `#2C46BF` (measured) with vertical gradient `#3B57D9`→`#2338A6`, inner 1 px highlight `#FFFFFF` @ 20%.
- Text: SF Pro Text Medium (fallback *Inter Medium*) **50 px**, `#E5F0FD`, left padding 40 px.
- Position: y-center **0.74** (1421 px), slightly overhangs right edge (x 0.34–0.96).
- In: pill wipes in left→right with motion blur **6 frames**; text types per word with **blur 6→0 px, 3 frames/word**.
- Doodle accents: white hand-drawn "?" marks pop around the head (scale 0→1.1→1.0, 5 frames, staggered 3 frames), 2 per side.

### 4.5 `IOS_NOTES_GLOW` (B, Notes-app section)
- Text: SF Pro Text Regular **≈84 px**, fill `#E8C92F` (measured), **outer glow** same color, blur 18 px @ 70% + blur 40 px @ 35%.
- Background treatment: Notes UI chrome in Notes yellow (`#E3B92E`): top "‹ All iCloud" + "⋯", bottom toolbar icons; **faint CRT scanlines** (1 px dark lines every 3 px @ 8%); bottom gradient (see §6.2).
- Position y-center **0.69**. Chunks **2–4 words**, 0.5–1.0 s each (mean 0.75 s), inline emoji allowed at end of chunk (🍺, scale-pop 0→1, 4 frames).
- Swap: outgoing chunk blurs 0→8 px and drifts **up 2.5% H (48 px)** while fading over 6 frames; incoming does reverse from +48 px.

### 4.6 `IOS_CHECKLIST` (B, outro)
- Rows: hollow diamond icon (◇, 2.5 px white stroke, 44 px) + text SF Pro **≈70 px** `#F5E8EF`.
- Row 1 y 0.71, row 2 y 0.79 (row pitch **0.08 H = 154 px**), wraps centered.
- **Keyword color coding**: positive word `#5DD238` (green), negative word `#C83544` (red), rest white. Colored word fades from 30% → 100% when spoken.
- Each row: icon appears first (scale-pop 4 frames), text types per word, words start at 30% opacity → 100% on onset.

### 4.7 `IOS_TYPE_BLACK` (B, pause beat)
- Full black `#090909` screen, white `#DDDDDD` SF Pro **≈44 px**, **left-aligned** at x 0.21, y 0.48.
- Typing per word with trailing "…" — used for 1.0 s on dramatic "So I decided…".

### 4.8 `KINETIC_HERO` (C)
- Font: **heavy grotesk italic**, condensed-ish, tracking **−5%** (*Inter Display Black Italic* / *Helvetica Now Display XBlack Italic* / *Archivo Black + skew −8°*).
- Color: text `#43294A`–`#54385B` (deep plum, measured), on `#EDEDED` bg.
- Sizes: hero word **130–200 px**, small lead-in words **36–44 px** stacked above-left ("the" / "allrounder", "that's" / "my job", "let's make" / "something"), ratio **≈4–5×**.
- Two-tone hierarchy inside one word group: lead-in words in lighter plum `#8A7391` @ 80%.
- **Pill label**: key word inside a plum pill (fill gradient `#35183E`→`#5D256D`, radius 50% of height, padding 0.35 em × 0.6 em), white text, soft shadow 0 18 36 `#000` @ 22% (e.g. "problem?", "JOHNY", "good.").
- Shadow on free text: 0 10 24 `#2A1A30` @ 30%.

---

## 5. Typography system

| Role | Family (ref look) | Free substitute | Weight | Tracking | Case |
|---|---|---|---|---|---|
| Body caption | Neo-grotesk | Inter Tight | 700–800 | −3% | sentence |
| Big payload | Neo-grotesk display | Inter Display | 800–900 | −4 to −6% | lower |
| Premium accent | Didone/transitional italic serif | Instrument Serif Italic | 400 | 0 to −2% | lower |
| UI captions (iOS) | SF Pro | Inter | 400–500 | 0 | sentence |
| Kinetic hero | Grotesk black italic | Inter Display Black Italic | 900 | −5% | lower (names UPPER in pill) |
| Script neon | Brush/handwritten italic | Dancing Script / Yellowtail | 400 | 0 | Title |

Scale ratios measured: small:big = **1 : 2.3–3.4 (A)**, **1 : 4–5 (C)**, stat number : sub-line = **1 : 3.5** (A "90%" ≈150 px vs "of my students" ≈40 px).

Max on-screen words at once: **5** (talking head), **6** (two-tier total), **2** (hero), **10** (checklist, 2 rows).

---

## 6. Color

### 6.1 Palettes (k-means, 6 clusters, % of frame area)

**A — LUX**
- Talking head (dark, warm): `#0A0505` 42% · `#1C171A` 19% · `#432B13` 12% · `#303750` 11% · `#7A5839` 8% · `#C0A38A` 7%. Mean RGB 47/37/33, **luma 39/255**, sat 0.57.
- Paper slide: `#E9E6E3` 44% · `#F7F5F4` 23% · `#EFEDEB` 15% · `#DFDDDA` 12% · text `#4A4848`. **Luma 226**, sat 0.02.
- Red-circle accent: **`#BF0203`** (18% of frame) on `#EFE9E4`, subject in dark suit `#15161B`.
- Sepia collage: `#F3EFEB` · `#C3B9A4` · `#A49574` · `#725E36` · `#2F2517`.
- Number gradient (top→bottom of glyph): `#302E2A` → `#474543` → `#767573` (dark charcoal fading to grey).

**B — iOS**
- Face grade: `#1F1719` 37% · `#54343B` 21% · `#726D67` 19% · `#9D5A5F` 11% · `#E29494` 8% (magenta-pink skew from bottom gradient).
- iMessage: `#FDFDFD` 76% · `#EDEDEE` · bubble blue **`#0578FA`** · grey bubble `#E9E9EB`.
- Black typing: `#090909`.
- Clock: grey radial `#DADFEE` center → `#7F838D` edge.
- Reminders: periwinkle `#B3C0E8` / `#C4CBE1` / `#BCC5E5`, notes `#FAFAFB`.
- Wrapper bg: `#E9E4E3`.

**C — KINETIC**
- Bg `#EDEDED`–`#EFEFEF` (luma 234–237) + dot grid.
- Plum ramp: `#301838` (darkest) · `#35183E` (card TL) · `#411D4E` · `#431D50` · `#5D256D` (card BR, lit corner) · text `#43294A` / `#54385B` · light `#938199` / `#A69AA9`.
- Photos inside cards: **fully desaturated B/W** (sat 0.01) — the only chroma on screen is plum (+ emoji yellow `#E2AB0E`).

### 6.2 Grade & overlays (numbers)

| Look | Luma mean | p5 / p95 | Sat | Recipe RULE |
|---|---|---|---|---|
| A talking head | 38–46 | 1 / 152 | 0.57–0.65 | Low-key: `eq=brightness=-0.06:contrast=1.15:saturation=0.95`, warm `colorbalance=rs=.06:gs=.02:bs=-.06`, crush blacks to ≤10, vignette 25% |
| A paper slides | 226 | 165 / 247 | 0.02 | Off-white `#E9E6E3` + paper grain 3% + **gobo shadow overlay** (window-blind diagonal stripes at **−35°**, stripe period ≈ 9% W, multiply @ 12–18%; alt: palm-leaf shadow) |
| B face | 70–88 | 15 / 155 | 0.33–0.42 | **Bottom gradient**: from y 0.55 transparent → y 1.0 `#1A1012` @ 85%, with magenta tint `#9D5A5F` @ 20% at y 0.7. Mild contrast +8% |
| B Notes | 51 | 8 / 120 | 0.42 | Darken −25% + scanlines + yellow UI |
| C | 196–236 | — | 0.01–0.11 | Flat light grey, all photos B/W (`hue=s=0`), contrast +10% on cutouts |

### 6.3 Luma rhythm (measured, 4 fps samples)

A alternates dark footage ↔ bright graphics:
`38 → 230 (0.5–4.3 s) → 38 → 117 → 165 → 38 → 33 → 180 → 40 → 210 (1-frame flash) → 40 → 30`
→ **7 dark↔bright flips in 30 s, one every 4.3 s**; delta ≈ **+120 to +190 luma**.

B: `75 → 245 → 10 → 75 → 233 → 51 → 161 → 199 → 152 → 72` → **9 flips in 22 s, one every 2.4 s**.

C: stays bright 146–237, dips only for the silhouette card (146–151).

RULE: in LUX/iOS base, insert a **high-key graphic every 3–5 s** so luma swings ≥ 100 units. Never two consecutive sections with |Δluma| < 30 for more than 6 s.

---

## 7. Motion library (frame counts @30 fps)

| ID | Ref | Measured behaviour | Frames | Easing RULE |
|---|---|---|---|---|
| `blur_in_word` | A | glyph blur ≈12 px→0, opacity 0→1 (visible f7, sharp f14 after cut) | **8** (0.27 s) | easeOutCubic |
| `char_reveal` | A | "it's the" builds char by char | ≈20 chars/s (1.5 f/char) | linear |
| `subject_focus_pull` | A | cutout subject blur→sharp right after cut | **5** | easeOutQuad |
| `number_build` | A | "9"→"90"→"90%" each glyph blur-in, staggered | 3 f stagger, 11 f total | easeOutCubic |
| `pill_grow` | C | pill starts as 4 px vertical bar, grows W then H to full, text blurred inside | **10** (0.33 s) | easeOutBack (overshoot 6%) |
| `label_shrink` | C | lead-in words scale 1.8→1.0 and move up to sit above pill | **8** | easeInOutCubic |
| `card_whip_out` | C | card scale 1→1.6 + rotateY ≈20° + directional motion blur | **5** | easeInQuart |
| `card_pop_in` | C | next card scale 0.4→1.0 with blur 20→0 | **6** | easeOutBack |
| `list_item_add` | C | bullet dot + 1 px connector line extends down, text fades in L→R | 6 (line) + 6 (text) | easeOutCubic |
| `iris_wipe` | B | black circle grows from dot at (0.40, 0.55) to cover frame | **8** (0.27 s) | easeInCubic |
| `iris_reveal` | B | black circle shrinks off-center revealing next shot | 6 | easeOutCubic |
| `doodle_pop` | B | "?" marks scale 0→1.1→1 | 5, stagger 3 | easeOutBack |
| `chunk_swap_drift` | B | out: blur 0→8 px, y −48 px, fade; in: reverse | 6 | easeInOutSine |
| `ui_slide` | B | iOS screen slides in from right with blur | 6–8 | easeOutQuint |
| `invert_flash` | A | 1-frame color-negative frame at cut (4.25 s, 23.0 s) | **1–2** | — |
| `defocus_dissolve` | A | outgoing blurs to ~30 px while incoming un-blurs | 6–8 | easeInOutSine |
| `dashed_arc_drift` | C | grey dashed arcs (`#9A9A9A`, 3 px, dash 14/10) drift continuously | ~40 px/s | linear, infinite |
| `punch_in` | A/B | talking-head scale jump on new clause (wide → tight) | 0 (cut) | scale 1.00 ↔ 1.15–1.25 |
| `slow_push` | A/B | continuous push on face shots | per section | +3–5% scale per 2 s |

Global motion energy (mean abs frame diff, 36×64 luma): **p50 / p90 = A 5.5/38.7, B 8.3/55.1, C 3.9/28.7**. RULE: keep p50 ≤ 9 (calm base) with spikes at transitions (p90 ≥ 28). The style is **calm between cuts, violent at cuts**.

---

## 8. Transition inventory & frequency

| Transition | Where | Count in ref | RULE frequency |
|---|---|---|---|
| Hard cut | all | A 8, B 3, C 1 | default (≈60%) |
| Blur-in after hard cut (subject focus pull) | A | 3 | after every cut to a graphic |
| Invert / negative flash (1–2 f) | A 4.25, 23.0 s | 2 | max 1 per 12 s, only face→B-roll |
| Defocus dissolve | A 19.5 s, B 18.5 s | 2 | returning to talking head after graphic |
| Iris (circle) wipe black | B 3.75 s, 4.75 s | 2 | before/after a "dramatic pause" black card |
| Whip / card fly-through | C 2.6 s, 10.7 s, B 7.9 s (white bar swipe) | 3 | between two graphic scenes |
| UI slide (screen push) | B 1.75, 6.0, 14.7 s | 3 | between two app mock-ups |
| Collapse-to-pill / morph | C 1.2 s, 14.3 s | 2 | element morphs into the next scene's container |

Measured mix: hard-type cuts ≈ 50%, animated ≈ 50%. Transitions per 10 s: A 4.0, B 4.1, C 3.8 → RULE **≈ 4 per 10 s**.

---

## 9. Visual devices / scene templates

### LUX (A)
1. **Stat slide** — paper bg + gobo shadow, huge number with charcoal→grey vertical gradient + echo shadow (blurred copy 8 px below @ 35%), sub-line mixes grotesk + one serif-italic word. Duration 3.7 s.
2. **Red-sun cutout** — background-removed subject (bottom-anchored, 60% H), behind it a `#BF0203` circle Ø ≈ 0.95 W centered at subject's head (y ≈ 0.55), extra small red circles bleeding off edges (top-right Ø 0.25 W, bottom-left Ø 0.15 W). Title stack top third. 2.0 s.
3. **Framed clip on paper** — 16:9 clip inset W 0.90, rounded 12 px, shadow 0 20 40 @ 35%, name title above (grotesk 64 px), caption below (24 px). Clip enters blurred. 2.3 s.
4. **Sepia collage** — paper, a rounded `#C3B9A4` sepia panel, cutout person overlapping a navy square, headline grotesk bold 70 px + script/serif overlay word, tiny paragraph text. Multiple sub-cuts every 0.6–1.2 s.
5. **B-roll** with single-word captions (warm, low-key, 2.0–3.5 s each).
6. Persistent tiny watermark bottom-center y 0.93, white @ 60%, 22 px.

### iOS (B)
1. **Messages** thread (light mode), bubbles typed live — 2.0 s.
2. **Black typing beat** — 1.0 s.
3. **Calendar** day view with event highlight (yellow `#F7E58A`, blue `#CFE7F7`), tapped by a cursor ring (cyan `#33C1E8` ring with white center) — 2.0 s.
4. **Notes** dark mode over face — 5.1 s.
5. **Clock** widget on grey radial gradient, hands sweep — 1.6 s.
6. **Reminders / sticky notes** cards fly in onto a frosted panel, periwinkle bg — 1.2 s.
7. **Photos** viewer with script neon word over photo — 2.5 s.
8. Face + **checklist** captions — 3.6 s.
RULE: one "app" per sentence; app chosen by sentence meaning (time → Clock/Calendar, decision → Notes, conversation → Messages, list → Reminders/Checklist, memory/emotion → Photos).

### KINETIC (C)
1. **Text-only opener** on dot grid (0–1.25 s).
2. **Silhouette poster card** (portrait 0.55 W × 0.45 H, plum gradient, subject silhouette breaks out of the top edge by 15% of card height), caption bottom-left inside card.
3. **Name card + timeline list** (card 0.78 W × 0.28 H, B/W cutout centered, giant name split around the head, subtitle "not an editor" tiny right-aligned), vertical 1 px plum line with dots and labels (30 px) growing downward, item pitch ≈ 0.034 H (66 px).
4. **Hero word** alone (1.9 s).
5. **B/W bodybuilder cutout** bottom-anchored, filling 70% H, pill + hero text above.
6. **Emoji on pill** (Apple-style emoji 0.25 W standing on a plum pill, laptop overlapping) + hero text below.
7. **End card**: "let's make / **something** / [good.] pill" — 1.6 s, no CTA button, just the line.

Dot grid RULE: dots ≈ 3 px Ø, `#D6D6D6` on `#EDEDED`, pitch ≈ 24 px at 1080 w (≈ visual), with a radial fade (grid visible center, 40% at edges).

---

## 10. Audio

### 10.1 Loudness & dynamics (measured)

| Ref | Integrated | LRA | RMS p10 / p50 / p90 (dBFS, 100 ms) | Spectral centroid |
|---|---|---|---|---|
| A | −13.0 LUFS | 3.1 LU | −22.1 / −14.2 / −9.1 | 2755 Hz |
| B | −18.8 LUFS | 4.5 LU | −28.0 / −18.0 / −13.9 | 1645 Hz |
| C | −15.0 LUFS | 2.4 LU | −27.8 / −16.9 / −11.0 | 2848 Hz |

RULE master: **−14 LUFS integrated, ≤ −1.0 dBTP, LRA 2.5–4.5 LU** (heavy compression):
```
loudnorm=I=-14:TP=-1.0:LRA=4
```
Voice chain RULE: HPF 80 Hz → de-ess 6–8 kHz (−4 dB) → compressor 4:1, attack 5 ms, release 80 ms, −18 dB thr → presence +2 dB @ 3.5 kHz (A/C centroid ≈ 2.8 kHz = bright, forward voice).

### 10.2 Band energy (% of total power)

| Ref | Sub < 60 | Bass 60–250 | Low-mid 250–2k | Presence 2–6k | Air 6k+ |
|---|---|---|---|---|---|
| A | 5.2 | 34.9 | 48.6 | 6.1 | 5.0 |
| B | **27.0** | 28.2 | 43.1 | 1.2 | 0.2 |
| C | 4.3 | **52.6** | 28.4 | 5.7 | 7.9 |

Reading: A = balanced bright VO + light bed; B = podcast audio dull (presence 1.2%) + **deep sub-bass music bed**; C = warm, bassy VO-forward promo with crisp air.

### 10.3 Music bed

| Ref | Bed level vs voice (energy in word gaps vs in words) | Bass 40–200 Hz, speech/gap | Tempo (onset autocorrelation) | Character |
|---|---|---|---|---|
| A | **−8.3 dB** | 36.8 / 31.4 dB | ~92 BPM, weak (0.195) | soft, low pulse, ambient |
| B | **−4.7 dB** | 35.6 / 32.8 dB | strong periodic hits every **2.00 s** (4.97, 6.97, 8.96, 10.96, 12.96, 14.95, 16.95, 18.97, 20.97) → 120 BPM, accent each bar | emotional sub-bass beat |
| C | **−9.3 dB** | 37.7 / 26.1 dB | no stable tempo (strength 0.023) | ambient / corporate pad |

RULES:
- Bed sits **8–9 dB under voice** for talking/VO (A, C); **5 dB under** for emotional story (B).
- Sidechain duck bed **−4 dB** under speech, attack 30 ms, release 250 ms.
- Tempo: **88–96 BPM** chill (LUX/KINETIC) or **120 BPM / 60 BPM half-time** with sub (iOS story).
- Bed starts at frame 0 (no silent intro), ends with a 0.3–0.5 s tail after last word (C last word ends 18.02 s, file ends 18.26 s → **0.24 s tail**; A 0.35 s; B 0.11 s).
- Choose instrumental, no vocals, minimal high-hat (air band from music ≈ 0 in B).

### 10.4 SFX (measured = sparse)

Non-speech high-frequency events (> median + 15 dB in 4 kHz+ band, outside words):

| Ref | Events (s) | Duration | Density |
|---|---|---|---|
| A | 24.80 | 0.10 s | 0.03/s |
| B | 13.00 (at clock transition) | 0.03 s | 0.05/s |
| C | 4.12 (card change), 8.14, 10.38 (whip), 11.30 (hero word) | 0.03–0.14 s | 0.22/s |

Reading: **SFX are subtle, short (30–140 ms) ticks/swishes tied to the biggest transitions only** — no constant whoosh-on-every-cut. Most "hits" in the waveform are voice plosives and music.

RULES:
- **≤ 1 SFX per 4 s** (≈ 0.25/s max).
- Types: soft *swish* (80–150 ms, band 3–10 kHz) on whip/card transitions; *tick/click* (30 ms) on pill/element pop; *UI tap* on iOS mock-ups (Messages send "swoosh", keyboard taps under typing).
- Level: SFX peak **−6 dB below voice peak**; never mask a word (place in gaps ≥ 0.2 s or at word end).
- No risers, no booms, no meme sounds.

---

## 11. Narrative structure templates (timed)

### A — LUX talking head (30 s)
| t (s) | Beat | Visual |
|---|---|---|
| 0.0–0.6 | Hook words 1–2 ("More than…") | face + `LUX_KARAOKE` |
| 0.6–4.3 | Stat claim | full-screen **stat slide** |
| 4.3–6.2 | Question to viewer | invert flash → face |
| 6.2–10.7 | Answer + name drop | red-sun cutout → framed clip on paper |
| 10.7–14.2 | "But the secret…" (curiosity) | face + `LUX_TWOTIER` |
| 14.2–19.8 | Explanation | B-roll words → sepia collage (3 sub-cuts) |
| 19.8–23.0 | "Genius part…" | defocus dissolve → face two-tier |
| 23.0–28.7 | Process | invert flash → 3 B-roll shots (1.9 / 2.2 / 1.6 s) |
| 28.7–30.1 | Payoff word | face + serif-italic big word ("magic"), end |

### B — iOS story (22 s)
Problem (pill + doodles) → evidence (Messages) → pause (iris → black typing) → decision (cursor/Calendar) → rule (Notes glow, 5 s) → time passes (Clock) → result (Reminders) → peak emotion (Photos + neon script) → benefits (checklist, green/red keywords) → end on last word.

### C — KINETIC promo (18 s)
Question hook (0–1.25) → hero intro card (1.25–2.75) → reveal name (2.75–4.25) → list build every 0.7–2.0 s (4.25–10.7) → label word (10.7–12.5) → exaggeration visual (12.5–14.1) → twist/self-reference (14.1–16.6) → slogan end card (16.6–18.3).

Universal RULES:
- Hook text on screen at **frame 0** (all three refs show text at t=0).
- Payoff / slogan occupies the **last 1.4–1.7 s**; video ends ≤ 0.35 s after last word (no outro, loop-friendly).
- One **name/brand reveal** at 25–35% of runtime (A 7.9 s/26%, C 3.0 s/17%).

---

## 12. Skill config (machine-readable defaults)

```yaml
canvas: {w: 1080, h: 1920, fps: 30}
pacing:
  max_visual_change_interval_s: 2.0
  target_events_per_s: 2.7
  first_cut_max_s: 0.6
  section_len_s: {mean: 2.3, min: 0.6, max: 5.1}
  transitions_per_10s: 4
  silence_cut_threshold_s: {talking_head: 0.30, story: 0.60, voiceover: 0.55}
  word_handle_s: 0.10
  element_lead_frames: 4
  caption_lead_frames: 2
  end_tail_s: [0.1, 0.35]
safe_zone: {x: [0.08, 0.92], y: [0.10, 0.86], caption_band_y: [0.50, 0.78]}
captions:
  LUX_KARAOKE:   {font: "Inter Tight ExtraBold", size: 56, color: "#F5F7FB", tracking: -0.03, y: 0.56, words: [2,5], anim: blur_in_word, anim_frames: 6, shadow: "0 4 14 #000000 45%"}
  LUX_TWOTIER:   {small: {size: 38, color: "#F4F1EF"}, big: {size: [88,130], serif_italic_for: emotional_word}, y: 0.55, ghost_opacity: 0.25}
  LUX_BROLL_WORD:{size: 42, color: "#F0ECEC", y: 0.50, words: 1}
  IOS_PILL:      {pill: {w: 670, h: 130, r: 14, fill: ["#3B57D9","#2338A6"]}, text: {font: "Inter Medium", size: 50, color: "#E5F0FD"}, y: 0.74}
  IOS_NOTES_GLOW:{font: "Inter", size: 84, color: "#E8C92F", glow: [[18,0.7],[40,0.35]], y: 0.69, words: [2,4], swap: chunk_swap_drift}
  IOS_CHECKLIST: {size: 70, color: "#F5E8EF", positive: "#5DD238", negative: "#C83544", rows_y: [0.71, 0.79]}
  KINETIC_HERO:  {font: "Inter Display Black Italic", hero: [130,200], lead: [36,44], color: "#43294A", lead_color: "#8A7391", tracking: -0.05, y: 0.47}
colors:
  lux:     {dark_bg: "#0A0505", paper: "#E9E6E3", accent: "#BF0203", ink: "#302E2A", sepia: "#C3B9A4"}
  ios:     {blue: "#0578FA", pill: "#2C46BF", notes_yellow: "#E8C92F", green: "#5DD238", red: "#C83544", periwinkle: "#B3C0E8", black: "#090909"}
  kinetic: {bg: "#EDEDED", plum_dark: "#301838", plum: "#43294A", plum_lit: "#5D256D", plum_light: "#938199", emoji_yellow: "#E2AB0E"}
luma_rhythm: {flip_every_s: [2.4, 4.3], min_delta: 100}
audio:
  master: {lufs: -14, true_peak: -1.0, lra: 4}
  bed_under_voice_db: {talking: -8.5, story: -5}
  duck_db: -4
  bed_bpm: {chill: [88,96], story: 120}
  sfx_max_per_s: 0.25
  sfx_len_ms: [30, 150]
  sfx_peak_below_voice_db: -6
```

---

## 13. Optional: showcase wrapper (how A & B present the edit)

Not part of the edit itself; use only if the user asks for a "before/after portfolio" post.

- **A wrapper**: bg near-black `#0A0A0A`–`#131313` with soft diagonal light streak; "Our Work" label (white bold grotesk, x 0.31, y 0.16) over edited card at x 0.06–0.56, y 0.18–0.68 (rounded 24 px); "Original" smaller label over B/W raw card (x 0.62–0.92, y 0.18–0.48); handle line "DM @…" + "for video editing" at y 0.70; **editor timeline screenshot** bottom (y 0.71–0.95) with playhead moving in sync.
- **B wrapper**: bg `#E9E4E3`; "Raw" card left (x 0.04–0.48, y 0.24–0.56, rounded 20 px), "Edited" card right larger and overlapping (x 0.41–0.96, y 0.18–0.62), labels black grotesk above each, handle `#BDB8B5` at y 0.83.

---

## 14. QA checklist (numeric pass/fail)

- [ ] Text visible at frame 0.
- [ ] First visual change ≤ 0.6 s.
- [ ] No interval > 2.0 s without a visual event; no single shot > 5.1 s.
- [ ] Mean section length 1.8–2.8 s.
- [ ] Silences > 0.30 s removed (talking head).
- [ ] Captions inside y 0.50–0.78 (face) or 0.50 (B-roll); nothing below y 0.86.
- [ ] Max 5 words per caption line; ≥ 1 accent word (serif-italic / colored / pill) per 10 s.
- [ ] Luma flip (Δ ≥ 100) at least every 5 s (LUX/iOS).
- [ ] ≈ 4 transitions per 10 s; invert flash ≤ 1 per 12 s.
- [ ] Integrated −14 LUFS ±1, TP ≤ −1 dBTP, LRA ≤ 4.5.
- [ ] Bed 5–9 dB under voice, ducked; SFX ≤ 0.25/s, each ≤ 150 ms.
- [ ] Video ends ≤ 0.35 s after last word.

---

## 15. Measurement method (to re-run on new references)

```bash
# cuts
ffmpeg -i in.mp4 -vf "select='gte(scene,0)',metadata=print:file=scene.txt" -an -f null -
# contact sheet 4 fps with timestamps
ffmpeg -i in.mp4 -vf "fps=4,scale=180:320,drawtext=text='%{pts\:flt}':fontsize=18:fontcolor=yellow,tile=8x4" sheet_%02d.jpg
# loudness
ffmpeg -i in.mp4 -af ebur128=peak=true -f null -
# raw audio for numpy STFT
ffmpeg -i in.mp4 -ac 1 -ar 22050 -f f32le audio.f32
# words
faster-whisper small, word_timestamps=True
```
Palettes: k-means k=6 on 108×192 downscale. Caption geometry: color-threshold masks → row segments → bbox normalized to the edited canvas.
