import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, useFont} from './Cards';
import {clamp, inOut, outBack} from './Spec';
import EN from './fight2-en.json';
import ZH from './fight2-zh.json';

// Silent in a fight, repackaged after the Nov 17 numbers (good engagement,
// weak packaging): the whole hook is big text on frame one (it is the cover),
// a close-up face that fills the screen, two points, an early comment prompt,
// a curiosity gap before point two and a share prompt at the end.

type Beat = {say: string; top: string; src?: string; start: number; dur: number; words: [string, number, number][]};
const total = (b: Beat[]) => b[b.length - 1].start + b[b.length - 1].dur;
export const FIGHT2_EN_FRAMES = Math.ceil(total(EN as Beat[]) * 30);
export const FIGHT2_ZH_FRAMES = Math.ceil(total(ZH as Beat[]) * 30);

const Y = '#ffd23f';
const W = '#ffffff';
const RED = '#ff5a6e';
const GREEN = '#4dd68a';
const DIM = '#8fa0d8';

const T = {
  en: {
    hook: ['People who go silent', 'in a fight', "aren't ignoring you."],
    hl: 2,
    shouts: ['Say something!', 'Why are you quiet?', 'Answer me!'],
    v1: 'silent', v2: 'pusher', push: 'Why won\'t you talk?!', share: 'Send to them', brand: ['Brain', 'Manual'], src: 'Source: ', alarm: 'ALARM',
  },
  zh: {
    hook: ['吵架突然沉默的人', '不是', '不在乎你'],
    hl: 2,
    shouts: ['你说话啊！', '为什么不说话？', '你回答我！'],
    v1: '沉默', v2: '追问', push: '你倒是说话啊！', share: '转给TA', brand: ['脑子', '说明书'], src: '来源：', alarm: '警报',
  },
};

