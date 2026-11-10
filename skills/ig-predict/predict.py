#!/usr/bin/env python3
"""
predict.py - score a short video before posting, and read its first stats after.

This is a checklist model, not machine learning: each factor is something the
creator's own Douyin numbers or the viral references showed matters. It cannot
see the future; it tells you which known mistakes a video still has.

Usage
  python3 predict.py plan video.json          # before posting
  python3 predict.py stats stats.json         # 2-24 h after posting

video.json fields (all optional except length_s and hook):
  platform        "douyin" | "instagram" | "xiaohongshu"
  length_s        total seconds
  hook            first spoken/on-screen line
  hook_on_frame1  true if the hook text is visible on the very first frame
  hook_type       "stat" | "check" | "myth" | "question" | "fact" | "story"
  scene_change_s  average seconds between visual changes
  has_stat        one concrete number in the video
  has_source      the research source is shown
  ending          "vote" | "question" | "tag_friend" | "follow" | "none"
  viewer_in_it    the viewer (stick figure) appears, so people see themselves
  same_entrance   uses the series' signature opening
  ai_label        Douyin AI-content label will be added
  caption         the post caption (checked for risky words)

stats.json fields: views, bounce_2s (%), play_5s (%), completion (%),
  like_rate (%), comment_rate (%), share_rate (%), save_rate (%), length_s
"""
import json
import re
import sys

RISKY_DOUYIN = ['攻略', '私信', '领取', '发你', '加微信', 'vx', '报价', '预订', '下单']


def plan(v):
    score, notes, good = 0, [], []

    def add(points, ok, msg_ok, msg_bad):
        nonlocal score
        if ok:
            score += points
            good.append(msg_ok)
        else:
            notes.append((points, msg_bad))

    L = v.get('length_s', 60)
    add(15, L <= 25, f'{L}s: short enough to finish', f'{L}s is long; this account\'s winners were 15-25s (the 48s one died at 5s)')
    add(15, v.get('hook_on_frame1', False), 'hook visible on frame 1', 'frame 1 has no hook text: 2s bounce will be high')
    ht = v.get('hook_type', 'fact')
    add(15, ht in ('stat', 'check', 'myth'), f'hook type "{ht}" stops the scroll', f'hook type "{ht}" is weak; use a personal stat, a "如果你…" check, or a myth bust')
    hook = v.get('hook', '')
    personal = bool(re.search(r'你|You|you', hook))
    add(5, personal, 'hook speaks to "you"', 'hook does not mention the viewer ("你"/"you")')
    hlen = len(hook)
    add(5, hlen <= 22, 'hook is short', f'hook is {hlen} characters; keep it under ~20')
    add(10, v.get('scene_change_s', 6) <= 4, 'something changes every few seconds', 'scenes hold too long; change something every 3-4s')
    add(8, v.get('has_stat', False), 'one concrete number', 'no concrete number; one strong stat makes it believable and shareable')
    add(5, v.get('has_source', False), 'source shown', 'no source shown; trust (and saves) drop')
    end = v.get('ending', 'none')
    add(8, end in ('vote', 'question', 'tag_friend'), f'ending "{end}" invites comments', 'no comment trigger at the end; use a vote (扣1/扣2) or a question')
    add(5, v.get('viewer_in_it', False), 'the viewer sees himself in it', 'no viewer character; add the stick figure for connection')
    add(4, v.get('same_entrance', False), 'signature entrance: fans recognise the series', 'not using the signature entrance')
    plat = v.get('platform', 'douyin')
    cap = v.get('caption', '')
    if plat == 'douyin':
        add(5, v.get('ai_label', False), 'AI label planned', 'add the AI-content label (作者声明 → 内容由AI生成)')
        bad = [w for w in RISKY_DOUYIN if w in cap or w in hook]
        if bad:
            score -= 30
            notes.append((30, f'RISK: {", ".join(bad)} can get the video hidden as unlicensed marketing (it already happened once)'))
    score = max(0, min(100, score))
    band = 'strong' if score >= 80 else 'ok' if score >= 60 else 'weak'
    print(f'\nPRE-POST SCORE: {score}/100 ({band})\n')
    for g in good:
        print(f'  + {g}')
    if notes:
        print('\nFix first (biggest gain at the top):')
        for pts, msg in sorted(notes, reverse=True):
            print(f'  - [{pts:>2}] {msg}')
    print('\nThis predicts known mistakes, not luck: a 90 can still flop and a 60 can still fly.')


def stats(s):
    print('\nEARLY STATS CHECK (rough Douyin thresholds from creator guides; treat as guides, not rules)\n')
    rows = [
        ('2s bounce', s.get('bounce_2s'), lambda x: x <= 30, '<= 30%', 'the first frame/line loses people: change the opening'),
        ('5s play', s.get('play_5s'), lambda x: x >= 50, '>= 50%', 'people leave before the payoff: get to the point faster'),
        ('completion', s.get('completion'), lambda x: x >= (30 if s.get('length_s', 25) <= 25 else 15), '>= 30% (short) / 15% (long)', 'too long or a slow middle'),
        ('like rate', s.get('like_rate'), lambda x: x >= 3, '>= 3%', 'not enough emotional payoff'),
        ('comment rate', s.get('comment_rate'), lambda x: x >= 0.5, '>= 0.5%', 'no reason to comment: add a vote or a question'),
        ('share rate', s.get('share_rate'), lambda x: x >= 0.5, '>= 0.5%', 'nothing to send a friend: make it a "check" ("are you one?")'),
        ('save rate', s.get('save_rate'), lambda x: x >= 1, '>= 1%', 'not useful enough to keep: add a concrete action'),
    ]
    passed = 0
    for name, val, ok, target, fix in rows:
        if val is None:
            continue
        good = ok(val)
        passed += good
        print(f'  {"OK " if good else "LOW"}  {name:<13} {val:>6}%   target {target}' + ('' if good else f'   -> {fix}'))
    n = sum(1 for r in rows if r[1] is not None)
    if n:
        verdict = 'likely to get pushed further' if passed >= n - 1 else 'borderline' if passed >= n / 2 else 'unlikely to be pushed; learn from it and move on'
        print(f'\n  {passed}/{n} on target: {verdict}.')


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] not in ('plan', 'stats'):
        sys.exit(__doc__)
    data = json.load(open(sys.argv[2], encoding='utf-8'))
    (plan if sys.argv[1] == 'plan' else stats)(data)
