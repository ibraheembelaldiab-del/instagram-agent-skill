import numpy as np, wave, sys
# Calm original piano bed: slow arpeggios over Am - F - C - G at 68 bpm,
# soft hammer attack, gentle decay, a little room reverb. For voice-over videos.
SR = 44100
LEN = float(sys.argv[2])
beat = 60 / 68
n = int(SR * LEN)
out = np.zeros(n)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def note(f, dur, vel):
    t = np.arange(int(SR * dur)) / SR
    env = np.minimum(1, t * 250) * np.exp(-t * 1.4)
    tone = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (0.8 + k)) for k, a in [(1, 1), (2, 0.45), (3, 0.18), (4, 0.08)])
    return vel * env * tone
def put(at, s):
    i = int(at * SR)
    if i < n: out[i:i + len(s)] += s[:n - i]
CH = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 52, 55, 60], [55, 59, 62, 67]]
bar = 4 * beat
for b in range(int(LEN / bar) + 1):
    c = CH[b % 4]; t0 = b * bar
    put(t0, note(hz(c[0] - 12), bar * 1.2, 0.22))
    for k, m in enumerate([c[1], c[2], c[3], c[2], c[1] + 12, c[2], c[3], c[2]]):
        put(t0 + k * beat / 2, note(hz(m), 2.2, 0.12 if k % 2 else 0.16))
    if b % 2:
        put(t0 + 2 * beat, note(hz(c[3] + 12), 2.5, 0.07))
# room: a few soft echoes
rev = out.copy()
for d, g in [(0.031, 0.35), (0.053, 0.25), (0.089, 0.18), (0.137, 0.12)]:
    k = int(d * SR); rev[k:] += out[:-k] * g
out = np.convolve(rev, np.ones(4) / 4, mode='same')
fade = np.ones(n); fi, fo = int(SR * 1.5), int(SR * 2.5)
fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo)
out = out * fade / np.max(np.abs(out)) * 0.8
st = np.repeat(out[:, None], 2, axis=1).ravel()
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
