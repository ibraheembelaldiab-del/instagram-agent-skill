#!/usr/bin/env python3
"""
voiceover.py - read a Reel script out loud with a free voice, on your own
computer. No account, no credits, no upload.

Uses Piper (https://github.com/OHF-Voice/piper1-gpl), a small text-to-speech
model that runs on a laptop CPU faster than real time. One beat per paragraph,
the same script format beats.py reads. Every beat is timed from the audio it
actually produced, not from a word count, so the video lines up with the voice.

Usage
  python3 voiceover.py script.txt
  python3 voiceover.py script.txt --voice en_US-ryan-high --speed 1.1
  python3 voiceover.py script.txt --reel ../ig-video/template/reel.json
  python3 voiceover.py --list

Setup (once)
  pip install piper-tts
  python3 -m piper.download_voices en_US-lessac-medium
"""

import argparse
import json
import os
import sys
import wave

GAP = 0.18  # seconds of silence between beats, so the cuts can breathe.

# A short list worth trying first. Every voice: https://rhasspy.github.io/piper-samples/
VOICES = {
    "en_US-lessac-medium": "US, clear, neutral. The safe default.",
    "en_US-ryan-high": "US, male, warm.",
    "en_US-amy-medium": "US, female, bright.",
    "en_GB-alan-medium": "UK, male, calm.",
    "en_GB-jenny_dioco-medium": "UK, female, friendly.",
}


def split_beats(raw):
    return [" ".join(p.split()) for p in raw.split("\n\n") if p.strip()]


def find_model(voice, data_dir):
    for d in (data_dir, os.getcwd(), os.path.expanduser("~/.local/share/piper")):
        path = os.path.join(d, f"{voice}.onnx")
        if os.path.exists(path):
            return path
    sys.exit(
        f"Voice '{voice}' not found. Download it once with:\n"
        f"  python3 -m piper.download_voices {voice} --data-dir {data_dir}"
    )


def main():
    ap = argparse.ArgumentParser(description="Script to voiceover.wav, free and offline.")
    ap.add_argument("input", nargs="?", help="script file, or - for stdin")
    ap.add_argument("--voice", default="en_US-lessac-medium")
    ap.add_argument("--speed", type=float, default=1.0, help="1.1 is 10%% faster")
    ap.add_argument("--data-dir", default=os.getcwd(), help="where the voice files live")
    ap.add_argument("--out", default="voiceover.wav")
    ap.add_argument("--reel", help="reel.json to update with the real timings")
    ap.add_argument("--list", action="store_true", help="show suggested voices")
    args = ap.parse_args()

    if args.list:
        for name, note in VOICES.items():
            print(f"{name:28} {note}")
        return
    if not args.input:
        ap.error("give a script file, or - for stdin")

    try:
        from piper import PiperVoice, SynthesisConfig
    except ImportError:
        sys.exit("Piper is not installed. Run: pip install piper-tts")

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

    voice = PiperVoice.load(find_model(args.voice, args.data_dir))
    config = SynthesisConfig(length_scale=1.0 / args.speed)
    rate = voice.config.sample_rate
    silence = b"\x00\x00" * int(rate * GAP)

    timings, t = [], 0.0
    with wave.open(args.out, "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(rate)
        for text in beats:
            audio = b"".join(c.audio_int16_bytes for c in voice.synthesize(text, syn_config=config))
            dur = len(audio) / 2 / rate + GAP
            out.writeframes(audio + silence)
            timings.append({"start": round(t, 2), "dur": round(dur, 2), "say": text})
            t += dur

    for i, b in enumerate(timings, 1):
        print(f"{i:>2}  {b['start']:5.1f}s  {b['dur']:4.1f}s  {b['say']}")
    print(f"\n{args.out}: {t:.1f}s, {len(timings)} beats, voice {args.voice}")

    if args.reel:
        # Keep the cards, shots and clips, take the real timings and words.
        reel["beats"] = [{**(old[i] if old else {}), **b} for i, b in enumerate(timings)]
        reel["audio"] = os.path.basename(args.out)
        json.dump(reel, open(args.reel, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
        print(f"{args.reel}: timings updated. Put {args.out} in the project's public/ folder.")


if __name__ == "__main__":
    main()
