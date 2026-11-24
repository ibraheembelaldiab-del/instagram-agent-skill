import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, useFont} from './Cards';
import {clamp, inOut, outBack} from './Spec';
import EN from './door-en.json';
import ZH from './door-zh.json';

// Doorway effect (Radvansky 2011) + context memory (Godden & Baddeley 1975). Packaging as in the
// repackaged silent-in-a-fight episode after the Nov 17 numbers (good engagement,
// weak packaging): the whole hook is big text on frame one (it is the cover),
// a close-up face that fills the screen, two points, an early comment prompt,
// a curiosity gap before point two and a share prompt at the end.

type Beat = {say: string; top: string; src?: string; start: number; dur: number; words: [string, number, number][]};
const total = (b: Beat[]) => b[b.length - 1].start + b[b.length - 1].dur;
export const DOOR_EN_FRAMES = Math.ceil(total(EN as Beat[]) * 30);
export const DOOR_ZH_FRAMES = Math.ceil(total(ZH as Beat[]) * 30);

const Y = '#ffd23f';
const W = '#ffffff';
const RED = '#ff5a6e';
const GREEN = '#4dd68a';
const DIM = '#8fa0d8';

const T = {
  en: {
    hook: ['Walk into a room…', 'and forget why?', "Blame the door."], hl: 2,
    task: 'get keys', saved: 'SAVED', back: 'walk back', ask: 'Same? Comment 1',
    wl: 'learn underwater', wt: 'test underwater', ll: 'learn underwater', lt: 'test on land',
    share: 'Send to them', brand: ['Brain', 'Manual'], src: 'Research: ',
  },
  zh: {
    hook: ['走进房间', '就忘了要干嘛？', '不怪你，怪那道门'], hl: 2,
    task: '拿钥匙', saved: '已存档', back: '走回原地', ask: '你也这样？打1',
    wl: '水下背', wt: '水下考', ll: '水下背', lt: '岸上考',
    share: '转给TA', brand: ['脑子', '说明书'], src: '研究：',
  },
};
const F = 'Noto Sans SC';
// A doorway with a head walking through it; the thought bubble pops when it crosses.
const Doorway: React.FC<{u: number; L: typeof T.en; walk: number}> = ({u, L, walk}) => {
  const x = 230 + walk * 620;
  const lost = x > 540;
  return (
    <>
      <rect x={400} y={820} width={280} height={820} rx={10} fill="#0a1030" stroke={Y} strokeWidth={14} />
      <path d="M680 820 L840 760 L840 1700 L680 1640 Z" fill="#2a3a7a" stroke="#0d1430" strokeWidth={8} />
      <circle cx={815} cy={1240} r={14} fill={Y} />
      <line x1={0} y1={1640} x2={1080} y2={1640} stroke={DIM} strokeWidth={6} />
      <g transform={`translate(${x} ${1300 + Math.abs(Math.sin(u * 7)) * -14})`}>
        <circle r={150} fill="#16204a" stroke={W} strokeWidth={12} />
        <circle cx={-50} cy={-20} r={lost ? 22 : 12} fill={W} />
        <circle cx={50} cy={-20} r={lost ? 22 : 12} fill={W} />
        <path d={lost ? 'M-30 70 h60' : 'M-40 50 q40 35 80 0'} stroke={W} strokeWidth={12} fill="none" strokeLinecap="round" />
        <g transform="translate(60 -250)">
          <ellipse rx={150} ry={80} fill={lost ? 'rgba(255,90,110,0.15)' : 'rgba(255,210,63,0.15)'} stroke={lost ? RED : Y} strokeWidth={8} />
          <circle cx={-90} cy={110} r={18} fill="none" stroke={lost ? RED : Y} strokeWidth={6} />
          <text y={22} textAnchor="middle" fill={lost ? RED : Y} fontSize={lost ? 110 : L.task.length > 4 ? 44 : 58} fontWeight={900} fontFamily={F}>{lost ? '?' : L.task}</text>
        </g>
      </g>
    </>
  );
};

