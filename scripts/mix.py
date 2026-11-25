"""Final audio mix (STYLE_GUIDE §10): voice + ducked music bed + sparse SFX -> -14 LUFS, -1 dBTP.

usage: python mix.py PROJECT_DIR --voice voice.wav [--music track.mp3|auto|none] [--bed-db -9]

Reads PROJECT/public/edit.json (duration, style, sfx list), writes PROJECT/public/mix.wav.
Bed level: music integrated loudness = voice loudness + bed_db (default -9 dB for a real track).
Music and SFX should be REAL files (plan `music`, `sfx_files` / audio/sfx.json from fetch_audio.py); the synthesized
bed and kit from sound_assets.py are only a last-resort placeholder and print a warning.
Ducking: sidechain compressor keyed by the voice (~-4 dB under speech, attack 30 ms, release 250 ms).
SFX: peak set 6 dB under the voice peak.
"""
import argparse, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def lufs(path):
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"])
    s = r.stderr[r.stderr.rfind("Summary") :]
    i = float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1))
    m = re.search(r"Peak:\s+(-?[\d.]+|-inf) dBFS", s)
    pk = float(m.group(1)) if m and m.group(1) != "-inf" else -1.0
    lra = float(re.search(r"LRA:\s+([\d.]+) LU", s).group(1))
    return i, pk, lra


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--voice", required=True)
    ap.add_argument("--music", default=None)
    ap.add_argument("--bed-db", type=float, default=None)
    a = ap.parse_args()
    pub = os.path.join(a.project, "public")
    edit = json.load(open(os.path.join(pub, "edit.json"), encoding="utf-8"))
    dur = edit["duration"]
    style = edit["style"]
    music = a.music or edit.get("music") or "auto"
    bed_db = a.bed_db if a.bed_db is not None else (edit.get("bed_db") or -9.0)
    work = os.path.join(a.project, "tmp", "audio")
    os.makedirs(work, exist_ok=True)

    sfxdir = os.path.join(work, "sfx")
    if not edit.get("sfx_files") and edit.get("sfx") and not os.path.isfile(os.path.join(sfxdir, "swish.wav")):
        print("WARN  using the SYNTHETIC placeholder SFX kit - run fetch_audio.py to get real sounds")
        subprocess.run([sys.executable, os.path.join(HERE, "sound_assets.py"), "sfx", sfxdir], check=True)
    if music == "auto":
        print("WARN  using the SYNTHETIC placeholder music bed - pass a real track (plan `music` or --music)")
        mood, bpm = {"lux": ("chill", 92), "ios": ("story", 120), "kinetic": ("promo", 90)}[style]
        music = os.path.join(work, "bed.wav")
        subprocess.run([sys.executable, os.path.join(HERE, "sound_assets.py"), "bed", music, "--dur", str(dur + 0.5), "--bpm", str(bpm), "--mood", mood], check=True)
    elif music == "none":
        music = None

    vI, vPk, _ = lufs(a.voice)
    inputs = ["-i", a.voice]
    fc = [f"[0:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={dur:.3f},atrim=0:{dur:.3f}[v]", "[v]asplit=2[vmix][vkey]"]
    mix_in = ["[vmix]"]
    idx = 1
    if music:
        # loop + trim to length, measure, gain to target
        mtmp = os.path.join(work, "music_fit.wav")
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(edit.get("music_start", 0)), "-stream_loop", "-1", "-i", music, "-t", f"{dur:.3f}", "-af", f"afade=t=out:st={max(0,dur-0.4):.3f}:d=0.4", "-ar", "48000", "-ac", "2", mtmp], check=True)
        mI, _, _ = lufs(mtmp)
        gain = (vI + bed_db) - mI
        inputs += ["-i", mtmp]
        fc.append(f"[{idx}:a]volume={gain:.2f}dB[m]")
        fc.append("[m][vkey]sidechaincompress=threshold=0.04:ratio=4:attack=30:release=250:makeup=1[mduck]")
        mix_in.append("[mduck]")
        idx += 1
        print(f"voice {vI:.1f} LUFS, music {mI:.1f} LUFS -> gain {gain:+.1f} dB (bed {bed_db:+.1f} dB under voice)")
    else:
        fc.append("[vkey]anullsink")
    sfx_gain = (vPk - 6) - (-1)
    for k, s in enumerate(edit.get("sfx", [])):
        f = edit.get("sfx_files", {}).get(s["type"]) or os.path.join(sfxdir, f"{s['type']}.wav")
        if not os.path.isfile(f):
            print("missing sfx", s["type"], f)
            continue
        inputs += ["-i", f]
        ms = int(max(0, s["t"]) * 1000)
        r = run(["ffmpeg", "-hide_banner", "-i", f, "-af", "volumedetect", "-f", "null", "-"]).stderr
        fpk = float(re.search(r"max_volume: (-?[\d.]+) dB", r).group(1)) if "max_volume" in r else -1.0
        g = (vPk - 6) - fpk + s.get("gain", 0)  # SFX peak 6 dB under the voice peak, plus per-event trim
        fc.append(f"[{idx}:a]aresample=48000,aformat=channel_layouts=stereo,volume={g:.2f}dB,adelay={ms}|{ms}[x{k}]")
        mix_in.append(f"[x{k}]")
        idx += 1
    fc.append("".join(mix_in) + f"amix=inputs={len(mix_in)}:normalize=0:duration=first[pre]")
    pre = os.path.join(work, "premix.wav")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "[pre]", "-ar", "48000", pre], check=True)

    # two-pass loudnorm to -14 LUFS / -1 dBTP / LRA 4
    r = run(["ffmpeg", "-hide_banner", "-i", pre, "-af", "loudnorm=I=-14:TP=-1.0:LRA=4:print_format=json", "-f", "null", "-"])
    js = json.loads(r.stderr[r.stderr.rfind("{") : r.stderr.rfind("}") + 1])
    ln = (f"loudnorm=I=-14:TP=-1.0:LRA=4:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
          f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    out = os.path.join(pub, "mix.wav")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", pre, "-af", ln + ",alimiter=limit=0.89:level=false", "-ar", "48000", out], check=True)
    I, pk, lra = lufs(out)
    print(f"mix -> {out}: {I:.1f} LUFS, peak {pk:.1f} dBFS, LRA {lra:.1f} LU, sfx {len(edit.get('sfx', []))}")


if __name__ == "__main__":
    main()
