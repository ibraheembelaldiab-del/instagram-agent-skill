import numpy as np, wave, sys
SR = 44100
def save(path, x):
    x = x / np.max(np.abs(x)) * 0.8
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
def tone(f, d, decay=6):
    t = np.arange(int(SR * d)) / SR
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t * decay) * np.minimum(1, t * 400)
out = sys.argv[1]
# a short, gentle alarm: two-note beep pattern, twice (about 1 s)
a = np.zeros(int(SR * 1.1))
for k, (f, at) in enumerate([(1568, 0.0), (1976, 0.12), (1568, 0.45), (1976, 0.57)]):
    s = tone(f, 0.35, 9); i = int(at * SR); a[i:i + len(s)] += s[: len(a) - i]
save(f'{out}/alarm.wav', a)
# a soft final chime: a C major bell chord, rolled
c = np.zeros(int(SR * 2.4))
for k, f in enumerate([523.25, 659.25, 783.99, 1046.5]):
    s = tone(f, 2.2, 2.2) * (0.9 - k * 0.12); i = int(k * 0.07 * SR); c[i:i + len(s)] += s[: len(c) - i]
save(f'{out}/chime.wav', c)
