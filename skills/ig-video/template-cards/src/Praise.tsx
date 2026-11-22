import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFont} from './Cards';
import {clamp, inOut, outBack} from './Spec';
import EN from './praise-en.json';
import ZH from './praise-zh.json';

// Why praise feels so good (the 萝卜纸巾猫 trend): praise activates the striatum like money
// (Izuma, Saito & Sadato 2008) and praise after training boosts next-day skill (Sugawara et al. 2012).
// Colourful story style (see Decoy.tsx).

type Beat = {say: string; top: string; src?: string; start: number; dur: number; words: [string, number, number][]};
const total = (b: Beat[]) => b[b.length - 1].start + b[b.length - 1].dur;
export const PRAISE_EN_FRAMES = Math.ceil(total(EN as Beat[]) * 30);
export const PRAISE_ZH_FRAMES = Math.ceil(total(ZH as Beat[]) * 30);

const Y = '#ffd23f';
const W = '#ffffff';
const INK = '#1b1424';
const RED = '#ff4d6d';
const GREEN = '#3ddc84';
const F = '"Noto Sans SC", sans-serif';

const BG: [string, string][] = [
  ['#5a189a', '#10002b'],
  ['#3a56d4', '#0d1640'],
  ['#f9a825', '#5d3a00'],
  ['#ff5d8f', '#5a0a2a'],
  ['#2b9348', '#0b3d1b'],
  ['#f77f00', '#5a2300'],
  ['#4cc9f0', '#0b3d5a'],
];
const T = {
  en: {
    hook: ['Dumb cat. "Good job!"', 'Why are millions', 'hooked?'], hl: 2, name: 'Leo',
    carrot: 'carrot', tissue: 'tissue', good: 'GOOD JOB!', praise: 'Praise', money: 'Money', same: 'same spot!',
    ask: 'Comment: were you praised today?', me: "You're doing great 💛", day1: 'Day 1', day2: 'Day 2', praised: 'praised', not: 'not praised',
    line: '“That idea today? Brilliant.”', share: 'Send to them', brand: ['Brain', 'Manual'], src: 'Research: ',
  },
  zh: {
    hook: ['一只笨猫被夸“真棒”', '为什么几亿人', '看上瘾？'], hl: 2, name: '小林',
    carrot: '萝卜', tissue: '纸巾', good: '真棒！', praise: '被夸', money: '拿钱', same: '同一个区域！',
    ask: '评论区：你今天被夸了吗？', me: '你已经很棒了 💛', day1: '第1天', day2: '第2天', praised: '被夸组', not: '没被夸',
    line: '“你今天那个点子，真棒！”', share: '转给TA', brand: ['脑子', '说明书'], src: '研究：',
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

const Carrot: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-30 -40 L30 -40 L0 120 Z" fill="#ff8c1a" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M-10 -40 l-30 -50 M0 -40 l0 -60 M10 -40 l30 -50" stroke="#2b9348" strokeWidth={12} strokeLinecap="round" />
  </g>
);
const Tissue: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-80} y={-20} width={160} height={110} rx={14} fill="#4cc9f0" stroke={INK} strokeWidth={7} />
    <path d="M-30 -20 q30 -90 60 0" fill={W} stroke={INK} strokeWidth={6} />
  </g>
);

