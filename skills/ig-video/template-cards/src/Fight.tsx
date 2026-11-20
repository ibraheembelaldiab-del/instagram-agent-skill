import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, useFont} from './Cards';
import {clamp, inOut, outBack} from './Spec';
import EN from './fight-en.json';
import ZH from './fight-zh.json';

// Why people go silent in a fight (Gottman's "flooding"). Voice-over story
// format, shock first: frame one already shows the silent figure with his
// heart rate at 112 and climbing.

type Beat = {say: string; top: string; src?: string; start: number; dur: number; words: [string, number, number][]};
const total = (b: Beat[]) => b[b.length - 1].start + b[b.length - 1].dur;
export const FIGHT_EN_FRAMES = Math.ceil(total(EN as Beat[]) * 30);
export const FIGHT_ZH_FRAMES = Math.ceil(total(ZH as Beat[]) * 30);

const Y = '#ffd23f';
const W = '#ffffff';
const RED = '#ff5a6e';
const GREEN = '#4dd68a';
const DIM = '#8fa0d8';

const T = {
  en: {say: 'Say something!', why: 'Why are you quiet?', again: 'Answer me!', dots: '…', run: 'run', shut: 'shut down', care: "I do care.", walk: 'take a walk', a: 'goes quiet', b: 'pushes', vote: 'Comment', brand: ['Brain', 'Manual'], src: 'Source: '},
  zh: {say: '你说话啊！', why: '为什么不说话？', again: '你回答我！', dots: '……', run: '逃', shut: '关起来', care: '我在乎的。', walk: '去走一走', a: '沉默的', b: '追问的', vote: '扣', brand: ['脑子', '说明书'], src: '来源：'},
};

