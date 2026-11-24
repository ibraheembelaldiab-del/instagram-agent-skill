import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFont} from './Cards';
import ZH2 from './ep2b-zh.json';
import ENV2 from './ep2b-zh-env.json';

// 脑子说明书 Episode 2 「人越多，越没人帮？」 — full episode, Chinese, 16:9.
// Original cast on the painted two-point-perspective lobby (Canva AI background): depth staging (scale by floor
// depth + floor shadows), staggered neighbour reactions, the orange greedy old cat 主子 who only watches at first,
// CosyVoice2 voices (deep 东北 王阿姨), recorded CC0 sound effects, captions with speaker tags, two cutaways
// for the studies: Darley & Latané 1968 (85% vs 31%) and Moriarty 1975 (20% vs 95%).

const INK = '#16121c';
const W = '#ffffff';
const Y = '#ffd23f';
const SKIN = '#f6c9a0';
const SKIN2 = '#e0a97c';
const F = '"Noto Sans SC", sans-serif';
const FLOOR = 960; // front row feet
const BACK = 880; // back row feet

// ---------- helpers ----------
const cl = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
const seg = (t: number, a: number, b: number) => ease(cl((t - a) / (b - a)));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const back = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (cl(x) - 1) ** 3 + c1 * (cl(x) - 1) ** 2;
};
const sd = (rad: number) => Math.sin((rad * Math.PI) / 180);
const cd = (rad: number) => Math.cos((rad * Math.PI) / 180);

type Pose = {la1: number; la2: number; ra1: number; ra2: number; ll1: number; ll2: number; rl1: number; rl2: number; tilt: number; hy: number; rot: number; head: number};
const P0: Pose = {la1: -8, la2: 6, ra1: 8, ra2: -6, ll1: -4, ll2: 0, rl1: 4, rl2: 0, tilt: 0, hy: 0, rot: 0, head: 0};
const mix = (a: Pose, b: Pose, k: number): Pose => {
  const o = {...a};
  (Object.keys(a) as (keyof Pose)[]).forEach((key) => (o[key] = lerp(a[key], b[key], k)));
  return o;
};
const pose = (p: Partial<Pose>): Pose => ({...P0, ...p});
// keyframed pose track: [[time, pose], ...] eased between keys
const track = (t: number, keys: [number, Pose][]): Pose => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let k = 0; k < keys.length - 1; k++) {
    const [t0, p0] = keys[k];
    const [t1, p1] = keys[k + 1];
    if (t <= t1) return mix(p0, p1, ease(cl((t - t0) / Math.max(t1 - t0, 1e-3))));
  }
  return keys[keys.length - 1][1];
};
const walk = (t: number, amp = 26, hz = 2.4): Partial<Pose> => {
  const f = t * hz * Math.PI * 2;
  return {ll1: amp * Math.sin(f), ll2: -18 - 14 * Math.cos(f), rl1: -amp * Math.sin(f), rl2: -18 + 14 * Math.cos(f), la1: -amp * 0.8 * Math.sin(f), la2: 14, ra1: amp * 0.8 * Math.sin(f), ra2: 14, hy: -7 * Math.abs(Math.cos(f))};
};
const talkArms = (t: number, g: number): Partial<Pose> => ({
  ra1: 18 + 40 * g + 6 * Math.sin(t * 3), ra2: -30 - 60 * g * (0.6 + 0.4 * Math.sin(t * 7)),
  la1: -12 - 22 * g * (0.5 + 0.5 * Math.sin(t * 5 + 1)), la2: 20 + 35 * g,
});

