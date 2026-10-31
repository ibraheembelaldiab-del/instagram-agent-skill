---
name: ig-transcribe
description: >-
  Transcribe a video or voice recording with OpenAI Whisper, free and on the
  user's own computer: short timed caption lines as an .srt, the plain
  transcript, and real timings for an /ig-video reel.json. Use when the user
  says transcribe, captions, subtitles, SRT, "what did I say in this", or wants
  to turn a recording, podcast or long video into reels.
---

# ig-transcribe

Speech to text with [Whisper](https://github.com/openai/whisper). It works in
about 100 languages, auto-detects which one, and nothing leaves the computer.

## Setup (once)

```bash
pip install openai-whisper
```

It also needs `ffmpeg` installed (`brew install ffmpeg` on a Mac). The first run
downloads the model.

## Pick the model

| model | when |
|---|---|
| `base` | the default. Fast, good on clear speech. |
| `small` | accents, background noise, or names getting mangled |
| `turbo` | the best balance if the computer has a decent GPU |

## Three jobs

**1. Captions for a Reel the user already filmed.**

```bash
python3 transcribe.py take1.mp4
```

Writes `take1.srt` in lines of 7 words or fewer, broken at punctuation, which
is what reads on a phone with the sound off. Upload it, or import it in CapCut.

**2. Real timings for `/ig-video`.** The user records the voiceover on their
phone, then:

```bash
python3 transcribe.py voiceover.m4a --reel path/to/reel.json
```

This replaces the estimated beats with the real ones. The cards and shots are
not kept, because the lines no longer match one for one: add them back from
the `/ig-reel` on-screen list, then copy the audio file into `public/`.

**3. Raw material.** A podcast, a live, a long YouTube video. The `.txt` it
writes is the input for `/ig-repurpose` (cut it into reels) and `/ig-viral`
(transcribe the reels that are working in a niche, then study the hooks).

## Rules

- Whisper mishears names and places. Read the transcript before anything ships
  and fix them, or the mistake gets burned into the video.
- Pass `--language` when the user speaks a language other than English. Auto
  detection is right most of the time, but not on short clips.
- Only transcribe what the user made or has the rights to. Studying another
  creator's reel for its structure is fine. Reposting their words is not.

## Output

The timed lines, then:

```
take1.srt and take1.txt: 14 lines, language en
```