const Fig: React.FC<{x: number; y: number; s?: number; c?: string; glow?: string; face?: 'flat' | 'sad' | 'calm' | 'open'; arms?: 'down' | 'point' | 'chest' | 'cross'; flip?: boolean}> = ({x, y, s = 1, c = W, glow, face = 'flat', arms = 'down', flip}) => {
  const f = flip ? -1 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * f} ${s})`} style={{filter: `drop-shadow(0 0 ${glow ? 22 : 10}px ${glow ?? 'rgba(255,255,255,0.35)'})`}}>
      <g stroke={c} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1={0} y1={-215} x2={0} y2={-100} />
        <line x1={0} y1={-100} x2={-32} y2={0} />
        <line x1={0} y1={-100} x2={32} y2={0} />
        {arms === 'point' ? <path d="M-40 -110 L0 -200 L80 -215" /> : arms === 'chest' ? <path d="M-40 -110 L0 -200 L-5 -170 M0 -200 L18 -165" /> : arms === 'cross' ? <path d="M-30 -150 L0 -200 L30 -150 M-30 -150 L25 -170 M30 -150 L-25 -170" /> : <path d="M-42 -110 L0 -200 L42 -110" />}
        <circle cx={0} cy={-252} r={38} fill="#16204a" />
      </g>
      <circle cx={-12} cy={-256} r={4.5} fill={c} />
      <circle cx={12} cy={-256} r={4.5} fill={c} />
      <path d={face === 'sad' ? 'M-12 -232 q12 -8 24 0' : face === 'calm' ? 'M-12 -236 q12 8 24 0' : face === 'open' ? 'M-8 -236 h16 v8 h-16 z' : 'M-12 -234 h24'} stroke={c} strokeWidth={4} fill="none" strokeLinecap="round" />
    </g>
  );
};
const Bubble: React.FC<{x: number; y: number; text: string; k: number; c?: string; tail?: 'l' | 'r'}> = ({x, y, text, k, c = W, tail = 'l'}) => {
  const w = Math.max(120, text.length * (/[一-鿿]/.test(text) ? 40 : 22) + 56);
  return (
    <g transform={`translate(${x} ${y}) scale(${outBack(k)})`} opacity={clamp(k * 3)}>
      <rect x={-w / 2} y={-44} width={w} height={80} rx={22} fill="rgba(13,20,48,0.94)" stroke={c} strokeWidth={4} />
      <path d={tail === 'l' ? `M${-w / 2 + 40} 34 l-18 30 l40 -30` : `M${w / 2 - 40} 34 l18 30 l-40 -30`} fill="rgba(13,20,48,0.94)" stroke={c} strokeWidth={4} />
      <text x={0} y={10} textAnchor="middle" fill={c} fontSize={36} fontWeight={900} fontFamily="Noto Sans SC">{text}</text>
    </g>
  );
};
// A heart with a beats-per-minute read-out.
const Heart: React.FC<{x: number; y: number; bpm: number; t: number; s?: number}> = ({x, y, bpm, t, s = 1}) => {
  const hot = bpm >= 100;
  const c = hot ? RED : bpm < 85 ? GREEN : Y;
  const beat = 1 + 0.12 * Math.max(0, Math.sin(t * (bpm / 60) * Math.PI * 2)) ** 8;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g transform={`scale(${beat})`}>
        <path d="M0 26 C -46 -6 -32 -48 0 -24 C 32 -48 46 -6 0 26 Z" fill={c} style={{filter: `drop-shadow(0 0 ${hot ? 24 : 10}px ${c})`}} />
      </g>
      <text x={62} y={16} fill={c} fontSize={64} fontWeight={900} fontFamily="Noto Sans SC">{Math.round(bpm)}</text>
      <text x={62} y={46} fill={DIM} fontSize={24} fontWeight={700} fontFamily="Noto Sans SC">BPM</text>
    </g>
  );
};

const Scene: React.FC<{i: number; u: number; d: number; L: typeof T.en}> = ({i, u, d, L}) => {
  const svg = (children: React.ReactNode) => <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{children}</svg>;
  if (i === 0) {
    // Shock first: the shouting partner, the silent one, and his heart racing.
    const bpm = 112 + Math.min(8, u * 1.5);
    return svg(
      <>
        <Fig x={300} y={1640} arms="point" face="open" />
        <Fig x={780} y={1640} glow={RED} face="flat" arms="cross" flip />
        <Bubble x={320} y={1190} text={L.say} k={1} c={W} />
        <Bubble x={780} y={1190} text={L.dots} k={clamp((u - 0.6) / 0.4)} c={DIM} tail="r" />
        <Heart x={700} y={1000} bpm={bpm} t={u} s={1.2} />
      </>,
    );
  }
  if (i === 1) {
    // Flooding: water rising over him.
    const lvl = inOut(u / (d * 0.8));
    return svg(
      <>
        <Fig x={540} y={1640} face="sad" glow={RED} />
        <rect x={0} y={1700 - lvl * 560} width={1080} height={560 + 40} fill="rgba(80,140,255,0.35)" />
        <path d={`M0 ${1700 - lvl * 560} Q 135 ${1680 - lvl * 560 + Math.sin(u * 3) * 10} 270 ${1700 - lvl * 560} T 540 ${1700 - lvl * 560} T 810 ${1700 - lvl * 560} T 1080 ${1700 - lvl * 560}`} stroke="#9fc4ff" strokeWidth={6} fill="none" />
      </>,
    );
  }
  if (i === 2) {
    // ECG line climbing past the red 100 line.
    const pts: string[] = [];
    const run = Math.min(1, u / (d * 0.85));
    for (let k = 0; k <= 100 * run; k++) {
      const x = 90 + k * 9;
      const base = 1500 - k * 3.2;
      const spike = k % 12 === 6 ? -90 : k % 12 === 7 ? 50 : 0;
      pts.push(`${x},${base + spike}`);
    }
    const bpm = 70 + run * 50;
    return svg(
      <>
        <line x1={60} y1={1340} x2={1020} y2={1340} stroke={RED} strokeWidth={4} strokeDasharray="18 14" />
        <text x={70} y={1320} fill={RED} fontSize={40} fontWeight={900} fontFamily="Noto Sans SC">100 BPM</text>
        <polyline points={pts.join(' ')} fill="none" stroke={bpm >= 100 ? RED : Y} strokeWidth={8} strokeLinejoin="round" style={{filter: `drop-shadow(0 0 12px ${bpm >= 100 ? RED : Y})`}} />
        <Heart x={700} y={1720} bpm={bpm} t={u} />
      </>,
    );
  }
  if (i === 3) {
    // Run, or shut down.
    return svg(
      <>
        <Fig x={300 + Math.min(1, u / 1.5) * -120} y={1640} face="sad" flip />
        <g opacity={clamp(u / 0.4)}>
          <path d="M360 1250 h-220 M170 1225 l-30 25 l30 25" stroke={Y} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x={250} y={1210} textAnchor="middle" fill={Y} fontSize={48} fontWeight={900} fontFamily="Noto Sans SC">{L.run}</text>
        </g>
        <rect x={640} y={1300} width={300} height={360} rx={20} fill="rgba(13,20,48,0.9)" stroke={DIM} strokeWidth={6} opacity={clamp((u - 1.2) / 0.4)} />
        <g opacity={clamp((u - 1.2) / 0.4)}>
          <Fig x={790} y={1640} s={0.8} face="sad" arms="cross" />
        </g>
        <text x={790} y={1270} textAnchor="middle" fill={DIM} fontSize={44} fontWeight={900} fontFamily="Noto Sans SC" opacity={clamp((u - 1.2) / 0.4)}>{L.shut}</text>
      </>,
    );
  }
  if (i === 4) {
    return svg(
      <>
        <Fig x={540} y={1640} face="sad" arms="chest" glow={RED} />
        <Heart x={470} y={1150} bpm={118} t={u} s={1.2} />
        <Bubble x={540} y={1040} text={L.care} k={clamp((u - 1) / 0.4)} c={Y} />
      </>,
    );
  }
  if (i === 5) {
    // Pushing harder: questions pile up, his heart rate climbs further.
    const qs = [L.say, L.why, L.again];
    return svg(
      <>
        <Fig x={260} y={1640} arms="point" face="open" />
        <Fig x={800} y={1640} glow={RED} arms="cross" face="sad" flip />
        {qs.map((q, k) => (
          <Bubble key={k} x={330 + k * 40} y={1210 - k * 120} text={q} k={clamp((u - k * 0.5) / 0.3)} c={RED} />
        ))}
        <Heart x={720} y={1010} bpm={120 + u * 4} t={u} s={1.1} />
      </>,
    );
  }
  if (i === 6) {
    // Pause: a 20-minute timer.
    const k = clamp(u / (d * 0.9));
    const a = k * Math.PI * 2;
    return svg(
      <>
        <circle cx={540} cy={1330} r={240} fill="none" stroke="#2a3358" strokeWidth={26} />
        <path d={`M540 1090 A240 240 0 ${a > Math.PI ? 1 : 0} 1 ${540 + 240 * Math.sin(a)} ${1330 - 240 * Math.cos(a)}`} fill="none" stroke={Y} strokeWidth={26} strokeLinecap="round" />
        <text x={540} y={1370} textAnchor="middle" fill={W} fontSize={140} fontWeight={900} fontFamily="Noto Sans SC">20:00</text>
        <g transform="translate(540 1650)">
          <rect x={-48} y={-50} width={30} height={100} rx={8} fill={Y} />
          <rect x={18} y={-50} width={30} height={100} rx={8} fill={Y} />
        </g>
      </>,
    );
  }
  if (i === 7) {
    // A walk: his heart rate comes down.
    const k = clamp(u / (d * 0.9));
    return svg(
      <>
        <line x1={0} y1={1645} x2={1080} y2={1645} stroke="#2a3358" strokeWidth={6} />
        <g transform={`translate(${-200 + k * 420} 0)`}>
          <Fig x={540} y={1640} face="calm" />
        </g>
        <text x={540} y={1760} textAnchor="middle" fill={DIM} fontSize={36} fontWeight={700} fontFamily="Noto Sans SC">{L.walk}</text>
        <Heart x={420} y={1080} bpm={118 - k * 46} t={u} s={1.2} />
      </>,
    );
  }
  if (i === 8) {
    return svg(
      <>
        <Fig x={400} y={1640} face="calm" />
        <Fig x={680} y={1640} face="calm" flip />
        <g transform="translate(540 1330)" opacity={clamp((u - 0.5) / 0.5)}>
          <path d="M0 26 C -46 -6 -32 -48 0 -24 C 32 -48 46 -6 0 26 Z" fill={Y} transform={`scale(${1.4 + Math.sin(u * 4) * 0.08})`} style={{filter: `drop-shadow(0 0 20px ${Y})`}} />
        </g>
      </>,
    );
  }
  // 9: the vote
  const card = (label: string, n: number, c: string, at: number, x: number) => (
    <g transform={`translate(${x} 1200) scale(${outBack(clamp((u - at) / 0.5))})`}>
      <rect x={-200} y={-150} width={400} height={300} rx={26} fill="rgba(13,20,48,0.9)" stroke={c} strokeWidth={6} />
      <text x={0} y={10} textAnchor="middle" fill={c} fontSize={64} fontWeight={900} fontFamily="Noto Sans SC">{label}</text>
      <text x={0} y={90} textAnchor="middle" fill={c} fontSize={44} fontWeight={700} fontFamily="Noto Sans SC">{L.vote} {n}</text>
    </g>
  );
  return svg(
    <>
      {card(L.a, 1, DIM, 0.3, 300)}
      {card(L.b, 2, RED, 0.6, 780)}
      <Fig x={300} y={1720} s={0.6} arms="cross" face="flat" />
      <Fig x={780} y={1720} s={0.6} arms="point" face="open" flip />
    </>,
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
    if (cur.length && (zh ? len + w[0].length > 8 : cur.length >= 3)) {
      groups.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) groups.push(cur);
  let g = groups.findIndex((_, k) => t < (groups[k + 1]?.[0][1] ?? Infinity));
  if (g < 0) g = groups.length - 1;
  const gr = groups[g];
  const pop = outBack(clamp((t - gr[0][1]) / 0.18));
  return (
    <div style={{position: 'absolute', top: 340, left: 70, right: 70, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: zh ? 0 : 20, fontWeight: 900, fontSize: zh ? 78 : 70, lineHeight: 1.2, transform: `scale(${0.9 + 0.1 * pop})`, textShadow: '0 4px 18px rgba(0,0,0,0.7)'}}>
      {gr.map(([w, s], k) => (
        <span key={k} style={{whiteSpace: 'nowrap', color: t >= s ? (t < s + 0.45 || k === gr.length - 1 ? Y : W) : 'rgba(255,255,255,0.45)'}}>{w}</span>
      ))}
    </div>
  );
};

export const Fight: React.FC<{lang: 'en' | 'zh'; music?: boolean}> = ({lang, music = true}) => {
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
  const u = i === 0 ? t + 1 : t - b.start;
  const inK = i === 0 ? 1 : clamp((t - b.start) / 0.35);
  const fade = clamp((t - (END - 1)) / 0.9);
  return (
    <AbsoluteFill style={{fontFamily: '"Noto Sans SC", sans-serif', color: W, overflow: 'hidden'}}>
      <Backdrop t={t} />
      <AbsoluteFill style={{opacity: inK, transform: `scale(${1 + clamp((t - b.start) / b.dur) * 0.04})`, transformOrigin: '50% 75%'}}>
        <Scene i={i} u={u} d={b.dur} L={L} />
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center'}}>
        <span style={{fontSize: 48, fontWeight: 900, color: '#16141a', background: Y, padding: '6px 26px', borderRadius: 14}}>{b.top}</span>
      </div>
      <Captions t={t} B={B} zh={lang === 'zh'} />
      {b.src ? <div style={{position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center', fontSize: 30, fontWeight: 700, color: DIM}}>{L.src}{b.src}</div> : null}
      <div style={{position: 'absolute', top: 70, left: 60, fontSize: 30, color: DIM, letterSpacing: 4}}>
        {L.brand[0]}<span style={{background: Y, color: '#16141a', padding: '0 8px', borderRadius: 6, marginLeft: 6}}>{L.brand[1]}</span>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
      <Audio src={staticFile(`fight/${lang}-voice.wav`)} />
      {music ? <Audio src={staticFile(`fight/${lang}-piano.wav`)} volume={0.12} /> : null}
      {B.slice(1).map((bb, k) => (
        <Sequence key={k} from={Math.max(0, Math.round((bb.start - 0.25) * fps))} durationInFrames={Math.round(0.8 * fps)}>
          <Audio src={staticFile('sfx/whoosh.wav')} volume={0.12} />
        </Sequence>
      ))}
      {/* a soft heartbeat under the opening */}
      {[0, 0.55, 1.1, 1.65, 2.2].map((s) => (
        <Sequence key={`h${s}`} from={Math.round(s * fps)} durationInFrames={Math.round(0.5 * fps)}>
          <Audio src={staticFile('sfx/boom.wav')} volume={0.28} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
