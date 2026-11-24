# Place CosyVoice lines on the episode timeline, post-process per speaker, write q_t{i}.wav + q_beats.json + q_voice.wav
import json, subprocess, wave, array, os
D = os.path.dirname(os.path.abspath(__file__))
jobs = json.load(open(f'{D}/jobs.json'))
WHO = {'auntie_deep': 'auntie', 'jay': 'jay', 'brain': 'brain', 'catold': 'cat', 'del': 'del'}
# (absolute 'at', or gap after the previous line's end)
PLAN = {'01': ('at', 2.0), '02': ('at', 6.3), '03': ('at', 11.4), '04': ('at', 17.6), '05': ('gap', 0.9), '06': ('gap', 0.35),
        '07': ('gap', 0.85), '08': ('gap', 0.7), '09': ('gap', 0.3), '10': ('gap', 0.3), '11': ('gap', 1.0), '12': ('gap', 0.3),
        '13': ('gap', 0.4), '14': ('gap', 1.1), '15': ('gap', 0.7), '16': ('gap', 0.3), '17': ('gap', 1.0), '18': ('gap', 0.35),
        '19': ('gap', 3.6), '20': ('gap', 0.6), '21': ('gap', 0.9), '22': ('gap', 1.6)}
AF = {'auntie': 'asetrate=24000*0.95,aresample=24000,atempo=1.18,', 'cat': '', 'jay': 'atempo=1.03,', 'brain': 'atempo=1.06,', 'del': 'atempo=1.05,'}
SR = 44100
def dur(f): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]))
out_lines = []; tracks = []; prev = 0.0
for i, j in enumerate(jobs):
    who = WHO[j['who']]
    af = AF[who] + 'silenceremove=start_periods=1:start_threshold=-42dB,areverse,silenceremove=start_periods=1:start_threshold=-42dB,areverse,silenceremove=stop_periods=-1:stop_duration=0.3:stop_threshold=-42dB,loudnorm=I=-16:TP=-1.5'
    subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',f"{D}/raw/{j['name']}.wav",'-af',af,'-ar',str(SR),'-ac','1',f'{D}/q_t{i}.wav'],check=True)
    TRIM = {'05': 3.3}
    if j['name'] in TRIM:
        tr = TRIM[j['name']]
        subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',f'{D}/q_t{i}.wav','-af',f'atrim=0:{tr},afade=t=out:st={tr-0.15}:d=0.15',f'{D}/tmp.wav'],check=True)
        os.replace(f'{D}/tmp.wav', f'{D}/q_t{i}.wav')
    d = dur(f'{D}/q_t{i}.wav')
    kind, v = PLAN[j['name']]
    at = max(v, prev + 0.15) if kind == 'at' else prev + v
    if kind == 'at' and at != v: print('shift', j['name'], v, '->', round(at, 2))
    chars = [c for c in j['text']]
    out_lines.append({'id': j['name'], 'who': who, 'say': j['text'], 'start': round(at, 3), 'dur': round(d, 3),
                      'words': [[j['text'], round(at, 3), round(d, 3)]]})
    tracks.append((at, f'{D}/q_t{i}.wav')); prev = at + d
total = prev + 2.0
buf = array.array('h', [0] * int(total * SR))
for at, f in tracks:
    w = wave.open(f); a = array.array('h', w.readframes(w.getnframes())); w.close()
    s0 = int(at * SR)
    for k, x in enumerate(a):
        if s0 + k < len(buf): buf[s0 + k] = x
o = wave.open(f'{D}/q_voice.wav', 'w'); o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR); o.writeframes(buf.tobytes()); o.close()
json.dump(out_lines, open(f'{D}/q_beats.json', 'w'), ensure_ascii=False, indent=1)
print('total', round(total, 1)); print([(l['id'], l['start'], l['dur']) for l in out_lines])
