# word timings per line from whisper (char-position interpolation), like align.py but single-word input lines
import whisper, json, sys, re, numpy as np
d = sys.argv[1]
m = whisper.load_model('small')
B = json.load(open(f'{d}/q_beats.json'))
norm = lambda s: re.sub(r'[^\w]', '', s)
for i, b in enumerate(B):
    r = m.transcribe(f'{d}/q_t{i}.wav', word_timestamps=True, language='zh')
    ws = [w for s in r['segments'] for w in s['words'] if norm(w['word'])]
    text = b['say']
    # split the script text into ~2-char chunks at punctuation boundaries for karaoke
    parts = re.findall(r'[^，。！？：；、…,\.!?]+[，。！？：；、…,\.!?]*', text) or [text]
    chunks = []
    for p in parts:
        core = p
        while len(core) > 4:
            chunks.append(core[:2]); core = core[2:]
        chunks.append(core)
    if not ws:
        tot = sum(len(norm(c)) or 1 for c in chunks); acc = 0; out = []
        for c in chunks:
            out.append([c, round(b['start'] + b['dur'] * acc / tot, 3), 0.2]); acc += len(norm(c)) or 1
        b['words'] = out; continue
    xs, ts, c0 = [0], [ws[0]['start']], 0
    for w in ws:
        a = c0; c0 += len(norm(w['word'])); xs += [a, c0]; ts += [w['start'], w['end']]
    xs = np.array(xs, float) / max(c0, 1)
    tot = sum(len(norm(c)) for c in chunks) or 1; acc = 0; out = []
    for c in chunks:
        s = float(np.interp(acc / tot, xs, ts)); acc += len(norm(c))
        out.append([c, round(b['start'] + s, 3), 0.2])
    b['words'] = out
json.dump(B, open(f'{d}/q_beats.json', 'w'), ensure_ascii=False, indent=1)
print('aligned', len(B))
