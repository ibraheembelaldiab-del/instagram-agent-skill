import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFont} from './Cards';
import {clamp, inOut, outBack} from './Spec';
import EN from './kind-en.json';
import ZH from './kind-zh.json';

// 爱你老己 / self-compassion: after failing a test, the self-compassion group studied longer than the
// self-esteem group (Breines & Chen 2012); 20 s of soothing touch lowers cortisol like a hug (Dreisoerner et al. 2021).
// Colourful story style (see Decoy.tsx).

type Beat = {say: string; top: string; src?: string; start: number; dur: number; words: [string, number, number][]};
const total = (b: Beat[]) => b[b.length - 1].start + b[b.length - 1].dur;
export const KIND_EN_FRAMES = Math.ceil(total(EN as Beat[]) * 30);
export const KIND_ZH_FRAMES = Math.ceil(total(ZH as Beat[]) * 30);

const Y = '#ffd23f';
const W = '#ffffff';
const INK = '#1b1424';
const RED = '#ff4d6d';
const GREEN = '#3ddc84';
const F = '"Noto Sans SC", sans-serif';

const BG: [string, string][] = [
  ['#415a77', '#0d1b2a'],
  ['#1d3557', '#0b132b'],
  ['#118ab2', '#073b4c'],
  ['#7209b7', '#240046'],
  ['#2b9348', '#0b3d1b'],
  ['#ff5d8f', '#5a0a2a'],
  ['#ffb347', '#7a3b00'],
  ['#4cc9f0', '#0b3d5a'],
];
const T = {
  en: {
    hook: ['When you mess up…', 'do you roast yourself', 'or have your own back?'], hl: 2, name: 'Leo',
    voice: "You're so dumb.", fail: 'FAIL', kind: 'Be kind to yourself', great: "You're smart & great", study: 'Time spent studying',
    ask: 'Comment 1 if you roast yourself', sec: 's', stress: 'Stress hormone', hug: '≈ a hug', love: "I've got you.",
    share: 'Send to them', brand: ['Brain', 'Manual'], src: 'Research: ',
  },
  zh: {
    hook: ['搞砸了以后', '你是骂自己', '还是“爱你老己”？'], hl: 2, name: '小林',
    voice: '你怎么这么笨', fail: '不及格', kind: '对自己温柔一点', great: '相信自己很棒', study: '复习时间',
    ask: '你会骂自己吗？评论区打1', sec: '秒', stress: '压力激素', hug: '≈ 被抱了一下', love: '爱你，老己',
    share: '转给TA', brand: ['脑子', '说明书'], src: '研究：',
  },
};
type Lx = typeof T.en;

// when a phrase is spoken inside beat bi (seconds from the beat start)
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

const glow = (c: string, r = 20) => ({filter: `drop-shadow(0 0 ${r}px ${c})`});
const Txt: React.FC<{x: number; y: number; s: number; c?: string; w?: number; o?: number; stroke?: boolean; children: React.ReactNode}> = ({x, y, s, c = W, w = 900, o = 1, stroke, children}) => (
  <text x={x} y={y} textAnchor="middle" fontSize={s} fill={c} fontWeight={w} fontFamily={F} opacity={o} stroke={stroke ? INK : undefined} strokeWidth={stroke ? s * 0.12 : undefined} paintOrder="stroke">{children}</text>
);