// ---------- puppet ----------
const Limb: React.FC<{x: number; y: number; a1: number; a2: number; l1: number; l2: number; w: number; c: string; end: string; er: number; foot?: boolean}> = ({x, y, a1, a2, l1, l2, w, c, end, er, foot}) => {
  const p1 = [x + l1 * sd(a1), y + l1 * cd(a1)];
  const p2 = [p1[0] + l2 * sd(a1 + a2), p1[1] + l2 * cd(a1 + a2)];
  const d = `M${x} ${y} L${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]}`;
  return (
    <g>
      <path d={d} stroke={INK} strokeWidth={w + 12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {foot ? (
        <ellipse cx={p2[0] + 14} cy={p2[1] + 6} rx={30} ry={15} fill={INK} transform={`rotate(${-(a1 + a2) * 0.3} ${p2[0]} ${p2[1]})`} />
      ) : (
        <circle cx={p2[0]} cy={p2[1]} r={er} fill={end} stroke={INK} strokeWidth={6} />
      )}
    </g>
  );
};
type Look = {torso: string; torso2: string; sleeve: string; pants: string; head: (t: number, talk: number, mood: Mood, look: number) => React.ReactNode; extra?: React.ReactNode; hand?: React.ReactNode};
const Puppet: React.FC<{x: number; y: number; s?: number; face?: number; p: Pose; look: Look; t: number; talk?: number; mood?: Mood; eyes?: number}> = ({x, y, s = 1, face = 1, p, look, t, talk = 0, mood = 'normal', eyes = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s * face} ${s})`}>
    <g transform={`rotate(${p.rot} 0 150) translate(0 ${p.hy})`}>
      <Limb x={-32} y={0} a1={p.ll1} a2={p.ll2} l1={78} l2={74} w={38} c={look.pants} end={INK} er={0} foot />
      <Limb x={32} y={0} a1={p.rl1} a2={p.rl2} l1={78} l2={74} w={38} c={look.pants} end={INK} er={0} foot />
      <g transform={`rotate(${p.tilt} 0 0)`}>
        <path d="M-72 18 L-80 -128 Q0 -160 80 -128 L72 18 Z" fill={look.torso} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <path d="M30 -150 Q80 -128 72 18 L36 18 Z" fill={look.torso2} />
        {look.extra}
        <Limb x={-62} y={-128} a1={p.la1} a2={p.la2} l1={78} l2={72} w={30} c={look.sleeve} end={SKIN} er={19} />
        <g>
          <Limb x={62} y={-128} a1={p.ra1} a2={p.ra2} l1={78} l2={72} w={30} c={look.sleeve} end={SKIN} er={19} />
          {look.hand ? (
            <g transform={`translate(${62 + 78 * sd(p.ra1) + 72 * sd(p.ra1 + p.ra2)} ${-128 + 78 * cd(p.ra1) + 72 * cd(p.ra1 + p.ra2)}) rotate(${-(p.ra1 + p.ra2) + 180})`}>{look.hand}</g>
          ) : null}
        </g>
        <g transform={`translate(0 -250) rotate(${p.head})`}>{look.head(t, talk, mood, eyes * face)}</g>
      </g>
    </g>
  </g>
);

// ---------- faces ----------
type Mood = 'normal' | 'angry' | 'happy' | 'shock' | 'smug' | 'think' | 'bored' | 'dizzy';
const Eyes: React.FC<{t: number; mood: Mood; look?: number; r?: number; gap?: number; lookY?: number}> = ({t, mood, look = 0, r = 38, gap = 36, lookY = 0}) => {
  const blink = (t % 3.7) < 0.12 && mood !== 'shock' ? 1 : 0;
  const pr = mood === 'shock' ? 5 : 8;
  return (
    <g>
      {[-1, 1].map((s) => (
        <g key={s}>
          <ellipse cx={s * gap} cy={0} rx={r} ry={blink ? 4 : r * (mood === 'shock' ? 1.2 : 1.05)} fill={W} stroke={INK} strokeWidth={6} />
          {mood === 'dizzy' ? (
            <path d={`M${s * gap - 14} -14 l28 28 M${s * gap + 14} -14 l-28 28`} stroke={INK} strokeWidth={7} strokeLinecap="round" />
          ) : !blink ? (
            <circle cx={s * gap + look * 12} cy={lookY * 12 + (mood === 'think' ? -10 : 2)} r={pr} fill={INK} />
          ) : null}
          {mood === 'angry' ? <path d={`M${s * gap - 40 * s} -50 L${s * gap + 28 * s} -30`} stroke={INK} strokeWidth={10} strokeLinecap="round" /> : null}
          {mood === 'bored' || mood === 'smug' ? <path d={`M${s * gap - r - 2} -4 h${2 * r + 4}`} stroke={INK} strokeWidth={6} /> : null}
          {mood === 'bored' || mood === 'smug' ? <rect x={s * gap - r - 3} y={-r * 1.1 - 4} width={2 * r + 6} height={r * 1.1} fill={SKIN} /> : null}
        </g>
      ))}
    </g>
  );
};
const Mouth: React.FC<{open: number; mood: Mood; w?: number}> = ({open, mood, w = 60}) => {
  if (mood === 'shock' || mood === 'dizzy') return <ellipse cx={0} cy={4} rx={16 + open * 8} ry={22 + open * 12} fill="#5c1a1a" stroke={INK} strokeWidth={6} />;
  if (open > 0.12) {
    const h = 12 + open * 30;
    return (
      <g>
        <path d={`M${-w / 2} 0 Q0 ${h * 2} ${w / 2} 0 Z`} fill="#5c1a1a" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M${-w / 5} ${h * 0.9} Q0 ${h * 0.5} ${w / 5} ${h * 0.9}`} fill="#e76f6f" />
      </g>
    );
  }
  if (mood === 'angry') return <path d={`M${-w / 2} 10 Q0 -12 ${w / 2} 10`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />;
  if (mood === 'happy' || mood === 'smug') return <path d={`M${-w / 2} -4 Q0 26 ${w / 2} -4`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />;
  return <path d={`M${-w / 3} 4 h${(w * 2) / 3}`} stroke={INK} strokeWidth={7} strokeLinecap="round" />;
};

const JAY: Look = {
  torso: '#3a9d5d', torso2: '#2c7a48', sleeve: '#3a9d5d', pants: '#3d5a80',
  extra: <path d="M-30 -60 h60 v40 h-60 Z" fill="#2c7a48" stroke={INK} strokeWidth={5} />,
  head: (t, talk, mood, look) => (
    <g>
      <path d="M-120 -10 Q-125 -145 0 -152 Q125 -145 120 -10 Q116 106 0 114 Q-116 106 -120 -10 Z" fill={SKIN} stroke={INK} strokeWidth={8} />
      <path d="M58 -136 Q125 -96 117 10 Q113 86 38 108 Q96 40 58 -136 Z" fill={SKIN2} />
      <path d="M-130 -58 L-116 -126 L-92 -106 L-78 -170 L-44 -130 L-20 -184 L10 -136 L40 -178 L58 -130 L92 -158 L102 -106 L130 -116 L120 -52 Q60 -116 0 -106 Q-68 -106 -130 -58 Z" fill="#2b2118" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <g transform="translate(0 -20)"><Eyes t={t} mood={mood} look={look} /></g>
      <path d="M-6 18 q14 18 -4 26" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
      <g transform="translate(0 66)"><Mouth open={talk} mood={mood} /></g>
    </g>
  ),
};
const Headphones: React.FC = () => (
  <g>
    <path d="M-128 -20 Q-130 -175 0 -178 Q130 -175 128 -20" stroke={INK} strokeWidth={14} fill="none" />
    <rect x={-150} y={-50} width={40} height={74} rx={16} fill="#e63946" stroke={INK} strokeWidth={6} />
    <rect x={110} y={-50} width={40} height={74} rx={16} fill="#e63946" stroke={INK} strokeWidth={6} />
  </g>
);
const AUNTIE: Look = {
  torso: '#ff8fab', torso2: '#e56b8a', sleeve: '#ff8fab', pants: '#6d597a',
  extra: <><circle cx={0} cy={-90} r={6} fill={W} stroke={INK} strokeWidth={3} /><circle cx={0} cy={-55} r={6} fill={W} stroke={INK} strokeWidth={3} /><circle cx={0} cy={-20} r={6} fill={W} stroke={INK} strokeWidth={3} /></>,
  head: (t, talk, mood, look) => (
    <g>
      {[...Array(10)].map((_, k) => <circle key={k} cx={-125 + k * 28} cy={-118 - Math.sin(k * 1.3) * 22} r={44} fill="#9d4edd" stroke={INK} strokeWidth={6} />)}
      <path d="M-115 -10 Q-120 -128 0 -132 Q120 -128 115 -10 Q110 100 0 108 Q-110 100 -115 -10 Z" fill={SKIN} stroke={INK} strokeWidth={8} />
      <path d="M55 -118 Q118 -80 110 10 Q104 84 36 102 Q92 36 55 -118 Z" fill={SKIN2} />
      {[-1, 1].map((s) => <circle key={s} cx={s * 108} cy={-58} r={38} fill="#9d4edd" stroke={INK} strokeWidth={6} />)}
      <g transform="translate(0 -18)"><Eyes t={t + 0.9} mood={mood} look={look} r={32} gap={40} /></g>
      <circle cx={-40} cy={-18} r={44} fill="none" stroke={INK} strokeWidth={6} />
      <circle cx={40} cy={-18} r={44} fill="none" stroke={INK} strokeWidth={6} />
      <path d="M-4 -18 h8" stroke={INK} strokeWidth={6} />
      <g transform="translate(0 66)"><Mouth open={talk} mood={mood} w={54} /></g>
      <path d="M-62 80 q14 10 28 0 M34 80 q14 10 28 0" stroke="#e5989b" strokeWidth={6} fill="none" opacity={0.7} />
    </g>
  ),
};
const neighbour = (torso: string, pants: string, hair: (t: number) => React.ReactNode, extra?: React.ReactNode, skin = SKIN): Look => ({
  torso, torso2: 'rgba(0,0,0,0.12)', sleeve: torso, pants, extra,
  head: (t, talk, mood, look) => (
    <g>
      <path d="M-112 -10 Q-116 -132 0 -138 Q116 -132 112 -10 Q108 100 0 108 Q-108 100 -112 -10 Z" fill={skin} stroke={INK} strokeWidth={8} />
      {hair(t)}
      <g transform="translate(0 -18)"><Eyes t={t} mood={mood} look={look} r={32} gap={34} /></g>
      <g transform="translate(0 64)"><Mouth open={talk} mood={mood} w={48} /></g>
    </g>
  ),
});
const N1 = neighbour('#f1faee', '#264653', () => <path d="M-112 -60 Q-100 -150 0 -150 Q100 -150 112 -60 Q40 -120 -112 -60 Z" fill="#3d2c1e" stroke={INK} strokeWidth={6} />, <path d="M-10 -128 L10 -128 L16 -20 L0 0 L-16 -20 Z" fill="#1d4e89" stroke={INK} strokeWidth={4} />);
const N2 = neighbour('#2ec4b6', '#3a3a5a', () => <><path d="M-118 -40 Q-120 -160 0 -158 Q120 -160 118 -40 L118 60 Q100 -90 0 -110 Q-100 -90 -118 60 Z" fill="#111" stroke={INK} strokeWidth={6} /><circle cx={70} cy={-150} r={34} fill="#111" stroke={INK} strokeWidth={6} /></>);
const N3 = neighbour('#8d99ae', '#5c5470', () => <><path d="M-112 -40 Q-118 -90 -90 -100 M112 -40 Q118 -90 90 -100" stroke="#ddd" strokeWidth={22} strokeLinecap="round" /><path d="M-70 -40 h50 M20 -40 h50" stroke="#ddd" strokeWidth={10} strokeLinecap="round" /></>);
const N4 = neighbour('#f77f00', '#2b2d42', () => <path d="M-125 -30 Q-125 -175 0 -178 Q125 -175 125 -30 L150 -24 L-150 -24 Z" fill="#ff9f1c" stroke={INK} strokeWidth={7} />);

// ---------- props ----------
const Orange: React.FC<{x: number; y: number; r?: number; a?: number}> = ({x, y, r = 24, a = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${a})`}>
    <circle r={r} fill="#ff8c1a" stroke={INK} strokeWidth={5} />
    <path d={`M-6 ${-r + 6} q6 -10 14 -4`} stroke="#2b9348" strokeWidth={6} fill="none" strokeLinecap="round" />
    <circle cx={-r * 0.35} cy={-r * 0.35} r={r * 0.2} fill="#ffc078" />
  </g>
);
const Fish: React.FC<{x: number; y: number; s?: number; a?: number}> = ({x, y, s = 1, a = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`}>
    <path d="M-60 0 Q-20 -34 34 0 Q-20 34 -60 0 Z" fill="#9db4c0" stroke={INK} strokeWidth={6} />
    <path d="M30 0 L66 -24 L60 0 L66 24 Z" fill="#9db4c0" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <circle cx={-38} cy={-6} r={6} fill={INK} />
  </g>
);
const Onion: React.FC = () => (
  <g transform="translate(0 0) rotate(0)">
    <path d="M-10 0 L-14 -170 L-4 -220 L4 -170 L10 0 Z" fill="#7bc96f" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-12 -160 L-40 -260 M0 -170 L6 -280 M10 -160 L44 -250" stroke="#55a630" strokeWidth={14} strokeLinecap="round" />
    <path d="M-16 0 Q0 46 16 0 Z" fill={W} stroke={INK} strokeWidth={6} />
  </g>
);
const Bag: React.FC<{torn: number}> = ({torn}) => (
  <g>
    <path d="M-60 -10 L60 -10 L70 130 L-70 130 Z" fill={W} stroke={INK} strokeWidth={6} />
    {[0, 1, 2, 3].map((k) => <rect key={k} x={-65} y={10 + k * 30} width={130} height={14} fill={k % 2 ? '#e63946' : '#1d4e89'} opacity={0.85} />)}
    <path d="M-40 -10 Q0 -70 40 -10" stroke={INK} strokeWidth={8} fill="none" />
    {torn > 0 ? <path d="M-70 130 l20 -20 l15 20 l18 -24 l16 22 l20 -22 l14 18 l17 -16 L70 130 Z" fill="#f4efe6" stroke={INK} strokeWidth={5} /> : null}
  </g>
);

