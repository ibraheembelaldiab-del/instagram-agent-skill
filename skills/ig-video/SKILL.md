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

### The first 3 seconds (what the viral 3D explainers do)

Studied from 3D and block-style explainers running 20x to 1,000x their
account's median views:

1. **Big hook text on screen from frame one.** Set `hook` in `reel.json`: a
   question or a claim with a gap in it ("挂了1500年为什么不掉？", "If you
   build a fortress at the bend of a mountain..."). It slams in with a shake
   and leaves by 3 seconds. Under 14 Chinese characters or 8 English words.
2. **Show the payoff first, explain after.** Open on the most impressive
   shot (the temple on the cliff, the rebuilt city), never on a title card,
   a logo or a slow establishing shot.
3. **Voice and captions start on the first frame.** Most people watch muted.
4. **Sound on every action.** `sfx` (on by default) adds a thud on the
   hook, a whoosh into every new scene and a pop when a sign lands. The most
   satisfying 3D videos live on these clicks and snaps.
5. **Change something every 3 to 5 seconds**: a new scene, a camera move,
   a sign popping. A scene longer than 5 seconds needs a second move inside it.
6. **One open loop, paid off late.** The reaction format does this well:
   the panda reacts in a corner (`pip.pause` = the line where the video
   freezes), then comes to the middle and says "熊猫来解释".
7. **End on a loop or a next-episode tease**, not a goodbye card.
8. **A verbal hook in the first spoken line**, not only on screen. Open on a
   warning, a bet or a shock, never a plain fact: "千万别在开封随便挖地！",
   "我赌你不知道…", "99%的人都去错了…", "Don't ever dig in this city…".
9. **A teaser line at every chapter change**, so nobody swipes in the middle:
   "更离谱的是…", "但这还不是最绝的…", "最后，这个一定要…", "But the
   craziest part…". Put it at the start of the line that opens the chapter.
10. **Numbered chapters** for list videos: give the first beat of each part a
   `chapter` ("#01 城摞城") and a tag slides in at the top until the part ends.
11. **End with a comment trigger, but never offer a travel guide on Douyin.**
   On Instagram, "comment X and I'll send it to you" works. On Douyin, a
   travel account saying "评论「洛阳」，我发你攻略" was flagged as
   无资质营销旅游服务 (unlicensed travel solicitation) and hidden. For
   Douyin and Xiaohongshu never write 攻略, 私信, 领, 发你, prices or
   bookings in the voice, the captions or the pinned comment. End on a
   question instead: "你觉得…吗？评论区告诉我！", "快@一个想去…的朋友！",
   "下期去哪？评论区投票！".

### Building islands and placing the camera

From sky-island builders, diorama makers and cinematography guides:

- **Islands are organic, never square slabs.** The `Island` is a round,
  uneven top over an underside that tapers to a jagged point, built from
  small blocks: grass, then dirt, then stone that darkens with depth, with
  moss creeping down and the odd ore speck. 3 to 5 shades per material.
- **Leave sky around every island** so each reads as its own small world, and
  keep other islands out of the camera's path to the next one.
- **Open on a wide establishing shot**, then move in.
- **Default to a diorama three-quarter view**: about 40 degrees off the front,
  looking down about 25 degrees, pushing in slowly. Subject low in the frame,
  sky above it for the sign.
- **Use a low hero angle for huge things** (a mountain, a gate tower).
- **Move with a reason, slowly**, and change angle by more than 35 degrees
  from one shot to the next.

### What the 3D template can do

- `same: true` on a line keeps it on the previous scene, so one island can
  play out over several lines (a city rebuilding itself); scenes read
  `marks` to know when each line starts.
- `pip: {pause: N}`: the reacting panda in a circle, freeze and grey wash on
  line N, the circle moves to the centre while he talks.
- `petals: false` turns off the cherry-blossom stream between scenes.
- **Detailed hero objects** (a statue, a famous building): describe the shape
  with distance functions and `src/voxelize.tsx` builds it from thousands of
  small blocks with light and creases baked in. Use it for the one thing the
  video is about; keep everything else in plain blocks so it stands out.
- Blocks have a pixel grain texture and cast real shadows. Keep big scenes
  to a few hundred blocks, or renders get slow (a 60s detailed reel takes
  about 40 minutes with `--gl=swangle`).
- **Small fixes do not need a full render.** For a change in one part,
  render only those frames (`--frames=120-300`) and splice them back with
  ffmpeg. For colour or brightness, grade the finished MP4 with ffmpeg `eq`
  instead of rendering again.

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

### Extra beat fields (3D template)

- `punch: 0.4` — a quick zoom-in and a thud this many seconds into the line.
  Use it on the two or three most shocking moments, not more.
- `fakeEnd: true` — dims the picture and shows a big "完 / THE END" during
  the line ("好了，就这些……"). Follow it with "等等！还有一个！" for the
  bonus fact; it keeps people watching past the point they would leave.
- `chapter: "#01 名字"` — the numbered tag at the top.
- Every video opens with the Blocktrotter jingle (`public/sfx/jingle.wav`,
  made by `tools/jingle.py`, original), the same each time so people
  recognise the channel by ear.

### Export for upload

Douyin and Instagram can clip the first and last moments of a video that
starts and ends exactly on the voice, or whose audio track starts a hair
before the picture. Always run the final file through
`tools/safe_export.sh in.mp4 out.mp4`: it holds the first frame 0.4 s and the
last frame 1.2 s, forces 30 fps with a keyframe at 0, re-encodes AAC audio,
drops the edit list and moves the index to the front. Send the creator that
file, not the raw render.
