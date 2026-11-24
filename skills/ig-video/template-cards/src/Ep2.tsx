import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFont} from './Cards';
import ZH from './ep2-zh.json';
import ENV_ZH from './ep2-zh-env.json';

// 脑子说明书 Episode 2 「人越多，越没人帮？」 — first 20 s, Chinese, 16:9.
// Original cast (阿杰, 王阿姨, 脑子, 主子 the cat, four neighbours) in a sitcom look: thick ink lines,
// flat colours, a steady wide shot with 3 eased zoom-ins, puppet skeletons (two-segment arms and legs)
// so the acting is gestures for normal talk and full-body moves for shock and slapstick.

type Line = {who: 'jay' | 'auntie' | 'brain' | 'cat'; say: string; start: number; dur: number; src?: string; words: [string, number, number][]};
const LINES = ZH as unknown as Line[];
export const EP2_FRAMES = Math.ceil((LINES[LINES.length - 1].start + LINES[LINES.length - 1].dur + 1.3) * 30);

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

// ---------- lobby ----------
const Lobby: React.FC<{t: number}> = ({t}) => (
  <>
    <rect x={0} y={0} width={1920} height={760} fill="#efe6d2" />
    <rect x={0} y={0} width={1920} height={70} fill="#d8ccb2" />
    {[300, 960, 1620].map((x) => <g key={x}><rect x={x - 90} y={70} width={180} height={18} fill="#fffbe6" stroke={INK} strokeWidth={4} /><path d={`M${x - 150} 90 L${x - 260} 760 L${x + 260} 760 L${x + 150} 90 Z`} fill="rgba(255,250,220,0.18)" /></g>)}
    <rect x={0} y={700} width={1920} height={60} fill="#b89f7a" />
    <rect x={0} y={760} width={1920} height={320} fill="#d9c9a8" />
    {[...Array(9)].map((_, k) => <line key={k} x1={k * 240 - 960 + 960} y1={760} x2={(k * 240 - 960) * 1.9 + 960} y2={1080} stroke="#c2ae88" strokeWidth={4} />)}
    {[800, 850, 920, 1010].map((y) => <line key={y} x1={0} y1={y} x2={1920} y2={y} stroke="#c2ae88" strokeWidth={4} />)}
    {/* mailboxes */}
    <rect x={150} y={250} width={330} height={330} fill="#adb5bd" stroke={INK} strokeWidth={7} />
    {[...Array(4)].map((_, r) => [...Array(4)].map((__, c) => <g key={`${r}${c}`}><rect x={165 + c * 78} y={265 + r * 78} width={68} height={68} fill="#ced4da" stroke={INK} strokeWidth={4} /><rect x={182 + c * 78} y={282 + r * 78} width={34} height={6} fill={INK} /></g>))}
    {/* elevator */}
    <rect x={800} y={230} width={320} height={480} fill="#8d99ae" stroke={INK} strokeWidth={8} />
    <rect x={815} y={250} width={142} height={460} fill="#c9d1d9" stroke={INK} strokeWidth={5} />
    <rect x={963} y={250} width={142} height={460} fill="#c9d1d9" stroke={INK} strokeWidth={5} />
    <rect x={890} y={170} width={140} height={54} rx={8} fill={INK} />
    <text x={960} y={212} textAnchor="middle" fontSize={40} fill="#ff4d4d" fontWeight={900} fontFamily={F}>{`${Math.max(1, 9 - Math.floor(t / 2.2))}F ▼`}</text>
    <rect x={1150} y={505} width={56} height={110} rx={10} fill="#adb5bd" stroke={INK} strokeWidth={5} />
    <circle cx={1178} cy={541} r={14} fill={t > 9.3 && t < 11 && Math.floor(t * 6) % 2 ? '#ffd23f' : '#f8f9fa'} stroke={INK} strokeWidth={4} />
    <circle cx={1178} cy={581} r={14} fill="#f8f9fa" stroke={INK} strokeWidth={4} />
    {/* sign + notice board */}
    <rect x={560} y={120} width={180} height={70} rx={10} fill="#d00000" stroke={INK} strokeWidth={6} />
    <text x={650} y={170} textAnchor="middle" fontSize={44} fill={Y} fontWeight={900} fontFamily={F}>3栋</text>
    <rect x={1380} y={250} width={320} height={230} fill="#a47148" stroke={INK} strokeWidth={7} />
    {[0, 1, 2].map((k) => <g key={k}><rect x={1400 + k * 100} y={275 + (k % 2) * 30} width={86} height={110} fill={W} stroke={INK} strokeWidth={4} transform={`rotate(${(k - 1) * 4} ${1443 + k * 100} 330)`} /><path d={`M${1412 + k * 100} ${310 + (k % 2) * 30} h60 M${1412 + k * 100} ${330 + (k % 2) * 30} h50 M${1412 + k * 100} ${350 + (k % 2) * 30} h56`} stroke="#adb5bd" strokeWidth={6} /></g>)}
    <text x={1540} y={455} textAnchor="middle" fontSize={34} fill={W} fontWeight={900} fontFamily={F}>通知</text>
    {/* entrance glass on the right */}
    <rect x={1760} y={200} width={160} height={560} fill="#bde0fe" stroke={INK} strokeWidth={8} />
    <path d="M1780 240 l60 -30 M1780 300 l100 -50" stroke={W} strokeWidth={10} opacity={0.7} />
  </>
);
const Plant: React.FC = () => (
  <g transform="translate(120 960)">
    {[-60, -20, 20, 60, 0].map((a, k) => <path key={k} d={`M0 -120 Q${a * 1.6} -260 ${a * 2.4} ${-330 + (k % 2) * 40}`} stroke="#2d6a4f" strokeWidth={34} fill="none" strokeLinecap="round" />)}
    {[-60, -20, 20, 60, 0].map((a, k) => <path key={`l${k}`} d={`M0 -120 Q${a * 1.6} -260 ${a * 2.4} ${-330 + (k % 2) * 40}`} stroke="#40916c" strokeWidth={20} fill="none" strokeLinecap="round" />)}
    <path d="M-80 -130 L80 -130 L60 0 L-60 0 Z" fill="#bc6c25" stroke={INK} strokeWidth={7} />
  </g>
);

