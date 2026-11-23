# CosyVoice2 instruct: cv2.py <repo> <model> <jobs.json> <outdir>; job = {name, who, text, instruct}
import sys, json, time
sys.path.insert(0, sys.argv[1]); sys.path.insert(0, sys.argv[1] + '/third_party/Matcha-TTS')
from cosyvoice.cli.cosyvoice import AutoModel
import cosyvoice.cli.frontend as _fe
import soundfile as _sf, torch as _torch, torchaudio as _ta
def _load_wav(wav, target_sr, min_sr=16000):
    a, sr = _sf.read(wav, dtype='float32', always_2d=True)
    sp = _torch.from_numpy(a.T).mean(dim=0, keepdim=True)
    if sr != target_sr:
        sp = _ta.functional.resample(sp, sr, target_sr)
    return sp
_fe.load_wav = _load_wav
import soundfile as sf, numpy as np
cv = AutoModel(model_dir=sys.argv[2])
cv.model.llm.float() if False else None
jobs = json.load(open(sys.argv[3])); out = sys.argv[4]
REF = sys.argv[5]
for j in jobs:
    t = time.time(); parts = []
    for o in cv.inference_instruct2(j['text'], j['instruct'] + '<|endofprompt|>', f"{REF}/{j['who']}.wav", stream=False):
        parts.append(o['tts_speech'].squeeze(0).numpy())
    sf.write(f"{out}/{j['name']}.wav", np.concatenate(parts), cv.sample_rate)
    print(j['name'], round(time.time() - t, 1), 's', flush=True)
