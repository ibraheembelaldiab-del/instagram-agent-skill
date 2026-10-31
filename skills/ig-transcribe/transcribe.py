#!/usr/bin/env python3
"""
transcribe.py - turn a video or voice recording into timed captions with
OpenAI Whisper (https://github.com/openai/whisper). Free, runs on your own
computer, nothing is uploaded.

Three outputs from one recording:
  - an .srt caption file, short lines, ready to upload or burn in
  - the plain transcript, one beat per line, for /ig-repurpose or /ig-human
  - with --reel, real word timings written into an /ig-video reel.json

Usage
  python3 transcribe.py take1.mp4
  python3 transcribe.py take1.mp4 --model small --words 6
  python3 transcribe.py voiceover.wav --reel ../ig-video/template/reel.json
  python3 transcribe.py clip.mp4 --language zh

Setup (once)
  pip install openai-whisper      (and ffmpeg on your PATH)
"""

import argparse
import json
import os
import sys

MAX_WORDS = 7  # per caption line. Read on a phone, muted, in under 2 seconds.


def chunk_words(words, max_words):
    """Group Whisper's timed words into caption lines, breaking at punctuation."""
    def ends(w):
        return w["word"].strip()[-1:] in ".?!,"

    lines, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        # Do not leave one or two words stranded on a line of their own.
        soon = any(ends(x) for x in words[i + 1 : i + 3])
        if ends(w) or (len(cur) >= max_words and not soon):
            lines.append(cur)
            cur = []
    if cur:
        lines.append(cur)
    return [
        {
            "start": round(line[0]["start"], 2),
            "end": round(line[-1]["end"], 2),
            "say": "".join(w["word"] for w in line).strip(),
        }
        for line in lines
    ]


def srt_time(s):
    ms = int(round(s * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    sec, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{sec:02},{ms:03}"


def to_srt(lines):
    return "\n".join(
        f"{i}\n{srt_time(l['start'])} --> {srt_time(l['end'])}\n{l['say']}\n"
        for i, l in enumerate(lines, 1)
    )


def main():
    ap = argparse.ArgumentParser(description="Video or audio to timed captions.")
    ap.add_argument("input", help="video or audio file")
    ap.add_argument("--model", default="base", help="tiny, base, small, medium, large or turbo")
    ap.add_argument("--language", help="e.g. en, zh, ar. Leave out to auto-detect.")
    ap.add_argument("--words", type=int, default=MAX_WORDS, help="max words per caption line")
    ap.add_argument("--reel", help="reel.json to fill with the real timings")
    args = ap.parse_args()

    try:
        import whisper
    except ImportError:
        sys.exit("Whisper is not installed. Run: pip install openai-whisper")

    model = whisper.load_model(args.model)
    result = model.transcribe(args.input, word_timestamps=True, language=args.language)
    words = [w for seg in result["segments"] for w in seg.get("words", [])]
    if not words:
        sys.exit("No speech found in that file.")
    lines = chunk_words(words, args.words)

    stem = os.path.splitext(args.input)[0]
    with open(f"{stem}.srt", "w", encoding="utf-8") as f:
        f.write(to_srt(lines))
    with open(f"{stem}.txt", "w", encoding="utf-8") as f:
        f.write("\n\n".join(l["say"] for l in lines) + "\n")

    for l in lines:
        print(f"{l['start']:6.1f}s  {l['say']}")
    print(f"\n{stem}.srt and {stem}.txt: {len(lines)} lines, language {result.get('language')}")

    if args.reel:
        reel = json.load(open(args.reel, encoding="utf-8"))
        # Each beat runs until the next one starts, so there are no blank frames.
        beats = []
        for i, l in enumerate(lines):
            nxt = lines[i + 1]["start"] if i + 1 < len(lines) else l["end"] + 0.4
            beats.append({"start": l["start"], "dur": round(nxt - l["start"], 2), "say": l["say"]})
        beats[0]["dur"] = round(beats[0]["dur"] + beats[0]["start"], 2)
        beats[0]["start"] = 0
        reel["beats"] = beats
        reel["audio"] = os.path.basename(args.input)
        json.dump(reel, open(args.reel, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
        print(f"{args.reel}: {len(beats)} beats from the real audio. Copy {os.path.basename(args.input)} into public/, then add the cards and shots back in.")


if __name__ == "__main__":
    main()