// ---------- cat 主子 ----------
const Cat: React.FC<{x: number; y: number; s?: number; t: number; mode: 'peek' | 'sneak' | 'wiggle' | 'scared' | 'cling'; face?: number; look?: number}> = ({x, y, s = 1, t, mode, face = 1, look = 0}) => {
  const grey = '#9aa0a6';
  const head = (eyesWide: boolean) => (
    <g>
      <path d="M-70 -40 L-60 -112 L-18 -72 Z M70 -40 L60 -112 L18 -72 Z" fill={grey} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d="M-58 -50 L-54 -94 L-30 -70 Z M58 -50 L54 -94 L30 -70 Z" fill="#ffb4c2" />
      <ellipse cx={0} cy={-20} rx={86} ry={70} fill={grey} stroke={INK} strokeWidth={7} />
      <ellipse cx={0} cy={12} rx={40} ry={28} fill={W} />
      {eyesWide ? (
        <>
          <circle cx={-32} cy={-28} r={22} fill={W} stroke={INK} strokeWidth={5} />
          <circle cx={32} cy={-28} r={22} fill={W} stroke={INK} strokeWidth={5} />
          <circle cx={-32} cy={-28} r={5} fill={INK} />
          <circle cx={32} cy={-28} r={5} fill={INK} />
        </>
      ) : (
        <>
          <ellipse cx={-32} cy={-26} rx={20} ry={16} fill="#c9f2a2" stroke={INK} strokeWidth={5} />
          <ellipse cx={32} cy={-26} rx={20} ry={16} fill="#c9f2a2" stroke={INK} strokeWidth={5} />
          <ellipse cx={-32 + look * 8} cy={-24} rx={4} ry={11} fill={INK} />
          <ellipse cx={32 + look * 8} cy={-24} rx={4} ry={11} fill={INK} />
          <path d="M-54 -36 h44 M10 -36 h44" stroke={INK} strokeWidth={6} />
          <rect x={-55} y={-46} width={46} height={10} fill={grey} />
          <rect x={9} y={-46} width={46} height={10} fill={grey} />
        </>
      )}
      <path d="M-6 2 h12 l-6 8 z" fill="#ff8fa3" />
      <path d="M0 10 q-12 12 -22 4 M0 10 q12 12 22 4" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M-46 4 h-56 M-46 16 h-52 M46 4 h56 M46 16 h52" stroke={INK} strokeWidth={4} />
    </g>
  );
  if (mode === 'peek') return <g transform={`translate(${x} ${y}) scale(${s * face} ${s})`}>{head(false)}</g>;
  if (mode === 'scared' || mode === 'cling') {
    const spikes = [...Array(22)].map((_, k) => {
      const a = (k / 22) * Math.PI * 2;
      const r = k % 2 ? 120 : 150;
      return `${Math.cos(a) * r * 1.15},${Math.sin(a) * r * 0.8 + 20}`;
    }).join(' ');
    const shake = Math.sin(t * 60) * 4;
    return (
      <g transform={`translate(${x + shake} ${y}) scale(${s})`}>
        <path d={`M100 40 Q190 ${-40 + Math.sin(t * 30) * 20} 170 -140`} stroke={INK} strokeWidth={40} fill="none" strokeLinecap="round" />
        <path d={`M100 40 Q190 ${-40 + Math.sin(t * 30) * 20} 170 -140`} stroke={grey} strokeWidth={28} fill="none" strokeLinecap="round" strokeDasharray="8 6" />
        <polygon points={spikes} fill={grey} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        {mode === 'cling' ? [-1, 1].map((q) => <path key={q} d={`M${q * 110} 60 l${q * 30} 40 M${q * 100} 70 l${q * 20} 46 M${q * 90} 76 l${q * 8} 48`} stroke={INK} strokeWidth={6} strokeLinecap="round" />) : null}
        <g transform="translate(0 -30)">{head(true)}</g>
      </g>
    );
  }
  // sneak / wiggle: low body, side view-ish
  const step = mode === 'sneak' ? Math.sin(t * 7) : 0;
  const wig = mode === 'wiggle' ? Math.sin(t * 22) * 10 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * face} ${s})`}>
      <path d={`M-120 -40 Q-200 ${-160 + step * 10} -150 -200`} stroke={INK} strokeWidth={34} fill="none" strokeLinecap="round" />
      <path d={`M-120 -40 Q-200 ${-160 + step * 10} -150 -200`} stroke={grey} strokeWidth={22} fill="none" strokeLinecap="round" />
      <g transform={`rotate(${wig} -100 -30)`}>
        <ellipse cx={-20} cy={-50} rx={130} ry={62} fill={grey} stroke={INK} strokeWidth={7} />
        <ellipse cx={-10} cy={-28} rx={80} ry={28} fill={W} />
      </g>
      {[-90, -50, 30, 70].map((lx, k) => <rect key={k} x={lx + (k % 2 ? step : -step) * 12} y={-10} width={26} height={30} rx={12} fill={grey} stroke={INK} strokeWidth={6} />)}
      <g transform="translate(110 -70) scale(0.85)">{head(false)}</g>
    </g>
  );
};

// ---------- brain ----------
const BrainGuy: React.FC<{x: number; y: number; s?: number; t: number; talk?: number; point?: boolean}> = ({x, y, s = 1, t, talk = 0, point}) => {
  const bob = Math.sin(t * 2.6) * 12;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`}>
      <path d={`M-150 40 Q-210 70 -230 ${120 - talk * 60}`} stroke={INK} strokeWidth={12} fill="none" strokeLinecap="round" />
      <path d={`M150 40 Q220 ${point ? -20 : 60} ${point ? 260 : 230} ${point ? -60 + Math.sin(t * 8) * 10 : 120}`} stroke={INK} strokeWidth={12} fill="none" strokeLinecap="round" />
      <path d="M-170 40 C-230 -60 -160 -170 -60 -165 C-30 -215 60 -215 90 -165 C190 -170 240 -60 175 40 C190 120 110 165 0 158 C-110 165 -190 120 -170 40 Z" fill="#ff9ebb" stroke={INK} strokeWidth={9} />
      <path d="M90 -160 C190 -150 230 -50 175 40 C190 120 110 165 40 158 C140 100 170 -40 90 -160 Z" fill="#f07a9c" />
      <path d="M-120 -90 q40 -30 70 10 M40 -130 q50 -10 70 40 M-150 30 q30 -40 70 -10 M110 80 q-30 -40 -70 -10" stroke="#d65d82" strokeWidth={8} fill="none" strokeLinecap="round" />
      <g transform="translate(0 -40)">
        {[-1, 1].map((q) => <g key={q}><ellipse cx={q * 46} cy={0} rx={42} ry={44} fill={W} stroke={INK} strokeWidth={6} /><circle cx={q * 46 - 6} cy={4} r={8} fill={INK} /><path d={`M${q * 46 - 42} -6 h84`} stroke={INK} strokeWidth={6} /><rect x={q * 46 - 44} y={-50} width={88} height={44} fill="#ff9ebb" /></g>)}
      </g>
      <g transform="translate(0 60)"><Mouth open={talk} mood="smug" w={70} /></g>
    </g>
  );
};

// ---------- Episode 2 full: depth staging on the painted two-point lobby ----------
type L2 = {id: string; who: 'jay' | 'auntie' | 'brain' | 'cat' | 'del'; say: string; start: number; dur: number; words: [string, number, number][]};
const LN = ZH2 as unknown as L2[];
const Ls = (id: string) => LN.find((l) => l.id === id)!.start;
const Le = (id: string) => {
  const l = LN.find((x) => x.id === id)!;
  return l.start + l.dur;
};
export const EP2B_FRAMES = Math.ceil((Le('22') + 1.6) * 30);

