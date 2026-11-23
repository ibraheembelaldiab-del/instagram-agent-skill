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

## Text-card videos (no voice, no mascot)

`template-cards/` makes silent-style explainer videos from `src/episode.json`
(Chinese and English cards, one duration per card). Lines rise out of a blur,
highlights wipe in, numbers spin in, and every card change is different
(whip pan, zoom through, slide up, zoom out with a twist), each with its own
sound; inside each card the camera reveals, pushes, drifts or pulls, with a
zoom punch when the highlight lands. Fonts: copy the 700 and 900 files of
`@fontsource/noto-sans-sc` into `public/fonts/`. Add calm original music with
`tools/lofi.py out.wav SECONDS` and mix it under the sound effects; export with
`tools/safe_export.sh`. Stills of each card's last moment, cropped to 3:4, are
the Xiaohongshu carousel; cropped to 4:5, the Instagram carousel.

What goes on the cards matters more than how they move:
- **Real value only.** A surprising, research-backed truth people did not
  know, that changes how they see themselves, plus one specific action they
  can test. Never common sense everyone already knows but doesn't do.
- **Name the source** in small text on the card (author and year).
- **Frame one already shows the hook text.** Never open on an empty screen.
- **Same signature entrance every episode, new hook line.** The creator chose a
  fixed opening (the viewer scrolling in bed, the red clock, a stat hook) so
  fans recognise the series in one second; only the hook text changes. The
  stamp opening in `Habit.tsx` is kept as an alternative to A/B test, not the default.
- **One strong, personal statistic per video**, best as the hook ("每5个成年人就有1个是长期拖延者，你是吗？"),
  with its source. More numbers than that feels like a lesson and people swipe.

### Black-and-gold "knowledge showcase" style (`src/Elegant.tsx`)

For the trending 话术 / psychology-trick format: black background with a warm
gold glow, Noto Serif SC (copy the 400/700/900 files of `@fontsource/noto-serif-sc`
into `public/serif/`), thin gold line drawings, chat bubbles that act out each
trick with red ✕ / gold ✓ verdicts, bars that grow to the study's numbers, a
chapter tag with progress segments, bottom subtitles, and a "YOUR CALL" ending
(情商扣1 vs 心机扣2) that turns the comments into a vote. Only chart numbers a
study actually reports; when it reports none, show a qualitative comparison.

### "Vibe 知识大赏" format (`src/Vibe.tsx`, 16:9)

The trending Douyin knowledge-film format (one account: +780k followers in 20
days): 1920x1080, about 2 minutes, no voice-over, Chinese subtitle with an
English italic line under it at 85-91% height, five zones (signature, chapter
tag, central animation, note band, subtitles), constant motion, six-part arc
(cold hook on frame 0 -> real historical experiment -> mechanism -> twist ->
your life -> sources + disclaimer). The series all use one song: 秋成《若如初见》
(We Never Remix, "开智小曲"), slowed ~0.9x, about 76 BPM. Never embed that
song; deliver a no-music export and have the creator add it from Douyin's
library (selecting the full length), plus a version with the original 76 BPM
lo-fi (`lofi.py` with BPM 76).
For Instagram, translate every on-screen word (charts, bubbles, cards,
labels), not only the subtitles (`src/VibeEN.tsx`), and wrap the 16:9 film in
a 9:16 frame with a big hook title above it (`tools/reel-frame.html`: render
to PNG, overlay the video at y=656, 1080x608).

### Instagram-only rules (not Douyin)

From a 2026 algorithm breakdown the creator shared (Loa Vert, @artgrowthclub):
aim for a flat retention curve and a skip rate under 30-40%; 30-45 s reels do
best, a 1-2 min film should be cut down for Instagram (hook + key data + twist
+ vote); no hashtags, use searchable keywords and a longer caption instead;
display name = name + niche, keyword-rich bio. Keep Douyin on its own rules.

### The rule above all rules: follow what is getting numbers today

The creator does not want a fixed house style. Before each new video, check
what is actually outperforming right now (vidIQ `instagram_tiktok_outlier_search`,
ranked by outlier multiple) and copy that pattern; the brand (colours, the
stick-figure viewer, Brain Manual) is the only thing that stays.

