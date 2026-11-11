import numpy as np, wave, sys
# Calm original lo-fi: Fmaj7 - Em7 - Dm7 - Cmaj7 at 74 bpm, soft electric
# piano, warm sine bass, brushed kick/snare/hat with swing, vinyl crackle.
SR = 44100
LEN = float(sys.argv[2]) if len(sys.argv) > 2 else 18.0
BPM = 74
beat = 60 / BPM
n = int(SR * LEN)
L = np.zeros(n); R = np.zeros(n)
rng = np.random.default_rng(7)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def add(at, sig, pan=0.0, gain=1.0):
    i = int(at * SR)
    if i >= n: return
    s = sig[: n - i] * gain
    L[i:i + len(s)] += s * (1 - pan) ; R[i:i + len(s)] += s * (1 + pan)
def epiano(f, dur, vel=0.18):
    t = np.arange(int(SR * dur)) / SR
    env = np.minimum(1, t * 60) * np.exp(-t * 1.6)
    trem = 1 + 0.08 * np.sin(2 * np.pi * 4.5 * t)
    tone = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 4) + 0.08 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 8)
    return vel * env * trem * tone
def bass(f, dur):
    t = np.arange(int(SR * dur)) / SR
    env = np.minimum(1, t * 40) * np.exp(-t * 0.9)
    return 0.22 * env * (np.sin(2 * np.pi * f * t) + 0.15 * np.sin(2 * np.pi * 2 * f * t))
def kick():
    t = np.arange(int(SR * 0.35)) / SR
    f = 50 + 70 * np.exp(-t * 30)
    return 0.45 * np.exp(-t * 9) * np.sin(2 * np.pi * np.cumsum(f) / SR)
def snare():
    t = np.arange(int(SR * 0.25)) / SR
    noise = rng.standard_normal(len(t))
    k = np.ones(40) / 40
    soft = np.convolve(noise, k, mode='same')
    return 0.16 * np.exp(-t * 16) * soft * 3
def hat():
    t = np.arange(int(SR * 0.06)) / SR
    noise = rng.standard_normal(len(t))
    hp = noise - np.convolve(noise, np.ones(6) / 6, mode='same')
    return 0.05 * np.exp(-t * 60) * hp
CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]  # Fmaj7 Em7 Dm7 Cmaj7
ROOTS = [41, 40, 38, 36]
bar = 4 * beat
nb = int(LEN / bar) + 1
for b in range(nb):
    c = CHORDS[b % 4]
    t0 = b * bar
    # chord on beat 1, a softer re-strike on the "and" of 3
    for j, m in enumerate(c):
        add(t0 + j * 0.018, epiano(hz(m + 12), bar * 0.95), pan=(j - 1.5) * 0.15)
        add(t0 + 2.5 * beat + j * 0.02, epiano(hz(m + 12), bar * 0.4, 0.08), pan=(j - 1.5) * 0.15)
    # a little melody note now and then
    if b % 2 == 1:
        add(t0 + 1.5 * beat, epiano(hz(c[3] + 24), 1.2, 0.07), pan=0.3)
        add(t0 + 3 * beat, epiano(hz(c[2] + 24), 1.2, 0.06), pan=-0.2)
    add(t0, bass(hz(ROOTS[b % 4]), bar * 0.9))
    for q in range(8):
        sw = 0.06 * beat if q % 2 else 0
        tt = t0 + q * beat / 2 + sw
        if q in (0, 5): add(tt, kick(), gain=1.0)
        if q in (2, 6): add(tt, snare(), gain=1.0)
        add(tt, hat(), pan=0.25, gain=0.9 if q % 2 else 1.1)
# vinyl crackle and a soft hiss
for _ in range(int(LEN * 9)):
    add(rng.uniform(0, LEN), rng.standard_normal(30) * np.exp(-np.arange(30) / 4) * 0.02, pan=rng.uniform(-0.5, 0.5))
hiss = rng.standard_normal(n) * 0.003
L += hiss; R += hiss
# warm it: gentle low-pass
k = np.ones(5) / 5
L = np.convolve(L, k, mode='same'); R = np.convolve(R, k, mode='same')
# fades
fade = np.ones(n); fi = int(SR * 0.8); fo = int(SR * 2.0)
fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo)
L *= fade; R *= fade
peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
L, R = L / peak * 0.8, R / peak * 0.8
st = np.empty(n * 2); st[0::2] = L; st[1::2] = R
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
