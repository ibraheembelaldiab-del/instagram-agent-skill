---
name: ig-voiceover
description: >-
  A free, offline replacement for ElevenLabs: read a Reel script out loud with
  Kokoro (or Piper) on the user's own computer, with a tone tag per line so it
  does not sound flat, timed beat by beat into an /ig-video reel.json. Use when
  the user wants a voiceover, AI voice, text to speech, a faceless reel, says
  the voice sounds robotic or flat, or says "ElevenLabs" but does not want to pay.
---

# ig-voiceover

Turns a finished script into `voiceover.wav`. Free, no account, no credits,
nothing uploaded.

- **Kokoro** is the default. It is the most human-sounding free voice that runs
  on a laptop. https://github.com/thewh1teagle/kokoro-onnx
- **Piper** is smaller and faster but flatter. Use it on a weak computer.
  https://github.com/OHF-Voice/piper1-gpl

## Be honest about the trade

Neither sounds as human as ElevenLabs, and neither clones a voice. For a
faceless explainer they are fine. For a Reel that should sound like the user,
their own phone recording beats any generated voice: send them to record it and
use `/ig-transcribe` instead.

Never imitate a real person or a famous character (a cartoon voice, an actor, a
singer). It is someone else's voice, and Instagram mutes or removes it. Offer
an original character voice instead: a voice with a pitch tag and a speed.

## Tone: why a voice sounds like a zombie

A flat voice says every line at the same pitch and pace. Real delivery changes
with the job of the line. Tag the start of each paragraph:

| tag | what it does | use it on |
|---|---|---|
| `[hook]` | faster, higher, louder | the first line. Curious, urgent. |
| `[hype]` | a bit faster and higher | the surprising fact, the "!" line |
| `[serious]` | slower and lower | the line that has to land |
| `[warm]` | relaxed | the payoff and the ask |
| `[fast]` | quick | an aside, a joke |
| `[pause]` | half a second of silence first | right before the payoff |

No tag means a normal read. Tags can stack: `[pause][warm]`.

Punctuation is delivery too: `...` makes a beat of suspense, `!` lifts the
line, a comma is a breath. Write the script the way it should be said.

```
[hook] Why do people fly to Shantou... for beef?

[hype] Because beef hotpot here isn't dinner. It's a sport!

[pause][warm] One bite... and you get it.
```

## Setup (once)

```bash
pip install kokoro-onnx soundfile
# then put kokoro-v1.0.onnx and voices-v1.0.bin in one folder, from
# https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
```

Pitch changes need `ffmpeg`. `python3 voiceover.py --list` shows voices worth
trying. The first letter of a Kokoro voice is the accent (`a` US, `b` UK), the
second is `m` male or `f` female: `bm_george`, `am_puck`, `af_heart`.

## Steps

1. The script must be final and already through `/ig-human`, one beat per
   paragraph.
2. Add a tone tag to the lines that need one. At least the hook, the payoff
   and a `[pause]` before the payoff.
3. Write numbers and names the way they are said: "ten seconds", not "10s".
4. Run it:

   ```bash
   python3 voiceover.py script.txt --voice bm_george --speed 1.2 --data-dir ~/kokoro
   python3 voiceover.py script.txt --reel path/to/reel.json
   ```

   `--reel` rewrites the beat timings in an `/ig-video` project with the real
   audio lengths and keeps the cards, shots, scenes and clips.
5. Aim for 25 to 35 seconds. Change `--speed` rather than cutting tags.

## Output

The beat list with real timings and tags, then:

```
voiceover.wav: 29.7s, 13 beats, voice bm_george
```
