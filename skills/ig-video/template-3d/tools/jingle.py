import numpy as np, wave, sys
# Blocktrotter jingle: a bright marimba run up a pentatonic scale, a little
# "boop" bounce and a sparkle on top. About 1.3 s, original.
SR = 44100
def note(f, dur, amp=0.5):
    t = np.arange(int(SR * dur)) / SR
    env = np.exp(-t * 7) * np.minimum(1, t * 400)
    tone = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 18) + 0.15 * np.sin(2 * np.pi * f * 2 * t)
    return amp * env * tone
out = np.zeros(int(SR * 1.5))
def put(at, sig):
    i = int(at * SR); out[i:i + len(sig)] += sig[: len(out) - i]
seq = [(0.00, 523.25), (0.09, 659.25), (0.18, 783.99), (0.27, 880.0), (0.40, 1046.5)]
for at, f in seq: put(at, note(f, 0.6, 0.45))
put(0.40, note(523.25, 0.8, 0.3))  # a low note under the top one
# sparkle: quick high sine blips
for k, at in enumerate([0.55, 0.62, 0.69, 0.76]):
    put(at, note(2093 * (1 + 0.06 * k), 0.25, 0.12))
out = out / np.max(np.abs(out)) * 0.8
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())
