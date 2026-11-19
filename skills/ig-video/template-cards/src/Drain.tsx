import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, useFont} from './Cards';
import {clamp, inOut, outBack} from './Spec';
import EN from './drain-en.json';
import ZH from './drain-en.json';

// Brain drain (Instagram short): phone presence lowers test scores (Ward 2017) and closeness (Przybylski & Weinstein 2013). Packaging as in the
// repackaged silent-in-a-fight episode after the Nov 17 numbers (good engagement,
// weak packaging): the whole hook is big text on frame one (it is the cover),
// a close-up face that fills the screen, two points, an early comment prompt,
// a curiosity gap before point two and a share prompt at the end.

type Beat = {say: string; top: string; src?: string; start: number; dur: number; words: [string, number, number][]};
const total = (b: Beat[]) => b[b.length - 1].start + b[b.length - 1].dur;
export const DRAIN_EN_FRAMES = Math.ceil(total(EN as Beat[]) * 30);
export const DRAIN_ZH_FRAMES = Math.ceil(total(ZH as Beat[]) * 30);

const Y = '#ffd23f';
const W = '#ffffff';
const RED = '#ff5a6e';
const GREEN = '#4dd68a';
const DIM = '#8fa0d8';

const T = {
  en: {
    hook: ['Your phone drains', 'your brain…', "even when it's off."], hl: 2,
    off: 'OFF', desk: 'Phone on desk', room: 'Other room', score: 'Brain test score', n: '~800 people',
    ignore: 'ignoring…', close: 'closeness', ask: 'Comment 1 if it’s in reach', other: 'another room',
    share: 'Send to them', brand: ['Brain', 'Manual'], src: 'Research: ',
  },
};
T['zh' as 'en'] = T.en;
const F = 'Noto Sans SC';
const WB = (EN as Beat[]);
const wAt = (bi: number, w: string) => {
  const x = WB[bi].words.find((q) => q[0].toLowerCase().replace(/[^a-z]/g, '').startsWith(w));
  return x ? x[1] - WB[bi].start : 1;
};
const SCORED = wAt(1, 'scored');
const OTHER = wAt(1, 'another');
const WORSE = wAt(2, 'worse');
const TABLE = wAt(3, 'table');
const LESS = wAt(3, 'less');
const FIX = wAt(4, 'put');
const COMMENT = wAt(4, 'comment');

const Brain: React.FC<{x: number; y: number; s?: number; c?: string; level?: number}> = ({x, y, s = 1, c = Y, level = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <clipPath id={`bl${x}${y}`}><path d="M-150 40 C-190 -40 -140 -130 -60 -130 C-30 -170 40 -170 70 -130 C150 -130 190 -40 150 40 C150 110 80 140 0 130 C-80 140 -150 110 -150 40 Z" /></clipPath>
    <path d="M-150 40 C-190 -40 -140 -130 -60 -130 C-30 -170 40 -170 70 -130 C150 -130 190 -40 150 40 C150 110 80 140 0 130 C-80 140 -150 110 -150 40 Z" fill="#16204a" stroke={c} strokeWidth={10} />
    <rect x={-200} y={140 - 290 * level} width={400} height={300} fill={c} opacity={0.35} clipPath={`url(#bl${x}${y})`} />
    <path d="M0 -150 V130 M-100 -60 q50 30 100 0 M0 0 q50 30 110 0 M-120 50 q50 -20 100 10" stroke={c} strokeWidth={7} fill="none" opacity={0.8} />
  </g>
);
const PhoneDown: React.FC<{x: number; y: number; s?: number; t: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-150} y={-36} width={300} height={72} rx={20} fill="#2a3a7a" stroke="#9fb6ff" strokeWidth={5} />
    <circle cx={110} cy={0} r={12} fill="#0d1430" />
  </g>
);

