---
name: ig-video
description: >-
  Turn a finished Reel script into an actual 1080x1920 MP4 with Remotion:
  animated on-screen cards, burned-in word-by-word captions, safe-zone layout,
  your clips or placeholder backgrounds, and an optional voiceover. Use when
  the user says "make the video", "render it", "edit this reel", "add captions
  to the video", or has a beat sheet from /ig-reel and wants a file to post.
---

# ig-video

`/ig-reel` writes the Reel. This skill builds it. The output is an MP4 the user
can post as it is, or drop into CapCut and keep editing.

It uses [Remotion](https://github.com/remotion-dev/remotion), which makes video
out of React code. The user never has to touch the code: everything they would
want to change lives in one file, `reel.json`.

## What goes in

A script with on-screen text and a shot list. If the user does not have one,
run `/ig-reel` first and say so. Do not write a script here.

## The template

`template/` is a complete Remotion project. Copy it to a new folder per Reel,
never edit it in place.

```
template/
  reel.json          the only file you edit: beats, cards, shots, colours, audio
  public/clips/      the user's own footage, one file per beat
  public/            voiceover.wav goes here
  src/Reel.tsx       the layout. Change it only if the user asks for a new look.
```

Each beat in `reel.json`:

```json
{"start": 0, "dur": 2.9, "say": "Why do people fly to Shantou for beef?",
 "card": "They fly here for BEEF?", "shot": "beef going into broth", "clip": "beat1.mp4"}
```

- `say` is the spoken line. It is burned in as a caption that lights up word by
  word, because most people watch muted.
- `card` is the big on-screen text. Six words or fewer. Leave it out on beats
  where the picture should do the talking.
- `shot` is what to film. Until a `clip` is added, it shows small at the top of
  a coloured background, so the video renders before anything is filmed.
- `clip` is a file in `public/clips/`. It fills the frame, muted.
- `scene` names an animated scene in `src/scenes.tsx`, drawn over the
  background. Use it when the user has no footage and wants the video fully
  animated: write one small SVG scene per beat that shows what the line says
  (a plane for "fly", a stopwatch for "timer"), keep it moving every frame,
  and keep its subject between y 700 and 1350.
- `label` and `labels` are text a scene can show, for example a place name on
  a map pin or name tags popping up over the user's own footage. A scene
  works over a clip too, so labels can sit on real video.
- `music` is a background track in `public/`, played under the voice at
  `musicVolume` (default 0.12, so the voice stays on top).
- `start` and `dur` are seconds. The video is exactly as long as the last beat.

## Steps

1. Copy `template/` to a folder named after the Reel.
2. Time the script with `/ig-reel`'s `beats.py --json`. Split any beat over 4
   seconds into two, so the frame changes.
3. Write `reel.json`: one beat per line of script, the cards from the
   on-screen list, the shots from the shot list. Pick 3 or 4 background
   colours that suit the subject and one accent colour for the captions.
4. **Voice, if the user wants one.** If they recorded themselves, run
   `/ig-transcribe` on the recording with `--reel`. That gives the real
   timings. If they want a generated voice, run `/ig-voiceover` with `--reel`.
   Either way the audio file goes in `public/`.
5. `npm install`, then render a still of frame 15 and look at it. Check that the
   hook card is up in the first second and nothing sits in the bottom 420 or
   the right 160 pixels.
6. `npm run render`. The file lands in `out/reel.mp4`.

   **Another language:** copy `reel.json` to `reel-zh.json` (or any name),
   translate `say`, `card` and `labels`, point `audio` at that language's
   voiceover, re-time the beats against it, then
   `npx remotion render Reel out/reel-zh.mp4 --props=reel-zh.json`. Captions
   in Chinese or Japanese light up a character at a time. Re-time with
   `/ig-transcribe`, and check the transcript: Whisper may answer in
   Traditional characters for a Simplified script.
7. Send the user the MP4.

Offline, or when Remotion cannot download its browser, pass a local Chrome:
`npx remotion render Reel out/reel.mp4 --browser-executable=/path/to/chrome`.

## Blocky 3D style

`template-3d/` is a second look: a chain of floating, blocky islands in a
pastel sky. The camera never cuts. It orbits each island while its line is
spoken, then dives through to the next one. Signs are built from cubes with a
5x7 pixel font and pop in letter by letter. Use it when the user wants a
3D, toy-world or "Minecraft-style" reel. Never copy a game's look or assets:
the style is blocks, pastel light and a flying camera, all drawn here.

- `reel.json` has only the timings and words. One island per beat.
- `src/islands.tsx` holds one small scene per beat, made of `Box`, `Cyl`,
  `Ball`, `Slice`, `Plane`, `Island` and `PixelText` from `src/voxels.tsx`.
  Write new islands for a new subject; keep each one to a few shapes that
  show the line, plus one short sign (6 letters or fewer reads best).
- `src/World.tsx` is the camera and the sky. Leave it alone unless the user
  wants a different move.
- Signs and plate labels come from each beat's `sign` and `labels` in
  `reel.json`, so a translated `reel-zh.json` gets its own. Chinese signs
  are built from 12x12 block characters: run
  `python3 tools/cjk_glyphs.py --from reel-zh.json` first, then render with
  `--props=reel-zh.json`.
- Render with software 3D, which works on any machine:
  `npx remotion render Reel3D out/reel-3d.mp4 --gl=swangle`. It is slower
  than the flat template, so render a few stills first
  (`npx remotion still Reel3D out/f.png --frame=60 --gl=swangle`) and check
  that no sign is cut off and nothing sits in front of the subject.

## Rules

- **Motion in frame one.** The hook card pops in from frame 0. Never open on a
  still title.
- **Cards stay small and high.** About 60px, just under the top safe line,
  so they never cover the subject of the shot.
- **Safe zone.** Instagram puts the caption and the buttons over the bottom
  fifth and the right edge. Text stays in the middle band.
- **No intro, no logo, no outro card.** The script's last line is the end.
- **Their footage beats graphics.** Coloured backgrounds are a placeholder.
  Tell the user which beats still need a clip.
- Same voice rules as everything else in the pack: the captions are the script,
  so the script has already been through `/ig-human`.

## Licence note

Remotion is free for individuals and companies of up to three people. Bigger
teams need a company licence from remotion.pro. Say so once if the user
mentions a team or a client.

## Output

```
VIDEO READY  ·  out/reel.mp4
length:     34.5s, 13 beats, 1080x1920, 30fps
cards:      8
voice:      none (add with /ig-voiceover or /ig-transcribe)
still need clips for: beats 1, 3, 4, 9, 11
```