// Leo / 小林: round head, hoodie, expressive face. pose 'heart' = hand on chest, 'phone' = holding a phone.
const Leo: React.FC<{x: number; y: number; s?: number; mood?: 'happy' | 'wow' | 'think' | 'shock' | 'sad'; t: number; jump?: number; flip?: boolean; pose?: 'heart' | 'phone'; hoodie?: string}> = ({x, y, s = 1, mood = 'happy', t, jump = 0, flip, pose, hoodie = Y}) => {
  const bob = Math.sin(t * 5) * 6 - jump * 60;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${flip ? -s : s} ${s})`}>
      <ellipse cx={0} cy={250} rx={110} ry={18} fill="rgba(0,0,0,0.25)" />
      <path d="M-95 240 L-80 60 Q0 20 80 60 L95 240 Z" fill={hoodie} stroke={INK} strokeWidth={8} />
      <path d="M-80 90 L-140 170" stroke={INK} strokeWidth={14} strokeLinecap="round" />
      {pose === 'heart' ? (
        <>
          <path d="M80 90 Q60 150 10 130" stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" />
          <path d="M10 112 c-14 -22 -44 -8 -30 14 l30 26 l30 -26 c14 -22 -16 -36 -30 -14 z" fill={RED} stroke={INK} strokeWidth={4} transform={`scale(${1 + 0.08 * Math.sin(t * 8)})`} />
        </>
      ) : pose === 'phone' ? (
        <>
          <path d="M80 90 L40 40" stroke={INK} strokeWidth={14} strokeLinecap="round" />
          <rect x={10} y={-10} width={60} height={100} rx={10} fill={INK} transform="rotate(-15 40 40)" />
          <rect x={18} y={0} width={44} height={78} rx={6} fill="#9be7ff" transform="rotate(-15 40 40)" style={{filter: 'drop-shadow(0 0 14px #9be7ff)'}} />
        </>
      ) : (
        <path d={mood === 'wow' || mood === 'shock' ? 'M80 90 L150 0' : 'M80 90 L140 170'} stroke={INK} strokeWidth={14} strokeLinecap="round" />
      )}
      <circle cx={0} cy={-30} r={95} fill="#ffe0bd" stroke={INK} strokeWidth={8} />
      <path d="M-90 -60 Q-60 -150 30 -125 Q90 -110 92 -50 Q40 -95 -90 -60 Z" fill={INK} />
      {mood === 'shock' ? (
        <>
          <circle cx={-32} cy={-35} r={16} fill={W} stroke={INK} strokeWidth={5} />
          <circle cx={32} cy={-35} r={16} fill={W} stroke={INK} strokeWidth={5} />
          <circle cx={-32} cy={-35} r={6} fill={INK} />
          <circle cx={32} cy={-35} r={6} fill={INK} />
          <ellipse cx={0} cy={20} rx={16} ry={22} fill={INK} />
        </>
      ) : mood === 'sad' ? (
        <>
          <path d="M-46 -48 l26 8 M46 -48 l-26 8" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <circle cx={-32} cy={-30} r={8} fill={INK} />
          <circle cx={32} cy={-30} r={8} fill={INK} />
          <path d="M-28 30 Q0 8 28 30" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
          <path d={`M-40 -12 q-8 ${18 + 6 * Math.sin(t * 4)} 0 26 q8 -8 0 -26`} fill="#7ec8ff" />
        </>
      ) : (
        <>
          <circle cx={-32} cy={-35} r={9} fill={INK} />
          <circle cx={32} cy={-35} r={9} fill={INK} />
          {mood === 'think' ? <path d="M-20 15 h40" stroke={INK} strokeWidth={8} strokeLinecap="round" /> : <path d={mood === 'wow' ? 'M-35 5 Q0 55 35 5 Z' : 'M-30 10 Q0 40 30 10'} stroke={INK} strokeWidth={8} fill={mood === 'wow' ? INK : 'none'} strokeLinecap="round" />}
          <circle cx={-58} cy={0} r={12} fill="#ff9aa2" opacity={0.7} />
          <circle cx={58} cy={0} r={12} fill="#ff9aa2" opacity={0.7} />
        </>
      )}
    </g>
  );
};
const Cat: React.FC<{x: number; y: number; s?: number; t: number; proud?: number; look?: number}> = ({x, y, s = 1, t, proud = 0, look = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={`M90 120 q${90 + 20 * Math.sin(t * 4)} -40 ${60} -160`} stroke={INK} strokeWidth={26} fill="none" strokeLinecap="round" />
    <path d={`M90 120 q${90 + 20 * Math.sin(t * 4)} -40 ${60} -160`} stroke="#f4a261" strokeWidth={16} fill="none" strokeLinecap="round" />
    <ellipse cx={0} cy={100} rx={120} ry={95} fill={W} stroke={INK} strokeWidth={8} />
    <ellipse cx={-50} cy={80} rx={40} ry={30} fill="#f4a261" />
    <ellipse cx={55} cy={120} rx={35} ry={28} fill={INK} />
    <g transform={`translate(${look * 30} ${-proud * 20}) rotate(${look * 10})`}>
      <path d="M-85 -60 L-70 -150 L-20 -95 Z" fill={W} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d="M85 -60 L70 -150 L20 -95 Z" fill="#f4a261" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <circle cx={0} cy={-40} r={95} fill={W} stroke={INK} strokeWidth={8} />
      <path d="M20 -125 Q70 -110 85 -60 Q50 -80 20 -125 Z" fill="#f4a261" />
      {proud > 0.5 ? (
        <>
          <path d="M-50 -50 q15 -16 30 0 M20 -50 q15 -16 30 0" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={-35} cy={-50} r={12} fill={INK} />
          <circle cx={35} cy={-50} r={12} fill={INK} />
        </>
      )}
      <path d="M-8 -25 h16 l-8 10 z" fill="#ff8fa3" />
      <path d="M0 -15 q-14 18 -28 6 M0 -15 q14 18 28 6" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M-60 -20 h-50 M-60 -8 h-48 M60 -20 h50 M60 -8 h48" stroke={INK} strokeWidth={4} />
    </g>
  </g>
);
const Burst: React.FC<{x: number; y: number; k: number; text: string; c?: string; s?: number; rot?: number}> = ({x, y, k, text, c = Y, s = 1, rot = -6}) => {
  const pts = [...Array(24)].map((_, j) => {
    const r = j % 2 ? 150 : 210;
    const a = (j / 24) * Math.PI * 2;
    return `${Math.cos(a) * r * 1.5},${Math.sin(a) * r * 0.8}`;
  }).join(' ');
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${outBack(k) * s})`} opacity={clamp(k * 3)}>
      <polygon points={pts} fill={c} stroke={INK} strokeWidth={8} />
      <Txt x={0} y={26} s={78} c={INK}>{text}</Txt>
    </g>
  );
};
const Coin: React.FC<{x: number; y: number; r?: number; t: number}> = ({x, y, r = 40, t}) => (
  <g transform={`translate(${x} ${y}) scale(${Math.abs(Math.cos(t * 4)) * 0.7 + 0.3} 1)`}>
    <circle r={r} fill="#ffd23f" stroke="#b8860b" strokeWidth={6} />
    <Txt x={0} y={r * 0.38} s={r * 1.1} c="#b8860b">¥</Txt>
  </g>
);

