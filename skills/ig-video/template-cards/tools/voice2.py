# Two-voice dialogue: each line has "who"; VOICES maps who -> edge-tts voice.
import asyncio, json, os, subprocess, sys
import edge_tts
D = sys.argv[1]
VOICES = json.loads(sys.argv[2])
beats = json.load(open(f'{D}/script.json'))
async def one(i, text, v):
    if isinstance(v, str):
        v = {'voice': v}
    c = edge_tts.Communicate(text, v['voice'], rate=v.get('rate', '+0%'), pitch=v.get('pitch', '+0Hz'), proxy=os.environ['HTTPS_PROXY'], boundary='WordBoundary')
    words, audio = [], bytearray()
    async for ch in c.stream():
        if ch['type'] == 'audio':
            audio += ch['data']
        elif ch['type'] == 'WordBoundary':
            words.append([ch['text'], ch['offset'] / 1e7, ch['duration'] / 1e7])
    open(f'{D}/b{i}.mp3', 'wb').write(audio)
    return words
async def retry(i, b):
    for k in range(12):
        try:
            return await one(i, b['say'], VOICES[b['who']])
        except Exception as e:
            print('retry', i, k, e)
            await asyncio.sleep(2 + k * 2)
    raise SystemExit('voice failed')
async def main():
    return [await retry(i, b) for i, b in enumerate(beats)]
allw = asyncio.run(main())
t = 0.4
for i, b in enumerate(beats):
    d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{D}/b{i}.mp3']))
    b['start'] = round(t, 3); b['dur'] = round(d, 3)
    b['words'] = [[w, round(t + o, 3), round(du, 3)] for w, o, du in allw[i]]
    t += d
json.dump(beats, open(f'{D}/beats.json', 'w'), ensure_ascii=False, indent=1)
print('ok', len(beats))