Snapshot, November 2026, psychology niche (IG + TikTok outliers, 6x-997x):
60-75 s, calm voice-over, soft piano, a simple white/wireframe figure on a
dark background, a "why do you do this?" everyday behaviour, captions that
light up word by word. Built as `src/Story.tsx`: script in
`tools/story_voice.py` (edge-tts with word timings, retries because the
service drops requests), music from `tools/piano.py`. Douyin's trend at the
same time was the 2-minute no-voice Vibe film (`src/Vibe.tsx`).

Voice: edge-tts sounds obviously AI in Chinese. Use vidIQ voiceover
(ElevenLabs) "James Gao - Calm, Friendly and Warm" (standard Mandarin, male,
narrative) with `scriptLines`, one line per scene; then
`tools/sync_voice_lines.py` trims each line, adds the gaps and rescales the
edge-tts word timings onto it for the word-by-word captions. Cost: 28 vidIQ
credits for ~280 characters (rounded up per 1000).

Shock first (Douyin data, spotlight video: 48% gone by 2 s, 20% left at 5 s,
far below similar videos): the first spoken line is the surprising claim, not
a story setup ("吵架时突然不说话的人，不一定是冷漠。可能是他的心跳已经超过了100"),
and frame one already shows the tension (the silent figure, heart at 112 BPM).
`src/Fight.tsx` is the example.

Music for voice-over videos: soft piano alone was "boring to hear". Use
`tools/cinematic.py out.wav beats.json "<reveal beats>" <warm-from beat>`:
a 90 bpm forward pulse, minor-key piano motif, pad, soft clock tick, a low
hit on every scene change, a riser into each reveal, warmer chords for the
resolution. Mix it with sidechain ducking under the voice
(`sidechaincompress=threshold=0.03:ratio=5`). Also export a voice-only copy
so the creator can add the trending in-app song (Nov 2026: "Futile Devices",
Sufjan Stevens, for reflective psychology content; Douyin: 若如初见/开智小曲)
at about 15% volume. Never put a licensed song in the file itself.

Update: the creator wants music that grabs attention, not calm beds. Default to
`tools/hype.py out.wav beats.json "<reveal beats>"` (140 bpm dark-psychology /
phonk style: hard kick, gliding 808, clap, rolling hats, cowbell riff, bell
lead; full energy from frame one; half a second of silence then an impact
before each reveal). Mix at volume 0.4 with sidechain ducking (ratio 4) so
the voice still cuts through, final loudness -13 LUFS.

Update 2: the creator chose "more emotional" over the plain hard beat. Use
`tools/trailer.py out.wav beats.json "<reveals>" <warm-from>`: a trailer-style
score (92 bpm staccato string ostinato, low toms, aching piano melody, swelling
strings that grow through the story, silence + riser + boom before reveals,
warm major-key lift for the resolution). Mix at volume 0.6 with ducking.

Update 3: the creator judged every code-synthesised track (piano, lo-fi,
cinematic, hype, trailer) "so bad". Do not synthesise music in code any more.
Use real music: vidIQ `generate_music` (25 credits per track, ~60 s,
royalty-free WAV; prompt with genre + mood + instruments + tempo +
"instrumental"), normalised to -24 LUFS and ducked under the voice; or a
voice-only export plus a trending song added inside the app.

### Diagnose with the numbers (Amelia Gonzamonte's framework)

low views + good engagement = packaging problem (cover, first frame, first 3 s);
high views + low engagement = connection problem; low + low = idea problem;
high + high but no follows/leads = positioning problem.

Silent-in-a-fight episode, Nov 17 2026: IG 304 views, 45.8% skip, 8 s average
of 54 s, but like 3.7%, save 1.8%, repost 2.6% (good) and 0 comments; Douyin
56.6% 2 s bounce, 21.7% at 5 s, 4 s average. Verdict: packaging. Fixes, now
rules: frame 0 shows the whole hook as big text (word-by-word captions left
the cover reading "People who go"); a big close-up of the figure's emotion,
not two tiny figures; 25 s and two points max; one curiosity gap; an easy
comment prompt early ("打1或2"); Douyin itself recommends openings with a real
face, so offer the creator a 2-second silent reaction shot of himself.

