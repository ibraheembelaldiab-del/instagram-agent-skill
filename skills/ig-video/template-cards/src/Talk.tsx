import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, inOut, outBack} from './Spec';

// 说错一句话，回家想一整晚 — horizontal, no voice, text + music explainer
// (the long-form pattern of the 1.4M-view plateau video, in our navy/yellow look).
// Gilovich 1998/2000 · Savitsky & Gilovich 2003 · Boothby 2018 · Kross 2005

const SERIF = '"Noto Serif SC", serif';
const SANS = '"Noto Sans SC", sans-serif';
const Y = '#ffd23f';
const W = '#f4f1ea';
const DIM = '#7f8fc4';
const RED = '#ff6b81';
const GREEN = '#7ee0a1';
const PUR = '#b9a8ff';
const COL: Record<string, string> = {r: RED, g: GREEN, y: Y, p: PUR, d: DIM};

type Line = {sc: string; t: string; card?: [string, string]; src?: string; hold?: number};
const LINES: Line[] = [
  {sc: 'replay', t: '聊完天回到家，脑子开始{r|自动回放}。'},
  {sc: 'replay', t: '"我刚才那句话，是不是{r|很蠢}？"'},
  {sc: 'replay', t: '"他那个表情，是不是{r|不高兴了}？"'},
  {sc: 'replay', t: '一句话，能想{r|一整晚}。'},
  {sc: 'replay', t: '可心理学研究发现：{y|你真的想多了}。'},
  {sc: 'card1', t: '2000年，康奈尔大学做了个实验。', card: ['焦点效应', 'THE SPOTLIGHT EFFECT'], src: 'Gilovich, Medvec & Savitsky, 2000'},
  {sc: 'card1', t: '让学生穿一件{r|很丢脸的T恤}，走进一屋子人。', card: ['焦点效应', 'THE SPOTLIGHT EFFECT'], src: 'Gilovich, Medvec & Savitsky, 2000'},
  {sc: 'shirt', t: '穿的人猜：{r|一半的人}都注意到了。', src: 'Gilovich, Medvec & Savitsky, 2000'},
  {sc: 'shirt', t: '实际上，只有{g|大约四分之一}。', src: 'Gilovich, Medvec & Savitsky, 2000'},
  {sc: 'shirt', t: '你以为聚光灯打在你身上，{g|其实没多少人在看}。', src: 'Gilovich, Medvec & Savitsky, 2000'},
  {sc: 'card2', t: '还有一个错觉：', card: ['透明度错觉', 'THE ILLUSION OF TRANSPARENCY'], src: 'Gilovich, Savitsky & Medvec, 1998'},
  {sc: 'card2', t: '你觉得自己的紧张，{r|全写在脸上}。', card: ['透明度错觉', 'THE ILLUSION OF TRANSPARENCY'], src: 'Gilovich, Savitsky & Medvec, 1998'},
  {sc: 'heart', t: '心跳加速、手心出汗，{r|你感觉得清清楚楚}。'},
  {sc: 'heart', t: '可在别人眼里，你看起来{g|挺正常的}。', src: 'Gilovich, Savitsky & Medvec, 1998'},
  {sc: 'speech', t: '有个实验让人上台演讲。', src: 'Savitsky & Gilovich, 2003'},
  {sc: 'speech', t: '提前知道这个错觉的人，{g|更放松}，', src: 'Savitsky & Gilovich, 2003'},
  {sc: 'speech', t: '别人给他们的演讲打分，{g|也更高}。', src: 'Savitsky & Gilovich, 2003'},
  {sc: 'card3', t: '最扎心的是这个：', card: ['喜欢差距', 'THE LIKING GAP'], src: 'Boothby et al., 2018'},
  {sc: 'like', t: '和陌生人聊完天，人们总是{r|低估}对方有多喜欢自己。', src: 'Boothby et al., 2018'},
  {sc: 'like', t: '就连大学室友，住了几个月{r|还在低估}。', src: 'Boothby et al., 2018'},
  {sc: 'like', t: '你反复回放的那句话，{g|对方可能早就忘了}。'},
  {sc: 'fix', t: '下次又开始回放，换个角度问自己：'},
  {sc: 'fix', t: '{y|"如果是朋友说了这句话，我会记多久？"}', hold: 0.8},
  {sc: 'fix', t: '研究发现，像旁观者一样看自己，{g|情绪反应更小}。', src: 'Kross, Ayduk & Mischel, 2005'},
  {sc: 'end', t: '你最近一次"社死"是什么？{y|评论区说说}。'},
  {sc: 'end', t: '你在意的那一秒，{y|别人早就翻篇了}。', hold: 0.6},
  {sc: 'end', t: '转给那个，聊完天{y|总要复盘}的朋友。'},
  {sc: 'refs', t: '', hold: 2.2},
];
const plain = (s: string) => s.replace(/\{\w\|([^}]*)\}/g, '$1');
const DUR = LINES.map((l) => (l.t ? Math.max(2.0, 0.9 + plain(l.t).length * 0.15) : 0) + (l.hold ?? 0));
const START: number[] = [];
DUR.reduce((a, d, i) => ((START[i] = a), a + d), 0.3);
const TOTAL = START[START.length - 1] + DUR[DUR.length - 1] + 0.4;
export const TALK_FRAMES = Math.ceil(TOTAL * 30);

