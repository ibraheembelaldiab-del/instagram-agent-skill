import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFont} from './Cards';
import {clamp, inOut, outBack} from './Spec';
import EN from './song-en.json';
import ZH from './song-zh.json';
import ENV_EN from './song-en-env.json';
import ENV_ZH from './song-zh-env.json';

// Adult-sitcom cartoon style (original characters, not copies of any show): thick ink outlines,
// flat colours with one cel shadow, big white eyes, full room backgrounds, cutaway gags and
// two talking characters with mouth flaps driven by the voice track.
// Cast: 阿杰 / Jay (the guy who falls for it) and 脑子 / Brain (the brand mascot who explains).
// Topic: mere exposure / earworms. Zajonc 1968 (Chinese characters), Kunst-Wilson & Zajonc 1980.

type Beat = {who: 'jay' | 'brain'; say: string; top: string; src?: string; start: number; dur: number; words: [string, number, number][]};
const total = (b: Beat[]) => b[b.length - 1].start + b[b.length - 1].dur;
export const SONG_EN_FRAMES = Math.ceil(total(EN as Beat[]) * 30);
export const SONG_ZH_FRAMES = Math.ceil(total(ZH as Beat[]) * 30);

const INK = '#16121c';
const Y = '#ffd23f';
const W = '#ffffff';
const F = '"Noto Sans SC", sans-serif';
const SKIN = '#f6c9a0';
const SKIN2 = '#e0a97c';

const T = {
  en: {hook: ['Why do earworms', 'sound awful at first…', 'then you sing along?'], hl: 2, jay: 'Jay', brain: 'Brain', later: '3 DAYS LATER', y1968: '1968', seen: 'seen', ask: 'Your earworm? Comment!', ad: 'BUY NOW', ms: '0.001 s', q: 'Like it… or just seen it a lot?', share: 'Send to them', brand: ['Brain', 'Manual'], src: 'Research: '},
  zh: {hook: ['为什么洗脑神曲', '第一遍嫌难听', '第十遍跟着唱？'], hl: 2, jay: '阿杰', brain: '脑子', later: '三天后', y1968: '1968年', seen: '次', ask: '你被哪首洗脑过？', ad: '买它！', ms: '0.001秒', q: '是真喜欢，还是见多了？', share: '转给TA', brand: ['脑子', '说明书'], src: '研究：'},
};
type Lx = typeof T.en;

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
const Txt: React.FC<{x: number; y: number; s: number; c?: string; o?: number; stroke?: boolean; children: React.ReactNode}> = ({x, y, s, c = W, o = 1, stroke, children}) => (
  <text x={x} y={y} textAnchor="middle" fontSize={s} fill={c} fontWeight={900} fontFamily={F} opacity={o} stroke={stroke ? INK : undefined} strokeWidth={stroke ? s * 0.14 : undefined} paintOrder="stroke">{children}</text>
);