## Update: fast voice, no pauses (user rule)

The user wants fast talk with no pauses between sentences: fast speech keeps people focused.

- Build every voice with `tools/tight.py <dir> <mp3prefix> <beats.json> 1.2 0.12`. It trims the edges, cuts inside pauses to 0.12s, speeds up 1.2x (pitch kept) and puts a 0.12s gap between lines.
- Then run `tools/align.py <dir> <lang>` (whisper, no initial_prompt) to re-time the captions to the real audio. Copy `q_voice.wav` and `q_beats.json` into the Remotion project.
- Target length: about 25s for 2 points.

## Update: phantom vibration stats (Douyin)

- Stats: 2s bounce 33.8%, the best so far (was 56.6% and then 48%). 5s retention 33.5%. Average watch 6s of 25s. Comment rate 0.34%.
- Retention matched similar videos until 4s, then dropped below them at 4–5s.
- That drop is where beat 1 gave the name ("这叫幻震综合征") and asked for a comment. That delayed the payoff, so viewers left.

Rules:
- Right after the hook, give point 1 (the surprising fact) straight away. No naming it and no "comment a number" there.
- Put the comment ask after point 1, or show it only as on-screen text while the voice keeps going.

## Viral reference: 持续努力看似毫无进展 (1.4M+ views, Douyin)

What it is: a 3.5-minute horizontal (16:9) video with no voiceover at all, only music and on-screen subtitle narration.

Visuals:
- Dark purple background with thin glowing lines and one glowing dot.
- Minimal motion graphics: charts, keyboards, a tiny staircase.
- A serif title card for each section.
- Colored keywords in the subtitles: red for the problem, green for the answer, purple for the research term.

Topic: a pain point almost everyone has (working hard but not improving), not trivia.

Script chain:
1. Relatable examples: 美剧三个月听不懂, 刷题分不涨.
2. A 1897 study (Bryan & Harter telegraph plateau).
3. Why the plateau happens (chunking).
4. "You can't feel a breakthrough coming" (insight-problem study).
5. A test: practice that feels smooth vs practice that feels hard. Example numbers: 89%/60% during practice became 20%/63% a week later (interleaving).
6. Ericsson's 刻意练习.
7. A reflective question at the end: 是在积累，还是在原地打转？
8. A reference list card.

Lessons:
- On Douyin, deep and calm can beat short and loud when the topic hits a personal struggle.
- No voice is needed. Text plus music is enough, which also removes the TTS cost and the AI-voice problem.
- Every claim has a study behind it.
- Copy the format (pattern), never the video's look one to one.

## RULE (user, 2026-11-19): no music, always sound effects

- Never add music to the export. The user adds a song in the app if they want one.
- Every video gets sound design in the composition (see the `SFX` list in Talk.tsx):
  - a soft tick for each subtitle line (`tick`, about 0.18)
  - a swoosh on every scene change (`lowswoosh`, about 0.45)
  - a boom plus a high swoosh under each title card
  - scene-specific hits: clicks for loops, heartbeats (`boom` pairs), `pop` when items appear, `ding`/`chime` on a payoff
- Export one file named `*-SFX.mp4`, normalised with `loudnorm=I=-16:TP=-1.5`.

## TOPICS ALREADY USED: never repeat (check before picking a topic)

The user caught a repeat: the spotlight effect was used twice. Check this list first, and add every new topic to it.

- 拖延 / procrastination (Procrast, Habit*, Huashu/Spot cards)
- 睡前刷手机 / sleep tips (Sleep, Spec); bedtime procrastination / 报复性熬夜 (Night, long horizontal)
- 话术 / the "because" request trick (Langer copy machine) (Elegant, Vibe)
- Spotlight effect: embarrassing T-shirt, replaying moments (Story/StoryZH, Spot)
- Overthinking a chat: spotlight + illusion of transparency + liking gap + self-distancing (Talk long ZH, TalkShort EN). The repeat.
- Going silent in a fight / flooding (Fight, Fight2)
- Phantom vibration (Phantom)
- Doorway effect (Door)
- Brain drain: phone presence (Ward 2017) + closeness (Przybylski & Weinstein 2013) (Drain EN short)

