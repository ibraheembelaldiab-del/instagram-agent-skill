import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, useFont} from './Cards';
import {clamp, inOut, outBack} from './Spec';
import EN from './kind-en.json';
import ZH from './kind-zh.json';

// Self-compassion: kind-to-self group studied longer after failing (Breines & Chen 2012); 20 s hand on heart lowers cortisol (Dreisoerner 2021).
// Phantom style (best 2 s retention so far): dark navy backdrop, yellow highlights, big glowing
// line-art close-ups, the whole hook as big text on frame one, fast voice, sound effects, no music.

type Beat = {say: string; top: string; src?: string; start: number; dur: number; words: [string, number, number][]};
const total = (b: Beat[]) => b[b.length - 1].start + b[b.length - 1].dur;
export const KINDN_EN_FRAMES = Math.ceil(total(EN as Beat[]) * 30);
export const KINDN_ZH_FRAMES = Math.ceil(total(ZH as Beat[]) * 30);

const Y = '#ffd23f';
const W = '#ffffff';
const DIM = '#8fa0d8';
const RED = '#ff5a6e';
const GREEN = '#4dd68a';
const NAVY = '#16204a';
const F = '"Noto Sans SC", sans-serif';

const say = (B: Beat[], bi: number, sub: string, fb = 1) => {
  const ws = B[bi].words;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9一-鿿%]/g, '');
  const joined = ws.map((w) => norm(w[0])).join('');
  const idx = joined.indexOf(norm(sub));
  if (idx < 0) return fb;
  let c = 0;
  for (const w of ws) {
    c += norm(w[0]).length;
    if (c > idx) return w[1] - B[bi].start;
  }
  return fb;
};
const glow = (c: string, r = 30) => ({filter: `drop-shadow(0 0 ${r}px ${c})`});
const Txt: React.FC<{x: number; y: number; s: number; c?: string; o?: number; children: React.ReactNode}> = ({x, y, s, c = W, o = 1, children}) => (
  <text x={x} y={y} textAnchor="middle" fontSize={s} fill={c} fontWeight={900} fontFamily={F} opacity={o}>{children}</text>
);
const Chip: React.FC<{x: number; y: number; k: number; text: string; c?: string; w?: number; s?: number; rot?: number}> = ({x, y, k, text, c = Y, w = 520, s = 52, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${outBack(k)})`} opacity={clamp(k * 3)}>
    <rect x={-w / 2} y={-62} width={w} height={116} rx={30} fill="rgba(13,20,48,0.95)" stroke={c} strokeWidth={6} style={glow(c, 16)} />
    <Txt x={0} y={s * 0.36} s={s} c={c}>{text}</Txt>
  </g>
);
// big face close-up (the Fight2 face, more moods)
const Face: React.FC<{x?: number; y?: number; r?: number; t: number; mood: 'sad' | 'calm' | 'laugh' | 'tense'; c?: string}> = ({x = 540, y = 1180, r = 300, t, mood, c = W}) => {
  const k = r / 300;
  const shake = mood === 'tense' ? Math.sin(t * 40) * 2 : 0;
  return (
    <g transform={`translate(${x + shake} ${y}) scale(${k})`} style={glow(mood === 'sad' || mood === 'tense' ? 'rgba(255,90,110,0.5)' : 'rgba(120,170,255,0.6)', 40)}>
      <circle r={300} fill={NAVY} stroke={c} strokeWidth={22} />
      {mood === 'calm' || mood === 'laugh' ? (
        <>
          <path d="M-130 -30 q40 -36 80 0 M50 -30 q40 -36 80 0" stroke={W} strokeWidth={16} fill="none" strokeLinecap="round" />
          {mood === 'laugh' ? <path d="M-110 70 Q0 210 110 70 Z" fill={W} /> : <path d="M-80 110 q80 60 160 0" stroke={W} strokeWidth={16} fill="none" strokeLinecap="round" />}
        </>
      ) : (
        <>
          <circle cx={-90} cy={-30} r={26} fill={W} />
          <circle cx={90} cy={-30} r={26} fill={W} />
          <path d="M-140 -110 l80 40 M140 -110 l-80 40" stroke={W} strokeWidth={14} strokeLinecap="round" />
          <path d="M-80 150 q80 -60 160 0" stroke={W} strokeWidth={16} fill="none" strokeLinecap="round" />
          {mood === 'sad' ? <path d={`M-100 ${10 + (t * 60) % 90} q16 28 0 42 q-16 -14 0 -42`} fill="#9fd0ff" /> : null}
        </>
      )}
    </g>
  );
};
const Phone: React.FC<{x: number; y: number; s?: number; children?: React.ReactNode}> = ({x, y, s = 1, children}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-210} y={-380} width={420} height={760} rx={60} fill="#2a3a7a" stroke="#0d1430" strokeWidth={18} style={glow('rgba(120,170,255,0.55)', 50)} />
    <rect x={-180} y={-340} width={360} height={680} rx={40} fill="#1c2a66" />
    {children}
  </g>
);
const Share: React.FC<{u: number; text: string}> = ({u, text}) => (
  <g transform={`translate(540 1200) scale(${outBack(clamp(u / 0.5))})`}>
    <rect x={-170} y={-300} width={340} height={600} rx={50} fill="#3a5bd9" stroke="#1e2440" strokeWidth={14} style={glow('rgba(120,170,255,0.7)', 60)} />
    <path d="M-60 40 L60 -40 M60 -40 L20 -50 M60 -40 L52 0" stroke={W} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${Math.sin(u * 4) * 8})`} />
    <Txt x={0} y={180} s={text.length > 6 ? 46 : 60} c={Y}>{text}</Txt>
  </g>
);
const Bars: React.FC<{x: number; y: number; vals: [number, string, string][]; k: number; h?: number}> = ({x, y, vals, k, h = 420}) => (
  <g transform={`translate(${x} ${y})`}>
    {vals.map(([v, c, lab], j) => (
      <g key={j} transform={`translate(${(j - (vals.length - 1) / 2) * 280} 0)`}>
        <rect x={-90} y={-h * v * k} width={180} height={h * v * k} rx={16} fill={c} style={glow(c, 16)} />
        <Txt x={0} y={70} s={44} c={c}>{lab}</Txt>
      </g>
    ))}
    <line x1={-420} y1={0} x2={420} y2={0} stroke={DIM} strokeWidth={4} />
  </g>
);