// ---------- characters ----------
type Mood = 'normal' | 'angry' | 'happy' | 'shock' | 'smug' | 'think';
const Eyes: React.FC<{t: number; mood: Mood; look?: number; r?: number; gap?: number}> = ({t, mood, look = 0, r = 40, gap = 36}) => {
  const blink = (t % 3.3) < 0.12 ? 1 : 0;
  const pr = mood === 'shock' ? 5 : 8;
  return (
    <g>
      {[-1, 1].map((sd) => (
        <g key={sd}>
          <ellipse cx={sd * gap} cy={0} rx={r} ry={blink ? 4 : r * 1.05} fill={W} stroke={INK} strokeWidth={6} />
          {!blink ? <circle cx={sd * gap + look * 10} cy={mood === 'think' ? -10 : 2} r={pr} fill={INK} /> : null}
          {mood === 'angry' ? <path d={`M${sd * gap - 40 * sd} -48 L${sd * gap + 30 * sd} -30`} stroke={INK} strokeWidth={10} strokeLinecap="round" /> : null}
          {mood === 'smug' ? <path d={`M${sd * gap - 38} -12 h76`} stroke={INK} strokeWidth={8} /> : null}
          {mood === 'smug' ? <rect x={sd * gap - 40} y={-44} width={80} height={32} fill={SKIN} /> : null}
        </g>
      ))}
    </g>
  );
};
const Mouth: React.FC<{open: number; mood: Mood; w?: number}> = ({open, mood, w = 60}) => {
  if (mood === 'shock') return <ellipse cx={0} cy={0} rx={18 + open * 6} ry={24 + open * 10} fill="#5c1a1a" stroke={INK} strokeWidth={6} />;
  if (open > 0.15) {
    const h = 14 + open * 34;
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

const Jay: React.FC<{x: number; y: number; s?: number; t: number; mood?: Mood; talk?: number; pose?: 'ears' | 'point' | 'shower' | 'towel' | 'idle' | 'sit'; look?: number}> = ({x, y, s = 1, t, mood = 'normal', talk = 0, pose = 'idle', look = 0}) => {
  const bob = Math.sin(t * 3) * 4;
  const shower = pose === 'shower';
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`}>
      {!shower ? (
        <>
          {/* legs + shoes */}
          {pose !== 'sit' ? (
            <>
              <path d="M-55 160 L-60 330 L-10 330 L0 170 Z M55 160 L60 330 L10 330 L0 170 Z" fill={pose === 'towel' ? SKIN : '#3d5a80'} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
              <path d="M-75 330 h70 v24 h-82 Z M5 330 h70 l12 24 h-82 Z" fill={INK} />
            </>
          ) : (
            <path d="M-55 160 L-60 200 L90 210 L95 170 Z" fill="#3d5a80" stroke={INK} strokeWidth={7} />
          )}
          {/* torso */}
          {pose === 'towel' ? (
            <>
              <path d="M-80 -20 Q0 -40 80 -20 L70 170 L-70 170 Z" fill={SKIN} stroke={INK} strokeWidth={7} />
              <path d="M-85 90 L85 90 L90 190 L-90 190 Z" fill="#7ec8e3" stroke={INK} strokeWidth={7} />
            </>
          ) : (
            <>
              <path d="M-85 -20 Q0 -45 85 -20 L80 175 L-80 175 Z" fill="#3a9d5d" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
              <path d="M30 -30 Q85 -20 80 175 L40 175 Z" fill="#2c7a48" />
              <path d="M-30 60 h60 v40 h-60 Z" fill="#2c7a48" stroke={INK} strokeWidth={5} />
            </>
          )}
          {/* arms */}
          {pose === 'ears' ? (
            <path d="M-80 0 Q-150 -60 -120 -170 M80 0 Q150 -60 120 -170" stroke={pose === 'ears' ? '#3a9d5d' : SKIN} strokeWidth={30} fill="none" strokeLinecap="round" />
          ) : pose === 'point' ? (
            <path d="M-80 0 Q-120 80 -100 160 M80 0 Q170 -40 230 -90" stroke="#3a9d5d" strokeWidth={30} fill="none" strokeLinecap="round" />
          ) : (
            <path d="M-80 0 Q-120 80 -100 160 M80 0 Q120 80 100 160" stroke={pose === 'towel' ? SKIN : '#3a9d5d'} strokeWidth={30} fill="none" strokeLinecap="round" />
          )}
          {pose === 'ears' ? <><circle cx={-118} cy={-175} r={24} fill={SKIN} stroke={INK} strokeWidth={6} /><circle cx={118} cy={-175} r={24} fill={SKIN} stroke={INK} strokeWidth={6} /></> : null}
          {pose === 'point' ? <circle cx={232} cy={-92} r={22} fill={SKIN} stroke={INK} strokeWidth={6} /> : null}
        </>
      ) : null}
      {/* head */}
      <g transform="translate(0 -170)">
        <path d="M-125 -10 Q-130 -150 0 -158 Q130 -150 125 -10 Q120 110 0 118 Q-120 110 -125 -10 Z" fill={SKIN} stroke={INK} strokeWidth={8} />
        <path d="M60 -140 Q130 -100 122 10 Q118 90 40 112 Q100 40 60 -140 Z" fill={SKIN2} />
        <path d="M-135 -60 L-120 -130 L-95 -110 L-80 -175 L-45 -135 L-20 -190 L10 -140 L40 -185 L60 -135 L95 -165 L105 -110 L135 -120 L125 -55 Q60 -120 0 -110 Q-70 -110 -135 -60 Z" fill="#2b2118" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <g transform="translate(0 -20)"><Eyes t={t} mood={mood} look={look} /></g>
        <path d="M-8 20 q14 18 -4 26" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
        <g transform="translate(0 70)"><Mouth open={talk} mood={mood} /></g>
      </g>
    </g>
  );
};

const BrainGuy: React.FC<{x: number; y: number; s?: number; t: number; mood?: Mood; talk?: number; point?: boolean}> = ({x, y, s = 1, t, mood = 'smug', talk = 0, point}) => {
  const bob = Math.sin(t * 2.6) * 14;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`}>
      <ellipse cx={0} cy={210} rx={90} ry={16} fill="rgba(0,0,0,0.18)" />
      <path d={`M-150 40 Q-210 70 -230 ${point ? -40 : 120}`} stroke={INK} strokeWidth={12} fill="none" strokeLinecap="round" />
      <path d={`M150 40 Q220 ${point ? -20 : 60} ${point ? 260 : 230} ${point ? -60 : 120}`} stroke={INK} strokeWidth={12} fill="none" strokeLinecap="round" />
      <path d="M-170 40 C-230 -60 -160 -170 -60 -165 C-30 -215 60 -215 90 -165 C190 -170 240 -60 175 40 C190 120 110 165 0 158 C-110 165 -190 120 -170 40 Z" fill="#ff9ebb" stroke={INK} strokeWidth={9} />
      <path d="M90 -160 C190 -150 230 -50 175 40 C190 120 110 165 40 158 C140 100 170 -40 90 -160 Z" fill="#f07a9c" />
      <path d="M-120 -90 q40 -30 70 10 M40 -130 q50 -10 70 40 M-150 30 q30 -40 70 -10 M110 80 q-30 -40 -70 -10 M-60 110 q30 -30 70 0" stroke="#d65d82" strokeWidth={8} fill="none" strokeLinecap="round" />
      <g transform="translate(0 -40)"><Eyes t={t + 1.3} mood={mood} r={44} gap={46} /></g>
      <g transform="translate(0 60)"><Mouth open={talk} mood={mood === 'smug' ? 'happy' : mood} w={70} /></g>
    </g>
  );
};