const Bucket: React.FC<{x: number; y: number; s?: number; label?: string; price?: string; hi?: boolean; t: number}> = ({x, y, s = 1, label, price, hi, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[...Array(7)].map((_, k) => (
      <circle key={k} cx={-70 + k * 23} cy={-120 + Math.sin(k * 2.1 + t * 3) * 6 - (k % 2) * 18} r={30} fill="#fff6d6" stroke="#e8c76a" strokeWidth={4} />
    ))}
    <path d="M-100 -110 L-75 120 L75 120 L100 -110 Z" fill={W} stroke={INK} strokeWidth={8} />
    {[-60, -20, 20, 60].map((sx, k) => <path key={k} d={`M${sx - 12} -110 L${sx * 0.75 - 10} 120 L${sx * 0.75 + 10} 120 L${sx + 12} -110 Z`} fill={RED} />)}
    {label ? <Txt x={0} y={20} s={44} c={INK} stroke={false}>{label}</Txt> : null}
    {price ? (
      <g transform="translate(0 185)">
        <rect x={-85} y={-45} width={170} height={74} rx={18} fill={hi ? Y : W} stroke={INK} strokeWidth={6} style={hi ? glow(Y, 24) : undefined} />
        <Txt x={0} y={12} s={44} c={INK}>{price}</Txt>
      </g>
    ) : null}
  </g>
);

const Bubble: React.FC<{x: number; y: number; w: number; h: number; tail?: [number, number]; k: number; children: React.ReactNode; fill?: string}> = ({x, y, w, h, tail, k, children, fill = W}) => (
  <g transform={`translate(${x} ${y}) scale(${outBack(k)})`} opacity={clamp(k * 3)}>
    {tail ? <path d={`M-30 ${h / 2 - 10} L${tail[0]} ${tail[1]} L30 ${h / 2 - 10} Z`} fill={fill} stroke={INK} strokeWidth={6} /> : null}
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={40} fill={fill} stroke={INK} strokeWidth={6} />
    {children}
  </g>
);