const T = {
  en: {
    hook: ['You mess up…', 'and call yourself stupid?', 'Read this first.'], hl: 2,
    voice: "You're so dumb.", kind: '💗 Be kind to yourself', great: "⭐ You're smart", study: 'Time spent studying',
    k1: 'kind', k2: 'smart', ask: 'Comment 1 if that\'s you', stress: 'stress', hug: '≈ a hug', love: "I've got you.",
    share: 'Send to them', brand: ['Brain', 'Manual'], src: 'Research: ',
  },
  zh: {
    hook: ['搞砸了以后', '你也会骂自己吗？', '先别骂，看完'], hl: 2,
    voice: '你怎么这么笨', kind: '💗 对自己温柔一点', great: '⭐ 相信自己很棒', study: '复习时间',
    k1: '温柔组', k2: '很棒组', ask: '你会骂自己吗？打1', stress: '压力激素', hug: '≈ 被抱了一下', love: '爱你，老己',
    share: '转给TA', brand: ['脑子', '说明书'], src: '研究：',
  },
};
type Lx = typeof T.en;
const Paper: React.FC<{x: number; y: number; s?: number; score: string; rot?: number}> = ({x, y, s = 1, score, rot = -6}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-170} y={-230} width={340} height={460} rx={16} fill={NAVY} stroke={W} strokeWidth={10} style={glow('rgba(120,170,255,0.5)', 30)} />
    {[0, 1, 2, 3, 4].map((k) => <path key={k} d={`M-120 ${-110 + k * 60} h240`} stroke={DIM} strokeWidth={10} strokeLinecap="round" />)}
    <circle cx={70} cy={-140} r={80} fill="none" stroke={RED} strokeWidth={12} style={glow(RED, 16)} />
    <Txt x={70} y={-112} s={84} c={RED}>{score}</Txt>
  </g>
);
const HeartIcon: React.FC<{x: number; y: number; s?: number; c?: string; t: number}> = ({x, y, s = 1, c = RED, t}) => (
  <path d="M0 10 c-14 -22 -44 -8 -30 14 l30 26 l30 -26 c14 -22 -16 -36 -30 -14 z" fill={c} transform={`translate(${x} ${y}) scale(${s * (1 + 0.08 * Math.sin(t * 8))})`} style={glow(c, 20)} />
);
const Scene: React.FC<{i: number; u: number; d: number; L: Lx; B: Beat[]}> = ({i, u, d, L, B}) => {
  const svg = (c: React.ReactNode) => <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{c}</svg>;
  const uu = Math.max(0, u);
  const at = (sub: string, fb = 1) => say(B, i, sub, fb);
  const zh = L.share === '转给TA';
  if (i === 0) {
    const p = outBack(clamp((uu - 0.5) / 0.35));
    return svg(
      <>
        {[...Array(26)].map((_, k) => { const x = (k * 137) % 1080; const y = 700 + ((k * 263 + uu * 1300) % 1200); return <line key={k} x1={x} y1={y} x2={x - 10} y2={y + 40} stroke="#9fd0ff" strokeWidth={4} opacity={0.4} />; })}
        <Face y={1230} r={290} t={uu} mood="sad" />
        <g transform={`translate(860 1560) scale(${p})`}><Paper x={0} y={0} s={0.55} score="59" rot={10} /></g>
      </>,
    );
  }
  if (i === 1) {
    const p = outBack(clamp((uu - at('59', 1) + 0.2) / 0.35));
    const v = clamp((uu - at(zh ? '声音' : 'voice', 2.5)) / 0.35);
    return svg(
      <>
        <g transform={`translate(540 1000) scale(${p})`}><Paper x={0} y={0} s={1.15} score="59" rot={-4} /></g>
        <g transform={`translate(${540 + (v > 0 ? Math.sin(uu * 40) * 6 : 0)} 1560)`}><Chip x={0} y={0} k={v} text={L.voice} w={zh ? 560 : 600} s={64} c={RED} /></g>
      </>,
    );
  }
  if (i === 2) {
    return svg(
      <>
        {[...Array(9)].map((_, k) => {
          const on = outBack(clamp((uu - 0.2 - k * 0.15) / 0.3));
          return (
            <g key={k} transform={`translate(${250 + (k % 3) * 290} ${880 + Math.floor(k / 3) * 330}) scale(${on * 0.42})`}>
              <Paper x={0} y={0} score="✗" rot={(k % 3 - 1) * 6} />
            </g>
          );
        })}
      </>,
    );
  }
  if (i === 3) {
    const a = clamp((uu - 0.2) / 0.35);
    const b = clamp((uu - at(zh ? '另一组' : 'another', 2.5)) / 0.35);
    return svg(
      <>
        <g opacity={a}><Face x={290} y={1250} r={190} t={uu} mood="calm" c="#ff8fab" /><HeartIcon x={290} y={1490} s={2.2} t={uu} c="#ff8fab" /></g>
        <g opacity={b}><Face x={790} y={1250} r={190} t={uu} mood="laugh" c={Y} /><path d="M790 1440 l22 44 l48 7 l-35 34 l8 48 l-43 -23 l-43 23 l8 -48 l-35 -34 l48 -7 z" fill={Y} style={glow(Y, 16)} /></g>
        <Chip x={290} y={860} k={a} text={L.kind} w={480} s={zh ? 44 : 36} c="#ff8fab" />
        <Chip x={790} y={860} k={b} text={L.great} w={440} s={zh ? 44 : 38} c={Y} />
        <line x1={540} y1={760} x2={540} y2={1700} stroke={DIM} strokeWidth={4} strokeDasharray="18 14" />
      </>,
    );
  }
  if (i === 4) {
    const g = clamp((uu - 0.3) / 1.2);
    const ask = clamp((uu - at(zh ? '你会' : 'do you', d - 1.6)) / 0.35);
    return svg(
      <>
        <Txt x={540} y={820} s={50} c={DIM}>{L.study}</Txt>
        <Bars x={540} y={1450} k={g} vals={[[1, '#ff8fab', L.k1], [0.62, Y, L.k2]]} h={500} />
        <Txt x={400} y={930} s={90} o={clamp((g - 0.95) * 20)}>🏆</Txt>
        <Chip x={540} y={1680} k={ask} text={L.ask} w={zh ? 620 : 700} s={56} c={Y} />
      </>,
    );
  }
  if (i === 5) {
    const cnt = Math.min(20, Math.floor(clamp((uu - 0.4) / (d * 0.6)) * 20));
    const drop = clamp((uu - at(zh ? '压力激素' : 'stress', 3)) / 1.2);
    const hug = clamp((uu - at(zh ? '抱' : 'hug', d - 1)) / 0.35);
    return svg(
      <>
        <HeartIcon x={380} y={1150} s={7} t={uu} />
        <g transform="translate(380 1180)">
          <circle r={300} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={14} />
          <circle r={300} fill="none" stroke={Y} strokeWidth={14} strokeDasharray={`${(cnt / 20) * 1885} 1885`} transform="rotate(-90)" strokeLinecap="round" style={glow(Y, 14)} />
          <Txt x={0} y={420} s={80} c={Y}>{`${cnt}${zh ? '秒' : 's'}`}</Txt>
        </g>
        <g transform="translate(860 1180)" opacity={clamp(drop * 3)}>
          <Txt x={0} y={-210} s={40} c={DIM}>{L.stress}</Txt>
          <rect x={-60} y={-170} width={120} height={340} rx={20} fill="none" stroke={W} strokeWidth={6} />
          <rect x={-48} y={158 - 316 * (1 - drop * 0.6)} width={96} height={316 * (1 - drop * 0.6)} rx={14} fill={drop > 0.5 ? GREEN : RED} style={glow(drop > 0.5 ? GREEN : RED, 16)} />
        </g>
        <Chip x={540} y={1720} k={hug} text={`🤗 ${L.hug}`} w={zh ? 560 : 440} s={56} c={GREEN} />
      </>,
    );
  }
  if (i === 6) {
    const k = clamp((uu - at(zh ? '爱你' : 'got', d - 1.5)) / 0.35);
    return svg(
      <>
        <path d="M140 1700 A400 400 0 0 1 940 1700" stroke={Y} strokeWidth={8} fill="none" opacity={0.5} style={glow(Y, 30)} />
        <Face y={1250} r={260} t={uu} mood="calm" c={Y} />
        <HeartIcon x={540} y={1560} s={2.4} t={uu} />
        <Chip x={540} y={830} k={k} text={L.love} w={zh ? 520 : 560} s={80} c={Y} />
      </>,
    );
  }
  return svg(<Share u={uu} text={L.share} />);
};