const Scene: React.FC<{i: number; u: number; d: number; L: Lx; B: Beat[]}> = ({i, u, d, L, B}) => {
  const svg = (c: React.ReactNode) => <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{c}</svg>;
  const uu = Math.max(0, u);
  const at = (sub: string, fb = 1) => say(B, i, sub, fb);
  const zh = L.name === '小林';
  if (i === 0) {
    const pick = clamp((uu - 0.8) / 0.6);
    const yay = clamp((uu - 1.5) / 0.4);
    return svg(
      <>
        {[...Array(16)].map((_, k) => <circle key={k} cx={(k * 211) % 1080} cy={(k * 337) % 1920} r={4 + (k % 3) * 3} fill={W} opacity={0.3 + 0.3 * Math.sin(uu * 3 + k)} />)}
        <Carrot x={250} y={1500} s={1.1} />
        <g transform={`translate(${-pick * 60} ${-pick * 120})`}><Tissue x={830} y={1520} s={1.1} /></g>
        <Cat x={540} y={1300} s={1.15} t={uu} proud={yay} look={pick * 0.8} />
        <Burst x={540} y={880} k={yay} text={L.good} />
      </>,
    );
  }
  if (i === 1) {
    const cat = clamp((uu - at(zh ? '一只猫' : 'cat', 1)) / 0.4);
    const pk = clamp((uu - at(zh ? '纸巾' : 'tissue', 3)) / 0.4);
    const yay = clamp((uu - at(zh ? '真棒' : 'good', 4)) / 0.3);
    const laugh = clamp((uu - at(zh ? '笑出' : 'laughs', 5)) / 0.3);
    return svg(
      <>
        <rect x={60} y={1500} width={960} height={260} rx={40} fill="#5e60ce" stroke={INK} strokeWidth={8} />
        <rect x={80} y={1440} width={260} height={110} rx={50} fill={W} stroke={INK} strokeWidth={6} />
        <g transform={`translate(540 980) scale(${outBack(cat)})`}>
          <rect x={-300} y={-420} width={600} height={720} rx={60} fill={INK} />
          <rect x={-270} y={-380} width={540} height={640} rx={36} fill="#cde8ff" />
          <Carrot x={-170} y={120} s={0.55} />
          <g transform={`translate(${-pk * 40} ${-pk * 80})`}><Tissue x={170} y={140} s={0.6} /></g>
          <Cat x={0} y={-20} s={0.6} t={uu} proud={yay} look={pk} />
          <Burst x={0} y={-260} k={yay} text={L.good} s={0.55} />
        </g>
        <Leo x={760} y={1560} s={0.75} t={uu} mood={laugh > 0 ? 'wow' : 'happy'} pose="phone" jump={laugh * Math.abs(Math.sin(uu * 9)) * 0.3} />
        {laugh > 0 ? <Txt x={880} y={1300} s={70} c={Y} stroke>{zh ? '哈哈哈' : 'HAHA'}</Txt> : null}
      </>,
    );
  }
  if (i === 2) {
    const a = clamp((uu - 0.3) / 0.5);
    const b = clamp((uu - at(zh ? '拿到钱' : 'money', 3)) / 0.5);
    const glowK = 0.5 + 0.5 * Math.sin(uu * 6);
    return svg(
      <>
        <g transform="translate(540 1080)">
          <path d="M-260 70 C-330 -70 -250 -230 -110 -230 C-60 -300 70 -300 120 -230 C260 -230 330 -70 260 70 C260 190 140 240 0 225 C-140 240 -260 190 -260 70 Z" fill="#ffc8dd" stroke={INK} strokeWidth={10} />
          <path d="M0 -260 V220 M-170 -100 q90 50 170 0 M0 0 q90 50 190 0 M-210 90 q90 -30 170 15" stroke="#e5989b" strokeWidth={9} fill="none" />
          <circle cx={0} cy={60} r={70 + 20 * glowK * Math.max(a, b)} fill={Y} opacity={0.85 * Math.max(a, b)} style={{filter: `drop-shadow(0 0 40px ${Y})`}} />
        </g>
        <g transform={`translate(230 620) scale(${outBack(a)})`}>
          <rect x={-150} y={-60} width={300} height={110} rx={55} fill={W} stroke={INK} strokeWidth={7} />
          <Txt x={0} y={18} s={52} c={INK}>👏 {L.praise}</Txt>
        </g>
        <g transform={`translate(850 620) scale(${outBack(b)})`}>
          <rect x={-150} y={-60} width={300} height={110} rx={55} fill={W} stroke={INK} strokeWidth={7} />
          <Txt x={0} y={18} s={52} c={INK}>{L.money}</Txt>
        </g>
        <path d="M230 690 Q300 900 470 1080 M850 690 Q780 900 610 1080" stroke={W} strokeWidth={7} strokeDasharray="16 12" fill="none" opacity={Math.max(a * 0.9, b)} />
        {b > 0 ? [...Array(9)].map((_, k) => <Coin key={k} x={120 + k * 105} y={300 + ((uu - 2) * 600 + k * 170) % 1300 + 300} r={34} t={uu + k} />) : null}
        <Burst x={540} y={1520} k={b} text={L.same} s={0.6} c={W} />
      </>,
    );
  }
  if (i === 3) {
    const ask = outBack(clamp((uu - at(zh ? '你今天' : 'were', 2)) / 0.4));
    const me = outBack(clamp((uu - at(zh ? '我先夸' : 'first', d - 1)) / 0.4));
    return svg(
      <>
        {[...Array(12)].map((_, k) => {
          const p = (uu * 0.4 + k * 0.083) % 1;
          return <path key={k} d="M0 10 c-14 -22 -44 -8 -30 14 l30 26 l30 -26 c14 -22 -16 -36 -30 -14 z" fill={k % 2 ? W : Y} opacity={0.8 * (1 - p)} transform={`translate(${100 + (k * 89) % 880} ${1800 - p * 1300}) scale(${1.4})`} />;
        })}
        <Leo x={540} y={1180} s={1.0} t={uu} mood="happy" />
        <g transform={`translate(540 1580) rotate(-3) scale(${ask})`}>
          <rect x={-460} y={-70} width={920} height={130} rx={40} fill={W} stroke={INK} strokeWidth={8} />
          <Txt x={0} y={20} s={zh ? 56 : 46} c={INK}>{L.ask}</Txt>
        </g>
        <g transform={`translate(540 780) rotate(3) scale(${me})`}>
          <rect x={-330} y={-65} width={660} height={120} rx={60} fill={Y} stroke={INK} strokeWidth={8} />
          <Txt x={0} y={20} s={54} c={INK}>{L.me}</Txt>
        </g>
      </>,
    );
  }
  if (i === 4) {
    const keys = Math.floor(uu * 4) % 5;
    const day2 = clamp((uu - at(zh ? '第二天' : 'next', 3.5)) / 0.5);
    const yay = clamp((uu - at(zh ? '学完' : 'praised', 1.5)) / 0.4);
    return svg(
      <>
        <g transform="translate(540 760)">
          {[0, 1, 2, 3, 4].map((k) => <rect key={k} x={-300 + k * 125} y={-60} width={105} height={150} rx={16} fill={k === keys ? Y : W} stroke={INK} strokeWidth={6} style={k === keys ? {filter: `drop-shadow(0 0 20px ${Y})`} : undefined} />)}
        </g>
        <Leo x={300} y={1240} s={0.7} t={uu} mood={yay > 0 ? 'wow' : 'think'} />
        <Burst x={300} y={980} k={yay} text={L.good} s={0.45} />
        <g opacity={day2} transform="translate(680 1180)">
          <rect x={-40} y={-200} width={360} height={520} rx={24} fill={W} stroke={INK} strokeWidth={7} />
          <rect x={-40} y={-200} width={360} height={90} rx={24} fill={RED} stroke={INK} strokeWidth={7} />
          <Txt x={140} y={-138} s={48} c={W}>{L.day2}</Txt>
          <rect x={10} y={280 - 300 * day2} width={110} height={300 * day2} rx={10} fill={GREEN} stroke={INK} strokeWidth={5} />
          <rect x={170} y={280 - 190 * day2} width={110} height={190 * day2} rx={10} fill="#adb5bd" stroke={INK} strokeWidth={5} />
          <Txt x={65} y={310} s={30} c={INK}>{L.praised}</Txt>
          <Txt x={225} y={310} s={30} c={INK}>{L.not}</Txt>
        </g>
      </>,
    );
  }
  if (i === 5) {
    const k = clamp((uu - 0.8) / 0.4);
    return svg(
      <>
        <circle cx={880} cy={420} r={90} fill="#fff3b0" style={{filter: 'drop-shadow(0 0 40px #fff3b0)'}} />
        <Leo x={330} y={1380} s={0.85} t={uu} mood="happy" />
        <Leo x={780} y={1380} s={0.85} t={uu + 1} mood={k > 0 ? 'wow' : 'happy'} hoodie="#4cc9f0" flip jump={k * Math.abs(Math.sin(uu * 7)) * 0.3} />
        <Bubble x={540} y={850} w={900} h={200} tail={[-170, 160]} k={k}>
          <Txt x={0} y={20} s={zh ? 60 : 52} c={INK}>{L.line}</Txt>
        </Bubble>
        {k > 0 ? [...Array(8)].map((_, j) => <path key={j} d="M0 -30 L8 -8 L30 0 L8 8 L0 30 L-8 8 L-30 0 L-8 -8 Z" fill={Y} transform={`translate(${700 + Math.cos(j) * 220} ${1100 + Math.sin(j * 2) * 120}) scale(${0.6 + 0.4 * Math.sin(uu * 6 + j)})`} />) : null}
      </>,
    );
  }
  const k = outBack(clamp(uu / 0.5));
  return svg(
    <>
      <g transform={`translate(640 1150) scale(${k})`}>
        <rect x={-170} y={-300} width={340} height={600} rx={50} fill={INK} stroke={W} strokeWidth={10} />
        <rect x={-140} y={-260} width={280} height={520} rx={30} fill={Y} />
        <path d="M-60 40 L60 -40 M60 -40 L20 -50 M60 -40 L52 0" stroke={INK} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${Math.sin(uu * 4) * 8})`} />
        <Txt x={0} y={170} s={48} c={INK}>{L.share}</Txt>
      </g>
      <Leo x={260} y={1560} s={0.8} t={uu} mood="wow" jump={Math.abs(Math.sin(uu * 6)) * 0.5} />
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
  const S: {at: number; f: string; v: number}[] = [{at: 0.05, f: 'boom', v: 0.3}, {at: 0.9, f: 'whip', v: 0.3}, {at: 1.5, f: 'chime', v: 0.3}, {at: 1.5, f: 'pop', v: 0.4}];
  const A = (bi: number, sub: string, fb: number) => B[bi].start + say(B, bi, sub, fb);
  S.push({at: A(1, zh ? '一只猫' : 'cat', 1), f: 'pop', v: 0.35}, {at: A(1, zh ? '纸巾' : 'tissue', 3), f: 'whip', v: 0.3}, {at: A(1, zh ? '真棒' : 'good', 4), f: 'ding', v: 0.35}, {at: A(1, zh ? '笑出' : 'laughs', 5), f: 'pop', v: 0.3});
  S.push({at: B[2].start + 0.3, f: 'pop', v: 0.35}, {at: A(2, zh ? '拿到钱' : 'money', 3), f: 'pop', v: 0.35}, {at: A(2, zh ? '拿到钱' : 'money', 3) + 0.2, f: 'chime', v: 0.3});
  for (let k = 0; k < 6; k++) S.push({at: A(2, zh ? '拿到钱' : 'money', 3) + 0.4 + k * 0.18, f: 'tick', v: 0.3});
  S.push({at: A(3, zh ? '你今天' : 'were', 2), f: 'pop', v: 0.4}, {at: A(3, zh ? '我先夸' : 'first', B[3].dur - 1), f: 'ding', v: 0.3});
  for (let k = 0; k < 8; k++) S.push({at: B[4].start + k * 0.25, f: 'click', v: 0.9});
  S.push({at: A(4, zh ? '学完' : 'praised', 1.5), f: 'ding', v: 0.3}, {at: A(4, zh ? '第二天' : 'next', 3.5), f: 'rswoosh', v: 0.35}, {at: A(4, zh ? '第二天' : 'next', 3.5) + 0.5, f: 'chime', v: 0.25});
  S.push({at: B[5].start + 0.8, f: 'pop', v: 0.4}, {at: B[5].start + 1.1, f: 'chime', v: 0.25});
  S.push({at: B[6].start + 0.05, f: 'pop', v: 0.4});
  return S;
};

export const Praise: React.FC<{lang: 'en' | 'zh'}> = ({lang}) => {
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
      <Audio src={staticFile(`praise/${lang}-voice.wav`)} />
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
