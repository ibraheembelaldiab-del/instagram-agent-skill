import json, subprocess
old = json.load(open('../storyzh/beats.json'))
t = 0.4
subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-f','lavfi','-i','anullsrc=r=44100:cl=mono','-t','0.4','lead.wav'],check=True)
L = open('list.txt','w'); L.write("file 'lead.wav'\n")
for i, b in enumerate(old):
    gap = 0.45 if i < len(old) - 1 else 1.2
    subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',f'l{i}.mp3','-af',f'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse','-ar','44100','-ac','1',f't{i}.wav'],check=True)
    voiced = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f't{i}.wav']))
    subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',f't{i}.wav','-af',f'apad=pad_dur={gap}',f'b{i}.wav'],check=True)
    d = voiced + gap
    ws = b['words']
    o0 = ws[0][1]; oend = ws[-1][1] + ws[-1][2]
    k = voiced / (oend - o0)
    b['words'] = [[w, round(t + (s - o0) * k, 3), round(du * k, 3)] for w, s, du in ws]
    b['start'] = round(t, 3); b['dur'] = round(d, 3)
    t += d
    L.write(f"file 'b{i}.wav'\n")
L.close()
subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-f','concat','-safe','0','-i','list.txt','-c','pcm_s16le','voice.wav'],check=True)
json.dump(old, open('beats.json','w'), ensure_ascii=False, indent=1)
print('total', round(t,2))