const sfxFor = (B: Beat[], zh: boolean) => {
  const S: {at: number; f: string; v: number}[] = [{at: 0.05, f: 'boom', v: 0.35}, {at: 0.5, f: 'whip', v: 0.3}];
  const A = (bi: number, sub: string, fb: number) => B[bi].start + say(B, bi, sub, fb);
  S.push({at: A(1, '59', 1) - 0.2, f: 'whip', v: 0.4}, {at: A(1, '59', 1), f: 'boom', v: 0.35}, {at: A(1, zh ? '声音' : 'voice', 2.5), f: 'buzz', v: 0.6});
  for (let k = 0; k < 9; k++) S.push({at: B[2].start + 0.2 + k * 0.15, f: 'tick', v: 0.25});
  S.push({at: B[3].start + 0.2, f: 'pop', v: 0.35}, {at: A(3, zh ? '另一组' : 'another', 2.5), f: 'pop', v: 0.35});
  S.push({at: B[4].start + 0.3, f: 'rswoosh', v: 0.35}, {at: B[4].start + 1.5, f: 'ding', v: 0.3}, {at: A(4, zh ? '你会' : 'do you', B[4].dur - 1.6), f: 'pop', v: 0.4});
  for (let k = 0; k < 6; k++) S.push({at: B[5].start + 0.4 + k * 0.5, f: 'tick', v: 0.3});
  S.push({at: A(5, zh ? '压力激素' : 'stress', 3), f: 'lowswoosh', v: 0.4}, {at: A(5, zh ? '抱' : 'hug', B[5].dur - 1), f: 'chime', v: 0.3});
  S.push({at: A(6, zh ? '爱你' : 'got', B[6].dur - 1.5), f: 'chime', v: 0.35});
  S.push({at: B[7].start + 0.05, f: 'pop', v: 0.4});
  return S;
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
    <div style={{position: 'absolute', top: 400, left: 60, right: 60, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: zh ? 0 : 18, fontWeight: 900, fontSize: zh ? 70 : 62, lineHeight: 1.2, textShadow: '0 4px 18px rgba(0,0,0,0.8)'}}>
      {groups[g].map(([w, s], k) => (
        <span key={k} style={{whiteSpace: 'nowrap', color: t >= s ? (t < s + 0.45 ? Y : W) : 'rgba(255,255,255,0.4)'}}>{w}</span>
      ))}
    </div>
  );
};