// scene spans
const SCENES: {sc: string; a: number; b: number; first: number}[] = [];
LINES.forEach((l, i) => {
  const last = SCENES[SCENES.length - 1];
  const end = START[i] + DUR[i];
  if (last && last.sc === l.sc) last.b = end;
  else SCENES.push({sc: l.sc, a: i === 0 ? 0 : START[i], b: end, first: i});
});


// Sound design (no music): a soft tick when each subtitle line appears, a swoosh on
// every scene change, a low boom under each title card, and scene-specific hits.
const SC = (sc: string) => SCENES.find((s) => s.sc === sc)!;
const LS = (sc: string, j: number) => START[SC(sc).first + j];
const SFX: {at: number; f: string; v: number}[] = [];
LINES.forEach((l, i) => { if (i > 0 && l.t) SFX.push({at: START[i], f: 'tick', v: 0.18}); });
SCENES.slice(1).forEach((s) => SFX.push({at: s.a - 0.15, f: 'lowswoosh', v: 0.45}));
['card1', 'card2', 'card3'].forEach((c) => { const s = SC(c); SFX.push({at: s.a + 0.05, f: 'boom', v: 0.35}, {at: s.a + 0.1, f: 'highswoosh', v: 0.3}); });
// replay: a click each time the thought loops back
for (let t0 = SC('replay').a + 1.1; t0 < SC('replay').b - 0.2; t0 += 1.1) SFX.push({at: t0, f: 'click', v: 0.9});
SFX.push({at: 0.05, f: 'boom', v: 0.3});
// spotlight: the two bars land
SFX.push({at: SC('shirt').a + 0.35, f: 'pop', v: 0.35}, {at: LS('shirt', 1) + 0.25, f: 'pop', v: 0.35}, {at: LS('shirt', 1) + 0.9, f: 'ding', v: 0.25});
// heart: heartbeats while "you feel it"
for (let t0 = SC('heart').a + 0.2; t0 < LS('heart', 1); t0 += 0.62) SFX.push({at: t0, f: 'boom', v: 0.28}, {at: t0 + 0.16, f: 'boom', v: 0.16});
SFX.push({at: LS('heart', 1) + 0.1, f: 'chime', v: 0.2});
// speech: score cards pop in
[0, 1, 2, 3, 4].forEach((j) => SFX.push({at: LS('speech', 2) + 0.1 + j * 0.12, f: 'pop', v: 0.28}));
SFX.push({at: LS('speech', 2) + 0.8, f: 'ding', v: 0.25});
// liking gap: bars fill, then the gap appears
SFX.push({at: SC('like').a + 0.4, f: 'rswoosh', v: 0.35}, {at: SC('like').a + 1.6, f: 'rswoosh', v: 0.35}, {at: SC('like').a + 2.5, f: 'ding', v: 0.3});
[0, 1, 2, 3, 4, 5].forEach((j) => SFX.push({at: LS('like', 1) + j * 0.1, f: 'tick', v: 0.25}));
// fix: zoom out to the observer
SFX.push({at: LS('fix', 1), f: 'highswoosh', v: 0.4}, {at: LS('fix', 1) + 1.0, f: 'chime', v: 0.3});
// end
SFX.push({at: SC('end').a + 0.2, f: 'chime', v: 0.3}, {at: SC('refs').a, f: 'lowswoosh', v: 0.3});

