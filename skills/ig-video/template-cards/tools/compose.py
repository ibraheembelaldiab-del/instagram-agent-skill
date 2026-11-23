# Place dialogue lines at chosen times: compose.py <dir> '<voices json>'
# script.json: [{who, say, at, top?, src?}] -> q_t{i}.wav, q_beats.json (start/dur/words), q_voice.wav
import asyncio, json, os, subprocess, sys, wave, array
import edge_tts
D = sys.argv[1]; VOICES = json.loads(sys.argv[2])
L = json.load(open(f'{D}/script.json'))
async def one(i, b):
    v = VOICES[b['who']]
    for k in range(12):
        try:
            c = edge_tts.Communicate(b['say'], v['voice'], rate=v.get('rate', '+0%'), pitch=v.get('pitch', '+0Hz'), proxy=os.environ['HTTPS_PROXY'], boundary='WordBoundary')
            words, audio = [], bytearray()
            async for ch in c.stream():
                if ch['type'] == 'audio': audio += ch['data']
                elif ch['type'] == 'WordBoundary': words.append([ch['text'], ch['offset'] / 1e7, ch['duration'] / 1e7])
            open(f'{D}/r{i}.mp3', 'wb').write(audio)
            return words
        except Exception as e:
            print('retry', i, k, e); await asyncio.sleep(2 + 2 * k)
    raise SystemExit('voice failed')
async def main():
    return [await one(i, b) for i, b in enumerate(L)]
W = asyncio.run(main())
SR = 44100
def dur(f): return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f]))
prev_end = 0.0; tracks = []
for i, b in enumerate(L):
    lead = subprocess.run(['ffmpeg','-nostdin','-i',f'{D}/r{i}.mp3','-af','silencedetect=n=-45dB:d=0.05','-f','null','-'],capture_output=True,text=True).stderr
    subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',f'{D}/r{i}.mp3','-af','silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse','-ar',str(SR),'-ac','1',f'{D}/q_t{i}.wav'],check=True)
    d = dur(f'{D}/q_t{i}.wav')
    at = max(b['at'], prev_end + 0.12)
    if at != b['at']: print(f'line {i} shifted {b["at"]} -> {round(at,2)}')
    ws = W[i]; o0 = ws[0][1]; o1 = ws[-1][1] + ws[-1][2]; k = d / max(o1 - o0, 1e-3)
    b['start'] = round(at, 3); b['dur'] = round(d, 3)
    b['words'] = [[w, round(at + (s - o0) * k, 3), round(du * k, 3)] for w, s, du in ws]
    prev_end = at + d; tracks.append((at, f'{D}/q_t{i}.wav'))
total = prev_end + 1.2
out = array.array('h', [0] * int(total * SR))
for at, f in tracks:
    w = wave.open(f); a = array.array('h', w.readframes(w.getnframes())); w.close()
    s0 = int(at * SR)
    for j, x in enumerate(a):
        if s0 + j < len(out): out[s0 + j] = x
o = wave.open(f'{D}/q_voice.wav', 'w'); o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR); o.writeframes(out.tobytes()); o.close()
json.dump(L, open(f'{D}/q_beats.json', 'w'), ensure_ascii=False, indent=1)
print('total', round(total, 2), [(b['who'], b['start'], b['dur']) for b in L])
