# Tight voice build: trims edges, squeezes inner pauses, speeds up, tiny gaps.
# usage: tight.py <dir> <mp3prefix> <beats-src.json> <tempo> <gap>
import json, subprocess, sys, os, re
d, pre, src, tempo, gap = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5])
os.chdir(d)
old = json.load(open(src))
def run(*a): subprocess.run(['ffmpeg','-nostdin','-v','error','-y',*a], check=True)
def dur(f): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]))
t = 0.15
run('-f','lavfi','-i','anullsrc=r=44100:cl=mono','-t',str(t),'q_lead.wav')
L = open('q_list.txt','w'); L.write("file 'q_lead.wav'\n")
for i, b in enumerate(old):
    g = gap if i < len(old) - 1 else 0.8
    af = ('silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,'
          'silenceremove=stop_periods=-1:stop_duration=0.12:stop_threshold=-45dB,'
          f'atempo={tempo}')
    run('-i', f'{pre}{i}.mp3', '-af', af, '-ar','44100','-ac','1', f'q_t{i}.wav')
    voiced = dur(f'q_t{i}.wav')
    run('-i', f'q_t{i}.wav', '-af', f'apad=pad_dur={g}', f'q_b{i}.wav')
    ws = b['words']; o0 = ws[0][1]; oend = ws[-1][1] + ws[-1][2]
    # speech chunks in the audio
    log = subprocess.run(['ffmpeg','-nostdin','-i',f'q_t{i}.wav','-af','silencedetect=n=-40dB:d=0.06','-f','null','-'],capture_output=True,text=True).stderr
    ss = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
    se = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    chunks = []; p = 0.0
    for a, z in zip(ss, se):
        if a > p + 0.05: chunks.append((p, a))
        p = z
    if voiced > p + 0.05: chunks.append((p, voiced))
    # word groups split at pauses in the source timing
    groups = [[ws[0]]]
    for prev, w in zip(ws, ws[1:]):
        if w[1] - (prev[1] + prev[2]) > 0.12: groups.append([w])
        else: groups[-1].append(w)
    while len(chunks) > len(groups):
        j = min(range(len(chunks) - 1), key=lambda j: chunks[j + 1][0] - chunks[j][1])
        chunks[j:j + 2] = [(chunks[j][0], chunks[j + 1][1])]
    while len(groups) > len(chunks):
        j = min(range(len(groups) - 1), key=lambda j: groups[j + 1][0][1] - (groups[j][-1][1] + groups[j][-1][2]))
        groups[j:j + 2] = [groups[j] + groups[j + 1]]
    out = []
    if len(groups) == len(chunks) and len(chunks) > 1:
        for g_, (ca, cz) in zip(groups, chunks):
            g0 = g_[0][1]; g1 = g_[-1][1] + g_[-1][2]; kk = (cz - ca) / max(g1 - g0, 1e-3)
            out += [[w, round(t + ca + (s - g0) * kk, 3), round(du * kk, 3)] for w, s, du in g_]
        print(i, 'piecewise', len(chunks))
    else:
        k = voiced / (oend - o0)
        out = [[w, round(t + (s - o0) * k, 3), round(du * k, 3)] for w, s, du in ws]
        print(i, 'linear', len(groups), len(chunks))
    b['words'] = out
    b['start'] = round(t, 3); b['dur'] = round(voiced + g, 3)
    t += voiced + g
    L.write(f"file 'q_b{i}.wav'\n")
L.close()
run('-f','concat','-safe','0','-i','q_list.txt','-c','pcm_s16le','q_voice.wav')
json.dump(old, open('q_beats.json','w'), ensure_ascii=False, indent=1)
print('total', round(t, 2))
