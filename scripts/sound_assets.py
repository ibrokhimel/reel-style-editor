"""Synthesize the sparse SFX kit and a fallback music bed (no downloads, no licences).

usage:
  python sound_assets.py sfx OUTDIR                      -> swish.wav tick.wav tap.wav pop.wav (peak -1 dBFS)
  python sound_assets.py bed OUT.wav --dur 25 --bpm 92 --mood chill|story|promo

The bed is a placeholder: a real instrumental from the user always sounds better. Moods follow STYLE_GUIDE §10.3:
  chill (LUX, ~92 BPM soft pulse), story (iOS, 120 BPM with a sub hit on every bar), promo (KINETIC, beat-less pad).
"""
import argparse, os, wave
import numpy as np

SR = 48000


def write(path, x, stereo=True):
    x = np.asarray(x, dtype=np.float64)
    pk = np.max(np.abs(x)) or 1
    x = x / pk * 10 ** (-1 / 20)
    if stereo and x.ndim == 1:
        x = np.stack([x, x], 1)
    data = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2 if stereo else 1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def band_noise(n, lo, hi, seed=0):
    rng = np.random.default_rng(seed)
    X = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, n)


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(t / max(a, 1e-4), 1) * np.exp(-np.maximum(t - a, 0) / max(d, 1e-4))


def sfx(outdir):
    os.makedirs(outdir, exist_ok=True)
    # swish 130 ms: band noise 3-10 kHz, rising then falling, stereo pan sweep
    n = int(0.13 * SR)
    x = band_noise(n, 3000, 10000, 1) * np.sin(np.linspace(0, np.pi, n)) ** 1.5
    pan = np.linspace(0.2, 0.8, n)
    write(os.path.join(outdir, "swish.wav"), np.stack([x * (1 - pan), x * pan], 1))
    # tick 30 ms: click + 2.2 kHz ping
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    x = band_noise(n, 2000, 9000, 2) * env(n, 0.0005, 0.004) + 0.6 * np.sin(2 * np.pi * 2200 * t) * env(n, 0.0005, 0.008)
    write(os.path.join(outdir, "tick.wav"), x)
    # tap 40 ms: soft UI tap
    n = int(0.04 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 1300 * t) * env(n, 0.001, 0.007) + 0.3 * band_noise(n, 1500, 6000, 3) * env(n, 0.0005, 0.003)
    write(os.path.join(outdir, "tap.wav"), x)
    # pop 60 ms: pitch drop 700->300 Hz
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    f = 700 - 400 * t / t[-1]
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.02)
    write(os.path.join(outdir, "pop.wav"), x)
    print("sfx ->", outdir)


def bed(out, dur, bpm, mood):
    n = int((dur + 1) * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(7)
    chords = [[110.0, 164.81, 196.0, 261.63], [87.31, 130.81, 174.61, 220.0], [130.81, 196.0, 246.94, 329.63], [98.0, 146.83, 196.0, 246.94]]  # Am7 Fmaj7 Cmaj7 G
    bar = 4 * 60 / bpm
    pad = np.zeros(n)
    for k in range(int(dur / (bar * 2)) + 2):
        ch = chords[k % 4]
        s0 = int(k * bar * 2 * SR)
        s1 = min(n, int((k + 1) * bar * 2 * SR + 0.5 * SR))
        if s0 >= n:
            break
        tt = np.arange(s1 - s0) / SR
        e = np.minimum(tt / 0.6, 1) * np.minimum(1, np.maximum(0, (s1 - s0) / SR - tt) / 0.5)
        for j, fr in enumerate(ch):
            det = 1 + 0.002 * (j - 1.5)
            pad[s0:s1] += e * (np.sin(2 * np.pi * fr * det * tt) + 0.3 * np.sin(2 * np.pi * fr * 2.003 * tt)) / 4
    pad *= 0.8 + 0.2 * np.sin(2 * np.pi * 0.25 * t)
    # soften pad: crude low-pass via FFT
    P = np.fft.rfft(pad)
    f = np.fft.rfftfreq(n, 1 / SR)
    P *= 1 / (1 + (f / 1800) ** 2)
    pad = np.fft.irfft(P, n)
    mix = pad * (0.5 if mood == "promo" else 0.4)
    if mood in ("chill", "story"):
        beat = 60 / bpm
        kick_n = int(0.35 * SR)
        kt = np.arange(kick_n) / SR
        kick = np.sin(2 * np.pi * (45 + 60 * np.exp(-kt * 30)) * kt) * np.exp(-kt * (9 if mood == "story" else 14))
        step = bar if mood == "story" else beat * 2
        for k in range(int(dur / step) + 1):
            s0 = int(k * step * SR)
            if s0 + kick_n < n:
                mix[s0 : s0 + kick_n] += kick * (1.0 if mood == "story" else 0.35)
        hat_n = int(0.05 * SR)
        hat = band_noise(hat_n, 6000, 12000, 9) * env(hat_n, 0.001, 0.012)
        for k in range(int(dur / beat) + 1):
            s0 = int((k * beat + beat / 2) * SR)
            if s0 + hat_n < n:
                mix[s0 : s0 + hat_n] += hat * 0.05
    mix = mix[: int(dur * SR)]
    fo = int(0.4 * SR)
    mix[-fo:] *= np.linspace(1, 0, fo)
    write(out, mix)
    print(f"bed -> {out} ({dur:.1f}s, {bpm} BPM, {mood})")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("what", choices=["sfx", "bed"])
    ap.add_argument("out")
    ap.add_argument("--dur", type=float, default=30)
    ap.add_argument("--bpm", type=float, default=92)
    ap.add_argument("--mood", default="chill")
    a = ap.parse_args()
    sfx(a.out) if a.what == "sfx" else bed(a.out, a.dur, a.bpm, a.mood)