## RULE from the phantom watch-analysis curve (Douyin 观看分析, Nov 19)

- The big drop came at second 4 to 5. On screen was a static phone ("没有新消息") from 2.2s to 5s.
- The voice was reading the cover text that viewers had already seen ("89%的大学生都有过").
- No motion and no new information means a swipe. After 5s the curve was flat, so the people who got past it kept watching.

Rules:
1. Something visibly changes every 1 to 1.5 seconds in the first 8 seconds: a new element, a zoom, a number popping in. Never hold a still frame.
2. The cover/hook text asks the question and must not contain the answer or the stat. The voice adds new information from second 2 onward and never re-reads the screen.
- Decoy effect: popcorn sizes + Economist subscription test (Decoy, colourful story, ZH + EN)

## STYLE (user, 2026-11-20): colourful story videos, not dark explainers

The user asked for "more coloring, more backgrounds, stories, something to entertain". The template is `Decoy.tsx`.

- A recurring character, Leo / 小林: round head, yellow hoodie, moods happy, wow, think and shock. He lives the story (at a counter, thinking, shocked by the reveal).
- Each beat has its own bright radial-gradient background that crossfades: cinema red, orange, purple, spotlight teal, green, blue, orange, teal, pink. Never one dark background for the whole video.
- Props are fun objects (popcorn buckets, a fishing hook with bait, a scale, magazine cards, confetti, marquee bulbs) and they pop in on the spoken word.
- Captions sit in a dark rounded pill so they read on any colour. The top label is a tilted yellow sticker with an ink border.
- Story structure: hook question → character story → reveal (name of the effect) → comment ask → "第二点更离谱" → real experiment with numbers → fix question → share.
- Praise = reward (萝卜纸巾猫 trend; Izuma 2008, Sugawara 2012) (Praise, colourful story, ZH + EN)
- Self-compassion / 爱你老己 (Breines & Chen 2012; hand on heart, Dreisoerner 2021) (Kind, colourful story, ZH + EN)

## Schedule (user, 2026-11-22): 2 videos a day

- Post at 11:30 and 18:30, China time.
- Make both videos for the day in one go, numbered `1-…` and `2-…`.
- Add Google Calendar reminders with popups at 10 minutes and 0 minutes. Use timeZone Asia/Shanghai, because the calendar's default is UTC.
- Trend sources: Chinese meme roundups (e.g. 萝卜纸巾猫, 爱你老己). Tie the meme to a real study.

## Back to phantom style (user, 2026-11-23)

The user said the colourful cartoon style made the level "sooo bad". Use the phantom style by default from now on:
- dark navy backdrop with yellow highlights
- big glowing line-art close-ups (face r 250–300, phone, brain, paper)
- glowing chips

Templates: `PraiseN.tsx` / `KindN.tsx`. They are generated from a shared head and main: Backdrop, Phantom hook/label/captions, `say()` timing, the `sfxFor` SFX list.

Decoy, Praise and Kind (cartoon) are kept only for reference.
- Mere exposure / earworms (Zajonc 1968, Kunst-Wilson & Zajonc 1980) (Song, sitcom style, ZH + EN)

## STYLE TEST (user, 2026-11-23): adult-sitcom cartoon (like Family Guy / Rick and Morty in feel only)

- Never copy those shows' characters, designs or names. Use only our original cast:
  - 阿杰 / Jay: spiky black hair, green hoodie, big white eyes. He falls for the trick.
  - 脑子 / Brain: a pink brain mascot with big eyes and a smug look. It explains the science (and fits the brand).
- Dialogue between the two, voiced with `tools/voice2.py`:
  - ZH: Jay = zh-CN-YunxiNeural, Brain = zh-CN-XiaoxiaoNeural
  - EN: Jay = en-US-BrianNeural, Brain = en-US-AndrewNeural
- Mouth flaps come from a per-frame RMS envelope (`song-<lang>-env.json`).
- Full room backgrounds: elevator, bathroom, living room. Sitcom tricks: a "三天后" time card, a sepia 1968 cutaway, "POP!" when Brain appears.
- Captions are a white box with an ink border and a speaker tag. Template: `Song.tsx`.

