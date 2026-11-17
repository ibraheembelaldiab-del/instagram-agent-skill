import json, sys
import numpy as np, wave
# Original high-energy "dark psychology" beat: 140 bpm, hard kick, gliding 808,
# snappy clap, rolling hi-hats, phonk-style cowbell riff, dark bell lead.
# It starts at full energy on frame one. Before each reveal the music cuts out
# for half a second, then slams back with an impact. Usage:
#   hype.py out.wav beats.json "2,6"
SR = 44100
beats = json.load(open(sys.argv[2]))
reveals = [int(x) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 and sys.argv[3] else []
LEN = beats[-1]['start'] + beats[-1]['dur'] + 1.5
n = int(SR * LEN)
L = np.zeros(n); R = np.zeros(n)
rng = np.random.default_rng(9)
BPM = 140; q = 60 / BPM; s16 = q / 4
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def add(at, s, pan=0.0, g=1.0):
    i = int(at * SR)
    if i >= n or i < 0: return
    s = s[: n - i] * g
    L[i:i + len(s)] += s * (1 - pan); R[i:i + len(s)] += s * (1 + pan)
def kick():
    t = np.arange(int(SR * 0.35)) / SR
    f = 50 + 120 * np.exp(-t * 35)
    return 1.0 * np.exp(-t * 8) * np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.exp(-t * 200) * rng.standard_normal(len(t))
def b808(f0, f1, d):
    t = np.arange(int(SR * d)) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 18)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return 0.9 * np.tanh(2.2 * x) * np.minimum(1, t * 200) * np.exp(-t * 1.1)
def clap():
    t = np.arange(int(SR * 0.22)) / SR
    nz = rng.standard_normal(len(t))
    nz = nz - np.convolve(nz, np.ones(4) / 4, 'same')
    env = np.exp(-t * 22) + 0.6 * np.exp(-((t - 0.012) * 300) ** 2) + 0.5 * np.exp(-((t - 0.024) * 300) ** 2)
    return 0.55 * env * nz
def hat(open_=False):
    t = np.arange(int(SR * (0.12 if open_ else 0.04))) / SR
    nz = rng.standard_normal(len(t)); nz = nz - np.convolve(nz, np.ones(3) / 3, 'same')
    return 0.18 * np.exp(-t * (25 if open_ else 140)) * nz
def cowbell(f):
    t = np.arange(int(SR * 0.3)) / SR
    x = np.sign(np.sin(2 * np.pi * f * t)) * 0.5 + np.sign(np.sin(2 * np.pi * f * 1.48 * t)) * 0.5
    x = np.convolve(x, np.ones(6) / 6, 'same')
    return 0.16 * x * np.exp(-t * 9)
def bell(f, d=0.6):
    t = np.arange(int(SR * d)) / SR
    return 0.13 * np.exp(-t * 4) * (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6))
def impact():
    t = np.arange(int(SR * 1.5)) / SR
    f = 38 + 80 * np.exp(-t * 10)
    nz = np.convolve(rng.standard_normal(len(t)), np.ones(20) / 20, 'same')
    return np.exp(-t * 3) * (0.9 * np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.6 * nz * np.exp(-t * 8))
def riser(d):
    t = np.arange(int(SR * d)) / SR
    nz = rng.standard_normal(len(t)); nz = nz - np.convolve(nz, np.ones(5) / 5, 'same')
    sw = np.sin(2 * np.pi * np.cumsum(200 + 2600 * (t / d) ** 2) / SR)
    return (t / d) ** 2.5 * (0.35 * nz + 0.18 * sw)
# silences: half a second before each reveal
gaps = [(beats[r]['start'] - 0.55, beats[r]['start']) for r in reveals]
def silent(at): return any(a <= at < b for a, b in gaps)
ROOTS = [38, 34, 41, 36]   # D  Bb  F  C (808 notes)
COW = [74, 77, 74, 72, 74, 69, 72, 74]
bar = 4 * q
for b in range(int(LEN / bar) + 1):
    t0 = b * bar
    root = ROOTS[b % 4]
    # drums
    for k in range(16):
        at = t0 + k * s16
        if silent(at): continue
        if k in (0, 6, 10) or (k == 14 and b % 2): add(at, kick(), 0, 0.9)
        if k in (4, 12): add(at, clap(), 0, 1.0)
        add(at, hat(open_=(k == 10)), 0.35 if k % 2 else -0.25)
        if k in (13, 15) and b % 2 == 1:                       # hi-hat roll
            for r in range(3): add(at + r * s16 / 3, hat(), 0.3, 0.8)
    # 808 with a glide into each bar
    if not silent(t0): add(t0, b808(hz(root + 12), hz(root), bar * 0.9), 0, 1.0)
    if not silent(t0 + 2.5 * q): add(t0 + 2.5 * q, b808(hz(root + 7), hz(root), q * 1.4), 0, 0.7)
    # phonk cowbell riff
    for k, m in enumerate(COW):
        at = t0 + k * q / 2
        if not silent(at): add(at, cowbell(hz(m + (root - 38))), 0.2, 1.0)
    # dark bell lead every other bar
    if b % 2 == 0:
        for k, m in enumerate([62, 65, 69, 67]):
            at = t0 + k * q
            if not silent(at): add(at, bell(hz(m + 12 + (root - 38))), -0.2, 1.0)
for r in reveals:
    s = beats[r]['start']
    add(s - 2.0, riser(1.45), 0, 1.0)
    add(s, impact(), 0, 1.0)
# small impact on each other scene change
for i, bt in enumerate(beats[1:], 1):
    if i not in reveals: add(bt['start'] - 0.02, impact(), 0, 0.35)
fo = int(SR * 2.0)
fade = np.ones(n); fade[-fo:] = np.linspace(1, 0, fo)
L *= fade; R *= fade
mix = np.stack([L, R])
mix = np.tanh(1.3 * mix / np.abs(mix).max()) / np.tanh(1.3)   # glue and loudness
st = np.empty(n * 2); st[0::2] = mix[0] * 0.9; st[1::2] = mix[1] * 0.9
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