// ---------- timeline ----------
const RIP = 0.6;
const JAY_IN = 6.3;
const JAY_STOP = 9.3;
const JAY_X0 = 2080;
const JAY_X1 = 1300;
const ONION = 9.5;
const RUN0 = 10.1;
const WHACK = 11.0;
const SIT = 14.2;
const POP = 16.55;
const AUNT_X0 = 470;
const AUNT_X1 = 1110;
const FISH = {x: 640, y: 972};

// deterministic orange physics
const ORANGES = [...Array(13)].map((_, k) => ({vx: -260 + ((k * 137) % 900), vy: -760 + ((k * 53) % 380), r: 20 + (k % 3) * 4}));
const orangeAt = (k: number, t: number) => {
  const o = ORANGES[k];
  const x0 = 470;
  const y0 = 820;
  if (t < RIP) return null;
  if (k === 0) {
    // the one Jay hops over: lands at x 1330
    const k1 = cl((t - RIP) / 2.0);
    const x = lerp(x0, 1420, 1 - (1 - k1) ** 2);
    const y = k1 < 0.35 ? y0 - Math.sin((k1 / 0.35) * Math.PI) * 220 : FLOOR + 4 - Math.abs(Math.sin(((k1 - 0.35) / 0.65) * Math.PI * 2)) * 60 * (1 - k1);
    return {x, y: Math.min(y, FLOOR + 4), a: (x - x0) * 2, r: 24};
  }
  let x = x0;
  let y = y0;
  let vx = o.vx;
  let vy = o.vy;
  const dt = 1 / 120;
  for (let s = RIP; s < t; s += dt) {
    vy += 1900 * dt;
    x += vx * dt;
    y += vy * dt;
    const fl = FLOOR + 4 + (k % 4) * 16;
    if (y > fl) {
      y = fl;
      vy = -vy * 0.42;
      vx *= 0.82;
      if (Math.abs(vy) < 60) vy = 0;
    }
    if (vy === 0) vx *= 0.985;
    if (x < 60 || x > 1860) vx = -vx * 0.6;
  }
  return {x, y, a: (x - x0) * 2, r: o.r};
};

