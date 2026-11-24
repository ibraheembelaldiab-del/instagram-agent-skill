import numpy as np, wave, sys
# A quick "wheep": a noise burst swept up through a band-pass, plus a thin
# rising whistle, 0.22 s. Original.
SR = 44100
n = int(SR * 0.22)
t = np.arange(n) / SR
rng = np.random.default_rng(3)
noise = rng.standard_normal(n)
out = np.zeros(n)
# sweep a resonant filter from 600 Hz to 5 kHz
f = 600 * (5000 / 600) ** (t / t[-1])
y1 = y2 = 0.0
for i in range(n):
    w = 2 * np.pi * f[i] / SR
    r = 0.985
    y = noise[i] * 0.08 + 2 * r * np.cos(w) * y1 - r * r * y2
    y2, y1 = y1, y
    out[i] = y
env = np.sin(np.pi * np.clip(t / 0.22, 0, 1)) ** 1.5
whistle = 0.25 * np.sin(2 * np.pi * np.cumsum(f * 0.6) / SR) * env
out = out / np.max(np.abs(out)) * env + whistle
out = out / np.max(np.abs(out)) * 0.8
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())
