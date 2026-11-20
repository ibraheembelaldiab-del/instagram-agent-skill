#!/usr/bin/env python3
"""
voiceover.py - read a Reel script out loud with a free voice, on your own
computer. No account, no credits, no upload.

Two engines, both free and offline:
  kokoro  (default) the more human one. https://github.com/thewh1teagle/kokoro-onnx
  piper   smaller and faster, flatter.  https://github.com/OHF-Voice/piper1-gpl

One beat per paragraph, the same script format beats.py reads. Every beat is
timed from the audio it actually produced, so the video lines up with the voice.

Tone tags
  A flat voice reads every line the same way, which is what makes it sound
  dead. Put a tag at the start of a paragraph to change how that line is said:

    [hook]     faster, higher, louder. The first line.
    [hype]     excited, a bit faster and higher
    [serious]  slower and lower, for the line that has to land
    [warm]     relaxed, slightly slower. The payoff and the ask.
    [fast]     quick aside
    [pause]    half a second of silence before the line. Combine: [pause][warm]

Usage
  python3 voiceover.py script.txt
  python3 voiceover.py script.txt --voice bm_george --speed 1.1
  python3 voiceover.py script.txt --voice en_GB-alan-medium   (a Piper voice)
  python3 voiceover.py script.txt --reel ../ig-video/template/reel.json
  python3 voiceover.py --list

Setup (once)
  pip install kokoro-onnx soundfile
  download kokoro-v1.0.onnx and voices-v1.0.bin into --data-dir from
  https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
  Piper instead: pip install piper-tts, then
  python3 -m piper.download_voices en_US-lessac-medium
  Pitch changes need ffmpeg on your PATH.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import wave

GAP = 0.18  # seconds of silence between beats, so the cuts can breathe.
PAUSE = 0.45  # extra silence for [pause]

# speed multiplier, pitch multiplier, volume multiplier
TONES = {
    "hook": (1.12, 1.06, 1.15),
    "hype": (1.12, 1.05, 1.1),
    "serious": (0.92, 0.95, 1.0),
    "warm": (0.96, 1.0, 1.0),
    "fast": (1.25, 1.0, 1.0),
}
TAG_RE = re.compile(r"^\s*((?:\[[a-z]+\]\s*)+)")

VOICES = {
    "bm_george": "kokoro, UK, male, steady storyteller.",
    "bm_lewis": "kokoro, UK, male, deeper.",
    "bm_fable": "kokoro, UK, male, lighter.",
    "am_puck": "kokoro, US, male, upbeat.",
    "am_michael": "kokoro, US, male, warm.",
    "af_heart": "kokoro, US, female, the most natural Kokoro voice.",
    "en_GB-alan-medium": "piper, UK, male, calm.",
    "en_US-ryan-high": "piper, US, male, warm.",
}


def split_beats(raw):
    beats = []
    for p in raw.split("\n\n"):
        if not p.strip():
            continue
        m = TAG_RE.match(p)
        tags = re.findall(r"\[([a-z]+)\]", m.group(1)) if m else []
        unknown = [t for t in tags if t != "pause" and t not in TONES]
        if unknown:
            sys.exit(f"Unknown tag [{unknown[0]}]. Use one of: " + ", ".join(f"[{t}]" for t in [*TONES, "pause"]))
        text = " ".join((p[m.end():] if m else p).split())
        beats.append({"text": text, "tags": tags})
    return beats


def find_file(name, data_dir):
    for d in (data_dir, os.getcwd(), os.path.expanduser("~/.local/share/piper")):
        path = os.path.join(d, name)
        if os.path.exists(path):
            return path
    return None


class KokoroEngine:
    def __init__(self, voice, data_dir):
        try:
            from kokoro_onnx import Kokoro
        except ImportError:
            sys.exit("Kokoro is not installed. Run: pip install kokoro-onnx soundfile")
        model, voices = find_file("kokoro-v1.0.onnx", data_dir), find_file("voices-v1.0.bin", data_dir)
        if not (model and voices):
            sys.exit(
                "Kokoro model files not found. Download kokoro-v1.0.onnx and voices-v1.0.bin into "
                f"{data_dir} from https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0"
            )
        self.k = Kokoro(model, voices)
        self.voice = voice
        # The first letter of a Kokoro voice is its accent: a = US, b = UK.
        self.lang = "en-gb" if voice.startswith("b") else "en-us"
        self.rate = 24000

    def say(self, text, speed):
        import numpy as np

        audio, self.rate = self.k.create(text, voice=self.voice, speed=min(speed, 2.0), lang=self.lang)
        return np.asarray(audio, dtype=np.float32)


class PiperEngine:
    def __init__(self, voice, data_dir):
        try:
            from piper import PiperVoice
        except ImportError:
            sys.exit("Piper is not installed. Run: pip install piper-tts")
        model = find_file(f"{voice}.onnx", data_dir)
        if not model:
            sys.exit(
                f"Voice '{voice}' not found. Download it once with:\n"
                f"  python3 -m piper.download_voices {voice} --data-dir {data_dir}"
            )
        self.v = PiperVoice.load(model)
        self.rate = self.v.config.sample_rate

    def say(self, text, speed):
        import numpy as np
        from piper import SynthesisConfig

        config = SynthesisConfig(length_scale=1.0 / speed)
        return np.concatenate([c.audio_float_array for c in self.v.synthesize(text, syn_config=config)])


def shift_pitch(audio, rate, factor):
    """Raise or lower pitch without changing length, through ffmpeg."""
    import numpy as np

    if abs(factor - 1.0) < 0.005:
        return audio
    with tempfile.TemporaryDirectory() as d:
        src, dst = os.path.join(d, "in.wav"), os.path.join(d, "out.wav")
        write_wav(src, audio, rate)
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-af",
             f"asetrate={int(rate * factor)},aresample={rate},atempo={1 / factor:.5f}", dst],
            check=True,
        )
        with wave.open(dst) as w:
            return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32767


def write_wav(path, audio, rate):
    import numpy as np

    pcm = (np.clip(audio, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(rate)
        out.writeframes(pcm.tobytes())


def main():
    ap = argparse.ArgumentParser(description="Script to voiceover.wav, free and offline.")
    ap.add_argument("input", nargs="?", help="script file, or - for stdin")
    ap.add_argument("--voice", default="bm_george", help="a Kokoro voice (bm_george) or a Piper one (en_GB-alan-medium)")
    ap.add_argument("--speed", type=float, default=1.1, help="1.1 is 10%% faster")
    ap.add_argument("--data-dir", default=os.getcwd(), help="where the voice files live")
    ap.add_argument("--out", default="voiceover.wav")
    ap.add_argument("--reel", help="reel.json to update with the real timings")
    ap.add_argument("--list", action="store_true", help="show suggested voices")
    args = ap.parse_args()

    if args.list:
        for name, note in VOICES.items():
            print(f"{name:22} {note}")
        return
    if not args.input:
        ap.error("give a script file, or - for stdin")

    import numpy as np

    raw = sys.stdin.read() if args.input == "-" else open(args.input, encoding="utf-8").read()
    beats = split_beats(raw)
    if not beats:
        sys.exit("The script is empty.")

    # Check before spending time on the audio, not after.
    reel, old = None, []
    if args.reel:
        reel = json.load(open(args.reel, encoding="utf-8"))
        old = reel.get("beats", [])
        if old and len(old) != len(beats):
            sys.exit(
                f"{args.reel} has {len(old)} beats and the script has {len(beats)}. "
                "Make them match, one paragraph per beat, then run again."
            )

    # Piper voice names have a hyphen (en_GB-alan-medium), Kokoro ones do not.
    engine = (PiperEngine if "-" in args.voice else KokoroEngine)(args.voice, args.data_dir)

    pieces, timings, t = [], [], 0.0
    for b in beats:
        speed, pitch, gain = 1.0, 1.0, 1.0
        for tag in b["tags"]:
            if tag in TONES:
                speed, pitch, gain = TONES[tag]
        audio = engine.say(b["text"], args.speed * speed)
        rate = engine.rate
        audio = shift_pitch(audio, rate, pitch) * gain
        lead = PAUSE if "pause" in b["tags"] else 0.0
        pieces += [np.zeros(int(rate * lead), np.float32), audio, np.zeros(int(rate * GAP), np.float32)]
        dur = lead + len(audio) / rate + GAP
        timings.append({"start": round(t, 2), "dur": round(dur, 2), "say": b["text"]})
        t += dur

    write_wav(args.out, np.concatenate(pieces), engine.rate)

    for i, (b, tm) in enumerate(zip(beats, timings), 1):
        tags = "".join(f"[{x}]" for x in b["tags"])
        print(f"{i:>2}  {tm['start']:5.1f}s  {tm['dur']:4.1f}s  {tags:16} {tm['say']}")
    print(f"\n{args.out}: {t:.1f}s, {len(timings)} beats, voice {args.voice}")

    if args.reel:
        # Keep the cards, shots, scenes and clips, take the real timings and words.
        reel["beats"] = [{**(old[i] if old else {}), **b} for i, b in enumerate(timings)]
        reel["audio"] = os.path.basename(args.out)
        json.dump(reel, open(args.reel, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
        print(f"{args.reel}: timings updated.")
        if os.path.basename(os.path.dirname(os.path.abspath(args.out))) != "public":
            print(f"Move {args.out} into the project's public/ folder before rendering.")


if __name__ == "__main__":
    main()