const ALLTEXT = LINES.map((l) => plain(l.t) + (l.card?.[0] ?? '')).join('') + '说错一句话回家想一整晚我刚才那是不蠢他高兴了第遍以为注意到的人实际你感觉别看知道透明度错觉对方多喜欢个月旁观者参考资料';

const useFonts = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = ['400', '700', '900'].map((w) => `@import url('${staticFile(`serif/${w}.css`)}');`).join('');
    document.head.appendChild(el);
    setTimeout(async () => {
      await Promise.all(['400', '700', '900'].map((w) => document.fonts.load(`${w} 40px "Noto Serif SC"`, ALLTEXT)));
      await document.fonts.ready;
      continueRender(h);
    }, 50);
  }, [h]);
};

const Rich: React.FC<{s: string}> = ({s}) => {
  const parts = s.split(/(\{\w\|[^}]*\})/g).filter(Boolean);
  return (
    <>
      {parts.map((p, k) => {
        const m = p.match(/^\{(\w)\|([^}]*)\}$/);
        return m ? <span key={k} style={{color: COL[m[1]]}}>{m[2]}</span> : <span key={k}>{p}</span>;
      })}
    </>
  );
};

const glow = (c: string, r = 18) => ({filter: `drop-shadow(0 0 ${r}px ${c})`});
const T: React.FC<{x: number; y: number; s?: number; c?: string; w?: number; f?: string; a?: 'middle' | 'start' | 'end'; o?: number; children: React.ReactNode}> = ({x, y, s = 40, c = W, w = 700, f = SERIF, a = 'middle', o = 1, children}) => (
  <text x={x} y={y} fontSize={s} fill={c} fontWeight={w} fontFamily={f} textAnchor={a} opacity={o}>{children}</text>
);

const Ground: React.FC = () => <line x1={0} y1={760} x2={1920} y2={760} stroke="rgba(160,180,255,0.35)" strokeWidth={2} />;

