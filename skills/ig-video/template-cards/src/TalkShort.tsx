import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, useFont} from './Cards';
import {clamp, inOut, outBack} from './Spec';
import EN from './talks-en.json';
import ZH from './talks-en.json';

// Overthinking a chat (Instagram short): spotlight effect (Gilovich 2000), liking gap (Boothby 2018), self-distancing (Kross 2005). Packaging as in the
// repackaged silent-in-a-fight episode after the Nov 17 numbers (good engagement,
// weak packaging): the whole hook is big text on frame one (it is the cover),
// a close-up face that fills the screen, two points, an early comment prompt,
// a curiosity gap before point two and a share prompt at the end.

type Beat = {say: string; top: string; src?: string; start: number; dur: number; words: [string, number, number][]};
const total = (b: Beat[]) => b[b.length - 1].start + b[b.length - 1].dur;
export const TALKS_EN_FRAMES = Math.ceil(total(EN as Beat[]) * 30);
export const TALKS_ZH_FRAMES = Math.ceil(total(ZH as Beat[]) * 30);

const Y = '#ffd23f';
const W = '#ffffff';
const RED = '#ff5a6e';
const GREEN = '#4dd68a';
const DIM = '#8fa0d8';

const T = {
  en: {
    hook: ['Replaying a chat', 'all night?', 'Nobody noticed.'], hl: 2,
    loops: ['Did I sound weird?', 'Was that dumb?', 'Are they mad?'], replay: 'Replay #',
    guess: 'They guessed', real: 'Actually noticed', think: 'How much you think they liked you', act: 'How much they actually did',
    gap: 'liking gap', obs: 'a friend', ask: 'Comment 1 if you do this', share: 'Send to them', brand: ['Brain', 'Manual'], src: 'Research: ',
  },
};
T['zh' as 'en'] = T.en;
const F = 'Noto Sans SC';
const WB = (EN as Beat[]);
const wAt = (bi: number, w: string) => {
  const x = WB[bi].words.find((q) => q[0].toLowerCase().startsWith(w));
  return x ? x[1] - WB[bi].start : 1;
};
const HALF = wAt(1, 'half');
const QUART = wAt(1, 'quarter');
const LIKE = wAt(2, 'like');
const FRIEND = wAt(3, 'friend');
const COMMENT = wAt(3, 'comment');