## SERIES (user, 2026-11-23): "my own Family-Guy-style series with my own characters"

- Match the genre's look and directing only. Never copy any show's characters, house, theme song or catchphrases.
- World: 幸福小区 3栋 (a Chinese apartment block).
- Cast:
  - 阿杰 / Jay: the guy who falls for it
  - 脑子 / Brain: the mascot. It pops out of Jay's head with POP + boing.
  - 王阿姨 / Auntie Wang: the neighbour, with a purple perm and glasses
- Directing (template `Ep1.tsx`):
  - hook shot
  - exterior establishing shot with a time card
  - angle cuts and snap zooms (`snap()`) on reactions
  - a deadpan close-up with crickets
  - a rimshot after a punchline
  - a sepia cutaway introduced with "就像…那次"
  - a callback tag at the end
- Funny SFX in `public/sfx`: boing, slideup, slidedown, rimshot, scratch, crickets, bonk. Plus pop, whip, ding.
- Cartoon voices via `voice2.py` with per-character rate/pitch:
  - ZH: Brain = Xiaoxiao +30Hz, Jay = Yunxi +8%
  - EN: Brain = Andrew +25Hz, Jay = Brian
- Use `gagpad.py` to insert comedy pauses after chosen beats, plus an end tag.
- Every episode still has a real study, a hook question cover, a comment ask and a share line.

## RULE (user, 2026-11-23): Jay must talk at normal speed

The sitcom episodes are character acting, not fast narration, so don't apply the global speed-up there.

- Use `tight.py` with tempo 1.0 for sitcom episodes.
- Speed comes only from each voice's own `rate`:
  - Jay +0% (normal)
  - Brain +12%
  - Cat −12% (deadpan)
- Keep pauses between lines at 0.15–0.2 s, plus the comedy pauses from `gagpad.py`.

The fast-voice rule (1.2×) still applies to narrated shorts only.

The cast now includes 主子 / Boss, Jay's chubby grey cat:
- catchphrase "随便。" / "Whatever."
- terrified when Brain pops out
- bosses Jay into getting her things
- ZH voice: zh-CN-XiaoyiNeural −12% −15Hz. EN voice: en-US-JennyNeural −12% −12Hz.

## RULE (user, 2026-11-23): camera in sitcom episodes

- Few camera cuts. Keep one steady wide shot per scene, the way a sitcom stages a room.
- Use 2–3 zoom-ins per conversation (on average) onto the character who is reacting or delivering the punchline.
- Ease the zoom in, hold it, then return to the wide shot.
- No rapid angle changes every few seconds.

## FREE production stack (user, 2026-11-23: "if it takes money I don't need it")

### Voices: CosyVoice2-0.5B (Alibaba, open source), running on CPU

The user approved running it.
- Code: `tools/cosyvoice/cv2.py`
- Model: `FunAudioLLM/CosyVoice2-0.5B` from HuggingFace
- Call: `inference_instruct2(text, '<instruction><|endofprompt|>', ref_wav)`
- Reference timbre for each character is a synthetic edge-tts clip (never a real person):
  - Auntie: zh-CN-liaoning-XiaobeiNeural, slowed and pitched down = old 东北 大妈
  - Jay: Yunxi
  - Brain: Xiaoxiao +20Hz
  - Cat: Xiaoyi −10Hz
- Instructions set dialect and emotion, e.g. 用东北话说…像六十岁的东北大妈, 懒洋洋心虚, 得意洋洋, 慵懒不屑.

Gotchas:
- Pin `transformers==4.51.3` and `diffusers==0.29.0`.
- Install `setuptools<81` and `wget`.
- Patch `frontend.load_wav` to use soundfile, because torchaudio needs torchcodec.
- Speed is about 4–15 s per line on CPU.

### Backgrounds: Canva generate-image (already linked)

- Prompt for an original adult-sitcom background with real 3/4 perspective depth and no characters.
- To get the full-size file: create-design (16:9 page with the media id) → export-design PNG 1920×1080 → download.
- The lobby of 幸福小区 3栋 came out at TV quality.
