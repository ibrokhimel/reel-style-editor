"""Compile plan.json + words_cut.json -> PROJECT/public/edit.json, copy media, place SFX, and print a pacing report.

usage: python compile_edit.py plan.json words_cut.json PROJECT_DIR [--strict]

plan.json schema: see references/plan_schema.md. Times in the plan are OUTPUT-timeline seconds
(words_cut.json), or anchors:
  "w:12"          -> word #12 onset (minus a 4-frame lead for scene items, 2 frames for sections)
  "phrase text"   -> first match of that phrase at/after the section start
"""
import argparse, json, os, re, shutil, statistics, sys

FPS = 30
ROUND = lambda x: round(round(x * FPS) / FPS, 4)
LEAD_ITEM = 4 / FPS
LEAD_SECTION = 2 / FPS

DARK = {"face", "broll", "black", "image"}
BRIGHT = {"stat", "redsun", "framed", "collage", "messages", "calendar", "reminders", "photos", "clock", "hero", "poster", "namecard", "cutout", "emoji"}
APP_KINDS = {"timer", "messages", "reminders", "calendar", "photos"}
GRAPHIC_LUX = {"stat", "redsun", "framed", "collage"}
IOS_APPS = {"messages", "calendar", "clock", "reminders", "photos"}


def norm(s):
    return re.sub(r"[^\w%'+#$€£]+", "", s.lower())


class Ctx:
    def __init__(self, words):
        self.words = words
        self.nw = [norm(w["w"]) for w in words]

    def find(self, phrase, after=0.0):
        toks = [norm(t) for t in phrase.split() if norm(t)]
        if not toks:
            return None
        for i, w in enumerate(self.words):
            if w["t"] < after - 0.05:
                continue
            if self.nw[i : i + len(toks)] == toks:
                return i
        # fallback: match first token only
        for i, w in enumerate(self.words):
            if w["t"] >= after - 0.05 and self.nw[i] == toks[0]:
                return i
        return None

    def anchor(self, v, base=0.0, lead=LEAD_ITEM, relative_numbers=True):
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return ROUND(base + v if relative_numbers else v)
        v = str(v)
        if v.startswith("w:"):
            return ROUND(max(0, self.words[int(v[2:])]["t"] - lead))
        i = self.find(v, base)
        if i is None:
            raise ValueError(f"anchor not found: {v!r} after {base:.2f}s")
        return ROUND(max(0, self.words[i]["t"] - lead))


def walk_ats(obj, ctx, base, errs):
    """Resolve every key named at / *At inside scene props."""
    if isinstance(obj, dict):
        for k, v in list(obj.items()):
            if (k == "at" or k.endswith("At")) and not isinstance(v, (dict, list)):
                try:
                    obj[k] = ctx.anchor(v, base)
                except Exception as e:  # noqa
                    errs.append(str(e))
            else:
                walk_ats(v, ctx, base, errs)
    elif isinstance(obj, list):
        for x in obj:
            walk_ats(x, ctx, base, errs)


def copy_media(obj, public, copied):
    if isinstance(obj, dict):
        for k, v in list(obj.items()):
            if k in ("src", "img") and isinstance(v, str) and os.path.isfile(v):
                dst = os.path.join("media", os.path.basename(v))
                os.makedirs(os.path.join(public, "media"), exist_ok=True)
                if v not in copied:
                    shutil.copy2(v, os.path.join(public, dst))
                    copied[v] = dst
                obj[k] = copied[v].replace("\\", "/")
            else:
                copy_media(v, public, copied)
    elif isinstance(obj, list):
        for x in obj:
            copy_media(x, public, copied)