const Scene: React.FC<{i: number; u: number; d: number; L: typeof T.en}> = ({i, u, d, L}) => {
  const svg = (c: React.ReactNode) => <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{c}</svg>;
  if (i === 0) {
    const n = 1 + Math.floor(Math.max(0, u) * 4);
    const cur = L.loops[Math.floor(Math.max(0, u) / 0.8) % L.loops.length];
    return svg(
      <>
        <g transform="translate(540 1080)">
          <rect x={-420} y={-130} width={840} height={230} rx={50} fill="rgba(255,90,110,0.12)" stroke={RED} strokeWidth={8} style={{filter: `drop-shadow(0 0 30px ${RED})`}} />
          <path d="M-250 100 l-50 90 l130 -90" fill="rgba(255,90,110,0.12)" stroke={RED} strokeWidth={8} />
          <text y={18} textAnchor="middle" fill={W} fontSize={66} fontWeight={900} fontFamily={F}>{cur}</text>
        </g>
        <g transform="translate(540 1500)">
          <circle r={110} fill="none" stroke={DIM} strokeWidth={8} />
          <path d="M0 -110 A110 110 0 0 1 110 0" stroke={Y} strokeWidth={12} fill="none" strokeLinecap="round" transform={`rotate(${u * 200})`} />
          <path d="M-26 -40 L42 0 L-26 40 Z" fill={Y} />
          <text y={190} textAnchor="middle" fill={RED} fontSize={54} fontWeight={900} fontFamily={F}>{L.replay}{n}</text>
        </g>
      </>,
    );
  }
  if (i === 1) {
    const g = clamp((u - HALF) / 0.6);
    const r = clamp((u - QUART) / 0.6);
    return svg(
      <>
        <path d="M540 640 L360 1240 L720 1240 Z" fill="rgba(255,210,63,0.12)" />
        {Array.from({length: 20}).map((_, j) => {
          const x = 220 + (j % 5) * 160; const y = 1020 + Math.floor(j / 5) * 90;
          const look = r > 0 ? j % 4 === 0 : g > 0 && j % 2 === 0;
          return x === 540 && Math.floor(j / 5) === 2 ? null : <circle key={j} cx={x} cy={y} r={20} fill={look ? Y : 'rgba(160,180,255,0.35)'} />;
        })}
        <circle cx={540} cy={1200} r={40} fill={Y} style={{filter: `drop-shadow(0 0 30px ${Y})`}} />
        <g transform="translate(150 1420)">
          <text x={0} y={0} fill={DIM} fontSize={44} fontWeight={700} fontFamily={F}>{L.guess}</text>
          <rect x={0} y={25} width={780 * 0.5 * g} height={70} rx={14} fill={RED} />
          <text x={20 + 390 * g} y={78} fill={RED} fontSize={56} fontWeight={900} fontFamily={F} opacity={g}>50%</text>
          <text x={0} y={190} fill={DIM} fontSize={44} fontWeight={700} fontFamily={F} opacity={r}>{L.real}</text>
          <rect x={0} y={215} width={780 * 0.25 * r} height={70} rx={14} fill={GREEN} style={{filter: 'drop-shadow(0 0 16px rgba(77,214,138,0.7))'}} />
          <text x={20 + 195 * r} y={268} fill={GREEN} fontSize={56} fontWeight={900} fontFamily={F} opacity={r}>~25%</text>
        </g>
      </>,
    );
  }
  if (i === 2) {
    const a = clamp((u - LIKE + 0.4) / 0.6);
    const b = clamp((u - LIKE - 0.2) / 0.8);
    return svg(
      <g transform="translate(110 1000)">
        <text x={0} y={0} fill={DIM} fontSize={40} fontWeight={700} fontFamily={F}>{L.think}</text>
        <rect x={0} y={30} width={860} height={70} rx={35} fill="none" stroke={DIM} strokeWidth={5} />
        <rect x={8} y={38} width={844 * 0.42 * a} height={54} rx={27} fill={RED} />
        <text x={0} y={250} fill={DIM} fontSize={40} fontWeight={700} fontFamily={F}>{L.act}</text>
        <rect x={0} y={280} width={860} height={70} rx={35} fill="none" stroke={DIM} strokeWidth={5} />
        <rect x={8} y={288} width={844 * 0.74 * b} height={54} rx={27} fill={GREEN} style={{filter: 'drop-shadow(0 0 16px rgba(77,214,138,0.7))'}} />
        <path d={`M${844 * 0.42} 120 V270 M${844 * 0.74} 120 V270`} stroke={Y} strokeWidth={5} strokeDasharray="12 10" opacity={b} />
        <text x={844 * 0.58} y={210} textAnchor="middle" fill={Y} fontSize={50} fontWeight={900} fontFamily={F} opacity={b}>{L.gap}</text>
      </g>,
    );
  }
  if (i === 3) {
    const z = inOut(clamp((u - FRIEND + 0.3) / 1.0));
    const ask = outBack(clamp((u - COMMENT) / 0.4));
    return svg(
      <>
        <g transform={`translate(540 1200) scale(${1.3 - z * 0.6})`}>
          <circle r={150} fill="#16204a" stroke={z > 0.5 ? GREEN : RED} strokeWidth={12} />
          <circle cx={-50} cy={-25} r={16} fill={W} />
          <circle cx={50} cy={-25} r={16} fill={W} />
          <path d={z > 0.5 ? 'M-50 50 q50 32 100 0' : 'M-50 65 q50 -32 100 0'} stroke={W} strokeWidth={12} fill="none" strokeLinecap="round" />
        </g>
        <g opacity={z}>
          <circle cx={540} cy={1200} r={260} fill="none" stroke={Y} strokeWidth={5} strokeDasharray="20 16" />
          <circle cx={860} cy={880} r={80} fill="#16204a" stroke={GREEN} strokeWidth={8} style={{filter: 'drop-shadow(0 0 20px rgba(77,214,138,0.7))'}} />
          <path d="M800 940 L700 1020" stroke={GREEN} strokeWidth={6} strokeDasharray="12 10" />
          <text x={860} y={1010} textAnchor="middle" fill={GREEN} fontSize={44} fontWeight={900} fontFamily={F}>{L.obs}</text>
        </g>
        <g transform={`translate(540 1640) rotate(-4) scale(${ask})`}>
          <rect x={-380} y={-65} width={760} height={120} rx={34} fill="rgba(13,20,48,0.95)" stroke={Y} strokeWidth={6} />
          <text y={18} textAnchor="middle" fill={Y} fontSize={54} fontWeight={900} fontFamily={F}>{L.ask}</text>
        </g>
      </>,
    );
  }
  const k = outBack(clamp(u / 0.5));
  return svg(
    <g transform={`translate(540 1200) scale(${k})`}>
      <rect x={-170} y={-300} width={340} height={600} rx={50} fill="#3a5bd9" stroke="#1e2440" strokeWidth={14} style={{filter: 'drop-shadow(0 0 60px rgba(120,170,255,0.7))'}} />
      <path d="M-60 40 L60 -40 M60 -40 L20 -50 M60 -40 L52 0" stroke={W} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${Math.sin(u * 4) * 8})`} />
      <text x={0} y={180} textAnchor="middle" fill={Y} fontSize={46} fontWeight={900} fontFamily={F}>{L.share}</text>
    </g>,
  );
};

// Sound design, no music.
const SFX: {at: number; f: string; v: number}[] = [{at: 0.05, f: 'boom', v: 0.3}];
for (let t0 = WB[0].start + 0.8; t0 < WB[1].start - 0.1; t0 += 0.8) SFX.push({at: t0, f: 'click', v: 0.9});
SFX.push({at: WB[1].start + HALF, f: 'pop', v: 0.35}, {at: WB[1].start + QUART, f: 'pop', v: 0.35}, {at: WB[1].start + QUART + 0.5, f: 'ding', v: 0.25});
SFX.push({at: WB[2].start + LIKE - 0.4, f: 'rswoosh', v: 0.35}, {at: WB[2].start + LIKE - 0.2, f: 'rswoosh', v: 0.35}, {at: WB[2].start + LIKE + 0.6, f: 'ding', v: 0.3});
SFX.push({at: WB[3].start + FRIEND - 0.3, f: 'highswoosh', v: 0.4}, {at: WB[3].start + FRIEND + 0.6, f: 'chime', v: 0.22}, {at: WB[3].start + COMMENT, f: 'pop', v: 0.35});
SFX.push({at: WB[4].start + 0.05, f: 'pop', v: 0.35});

const Captions: React.FC<{t: number; B: Beat[]; zh: boolean}> = ({t, B, zh}) => {
  let bi = B.findIndex((b) => t < b.start + b.dur);
  if (bi < 0) bi = B.length - 1;
  const ws = B[bi].words;
  if (!ws.length) return null;
  const groups: [string, number, number][][] = [];
  let cur: [string, number, number][] = [];
  for (const w of ws) {
    const len = cur.reduce((n, x) => n + x[0].length, 0);
    if (cur.length && (zh ? len + w[0].length > 9 : cur.length >= 3)) {
      groups.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) groups.push(cur);
  let g = groups.findIndex((_, k) => t < (groups[k + 1]?.[0][1] ?? Infinity));
  if (g < 0) g = groups.length - 1;
  return (
    <div style={{position: 'absolute', top: 470, left: 60, right: 60, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: zh ? 0 : 18, fontWeight: 900, fontSize: zh ? 66 : 60, lineHeight: 1.2, textShadow: '0 4px 18px rgba(0,0,0,0.8)'}}>
      {groups[g].map(([w, s], k) => (
        <span key={k} style={{whiteSpace: 'nowrap', color: t >= s ? (t < s + 0.45 ? Y : W) : 'rgba(255,255,255,0.4)'}}>{w}</span>
      ))}
    </div>
  );
};

export const TalkShort: React.FC<{lang: 'en' | 'zh'}> = ({lang}) => {
  useFont();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const B = (lang === 'zh' ? ZH : EN) as Beat[];
  const L = T[lang];
  const END = total(B);
  let i = B.findIndex((b) => t < b.start + b.dur);
  if (i < 0) i = B.length - 1;
  const b = B[i];
  const u = t - b.start;
  const inK = i === 0 ? 1 : clamp(u / 0.3);
  const fade = clamp((t - (END - 0.8)) / 0.7);
  const hookOn = i === 0;
  return (
    <AbsoluteFill style={{fontFamily: '"Noto Sans SC", sans-serif', color: W, overflow: 'hidden'}}>
      <Backdrop t={t} />
      <AbsoluteFill style={{opacity: inK, transform: `scale(${1 + clamp(u / b.dur) * 0.05})`, transformOrigin: '50% 62%'}}>
        <Scene i={i} u={u} d={b.dur} L={L} />
      </AbsoluteFill>
      {hookOn ? (
        // The cover: the whole hook, big, from frame one.
        <div style={{position: 'absolute', top: 150, left: 60, right: 60, textAlign: 'center', fontWeight: 900, fontSize: lang === 'zh' ? 92 : 78, lineHeight: 1.38, textShadow: '0 6px 24px rgba(0,0,0,0.8)'}}>
          {L.hook.map((line, k) => (
            <div key={k}>
              {k === L.hl ? <span style={{display: 'inline-block', marginTop: 14, background: Y, color: '#16141a', padding: '0 18px', borderRadius: 14, lineHeight: 1.25}}>{line}</span> : line}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center'}}>
            <span style={{fontSize: 56, fontWeight: 900, color: '#16141a', background: Y, padding: '8px 30px', borderRadius: 16}}>{b.top}</span>
          </div>
          <Captions t={t} B={B} zh={lang === 'zh'} />
        </>
      )}
      {b.src ? <div style={{position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center', fontSize: 30, fontWeight: 700, color: DIM}}>{L.src}{b.src}</div> : null}
      <div style={{position: 'absolute', top: 70, left: 60, fontSize: 30, color: DIM, letterSpacing: 4}}>
        {L.brand[0]}<span style={{background: Y, color: '#16141a', padding: '0 8px', borderRadius: 6, marginLeft: 6}}>{L.brand[1]}</span>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
      <Audio src={staticFile(`talks/en-voice.wav`)} />
      {B.slice(1).map((bb, k) => (
        <Sequence key={k} from={Math.max(0, Math.round((bb.start - 0.2) * fps))} durationInFrames={Math.round(0.7 * fps)}>
          <Audio src={staticFile('sfx/whoosh.wav')} volume={0.4} />
        </Sequence>
      ))}
      {SFX.map((x, j) => (
        <Sequence key={`s${j}`} from={Math.max(0, Math.round(x.at * fps))} durationInFrames={Math.round(2.5 * fps)}>
          <Audio src={staticFile(`sfx/${x.f}.wav`)} volume={x.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
