import asyncio, json, os, subprocess
import edge_tts
D = os.path.dirname(os.path.abspath(__file__))
beats = json.load(open(f'{D}/script.json'))
VOICE = 'en-US-AndrewNeural'
async def one(i, text):
    c = edge_tts.Communicate(text, VOICE, rate='-6%', proxy=os.environ['HTTPS_PROXY'], boundary='WordBoundary')
    words, audio = [], bytearray()
    async for ch in c.stream():
        if ch['type'] == 'audio':
            audio += ch['data']
        elif ch['type'] == 'WordBoundary':
            words.append([ch['text'], ch['offset'] / 1e7, ch['duration'] / 1e7])
    open(f'{D}/b{i}.mp3', 'wb').write(audio)
    return words
async def retry(i, text):
    for k in range(6):
        try:
            return await one(i, text)
        except Exception as e:
            print('retry', i, k, e)
            await asyncio.sleep(2 + k * 2)
    raise SystemExit('voice failed')
async def main():
    return [await retry(i, b['say']) for i, b in enumerate(beats)]
allw = asyncio.run(main())
t = 0.4  # a short breath before the first word
with open(f'{D}/list.txt', 'w') as L:
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', '0.4', f'{D}/lead.wav'], check=True)
    L.write("file 'lead.wav'\n")
    for i, b in enumerate(beats):
        gap = 0.55 if i < len(beats) - 1 else 1.2
        subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', f'{D}/b{i}.mp3', '-af', f'apad=pad_dur={gap}', '-ar', '24000', '-ac', '1', f'{D}/b{i}.wav'], check=True)
        d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{D}/b{i}.wav']))
        b['start'] = round(t, 3); b['dur'] = round(d, 3)
        b['words'] = [[w, round(t + o, 3), round(du, 3)] for w, o, du in allw[i]]
        t += d
        L.write(f"file 'b{i}.wav'\n")
subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f'{D}/list.txt', '-c', 'pcm_s16le', f'{D}/voice.wav'], check=True)
json.dump(beats, open(f'{D}/beats.json', 'w'), indent=1)
print('total', round(t, 2), [b['dur'] for b in beats], 'words in beat0:', len(beats[0]['words']))