const Scene: React.FC<{sc: string; u: number; d: number; k: number}> = ({sc, u, d, k}) => {
  const svg = (c: React.ReactNode) => <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>{c}</svg>;
  const sub = (sc0: string, j: number) => {
    const f = SCENES.find((s) => s.sc === sc0)!.first;
    return START[f + j] - START[f];
  };
  if (sc === 'replay') {
    const n = 1 + Math.floor(u * 3.2);
    const spin = u * 140;
    const lines = ['我刚才那句话…', '是不是很蠢？', '他是不是不高兴了？', '我刚才那句话…'];
    const cur = lines[Math.floor(u / 1.1) % lines.length];
    return svg(
      <>
        <Ground />
        <g transform="translate(720 470)">
          <rect x={-330} y={-130} width={660} height={220} rx={40} fill="rgba(255,107,129,0.08)" stroke={RED} strokeWidth={4} style={glow('rgba(255,107,129,0.5)', 20)} />
          <path d="M-200 90 l-40 70 l100 -70" fill="rgba(255,107,129,0.08)" stroke={RED} strokeWidth={4} />
          <T x={0} y={0} s={58} c={W}>{cur}</T>
        </g>
        <g transform="translate(1340 450)">
          <circle r={95} fill="none" stroke="rgba(160,180,255,0.35)" strokeWidth={6} />
          <path d={`M0 -95 A95 95 0 0 1 95 0`} stroke={Y} strokeWidth={8} fill="none" strokeLinecap="round" transform={`rotate(${spin})`} style={glow(Y, 10)} />
          <path d="M-22 -34 L36 0 L-22 34 Z" fill={Y} />
        </g>
        <T x={1340} y={620} s={44} c={RED} w={900} f={SANS}>{`第 ${n} 遍`}</T>
      </>,
    );
  }
  if (sc === 'shirt') {
    const guess = clamp((u - 0.3) / 0.8);
    const real = clamp((u - sub('shirt', 1) - 0.2) / 0.8);
    const cone = 0.5 + 0.5 * clamp(u / 0.6);
    const dots = Array.from({length: 24});
    return svg(
      <>
        <path d={`M560 120 L${430} 640 L${690} 640 Z`} fill="rgba(255,210,63,0.10)" opacity={cone} />
        {dots.map((_, j) => {
          const x = 230 + (j % 6) * 130 + (Math.floor(j / 6) % 2) * 40;
          const y = 380 + Math.floor(j / 6) * 90;
          const looking = real > 0 ? j % 4 === 0 : guess > 0 && j % 2 === 0;
          return <circle key={j} cx={x === 560 ? x + 20 : x} cy={y} r={14} fill={looking ? Y : 'rgba(160,180,255,0.35)'} opacity={0.9} />;
        })}
        <circle cx={560} cy={600} r={30} fill={Y} style={glow(Y, 30)} />
        <g transform="translate(1180 360)">
          <T x={0} y={0} s={36} c={DIM} a="start">以为注意到的人</T>
          <rect x={0} y={30} width={560 * guess * 0.5 * 1.6} height={56} rx={10} fill={RED} />
          <T x={20 + 448 * guess} y={72} s={40} c={RED} w={900} f={SANS} a="start" o={guess}>~50%</T>
          <T x={0} y={190} s={36} c={DIM} a="start" o={real}>实际注意到的人</T>
          <rect x={0} y={220} width={560 * real * 0.25 * 1.6} height={56} rx={10} fill={GREEN} style={glow('rgba(126,224,161,0.6)', 12)} />
          <T x={20 + 224 * real} y={262} s={40} c={GREEN} w={900} f={SANS} a="start" o={real}>~25%</T>
        </g>
      </>,
    );
  }
  if (sc === 'heart') {
    const out = clamp((u - sub('heart', 1)) / 0.6);
    const wave = (amp: number, freq: number, x0: number) => {
      let d = '';
      for (let x = 0; x <= 600; x += 6) {
        const ph = (x / 600) * freq * Math.PI * 2 - u * 8;
        const spike = Math.max(0, Math.sin(ph)) ** 8;
        d += `${x === 0 ? 'M' : 'L'}${x0 + x} ${520 - amp * spike + Math.sin(ph * 3) * amp * 0.05}`;
      }
      return d;
    };
    return svg(
      <>
        <T x={560} y={330} s={40} c={RED}>你感觉到的</T>
        <path d={wave(170, 5, 260)} stroke={RED} strokeWidth={5} fill="none" style={glow(RED, 10)} />
        <g opacity={out}>
          <T x={1360} y={330} s={40} c={GREEN}>别人看到的</T>
          <path d={wave(26, 2, 1060)} stroke={GREEN} strokeWidth={5} fill="none" style={glow('rgba(126,224,161,0.7)', 10)} />
        </g>
        <line x1={960} y1={300} x2={960} y2={700} stroke="rgba(160,180,255,0.3)" strokeWidth={2} />
      </>,
    );
  }
  if (sc === 'speech') {
    const a = clamp((u - sub('speech', 1)) / 0.8);
    const b = clamp((u - sub('speech', 2)) / 0.8);
    return svg(
      <>
        <rect x={760} y={560} width={400} height={30} rx={6} fill="rgba(160,180,255,0.35)" />
        <rect x={930} y={430} width={60} height={130} rx={8} fill="rgba(160,180,255,0.25)" />
        <circle cx={960} cy={360} r={52} fill="#16204a" stroke={W} strokeWidth={6} />
        <path d={`M935 ${385} q25 ${a > 0 ? 18 : -10} 50 0`} stroke={W} strokeWidth={6} fill="none" strokeLinecap="round" />
        {[0, 1, 2, 3, 4].map((j) => (
          <g key={j} opacity={b}>
            <rect x={460 + j * 230} y={690} width={160} height={70} rx={14} fill="rgba(126,224,161,0.12)" stroke={GREEN} strokeWidth={3} />
            <T x={540 + j * 230} y={740} s={40} c={GREEN} w={900} f={SANS}>{['8', '9', '8', '9', '9'][j]}</T>
          </g>
        ))}
        <T x={960} y={250} s={36} c={GREEN} o={a}>知道“透明度错觉”</T>
      </>,
    );
  }
  if (sc === 'like') {
    const a = clamp((u - 0.4) / 1.0);
    const b = clamp((u - 1.6) / 1.0);
    const room = clamp((u - sub('like', 1)) / 0.6);
    return svg(
      <>
        <g transform="translate(520 300)">
          <T x={0} y={0} s={38} c={DIM} a="start">你以为对方多喜欢你</T>
          <rect x={0} y={30} width={900} height={50} rx={25} fill="none" stroke="rgba(160,180,255,0.4)" strokeWidth={3} />
          <rect x={6} y={36} width={888 * 0.45 * a} height={38} rx={19} fill={RED} />
          <T x={0} y={190} s={38} c={DIM} a="start">对方实际有多喜欢你</T>
          <rect x={0} y={220} width={900} height={50} rx={25} fill="none" stroke="rgba(160,180,255,0.4)" strokeWidth={3} />
          <rect x={6} y={226} width={888 * 0.72 * b} height={38} rx={19} fill={GREEN} style={glow('rgba(126,224,161,0.6)', 12)} />
          <path d={`M${888 * 0.45} 100 L${888 * 0.45} 210 M${888 * 0.72} 100 L${888 * 0.72} 210`} stroke={Y} strokeWidth={3} strokeDasharray="8 8" opacity={b} />
          <T x={888 * 0.585} y={170} s={40} c={Y} w={900} o={b}>喜欢差距</T>
        </g>
        <g opacity={room} transform="translate(960 700)">
          {[0, 1, 2, 3, 4, 5].map((j) => <rect key={j} x={-300 + j * 100} y={0} width={80} height={36} rx={8} fill={j < Math.ceil(room * 6) ? 'rgba(255,107,129,0.5)' : 'rgba(160,180,255,0.15)'} />)}
          <T x={0} y={80} s={28} c={DIM} f={SANS}>第 1 — 6 个月</T>
        </g>
      </>,
    );
  }
  if (sc === 'fix') {
    const a = clamp((u - 0.3) / 0.8);
    const zoom = inOut(clamp((u - sub('fix', 1)) / 1.2));
    return svg(
      <>
        <g transform={`translate(960 ${480}) scale(${1 - zoom * 0.45})`}>
          <circle r={110} fill="#16204a" stroke={RED} strokeWidth={8} opacity={a} />
          <circle cx={-36} cy={-18} r={12} fill={W} opacity={a} />
          <circle cx={36} cy={-18} r={12} fill={W} opacity={a} />
          <path d={zoom > 0.5 ? 'M-35 40 q35 22 70 0' : 'M-35 50 q35 -22 70 0'} stroke={W} strokeWidth={8} fill="none" strokeLinecap="round" opacity={a} />
        </g>
        <g opacity={zoom}>
          <circle cx={960} cy={480} r={260} fill="none" stroke={Y} strokeWidth={3} strokeDasharray="14 12" />
          <circle cx={1360} cy={300} r={60} fill="#16204a" stroke={GREEN} strokeWidth={6} style={glow('rgba(126,224,161,0.6)', 14)} />
          <path d="M1310 330 L1180 400" stroke={GREEN} strokeWidth={4} strokeDasharray="10 8" />
          <T x={1360} y={410} s={34} c={GREEN}>旁观者</T>
        </g>
      </>,
    );
  }
  if (sc === 'end') {
    const p = clamp(u / 1.2);
    return svg(
      <>
        <Ground />
        <circle cx={960} cy={440} r={26} fill={Y} opacity={p} style={glow(Y, 40)} />
        <path d={`M200 760 Q 960 ${760 - 40 * p} 1720 760`} stroke="rgba(255,210,63,0.35)" strokeWidth={2} fill="none" />
      </>,
    );
  }
  if (sc === 'refs') {
    const refs = [
      'Gilovich, Medvec & Savitsky (2000). The spotlight effect in social judgment. JPSP.',
      'Gilovich, Savitsky & Medvec (1998). The illusion of transparency. JPSP.',
      'Savitsky & Gilovich (2003). The illusion of transparency and the alleviation of speech anxiety. JESP.',
      'Boothby, Cooney, Sandstrom & Clark (2018). The liking gap in conversations. Psychological Science.',
      'Kross, Ayduk & Mischel (2005). When asking "why" does not hurt. Psychological Science.',
    ];
    return svg(
      <g opacity={clamp(u / 0.5)}>
        <T x={960} y={300} s={52} c={W}>参考资料</T>
        {refs.map((r, j) => <T key={j} x={960} y={400 + j * 62} s={28} c="#aab6e0" w={400}>{r}</T>)}
      </g>,
    );
  }
  return null;
};

