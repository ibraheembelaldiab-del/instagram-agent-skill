# Insert comedy pauses after given beats: gagpad.py dir '{"2":0.3,"4":0.6}' endpad
import json, sys, wave, array
d, pads, endpad = sys.argv[1], {int(k): v for k, v in json.loads(sys.argv[2]).items()}, float(sys.argv[3])
B = json.load(open(f'{d}/q_beats.json'))
w = wave.open(f'{d}/q_voice.wav'); sr = w.getframerate(); ch = w.getnchannels(); a = array.array('h', w.readframes(w.getnframes())); w.close()
shift = 0.0; out = array.array('h')
pos = 0
for i, b in enumerate(B):
    end = b['start'] + b['dur']
    e_idx = int(round(end * sr)) * ch
    out.extend(a[pos:e_idx]); pos = e_idx
    b['start'] = round(b['start'] + shift, 3)
    b['words'] = [[x, round(s + shift, 3), du] for x, s, du in b['words']]
    p = pads.get(i, 0.0) + (endpad if i == len(B) - 1 else 0.0)
    if p:
        out.extend(array.array('h', [0] * int(p * sr) * ch))
        b['dur'] = round(b['dur'] + p, 3)
        shift += p
out.extend(a[pos:])
o = wave.open(f'{d}/g_voice.wav', 'w'); o.setnchannels(ch); o.setsampwidth(2); o.setframerate(sr); o.writeframes(out.tobytes()); o.close()
json.dump(B, open(f'{d}/g_beats.json', 'w'), ensure_ascii=False, indent=1)
print('total', round(B[-1]['start'] + B[-1]['dur'], 2), [b['start'] for b in B])