const Scene: React.FC<{i: number; u: number; d: number; L: typeof T.en}> = ({i, u, d, L}) => {
  const svg = (c: React.ReactNode) => <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{c}</svg>;
  if (i === 0) return svg(<Doorway u={u} L={L} walk={clamp((u - 0.2) / 1.6)} />);
  if (i === 1) {
    // the thought flies into a "saved" box
    const fly = inOut(clamp((u - 0.6) / 1.2));
    const shut = clamp((u - 1.8) / 0.4);
    return svg(
      <>
        <g transform="translate(540 1000)">
          <ellipse rx={260} ry={190} fill="#16204a" stroke={Y} strokeWidth={10} style={{filter: 'drop-shadow(0 0 40px rgba(255,210,63,0.4))'}} />
          <path d="M-150 -40 q60 -80 130 0 q60 -80 130 0 M-150 60 q100 -60 280 0" stroke={Y} strokeWidth={10} fill="none" />
        </g>
        <g transform={`translate(540 ${1000 + fly * 520}) scale(${1 - fly * 0.4})`} opacity={1 - shut}>
          <rect x={-150} y={-60} width={300} height={110} rx={24} fill={Y} />
          <text y={22} textAnchor="middle" fill="#16141a" fontSize={56} fontWeight={900} fontFamily={F}>{L.task}</text>
        </g>
        <g transform="translate(540 1560)">
          <rect x={-220} y={-40} width={440} height={240} rx={20} fill="#2a3a7a" stroke={W} strokeWidth={8} />
          <path d={`M-230 -40 L${-230 + 460} ${-40 - (1 - shut) * 160}`} stroke={W} strokeWidth={14} strokeLinecap="round" />
          <text y={110} textAnchor="middle" fill={W} fontSize={60} fontWeight={900} fontFamily={F} opacity={shut}>{L.saved}</text>
        </g>
      </>,
    );
  }
  if (i === 2) {
    const back = clamp((u - 0.3) / 1.4);
    const bulb = clamp((u - 1.8) / 0.4);
    const ask = outBack(clamp((u - 0.8) / 0.4));
    return svg(
      <>
        <Doorway u={u} L={L} walk={1 - back} />
        <path d="M760 1760 h-440 M360 1720 l-40 40 l40 40" stroke={Y} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={1 - bulb * 0.5} />
        <text x={540} y={1850} textAnchor="middle" fill={Y} fontSize={46} fontWeight={900} fontFamily={F}>{L.back}</text>
        <g transform={`translate(860 800) scale(${outBack(bulb)})`}>
          <circle r={90} fill={Y} style={{filter: 'drop-shadow(0 0 50px rgba(255,210,63,0.9))'}} />
          <rect x={-40} y={80} width={80} height={60} rx={10} fill={DIM} />
        </g>
        <g transform={`translate(250 760) rotate(-6) scale(${ask})`}>
          <rect x={-200} y={-60} width={400} height={110} rx={30} fill="rgba(13,20,48,0.95)" stroke={Y} strokeWidth={6} />
          <text y={20} textAnchor="middle" fill={Y} fontSize={L.ask.length > 9 ? 44 : 52} fontWeight={900} fontFamily={F}>{L.ask}</text>
        </g>
      </>,
    );
  }
  if (i === 3) {
    const a = outBack(clamp((u - 0.4) / 0.4));
    const b = outBack(clamp((u - 1.4) / 0.4));
    const panel = (y: number, l1: string, l2: string, ok: boolean, k: number) => (
      <g transform={`translate(540 ${y}) scale(${k})`}>
        <rect x={-440} y={-150} width={880} height={300} rx={36} fill={ok ? 'rgba(77,214,138,0.12)' : 'rgba(255,90,110,0.12)'} stroke={ok ? GREEN : RED} strokeWidth={8} />
        {[0, 1, 2].map((j) => <path key={j} d={`M-400 ${-110 + j * 22} q50 -16 100 0 t100 0 t100 0`} stroke="#5a7ff0" strokeWidth={6} fill="none" opacity={0.6} />)}
        <text x={-60} y={-10} textAnchor="middle" fill={W} fontSize={56} fontWeight={900} fontFamily={F}>{l1}</text>
        <text x={-60} y={80} textAnchor="middle" fill={W} fontSize={56} fontWeight={900} fontFamily={F}>+ {l2}</text>
        <text x={330} y={50} textAnchor="middle" fill={ok ? GREEN : RED} fontSize={150} fontWeight={900} fontFamily={F}>{ok ? '✓' : '✗'}</text>
      </g>
    );
    return svg(
      <>
        {[0, 1, 2, 3, 4].map((j) => <circle key={j} cx={120 + j * 210} cy={1800 - ((u * 120 + j * 170) % 900)} r={14 + (j % 3) * 6} fill="none" stroke="#8fb4ff" strokeWidth={4} opacity={0.5} />)}
        {panel(1020, L.wl, L.wt, true, a)}
        {panel(1420, L.ll, L.lt, false, b)}
      </>,
    );
  }
  const k = outBack(clamp(u / 0.5));
  return svg(
    <g transform={`translate(540 1200) scale(${k})`}>
      <rect x={-170} y={-300} width={340} height={600} rx={50} fill="#3a5bd9" stroke="#1e2440" strokeWidth={14} style={{filter: 'drop-shadow(0 0 60px rgba(120,170,255,0.7))'}} />
      <path d="M-60 40 L60 -40 M60 -40 L20 -50 M60 -40 L52 0" stroke={W} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${Math.sin(u * 4) * 8})`} />
      <text x={0} y={180} textAnchor="middle" fill={Y} fontSize={L.share.length > 6 ? 42 : 60} fontWeight={900} fontFamily={F}>{L.share}</text>
    </g>,
  );
};

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

export const Door: React.FC<{lang: 'en' | 'zh'}> = ({lang}) => {
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
      <Audio src={staticFile(`door/${lang}-voice.wav`)} />
      {B.slice(1).map((bb, k) => (
        <Sequence key={k} from={Math.max(0, Math.round((bb.start - 0.2) * fps))} durationInFrames={Math.round(0.7 * fps)}>
          <Audio src={staticFile('sfx/whoosh.wav')} volume={0.15} />
        </Sequence>
      ))}
      {[0.9].map((s) => (
        <Sequence key={`b${s}`} from={Math.round(s * fps)} durationInFrames={Math.round(0.5 * fps)}>
          <Audio src={staticFile('sfx/boom.wav')} volume={0.3} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
