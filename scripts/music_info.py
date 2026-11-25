"""Analyse music tracks so you can pick one and place its drop on the edit's first scene change.

usage: python music_info.py TRACK [TRACK ...] [--target 2.7] [--length 34]

For each track prints tempo (BPM, from bass-onset autocorrelation), mean loudness, a per-2-second energy curve,
the biggest energy rise ("drop") in the first 60 s, and the best `--length`-second window (high, steady energy).
With --target T (seconds on the edit timeline, usually the first scene change) it prints the value for the plan:

    "music_start": <drop time - T>

so the track's drop lands exactly on that cut. Prefer tracks with steady energy (low std), 90-125 BPM, no vocals.
"""
import argparse, os, subprocess, sys
import numpy as np

SR = 22050


def load(path, start=0.0, dur=None):
    cmd = ["ffmpeg", "-loglevel", "error", "-ss", str(start)] + (["-t", str(dur)] if dur else []) + ["-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True).stdout, np.float32)


def analyse(path, target, length):
    x = load(path)
    hop, N = 512, 2048
    fr = 1 + (len(x) - N) // hop
    idx = np.arange(N)[None, :] + hop * np.arange(fr)[:, None]
    S = np.abs(np.fft.rfft(x[idx] * np.hanning(N), axis=1))
    fq = np.fft.rfftfreq(N, 1 / SR)
    flux = np.r_[0, np.maximum(0, np.diff(np.log1p(S[:, fq < 200]), axis=0)).sum(1)]
    e = flux - flux.mean()
    ac = np.correlate(e, e, "full")[len(e) - 1:]
    lag = np.arange(len(ac)) / (SR / hop)
    m = (lag > 60 / 180) & (lag < 60 / 70)
    bpm = 60 / lag[m][np.argmax(ac[m])]
    n = len(x) // SR
    db = 20 * np.log10(np.sqrt((x[: n * SR] ** 2).reshape(n, SR).mean(1)) + 1e-9)
    # drop = largest rise of the 2 s mean over the previous 2 s mean, within the first 60 s
    lim = min(len(db) - 2, 60)
    rise = [(db[t : t + 2].mean() - db[max(0, t - 2) : t].mean(), t) for t in range(2, lim)]
    drop = max(rise)[1] if rise else 0
    win = min(int(length), len(db))
    best = max(range(0, max(1, len(db) - win)), key=lambda s: db[s : s + win].mean() - 0.5 * db[s : s + win].std())
    print(f"{os.path.basename(path)}: {len(x)/SR:.0f}s  bpm~{bpm:.0f}  mean {db.mean():.1f} dB  centroid {int(((S*fq).sum(1)/(S.sum(1)+1e-9)).mean())} Hz")
    print("  energy/2s:", " ".join(f"{v:.0f}" for v in db[::2][:60]))
    print(f"  biggest rise (drop) at ~{drop}s (+{max(rise)[0]:.1f} dB)" if rise else "  no drop found")
    print(f"  best {win}s window starts at {best}s (mean {db[best:best+win].mean():.1f} dB, std {db[best:best+win].std():.1f})")
    if target is not None:
        print(f'  -> plan: "music_start": {max(0.0, drop - target):.2f}   (drop {drop}s lands on edit time {target}s)')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tracks", nargs="+")
    ap.add_argument("--target", type=float, default=None, help="edit time of the first scene change (s)")
    ap.add_argument("--length", type=float, default=34)
    a = ap.parse_args()
    for t in a.tracks:
        analyse(t, a.target, a.length)


if __name__ == "__main__":
    sys.exit(main())
