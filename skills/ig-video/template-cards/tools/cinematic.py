import json, sys
import numpy as np, wave
# Original cinematic bed for voice-over explainers. Keeps people watching:
# a steady forward pulse, a minor-key piano motif, a warm pad, a soft clock
# tick, a low hit on every scene change and a riser into each reveal, then it
# opens up warmer for the resolution. Usage: cinematic.py out.wav beats.json "2,6" "8"
SR = 44100
beats = json.load(open(sys.argv[2]))
reveals = [int(x) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 and sys.argv[3] else []
warm_from = int(sys.argv[4]) if len(sys.argv) > 4 else len(beats)
LEN = beats[-1]['start'] + beats[-1]['dur'] + 1.5
n = int(SR * LEN)
L = np.zeros(n); R = np.zeros(n)
rng = np.random.default_rng(5)
BPM = 90; q = 60 / BPM
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def add(at, s, pan=0.0, g=1.0):
    i = int(at * SR)
    if i >= n or i < 0: return
    s = s[: n - i] * g
    L[i:i + len(s)] += s * (1 - pan); R[i:i + len(s)] += s * (1 + pan)
def tone(f, d, att=0.005, dec=2.0, harm=((1, 1),)):
    t = np.arange(int(SR * d)) / SR
    env = np.minimum(1, t / att) * np.exp(-t * dec)
    return env * sum(a * np.sin(2 * np.pi * f * k * t) for k, a in harm)
def piano(f, d, v): return v * tone(f, d, 0.003, 1.6, ((1, 1), (2, .4), (3, .15), (4, .06)))
def pad(f, d, v):
    t = np.arange(int(SR * d)) / SR
    env = np.minimum(1, t / 1.2) * np.minimum(1, (d - t) / 1.0)
    s = sum(np.sin(2 * np.pi * f * k * t + 0.3 * np.sin(2 * np.pi * 0.2 * t)) / k for k in (1, 2, 3))
    return v * env * s
def pulse(f, v):
    return v * tone(f, 0.28, 0.004, 9, ((1, 1), (2, .5)))
def hit():
    t = np.arange(int(SR * 1.2)) / SR
    f = 45 + 50 * np.exp(-t * 12)
    return 0.7 * np.exp(-t * 4) * np.sin(2 * np.pi * np.cumsum(f) / SR)
def riser(d):
    t = np.arange(int(SR * d)) / SR
    noise = np.convolve(rng.standard_normal(len(t)), np.ones(8) / 8, 'same')
    sw = np.sin(2 * np.pi * np.cumsum(300 + 1500 * (t / d) ** 2) / SR)
    return (t / d) ** 2 * (0.25 * noise + 0.12 * sw)
def tick():
    t = np.arange(int(SR * 0.03)) / SR
    return 0.08 * np.exp(-t * 200) * rng.standard_normal(len(t))
DARK = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]]      # Dm Bb F C
WARM = [[53, 57, 60], [48, 52, 55], [50, 53, 57], [46, 50, 53]]      # F C Dm Bb
warm_t = beats[warm_from]['start'] if warm_from < len(beats) else LEN
bar = 4 * q
for b in range(int(LEN / bar) + 1):
    t0 = b * bar
    warm = t0 >= warm_t
    ch = (WARM if warm else DARK)[b % 4]
    add(t0, pad(hz(ch[0]), bar + 0.8, 0.05), -0.3)
    add(t0, pad(hz(ch[2]), bar + 0.8, 0.04), 0.3)
    for k in range(8):                                  # forward pulse, eighth notes
        add(t0 + k * q / 2, pulse(hz(ch[0] - 12), 0.22 if k % 2 == 0 else 0.13))
    motif = [ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[1] + 12] if not warm else [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[2] + 14]
    for k, m in enumerate(motif):
        add(t0 + k * q, piano(hz(m), 1.8, 0.11 if k else 0.15), 0.15)
    for k in range(8):
        add(t0 + k * q / 2, tick(), 0.4)
# a low hit on every scene change, a riser into each reveal
for i, bt in enumerate(beats[1:], 1):
    add(bt['start'] - 0.05, hit(), 0, 0.5 if i not in reveals else 0.9)
for r in reveals:
    s = beats[r]['start']
    add(s - 1.6, riser(1.6), 0, 1.0)
# gentle fades
fade = np.ones(n); fi, fo = int(SR * 0.6), int(SR * 2.5)
fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo)
L *= fade; R *= fade
pk = max(np.abs(L).max(), np.abs(R).max())
st = np.empty(n * 2); st[0::2] = L / pk * 0.85; st[1::2] = R / pk * 0.85
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