// ---------- backgrounds ----------
const Elevator: React.FC<{t: number}> = ({t}) => (
  <>
    <rect x={0} y={0} width={1080} height={1920} fill="#aab4bf" />
    {[0, 1, 2, 3].map((k) => <rect key={k} x={40 + k * 255} y={520} width={235} height={1180} fill="#c3ccd5" stroke="#7b8794" strokeWidth={6} />)}
    <rect x={0} y={1700} width={1080} height={220} fill="#6b7280" />
    <rect x={380} y={520} width={320} height={90} rx={10} fill={INK} />
    <Txt x={540} y={585} s={60} c="#ff4d4d">{`▲ ${(Math.floor(t * 2) % 9) + 1}F`}</Txt>
    <g transform="translate(540 680)"><circle r={60} fill="#5a6470" stroke={INK} strokeWidth={6} />{[0, 1, 2].map((k) => <circle key={k} r={15 + k * 15} fill="none" stroke={INK} strokeWidth={4} />)}</g>
    {[0, 1, 2, 3, 4, 5].map((k) => {
      const p = (t * 0.7 + k / 6) % 1;
      return <Txt key={k} x={540 + Math.sin(p * 9 + k) * 260} y={760 + p * 600} s={90} c={['#9b5de5', '#00bb7e', '#f15bb5'][k % 3]} o={1 - p} stroke>{k % 2 ? '♪' : '♫'}</Txt>;
    })}
  </>
);
const Bathroom: React.FC<{t: number; curtain?: boolean}> = ({t, curtain = true}) => (
  <>
    <rect x={0} y={0} width={1080} height={1920} fill="#bde0fe" />
    {[...Array(12)].map((_, r) => [...Array(7)].map((__, c) => <rect key={`${r}-${c}`} x={c * 160} y={480 + r * 120} width={156} height={116} fill="#a2d2ff" stroke="#8ecae6" strokeWidth={4} />))}
    <rect x={0} y={1720} width={1080} height={200} fill="#8ecae6" />
    <rect x={60} y={500} width={960} height={14} rx={7} fill="#adb5bd" stroke={INK} strokeWidth={4} />
    {curtain ? <path d={`M60 514 ${[...Array(12)].map((_, k) => `Q${100 + k * 80} ${560 + (k % 2) * 40 + Math.sin(t * 2 + k) * 8} ${140 + k * 80} 514`).join(' ')} L1020 1700 L60 1700 Z`} fill="#ffafcc" stroke={INK} strokeWidth={6} opacity={0.95} /> : null}
    {curtain ? [...Array(6)].map((_, k) => <line key={k} x1={150 + k * 150} y1={540} x2={150 + k * 150} y2={1700} stroke="#ff8fab" strokeWidth={30} opacity={0.6} />) : null}
    {[...Array(6)].map((_, k) => { const p = (t * 0.3 + k / 6) % 1; return <circle key={k} cx={200 + k * 140} cy={1000 - p * 500} r={60 + p * 40} fill={W} opacity={0.35 * (1 - p)} />; })}
  </>
);
const Living: React.FC<{t: number; tv?: React.ReactNode}> = ({t, tv}) => (
  <>
    <rect x={0} y={0} width={1080} height={1920} fill="#f4d6a0" />
    <path d="M760 0 L1080 0 L1080 1500 L760 1500 Z" fill="#e8c48a" />
    <rect x={0} y={1560} width={1080} height={360} fill="#a0522d" />
    {[...Array(6)].map((_, k) => <line key={k} x1={0} y1={1600 + k * 60} x2={1080} y2={1600 + k * 60} stroke="#8b4513" strokeWidth={4} />)}
    <g transform="translate(110 560)">
      <rect x={0} y={0} width={300} height={360} fill="#1d3557" stroke={INK} strokeWidth={10} />
      <circle cx={210} cy={90} r={40} fill="#fff3b0" />
      <path d="M150 0 V360 M0 180 H300" stroke={INK} strokeWidth={8} />
    </g>
    <g transform="translate(940 820)">
      <path d="M-70 0 L70 0 L40 -110 L-40 -110 Z" fill="#ffd166" stroke={INK} strokeWidth={6} />
      <rect x={-8} y={0} width={16} height={700} fill={INK} />
      <path d="M-120 -10 L-200 500 L200 500 L120 -10 Z" fill="rgba(255,240,180,0.18)" />
    </g>
    {tv ? <g transform="translate(560 640)">{tv}</g> : (
      <g transform="translate(560 620)">
        <rect x={-10} y={0} width={180} height={230} fill="#90be6d" stroke={INK} strokeWidth={6} />
        <rect x={20} y={30} width={120} height={170} fill="#f9c74f" stroke={INK} strokeWidth={5} />
      </g>
    )}
    <g transform="translate(540 1500)">
      <rect x={-460} y={-170} width={920} height={200} rx={50} fill="#c0504d" stroke={INK} strokeWidth={8} />
      <rect x={-500} y={-60} width={1000} height={150} rx={40} fill="#d9604f" stroke={INK} strokeWidth={8} />
      <rect x={-520} y={-130} width={90} height={230} rx={40} fill="#c0504d" stroke={INK} strokeWidth={8} />
      <rect x={430} y={-130} width={90} height={230} rx={40} fill="#c0504d" stroke={INK} strokeWidth={8} />
    </g>
  </>
);
const Sepia: React.FC<{children: React.ReactNode}> = ({children}) => <g style={{filter: 'sepia(0.75) contrast(1.05)'}}>{children}</g>;

