---
name: ig-predict
description: >-
  Virality predictor. Score a short video before posting (hook, length, first
  frame, stat, source, ending, viewer character, risky words) and read its
  first stats after posting (2s bounce, 5s play, completion, like / comment /
  share / save rates). Use when the user says "predict", "will this go viral",
  "virality predictor", "score this video", or sends early stats.
---

# ig-predict

```bash
python3 watch.py video.mp4 --png heat.png   # watch the actual file: hook, dead zones, attention heatmap, hold curve
python3 predict.py plan video.json     # before posting: score out of 100 and what to fix
python3 predict.py stats stats.json    # 2-24 h after: is Douyin likely to push it further?
```

A checklist model, not machine learning. Every factor comes from this
creator's own Douyin numbers (short 15-25s winners, the 48s video losing 70%
by 5s, 54% 2s bounce on a plain-question hook, a video hidden for "攻略") and
from the viral references they shared. Run `plan` on every video before
sending it; fix the top item if it scores under 80. Run `stats` when the
creator sends a 作品数据 screenshot. Be honest that it predicts known mistakes,
not luck.

Back-test: the 立冬 video scored 58 (weak) before posting and its real stats
were 1/6 on target, so the model agreed with reality on that one.

`watch.py` is the self-run stand-in for tools like Higgsfield's Virality
Predictor (which needs the creator's own login): it measures visual change
and audio hits every half second, draws an attention heatmap, estimates a
hold curve and lists dead zones. Report both scores together, and fix the red
stretches before sending a video. Needs numpy and matplotlib.
Note: `safe_export.sh` holds the first frame for 0.4 s, which reads as low
motion; judge the hook on the render before the safe export.