const Scene: React.FC<{i: number; u: number; d: number; L: typeof T.en}> = ({i, u, d, L}) => {
  const svg = (c: React.ReactNode) => <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{c}</svg>;
  const uu = Math.max(0, u);
  if (i === 0) {
    const lvl = 1 - 0.55 * clamp(uu / 2.4);
    return svg(
      <>
        <Brain x={540} y={980} s={1.5} level={lvl} />
        {[0, 1, 2, 3].map((k) => {
          const p = ((uu * 0.9 + k * 0.25) % 1);
          return <circle key={k} cx={540 + Math.sin(p * 6 + k) * 18} cy={1200 + p * 300} r={14 - p * 6} fill={Y} opacity={1 - p} />;
        })}
        <line x1={150} y1={1580} x2={930} y2={1580} stroke={DIM} strokeWidth={6} />
        <PhoneDown x={540} y={1540} s={1.4} t={uu} />
        <g transform="translate(800 1450)">
          <rect x={-70} y={-36} width={140} height={64} rx={18} fill={RED} />
          <text y={14} textAnchor="middle" fill={W} fontSize={40} fontWeight={900} fontFamily={F}>{L.off}</text>
        </g>
      </>,
    );
  }
  if (i === 1) {
    const a = clamp((uu - SCORED + 0.3) / 0.8);
    const b = clamp((uu - OTHER) / 0.8);
    return svg(
      <>
        <text x={540} y={760} textAnchor="middle" fill={DIM} fontSize={44} fontWeight={700} fontFamily={F}>{L.n}</text>
        <Brain x={300} y={1020} s={0.85} c={RED} level={0.15 + 0.35 * a} />
        <PhoneDown x={300} y={1220} s={0.7} t={uu} />
        <text x={300} y={1330} textAnchor="middle" fill={RED} fontSize={42} fontWeight={900} fontFamily={F}>{L.desk}</text>
        <g opacity={clamp((uu - OTHER + 0.6) / 0.4)}>
          <Brain x={780} y={1020} s={0.85} c={GREEN} level={0.15 + 0.7 * b} />
          <rect x={700} y={1180} width={160} height={100} rx={10} fill="none" stroke={GREEN} strokeWidth={5} strokeDasharray="12 8" />
          <text x={780} y={1330} textAnchor="middle" fill={GREEN} fontSize={42} fontWeight={900} fontFamily={F}>{L.room}</text>
        </g>
        <text x={540} y={1480} textAnchor="middle" fill={DIM} fontSize={36} fontWeight={700} fontFamily={F}>{L.score}</text>
        <rect x={160} y={1510} width={300 * (0.5 * a)} height={50} rx={10} fill={RED} />
        <rect x={620} y={1510} width={300 * (0.85 * b)} height={50} rx={10} fill={GREEN} />
      </>,
    );
  }
  if (i === 2) {
    const meter = clamp(uu / 1.6);
    const gap = clamp((uu - WORSE + 0.2) / 0.4);
    return svg(
      <>
        <g opacity={1 - gap * 0.7}>
          <Brain x={540} y={1050} s={1.2} c={Y} level={0.8 - 0.4 * meter} />
          <PhoneDown x={540} y={1380} s={1.1} t={uu} />
          <path d="M540 1300 V1220" stroke={RED} strokeWidth={8} strokeDasharray="14 10" />
          <text x={540} y={1520} textAnchor="middle" fill={RED} fontSize={52} fontWeight={900} fontFamily={F}>{L.ignore}</text>
        </g>
        {gap > 0 ? <text x={540} y={1180} textAnchor="middle" fill={Y} fontSize={300} fontWeight={900} fontFamily={F} transform={`translate(540 1080) scale(${outBack(gap)}) translate(-540 -1080)`}>?</text> : null}
      </>,
    );
  }
  if (i === 3) {
    const ph = clamp((uu - TABLE + 0.3) / 0.5);
    const dim = clamp((uu - LESS) / 0.8);
    const face = (x: number, sad: boolean) => (
      <g transform={`translate(${x} 1060)`}>
        <circle r={120} fill="#16204a" stroke={sad ? RED : GREEN} strokeWidth={10} />
        <circle cx={-40} cy={-20} r={13} fill={W} />
        <circle cx={40} cy={-20} r={13} fill={W} />
        <path d={sad ? 'M-40 55 q40 -26 80 0' : 'M-40 40 q40 30 80 0'} stroke={W} strokeWidth={10} fill="none" strokeLinecap="round" />
      </g>
    );
    return svg(
      <>
        {face(250, dim > 0.5)}
        {face(830, dim > 0.5)}
        <path d="M380 1060 Q540 960 700 1060" stroke={dim > 0.5 ? RED : GREEN} strokeWidth={10} fill="none" strokeDasharray={dim > 0.5 ? '18 16' : undefined} opacity={1 - dim * 0.6} />
        <text x={540} y={950} textAnchor="middle" fill={dim > 0.5 ? RED : GREEN} fontSize={40} fontWeight={900} fontFamily={F}>{L.close}{dim > 0.5 ? ' ↓' : ''}</text>
        <line x1={120} y1={1300} x2={960} y2={1300} stroke={DIM} strokeWidth={8} />
        <g opacity={ph} transform={`translate(0 ${(1 - ph) * -80})`}><PhoneDown x={540} y={1260} s={1} t={uu} /></g>
      </>,
    );
  }
  if (i === 4) {
    const mv = inOut(clamp((uu - FIX) / 1.0));
    const ask = outBack(clamp((uu - COMMENT) / 0.4));
    return svg(
      <>
        <Brain x={300} y={1000} s={0.9} c={GREEN} level={0.3 + 0.6 * mv} />
        <rect x={640} y={820} width={320} height={420} rx={16} fill="none" stroke={Y} strokeWidth={6} />
        <rect x={760} y={1050} width={90} height={190} rx={8} fill="none" stroke={Y} strokeWidth={4} />
        <text x={800} y={800} textAnchor="middle" fill={Y} fontSize={42} fontWeight={900} fontFamily={F}>{L.other}</text>
        <g transform={`translate(${300 + mv * 500} ${1260 - mv * 120}) scale(${1 - mv * 0.5})`}><PhoneDown x={0} y={0} t={uu} /></g>
        <g transform={`translate(540 1600) rotate(-4) scale(${ask})`}>
          <rect x={-400} y={-65} width={800} height={120} rx={34} fill="rgba(13,20,48,0.95)" stroke={Y} strokeWidth={6} />
          <text y={18} textAnchor="middle" fill={Y} fontSize={52} fontWeight={900} fontFamily={F}>{L.ask}</text>
        </g>
      </>,
    );
  }
  const k = outBack(clamp(uu / 0.5));
  return svg(
    <g transform={`translate(540 1200) scale(${k})`}>
      <rect x={-170} y={-300} width={340} height={600} rx={50} fill="#3a5bd9" stroke="#1e2440" strokeWidth={14} style={{filter: 'drop-shadow(0 0 60px rgba(120,170,255,0.7))'}} />
      <path d="M-60 40 L60 -40 M60 -40 L20 -50 M60 -40 L52 0" stroke={W} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${Math.sin(uu * 4) * 8})`} />
      <text x={0} y={180} textAnchor="middle" fill={Y} fontSize={46} fontWeight={900} fontFamily={F}>{L.share}</text>
    </g>,
  );
};

// Sound design, no music.
const SFX: {at: number; f: string; v: number}[] = [{at: 0.05, f: 'boom', v: 0.3}, {at: 0.3, f: 'rswoosh', v: 0.3}, {at: 1.2, f: 'rswoosh', v: 0.25}];
SFX.push({at: WB[1].start + SCORED - 0.3, f: 'pop', v: 0.35}, {at: WB[1].start + OTHER, f: 'pop', v: 0.35}, {at: WB[1].start + OTHER + 0.7, f: 'ding', v: 0.28});
for (let t0 = WB[2].start + 0.2; t0 < WB[2].start + WORSE - 0.3; t0 += 0.35) SFX.push({at: t0, f: 'tick', v: 0.2});
SFX.push({at: WB[2].start + WORSE - 0.1, f: 'boom', v: 0.4});
SFX.push({at: WB[3].start + TABLE - 0.3, f: 'pop', v: 0.35}, {at: WB[3].start + LESS, f: 'lowswoosh', v: 0.4});
SFX.push({at: WB[4].start + FIX, f: 'highswoosh', v: 0.4}, {at: WB[4].start + FIX + 0.9, f: 'chime', v: 0.22}, {at: WB[4].start + COMMENT, f: 'pop', v: 0.35});
SFX.push({at: WB[5].start + 0.05, f: 'pop', v: 0.35});

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

export const Drain: React.FC<{lang: 'en' | 'zh'}> = ({lang}) => {
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
      <Audio src={staticFile(`drain/en-voice.wav`)} />
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