// ---------- scenes ----------
const Scene: React.FC<{i: number; u: number; d: number; L: Lx; B: Beat[]; talk: number; t: number}> = ({i, u, d, L, B, talk, t}) => {
  const svg = (c: React.ReactNode) => <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{c}</svg>;
  const uu = Math.max(0, u);
  const zh = L.jay === '阿杰';
  const jt = B[i].who === 'jay' ? talk : 0;
  const bt = B[i].who === 'brain' ? talk : 0;
  if (i === 0) {
    return svg(
      <>
        <Elevator t={t} />
        <Jay x={540} y={1380} s={1.25} t={t} mood="angry" talk={jt} pose="ears" />
      </>,
    );
  }
  if (i === 1 || i === 2) {
    const card = i === 1 ? clamp(1 - (uu - 0.6) / 0.25) : 0;
    const open = i === 2;
    return svg(
      <>
        <Bathroom t={t} curtain={!open} />
        {!open ? (
          <>
            <g transform="translate(540 1040)"><Jay x={0} y={0} s={1.1} t={t} mood="happy" talk={0.3 + 0.5 * Math.abs(Math.sin(t * 6))} pose="shower" look={Math.sin(t)} /></g>
            {[0, 1, 2, 3].map((k) => { const p = (t * 0.6 + k / 4) % 1; return <Txt key={k} x={700 + p * 250} y={760 - p * 260} s={80} c="#7209b7" o={1 - p} stroke>{k % 2 ? '♪' : '♫'}</Txt>; })}
          </>
        ) : (
          <Jay x={540} y={1360} s={1.2} t={t} mood="shock" talk={jt} pose="towel" />
        )}
        {card > 0 ? (
          <g opacity={card}>
            <rect x={0} y={0} width={1080} height={1920} fill={INK} />
            <Txt x={540} y={1010} s={130} c={W}>{L.later}</Txt>
          </g>
        ) : null}
      </>,
    );
  }
  if (i === 3) {
    const pop = outBack(clamp((uu - 0.1) / 0.4));
    return svg(
      <>
        <Living t={t} />
        <Jay x={330} y={1360} s={1.05} t={t} mood="shock" talk={jt} />
        <g transform={`translate(0 ${(1 - pop) * 300})`} opacity={clamp(pop * 2)}>
          <BrainGuy x={760} y={900} s={0.95 * pop} t={t} mood="smug" talk={bt} point />
        </g>
        {uu < 0.6 ? <Txt x={500} y={930} s={110} c={Y} o={1 - uu / 0.6} stroke>POP!</Txt> : null}
      </>,
    );
  }
  if (i === 4) {
    const chars = ['福', '佳', '美', '道', '和'];
    const counts = [25, 10, 5, 2, 1];
    return svg(
      <Sepia>
        <rect x={0} y={0} width={1080} height={1920} fill="#e9d8a6" />
        <rect x={80} y={520} width={920} height={620} rx={12} fill="#2d4739" stroke="#8b5e34" strokeWidth={22} />
        <Txt x={540} y={610} s={56} c="#f1faee">{L.y1968}</Txt>
        {chars.map((c, k) => {
          const on = clamp((uu - 0.4 - k * 0.45) / 0.3);
          return (
            <g key={k} opacity={on} transform={`translate(${180 + k * 180} 820)`}>
              <Txt x={0} y={20} s={110} c="#f1faee">{c}</Txt>
              <Txt x={0} y={110} s={40} c={Y}>{`×${counts[k]}`}</Txt>
              <Txt x={0} y={240} s={70} c={k < 2 ? '#2a9d8f' : '#e76f51'}>{k < 2 ? '☺' : k < 4 ? '😐' : '☹'}</Txt>
            </g>
          );
        })}
        <BrainGuy x={820} y={1480} s={0.75} t={t} mood="smug" talk={bt} />
        <g transform="translate(300 1480)"><rect x={-130} y={-60} width={260} height={360} rx={20} fill="#b08968" stroke={INK} strokeWidth={6} /><Txt x={0} y={60} s={90}>🧑‍🔬</Txt></g>
      </Sepia>,
    );
  }
  if (i === 5) {
    const k = outBack(clamp((uu - 0.2) / 0.35));
    return svg(
      <>
        <Living t={t} />
        <Jay x={250} y={1400} s={0.9} t={t} mood="think" talk={0} pose="sit" />
        <BrainGuy x={700} y={1050} s={1.05} t={t} mood="happy" talk={bt} point />
        <g transform={`translate(540 760) rotate(-3) scale(${k})`}>
          <rect x={-400} y={-70} width={800} height={130} rx={30} fill={W} stroke={INK} strokeWidth={8} />
          <Txt x={0} y={20} s={zh ? 60 : 52} c={INK}>{L.ask}</Txt>
        </g>
      </>,
    );
  }
  if (i === 6) {
    return svg(
      <>
        <Living t={t} />
        <Jay x={400} y={1360} s={1.15} t={t} mood="think" talk={jt} pose="point" look={1} />
        <BrainGuy x={860} y={880} s={0.7} t={t} mood="smug" talk={0} />
      </>,
    );
  }
  if (i === 7) {
    const flash = Math.floor(uu * 7) % 3 === 0;
    return svg(
      <>
        <rect x={0} y={0} width={1080} height={1920} fill="#1b263b" />
        <g transform="translate(540 900)">
          <rect x={-380} y={-260} width={760} height={500} rx={30} fill="#0d1b2a" stroke={INK} strokeWidth={14} />
          <rect x={-350} y={-230} width={700} height={440} rx={16} fill={flash ? W : '#0d1b2a'} />
          {flash ? <polygon points="0,-140 120,80 -120,80" fill="#e63946" /> : null}
          <rect x={-170} y={250} width={340} height={40} fill="#415a77" />
          <Txt x={0} y={-290} s={60} c={Y} stroke>{L.ms}</Txt>
        </g>
        <Jay x={300} y={1540} s={0.85} t={t} mood="shock" talk={0} />
        <BrainGuy x={800} y={1450} s={0.75} t={t} mood="smug" talk={bt} />
      </>,
    );
  }
  if (i === 8) {
    const n = 1 + (Math.floor(uu * 6) % 9);
    return svg(
      <>
        <Living t={t} tv={(
          <g>
            <rect x={-260} y={-40} width={520} height={360} rx={20} fill={INK} />
            <rect x={-235} y={-15} width={470} height={290} fill={n % 2 ? '#ef476f' : '#06d6a0'} />
            <Txt x={0} y={140} s={84} c={W} stroke>{L.ad}</Txt>
            <Txt x={150} y={240} s={46} c={Y} stroke>{`×${n * 11}`}</Txt>
          </g>
        )} />
        <Jay x={330} y={1360} s={1.1} t={t} mood="shock" talk={jt} pose="point" />
      </>,
    );
  }
  const q = outBack(clamp((uu - 0.3) / 0.35));
  return svg(
    <>
      <Living t={t} />
      <Jay x={290} y={1380} s={1.0} t={t} mood="think" talk={0} />
      <BrainGuy x={770} y={1040} s={0.95} t={t} mood="happy" talk={bt} point />
      <g transform={`translate(540 740) scale(${q})`}>
        <rect x={-440} y={-80} width={880} height={150} rx={40} fill={Y} stroke={INK} strokeWidth={8} />
        <Txt x={0} y={22} s={zh ? 62 : 50} c={INK}>{L.q}</Txt>
      </g>
    </>,
  );
};