export const KindN: React.FC<{lang: 'en' | 'zh'}> = ({lang}) => {
  useFont();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const B = (lang === 'zh' ? ZH : EN) as Beat[];
  const L = T[lang];
  const zh = lang === 'zh';
  const END = total(B);
  let i = B.findIndex((b) => t < b.start + b.dur);
  if (i < 0) i = B.length - 1;
  const b = B[i];
  const u = t - b.start;
  const inK = i === 0 ? 1 : clamp(u / 0.3);
  const fade = clamp((t - (END - 0.8)) / 0.7);
  const SFX = sfxFor(B, zh);
  return (
    <AbsoluteFill style={{fontFamily: F, color: W, overflow: 'hidden'}}>
      <Backdrop t={t} />
      <AbsoluteFill style={{opacity: inK, transform: `scale(${1 + clamp(u / b.dur) * 0.06})`, transformOrigin: '50% 62%'}}>
        <Scene i={i} u={u} d={b.dur} L={L} B={B} />
      </AbsoluteFill>
      {i === 0 ? (
        <div style={{position: 'absolute', top: 150, left: 60, right: 60, textAlign: 'center', fontWeight: 900, fontSize: zh ? 92 : 78, lineHeight: 1.38, textShadow: '0 6px 24px rgba(0,0,0,0.8)'}}>
          {L.hook.map((line, k) => (
            <div key={k}>
              {k === L.hl ? <span style={{display: 'inline-block', marginTop: 14, background: Y, color: '#16141a', padding: '0 18px', borderRadius: 14, lineHeight: 1.25}}>{line}</span> : line}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center'}}>
            <span style={{display: 'inline-block', fontSize: 56, fontWeight: 900, color: '#16141a', background: Y, padding: '8px 30px', borderRadius: 16, transform: `scale(${outBack(clamp(u / 0.3))})`}}>{b.top}</span>
          </div>
          <Captions t={t} B={B} zh={zh} />
        </>
      )}
      {b.src ? <div style={{position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center', fontSize: 30, fontWeight: 700, color: DIM}}>{L.src}{b.src}</div> : null}
      <div style={{position: 'absolute', top: 70, left: 60, fontSize: 30, color: DIM, letterSpacing: 4}}>
        {L.brand[0]}<span style={{background: Y, color: '#16141a', padding: '0 8px', borderRadius: 6, marginLeft: 6}}>{L.brand[1]}</span>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
      <Audio src={staticFile(`kind/${lang}-voice.wav`)} />
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