// depth: feet y on the painted floor -> scale
const sc = (fy: number) => 0.5 + ((fy - 700) / 340) * 0.5;
const Shadow: React.FC<{x: number; fy: number; s: number; w?: number}> = ({x, fy, s, w = 1}) => <ellipse cx={x} cy={fy + 4 * s} rx={95 * s * w} ry={17 * s} fill="rgba(40,30,20,0.28)" />;
const At: React.FC<{x: number; fy: number; s?: number; face?: number; p: Pose; look: Look; t: number; talk?: number; mood?: Mood; eyes?: number; shadow?: boolean}> = ({x, fy, s, face = 1, p, look, t, talk = 0, mood = 'normal', eyes = 0, shadow = true}) => {
  const k = s ?? sc(fy);
  return (
    <g>
      {shadow ? <Shadow x={x} fy={fy} s={k} w={p.rot ? 2.4 : 1} /> : null}
      <Puppet x={x} y={fy - 150 * k} s={k} face={face} p={p} look={look} t={t} talk={talk} mood={mood} eyes={eyes} />
    </g>
  );
};

// 主子: orange, greedy old tom cat (original design)
const OR = '#f4a24a';
const OR2 = '#d9822b';
const CatHead: React.FC<{t: number; wide?: boolean; grin?: number; look?: number; open?: number}> = ({t, wide, grin = 0, look = 0, open = 0}) => (
  <g>
    <path d="M-76 -38 L-66 -118 L-20 -78 Z M76 -38 L66 -118 L20 -78 Z" fill={OR} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M-62 -50 L-58 -98 L-32 -74 Z M62 -50 L58 -98 L32 -74 Z" fill="#ffb4a2" />
    <ellipse cx={0} cy={-18} rx={92} ry={74} fill={OR} stroke={INK} strokeWidth={7} />
    {[-30, 0, 30].map((x) => <path key={x} d={`M${x} -90 q${x * 0.1} 18 0 30`} stroke={OR2} strokeWidth={9} strokeLinecap="round" fill="none" />)}
    <ellipse cx={0} cy={18} rx={46} ry={30} fill="#fff4e6" />
    {wide ? (
      <>
        {[-1, 1].map((q) => <g key={q}><circle cx={q * 34} cy={-24} r={24} fill={W} stroke={INK} strokeWidth={5} /><circle cx={q * 34} cy={-24} r={6} fill={INK} /></g>)}
      </>
    ) : (
      <>
        {[-1, 1].map((q) => (
          <g key={q}>
            <ellipse cx={q * 34} cy={-22} rx={22} ry={17} fill="#d8f3a0" stroke={INK} strokeWidth={5} />
            <ellipse cx={q * 34 + look * 9} cy={-20} rx={4} ry={12} fill={INK} />
            <rect x={q * 34 - 24} y={-44} width={48} height={16 + 6 * Math.sin(t * 0.7) ** 8} fill={OR} />
            <path d={`M${q * 34 - 24} ${-28 + 6 * Math.sin(t * 0.7) ** 8} h48`} stroke={INK} strokeWidth={6} />
            {/* bushy old-man brows */}
            <path d={`M${q * 34 - 26} -50 q${q * 14} ${-12 - grin * 6} ${q * 30} -2`} stroke="#fff4e6" strokeWidth={10} fill="none" strokeLinecap="round" />
          </g>
        ))}
      </>
    )}
    <path d="M-7 6 h14 l-7 9 z" fill="#c9184a" />
    {open > 0.12 ? <ellipse cx={0} cy={30} rx={14} ry={6 + open * 12} fill="#5c1a1a" stroke={INK} strokeWidth={4} /> : <path d={`M0 15 q-14 ${12 + grin * 8} -28 ${2 - grin * 4} M0 15 q14 ${12 + grin * 8} 28 ${2 - grin * 4}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />}
    {/* droopy old-man whiskers */}
    <path d="M-44 10 q-40 4 -66 26 M-44 20 q-36 10 -58 36 M44 10 q40 4 66 26 M44 20 q36 10 58 36" stroke={INK} strokeWidth={4} fill="none" />
  </g>
);
const Cat2: React.FC<{x: number; y: number; s?: number; t: number; mode: 'sit' | 'scared' | 'cling' | 'sneak' | 'carry' | 'lounge'; face?: number; look?: number; grin?: number; talk?: number}> = ({x, y, s = 1, t, mode, face = 1, look = 0, grin = 0, talk = 0}) => {
  const tail = (sway: number) => (
    <>
      <path d={`M-100 10 Q-200 ${-60 + sway} -170 -150`} stroke={INK} strokeWidth={38} fill="none" strokeLinecap="round" />
      <path d={`M-100 10 Q-200 ${-60 + sway} -170 -150`} stroke={OR} strokeWidth={26} fill="none" strokeLinecap="round" />
      <path d={`M-178 -110 l18 -6 M-190 -70 l18 -2`} stroke={OR2} strokeWidth={8} strokeLinecap="round" />
    </>
  );
  if (mode === 'sit') {
    return (
      <g transform={`translate(${x} ${y}) scale(${s * face} ${s})`}>
        {tail(Math.sin(t * 1.6) * 30)}
        <ellipse cx={0} cy={20} rx={120} ry={105} fill={OR} stroke={INK} strokeWidth={7} />
        <ellipse cx={0} cy={40} rx={70} ry={70} fill="#fff4e6" />
        {[-40, 40].map((px) => <ellipse key={px} cx={px} cy={118} rx={34} ry={18} fill={OR} stroke={INK} strokeWidth={6} />)}
        <g transform="translate(0 -110)"><CatHead t={t} look={look} grin={grin} open={talk} /></g>
      </g>
    );
  }
  if (mode === 'scared' || mode === 'cling') {
    const spikes = [...Array(22)].map((_, k) => {
      const a = (k / 22) * Math.PI * 2;
      const r = k % 2 ? 112 : 142;
      return `${Math.cos(a) * r * 1.15},${Math.sin(a) * r * 0.8 + 20}`;
    }).join(' ');
    return (
      <g transform={`translate(${x + Math.sin(t * 60) * 3} ${y}) scale(${s})`}>
        <polygon points={spikes} fill={OR} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        {mode === 'cling' ? [-1, 1].map((q) => <path key={q} d={`M${q * 100} 70 l${q * 26} 42 M${q * 86} 78 l${q * 14} 46`} stroke={INK} strokeWidth={6} strokeLinecap="round" />) : null}
        <g transform="translate(0 -24)"><CatHead t={t} wide /></g>
      </g>
    );
  }
  if (mode === 'lounge') {
    return (
      <g transform={`translate(${x} ${y}) scale(${s * face} ${s})`}>
        {tail(Math.sin(t * 1.2) * 20)}
        <ellipse cx={-10} cy={0} rx={150} ry={52} fill={OR} stroke={INK} strokeWidth={7} />
        <ellipse cx={10} cy={14} rx={90} ry={24} fill="#fff4e6" />
        <g transform="translate(130 -50) scale(0.85)"><CatHead t={t} look={-0.5} grin={0.6} open={talk} /></g>
      </g>
    );
  }
  // sneak / carry: low walk
  const step = Math.sin(t * (mode === 'sneak' ? 6 : 9));
  return (
    <g transform={`translate(${x} ${y}) scale(${s * face} ${s})`}>
      {tail(step * 12)}
      <ellipse cx={-10} cy={-40} rx={135} ry={60} fill={OR} stroke={INK} strokeWidth={7} />
      {[-90, -50, 30, 70].map((lx, k) => <rect key={k} x={lx + (k % 2 ? step : -step) * 12} y={0} width={28} height={30} rx={12} fill={OR} stroke={INK} strokeWidth={6} />)}
      <g transform={`translate(118 ${mode === 'sneak' ? -40 : -70}) scale(0.85)`}><CatHead t={t} look={1} grin={mode === 'carry' ? 1 : 0.5} open={talk} /></g>
      {mode === 'carry' ? <g transform="translate(150 -20) rotate(10)"><Fish x={0} y={0} s={0.8} /></g> : null}
    </g>
  );
};

// ---------- cutaways ----------
const Booth: React.FC<{x: number; y: number; s?: number; alone?: boolean}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-90} y={-170} width={180} height={230} rx={8} fill="#cdb38b" stroke={INK} strokeWidth={6} />
    <circle cx={0} cy={-70} r={42} fill={SKIN} stroke={INK} strokeWidth={6} />
    <path d="M-44 -80 q44 -70 88 0" stroke={INK} strokeWidth={8} fill="none" />
    <rect x={-56} y={-90} width={16} height={30} rx={6} fill={INK} />
    <rect x={40} y={-90} width={16} height={30} rx={6} fill={INK} />
    <path d="M-30 -20 q30 30 60 0 v80 h-60 Z" fill="#6c757d" stroke={INK} strokeWidth={5} />
  </g>
);
const Bar: React.FC<{x: number; y: number; v: number; k: number; c: string; label: string}> = ({x, y, v, k, c, label}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-70} y={-330} width={140} height={330} rx={12} fill="rgba(0,0,0,0.12)" stroke={INK} strokeWidth={5} />
    <rect x={-70} y={-330 * v * k} width={140} height={330 * v * k} rx={12} fill={c} stroke={INK} strokeWidth={5} />
    <text x={0} y={-330 * v * k - 20} textAnchor="middle" fontSize={64} fontWeight={900} fontFamily={F} fill={INK} opacity={k}>{`${Math.round(v * 100 * k)}%`}</text>
    <text x={0} y={60} textAnchor="middle" fontSize={40} fontWeight={900} fontFamily={F} fill={INK}>{label}</text>
  </g>
);
const Cut1: React.FC<{t: number}> = ({t}) => {
  const a = seg(t, Ls('09') + 0.6, Ls('09') + 1.8);
  const b = seg(t, Ls('10') + 0.8, Ls('10') + 2.0);
  return (
    <g style={{filter: 'sepia(0.7) contrast(1.05)'}}>
      <rect x={0} y={0} width={1920} height={1080} fill="#efe1c6" />
      <text x={960} y={120} textAnchor="middle" fontSize={64} fontWeight={900} fontFamily={F} fill={INK}>1968 · 对讲机实验</text>
      <line x1={960} y1={180} x2={960} y2={1000} stroke={INK} strokeWidth={4} strokeDasharray="20 14" />
      <Booth x={330} y={640} />
      <text x={330} y={780} textAnchor="middle" fontSize={44} fontWeight={900} fontFamily={F} fill={INK}>只有我听见</text>
      <Bar x={700} y={860} v={0.85} k={a} c="#52b788" label="出手帮忙" />
      {[0, 1, 2, 3, 4].map((k) => <Booth key={k} x={1120 + (k % 3) * 150} y={520 + Math.floor(k / 3) * 250} s={0.6} />)}
      <text x={1270} y={890} textAnchor="middle" fontSize={44} fontWeight={900} fontFamily={F} fill={INK}>还有4个人听见</text>
      <Bar x={1700} y={860} v={0.31} k={b} c="#e63946" label="出手帮忙" />
      {[...Array(24)].map((_, k) => <rect key={k} x={(k * 97 + Math.floor(t * 24) * 53) % 1920} y={(k * 211) % 1080} width={3} height={50} fill="#5e503f" opacity={0.2} />)}
    </g>
  );
};
const Cut2: React.FC<{t: number}> = ({t}) => {
  const a = seg(t, Ls('15') + 1.2, Ls('15') + 2.4);
  const b = seg(t, Ls('16') + 1.0, Ls('16') + 2.2);
  const thief = cl((t - Ls('15')) / 2.5);
  return (
    <g>
      <rect x={0} y={0} width={1920} height={460} fill="#8ecae6" />
      <rect x={0} y={380} width={1920} height={120} fill="#219ebc" />
      {[0, 1, 2, 3, 4, 5].map((k) => <path key={k} d={`M${k * 340 + ((t * 40) % 340) - 340} 420 q85 -24 170 0 t170 0`} stroke={W} strokeWidth={6} fill="none" />)}
      <rect x={0} y={480} width={1920} height={600} fill="#f4d58d" />
      <circle cx={1700} cy={140} r={70} fill="#ffd166" />
      <text x={960} y={120} textAnchor="middle" fontSize={64} fontWeight={900} fontFamily={F} fill={INK}>海滩实验</text>
      <g transform="translate(420 700)">
        <rect x={-180} y={-40} width={360} height={150} rx={10} fill="#e76f51" stroke={INK} strokeWidth={6} transform="skewX(-20)" />
        <g transform={`translate(${-20 + thief * 260} ${-30 - thief * 40})`}>
          <rect x={-50} y={-40} width={100} height={64} rx={10} fill="#6c757d" stroke={INK} strokeWidth={6} />
          <circle cx={-18} cy={-8} r={16} fill={INK} />
          <rect x={10} y={-26} width={30} height={10} fill={INK} />
        </g>
        <g transform={`translate(${200 + thief * 220} -40)`}>
          <circle cx={0} cy={-120} r={46} fill="#2b2d42" stroke={INK} strokeWidth={6} />
          <rect x={-40} y={-140} width={80} height={22} fill={W} />
          <circle cx={-16} cy={-129} r={7} fill={INK} />
          <circle cx={16} cy={-129} r={7} fill={INK} />
          <path d="M-50 -70 h100 v140 h-100 Z" fill="#2b2d42" stroke={INK} strokeWidth={6} />
        </g>
      </g>
      <Bar x={1250} y={880} v={0.2} k={a} c="#e63946" label="没人拜托" />
      <Bar x={1620} y={880} v={0.95} k={b} c="#52b788" label="拜托了某个人" />
    </g>
  );
};

// ---------- timeline ----------
const AX0 = 900;
const AFY0 = 965;
const RIP = 1.6;
const FISH2 = {x: 1390, y: 985};
const ORS = [...Array(12)].map((_, k) => ({vx: -320 + ((k * 151) % 820), vy: -640 + ((k * 47) % 300), fl: 975 + (k % 4) * 22}));
const orangeAt2 = (k: number, t: number, picked: number) => {
  if (t < RIP) return null;
  const o = ORS[k];
  if (k === 0) {
    const kk = cl((t - RIP) / 2.2);
    return {x: lerp(AX0 - 60, 1320, 1 - (1 - kk) ** 2), y: kk < 0.3 ? 840 - Math.sin((kk / 0.3) * Math.PI) * 160 : 800, a: kk * 900, r: 18};
  }
  let x = AX0 - 60;
  let y = 840;
  let vx = o.vx;
  let vy = o.vy;
  const dt = 1 / 100;
  for (let s = RIP; s < t; s += dt) {
    vy += 1800 * dt;
    x += vx * dt;
    y += vy * dt;
    if (y > o.fl) {
      y = o.fl;
      vy = -vy * 0.4;
      vx *= 0.8;
      if (Math.abs(vy) < 50) vy = 0;
    }
    if (vy === 0) vx *= 0.985;
    if (x < 80 || x > 1840) vx = -vx * 0.6;
  }
  if (picked > 0 && k <= Math.floor(picked * 12)) return null;
  return {x, y, a: x * 2, r: 22 + (k % 3) * 3};
};
const ZOOMS2 = () => [
  {a: Le('01') + 0.3, b: Ls('02') - 0.1, z: 1.55, cx: 560, cy: 560},
  {a: Ls('04') - 0.1, b: Le('04') + 0.2, z: 1.6, cx: 830, cy: 520},
  {a: Ls('17') + 0.9, b: Le('18') + 0.4, z: 1.6, cx: 640, cy: 560},
];
const camAt2 = (t: number) => {
  let z = 1;
  let cx = 960;
  let cy = 540;
  for (const q of ZOOMS2()) {
    const w = Math.min(seg(t, q.a, q.a + 0.5), 1 - seg(t, q.b - 0.5, q.b));
    if (w > 0) {
      z = lerp(1, q.z, w);
      cx = lerp(960, q.cx, w);
      cy = lerp(540, q.cy, w);
    }
  }
  const WH = Ls('04') - 0.9;
  const sh = t > WH && t < WH + 0.35 ? (1 - (t - WH) / 0.35) * 16 : 0;
  return {z, cx: cx + Math.sin(t * 90) * sh, cy: cy + Math.cos(t * 77) * sh};
};
const spk = (t: number, who: L2['who']) => LN.some((l) => l.who === who && t >= l.start && t <= l.start + l.dur);

const Stage2: React.FC<{t: number; amp: number}> = ({t, amp}) => {
  const talk = amp > 0.1 ? cl((amp - 0.1) * 2.2) : 0;
  const tk = (who: L2['who']) => (spk(t, who) ? talk : 0);
  const g = (who: L2['who']) => (spk(t, who) ? 0.5 + 0.5 * talk : 0);
  const JIN = Le('02') + 1.0;
  const JSTOP = JIN + 4.0;
  const ONION = Ls('04') - 2.4;
  const RUN0 = ONION + 0.6;
  const WH = Ls('04') - 0.9;
  const SIT = Ls('05') - 0.5;
  const POP = Le('06') + 0.25;
  const HELP = Le('18') + 0.2;
  const JX1 = 700;
  const JFY = 790;

  // ---- Auntie ----
  const enter = seg(t, 0.15, 1.4);
  const runK = seg(t, RUN0, WH);
  const backK = seg(t, Le('04') + 0.3, Le('04') + 1.6);
  const ax = t < RUN0 ? lerp(-160, AX0, enter) : t < Le('04') + 0.3 ? lerp(AX0, JX1 + 190, runK) : lerp(JX1 + 190, 1110, backK);
  const afy = t < RUN0 ? AFY0 : t < Le('04') + 0.3 ? lerp(AFY0, JFY + 10, runK) : lerp(JFY + 10, 945, backK);
  const swing = t < WH ? 0 : seg(t, WH, WH + 0.12);
  let ap: Pose;
  let amood: Mood = 'normal';
  let aface = 1;
  if (t < RIP) ap = pose({...walk(t, 24, 2.2), la1: -12, la2: -30});
  else if (t < Le('01') + 0.3) { ap = track(t, [[RIP, pose({})], [RIP + 0.2, pose({la1: -150, la2: -10, ra1: 150, ra2: 10, hy: -16})], [Le('01'), pose({la1: -120, la2: -60, ra1: 120, ra2: 60})]]); amood = 'shock'; }
  else if (t < Ls('02')) { ap = pose({la1: -150, la2: -80, ra1: 150, ra2: 80, head: Math.sin(t * 3) * 4}); amood = 'shock'; aface = -1; }
  else if (t < Le('02') + 0.2) { ap = pose({la1: -95, la2: 10 - 20 * g('auntie'), ra1: 95, ra2: -10 + 20 * g('auntie'), tilt: 3}); aface = -1; }
  else if (t < ONION) { ap = pose({la1: -35, la2: 120, ra1: 35, ra2: -120, ll1: -4 + Math.max(0, Math.sin(t * 10)) * -12}); amood = 'angry'; aface = -1; }
  else if (t < RUN0) { ap = track(t, [[ONION, pose({la1: -35, la2: 120, ra1: 35, ra2: -120})], [ONION + 0.3, pose({la1: -20, la2: 30, ra1: 165, ra2: 10, hy: -10})]]); amood = 'angry'; aface = -1; }
  else if (t < WH) { ap = pose({...walk(t, 44, 3.6), ra1: 165, ra2: 10, tilt: 10}); amood = 'angry'; aface = -1; }
  else if (t < Ls('04')) { ap = pose({la1: -40, la2: 20, ra1: lerp(165, 55, swing), ra2: 10, tilt: lerp(10, 18, swing)}); amood = 'angry'; aface = -1; }
  else if (t < Le('04') + 0.3) { ap = pose({la1: -35, la2: 120, ra1: 150, ra2: 20 + 16 * Math.sin(t * 18), tilt: 8, head: 4 * Math.sin(t * 9)}); amood = 'angry'; aface = -1; }
  else if (t < Le('04') + 1.6) { ap = pose({...walk(t, 22, 2.2)}); amood = 'angry'; aface = 1; }
  else if (t < POP) { ap = pose({la1: 40, la2: -115, ra1: -40, ra2: 115}); amood = 'angry'; aface = -1; }
  else if (t < Ls('13')) { ap = pose({la1: 40, la2: -115, ra1: -40, ra2: 115, head: -6}); amood = 'think'; aface = -1; }
  else if (t < Le('13') + 0.2) { ap = pose({la1: -30, la2: 110, ra1: 150, ra2: 20 + 20 * Math.sin(t * 10), tilt: 4}); amood = 'angry'; aface = -1; }
  else if (t < Ls('17')) { ap = pose({la1: 40, la2: -115, ra1: -40, ra2: 115}); amood = 'think'; aface = -1; }
  else if (t < Le('17') + 0.3) { ap = pose({ra1: 95, ra2: 0, la1: -30, la2: 110, tilt: -4}); amood = 'angry'; aface = -1; }
  else if (t < Ls('20')) { ap = pose({la1: -30, la2: 110, ra1: 30, ra2: -110}); amood = 'happy'; aface = -1; }
  else if (t < Ls('21')) { ap = pose({la1: -60, la2: -60, ra1: 60, ra2: 60, head: 12 * Math.sin(t * 5)}); amood = 'shock'; aface = Math.sin(t * 4) > 0 ? 1 : -1; }
  else { ap = pose({la1: -150, la2: -20, ra1: 150, ra2: 20, head: -10}); amood = 'shock'; aface = 1; }
  const holdOnion = (t >= ONION + 0.15 && t < Le('04') + 0.3) || (t >= Ls('13') && t < Le('13') + 0.2);
  const auntieLook: Look = {...AUNTIE, hand: holdOnion ? <g transform="rotate(180) translate(0 -10)"><Onion /></g> : undefined};

  // ---- Jay ----
  const wk = cl((t - JIN) / (JSTOP - JIN));
  const jx = lerp(2060, JX1, wk);
  const jfy = lerp(830, JFY, wk);
  const hopT = JIN + 2.6;
  const hop = t > hopT && t < hopT + 0.35 ? Math.sin(((t - hopT) / 0.35) * Math.PI) * 46 : 0;
  let jp: Pose;
  let jmood: Mood = 'happy';
  let jface = -1;
  const sitP = pose({hy: 140, ll1: -80, ll2: 10, rl1: 80, rl2: -10});
  if (t < JSTOP) { const wv = walk(t, 26, 2.2); jp = pose({...wv, head: 6 * Math.sin(t * 9), hy: (wv.hy ?? 0) - hop}); jmood = spk(t, 'jay') ? 'think' : 'happy'; }
  else if (t < WH) { jp = pose({ra1: 145, ra2: 12 + 12 * Math.max(0, Math.sin(t * 16)), la1: -10, head: 6 * Math.sin(t * 9)}); jmood = 'happy'; }
  else if (t < SIT) { jp = track(t, [[WH, pose({ra1: 145, ra2: 12})], [WH + 0.3, pose({rot: -72, la1: -120, la2: -20, ra1: 120, ra2: 20, ll1: -20, rl1: 30})], [SIT, pose({rot: -72, la1: -110, ra1: 100, ll1: -10, rl1: 20})]]); jmood = 'dizzy'; }
  else if (t < Ls('06')) { jp = track(t, [[SIT, pose({rot: -72})], [SIT + 0.35, {...sitP, ra1: 160, ra2: -80 + 18 * Math.sin(t * 16)}], [Ls('05') + 0.4, {...sitP, la1: -110, la2: -30, ra1: 110, ra2: 30}], [Le('05'), {...sitP, la1: -110, la2: -30, ra1: 110, ra2: 30}]]); jmood = t < Ls('05') ? 'dizzy' : 'normal'; }
  else if (t < POP) { jp = {...sitP, ra1: 150, ra2: -95 + 10 * Math.sin(t * 20), la1: -100 - 20 * talk, la2: -30}; jmood = 'angry'; }
  else if (t < POP + 0.6) { jp = {...sitP, la1: -130, la2: -30, ra1: 130, ra2: 30, rot: -8}; jmood = 'shock'; }
  else if (t < Ls('13')) { jp = {...sitP, ...talkArms(t, g('jay'))}; jmood = spk(t, 'jay') ? 'think' : 'normal'; jface = 1; }
  else if (t < Le('13') + 1.0) { jp = {...sitP, la1: -150, la2: -100, ra1: 150, ra2: 100}; jmood = 'shock'; }
  else { jp = {...sitP}; jmood = 'normal'; jface = 1; }

  // ---- neighbours (back-left, by the elevator) ----
  const NB = [
    {x: 300, fy: 772, look: N1, face: 1},
    {x: 470, fy: 760, look: N2, face: 1},
    {x: 600, fy: 742, look: N4, face: -1},
  ];
  const helpK = (k: number) => cl((t - HELP - (k === 2 ? 0 : k === 0 ? 1.2 : 1.8)) / 0.6);
  const nPose = (k: number): {p: Pose; mood: Mood; eyes: number; dx: number; dfy: number} => {
    const delays = [0.0, 0.5, 1.0];
    if (t > HELP) {
      const h = helpK(k);
      const bend = Math.abs(Math.sin((t - HELP) * 3 + k));
      return {p: pose({tilt: 35 * h * bend, ra1: 30 + 40 * h, ra2: -40, la1: -30 - 30 * h}), mood: 'happy', eyes: 0, dx: h * (AX0 - 300 - NB[k].x) * 0.7 + h * k * 60, dfy: h * (960 - NB[k].fy) * 0.8};
    }
    if (t > Ls('17') && k === 2) return {p: pose({ra1: 80 + 20 * talk, ra2: -150, la1: -10}), mood: 'shock', eyes: 1, dx: 0, dfy: 0};
    if (t > POP && t < POP + 3) return {p: pose({la1: -40, ra1: 40}), mood: 'shock', eyes: 0.6, dx: 0, dfy: 0};
    if (t > WH && t < WH + 3) return {p: pose({}), mood: 'shock', eyes: 1, dx: 0, dfy: 0};
    if (t > RIP + 0.3 + delays[k] && t < Ls('02') + 0.6 + delays[k]) return {p: pose({head: -4}), mood: 'normal', eyes: 1, dx: 0, dfy: 0};
    if (t >= Ls('02') + 0.6 + delays[k]) {
      if (k === 0) return {p: pose({ra1: 70, ra2: -110, head: 14}), mood: 'bored', eyes: 0, dx: 0, dfy: 0};
      if (k === 1) return {p: pose({ra1: 60, ra2: -140 + 10 * Math.sin(t * 4), head: -4}), mood: 'bored', eyes: 0, dx: 0, dfy: 0};
      return {p: pose({la1: -60, la2: 100, head: 10}), mood: 'bored', eyes: 0, dx: 0, dfy: 0};
    }
    return {p: pose({ra1: k === 0 ? 70 : 8, ra2: k === 0 ? -110 : -6, head: k === 0 ? 14 : 0}), mood: 'normal', eyes: 0, dx: 0, dfy: 0};
  };

  // ---- cat ----
  const CAT_SEE = Le('02') + 0.4;
  const sneakA = Ls('17') - 0.6;
  const grab = Ls('19') - 0.25;
  let cat: React.ReactNode = null;
  let catFront = false;
  let fishOnFloor = t >= RIP && t < grab;
  if (t < POP) cat = <Cat2 x={1560} y={790} s={0.62} t={t} mode="sit" look={t > CAT_SEE ? -1 : 0} grin={seg(t, CAT_SEE + 0.8, CAT_SEE + 1.6)} />;
  else if (t < POP + 0.45) { const k = (t - POP) / 0.45; cat = <Cat2 x={lerp(1560, 1240, k)} y={lerp(790, 245, k) - Math.sin(k * Math.PI) * 120} s={0.45} t={t} mode="scared" />; }
  else if (t < Ls('15')) cat = <Cat2 x={1240} y={245} s={0.45} t={t} mode="cling" />;
  else if (t < sneakA) cat = null;
  else if (t < grab) { cat = <Cat2 x={lerp(1960, FISH2.x + 170, cl((t - sneakA) / (grab - sneakA)))} y={1005} s={0.6} t={t} mode="sneak" face={-1} />; catFront = true; }
  else if (t < Le('19') + 0.6) { cat = <Cat2 x={lerp(FISH2.x + 170, 2000, cl((t - Le('19') + 0.6) / 1.2))} y={1005} s={0.6} t={t} mode="carry" face={1} talk={tk('cat')} />; catFront = true; }
  else if (t >= Ls('21') - 0.4) cat = <Cat2 x={1270} y={286} s={0.5} t={t} mode="lounge" face={-1} talk={tk('cat')} />;

  // ---- brain ----
  const bk = cl((t - POP) / 0.5);
  const showBrain = t >= POP && !(t > Ls('19') - 0.5 && t < Ls('22'));
  const brainX = t > Ls('22') ? 960 : lerp(JX1, 1060, back(bk));
  const brainY = t > Ls('22') ? 420 : lerp(JFY - 260, 360, back(bk));

  const picked = t > HELP ? cl((t - HELP - 0.4) / 3.0) : 0;

  return (
    <>
      <image href={staticFile('ep2/lobby2.png')} x={0} y={0} width={1920} height={1080} />
      {/* back: neighbours */}
      {NB.map((n, k) => {
        const q = nPose(k);
        const fy = n.fy + q.dfy;
        return <At key={k} x={n.x + q.dx} fy={fy} face={n.face} p={q.p} look={n.look} t={t + k} mood={q.mood} eyes={q.eyes} talk={k === 2 ? tk('del') : 0} />;
      })}
      {/* Jay (by the elevator) */}
      {t >= JIN ? (
        <g>
          <At x={jx} fy={jfy} face={jface} p={jp} look={JAY} t={t} talk={tk('jay')} mood={jmood} />
          {t < WH ? <g transform={`translate(${jx} ${jfy - 150 * sc(jfy) + (jp.hy - 250) * sc(jfy)}) scale(${-sc(jfy)} ${sc(jfy)}) rotate(${jp.head})`}><Headphones /></g> : null}
        </g>
      ) : null}
      {t > WH + 0.3 && t < SIT + 1.0 ? [0, 1, 2].map((k) => {
        const a = t * 4 + k * 2.1;
        const lying = t < SIT + 0.3;
        const s0 = sc(JFY);
        return <path key={k} d="M0 -22 L6 -6 L22 0 L6 6 L0 22 L-6 6 L-22 0 L-6 -6 Z" fill={Y} stroke={INK} strokeWidth={3} transform={`translate(${(lying ? JX1 + 360 * s0 : JX1) + Math.cos(a) * 70} ${(lying ? JFY - 120 * s0 : JFY - 330 * s0) + Math.sin(a) * 20})`} />;
      }) : null}
      {t > WH && t < WH + 0.45 ? <text x={JX1 - 40} y={JFY - 360} fontSize={100} fontWeight={900} fontFamily={F} fill={Y} stroke={INK} strokeWidth={12} paintOrder="stroke" transform={`rotate(-10 ${JX1} ${JFY - 360})`}>BONK!</text> : null}
      {/* cat on the bench / mailboxes (behind front layer) */}
      {!catFront ? cat : null}
      {/* fish */}
      {fishOnFloor ? (() => {
        const k = cl((t - RIP) / 0.6);
        return <Fish x={lerp(AX0 - 40, FISH2.x, k)} y={lerp(840, FISH2.y, k) - Math.sin(k * Math.PI) * 150} a={k * 380} s={0.85} />;
      })() : null}
      {t >= Ls('21') - 0.4 ? <g transform="translate(1180 300) rotate(-20)"><Fish x={0} y={0} s={0.5} /></g> : null}
      {/* oranges */}
      {ORS.map((_, k) => {
        const o = orangeAt2(k, t, picked);
        return o ? <Orange key={k} x={o.x} y={o.y} r={o.r} a={o.a} /> : null;
      })}
      {/* torn bag */}
      {t >= RIP ? <g transform={`translate(${AX0 - 140} ${AFY0 - 60}) scale(0.8) rotate(-70 0 120)`}><Bag torn={1} /></g> : null}
      {/* Auntie (front) */}
      <At x={ax} fy={afy} face={aface} p={ap} look={auntieLook} t={t} talk={tk('auntie')} mood={amood} eyes={aface === -1 ? 0 : 0} />
      {t < RIP ? <g transform={`translate(${ax - 130} ${AFY0 - 250}) scale(0.9)`}><Bag torn={0} /></g> : null}
      {/* Brain */}
      {showBrain ? (
        <g>
          {t < POP + 0.5 ? <text x={JX1 - 60} y={JFY - 300} fontSize={110} fontWeight={900} fontFamily={F} fill={Y} stroke={INK} strokeWidth={12} paintOrder="stroke" opacity={1 - (t - POP) / 0.5}>POP!</text> : null}
          <BrainGuy x={brainX} y={brainY} s={lerp(0.18, t > Ls('22') ? 0.8 : 0.55, back(bk))} t={t} talk={tk('brain')} point={spk(t, 'brain')} />
        </g>
      ) : null}
      {/* front cat (sneaking / carrying) */}
      {catFront ? cat : null}
    </>
  );
};

const Sticker: React.FC<{t: number; at: number; until: number; text: string; x: number; y: number; c?: string; s?: number}> = ({t, at, until, text, x, y, c = Y, s = 1}) => {
  if (t < at || t > until) return null;
  const k = back(cl((t - at) / 0.35)) * (1 - cl((t - until + 0.3) / 0.3));
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(-3deg) scale(${k * s})`, fontSize: 60, fontWeight: 900, fontFamily: F, background: c, color: INK, padding: '6px 28px', borderRadius: 16, border: `6px solid ${INK}`, whiteSpace: 'nowrap'}}>{text}</div>
  );
};