const Bulbs: React.FC<{t: number}> = ({t}) => (
  <>
    {[...Array(22)].map((_, k) => {
      const top = k < 11;
      const x = 80 + (k % 11) * 92;
      const on = (Math.floor(t * 6) + k) % 3 !== 0;
      return <circle key={k} cx={x} cy={top ? 40 : 1880} r={14} fill={on ? Y : '#7a5c00'} style={on ? glow(Y, 12) : undefined} />;
    })}
  </>
);

const Rain: React.FC<{t: number; x0?: number; w?: number; y0?: number; h?: number; o?: number}> = ({t, x0 = 0, w = 1080, y0 = 0, h = 1920, o = 0.6}) => (
  <>
    {[...Array(40)].map((_, k) => {
      const x = x0 + (k * 137) % w;
      const y = y0 + ((k * 263 + t * 1400) % h);
      return <line key={k} x1={x} y1={y} x2={x - 10} y2={y + 40} stroke="#a9d6ff" strokeWidth={4} opacity={o} />;
    })}
  </>
);
const Cloud: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = '#6c757d'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-200 60 a80 80 0 0 1 40 -150 a110 110 0 0 1 200 -30 a90 90 0 0 1 150 60 a70 70 0 0 1 10 120 Z" fill={c} stroke={INK} strokeWidth={8} />
  </g>
);
const Paper: React.FC<{x: number; y: number; s?: number; score: string; rot?: number}> = ({x, y, s = 1, score, rot = -6}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-150} y={-200} width={300} height={400} rx={14} fill={W} stroke={INK} strokeWidth={7} />
    {[0, 1, 2, 3, 4].map((k) => <path key={k} d={`M-110 ${-110 + k * 55} h220`} stroke="#ced4da" strokeWidth={10} strokeLinecap="round" />)}
    <circle cx={60} cy={-130} r={70} fill="none" stroke={RED} strokeWidth={10} />
    <Txt x={60} y={-105} s={74} c={RED}>{score}</Txt>
  </g>
);

