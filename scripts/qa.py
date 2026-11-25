"""Numeric QA of a rendered reel against STYLE_GUIDE §14.

usage: python qa.py FINAL.mp4 PROJECT/public/edit.json
Prints PASS/FAIL per check and exits 1 if any FAIL.
"""
import json, re, subprocess, sys


def sh(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def main():
    mp4, ej = sys.argv[1], sys.argv[2]
    edit = json.load(open(ej, encoding="utf-8"))
    pr = sh(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate:format=duration", "-of", "default=nw=1", mp4]).stdout
    w = int(re.search(r"width=(\d+)", pr).group(1))
    h = int(re.search(r"height=(\d+)", pr).group(1))
    fr = re.search(r"r_frame_rate=(\d+)/(\d+)", pr)
    fps = int(fr.group(1)) / int(fr.group(2))
    dur = float(re.search(r"duration=([\d.]+)", pr).group(1))
    r = sh(["ffmpeg", "-hide_banner", "-nostats", "-i", mp4, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    s = r[r.rfind("Summary") :]
    I = float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1))
    lra = float(re.search(r"LRA:\s+([\d.]+) LU", s).group(1))
    m = re.search(r"Peak:\s+(-?[\d.]+) dBFS", s)
    tp = float(m.group(1)) if m else 0.0
    sc = sh(["ffmpeg", "-hide_banner", "-nostats", "-i", mp4, "-vf", "scale=180:320,select='gt(scene,0.25)',showinfo", "-an", "-f", "null", "-"]).stderr
    cuts = [float(x) for x in re.findall(r"pts_time:([\d.]+)", sc)]
    words = edit.get("words", [])
    last_e = words[-1]["e"] if words else dur
    events = edit.get("events") or sorted({0.0} | {x["from"] for x in edit["sections"]} | {c["from"] for c in edit["captions"]})
    gaps = [b - a for a, b in zip(events, events[1:] + [dur])]
    secs = [x["to"] - x["from"] for x in edit["sections"]]
    face = max([x["to"] - x["from"] for x in edit["sections"] if x["kind"] == "face"] or [0])
    first = min([e for e in events if e > 0] + [cuts[0] if cuts else 99])
    checks = [
        ("resolution 1080x1920", (w, h) == (1080, 1920), f"{w}x{h}"),
        ("fps 30", abs(fps - 30) < 0.01, f"{fps:.2f}"),
        ("duration 15-35 s", 15 <= dur <= 35, f"{dur:.2f}s"),
        ("text at frame 0", any(c["from"] <= 0.1 for c in edit["captions"]), ""),
        ("first visual change <= 0.6 s", first <= 0.6, f"{first:.2f}s"),
        ("max visual-change gap <= 2.0 s", max(gaps) <= 2.0, f"{max(gaps):.2f}s"),
        ("longest face shot <= 5.1 s", face <= 5.1, f"{face:.2f}s"),
        ("mean section 1.8-2.8 s", 1.8 <= sum(secs) / len(secs) <= 2.8, f"{sum(secs)/len(secs):.2f}s"),
        ("integrated -14 +-1 LUFS", abs(I + 14) <= 1, f"{I:.1f}"),
        ("true peak <= -1 dBFS", tp <= -0.9, f"{tp:.1f}"),
        ("LRA <= 4.5 LU", lra <= 4.5, f"{lra:.1f}"),
        ("tail 0.10-0.35 s after last word", 0.1 <= dur - last_e <= 0.4, f"{dur-last_e:.2f}s"),
        ("sfx <= 0.25/s", len(edit.get("sfx", [])) / dur <= 0.25, f"{len(edit.get('sfx', []))/dur:.2f}/s"),
    ]
    bad = 0
    for name, ok, val in checks:
        bad += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {name:36s} {val}")
    print(f"detected hard cuts in render: {len(cuts)} -> {', '.join(f'{c:.2f}' for c in cuts[:40])}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
