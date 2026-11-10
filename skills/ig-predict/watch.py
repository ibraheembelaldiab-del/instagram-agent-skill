#!/usr/bin/env python3
"""
watch.py - watch a video file and estimate where attention holds or drops.

  python3 watch.py video.mp4 [--png heatmap.png]

What it measures, every half second:
  - visual change: how different each frame is from the one before (motion,
    text appearing, cuts), from a small greyscale copy of the video
  - audio hits: sudden rises in loudness (dings, whooshes, booms, voice)
It then marks "dead zones" (2.5 s or more with little change and no hit),
scores the first second (the hook), and estimates a hold curve: viewers drift
away a little every second, faster in dead zones, slower right after a hit.
This is an estimate from the file itself, not real viewer data.
"""
import subprocess
import sys
import numpy as np

W, H, FPS = 72, 128, 10


def frames(path):
    raw = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', path, '-vf', f'fps={FPS},scale={W}:{H},format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)


def loudness(path):
    raw = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', path, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    hop = 8000 // FPS
    n = len(a) // hop
    return np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2) + 1e-9) for i in range(n)])


def main():
    path = sys.argv[1]
    png = sys.argv[sys.argv.index('--png') + 1] if '--png' in sys.argv else None
    f = frames(path)
    diff = np.concatenate([[0], np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))])
    rms = loudness(path)
    n = min(len(diff), len(rms))
    diff, rms = diff[:n], rms[:n]
    db = 20 * np.log10(rms)
    hits = np.concatenate([[0], np.maximum(0, np.diff(db))]) > 6  # a sudden 6 dB rise
    # half-second buckets
    b = FPS // 2
    m = n // b
    vis = np.array([diff[i * b:(i + 1) * b].mean() for i in range(m)])
    aud = np.array([hits[i * b:(i + 1) * b].any() for i in range(m)])
    vn = np.clip(vis / max(1e-6, np.percentile(vis, 90)), 0, 1)
    attn = np.clip(0.75 * vn + 0.35 * aud, 0, 1)
    # dead zones: runs of >= 5 buckets (2.5 s) with low attention
    dead, run = [], 0
    for i, a in enumerate(attn):
        run = run + 1 if a < 0.2 else 0
        if run == 5:
            dead.append(i - 4)
    # hold curve
    hold, h = [], 100.0
    for i, a in enumerate(attn):
        base = 2.2 if i < 4 else 1.1  # people decide fastest at the start
        h *= 1 - (base * (1.6 - a) / 100)
        hold.append(h)
    dur = n / FPS
    first = attn[:2].mean()
    hook_score = int(round(100 * min(1, first * 1.2)))
    dead_s = sum(1 for a in attn if a < 0.2) * 0.5
    hold_end = hold[-1]
    score = int(round(0.4 * hook_score + 0.35 * min(100, hold_end * 1.25) + 0.25 * max(0, 100 - dead_s * 8)))
    print(f'\n{path.split("/")[-1]}: {dur:.1f}s')
    print(f'  Hook (first second):   {hook_score}/100')
    print(f'  Estimated hold at end: {hold_end:.0f}%')
    print(f'  Quiet time:            {dead_s:.1f}s')
    if dead:
        print('  Dead zones (2.5s+ with nothing new): ' + ', '.join(f'{d * 0.5:.1f}s' for d in dead))
    print(f'  VIDEO SCORE: {score}/100')
    row = ''.join('█' if a > 0.6 else '▓' if a > 0.35 else '▒' if a > 0.2 else '·' for a in attn)
    print('  attention per 0.5s: ' + row)
    if png:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        t = np.arange(m) * 0.5
        fig, ax = plt.subplots(2, 1, figsize=(10, 3.6), sharex=True, gridspec_kw={'height_ratios': [1, 2]})
        ax[0].imshow(attn[None, :], aspect='auto', cmap='RdYlGn', vmin=0, vmax=1, extent=[0, m * 0.5, 0, 1])
        ax[0].set_yticks([])
        ax[0].set_title('Attention heatmap (green = something new, red = nothing happening)', fontsize=10)
        ax[1].plot(t, hold, color='#3a7bd5', lw=2)
        for d in dead:
            ax[1].axvspan(d * 0.5, d * 0.5 + 2.5, color='#ff5a6e', alpha=0.2)
        ax[1].set_ylabel('est. still watching %')
        ax[1].set_xlabel('seconds')
        ax[1].set_ylim(0, 105)
        fig.tight_layout()
        fig.savefig(png, dpi=120)


if __name__ == '__main__':
    main()