const Scene: React.FC<{i: number; u: number; d: number; L: Lx; B: Beat[]}> = ({i, u, d, L, B}) => {
  const svg = (c: React.ReactNode) => <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{c}</svg>;
  const uu = Math.max(0, u);
  const at = (sub: string, fb = 1) => say(B, i, sub, fb);
  const zh = L.name === '小林';
  if (i === 0) {
    const flash = uu > 0.9 && uu < 1.1 ? 1 : 0;
    return svg(
      <>
        <AbsoluteFillRect o={flash * 0.35} />
        <Cloud x={540} y={760} s={1.3} />
        <path d="M600 860 l-60 120 h60 l-50 130" stroke={Y} strokeWidth={14} fill="none" strokeLinejoin="round" opacity={flash ? 1 : 0.25} />
        <Rain t={uu} x0={240} w={640} y0={860} h={900} />
        <Paper x={830} y={1450} s={0.7} score="59" rot={10} />
        <Leo x={460} y={1450} s={1.05} t={uu} mood="sad" />
      </>,
    );
  }
  if (i === 1) {
    const p = outBack(clamp((uu - at('59', 1) + 0.2) / 0.4));
    const v = clamp((uu - at(zh ? '声音' : 'voice', 2.5)) / 0.4);
    return svg(
      <>
        <Rain t={uu} o={0.35} />
        <g transform={`translate(540 860) scale(${p})`}><Paper x={0} y={0} s={1.3} score="59" rot={-4} /></g>
        <g transform={`translate(${540 + (v > 0 ? Math.sin(uu * 40) * 6 : 0)} 1260) scale(${outBack(v)})`} opacity={clamp(v * 3)}>
          <path d="M-380 -90 h760 v170 h-500 l-60 70 l0 -70 h-200 z" fill="#212529" stroke={RED} strokeWidth={8} />
          <Txt x={0} y={22} s={64} c={RED}>{L.voice}</Txt>
        </g>
        <Leo x={540} y={1620} s={0.65} t={uu} mood="sad" />
      </>,
    );
  }
  if (i === 2) {
    return svg(
      <>
        <rect x={140} y={620} width={800} height={260} rx={14} fill="#1b4332" stroke="#8d6e63" strokeWidth={14} />
        <Txt x={540} y={780} s={64} c={W}>TEST 📝</Txt>
        {[...Array(9)].map((_, k) => {
          const x = 220 + (k % 3) * 320;
          const y = 1120 + Math.floor(k / 3) * 230;
          const on = clamp((uu - 0.3 - k * 0.15) / 0.3);
          return (
            <g key={k} opacity={on} transform={`translate(${x} ${y})`}>
              <rect x={-110} y={30} width={220} height={24} rx={6} fill="#8d6e63" />
              <circle cx={0} cy={-30} r={44} fill="#ffe0bd" stroke={INK} strokeWidth={5} />
              <path d="M-16 -12 q16 -12 32 0" stroke={INK} strokeWidth={5} fill="none" />
              <g transform="translate(70 -20)"><rect x={-30} y={-36} width={60} height={72} rx={6} fill={W} stroke={INK} strokeWidth={4} /><Txt x={0} y={14} s={44} c={RED}>✗</Txt></g>
            </g>
          );
        })}
      </>,
    );
  }
  if (i === 3) {
    const a = clamp((uu - 0.2) / 0.4);
    const b = clamp((uu - at(zh ? '另一组' : 'another', 2.5)) / 0.4);
    return svg(
      <>
        <rect x={0} y={560} width={540} height={1300} fill="rgba(255,93,143,0.18)" opacity={a} />
        <rect x={540} y={560} width={540} height={1300} fill="rgba(255,210,63,0.15)" opacity={b} />
        <g opacity={a}>
          <Leo x={270} y={1300} s={0.75} t={uu} mood="happy" pose="heart" hoodie="#ff8fab" />
          <rect x={30} y={700} width={480} height={110} rx={55} fill={W} stroke={INK} strokeWidth={7} />
          <Txt x={270} y={772} s={zh ? 48 : 38} c={INK}>💗 {L.kind}</Txt>
        </g>
        <g opacity={b}>
          <Leo x={810} y={1300} s={0.75} t={uu + 1} mood="wow" hoodie="#ffd23f" />
          <rect x={570} y={700} width={480} height={110} rx={55} fill={W} stroke={INK} strokeWidth={7} />
          <Txt x={810} y={772} s={zh ? 48 : 38} c={INK}>⭐ {L.great}</Txt>
        </g>
        <line x1={540} y1={600} x2={540} y2={1800} stroke={W} strokeWidth={6} strokeDasharray="20 16" />
      </>,
    );
  }
  if (i === 4) {
    const g = clamp((uu - 0.3) / 1.4);
    const ask = outBack(clamp((uu - at(zh ? '你会' : 'do you', d - 1.6)) / 0.4));
    const bar = (y: number, w: number, c: string, lab: string) => (
      <g>
        <Txt x={540} y={y - 24} s={44} c={W} stroke>{lab}</Txt>
        <rect x={140} y={y} width={800 * w * g} height={90} rx={20} fill={c} stroke={INK} strokeWidth={7} />
      </g>
    );
    return svg(
      <>
        <Txt x={540} y={700} s={52} c={W} stroke>⏱ {L.study}</Txt>
        {bar(860, 0.95, '#ff8fab', `💗 ${L.kind}`)}
        {bar(1100, 0.62, Y, `⭐ ${L.great}`)}
        <g transform="translate(940 860)" opacity={clamp((g - 0.9) * 10)}><Txt x={0} y={70} s={80} c={W} stroke>🏆</Txt></g>
        <g transform={`translate(540 1520) rotate(-3) scale(${ask})`}>
          <rect x={-450} y={-70} width={900} height={130} rx={40} fill={W} stroke={INK} strokeWidth={8} />
          <Txt x={0} y={20} s={zh ? 56 : 48} c={INK}>{L.ask}</Txt>
        </g>
      </>,
    );
  }
  if (i === 5) {
    const hand = clamp((uu - 0.3) / 0.4);
    const cnt = Math.min(20, Math.floor(clamp((uu - 0.6) / (d * 0.55)) * 20));
    const drop = clamp((uu - at(zh ? '压力激素' : 'stress', 3)) / 1.2);
    const hug = outBack(clamp((uu - at(zh ? '抱' : 'hug', d - 1)) / 0.4));
    return svg(
      <>
        <Leo x={330} y={1250} s={1.0} t={uu} mood="happy" pose={hand > 0 ? 'heart' : undefined} hoodie="#ffd23f" />
        <g transform="translate(800 820)">
          <circle r={130} fill="rgba(0,0,0,0.25)" stroke={W} strokeWidth={10} />
          <circle r={130} fill="none" stroke={Y} strokeWidth={14} strokeDasharray={`${(cnt / 20) * 817} 817`} transform="rotate(-90)" strokeLinecap="round" />
          <Txt x={0} y={30} s={90} c={W}>{`${cnt}${L.sec}`}</Txt>
        </g>
        <g transform="translate(800 1240)" opacity={clamp(drop * 3)}>
          <Txt x={0} y={-150} s={40} c={W} stroke>{L.stress}</Txt>
          <rect x={-60} y={-120} width={120} height={300} rx={20} fill="rgba(0,0,0,0.3)" stroke={W} strokeWidth={6} />
          <rect x={-48} y={168 - 276 * (1 - drop * 0.6)} width={96} height={276 * (1 - drop * 0.6)} rx={14} fill={drop > 0.5 ? GREEN : RED} />
          <Txt x={110} y={60} s={80} c={W} stroke>↓</Txt>
        </g>
        <g transform={`translate(540 1660) rotate(-3) scale(${hug})`}>
          <rect x={-320} y={-70} width={640} height={130} rx={65} fill={W} stroke={INK} strokeWidth={8} />
          <Txt x={0} y={22} s={58} c={INK}>🤗 {L.hug}</Txt>
        </g>
      </>,
    );
  }
  if (i === 6) {
    const sun = clamp(uu / 1.5);
    const k = clamp((uu - at(zh ? '爱你' : 'got', d - 1.5)) / 0.4);
    return svg(
      <>
        <circle cx={540} cy={1500 - sun * 700} r={170} fill="#ffe066" style={{filter: 'drop-shadow(0 0 80px #ffe066)'}} />
        {['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'].map((c, j) => <path key={j} d={`M${60 + j * 30} 1500 A${480 - j * 30} ${480 - j * 30} 0 0 1 ${1020 - j * 30} 1500`} stroke={c} strokeWidth={28} fill="none" opacity={0.85 * sun} />)}
        <Leo x={540} y={1440} s={1.0} t={uu} mood="happy" pose="heart" hoodie="#ff8fab" />
        <Bubble x={540} y={900} w={760} h={190} tail={[-120, 150]} k={k}>
          <Txt x={0} y={26} s={zh ? 80 : 70} c="#d6336c">{L.love}</Txt>
        </Bubble>
      </>,
    );
  }
  const kk = outBack(clamp(uu / 0.5));
  return svg(
    <>
      <g transform={`translate(640 1150) scale(${kk})`}>
        <rect x={-170} y={-300} width={340} height={600} rx={50} fill={INK} stroke={W} strokeWidth={10} />
        <rect x={-140} y={-260} width={280} height={520} rx={30} fill="#ff8fab" />
        <path d="M-60 40 L60 -40 M60 -40 L20 -50 M60 -40 L52 0" stroke={W} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${Math.sin(uu * 4) * 8})`} />
        <Txt x={0} y={170} s={48} c={INK}>{L.share}</Txt>
      </g>
      <Leo x={260} y={1560} s={0.8} t={uu} mood="wow" jump={Math.abs(Math.sin(uu * 6)) * 0.5} />
    </>,
  );
};
const AbsoluteFillRect: React.FC<{o: number}> = ({o}) => <rect x={0} y={0} width={1080} height={1920} fill={W} opacity={o} />;

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
    <div style={{position: 'absolute', top: 340, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: zh ? 0 : 18, maxWidth: 940, padding: '10px 30px', borderRadius: 30, background: 'rgba(15,10,25,0.55)', fontWeight: 900, fontSize: zh ? 68 : 62, lineHeight: 1.2}}>
        {groups[g].map(([w, s], k) => (
          <span key={k} style={{whiteSpace: 'nowrap', color: t >= s ? (t < s + 0.45 ? Y : W) : 'rgba(255,255,255,0.45)'}}>{w}</span>
        ))}
      </div>
    </div>
  );
};

const sfxFor = (B: Beat[], zh: boolean) => {
  const S: {at: number; f: string; v: number}[] = [{at: 0.05, f: 'boom', v: 0.35}, {at: 0.9, f: 'boom', v: 0.45}, {at: 0.9, f: 'whip', v: 0.3}];
  const A = (bi: number, sub: string, fb: number) => B[bi].start + say(B, bi, sub, fb);
  S.push({at: A(1, '59', 1) - 0.2, f: 'whip', v: 0.4}, {at: A(1, '59', 1), f: 'boom', v: 0.35}, {at: A(1, zh ? '声音' : 'voice', 2.5), f: 'buzz', v: 0.6});
  for (let k = 0; k < 9; k++) S.push({at: B[2].start + 0.3 + k * 0.15, f: 'tick', v: 0.25});
  S.push({at: B[3].start + 0.2, f: 'pop', v: 0.35}, {at: A(3, zh ? '另一组' : 'another', 2.5), f: 'pop', v: 0.35});
  S.push({at: B[4].start + 0.3, f: 'rswoosh', v: 0.35}, {at: B[4].start + 1.7, f: 'ding', v: 0.3}, {at: A(4, zh ? '你会' : 'do you', B[4].dur - 1.6), f: 'pop', v: 0.4});
  S.push({at: B[5].start + 0.3, f: 'pop', v: 0.3});
  for (let k = 0; k < 6; k++) S.push({at: B[5].start + 0.6 + k * 0.5, f: 'tick', v: 0.3});
  S.push({at: A(5, zh ? '压力激素' : 'stress', 3), f: 'lowswoosh', v: 0.4}, {at: A(5, zh ? '抱' : 'hug', B[5].dur - 1), f: 'chime', v: 0.3});
  S.push({at: B[6].start + 0.2, f: 'highswoosh', v: 0.3}, {at: A(6, zh ? '爱你' : 'got', B[6].dur - 1.5), f: 'chime', v: 0.35});
  S.push({at: B[7].start + 0.05, f: 'pop', v: 0.4});
  return S;
};

export const Kind: React.FC<{lang: 'en' | 'zh'}> = ({lang}) => {
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
  const prev = BG[Math.max(0, i - 1)];
  const cur = BG[i];
  const SFX = sfxFor(B, zh);
  return (
    <AbsoluteFill style={{fontFamily: F, color: W, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 35%, ${prev[0]} 0%, ${prev[1]} 75%)`}} />
      <AbsoluteFill style={{opacity: inK, background: `radial-gradient(ellipse at 50% 35%, ${cur[0]} 0%, ${cur[1]} 75%)`}} />
      <AbsoluteFill style={{opacity: inK, transform: `scale(${1 + clamp(u / b.dur) * 0.05}) translateY(${(1 - inK) * 40}px)`, transformOrigin: '50% 62%'}}>
        <Scene i={i} u={u} d={b.dur} L={L} B={B} />
      </AbsoluteFill>
      {i === 0 ? (
        <div style={{position: 'absolute', top: 150, left: 50, right: 50, textAlign: 'center', fontWeight: 900, fontSize: zh ? 100 : 86, lineHeight: 1.3, textShadow: '0 6px 0 #2a0614, 0 10px 30px rgba(0,0,0,0.6)'}}>
          {L.hook.map((line, k) => (
            <div key={k}>
              {k === L.hl ? <span style={{display: 'inline-block', marginTop: 14, background: Y, color: INK, padding: '0 22px', borderRadius: 18, lineHeight: 1.25, textShadow: 'none', transform: `rotate(-2deg) scale(${1 + 0.04 * Math.sin(t * 6)})`}}>{line}</span> : line}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center'}}>
            <span style={{display: 'inline-block', fontSize: 54, fontWeight: 900, color: INK, background: Y, padding: '6px 30px', borderRadius: 18, border: `5px solid ${INK}`, transform: `rotate(-2deg) scale(${outBack(clamp(u / 0.35))})`}}>{b.top}</span>
          </div>
          <Captions t={t} B={B} zh={zh} />
        </>
      )}
      {b.src ? <div style={{position: 'absolute', bottom: 56, left: 0, right: 0, textAlign: 'center', fontSize: 30, fontWeight: 700, color: 'rgba(255,255,255,0.8)'}}>{L.src}{b.src}</div> : null}
      <div style={{position: 'absolute', top: 76, left: 60, fontSize: 30, fontWeight: 900, color: W, letterSpacing: 4}}>
        {L.brand[0]}<span style={{background: Y, color: INK, padding: '0 8px', borderRadius: 6, marginLeft: 6}}>{L.brand[1]}</span>
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
