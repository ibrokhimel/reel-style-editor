"""Render the Reel composition.

usage:
  python render.py PROJECT_DIR --preview            -> out/preview.mp4 at 0.5 scale + out/preview_sheet.jpg (4 fps contact sheets)
  python render.py PROJECT_DIR [--out out/final.mp4] [--scale 1]   -> final H.264 CRF 17, AAC 320k

Remotion copies public/ into a webpack bundle in TEMP on every render and never deletes it.
This script points TEMP/TMP at PROJECT/tmp and removes its own bundle folders afterwards, so the
system drive does not fill up. Keep public/ small (only media this edit uses).
"""
import argparse, glob, os, shutil, subprocess, sys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--out", default=None)
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--frames", default=None, help="e.g. 0-150 to render a range")
    a = ap.parse_args()
    p = os.path.abspath(a.project)
    tmp = os.path.join(p, "tmp")
    os.makedirs(tmp, exist_ok=True)
    os.makedirs(os.path.join(p, "out"), exist_ok=True)
    env = dict(os.environ, TEMP=tmp, TMP=tmp, TMPDIR=tmp)
    out = a.out or os.path.join("out", "preview.mp4" if a.preview else "final.mp4")
    scale = 0.5 if a.preview else a.scale
    npx = "npx.cmd" if os.name == "nt" else "npx"
    cmd = [npx, "remotion", "render", "src/index.ts", "Reel", out, "--codec", "h264", "--crf", "20" if a.preview else "17",
           "--pixel-format", "yuv420p", "--audio-codec", "aac", "--audio-bitrate", "320k", "--scale", str(scale), "--log", "error"]
    if a.frames:
        cmd += ["--frames", a.frames]
    try:
        subprocess.run(cmd, cwd=p, env=env, check=True)
    finally:
        for d in glob.glob(os.path.join(tmp, "remotion-webpack-bundle-*")) + glob.glob(os.path.join(tmp, "puppeteer_dev_chrome_profile-*")) + glob.glob(os.path.join(tmp, "remotion-*")):
            shutil.rmtree(d, ignore_errors=True)
    full = os.path.join(p, out)
    print("rendered", full)
    if a.preview:
        sheet = os.path.join(p, "out", "preview_sheet_%02d.jpg")
        # timestamp overlay needs a font file; look in the usual places and skip the overlay if none exists
        font = next((f for f in ("C:/Windows/Fonts/arial.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf",
                                 "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/dejavu/DejaVuSans.ttf") if os.path.isfile(f)), None)
        vf = "fps=4,scale=180:320"
        if font:
            fp = font.replace(":", "\\:")
            vf += f",drawtext=fontfile='{fp}':text='%{{pts\\:flt}}':x=3:y=3:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.8"
        vf += ",tile=8x4"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", full, "-vf", vf, "-q:v", "3", sheet], check=False)
        print("contact sheets:", sheet.replace("%02d", "NN"), "(open with Read + limit=1)")


if __name__ == "__main__":
    sys.exit(main())
