"""Silence/filler cut driven by word timestamps (STYLE_GUIDE §2.2).

usage:
  python cut_silence.py INPUT words.json OUTDIR [--mode video|audio] [--max-gap 0.30] [--handle 0.10]
         [--drop "um,uh,erm"] [--remove "12-15,40"] [--crop auto|W:H:X:Y] [--focus-x 0.5]

Keeps every word; any gap between words longer than --max-gap is closed down to 2*handle.
--remove takes word-index ranges to delete (retakes, mistakes) - read transcript.txt first.
Outputs (OUTDIR):
  aroll.mp4        1080x1920 30 fps CFR, H.264 CRF 16 + AAC (video mode)
  voice.wav        48 kHz stereo voice track of the cut
  words_cut.json   words re-timed to the OUTPUT timeline (plan against these)
  transcript_cut.txt
  cuts.json        kept source segments
"""
import argparse, json, os, re, subprocess, sys

FFMPEG = "ffmpeg"


def norm(s):
    return re.sub(r"[^\w%']+", "", s.lower())


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip()
    if not out:
        return None
    w, h = out.split(",")[:2]
    return int(w), int(h)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("words")
    ap.add_argument("outdir")
    ap.add_argument("--mode", choices=["video", "audio"], default="video")
    ap.add_argument("--max-gap", type=float, default=0.30)
    ap.add_argument("--handle", type=float, default=0.10)
    ap.add_argument("--drop", default="um,uh,erm,uhm,hmm")
    ap.add_argument("--remove", default="")
    ap.add_argument("--crop", default="auto")
    ap.add_argument("--focus-x", type=float, default=0.5, help="horizontal centre of the 9:16 crop for landscape sources (0-1)")
    a = ap.parse_args()
    os.makedirs(a.outdir, exist_ok=True)
    words = json.load(open(a.words, encoding="utf-8"))
    drop = {norm(x) for x in a.drop.split(",") if x.strip()}
    removed = set()
    for part in filter(None, a.remove.split(",")):
        if "-" in part:
            x, y = part.split("-")
            removed.update(range(int(x), int(y) + 1))
        else:
            removed.add(int(part))
    keep = [dict(w, i=i) for i, w in enumerate(words) if i not in removed and norm(w["w"]) not in drop]
    if not keep:
        sys.exit("no words left")

    # build segments
    segs = []
    s0 = max(0.0, keep[0]["t"] - a.handle)
    cur = [keep[0]]
    for prev, w in zip(keep, keep[1:]):
        contiguous = (w["i"] == prev["i"] + 1) or (w["t"] - prev["e"] < 0.05)
        if w["t"] - prev["e"] > a.max_gap or not contiguous:
            end = prev["e"] + a.handle
            nxt = w["t"] - a.handle
            if nxt < end:  # gap shorter than 2*handle but non-contiguous: split in the middle
                end = nxt = (prev["e"] + w["t"]) / 2
            segs.append([s0, end, cur])
            s0, cur = nxt, [w]
        else:
            cur.append(w)
    segs.append([s0, keep[-1]["e"] + a.handle + 0.2, cur])  # 0.2 s extra tail room; compile trims to tail

    out_words, cuts, t_out = [], [], 0.0
    for s, e, ws in segs:
        for w in ws:
            out_words.append({"w": w["w"], "t": round(w["t"] - s + t_out, 3), "e": round(w["e"] - s + t_out, 3), "src": w["i"]})
        cuts.append({"src_from": round(s, 3), "src_to": round(e, 3), "out_from": round(t_out, 3)})
        t_out += e - s
    total = t_out

    # filter graph
    lines = []
    dims = probe(a.input) if a.mode == "video" else None
    vchain = ""
    if dims:
        W, Hh = dims
        if a.crop == "auto":
            if W / Hh > 9 / 16:  # too wide: crop width
                cw = int(Hh * 9 / 16) // 2 * 2
                x = int(min(max(0, a.focus_x * W - cw / 2), W - cw))
                vchain = f"crop={cw}:{Hh}:{x}:0,"
            elif W / Hh < 9 / 16:
                ch = int(W * 16 / 9) // 2 * 2
                vchain = f"crop={W}:{ch}:0:{(Hh-ch)//2},"
        else:
            cw, ch, x, y = a.crop.split(":")
            vchain = f"crop={cw}:{ch}:{x}:{y},"
        vchain += "scale=1080:1920:flags=lanczos,setsar=1,fps=30"
    n = len(segs)
    for k, (s, e, _) in enumerate(segs):
        d = e - s
        fade = min(0.012, d / 4)
        if dims:
            lines.append(f"[0:v]trim=start={s:.3f}:end={e:.3f},setpts=PTS-STARTPTS[v{k}];")
        lines.append(f"[0:a]atrim=start={s:.3f}:end={e:.3f},asetpts=PTS-STARTPTS,afade=t=in:d={fade:.3f},afade=t=out:st={d-fade:.3f}:d={fade:.3f}[a{k}];")
    if dims:
        lines.append("".join(f"[v{k}][a{k}]" for k in range(n)) + f"concat=n={n}:v=1:a=1[vc][ac];")
        lines.append(f"[vc]{vchain}[vout];[ac]aresample=48000,aformat=channel_layouts=stereo[aout]")
    else:
        lines.append("".join(f"[a{k}]" for k in range(n)) + f"concat=n={n}:v=0:a=1[ac];[ac]aresample=48000,aformat=channel_layouts=stereo[aout]")
    fg = os.path.join(a.outdir, "cut_filter.txt")
    open(fg, "w").write("\n".join(lines))
    if dims:
        cmd = [FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", a.input, "-/filter_complex", fg, "-map", "[vout]", "-map", "[aout]",
               "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "256k", os.path.join(a.outdir, "aroll.mp4")]
        subprocess.run(cmd, check=True)
        subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", os.path.join(a.outdir, "aroll.mp4"), "-vn", "-ac", "2", "-ar", "48000", os.path.join(a.outdir, "voice.wav")], check=True)
    else:
        subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", a.input, "-/filter_complex", fg, "-map", "[aout]", os.path.join(a.outdir, "voice.wav")], check=True)

    json.dump(out_words, open(os.path.join(a.outdir, "words_cut.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    json.dump({"segments": cuts, "duration": round(total, 3)}, open(os.path.join(a.outdir, "cuts.json"), "w"), indent=1)
    with open(os.path.join(a.outdir, "transcript_cut.txt"), "w", encoding="utf-8") as f:
        for i, w in enumerate(out_words):
            f.write(f"{i:4d} {w['t']:7.2f}-{w['e']:6.2f}  {w['w']}\n")
    src_span = words[-1]["e"] - words[0]["t"]
    gaps = [b["t"] - x["e"] for x, b in zip(out_words, out_words[1:])]
    print(f"segments={n} source_span={src_span:.2f}s output={total:.2f}s removed={src_span-total+0.2:.2f}s "
          f"words={len(out_words)} wps={len(out_words)/max(total,1e-6):.2f} max_gap={max(gaps) if gaps else 0:.2f}s")


if __name__ == "__main__":
    main()