const Captions2: React.FC<{t: number}> = ({t}) => {
  const l = LN.find((x) => t >= x.start - 0.05 && t <= x.start + x.dur + 0.3);
  if (!l) return null;
  const groups: [string, number, number][][] = [];
  let cur: [string, number, number][] = [];
  for (const w of l.words) {
    const len = cur.reduce((n, x) => n + x[0].length, 0);
    if (cur.length && len + w[0].length > 13) {
      groups.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) groups.push(cur);
  let gi = groups.findIndex((_, k) => t < (groups[k + 1]?.[0][1] ?? Infinity));
  if (gi < 0) gi = groups.length - 1;
  const tag = {jay: '阿杰', auntie: '王阿姨', brain: '脑子', cat: '主子', del: '外卖小哥'}[l.who];
  const tc = {jay: '#3a9d5d', auntie: '#9d4edd', brain: '#f07a9c', cat: '#e07a1f', del: '#f77f00'}[l.who];
  return (
    <div style={{position: 'absolute', bottom: 30, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{fontSize: 30, fontWeight: 900, color: W, background: tc, padding: '0 16px', borderRadius: 10, border: `4px solid ${INK}`, marginBottom: -6, zIndex: 1}}>{tag}</div>
      <div style={{display: 'flex', justifyContent: 'center', padding: '8px 28px', borderRadius: 20, background: 'rgba(255,255,255,0.95)', border: `5px solid ${INK}`, fontWeight: 900, fontSize: 52, lineHeight: 1.2}}>
        {groups[gi].map(([w, s], k) => (
          <span key={k} style={{whiteSpace: 'nowrap', color: t >= s ? (t < s + 0.4 ? '#e63946' : INK) : 'rgba(22,18,28,0.35)'}}>{w}</span>
        ))}
      </div>
    </div>
  );
};

const sfx2 = () => {
  const S: {at: number; f: string; v: number}[] = [];
  const add = (at: number, f: string, v: number) => S.push({at, f, v});
  for (let k = 0; k < 4; k++) add(0.2 + k * 0.34, 'step', 0.35);
  add(RIP - 0.05, 'cloth', 0.6); add(RIP, 'rip', 0.8);
  [0.25, 0.45, 0.6, 0.8, 1.0, 1.25, 1.5].forEach((d, k) => add(RIP + d, k % 2 ? 'plop2' : 'plop1', 0.45 - k * 0.04));
  add(Le('01') + 0.5, 'crickets', 0.5);
  const JIN = Le('02') + 1.0;
  for (let k = 0; k < 11; k++) add(JIN + k * 0.36, 'step', 0.3);
  add(JIN + 2.6, 'boing', 0.35);
  for (let k = 0; k < 5; k++) add(JIN + 4.1 + k * 0.28, 'button', 0.6);
  const ONION = Ls('04') - 2.4;
  const WH = Ls('04') - 0.9;
  add(ONION, 'whoosh2', 0.5); add(ONION + 0.25, 'elevator', 0.25);
  for (let k = 0; k < 4; k++) add(ONION + 0.6 + k * 0.17, 'step', 0.45);
  add(WH - 0.12, 'whoosh', 0.7); add(WH, 'bonk', 0.9); add(WH + 0.04, 'boing2', 0.45); add(WH + 0.3, 'slam', 0.5);
  const POP = Le('06') + 0.25;
  add(POP, 'pop', 0.8); add(POP + 0.03, 'boing', 0.5); add(POP + 0.08, 'squeak', 0.6); add(POP + 0.45, 'thud', 0.35);
  add(Ls('08') - 0.4, 'whoosh2', 0.5); add(Le('10') + 0.3, 'whoosh2', 0.5);
  add(Ls('09') + 0.6, 'other3', 0.35); add(Ls('10') + 0.8, 'other3', 0.35);
  add(Le('13') + 0.15, 'rimshot', 0.75);
  add(Ls('15') - 0.4, 'whoosh2', 0.5); add(Le('16') + 0.3, 'whoosh2', 0.5);
  add(Ls('16') + 1.0, 'elevator', 0.25);
  const HELP = Le('18') + 0.2;
  for (let k = 0; k < 8; k++) add(HELP + 0.4 + k * 0.38, k % 2 ? 'plop1' : 'plop2', 0.3);
  add(Ls('19') - 0.25, 'bite', 0.7);
  add(Le('21') + 0.2, 'eat', 0.6); add(Le('21') + 0.9, 'burp', 0.7);
  add(Ls('22'), 'pop', 0.5);
  return S;
};

export const Ep2b: React.FC = () => {
  useFont();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const amp = (ENV2 as number[])[Math.min((ENV2 as number[]).length - 1, frame)] ?? 0;
  const c = camAt2(t);
  const END = EP2B_FRAMES / 30;
  const fade = cl((t - (END - 0.6)) / 0.5);
  const hook = t < 2.8 ? 1 - cl((t - 2.4) / 0.4) : 0;
  const cut1 = t > Ls('08') - 0.4 && t < Le('10') + 0.4;
  const cut2 = t > Ls('15') - 0.4 && t < Le('16') + 0.4;
  const cutIn = (a: number, b: number) => Math.min(cl((t - a) / 0.3), 1 - cl((t - b + 0.3) / 0.3));
  const src = t > Ls('07') && t < Le('12') ? 'Darley & Latané, 1968' : t > Ls('15') - 0.4 && t < Le('16') + 0.4 ? 'Moriarty, 1975' : null;
  return (
    <AbsoluteFill style={{background: INK, fontFamily: F, overflow: 'hidden'}}>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(960 540) scale(${c.z}) translate(${-c.cx} ${-c.cy})`}>
          <Stage2 t={t} amp={amp} />
        </g>
        {cut1 ? <g opacity={cutIn(Ls('08') - 0.4, Le('10') + 0.4)}><Cut1 t={t} /></g> : null}
        {cut2 ? <g opacity={cutIn(Ls('15') - 0.4, Le('16') + 0.4)}><Cut2 t={t} /></g> : null}
      </svg>
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center', opacity: hook, fontWeight: 900, fontSize: 100, lineHeight: 1.25, color: W, textShadow: [[-5, -5], [5, -5], [-5, 5], [5, 5], [0, 6], [0, -6], [6, 0], [-6, 0], [0, 12]].map(([a, b]) => `${a}px ${b}px 0 ${INK}`).join(', ')}}>
          <div>为什么人越多，</div>
          <span style={{display: 'inline-block', background: Y, color: INK, padding: '0 26px', borderRadius: 18, border: `7px solid ${INK}`, textShadow: 'none', transform: 'rotate(-2deg)'}}>越没人帮你？</span>
        </div>
      ) : null}
      <Sticker t={t} at={Ls('07') + 2.2} until={Le('07') + 1.2} text="旁观者效应" x={1340} y={170} />
      <Sticker t={t} at={Ls('14') + 1.0} until={Le('14') + 0.6} text="指着一个人喊！" x={1300} y={170} c="#52b788" />
      <Sticker t={t} at={Ls('22') + 0.3} until={Le('22') + 1.5} text="需要帮忙？指着一个人喊！" x={960} y={170} c={Y} />
      <Captions2 t={t} />
      {src ? <div style={{position: 'absolute', bottom: 36, right: 36, fontSize: 26, fontWeight: 800, color: W, background: 'rgba(22,18,28,0.65)', padding: '4px 12px', borderRadius: 8}}>研究：{src}</div> : null}
      <div style={{position: 'absolute', top: 24, left: 32, fontSize: 30, fontWeight: 900, color: W, letterSpacing: 4, textShadow: `0 2px 6px ${INK}`}}>
        脑子<span style={{background: Y, color: INK, padding: '0 8px', borderRadius: 6, marginLeft: 6}}>说明书</span>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
      <Audio src={staticFile('ep2/zh-voice-b.wav')} />
      {sfx2().map((x, j) => (
        <Sequence key={j} from={Math.max(0, Math.round(x.at * fps))} durationInFrames={Math.round(2.5 * fps)}>
          <Audio src={staticFile(x.f === 'rimshot' ? 'sfx/rimshot.wav' : `sfx2/${x.f}.wav`)} volume={x.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
