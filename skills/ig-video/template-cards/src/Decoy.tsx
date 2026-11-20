import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFont} from './Cards';
import {clamp, inOut, outBack} from './Spec';
import EN from './decoy-en.json';
import ZH from './decoy-zh.json';

// The decoy effect as a colourful story: Leo / 小林 at the cinema counter, then the
// Economist subscription test. Every scene has its own bright background, a
// character who reacts, and something new on screen every ~1 s.
// Huber, Payne & Puto 1982 · Ariely 2008 (Economist demo: 16/0/84 → 68/32).

type Beat = {say: string; top: string; src?: string; start: number; dur: number; words: [string, number, number][]};
const total = (b: Beat[]) => b[b.length - 1].start + b[b.length - 1].dur;
export const DECOY_EN_FRAMES = Math.ceil(total(EN as Beat[]) * 30);
export const DECOY_ZH_FRAMES = Math.ceil(total(ZH as Beat[]) * 30);

const Y = '#ffd23f';
const W = '#ffffff';
const INK = '#1b1424';
const RED = '#ff4d6d';
const GREEN = '#3ddc84';
const F = '"Noto Sans SC", sans-serif';

const BG: [string, string][] = [
  ['#9b1237', '#2a0614'], // 0 cinema
  ['#c2410c', '#4a0d0d'], // 1 counter
  ['#7b2cbf', '#240046'], // 2 thought
  ['#0b3d3a', '#020f0e'], // 3 reveal (spotlight)
  ['#2b9348', '#0b3d1b'], // 4 steal
  ['#1d70d6', '#0b2350'], // 5 magazine
  ['#f77f00', '#5a2300'], // 6 chart
  ['#00a896', '#013a33'], // 7 fix
  ['#ff5d8f', '#5a0a2a'], // 8 share
];

