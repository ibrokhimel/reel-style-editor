"""Download REAL sound effects (and optionally a music track) from Mixkit (https://mixkit.co, Mixkit License:
free for commercial use, no attribution). Nothing is downloaded without --yes: run without it to see the file list + sizes,
tell the user what will be fetched, then re-run with --yes.

usage:
  python fetch_audio.py OUTDIR                       # list the default SFX kit and music candidates with sizes
  python fetch_audio.py OUTDIR --yes                 # download the SFX kit  -> OUTDIR/*.mp3 + OUTDIR/sfx.json
  python fetch_audio.py OUTDIR --yes --music 33      # also download Mixkit music track id 33 -> OUTDIR/music_33.mp3
  python fetch_audio.py OUTDIR --yes --music 33,175  # several candidates (compare with music_info.py)

Put OUTDIR at <work folder>/audio: compile_edit.py picks up audio/sfx.json automatically, and mix.py uses the plan's `music`.
Finding other tracks: browse https://mixkit.co/free-stock-music/ (tag pages such as /tag/corporate/); the number in the
preview URL (assets.mixkit.co/music/<ID>/<ID>.mp3) is the --music id. Sound effects: https://mixkit.co/free-sound-effects/.
"""
import argparse, json, os, sys, urllib.request

BASE = "https://assets.mixkit.co/"
# name -> (mixkit sfx id, what it is used for)
SFX = {
    "whoosh": (1492, "cinematic whoosh fast transition - first/big app open"),
    "whoosh2": (1490, "fast whoosh transition - later app opens, scene swipes"),
    "tick": (1063, "fast wall clock ticking - timer / clock scenes (use quietly, -12 dB)"),
    "msg": (2354, "message pop alert - received chat bubble"),
    "pop": (3005, "light pop - checkbox filled / item ticked"),
    "click": (2568, "cool interface click tone - tap on a calendar event / button"),
}
MUSIC = {
    1167: "Close Up (corporate, ~95 s)",
    175: "Digital Clouds (chillout, ~101 s)",
    766: "Lo-Fi 04 (~164 s)",
    33: "Motivating Mornings (upbeat corporate, 123 BPM, ~96 s)",
}


def sfx_url(i):
    return f"{BASE}active_storage/sfx/{i}/{i}-preview.mp3"


def music_url(i):
    return f"{BASE}music/{i}/{i}.mp3"


def size(url):
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "reel-style-editor"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return int(r.headers.get("Content-Length", 0))
    except Exception:
        return -1


def get(url, dst):
    req = urllib.request.Request(url, headers={"User-Agent": "reel-style-editor"})
    with urllib.request.urlopen(req, timeout=60) as r, open(dst, "wb") as f:
        f.write(r.read())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("outdir")
    ap.add_argument("--yes", action="store_true", help="actually download (ask the user first)")
    ap.add_argument("--music", default="", help="comma-separated Mixkit music ids to download too")
    a = ap.parse_args()
    music_ids = [int(x) for x in a.music.split(",") if x.strip()]
    plan = [(f"{n}.mp3", sfx_url(i), d) for n, (i, d) in SFX.items()] + [(f"music_{i}.mp3", music_url(i), MUSIC.get(i, "music track")) for i in music_ids]
    total = 0
    print("Mixkit License - free for commercial use, no credit needed. Files:")
    for name, url, desc in plan:
        sz = size(url)
        total += max(sz, 0)
        print(f"  {name:16s} {sz/1024:8.0f} KB  {desc}")
    print(f"  total ~{total/1048576:.1f} MB from assets.mixkit.co")
    if not music_ids:
        print("Music candidates (add with --music ID):", "; ".join(f"{k}: {v}" for k, v in MUSIC.items()))
    if not a.yes:
        print("\nNot downloading (no --yes). Tell the user what will be fetched, then re-run with --yes.")
        return
    os.makedirs(a.outdir, exist_ok=True)
    kit = {}
    for name, url, _ in plan:
        dst = os.path.join(a.outdir, name)
        get(url, dst)
        if name[:-4] in SFX:
            kit[name[:-4]] = os.path.abspath(dst).replace("\\", "/")
        print("ok", dst, os.path.getsize(dst))
    json.dump(kit, open(os.path.join(a.outdir, "sfx.json"), "w"), indent=1)
    print("wrote", os.path.join(a.outdir, "sfx.json"))


if __name__ == "__main__":
    sys.exit(main())