// One big face filling the screen: the silent partner, close up.
const Face: React.FC<{t: number; mood: 'tense' | 'drown' | 'calm'; glow: string}> = ({t, mood, glow}) => {
  const shake = mood === 'tense' ? Math.sin(t * 40) * 2 : 0;
  return (
    <g transform={`translate(${540 + shake} 1180)`} style={{filter: `drop-shadow(0 0 40px ${glow})`}}>
      <circle r={300} fill="#16204a" stroke={W} strokeWidth={22} />
      {mood === 'calm' ? (
        <>
          <path d="M-130 -30 q40 -36 80 0 M50 -30 q40 -36 80 0" stroke={W} strokeWidth={16} fill="none" strokeLinecap="round" />
          <path d="M-80 110 q80 60 160 0" stroke={W} strokeWidth={16} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={-90} cy={-30} r={30} fill={W} />
          <circle cx={90} cy={-30} r={30} fill={W} />
          <circle cx={-84 + Math.sin(t * 3) * 6} cy={-26} r={14} fill="#16204a" />
          <circle cx={96 + Math.sin(t * 3) * 6} cy={-26} r={14} fill="#16204a" />
          <path d="M-140 -100 l90 30 M140 -100 l-90 30" stroke={W} strokeWidth={14} strokeLinecap="round" />
          <path d="M-70 130 h140" stroke={W} strokeWidth={16} strokeLinecap="round" />
          {/* a bead of sweat */}
          <path d={`M210 ${-120 + (t * 40) % 80} q18 30 0 46 q-18 -16 0 -46`} fill="#9fd0ff" />
        </>
      )}
    </g>
  );
};
const Heart: React.FC<{x: number; y: number; bpm: number; t: number; s?: number}> = ({x, y, bpm, t, s = 1}) => {
  const c = bpm >= 100 ? RED : bpm < 85 ? GREEN : Y;
  const k = 1 + 0.15 * Math.max(0, Math.sin(t * (bpm / 60) * Math.PI * 2)) ** 8;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 26 C -46 -6 -32 -48 0 -24 C 32 -48 46 -6 0 26 Z" fill={c} transform={`scale(${k * 1.4})`} style={{filter: `drop-shadow(0 0 24px ${c})`}} />
      <text x={70} y={22} fill={c} fontSize={86} fontWeight={900} fontFamily="Noto Sans SC">{Math.round(bpm)}</text>
      <text x={74} y={58} fill={DIM} fontSize={28} fontWeight={700} fontFamily="Noto Sans SC">BPM</text>
    </g>
  );
};
const Bubble: React.FC<{x: number; y: number; text: string; k: number; c?: string; r?: number}> = ({x, y, text, k, c = RED, r = 0}) => {
  const w = text.length * (/[一-鿿]/.test(text) ? 44 : 24) + 60;
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${outBack(k)})`} opacity={clamp(k * 3)}>
      <rect x={-w / 2} y={-48} width={w} height={90} rx={24} fill="rgba(13,20,48,0.95)" stroke={c} strokeWidth={5} />
      <text x={0} y={14} textAnchor="middle" fill={c} fontSize={40} fontWeight={900} fontFamily="Noto Sans SC">{text}</text>
    </g>
  );
};

const Scene: React.FC<{i: number; u: number; d: number; L: typeof T.en}> = ({i, u, d, L}) => {
  const svg = (c: React.ReactNode) => <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{c}</svg>;
  if (i === 0) {
    return svg(
      <>
        <Face t={u} mood="tense" glow="rgba(255,90,110,0.5)" />
        {L.shouts.map((s, k) => (
          <Bubble key={k} x={[250, 820, 300][k]} y={[880, 960, 1560][k]} text={s} k={k === 0 ? 1 : clamp((u - 0.4 - k * 0.5) / 0.3)} r={[-6, 5, -3][k]} />
        ))}
        <Heart x={700} y={1580} bpm={112 + Math.min(10, u * 2)} t={u} />
      </>,
    );
  }
  if (i === 1) {
    const lvl = inOut(u / (d * 0.6));
    const top = 1600 - lvl * 520;
    return svg(
      <>
        <Face t={u} mood="drown" glow="rgba(80,140,255,0.5)" />
        <rect x={0} y={top} width={1080} height={1920 - top} fill="rgba(80,140,255,0.38)" />
        <path d={`M0 ${top} Q 135 ${top - 20 + Math.sin(u * 3) * 10} 270 ${top} T 540 ${top} T 810 ${top} T 1080 ${top}`} stroke="#9fc4ff" strokeWidth={8} fill="none" />
        {[[L.v1, '1', DIM, 290], [L.v2, '2', RED, 790]].map(([lab, n, c, x], k) => (
          <g key={k} transform={`translate(${x} 1720) scale(${outBack(clamp((u - 2.2 - k * 0.3) / 0.4))})`}>
            <rect x={-170} y={-70} width={340} height={140} rx={24} fill="rgba(13,20,48,0.95)" stroke={c as string} strokeWidth={6} />
            <text x={-90} y={22} textAnchor="middle" fill={c as string} fontSize={72} fontWeight={900} fontFamily="Noto Sans SC">{n}</text>
            <text x={40} y={18} textAnchor="middle" fill={W} fontSize={48} fontWeight={900} fontFamily="Noto Sans SC">{lab}</text>
          </g>
        ))}
      </>,
    );
  }
  if (i === 2) {
    const run = Math.min(1, u / (d * 0.55));
    const pts: string[] = [];
    for (let k = 0; k <= 100 * run; k++) {
      const x = 80 + k * 9.2;
      const base = 1500 - k * 3.4;
      pts.push(`${x},${base + (k % 12 === 6 ? -100 : k % 12 === 7 ? 55 : 0)}`);
    }
    const bpm = 70 + run * 52;
    const alarm = bpm >= 100;
    const gap = clamp((u - d * 0.62) / 0.4);
    return svg(
      <>
        {alarm ? <rect x={0} y={0} width={1080} height={1920} fill={`rgba(255,40,60,${0.06 + 0.06 * Math.sin(u * 12)})`} /> : null}
        <line x1={50} y1={1330} x2={1030} y2={1330} stroke={RED} strokeWidth={5} strokeDasharray="20 14" />
        <text x={60} y={1305} fill={RED} fontSize={46} fontWeight={900} fontFamily="Noto Sans SC">100 BPM</text>
        <polyline points={pts.join(' ')} fill="none" stroke={alarm ? RED : Y} strokeWidth={10} strokeLinejoin="round" style={{filter: `drop-shadow(0 0 14px ${alarm ? RED : Y})`}} />
        {alarm ? <text x={540} y={1050} textAnchor="middle" fill={RED} fontSize={110} fontWeight={900} fontFamily="Noto Sans SC" opacity={0.6 + 0.4 * Math.sin(u * 10)}>⚠ {L.alarm}</text> : null}
        <Heart x={620} y={1720} bpm={bpm} t={u} />
        {gap > 0 ? <text x={540} y={880} textAnchor="middle" fill={Y} fontSize={240} fontWeight={900} fontFamily="Noto Sans SC" transform={`translate(540 880) scale(${outBack(gap)}) translate(-540 -880)`}>?</text> : null}
      </>,
    );
  }
  if (i === 3) {
    const cross = clamp((u - 0.3) / 0.3);
    const timer = clamp((u - 1.6) / 2.4);
    const calm = clamp((u - 4.2) / 0.8);
    const a = timer * Math.PI * 2;
    return svg(
      <>
        {calm < 1 ? (
          <g opacity={1 - calm}>
            <Bubble x={540} y={760} text={L.push} k={1} />
            <g transform="translate(540 760)" opacity={cross}>
              <path d="M-260 -90 L260 90 M260 -90 L-260 90" stroke={RED} strokeWidth={22} strokeLinecap="round" />
            </g>
            <circle cx={540} cy={1260} r={220} fill="none" stroke="#2a3358" strokeWidth={26} />
            <path d={`M540 1040 A220 220 0 ${a > Math.PI ? 1 : 0} 1 ${540 + 220 * Math.sin(a)} ${1260 - 220 * Math.cos(a)}`} fill="none" stroke={Y} strokeWidth={26} strokeLinecap="round" />
            <text x={540} y={1300} textAnchor="middle" fill={W} fontSize={130} fontWeight={900} fontFamily="Noto Sans SC">20:00</text>
          </g>
        ) : null}
        {calm > 0 ? (
          <g opacity={calm}>
            <Face t={u} mood="calm" glow="rgba(77,214,138,0.5)" />
            <Heart x={620} y={1640} bpm={72} t={u} />
          </g>
        ) : (
          <Heart x={620} y={1640} bpm={118 - timer * 40} t={u} />
        )}
      </>,
    );
  }
  // 4: share prompt
  const k = outBack(clamp(u / 0.5));
  return svg(
    <g transform={`translate(540 1200) scale(${k})`}>
      <rect x={-170} y={-300} width={340} height={600} rx={50} fill="#3a5bd9" stroke="#1e2440" strokeWidth={14} style={{filter: 'drop-shadow(0 0 60px rgba(120,170,255,0.7))'}} />
      <path d="M-60 40 L60 -40 M60 -40 L20 -50 M60 -40 L52 0" stroke={W} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${Math.sin(u * 4) * 8})`} />
      <text x={0} y={180} textAnchor="middle" fill={Y} fontSize={L.share.length > 6 ? 42 : 60} fontWeight={900} fontFamily="Noto Sans SC">{L.share}</text>
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

export const Fight2: React.FC<{lang: 'en' | 'zh'}> = ({lang}) => {
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
        <Scene i={i} u={i === 0 ? u + 0.6 : u} d={b.dur} L={L} />
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
      <Audio src={staticFile(`fight2/${lang}-voice.wav`)} />
      {B.slice(1).map((bb, k) => (
        <Sequence key={k} from={Math.max(0, Math.round((bb.start - 0.2) * fps))} durationInFrames={Math.round(0.7 * fps)}>
          <Audio src={staticFile('sfx/whoosh.wav')} volume={0.15} />
        </Sequence>
      ))}
      {[0, 0.5, 1.0, 1.5, 2.0, 2.5].map((s) => (
        <Sequence key={`h${s}`} from={Math.round(s * fps)} durationInFrames={Math.round(0.45 * fps)}>
          <Audio src={staticFile('sfx/boom.wav')} volume={0.25} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
