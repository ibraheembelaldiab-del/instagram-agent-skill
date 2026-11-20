import numpy as np, wave, sys, os
SR = 44100
rng = np.random.default_rng(11)
def save(path, x, ch=1):
    x = x / max(1e-9, np.max(np.abs(x))) * 0.8
    with wave.open(path, 'wb') as w:
        w.setnchannels(ch); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
out = sys.argv[1]
# ding: a soft bell, two partials, quick attack, gentle decay
t = np.arange(int(SR * 0.9)) / SR
ding = (np.sin(2 * np.pi * 1318.5 * t) + 0.4 * np.sin(2 * np.pi * 2637 * t) * np.exp(-t * 6) + 0.2 * np.sin(2 * np.pi * 3951 * t) * np.exp(-t * 10)) * np.exp(-t * 4.5) * np.minimum(1, t * 300)
save(f'{out}/ding.wav', ding)
# tick: a tiny woody click
t = np.arange(int(SR * 0.05)) / SR
tick = (np.sin(2 * np.pi * 2200 * t) * 0.6 + rng.standard_normal(len(t)) * 0.4) * np.exp(-t * 180)
save(f'{out}/tick.wav', tick)
# night: soft filtered air plus distant crickets, 4 s
n = int(SR * 4)
t = np.arange(n) / SR
air = np.convolve(rng.standard_normal(n), np.ones(300) / 300, mode='same') * 6
chirp = np.zeros(n)
for k in range(10):
    at = rng.uniform(0.2, 3.6)
    i = int(at * SR)
    for j in range(3):
        s = i + int(j * 0.05 * SR)
        m = int(0.03 * SR)
        if s + m < n:
            tt = np.arange(m) / SR
            chirp[s:s + m] += np.sin(2 * np.pi * 4300 * tt) * np.sin(np.pi * tt / tt[-1]) * 0.25
fade = np.minimum(1, t / 0.8) * np.minimum(1, (4 - t) / 0.8)
save(f'{out}/night.wav', (air + chirp) * fade)
