"""Word-level transcript with faster-whisper.

usage: python transcribe.py INPUT OUTDIR [--model small] [--lang en]
writes OUTDIR/words.json  [{"w": str, "t": start_s, "e": end_s}]
       OUTDIR/transcript.txt  (index, time, word per line - what you read to plan the edit)
"""
import argparse, json, os, sys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("outdir")
    ap.add_argument("--model", default="small")
    ap.add_argument("--lang", default=None)
    a = ap.parse_args()
    os.makedirs(a.outdir, exist_ok=True)
    from faster_whisper import WhisperModel

    m = WhisperModel(a.model, device="cpu", compute_type="int8")
    segs, info = m.transcribe(a.input, word_timestamps=True, language=a.lang, vad_filter=False)
    words = []
    for s in segs:
        for w in s.words or []:
            txt = w.word.strip()
            if txt:
                words.append({"w": txt, "t": round(w.start, 3), "e": round(w.end, 3)})
    json.dump(words, open(os.path.join(a.outdir, "words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    with open(os.path.join(a.outdir, "transcript.txt"), "w", encoding="utf-8") as f:
        for i, w in enumerate(words):
            f.write(f"{i:4d} {w['t']:7.2f}-{w['e']:6.2f}  {w['w']}\n")
    dur = words[-1]["e"] - words[0]["t"] if words else 0
    print(f"language={info.language} words={len(words)} span={dur:.2f}s wps={len(words)/max(dur,1e-6):.2f}")


if __name__ == "__main__":
    sys.exit(main())