const T = {
  en: {
    hook: ['Why do you always', 'buy the LARGE', 'popcorn?'], hl: 2, name: 'Leo',
    sizes: ['Small', 'Medium', 'Large'], prices: ['$5', '$8.50', '$9'], more: '+50¢', bait: 'DECOY', steal: 'STEAL!',
    ask: 'Comment 1 if you fell for it', mags: ['Online', 'Print', 'Print + Online'], mprice: ['$59', '$125', '$125'],
    combo: 'Combo', online: 'Online only', q: 'Without the middle one…', q2: 'would I still buy it?', share: 'Send to them',
    brand: ['Brain', 'Manual'], src: 'Research: ', nobody: 'nobody',
  },
  zh: {
    hook: ['每次看电影', '为什么你总会买', '大桶爆米花？'], hl: 2, name: '小林',
    sizes: ['小桶', '中桶', '大桶'], prices: ['¥15', '¥28', '¥30'], more: '+2元', bait: '诱饵', steal: '超值！',
    ask: '被骗过？评论区打1', mags: ['电子版', '纸质版', '电子+纸质'], mprice: ['59', '125', '125'],
    combo: '套餐', online: '只要电子版', q: '要是没有中间那个…', q2: '我还买吗？', share: '转给TA',
    brand: ['脑子', '说明书'], src: '研究：', nobody: '没人选',
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

// Leo / 小林: round head, yellow hoodie, expressive face.
const Leo: React.FC<{x: number; y: number; s?: number; mood?: 'happy' | 'wow' | 'think' | 'shock'; t: number; jump?: number; flip?: boolean}> = ({x, y, s = 1, mood = 'happy', t, jump = 0, flip}) => {
  const bob = Math.sin(t * 5) * 6 - jump * 60;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${flip ? -s : s} ${s})`}>
      <ellipse cx={0} cy={250} rx={110} ry={18} fill="rgba(0,0,0,0.25)" />
      <path d="M-95 240 L-80 60 Q0 20 80 60 L95 240 Z" fill={Y} stroke={INK} strokeWidth={8} />
      <path d="M-80 90 L-140 170" stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d={mood === 'wow' || mood === 'shock' ? 'M80 90 L150 0' : 'M80 90 L140 170'} stroke={INK} strokeWidth={14} strokeLinecap="round" />
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

const Scene: React.FC<{i: number; u: number; d: number; L: Lx; B: Beat[]}> = ({i, u, d, L, B}) => {
  const svg = (c: React.ReactNode) => <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{c}</svg>;
  const uu = Math.max(0, u);
  const at = (sub: string, fb = 1) => say(B, i, sub, fb);
  const zh = L.name === '小林';
  if (i === 0) {
    const kernels = [...Array(10)].map((_, k) => {
      const p = ((uu * 0.9 + k * 0.137) % 1);
      return <circle key={k} cx={540 + Math.sin(k * 7) * 260 * p} cy={1180 - p * 520 + p * p * 300} r={26} fill="#fff6d6" stroke="#e8c76a" strokeWidth={4} opacity={1 - p * 0.6} />;
    });
    return svg(
      <>
        <Bulbs t={uu} />
        {kernels}
        <g transform={`translate(0 ${Math.sin(uu * 6) * 10})`}>
          <Bucket x={540} y={1420} s={2.1} t={uu} />
        </g>
      </>,
    );
  }
  if (i === 1) {
    const ks = [at(L.sizes[0] === 'Small' ? 'small' : '小桶', 0.6), at(zh ? '中桶' : 'medium', 1.6), at(zh ? '大桶' : 'large', 2.6)];
    return svg(
      <>
        <path d="M0 0 Q120 500 60 1920 L0 1920 Z" fill="#7f1d1d" stroke="#5a0f0f" strokeWidth={6} />
        <path d="M1080 0 Q960 500 1020 1920 L1080 1920 Z" fill="#7f1d1d" stroke="#5a0f0f" strokeWidth={6} />
        <rect x={120} y={700} width={840} height={560} rx={30} fill="#2b0f0f" stroke={Y} strokeWidth={8} style={glow('rgba(255,210,63,0.6)', 20)} />
        {[0, 1, 2].map((j) => {
          const k = clamp((uu - ks[j]) / 0.35);
          return (
            <g key={j} opacity={k} transform={`translate(${280 + j * 260} ${960}) scale(${outBack(k)})`}>
              <Bucket x={0} y={0} s={0.55 + j * 0.15} t={uu} />
              <Txt x={0} y={-130 - j * 20} s={40} c={Y}>{L.sizes[j]}</Txt>
              <g transform="translate(0 200)">
                <rect x={-80} y={-44} width={160} height={70} rx={16} fill={W} stroke={INK} strokeWidth={5} />
                <Txt x={0} y={8} s={40} c={INK}>{L.prices[j]}</Txt>
              </g>
            </g>
          );
        })}
        <rect x={60} y={1360} width={960} height={40} rx={10} fill="#5a2a0a" />
        <Leo x={540} y={1560} s={0.9} t={uu} mood={uu > ks[2] ? 'think' : 'happy'} />
      </>,
    );
  }
  if (i === 2) {
    const plus = clamp((uu - at(zh ? '多2块' : 'fifty', 1.0)) / 0.4);
    const big = clamp((uu - at(zh ? '大桶！' : 'easy', 2.2)) / 0.4);
    const big2 = zh ? clamp((uu - (d - 1.4)) / 0.4) : clamp((uu - at('large', d - 1)) / 0.4);
    const go = Math.max(big, big2);
    return svg(
      <>
        {[...Array(14)].map((_, k) => <circle key={k} cx={(k * 173) % 1080} cy={300 + ((k * 331 + uu * 120) % 1500)} r={8 + (k % 4) * 4} fill="#c77dff" opacity={0.5} />)}
        <Bubble x={600} y={980} w={720} h={380} tail={[-200, 300]} k={clamp(uu / 0.4)}>
          <g transform="translate(-170 40) scale(0.6)"><Bucket x={0} y={0} t={uu} label={L.sizes[1]} /></g>
          <g transform={`translate(150 30) scale(${0.7 + go * 0.25})`}><Bucket x={0} y={0} t={uu} label={L.sizes[2]} /></g>
          <g transform={`translate(0 -120) scale(${outBack(plus)})`} opacity={plus}>
            <rect x={-110} y={-50} width={220} height={90} rx={45} fill={GREEN} stroke={INK} strokeWidth={6} />
            <Txt x={0} y={15} s={52} c={INK}>{L.more}</Txt>
          </g>
        </Bubble>
        <Leo x={300} y={1560} s={0.9} t={uu} mood={go > 0 ? 'wow' : 'think'} jump={go * Math.abs(Math.sin(uu * 8))} />
        {go > 0 ? [...Array(18)].map((_, k) => <rect key={k} x={200 + (k * 97) % 700} y={600 + ((k * 61 + (uu - 2) * 500) % 1100)} width={22} height={34} fill={[Y, RED, GREEN, '#4cc9f0'][k % 4]} transform={`rotate(${k * 37 + uu * 200} ${200 + (k * 97) % 700} ${600 + ((k * 61 + (uu - 2) * 500) % 1100)})`} />) : null}
      </>,
    );
  }
  if (i === 3) {
    const hookY = 560 + inOut(clamp(uu / 1.2)) * 300;
    const stamp = clamp((uu - at(zh ? '诱饵' : 'decoy', 2.4)) / 0.3);
    return svg(
      <>
        <path d="M540 0 L180 1900 L900 1900 Z" fill="rgba(255,255,220,0.10)" />
        <line x1={540} y1={0} x2={540} y2={hookY - 140} stroke="#cfd8dc" strokeWidth={4} />
        <path d={`M540 ${hookY - 140} v40 a30 30 0 1 1 -40 30`} stroke="#cfd8dc" strokeWidth={8} fill="none" />
        <g transform={`translate(540 ${hookY + 40}) rotate(${Math.sin(uu * 3) * 6})`}>
          <Bucket x={0} y={0} s={1.2} t={uu} label={L.sizes[1]} />
        </g>
        <g transform={`translate(540 ${hookY + 40}) rotate(-12) scale(${1 + (1 - stamp) * 1.2})`} opacity={stamp}>
          <rect x={-230} y={-80} width={460} height={150} rx={18} fill="none" stroke={RED} strokeWidth={12} />
          <Txt x={0} y={30} s={100} c={RED} stroke={false}>{L.bait}</Txt>
        </g>
        <Leo x={860} y={1560} s={0.75} t={uu} mood={stamp > 0 ? 'shock' : 'think'} flip />
      </>,
    );
  }
  if (i === 4) {
    const tilt = inOut(clamp((uu - 0.4) / 1.2));
    const steal = clamp((uu - at(zh ? '超值' : 'steal', 2.2)) / 0.4);
    const ask = outBack(clamp((uu - at(zh ? '评论区' : 'comment', d - 1.2)) / 0.4));
    return svg(
      <>
        <g transform="translate(540 1080)">
          <path d="M-40 360 L40 360 L0 0 Z" fill={INK} />
          <g transform={`rotate(${-12 * tilt})`}>
            <rect x={-380} y={-10} width={760} height={20} rx={10} fill={INK} />
            <g transform="translate(-300 -150)"><Bucket x={0} y={0} s={0.7} t={uu} label={L.sizes[1]} price={L.prices[1]} /></g>
            <g transform="translate(300 -170)"><Bucket x={0} y={0} s={0.85} t={uu} label={L.sizes[2]} price={L.prices[2]} hi={steal > 0} /></g>
          </g>
        </g>
        <g transform={`translate(760 640) rotate(8) scale(${outBack(steal)})`} opacity={steal}>
          <rect x={-200} y={-70} width={400} height={130} rx={65} fill={Y} stroke={INK} strokeWidth={8} style={glow(Y, 30)} />
          <Txt x={0} y={22} s={68} c={INK}>{L.steal}</Txt>
        </g>
        <g transform={`translate(540 1660) rotate(-3) scale(${ask})`}>
          <rect x={-410} y={-70} width={820} height={130} rx={40} fill={W} stroke={INK} strokeWidth={8} />
          <Txt x={0} y={20} s={56} c={INK}>{L.ask}</Txt>
        </g>
      </>,
    );
  }
  if (i === 5) {
    const ks = [at(zh ? '电子版' : 'online', 2), at(zh ? '纸质版' : 'print', 3.5), at(zh ? '电子加纸质' : 'plus', 5)];
    const stand = clamp(uu / 0.5);
    return svg(
      <>
        <g opacity={stand}>
          <path d="M100 760 L540 600 L980 760 Z" fill={RED} stroke={INK} strokeWidth={8} />
          {[0, 1, 2, 3, 4, 5, 6].map((k) => <path key={k} d={`M${100 + k * 125} 760 q62 60 125 0`} fill={k % 2 ? W : RED} stroke={INK} strokeWidth={5} />)}
        </g>
        {[0, 1, 2].map((j) => {
          const k = clamp((uu - ks[j] + 0.1) / 0.35);
          const x = 220 + j * 320;
          return (
            <g key={j} transform={`translate(${x} 1150) scale(${outBack(k)}) rotate(${(j - 1) * 4})`} opacity={k}>
              <rect x={-140} y={-210} width={280} height={380} rx={20} fill={W} stroke={INK} strokeWidth={8} />
              <rect x={-140} y={-210} width={280} height={90} rx={20} fill={['#4cc9f0', '#f72585', Y][j]} stroke={INK} strokeWidth={8} />
              <Txt x={0} y={-150} s={j === 2 && zh ? 38 : 40} c={INK}>{L.mags[j]}</Txt>
              <path d="M-100 -80 h200 M-100 -40 h160 M-100 0 h190" stroke="#c9c9c9" strokeWidth={10} strokeLinecap="round" />
              <Txt x={0} y={120} s={72} c={INK}>{zh ? `$${L.mprice[j]}` : L.mprice[j]}</Txt>
            </g>
          );
        })}
        <Leo x={540} y={1620} s={0.7} t={uu} mood="think" />
      </>,
    );
  }
  if (i === 6) {
    const a = clamp((uu - 0.2) / 0.8);
    const cut = clamp((uu - at(zh ? '删掉' : 'remove', 2.2)) / 0.4);
    const drop = clamp((uu - at('32', d - 1.2)) / 0.8);
    const combo = 84 - 52 * drop;
    const online = 16 + 52 * drop;
    const bar = (x: number, v: number, c: string, lab: string) => (
      <g>
        <rect x={x - 90} y={1450 - v * 8} width={180} height={v * 8} rx={18} fill={c} stroke={INK} strokeWidth={6} />
        <Txt x={x} y={1430 - v * 8} s={64} c={W} stroke>{`${Math.round(v)}%`}</Txt>
        <Txt x={x} y={1520} s={42} c={W} stroke>{lab}</Txt>
      </g>
    );
    return svg(
      <>
        <g opacity={a}>
          {bar(300, online * a, '#4cc9f0', L.online)}
          {bar(780, combo * a, Y, L.combo)}
        </g>
        <g transform="translate(540 640)" opacity={a * (1 - drop)}>
          <rect x={-150} y={-60} width={300} height={120} rx={20} fill={W} stroke={INK} strokeWidth={6} />
          <Txt x={0} y={-5} s={38} c={INK}>{L.mags[1]} 125</Txt>
          <Txt x={0} y={40} s={30} c="#888">{`0% · ${L.nobody}`}</Txt>
          <path d={`M-170 -70 L${-170 + 340 * cut} ${-70 + 140 * cut}`} stroke={RED} strokeWidth={14} strokeLinecap="round" />
        </g>
        <Leo x={540} y={1700} s={0.55} t={uu} mood={drop > 0.5 ? 'shock' : 'think'} />
      </>,
    );
  }
  if (i === 7) {
    const fade = clamp((uu - 1.0) / 0.6);
    const q = clamp((uu - at(zh ? '问问自己' : 'ask', d * 0.5)) / 0.4);
    return svg(
      <>
        {[0, 1, 2].map((j) => (
          <g key={j} opacity={j === 1 ? 1 - fade * 0.85 : 1} transform={`translate(${250 + j * 290} 860) scale(${j === 1 ? 1 - fade * 0.2 : 0.9})`}>
            <Bucket x={0} y={0} s={0.65 + j * 0.12} t={uu} />
            {j === 1 && fade > 0 ? <Txt x={0} y={20} s={160} c={RED} stroke>?</Txt> : null}
          </g>
        ))}
        <g transform={`translate(540 1300) scale(${outBack(q)})`} opacity={q}>
          <rect x={-450} y={-130} width={900} height={250} rx={40} fill={W} stroke={INK} strokeWidth={8} style={glow('rgba(255,255,255,0.5)', 24)} />
          <Txt x={0} y={-25} s={56} c={INK}>{L.q}</Txt>
          <Txt x={0} y={65} s={64} c="#0a7c6f">{L.q2}</Txt>
        </g>
        <Leo x={540} y={1690} s={0.6} t={uu} mood={q > 0 ? 'think' : 'happy'} />
      </>,
    );
  }
  const k = outBack(clamp(uu / 0.5));
  return svg(
    <>
      <g transform={`translate(640 1150) scale(${k})`}>
        <rect x={-170} y={-300} width={340} height={600} rx={50} fill={INK} stroke={W} strokeWidth={10} />
        <rect x={-140} y={-260} width={280} height={520} rx={30} fill="#4cc9f0" />
        <path d="M-60 40 L60 -40 M60 -40 L20 -50 M60 -40 L52 0" stroke={W} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${Math.sin(uu * 4) * 8})`} />
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
  const S: {at: number; f: string; v: number}[] = [{at: 0.05, f: 'boom', v: 0.3}];
  const A = (bi: number, sub: string, fb: number) => B[bi].start + say(B, bi, sub, fb);
  for (let t0 = 0.3; t0 < B[1].start; t0 += 0.45) S.push({at: t0, f: 'pop', v: 0.14});
  [zh ? '小桶' : 'small', zh ? '中桶' : 'medium', zh ? '大桶' : 'large'].forEach((w, j) => S.push({at: A(1, w, 0.6 + j), f: 'pop', v: 0.35}));
  S.push({at: A(2, zh ? '多2块' : 'fifty', 1), f: 'ding', v: 0.3});
  S.push({at: A(2, zh ? '大桶！' : 'easy', 2.2), f: 'chime', v: 0.25});
  S.push({at: B[3].start + 0.1, f: 'lowswoosh', v: 0.4}, {at: A(3, zh ? '诱饵' : 'decoy', 2.4), f: 'boom', v: 0.45}, {at: A(3, zh ? '诱饵' : 'decoy', 2.4), f: 'whip', v: 0.35});
  S.push({at: B[4].start + 0.4, f: 'rswoosh', v: 0.3}, {at: A(4, zh ? '超值' : 'steal', 2.2), f: 'ding', v: 0.3}, {at: A(4, zh ? '评论区' : 'comment', B[4].dur - 1.2), f: 'pop', v: 0.4});
  [zh ? '电子版' : 'online', zh ? '纸质版' : 'print', zh ? '电子加纸质' : 'plus'].forEach((w, j) => S.push({at: A(5, w, 2 + j * 1.5), f: 'pop', v: 0.35}));
  S.push({at: B[6].start + 0.2, f: 'rswoosh', v: 0.35}, {at: A(6, zh ? '删掉' : 'remove', 2.2), f: 'whip', v: 0.4}, {at: A(6, '32', B[6].dur - 1.2), f: 'boom', v: 0.4});
  S.push({at: B[7].start + 1.0, f: 'lowswoosh', v: 0.3}, {at: A(7, zh ? '问问自己' : 'ask', B[7].dur * 0.5), f: 'chime', v: 0.25});
  S.push({at: B[8].start + 0.05, f: 'pop', v: 0.4});
  return S;
};

export const Decoy: React.FC<{lang: 'en' | 'zh'}> = ({lang}) => {
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
      <Audio src={staticFile(`decoy/${lang}-voice.wav`)} />
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