def chunk(ws, lo=2, hi=5, gap=0.25):
    out, cur = [], []
    for i, w in enumerate(ws):
        cur.append(w)
        end_punct = bool(re.search(r"[.,!?;:]$", w["w"]))
        nxt_gap = ws[i + 1]["t"] - w["e"] if i + 1 < len(ws) else 9
        if len(cur) >= hi or (len(cur) >= lo and (end_punct or nxt_gap > gap)) or (end_punct and w["w"][-1] in ".!?"):
            # a lone sentence-final word ("2.") joins the previous chunk instead of flashing on its own
            if out and len(cur) < lo and len(out[-1]) + len(cur) <= hi + 1 and cur[0]["t"] - out[-1][-1]["e"] < gap:
                out[-1] += cur
            else:
                out.append(cur)
            cur = []
    if cur:
        if out and len(cur) < lo and len(out[-1]) + len(cur) <= hi + 1:
            out[-1] += cur
        else:
            out.append(cur)
    return out


def W(w):
    d = {"w": w["w"], "t": w["t"], "e": w["e"]}
    for k in ("s", "c", "x"):
        if k in w:
            d[k] = w[k]
    return d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("plan")
    ap.add_argument("words")
    ap.add_argument("project")
    ap.add_argument("--strict", action="store_true", help="exit 1 on any pacing warning")
    a = ap.parse_args()
    a.plan, a.words, a.project = (os.path.abspath(x) for x in (a.plan, a.words, a.project))
    plan = json.load(open(a.plan, encoding="utf-8"))
    words = json.load(open(a.words, encoding="utf-8"))
    os.chdir(os.path.dirname(a.plan))  # relative media / audio paths in the plan resolve against the plan's folder
    # DEFAULT LOOK ("v2"): iOS base style, plain white captions, real dark-mode iPhone screens, glide zooms, real music/SFX.
    style = plan.get("style", "ios")
    cap_style = plan.get("caption_style", "clean")  # "clean" (default) | "styled" (legacy per-style presets)
    # transcript fixes: {"<word index>": "correct text"} - Whisper mishears names/English terms in other languages
    for k, txt in (plan.get("corrections") or {}).items():
        words[int(k)]["w"] = txt
    ctx = Ctx(words)
    public = os.path.join(a.project, "public")
    os.makedirs(public, exist_ok=True)
    errs, warns = [], []

    # ---- word flags: emphasis (serif / two-tier), colours, emoji ----
    emph_ranges = []  # (i0, i1, serif)
    for e in plan.get("emphasis", []):
        i = ctx.find(e["phrase"], ctx.anchor(e["after"], 0, 0, False) if e.get("after") is not None else 0)
        if i is None:
            errs.append(f"emphasis phrase not found: {e['phrase']!r}")
            continue
        n = len(e["phrase"].split())
        emph_ranges.append((i, i + n - 1, bool(e.get("serif"))))
        if e.get("serif"):
            for k in range(i, i + n):
                words[k]["s"] = True
    for c in plan.get("colors", []):
        i = ctx.find(c["word"], ctx.anchor(c["after"], 0, 0, False) if c.get("after") is not None else 0)
        if i is None:
            errs.append(f"colour word not found: {c['word']!r}")
        else:
            words[i]["c"] = c.get("c", "accent")
    for c in plan.get("emoji", []):
        i = ctx.find(c["word"], ctx.anchor(c["after"], 0, 0, False) if c.get("after") is not None else 0)
        if i is None:
            errs.append(f"emoji word not found: {c['word']!r}")
        else:
            words[i]["x"] = c["x"]

    last_e = words[-1]["e"] if words else 0
    duration = ROUND(plan.get("duration") or last_e + plan.get("tail", 0.3))

    # ---- sections ----
    secs = []
    for k, s in enumerate(plan["sections"]):
        try:
            st = 0.0 if k == 0 else ctx.anchor(s["at"], 0, LEAD_SECTION, relative_numbers=False)
        except Exception as e:  # noqa
            errs.append(str(e))
            continue
        secs.append(dict(s, id=s.get("id", f"s{k}"), **{"from": st}))
    secs.sort(key=lambda s: s["from"])
    for k, s in enumerate(secs):
        s["to"] = secs[k + 1]["from"] if k + 1 < len(secs) else duration
        s.pop("at", None)
        if s["to"] - s["from"] < 2 / FPS:
            warns.append(f"section {s['id']} shorter than 2 frames")
    for k, s in enumerate(secs):
        pr = s.setdefault("props", {})
        if s["kind"] in APP_KINDS and "enter" not in s:
            s["enter"] = "app"  # iOS app-launch transition
        if s["kind"] in APP_KINDS:
            for uk, uv in (plan.get("ui") or {}).items():  # localised UI labels (cancel, pause, tabs, back, add, month, days, edit, time, ...)
                pr.setdefault(uk, uv)
        if s["kind"] == "face" and pr.get("glide", True) and k > 0 and secs[k - 1]["kind"] == "face":  # glide is the default between consecutive face shots
            pp = secs[k - 1].get("props", {})
            pr["z0"] = pp.get("zoom", 1) + pp.get("push", 0.04)
            pr["x0"], pr["y0"] = pp.get("x", 0.5), pp.get("y", 0.35)
    copied = {}
    for s in secs:
        props = s.setdefault("props", {})
        walk_ats(props, ctx, s["from"], errs)
        copy_media(props, public, copied)

    # ---- captions ----
    caps = []

    def in_sec(s):
        return [W(w) for w in words if s["from"] - 0.05 <= w["t"] < s["to"] - 0.02]

    for s in secs:
        mode = s.get("captions", "auto")
        ws = in_sec(s)
        if mode == "none" or not ws:
            continue
        kind = s["kind"]
        if cap_style == "clean" and not s.get("lines"):
            out = [{"preset": "CLEAN", "words": ch, "from": ROUND(max(s["from"], ch[0]["t"] - LEAD_SECTION))} for ch in chunk(ws, 2, 4, 0.25)]
            for k, o in enumerate(out):
                o["to"] = out[k + 1]["from"] if k + 1 < len(out) else s["to"]
                if s.get("captionY") is not None:
                    o["y"] = s["captionY"]
            caps += out
            continue
        # explicit lines (any style)
        if s.get("lines"):
            cursor = s["from"]
            lines = []
            for ln in s["lines"]:
                obj = {"preset": ln.get("preset", "KINETIC_HERO" if style == "kinetic" else "LUX_TWOTIER")}
                for tier in ("small", "big", "pill", "words"):
                    if ln.get(tier):
                        i = ctx.find(ln[tier], cursor)
                        if i is None:
                            errs.append(f"caption text not found: {ln[tier]!r} after {cursor:.2f}")
                            continue
                        n = len(ln[tier].split())
                        obj[tier] = [W(w) for w in words[i : i + n]]
                        cursor = words[i + n - 1]["t"]
                if "rows" in ln:
                    obj["rows"] = []
                    for r in ln["rows"]:
                        i = ctx.find(r, cursor)
                        if i is None:
                            errs.append(f"row not found: {r!r}")
                            continue
                        n = len(r.split())
                        obj["rows"].append([W(w) for w in words[i : i + n]])
                        cursor = words[i + n - 1]["t"]
                for opt in ("bigInPill", "y"):
                    if opt in ln:
                        obj[opt] = ln[opt]
                tiers = [w for t in ("small", "big", "pill", "words") for w in obj.get(t, [])] + [w for r in obj.get("rows", []) for w in r]
                if not tiers:
                    continue
                obj["from"] = ROUND(min(w["t"] for w in tiers) - LEAD_SECTION)
                lines.append(obj)
            for k, obj in enumerate(lines):
                obj["to"] = lines[k + 1]["from"] if k + 1 < len(lines) else s["to"]
                obj["from"] = max(obj["from"], s["from"])
            caps += lines
            continue

        if style == "lux":
            if kind in GRAPHIC_LUX:
                continue
            if kind in ("broll", "image") or mode == "broll":
                caps.append({"preset": "LUX_BROLL_WORD", "from": s["from"], "to": s["to"], "words": ws})
                continue
            # face: karaoke chunks, emphasis -> two-tier
            idx = {(w["t"], w["w"]): j for j, w in enumerate(words)}
            out = []
            buf = []
            for w in ws:
                j = idx.get((w["t"], w["w"]))
                er = next((r for r in emph_ranges if r[0] <= j <= r[1]), None) if j is not None else None
                if er:
                    if j == er[0]:
                        small = buf[-3:]
                        rest = buf[:-3]
                        for ch in chunk(rest):
                            out.append({"preset": "LUX_KARAOKE", "words": ch})
                        buf = []
                        out.append({"preset": "LUX_TWOTIER", "small": small, "big": [w]})
                    else:
                        out[-1]["big"].append(w)
                else:
                    buf.append(w)
            for ch in chunk(buf):
                out.append({"preset": "LUX_KARAOKE", "words": ch})
            # restore time order (two-tier may precede trailing chunks only)
            for o in out:
                tw = o.get("words") or (o.get("small") or []) + o.get("big", [])
                o["from"] = ROUND(max(s["from"], tw[0]["t"] - LEAD_SECTION))
            out.sort(key=lambda o: o["from"])
            for k, o in enumerate(out):
                o["to"] = out[k + 1]["from"] if k + 1 < len(out) else s["to"]
            caps += out
        elif style == "ios":
            if kind in IOS_APPS:
                continue
            preset = {"pill": "IOS_PILL", "notes": "IOS_NOTES", "plain": "IOS_PLAIN", "checklist": "IOS_CHECKLIST"}.get(
                s.get("props", {}).get("captions", mode if mode != "auto" else ("notes" if s.get("props", {}).get("chrome") == "notes" else "plain")), "IOS_PLAIN")
            if kind == "black":
                preset = "IOS_TYPE"
            if preset == "IOS_CHECKLIST":
                rows = chunk(ws, 3, 7, 0.4)
                for k in range(0, len(rows), 2):
                    pair = rows[k : k + 2]
                    caps.append({"preset": preset, "rows": pair, "from": ROUND(max(s["from"], pair[0][0]["t"] - 0.25)), "to": None})
            elif preset in ("IOS_TYPE",):
                caps.append({"preset": preset, "words": ws, "from": s["from"], "to": s["to"]})
            else:
                hi = 6 if preset == "IOS_PILL" else 4
                for ch in chunk(ws, 2, hi):
                    caps.append({"preset": preset, "words": ch, "from": ROUND(max(s["from"], ch[0]["t"] - LEAD_SECTION)), "to": None})
            # close open captions
            open_ = [c for c in caps if c.get("to") is None]
            for k, c in enumerate(open_):  # each chunk holds until the next one (or the section end)
                c["to"] = open_[k + 1]["from"] if k + 1 < len(open_) else s["to"]
        else:  # kinetic auto: 1-3 word chunks, last word hero
            ydef = {"hero": 0.47, "cutout": 0.17, "emoji": 0.68}.get(kind)
            if ydef is None:
                continue
            out = []
            for ch in chunk(ws, 1, 3, 0.2):
                o = {"preset": "KINETIC_HERO", "small": ch[:-1], "big": ch[-1:], "y": ydef, "from": ROUND(max(s["from"], ch[0]["t"] - LEAD_SECTION))}
                out.append(o)
            for k, o in enumerate(out):
                o["to"] = out[k + 1]["from"] if k + 1 < len(out) else s["to"]
            caps += out
    caps.sort(key=lambda c: c["from"])

    # ---- SFX (sparse: STYLE_GUIDE §10.4) ----
    # Real sounds only: sfx_files in the plan, else audio/sfx.json written by fetch_audio.py. The synthetic kit
    # (sound_assets.py) is a last-resort fallback when neither exists.
    sfx_files = dict(plan.get("sfx_files") or {})
    kit = os.path.join(os.getcwd(), "audio", "sfx.json")
    if not sfx_files and os.path.isfile(kit):
        sfx_files = json.load(open(kit, encoding="utf-8"))
    sfx_files = {k: os.path.abspath(v) for k, v in sfx_files.items()}
    real = bool(sfx_files)
    sfx_mode = plan.get("sfx", "auto")
    sfx = []
    if isinstance(sfx_mode, list):
        for x in sfx_mode:
            ev = {"t": ctx.anchor(x["at"], 0, 0, False) + x.get("offset", 0), "type": x.get("type", "whoosh" if real else "swish")}
            if "gain" in x:
                ev["gain"] = x["gain"]
            sfx.append(ev)
    elif sfx_mode == "auto":
        cand = []  # (priority, time, type, gain_db)
        first_app = True
        for s in secs:
            pr = s.get("props", {})
            if real:
                if s["kind"] in APP_KINDS or s.get("enter") in ("whip", "slide", "app"):
                    cand.append((3, s["from"] - 0.15, "whoosh" if first_app else "whoosh2", -3 if first_app else -6))
                    first_app = False
                if s["kind"] == "timer":
                    cand.append((1, s["from"] + 0.3, "tick", -12))
                for b in pr.get("bubbles", []):
                    if not b.get("me"):
                        cand.append((2, b.get("at", s["from"]) + 0.1, "msg", -4))
                for it in pr.get("items", []):
                    if it.get("checkAt") is not None:
                        cand.append((2, it["checkAt"], "pop", -4))
                if pr.get("tapAt") is not None:
                    cand.append((2, pr["tapAt"], "click", -6))
            else:
                if s.get("enter") in ("whip", "slide", "iris", "pop", "app"):
                    cand.append((3, s["from"] - 0.06, "swish", 0))
                if s.get("invertFlash"):
                    cand.append((2, s["from"], "tick", 0))
                for b in pr.get("bubbles", []):
                    cand.append((1, b.get("at", s["from"]), "tap", 0))
        for c in caps:
            if c.get("bigInPill") and c.get("big"):
                cand.append((2, c["big"][0]["t"] - 0.1, "tick", 0))
        cand.sort(key=lambda x: (-x[0], x[1]))
        min_gap = plan.get("sfx_min_gap", 1.2)
        cap_n = int(0.24 * duration)  # QA limit is 0.25 sounds per second
        for pri, t, typ, g in cand:
            if len(sfx) < cap_n and all(abs(t - o["t"]) >= min_gap for o in sfx) and (typ in sfx_files or not real):
                ev = {"t": ROUND(max(0, t)), "type": typ}
                if g:
                    ev["gain"] = g
                sfx.append(ev)
        sfx.sort(key=lambda x: x["t"])
    if not real and sfx:
        print("WARN  no real SFX kit found (audio/sfx.json): using the synthetic placeholder sounds. Run scripts/fetch_audio.py for real ones.")

    edit = {
        "style": style,
        "duration": duration,
        "aroll": plan.get("aroll"),
        "audio": plan.get("audio", "mix.wav"),
        "watermark": plan.get("watermark"),
        "words": [W(w) for w in words],
        "sections": [{k: v for k, v in s.items() if k not in ("captions", "lines")} for s in secs],
        "captions": caps,
        "sfx": sfx,
        "music": os.path.abspath(plan["music"]) if plan.get("music") not in (None, "auto", "none") else plan.get("music", "auto"),
        "music_start": plan.get("music_start", 0),
        "sfx_files": sfx_files,
        "bed_db": plan.get("bed_db"),
    }
    if edit["aroll"] and os.path.isfile(edit["aroll"]):
        shutil.copy2(edit["aroll"], os.path.join(public, "aroll.mp4"))
        edit["aroll"] = "aroll.mp4"
    # ---- report (numbers from STYLE_GUIDE §2, §6.3, §8, §14) ----
    lens = [s["to"] - s["from"] for s in secs]
    broll_swaps = {w["t"] for c in caps if c["preset"] == "LUX_BROLL_WORD" for w in c["words"]}
    # tier onsets inside one caption also count as visual events (hero word lands, pill grows, checklist row appears)
    broll_swaps |= {c[k][0]["t"] for c in caps for k in ("big", "pill") if c.get(k)}
    broll_swaps |= {r[0]["t"] for c in caps for r in c.get("rows", []) if r}
    broll_swaps |= {w["t"] for c in caps if c["preset"] == "KINETIC_HERO" for w in c.get("small", [])}  # lead words pop in at 1.8x
    events = sorted({0.0} | {s["from"] for s in secs} | {c["from"] for c in caps} | broll_swaps | {round(x, 3) for s in secs for x in _ats(s.get("props", {}))})
    events = [e for e in events if e < duration]
    gaps = [(b - a_, a_) for a_, b in zip(events, events[1:] + [duration])]
    vci, vci_at = max(gaps) if gaps else (0, 0)
    first_change = next((e for e in events if e > 0), duration)
    face_max = max([s["to"] - s["from"] for s in secs if s["kind"] == "face"] or [0])
    trans = sum(1 for s in secs[1:] if s.get("enter", "cut") != "cut" or s.get("invertFlash") or s.get("exit", "none") != "none")
    accents = sum(1 for w in words if w.get("s") or w.get("c")) + sum(1 for c in caps if c["preset"] in ("LUX_TWOTIER", "KINETIC_HERO", "IOS_PILL"))
    tail = duration - last_e
    # luma runs
    run, run_start, prev_cls, longest_run = 0, 0, None, (0, 0)
    for s in secs:
        cls = "dark" if s["kind"] in DARK else "bright"
        if style == "kinetic":
            cls = "bright"
        if cls != prev_cls:
            run_start, prev_cls = s["from"], cls
        if s["to"] - run_start > longest_run[0]:
            longest_run = (s["to"] - run_start, run_start)
    print(f"duration {duration:.2f}s  sections {len(secs)}  captions {len(caps)}  sfx {len(sfx)}")
    if lens:
        print(f"section len mean {statistics.mean(lens):.2f}  median {statistics.median(lens):.2f}  min {min(lens):.2f}  max {max(lens):.2f}   (target mean 1.8-2.8)")
    print(f"max visual-change interval {vci:.2f}s at {vci_at:.2f}s   (<= 2.0)")
    print(f"first visual change {first_change:.2f}s   (<= 0.6)")
    print(f"longest face shot {face_max:.2f}s   (<= 5.1)")
    print(f"transitions per 10 s {10*trans/max(duration,1e-6):.1f}   (~4)")
    print(f"accents per 10 s {10*accents/max(duration,1e-6):.1f}   (>= 1)")
    print(f"longest same-luma run {longest_run[0]:.2f}s from {longest_run[1]:.2f}s   (<= 6 for lux/ios)")
    print(f"tail after last word {tail:.2f}s   (0.10-0.35)")
    for c in caps:
        if c.get("y") is not None and not (0.10 <= c["y"] <= 0.86):
            warns.append(f"caption y {c['y']} outside safe zone")
    if vci > 2.0:
        warns.append(f"visual-change gap {vci:.2f}s at {vci_at:.2f}s > 2.0 s: add a punch-in, caption tier, element or cut")
    if first_change > 0.6:
        warns.append(f"first visual change at {first_change:.2f}s > 0.6 s")
    if face_max > 5.1:
        warns.append(f"face shot {face_max:.2f}s > 5.1 s")
    if style != "kinetic" and longest_run[0] > 6:
        warns.append(f"no luma flip for {longest_run[0]:.2f}s from {longest_run[1]:.2f}s: insert a bright graphic")
    if not (0.1 <= tail <= 0.35):
        warns.append(f"tail {tail:.2f}s outside 0.10-0.35")
    edit["events"] = [round(e, 3) for e in events]
    json.dump(edit, open(os.path.join(public, "edit.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for e in errs:
        print("ERROR", e)
    for w in warns:
        print("WARN ", w)
    print(f"wrote {os.path.join(public, 'edit.json')}")
    if errs or (a.strict and warns):
        sys.exit(1)


def _ats(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if (k == "at" or k.endswith("At")) and isinstance(v, (int, float)):
                yield v
            else:
                yield from _ats(v)
    elif isinstance(obj, list):
        for x in obj:
            yield from _ats(x)


if __name__ == "__main__":
    main()
