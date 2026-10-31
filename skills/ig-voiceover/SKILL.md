---
name: ig-voiceover
description: >-
  A free, offline replacement for ElevenLabs: read a Reel script out loud with
  Piper text-to-speech on the user's own computer, timed beat by beat, and
  drop the timings straight into an /ig-video reel.json. Use when the user
  wants a voiceover, AI voice, text to speech, a faceless reel, or says
  "ElevenLabs" but does not want to pay for it.
---

# ig-voiceover

Turns a finished script into `voiceover.wav`. Free, no account, no credits,
nothing uploaded. It runs [Piper](https://github.com/OHF-Voice/piper1-gpl),
which is fast enough to run on a laptop CPU.

## Be honest about the trade

Piper sounds clean and clear. It does not sound as human as ElevenLabs, and it
cannot clone the user's voice. Say this once, plainly. For a faceless explainer
it is fine. For a Reel that is meant to sound like the user, their own phone
recording beats any generated voice: send them to record it and use
`/ig-transcribe` instead.

## Setup (once)

```bash
pip install piper-tts
python3 -m piper.download_voices en_US-lessac-medium
```

`python3 voiceover.py --list` shows five voices worth trying first. Every voice,
with samples, is at https://rhasspy.github.io/piper-samples/ in about 40
languages.

## Steps

1. The script must be final and already through `/ig-human`. One beat per
   paragraph, the same format `beats.py` reads.
2. Write numbers the way they should be said: "ten seconds", not "10s".
   Spell out anything the voice will trip on (names, places, brands).
3. Run it:

   ```bash
   python3 voiceover.py script.txt
   python3 voiceover.py script.txt --voice en_US-ryan-high --speed 1.1
   python3 voiceover.py script.txt --reel path/to/reel.json
   ```

   `--speed 1.1` is a good Reels pace for most voices. `--reel` rewrites the
   beat timings in an `/ig-video` project with the real audio lengths and keeps
   the cards, shots and clips.
4. Copy `voiceover.wav` into the video project's `public/` folder and render.

## Output

The beat list with real timings, then:

```
voiceover.wav: 31.8s, 13 beats, voice en_US-lessac-medium
```
