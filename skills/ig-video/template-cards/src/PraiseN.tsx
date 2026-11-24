import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, useFont} from './Cards';
import {clamp, inOut, outBack} from './Spec';
import EN from './praise-en.json';
import ZH from './praise-zh.json';

// Why praise feels so good: praise activates the striatum like money (Izuma 2008); praise after training boosts next-day skill (Sugawara 2012).
// Phantom style (best 2 s retention so far): dark navy backdrop, yellow highlights, big glowing
// line-art close-ups, the whole hook as big text on frame one, fast voice, sound effects, no music.

type Beat = {say: string; top: string; src?: string; start: number; dur: number; words: [string, number, number][]};
const total = (b: Beat[]) => b[b.length - 1].start + b[b.length - 1].dur;
export const PRAISEN_EN_FRAMES = Math.ceil(total(EN as Beat[]) * 30);
export const PRAISEN_ZH_FRAMES = Math.ceil(total(ZH as Beat[]) * 30);

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
    hook: ['One "good job!"…', 'why is it', 'so addictive?'], hl: 2,
    carrot: 'carrot', tissue: 'tissue', good: 'GOOD JOB!', praise: '👏 Praise', money: '¥ Money', same: 'SAME SPOT',
    ask: 'Praised today? Comment!', me: "You're doing great", day2: 'Next day', praised: 'praised', not: 'not',
    line: '"That idea? Brilliant."', share: 'Send to them', brand: ['Brain', 'Manual'], src: 'Research: ',
  },
  zh: {
    hook: ['被夸一句“真棒”', '为什么让人', '这么上瘾？'], hl: 2,
    carrot: '萝卜', tissue: '纸巾', good: '真棒！', praise: '👏 被夸', money: '¥ 拿钱', same: '同一个区域',
    ask: '你今天被夸了吗？', me: '我先夸你：你很棒', day2: '第二天', praised: '被夸组', not: '没被夸',
    line: '“你那个点子，真棒！”', share: '转给TA', brand: ['脑子', '说明书'], src: '研究：',
  },
};
type Lx = typeof T.en;
const CatFace: React.FC<{x: number; y: number; s?: number; proud?: number}> = ({x, y, s = 1, proud = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-120 -60 L-100 -190 L-30 -120 Z M120 -60 L100 -190 L30 -120 Z" fill={NAVY} stroke={W} strokeWidth={14} strokeLinejoin="round" />
    <circle r={150} fill={NAVY} stroke={W} strokeWidth={14} />
    {proud > 0.5 ? <path d="M-80 -20 q25 -26 50 0 M30 -20 q25 -26 50 0" stroke={W} strokeWidth={12} fill="none" strokeLinecap="round" /> : <><circle cx={-55} cy={-20} r={18} fill={W} /><circle cx={55} cy={-20} r={18} fill={W} /></>}
    <path d="M-12 20 h24 l-12 14 z" fill={Y} />
    <path d="M0 34 q-22 26 -44 8 M0 34 q22 26 44 8" stroke={W} strokeWidth={8} fill="none" strokeLinecap="round" />
    <path d="M-90 20 h-70 M-90 40 h-66 M90 20 h70 M90 40 h66" stroke={W} strokeWidth={6} />
  </g>
);
const Scene: React.FC<{i: number; u: number; d: number; L: Lx; B: Beat[]}> = ({i, u, d, L, B}) => {
  const svg = (c: React.ReactNode) => <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{c}</svg>;
  const uu = Math.max(0, u);
  const at = (sub: string, fb = 1) => say(B, i, sub, fb);
  const zh = L.hl === 2 && L.share === '转给TA';
  if (i === 0) {
    const pick = clamp((uu - 0.7) / 0.4);
    const yay = clamp((uu - 1.4) / 0.35);
    return svg(
      <Phone x={540} y={1230} s={1.15}>
        <CatFace x={0} y={-90} s={0.95} proud={yay} />
        <Chip x={-95} y={230} k={1} text={L.carrot} w={170} s={40} c={DIM} />
        <Chip x={95} y={230} k={1} text={L.tissue} w={170} s={40} c={pick > 0 ? Y : DIM} />
        <g transform={`scale(${1 + 0.06 * Math.sin(uu * 10)})`}><Chip x={0} y={-290} k={yay} text={L.good} w={300} s={60} c={Y} rot={-6} /></g>
        {yay > 0 ? [0, 1, 2, 3].map((k) => { const p = (uu * 0.8 + k * 0.25) % 1; return <path key={k} d="M0 10 c-14 -22 -44 -8 -30 14 l30 26 l30 -26 c14 -22 -16 -36 -30 -14 z" fill={RED} opacity={1 - p} transform={`translate(${-120 + k * 80} ${100 - p * 300}) scale(1.3)`} />; }) : null}
      </Phone>,
    );
  }
  if (i === 1) {
    const glowOn = clamp(uu / 0.4);
    const pk = clamp((uu - at(zh ? '纸巾' : 'tissue', 3)) / 0.3);
    const yay = clamp((uu - at(zh ? '真棒' : 'good', 4)) / 0.3);
    const laugh = clamp((uu - at(zh ? '笑出' : 'laughs', 5)) / 0.3);
    return svg(
      <>
        <circle cx={900} cy={720} r={60} fill="#fff3b0" opacity={0.85} style={glow('#fff3b0', 40)} />
        <path d="M0 1700 L540 1150 L1080 1700 Z" fill="rgba(155,231,255,0.10)" opacity={glowOn} />
        <Face y={1180} r={260} t={uu} mood={laugh > 0 ? 'laugh' : 'calm'} />
        <g transform="translate(540 1620) scale(0.42)">
          <Phone x={0} y={0}>
            <CatFace x={0} y={-80} s={0.9} proud={yay} />
            <Chip x={95} y={230} k={1} text={L.tissue} w={170} s={40} c={pk > 0 ? Y : DIM} />
            <Chip x={0} y={-280} k={yay} text={L.good} w={300} s={60} c={Y} rot={-6} />
          </Phone>
        </g>
        {laugh > 0 ? <Txt x={860} y={980} s={90} c={Y} o={laugh}>{zh ? '哈哈哈' : 'HAHA'}</Txt> : null}
      </>,
    );
  }
  if (i === 2) {
    const a = clamp((uu - 0.3) / 0.4);
    const b = clamp((uu - at(zh ? '拿到钱' : 'money', 3)) / 0.4);
    const pulse = 0.5 + 0.5 * Math.sin(uu * 8);
    return svg(
      <>
        <g transform="translate(540 1230)">
          <path d="M-270 70 C-340 -80 -260 -240 -115 -240 C-60 -310 70 -310 125 -240 C270 -240 340 -80 270 70 C270 200 145 250 0 235 C-145 250 -270 200 -270 70 Z" fill={NAVY} stroke={W} strokeWidth={14} style={glow('rgba(120,170,255,0.6)', 40)} />
          <path d="M0 -270 V230 M-170 -100 q90 50 170 0 M0 0 q90 50 190 0 M-210 90 q90 -30 170 15" stroke={DIM} strokeWidth={9} fill="none" />
          <circle cx={0} cy={60} r={60 + 30 * pulse * Math.max(a, b)} fill={Y} opacity={0.9 * Math.max(a, b)} style={glow(Y, 50)} />
        </g>
        <Chip x={260} y={820} k={a} text={L.praise} w={340} s={50} c={Y} />
        <Chip x={820} y={820} k={b} text={L.money} w={340} s={50} c={GREEN} />
        <path d="M260 880 Q330 1060 500 1270 M820 880 Q750 1060 580 1270" stroke={W} strokeWidth={7} strokeDasharray="16 12" fill="none" opacity={Math.max(a * 0.8, b)} />
        <Chip x={540} y={1640} k={clamp((uu - at(zh ? '同一个' : 'same', d - 1.4)) / 0.4)} text={L.same} w={480} s={58} c={Y} rot={-3} />
      </>,
    );
  }
  if (i === 3) {
    const ask = clamp((uu - at(zh ? '你今天' : 'were', 2)) / 0.35);
    const me = clamp((uu - at(zh ? '我先夸' : 'first', d - 1)) / 0.35);
    return svg(
      <>
        {[...Array(10)].map((_, k) => { const p = (uu * 0.45 + k * 0.1) % 1; return <path key={k} d="M0 10 c-14 -22 -44 -8 -30 14 l30 26 l30 -26 c14 -22 -16 -36 -30 -14 z" fill={k % 2 ? Y : RED} opacity={0.8 * (1 - p)} transform={`translate(${120 + (k * 97) % 840} ${1800 - p * 1200}) scale(1.6)`} />; })}
        <Face y={1150} r={250} t={uu} mood="calm" />
        <Chip x={540} y={1560} k={ask} text={L.ask} w={zh ? 640 : 760} s={zh ? 60 : 54} c={Y} />
        <Chip x={540} y={760} k={me} text={L.me} w={zh ? 620 : 600} s={54} c={GREEN} rot={3} />
      </>,
    );
  }
  if (i === 4) {
    const key = Math.floor(uu * 4) % 5;
    const yay = clamp((uu - at(zh ? '学完' : 'praised', 1.5)) / 0.35);
    const day2 = clamp((uu - at(zh ? '第二天' : 'next', 3.5)) / 0.6);
    return svg(
      <>
        <g transform="translate(540 880)" opacity={1 - day2 * 0.6}>
          {[0, 1, 2, 3, 4].map((k) => <rect key={k} x={-330 + k * 135} y={-80} width={115} height={170} rx={18} fill={k === key ? Y : NAVY} stroke={W} strokeWidth={6} style={k === key ? glow(Y, 30) : undefined} />)}
        </g>
        <Chip x={540} y={700} k={yay} text={L.good} w={300} s={60} c={Y} rot={-5} />
        <Txt x={540} y={1170} s={50} c={W} o={day2}>{L.day2}</Txt>
        <Bars x={540} y={1650} k={day2} vals={[[0.95, GREEN, L.praised], [0.6, DIM, L.not]]} />
      </>,
    );
  }
  if (i === 5) {
    const k = clamp((uu - 0.6) / 0.35);
    return svg(
      <>
        <Face x={300} y={1350} r={170} t={uu} mood="calm" />
        <Face x={780} y={1350} r={170} t={uu} mood={k > 0 ? 'laugh' : 'calm'} c={Y} />
        <Chip x={540} y={950} k={k} text={L.line} w={zh ? 760 : 820} s={zh ? 60 : 54} c={Y} />
        {k > 0 ? [...Array(7)].map((_, j) => <path key={j} d="M0 -30 L8 -8 L30 0 L8 8 L0 30 L-8 8 L-30 0 L-8 -8 Z" fill={Y} transform={`translate(${780 + Math.cos(j) * 230} ${1250 + Math.sin(j * 2) * 160}) scale(${0.6 + 0.4 * Math.sin(uu * 6 + j)})`} style={glow(Y, 10)} />) : null}
      </>,
    );
  }
  return svg(<Share u={uu} text={L.share} />);
};

const sfxFor = (B: Beat[], zh: boolean) => {
  const S: {at: number; f: string; v: number}[] = [{at: 0.05, f: 'boom', v: 0.3}, {at: 0.7, f: 'click', v: 0.9}, {at: 1.4, f: 'ding', v: 0.35}, {at: 1.4, f: 'pop', v: 0.35}];
  const A = (bi: number, sub: string, fb: number) => B[bi].start + say(B, bi, sub, fb);
  S.push({at: A(1, zh ? '纸巾' : 'tissue', 3), f: 'click', v: 0.9}, {at: A(1, zh ? '真棒' : 'good', 4), f: 'ding', v: 0.3}, {at: A(1, zh ? '笑出' : 'laughs', 5), f: 'pop', v: 0.35});
  S.push({at: B[2].start + 0.3, f: 'pop', v: 0.35}, {at: A(2, zh ? '拿到钱' : 'money', 3), f: 'pop', v: 0.35}, {at: A(2, zh ? '同一个' : 'same', B[2].dur - 1.4), f: 'boom', v: 0.35}, {at: A(2, zh ? '同一个' : 'same', B[2].dur - 1.4), f: 'chime', v: 0.25});
  S.push({at: A(3, zh ? '你今天' : 'were', 2), f: 'pop', v: 0.4}, {at: A(3, zh ? '我先夸' : 'first', B[3].dur - 1), f: 'ding', v: 0.3});
  for (let k = 0; k < 8; k++) S.push({at: B[4].start + k * 0.25, f: 'click', v: 0.9});
  S.push({at: A(4, zh ? '学完' : 'praised', 1.5), f: 'ding', v: 0.3}, {at: A(4, zh ? '第二天' : 'next', 3.5), f: 'rswoosh', v: 0.35});
  S.push({at: B[5].start + 0.6, f: 'pop', v: 0.4}, {at: B[5].start + 0.9, f: 'chime', v: 0.25});
  S.push({at: B[6].start + 0.05, f: 'pop', v: 0.4});
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

export const PraiseN: React.FC<{lang: 'en' | 'zh'}> = ({lang}) => {
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
