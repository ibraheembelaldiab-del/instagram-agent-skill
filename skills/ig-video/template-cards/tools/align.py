# Re-time caption words using whisper on each line's audio (char-position interpolation).
import whisper, json, sys, re, numpy as np
d, lang = sys.argv[1], sys.argv[2]
m = whisper.load_model('base')
B = json.load(open(f'{d}/q_beats.json'))
norm = lambda s: re.sub(r'[^\w]', '', s.lower())
for i, b in enumerate(B):
    r = m.transcribe(f'{d}/q_t{i}.wav', word_timestamps=True, language=lang)
    ws = [w for s in r['segments'] for w in s['words'] if norm(w['word'])]
    xs, ts, c = [0], [ws[0]['start']], 0
    for w in ws:
        c0 = c; c += len(norm(w['word']))
        xs += [c0, c]; ts += [w['start'], w['end']]
    xs = np.array(xs, float) / max(c, 1)
    mine = b['words']; tot = sum(len(norm(w[0])) for w in mine) or 1; c = 0; out = []
    for w in mine:
        a = c / tot; c += len(norm(w[0])); z = c / tot
        s = float(np.interp(a, xs, ts)); e = float(np.interp(z, xs, ts))
        out.append([w[0], round(b['start'] + s, 3), round(max(e - s, 0.05), 3)])
    b['words'] = out
    print(i, len(ws), out[0], out[-1])
json.dump(B, open(f'{d}/q_beats.json', 'w'), ensure_ascii=False, indent=1)