const Captions: React.FC<{t: number; B: Beat[]; zh: boolean; L: Lx}> = ({t, B, zh, L}) => {
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
  const who = B[bi].who;
  const tag = who === 'jay' ? L.jay : L.brain;
  const tc = who === 'jay' ? '#3a9d5d' : '#f07a9c';
  return (
    <div style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{fontSize: 34, fontWeight: 900, color: W, background: tc, padding: '2px 18px', borderRadius: 12, border: `4px solid ${INK}`, marginBottom: -8, zIndex: 1}}>{tag}</div>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: zh ? 0 : 16, maxWidth: 960, padding: '14px 30px', borderRadius: 26, background: W, border: `6px solid ${INK}`, fontWeight: 900, fontSize: zh ? 64 : 56, lineHeight: 1.2}}>
        {groups[g].map(([w, s], k) => (
          <span key={k} style={{whiteSpace: 'nowrap', color: t >= s ? (t < s + 0.45 ? '#e63946' : INK) : 'rgba(22,18,28,0.35)'}}>{w}</span>
        ))}
      </div>
    </div>
  );
};

const sfxFor = (B: Beat[], zh: boolean) => {
  const S: {at: number; f: string; v: number}[] = [{at: 0.05, f: 'boom', v: 0.3}];
  for (let t0 = 0.2; t0 < B[1].start; t0 += 0.35) S.push({at: t0, f: 'tick', v: 0.25});
  S.push({at: B[1].start, f: 'whip', v: 0.4}, {at: B[1].start + 0.7, f: 'lowswoosh', v: 0.4});
  S.push({at: B[2].start + 0.05, f: 'boom', v: 0.3});
  S.push({at: B[3].start + 0.1, f: 'pop', v: 0.5}, {at: B[3].start + 0.15, f: 'highswoosh', v: 0.35});
  for (let k = 0; k < 5; k++) S.push({at: B[4].start + 0.4 + k * 0.45, f: 'pop', v: 0.3});
  S.push({at: B[5].start + 0.2, f: 'pop', v: 0.4});
  S.push({at: B[6].start + 0.05, f: 'click', v: 0.9});
  for (let k = 0; k < 8; k++) S.push({at: B[7].start + k * 0.43, f: 'tick', v: 0.3});
  for (let k = 0; k < 5; k++) S.push({at: B[8].start + k * 0.33, f: 'ding', v: 0.15});
  S.push({at: B[9].start + 0.3, f: 'chime', v: 0.3});
  return S;
};