// camera: steady wide shot, three eased zoom-ins and one shake
const ZOOMS: {a: number; b: number; z: number; cx: number; cy: number}[] = [
  {a: 2.6, b: 4.4, z: 1.32, cx: 1150, cy: 600},
  {a: 11.95, b: 14.05, z: 1.75, cx: AUNT_X1, cy: 560},
  {a: 16.55, b: 18.3, z: 1.3, cx: 1150, cy: 520},
];
const camAt = (t: number) => {
  let z = 1;
  let cx = 960;
  let cy = 540;
  for (const q of ZOOMS) {
    const w = Math.min(seg(t, q.a, q.a + 0.45), 1 - seg(t, q.b - 0.45, q.b));
    if (w > 0) {
      z = lerp(1, q.z, w);
      cx = lerp(960, q.cx, w);
      cy = lerp(540, q.cy, w);
    }
  }
  const sh = t > WHACK && t < WHACK + 0.35 ? (1 - (t - WHACK) / 0.35) * 18 : 0;
  return {z, cx: cx + Math.sin(t * 90) * sh, cy: cy + Math.cos(t * 77) * sh};
};

const speaking = (t: number, who: Line['who']) => LINES.some((l) => l.who === who && t >= l.start && t <= l.start + l.dur);

const Stage: React.FC<{t: number; amp: number}> = ({t, amp}) => {
  const talk = amp > 0.1 ? cl((amp - 0.1) * 2.2) : 0;
  const tk = (who: Line['who']) => (speaking(t, who) ? talk : 0);
  const g = (who: Line['who']) => (speaking(t, who) ? 0.5 + 0.5 * talk : 0);

  // ---- Auntie ----
  const runK = seg(t, RUN0, WHACK);
  const ax = lerp(AUNT_X0, AUNT_X1, runK);
  const swing = t < WHACK ? 0 : seg(t, WHACK, WHACK + 0.12);
  let ap: Pose;
  let amood: Mood = 'normal';
  if (t < RIP) ap = pose({la1: -10, la2: -10, ra1: 10});
  else if (t < 2.6) { ap = track(t, [[RIP, pose({})], [RIP + 0.25, pose({la1: -150, la2: -10, ra1: 150, ra2: 10, hy: -18})], [2.6, pose({la1: -140, la2: -20, ra1: 140, ra2: 20})]]); amood = 'shock'; }
  else if (t < 4.5) { ap = pose({la1: -150, la2: -70, ra1: 150, ra2: 70, head: Math.sin(t * 3) * 4}); amood = 'shock'; }
  else if (t < 6.2) { ap = pose({la1: -95, la2: 10 - 15 * g('auntie'), ra1: 95, ra2: -10 + 15 * g('auntie'), tilt: 4, head: -6}); amood = 'normal'; }
  else if (t < ONION) { ap = pose({la1: -35, la2: 120, ra1: 35, ra2: -120, ll1: -4 + Math.max(0, Math.sin(t * 10)) * -12}); amood = 'angry'; }
  else if (t < RUN0) { ap = track(t, [[ONION, pose({la1: -35, la2: 120, ra1: 35, ra2: -120})], [ONION + 0.3, pose({la1: -20, la2: 30, ra1: 165, ra2: 10, hy: -10})]]); amood = 'angry'; }
  else if (t < WHACK) { ap = pose({...walk(t, 44, 3.6), ra1: 165, ra2: 10, tilt: 10}); amood = 'angry'; }
  else if (t < WHACK + 0.8) { ap = pose({la1: -40, la2: 20, ra1: lerp(165, 55, swing), ra2: 10, tilt: lerp(10, 18, swing)}); amood = 'angry'; }
  else if (t < SIT) { ap = pose({la1: -35, la2: 120, ra1: 150, ra2: 20 + 16 * Math.sin(t * 18), tilt: 8, head: 4 * Math.sin(t * 9)}); amood = 'angry'; }
  else if (t < POP) { ap = pose({la1: 40, la2: -115, ra1: -40, ra2: 115, ll1: -4 + Math.max(0, Math.sin(t * 9)) * -12}); amood = 'angry'; }
  else { ap = pose({la1: -150 + 20 * Math.sin(t * 14), la2: -20, ra1: 150 - 20 * Math.sin(t * 14 + 1), ra2: 20, hy: -6 * Math.abs(Math.sin(t * 14))}); amood = 'shock'; }
  const holdOnion = t >= ONION + 0.15 && t < SIT;
  const auntieLook: Look = {...AUNTIE, hand: holdOnion ? <g transform="rotate(180) translate(0 -10)"><Onion /></g> : undefined};

  // ---- Jay ----
  const walkK = cl((t - JAY_IN) / (JAY_STOP - JAY_IN));
  const jx = lerp(JAY_X0, JAY_X1, walkK);
  const hop = t > 8.75 && t < 9.1 ? Math.sin(((t - 8.75) / 0.35) * Math.PI) * 50 : 0;
  let jp: Pose;
  let jmood: Mood = 'happy';
  if (t < JAY_STOP) { jp = pose({...walk(t, 26, 2.2), head: 6 * Math.sin(t * 9), hy: (walk(t, 26, 2.2).hy ?? 0) - hop}); jmood = speaking(t, 'jay') ? 'think' : 'happy'; }
  else if (t < WHACK) { jp = pose({ra1: 145, ra2: 12 + 12 * Math.max(0, Math.sin(t * 16)), la1: -10, head: 6 * Math.sin(t * 9)}); jmood = 'happy'; }
  else if (t < SIT) { jp = track(t, [[WHACK, pose({ra1: 145, ra2: 12})], [WHACK + 0.3, pose({rot: -72, la1: -120, la2: -20, ra1: 120, ra2: 20, ll1: -20, rl1: 30})], [SIT, pose({rot: -72, la1: -110, ra1: 100, ll1: -10, rl1: 20})]]); jmood = 'dizzy'; }
  else if (t < POP) {
    const sit = pose({hy: 140, ll1: -80, ll2: 10, rl1: 80, rl2: -10});
    const rub = t < 15.5 ? {ra1: 160, ra2: -80 + 18 * Math.sin(t * 16), la1: -15} : {ra1: 150, ra2: -95, la1: -100 - 20 * talk, la2: -30};
    jp = track(t, [[SIT, pose({rot: -72, la1: -110, ra1: 100})], [SIT + 0.35, {...sit, ...rub}], [POP, {...sit, ...rub}]]);
    jmood = t < 15.5 ? 'dizzy' : 'angry';
  } else { jp = pose({hy: 140, ll1: -80, ll2: 10, rl1: 80, rl2: -10, la1: -130, la2: -30, ra1: 130, ra2: 30, rot: -8}); jmood = 'shock'; }
  const jayLook: Look = {...JAY, extra: <>{JAY.extra}</>};

  // ---- neighbours ----
  const nStage = t < RIP ? 0 : t < 5.3 ? 1 : t < WHACK ? 2 : t < POP ? 3 : 4;
  const nb = [
    {x: 590, look: N1, act: (k: number): Partial<Pose> => (k === 2 ? {ra1: 70, ra2: -110, head: 14} : {})},
    {x: 730, look: N2, act: (k: number): Partial<Pose> => (k === 2 ? {ra1: 60, ra2: -140 + 10 * Math.sin(t * 4), head: -4} : {})},
    {x: 1520, look: N3, act: (k: number): Partial<Pose> => (k === 2 ? {head: -12, la1: -30, la2: 120} : {})},
    {x: 1690, look: N4, act: (k: number): Partial<Pose> => (k === 2 ? {la1: -60, la2: 100, head: 10} : {})},
  ];
  const nMood: Mood = nStage === 1 ? 'normal' : nStage === 2 ? 'bored' : nStage >= 3 ? 'shock' : 'normal';

  // ---- cat ----
  let cat: React.ReactNode = null;
  if (t > 6.8 && t < 12.3) cat = <Cat x={205} y={705} s={0.62} t={t} mode="peek" look={1} />;
  else if (t >= 12.3 && t < 15.9) cat = <Cat x={lerp(160, 520, cl((t - 12.3) / 3.4))} y={1050} s={0.62} t={t} mode="sneak" />;
  else if (t >= 15.9 && t < POP) cat = <Cat x={520} y={1050} s={0.62} t={t} mode="wiggle" />;
  else if (t >= POP && t < POP + 0.45) {
    const k = (t - POP) / 0.45;
    cat = <Cat x={lerp(560, ax, k)} y={lerp(980, 372, k) - Math.sin(k * Math.PI) * 220} s={0.5} t={t} mode="scared" />;
  } else if (t >= POP + 0.45) cat = <Cat x={ax} y={372 + ap.hy} s={0.5} t={t} mode="cling" />;
  const thought = t > 7.6 && t < 12.2 ? cl((t - 7.6) / 0.3) : 0;

  // ---- brain ----
  const bk = cl((t - POP) / 0.5);
  const fishGone = false;

  return (
    <>
      <Lobby t={t} />
      {nb.map((n, k) => (
        <Puppet key={k} x={n.x} y={BACK - 150 * 0.78} s={0.78} face={k < 2 ? 1 : -1} p={pose({...(nStage === 2 ? n.act(2) : {}), head: (n.act(2).head ?? 0) * (nStage === 2 ? 1 : 0) + Math.sin(t * 1.3 + k) * 2})} look={n.look} t={t + k} mood={nMood} eyes={nStage === 1 ? -1 : nStage === 3 ? (n.x < JAY_X1 ? 1 : -1) : nStage === 4 ? 0.6 : 0} />
      ))}
      {/* N2's bubble tea + N1's phone while ignoring */}
      {nStage === 2 ? <g transform={`translate(${730 + 52} ${BACK - 150 * 0.78 - 178})`}><rect x={-16} y={-30} width={32} height={50} rx={6} fill="#f4d6a0" stroke={INK} strokeWidth={4} /><line x1={4} y1={-30} x2={12} y2={-62} stroke={INK} strokeWidth={5} /></g> : null}
      <Plant />
      {cat && (t > 6.8 && t < 12.3) ? cat : null}
      {thought > 0 ? (
        <g transform={`translate(330 470) scale(${back(thought)})`}>
          <circle cx={-90} cy={110} r={12} fill={W} stroke={INK} strokeWidth={4} />
          <circle cx={-60} cy={70} r={20} fill={W} stroke={INK} strokeWidth={4} />
          <ellipse cx={0} cy={0} rx={110} ry={70} fill={W} stroke={INK} strokeWidth={6} />
          <Fish x={0} y={0} s={0.9} />
          <path d="M60 -20 q10 -20 0 -34" stroke="#e63946" strokeWidth={5} fill="none" />
        </g>
      ) : null}
      {/* bag + fish + oranges */}
      <g transform={`translate(${AUNT_X0 - 120} ${FLOOR - 120})`}>{t >= RIP ? <g transform="rotate(-70 0 120)"><Bag torn={1} /></g> : null}</g>
      {t >= RIP && !fishGone ? (() => {
        const k = cl((t - RIP) / 0.6);
        return <Fish x={lerp(AUNT_X0 - 80, FISH.x, k)} y={lerp(820, FISH.y, k) - Math.sin(k * Math.PI) * 160} a={k * 380} s={0.9} />;
      })() : null}
      {ORANGES.map((_, k) => {
        const o = orangeAt(k, t);
        return o ? <Orange key={k} x={o.x} y={o.y} r={o.r} a={o.a} /> : null;
      })}
      {/* Auntie */}
      <Puppet x={ax} y={FLOOR - 150} s={1} face={1} p={ap} look={auntieLook} t={t} talk={tk('auntie')} mood={amood} eyes={t < 6.2 ? 0 : 1} />
      {t < RIP ? <g transform={`translate(${AUNT_X0 - 120} ${FLOOR - 250})`}><Bag torn={0} /></g> : null}
      {t > ONION && t < ONION + 0.6 ? [0, 1, 2, 3].map((k) => <path key={k} d="M0 -26 L7 -7 L26 0 L7 7 L0 26 L-7 7 L-26 0 L-7 -7 Z" fill={Y} stroke={INK} strokeWidth={3} transform={`translate(${AUNT_X0 + 120 + Math.cos(k * 1.6) * 70} ${FLOOR - 560 + Math.sin(k * 1.6) * 70}) scale(${1 - (t - ONION) / 0.6})`} />) : null}
      {/* Jay */}
      {t >= JAY_IN ? (
        <g>
          <Puppet x={jx} y={FLOOR - 150} s={1} face={-1} p={jp} look={jayLook} t={t} talk={tk('jay')} mood={jmood} eyes={t < JAY_STOP && speaking(t, 'jay') ? 0 : 0} />
          {t < WHACK ? <g transform={`translate(${jx} ${FLOOR - 150 + jp.hy - 250}) scale(-1 1) rotate(${jp.head})`}><Headphones /></g> : null}
        </g>
      ) : null}
      {/* stars + birds over Jay */}
      {t > WHACK + 0.3 && t < SIT + 1.2 ? [0, 1, 2, 3].map((k) => {
        const a = t * 4 + k * (Math.PI / 2);
        const lying = t < SIT + 0.3;
        const cx = (lying ? JAY_X1 + 480 : JAY_X1) + Math.cos(a) * 110;
        const cy = (lying ? FLOOR - 230 : FLOOR - 420) + Math.sin(a) * 30;
        return k % 2 ? <path key={k} d="M0 -22 L6 -6 L22 0 L6 6 L0 22 L-6 6 L-22 0 L-6 -6 Z" fill={Y} stroke={INK} strokeWidth={3} transform={`translate(${cx} ${cy})`} /> : <path key={k} d="M-18 0 q9 -14 18 0 q9 -14 18 0" stroke={INK} strokeWidth={5} fill="none" transform={`translate(${cx} ${cy})`} />;
      }) : null}
      {t > WHACK && t < WHACK + 0.4 ? <text x={JAY_X1 - 60} y={FLOOR - 430} fontSize={110} fontWeight={900} fontFamily={F} fill={Y} stroke={INK} strokeWidth={12} paintOrder="stroke" transform={`rotate(-10 ${JAY_X1} ${FLOOR - 430})`}>BONK!</text> : null}
      {/* cat (front) */}
      {cat && !(t > 6.8 && t < 12.3) ? cat : null}
      {/* Brain pops */}
      {t >= POP ? (
        <g>
          {t < POP + 0.5 ? <text x={JAY_X1 - 40} y={FLOOR - 350} fontSize={120} fontWeight={900} fontFamily={F} fill={Y} stroke={INK} strokeWidth={12} paintOrder="stroke" opacity={1 - (t - POP) / 0.5}>POP!</text> : null}
          <BrainGuy x={lerp(JAY_X1, 1480, back(bk))} y={lerp(FLOOR - 250, 360, back(bk))} s={lerp(0.2, 0.62, back(bk))} t={t} talk={tk('brain')} point={speaking(t, 'brain')} />
        </g>
      ) : null}
    </>
  );
};