export const Talk: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  let i = 0;
  while (i < LINES.length - 1 && t >= START[i + 1]) i++;
  const L = LINES[i];
  const sp = SCENES.find((s) => t >= s.a && t < s.b) ?? SCENES[SCENES.length - 1];
  const su = t - sp.a;
  const sk = i - sp.first;
  const sIn = sp.a === 0 ? 1 : clamp(su / 0.5);
  const lu = t - START[i];
  const lIn = i === 0 ? 1 : clamp(lu / 0.3);
  const end = clamp((t - (TOTAL - 0.6)) / 0.5);
  const card = L.card;
  const cardIn = card ? clamp((t - sp.a) / 0.6) : 0;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #1a2350 0%, #0a0f26 60%, #05070f 100%)', color: W, fontFamily: SERIF, overflow: 'hidden'}}>
      {Array.from({length: 60}).map((_, j) => (
        <div key={j} style={{position: 'absolute', left: (j * 337) % 1920, top: (j * 151) % 1080, width: 3, height: 3, borderRadius: 2, background: '#fff', opacity: 0.12 + 0.18 * Math.abs(Math.sin(t * 0.6 + j))}} />
      ))}
      <AbsoluteFill style={{opacity: sIn, transform: `scale(${1 + clamp(su / 20) * 0.04})`}}>
        <Scene sc={sp.sc} u={su} d={sp.b - sp.a} k={sk} />
        {card ? (
          <div style={{position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', opacity: cardIn, transform: `translateY(${(1 - cardIn) * 20}px)`}}>
            <div style={{fontSize: 130, fontWeight: 900, letterSpacing: 8, color: W, textShadow: '0 0 40px rgba(185,168,255,0.55)'}}>{card[0]}</div>
            <div style={{fontSize: 26, letterSpacing: 10, color: DIM, marginTop: 10, fontFamily: SANS}}>{card[1]}</div>
          </div>
        ) : null}
      </AbsoluteFill>
      {sp.sc === 'replay' ? (
        <div style={{position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center', fontSize: 84, fontWeight: 900, letterSpacing: 4, textShadow: '0 4px 30px rgba(0,0,0,0.8)'}}>
          说错一句话，回家想<span style={{color: Y}}>一整晚</span>
        </div>
      ) : null}
      {L.t ? (
        <div style={{position: 'absolute', bottom: 120, left: 80, right: 80, textAlign: 'center', fontSize: 54, fontWeight: 700, lineHeight: 1.4, opacity: lIn, transform: `translateY(${(1 - lIn) * 14}px)`, textShadow: '0 3px 16px rgba(0,0,0,0.9)'}}>
          <Rich s={L.t} />
        </div>
      ) : null}
      {L.src ? <div style={{position: 'absolute', bottom: 50, left: 0, right: 0, textAlign: 'center', fontSize: 24, color: DIM, fontFamily: SANS}}>研究：{L.src}</div> : null}
      <div style={{position: 'absolute', top: 36, left: 44, fontSize: 28, fontWeight: 900, fontFamily: SANS}}>
        脑子<span style={{background: Y, color: '#16141a', padding: '0 8px', borderRadius: 6, marginLeft: 6}}>说明书</span>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: end}} />
      {SFX.map((x, j) => (
        <Sequence key={j} from={Math.max(0, Math.round(x.at * fps))} durationInFrames={Math.round(2.5 * fps)}>
          <Audio src={staticFile(`sfx/${x.f}.wav`)} volume={x.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