export const Song: React.FC<{lang: 'en' | 'zh'}> = ({lang}) => {
  useFont();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const B = (lang === 'zh' ? ZH : EN) as Beat[];
  const ENV = (lang === 'zh' ? ENV_ZH : ENV_EN) as number[];
  const L = T[lang];
  const zh = lang === 'zh';
  const END = total(B);
  let i = B.findIndex((b) => t < b.start + b.dur);
  if (i < 0) i = B.length - 1;
  const b = B[i];
  const u = t - b.start;
  const amp = ENV[Math.min(ENV.length - 1, frame)] ?? 0;
  const talk = amp > 0.12 ? clamp((amp - 0.12) * 2.2) : 0;
  const cut = i === 0 ? 1 : clamp(u / 0.18);
  const fade = clamp((t - (END - 0.8)) / 0.7);
  const SFX = sfxFor(B, zh);
  return (
    <AbsoluteFill style={{fontFamily: F, color: W, overflow: 'hidden', background: INK}}>
      <AbsoluteFill style={{opacity: cut, transform: `scale(${1.04 + clamp(u / b.dur) * 0.05})`, transformOrigin: '50% 70%'}}>
        <Scene i={i} u={u} d={b.dur} L={L} B={B} talk={talk} t={t} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,8,20,0.75) 0%, rgba(10,8,20,0.35) 26%, rgba(10,8,20,0) 40%)'}} />
      {i === 0 ? (
        <div style={{position: 'absolute', top: 140, left: 50, right: 50, textAlign: 'center', fontWeight: 900, fontSize: zh ? 96 : 80, lineHeight: 1.32, color: W, textShadow: [[-4, -4], [4, -4], [-4, 4], [4, 4], [0, 5], [0, -5], [5, 0], [-5, 0], [0, 10]].map(([a, b]) => `${a}px ${b}px 0 ${INK}`).join(', ')}}>
          {L.hook.map((line, k) => (
            <div key={k}>
              {k === L.hl ? <span style={{display: 'inline-block', marginTop: 12, background: Y, color: INK, padding: '0 22px', borderRadius: 16, border: `6px solid ${INK}`, textShadow: 'none', transform: `rotate(-2deg)`}}>{line}</span> : line}
            </div>
          ))}
        </div>
      ) : (
        <>
          {b.top ? (
            <div style={{position: 'absolute', top: 175, left: 0, right: 0, textAlign: 'center'}}>
              <span style={{display: 'inline-block', fontSize: 50, fontWeight: 900, color: INK, background: Y, padding: '4px 28px', borderRadius: 14, border: `5px solid ${INK}`, transform: `rotate(-2deg) scale(${outBack(clamp(u / 0.3))})`}}>{b.top}</span>
            </div>
          ) : null}
          <Captions t={t} B={B} zh={zh} L={L} />
        </>
      )}
      {b.src ? <div style={{position: 'absolute', bottom: 50, left: 0, right: 0, textAlign: 'center', fontSize: 30, fontWeight: 800, color: W, textShadow: `0 2px 8px ${INK}`}}>{L.src}{b.src}</div> : null}
      <div style={{position: 'absolute', top: 70, left: 60, fontSize: 30, fontWeight: 900, color: W, letterSpacing: 4}}>
        {L.brand[0]}<span style={{background: Y, color: INK, padding: '0 8px', borderRadius: 6, marginLeft: 6}}>{L.brand[1]}</span>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
      <Audio src={staticFile(`song/${lang}-voice.wav`)} />
      {B.slice(1).map((bb, k) => (
        <Sequence key={k} from={Math.max(0, Math.round((bb.start - 0.15) * fps))} durationInFrames={Math.round(0.7 * fps)}>
          <Audio src={staticFile('sfx/whoosh.wav')} volume={0.35} />
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
