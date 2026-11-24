import json, sys
import numpy as np, wave
# Original emotional trailer-style score: urgent staccato string ostinato,
# cinematic drums (low toms + big hits), an aching piano melody, long string
# swells that grow scene by scene, silence then an impact before each reveal,
# and a warm major-key lift for the resolution. Usage:
#   trailer.py out.wav beats.json "2,6" 8
SR = 44100
beats = json.load(open(sys.argv[2]))
reveals = [int(x) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 and sys.argv[3] else []
warm_from = int(sys.argv[4]) if len(sys.argv) > 4 else len(beats)
LEN = beats[-1]['start'] + beats[-1]['dur'] + 2.0
n = int(SR * LEN)
L = np.zeros(n); R = np.zeros(n)
rng = np.random.default_rng(3)
BPM = 92; q = 60 / BPM; s16 = q / 4
warm_t = beats[warm_from]['start'] if warm_from < len(beats) else LEN
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def add(at, s, pan=0.0, g=1.0):
    i = int(at * SR)
    if i >= n or i < 0: return
    s = s[: n - i] * g
    L[i:i + len(s)] += s * (1 - pan); R[i:i + len(s)] += s * (1 + pan)
def lp(x, k=6): return np.convolve(x, np.ones(k) / k, 'same')
def saw(f, t): return 2 * ((f * t) % 1) - 1
def string(f, d, v, att=0.5):
    t = np.arange(int(SR * d)) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t)
    x = sum(saw(f * vib * dt, t) for dt in (1, 1.004, 0.996)) / 3
    env = np.minimum(1, t / att) * np.minimum(1, (d - t) / 0.6)
    return v * lp(x, 10) * env
def stac(f, v):
    t = np.arange(int(SR * 0.16)) / SR
    x = sum(saw(f * dt, t) for dt in (1, 1.006)) / 2
    return v * lp(x, 8) * np.minimum(1, t * 300) * np.exp(-t * 20)
def piano(f, d, v):
    t = np.arange(int(SR * d)) / SR
    env = np.minimum(1, t * 300) * np.exp(-t * 1.3)
    return v * env * sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * k * 0.6) for k, a in ((1, 1), (2, .45), (3, .2), (4, .08)))
def tom(f=70, v=1.0):
    t = np.arange(int(SR * 0.6)) / SR
    ff = f + 60 * np.exp(-t * 25)
    return v * np.exp(-t * 6) * np.sin(2 * np.pi * np.cumsum(ff) / SR) + v * 0.2 * np.exp(-t * 60) * lp(rng.standard_normal(len(t)), 3)
def boom():
    t = np.arange(int(SR * 2.5)) / SR
    f = 32 + 70 * np.exp(-t * 6)
    nz = lp(rng.standard_normal(len(t)), 30)
    return np.exp(-t * 1.8) * (1.0 * np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * nz * np.exp(-t * 5))
def riser(d):
    t = np.arange(int(SR * d)) / SR
    x = sum(saw(hz(62) * (1 + (t / d) ** 2) * dt, t) for dt in (1, 1.01)) / 2
    return (t / d) ** 2.2 * 0.3 * lp(x, 6) + (t / d) ** 3 * 0.2 * lp(rng.standard_normal(len(t)), 4)
gaps = [(beats[r]['start'] - 0.5, beats[r]['start']) for r in reveals]
def silent(a, b=None):
    b = a if b is None else b
    return any(x <= a < y or x <= b < y or (a < x and b > y) for x, y in gaps)
DARK = [[50, 57, 62, 65], [46, 53, 58, 62], [53, 60, 65, 69], [48, 55, 60, 64]]   # Dm Bb F C
WARM = [[53, 60, 65, 69], [48, 55, 60, 64], [50, 57, 62, 65], [46, 53, 58, 65]]   # F C Dm Bb(add)
MEL_D = [74, 72, 69, 72, 74, 77, 76, 74]
MEL_W = [77, 76, 72, 74, 77, 79, 81, 77]
bar = 4 * q
nbars = int(LEN / bar) + 1
for b in range(nbars):
    t0 = b * bar
    warm = t0 >= warm_t
    ch = (WARM if warm else DARK)[b % 4]
    grow = min(1.0, 0.45 + t0 / (warm_t + 1) * 0.6)          # intensity builds through the story
    # string swell (cut where a reveal gap falls)
    if not silent(t0, t0 + bar):
        for k, m in enumerate(ch[1:]):
            add(t0, string(hz(m), bar + 0.4, 0.07 * grow, 0.8), (k - 1) * 0.35)
        add(t0, string(hz(ch[0] - 12), bar + 0.4, 0.09 * grow, 0.4))
    # urgent staccato ostinato in 16ths
    pat = [ch[0], ch[0] + 12, ch[1], ch[0] + 12]
    for k in range(16):
        at = t0 + k * s16
        if not silent(at): add(at, stac(hz(pat[k % 4]), 0.10 * grow * (1.2 if k % 4 == 0 else 0.8)), 0.25 if k % 2 else -0.25)
    # drums: low toms driving, bigger later
    for k, v in [(0, 1.0), (6, 0.6), (8, 0.8), (11, 0.5), (14, 0.7)]:
        at = t0 + k * s16
        if not silent(at): add(at, tom(62 if k % 8 == 0 else 80, v * 0.55 * grow))
    # aching piano melody
    mel = MEL_W if warm else MEL_D
    for k, m in enumerate(mel):
        at = t0 + k * q / 2
        if not silent(at) and (b % 2 == 0 or k % 2 == 0):
            add(at, piano(hz(m + (ch[0] - 50 if not warm else ch[0] - 53)), 1.8, 0.12), 0.1)
for r in reveals:
    s = beats[r]['start']
    add(s - 2.1, riser(1.6), 0, 1.0)
    add(s, boom(), 0, 1.0)
for i, bt in enumerate(beats[1:], 1):
    if i not in reveals: add(bt['start'] - 0.03, tom(55, 0.6))
# the resolution gets a soft boom and a long warm chord
add(warm_t, boom(), 0, 0.5)
fo = int(SR * 2.5)
fade = np.ones(n); fi = int(SR * 0.3)
fade[:fi] = np.linspace(0.4, 1, fi); fade[-fo:] = np.linspace(1, 0, fo)
L *= fade; R *= fade
mix = np.stack([L, R]); mix = np.tanh(1.2 * mix / np.abs(mix).max()) / np.tanh(1.2)
st = np.empty(n * 2); st[0::2] = mix[0] * 0.9; st[1::2] = mix[1] * 0.9
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