const Captions: React.FC<{t: number}> = ({t}) => {
  const l = LINES.find((x) => t >= x.start - 0.05 && t <= x.start + x.dur + 0.35);
  if (!l) return null;
  const ws = l.words;
  const groups: [string, number, number][][] = [];
  let cur: [string, number, number][] = [];
  for (const w of ws) {
    const len = cur.reduce((n, x) => n + x[0].length, 0);
    if (cur.length && len + w[0].length > 12) {
      groups.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) groups.push(cur);
  let gi = groups.findIndex((_, k) => t < (groups[k + 1]?.[0][1] ?? Infinity));
  if (gi < 0) gi = groups.length - 1;
  const tag = {jay: '阿杰', auntie: '王阿姨', brain: '脑子', cat: '主子'}[l.who];
  const tc = {jay: '#3a9d5d', auntie: '#9d4edd', brain: '#f07a9c', cat: '#6c757d'}[l.who];
  return (
    <div style={{position: 'absolute', bottom: 34, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{fontSize: 30, fontWeight: 900, color: W, background: tc, padding: '0 16px', borderRadius: 10, border: `4px solid ${INK}`, marginBottom: -6, zIndex: 1}}>{tag}</div>
      <div style={{display: 'flex', justifyContent: 'center', padding: '8px 28px', borderRadius: 20, background: W, border: `5px solid ${INK}`, fontWeight: 900, fontSize: 52, lineHeight: 1.2}}>
        {groups[gi].map(([w, s], k) => (
          <span key={k} style={{whiteSpace: 'nowrap', color: t >= s ? (t < s + 0.4 ? '#e63946' : INK) : 'rgba(22,18,28,0.35)'}}>{w}</span>
        ))}
      </div>
    </div>
  );
};

const SFX: {at: number; f: string; v: number}[] = [
  {at: RIP, f: 'rip', v: 0.7}, ...[0.85, 1.05, 1.3, 1.55, 1.8, 2.1, 2.4].map((a, k) => ({at: a, f: 'bounce', v: 0.18 - k * 0.015})),
  {at: 2.75, f: 'crickets', v: 0.55},
  ...[...Array(9)].map((_, k) => ({at: JAY_IN + k * 0.34, f: 'step', v: 0.35})),
  {at: 8.75, f: 'boing', v: 0.3},
  ...[...Array(6)].map((_, k) => ({at: JAY_STOP + 0.1 + k * 0.25, f: 'click', v: 0.9})),
  {at: ONION, f: 'slideup', v: 0.4}, {at: ONION + 0.25, f: 'ding', v: 0.4},
  {at: RUN0, f: 'whoosh', v: 0.4}, ...[...Array(5)].map((_, k) => ({at: RUN0 + k * 0.18, f: 'step', v: 0.4})),
  {at: WHACK, f: 'bonk', v: 0.9}, {at: WHACK + 0.03, f: 'boing', v: 0.5}, {at: WHACK + 0.1, f: 'boom', v: 0.35}, {at: WHACK + 0.25, f: 'slidedown', v: 0.35},
  {at: WHACK + 0.5, f: 'tweet', v: 0.3}, {at: WHACK + 2.0, f: 'tweet', v: 0.25},
  ...[...Array(7)].map((_, k) => ({at: 12.4 + k * 0.5, f: 'tick', v: 0.12})),
  {at: SIT, f: 'whip', v: 0.3},
  {at: POP, f: 'pop', v: 0.7}, {at: POP + 0.04, f: 'boing', v: 0.45}, {at: POP + 0.06, f: 'meow', v: 0.7}, {at: POP + 0.08, f: 'slideup', v: 0.35}, {at: POP + 0.45, f: 'bonk', v: 0.35},
];

export const Ep2: React.FC = () => {
  useFont();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const amp = (ENV_ZH as number[])[Math.min((ENV_ZH as number[]).length - 1, frame)] ?? 0;
  const c = camAt(t);
  const END = EP2_FRAMES / 30;
  const fade = cl((t - (END - 0.6)) / 0.5);
  const hook = t < 2.7 ? 1 - cl((t - 2.35) / 0.35) : 0;
  const src = LINES.find((l) => l.src && t >= l.start && t <= l.start + l.dur + 0.5)?.src;
  return (
    <AbsoluteFill style={{background: INK, fontFamily: F, overflow: 'hidden'}}>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(960 540) scale(${c.z}) translate(${-c.cx} ${-c.cy})`}>
          <Stage t={t} amp={amp} />
        </g>
      </svg>
      {hook > 0 ? (
        <div style={{position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center', opacity: hook, fontWeight: 900, fontSize: 104, lineHeight: 1.25, color: W, textShadow: [[-5, -5], [5, -5], [-5, 5], [5, 5], [0, 6], [0, -6], [6, 0], [-6, 0], [0, 12]].map(([a, b]) => `${a}px ${b}px 0 ${INK}`).join(', ')}}>
          <div>为什么人越多，</div>
          <span style={{display: 'inline-block', background: Y, color: INK, padding: '0 26px', borderRadius: 18, border: `7px solid ${INK}`, textShadow: 'none', transform: 'rotate(-2deg)'}}>越没人帮你？</span>
        </div>
      ) : null}
      <Captions t={t} />
      {src ? <div style={{position: 'absolute', bottom: 40, right: 40, fontSize: 26, fontWeight: 800, color: W, background: 'rgba(22,18,28,0.6)', padding: '4px 12px', borderRadius: 8}}>研究：{src}</div> : null}
      <div style={{position: 'absolute', top: 28, left: 36, fontSize: 30, fontWeight: 900, color: W, letterSpacing: 4, textShadow: `0 2px 6px ${INK}`}}>
        脑子<span style={{background: Y, color: INK, padding: '0 8px', borderRadius: 6, marginLeft: 6}}>说明书</span>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
      <Audio src={staticFile('ep2/zh-voice.wav')} />
      {SFX.map((x, j) => (
        <Sequence key={j} from={Math.max(0, Math.round(x.at * fps))} durationInFrames={Math.round(2.5 * fps)}>
          <Audio src={staticFile(`sfx/${x.f}.wav`)} volume={x.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
