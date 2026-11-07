import {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Text cards that glide and snap: lines rise out of a blur, highlights wipe
// in, numbers spin in, and each card leaves with a whip pan. Every move has
// a sound (whoosh between cards, a whip on each highlight, a pop on numbers).

type Seg = {t: string; hl?: boolean; red?: boolean};
type Card = {tag: string; num?: string; clock?: string; lines: Seg[][]; sub: string[]; src?: string; phone: number; gray?: boolean};

import EP from './episode.json';
import {Stage} from './Stage';
const ZH = EP.zh as Card[];
const EN = EP.en as Card[];
const DUR: number[] = EP.dur;
const T = 0.32; // whip pan length
const STARTS = DUR.map((_, i) => DUR.slice(0, i).reduce((a, b) => a + b, 0));
export const TOTAL = Math.round(DUR.reduce((a, b) => a + b, 0) * 30);

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const outCubic = (x: number) => 1 - (1 - clamp(x)) ** 3;
const outBack = (x: number) => {
  const c = 1.6;
  const k = clamp(x) - 1;
  return 1 + (c + 1) * k ** 3 + c * k ** 2;
};
const inOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
type Trans = 'whip' | 'zoomin' | 'slideup' | 'zoomout';
const TRANS: Trans[] = ['whip', 'zoomin', 'slideup', 'zoomout'];
const MODES = ['reveal', 'push', 'drift', 'pull', 'push'] as const;
const SOUND: Record<Trans, string[]> = {
  whip: ['whoosh.wav'],
  zoomin: ['rswoosh.wav', 'boom.wav'],
  slideup: ['lowswoosh.wav'],
  zoomout: ['highswoosh.wav'],
};
const HL_SOUND = ['whip.wav', 'pop.wav', 'whip.wav', 'click.wav', 'pop.wav'];
const transStyle = (kind: Trans, k: number, role: 'in' | 'out'): React.CSSProperties => {
  const b = Math.sin(k * Math.PI);
  if (kind === 'whip') return role === 'out' ? {transform: `translateX(${-k * 1080}px)`, filter: `blur(${b * 26}px)`} : {transform: `translateX(${(1 - k) * 1080}px)`, filter: `blur(${b * 26}px)`};
  if (kind === 'slideup') return role === 'out' ? {transform: `translateY(${-k * 1920}px)`, filter: `blur(${b * 22}px)`} : {transform: `translateY(${(1 - k) * 1920}px)`, filter: `blur(${b * 22}px)`};
  if (kind === 'zoomin') return role === 'out' ? {transform: `scale(${1 + k * 2.2})`, opacity: 1 - k, filter: `blur(${k * 24}px)`} : {transform: `scale(${0.7 + 0.3 * k})`, opacity: k, filter: `blur(${(1 - k) * 18}px)`};
  return role === 'out' ? {transform: `scale(${1 - 0.65 * k}) rotate(${-10 * k}deg)`, opacity: 1 - k} : {transform: `scale(${1.6 - 0.6 * k})`, opacity: k, filter: `blur(${(1 - k) * 20}px)`};
};

const LINE0 = 0.12;
const HOOK_HEAD = 0.75; // the hook card starts with its text already in place
const LINE_GAP = 0.14;
const hlTime = (c: Card) => {
  const k = c.lines.findIndex((l) => l.some((s) => s.hl));
  return LINE0 + Math.max(0, k) * LINE_GAP + 0.14;
};

export const useFont = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = `@import url('${staticFile('fonts/900.css')}'); @import url('${staticFile('fonts/700.css')}');`;
    document.head.appendChild(el);
    const go = async () => {
      await Promise.all(['900 100px "Noto Sans SC"', '700 60px "Noto Sans SC"'].map((f) => document.fonts.load(f, '凌晨刷手机放门外关机闹钟明天件事你昨晚几点评论区告诉我关注看下一期睡前方法说实话够不着就会铃响锁起来写完灯觉这个救了我的眠 Still scrolling')));
      await document.fonts.ready;
      continueRender(h);
    };
    setTimeout(go, 50);
  }, [h]);
};

const Line: React.FC<{segs: Seg[]; tau: number; k: number; en: boolean}> = ({segs, tau, k, en}) => {
  const a = tau - (LINE0 + k * LINE_GAP);
  const p = outCubic(a / 0.42);
  const y = (1 - outBack(a / 0.5)) * 80;
  return (
    <div style={{opacity: p, transform: `translateY(${y}px)`, filter: `blur(${(1 - p) * 14}px)`, whiteSpace: 'nowrap'}}>
      {segs.map((s, i) => {
        if (!s.hl) return <span key={i} style={{color: s.red ? '#ff5a6e' : '#fff'}}>{s.t}</span>;
        const w = outCubic((a - 0.14) / 0.28);
        const pop = 1 + Math.sin(clamp((a - 0.14) / 0.35) * Math.PI) * 0.06;
        return (
          <span key={i} style={{position: 'relative', display: 'inline-block', padding: en ? '0 14px' : '0 18px', transform: `scale(${pop})`, transformOrigin: 'left center'}}>
            <span style={{position: 'absolute', inset: '8% 0 4% 0', background: '#ffd23f', borderRadius: 14, clipPath: `inset(0 ${(1 - w) * 100}% 0 0)`}} />
            <span style={{position: 'relative', color: w > 0.45 ? '#16141a' : '#fff'}}>{s.t}</span>
          </span>
        );
      })}
    </div>
  );
};

const CardView: React.FC<{c: Card; tau: number; idx: number; en: boolean}> = ({c, tau: cam, idx, en}) => {
  const tau = idx === 0 ? cam + HOOK_HEAD : cam;
  const n = clamp((tau - 0.02) / 0.4);
  const tagP = outCubic((tau - 0.0) / 0.35);
  const subP = outCubic((tau - (LINE0 + c.lines.length * LINE_GAP + 0.15)) / 0.4);
  const mode = MODES[idx % MODES.length];
  const hp = Math.sin(clamp((tau - hlTime(c)) / 0.35) * Math.PI) * (idx % 2 ? 0.07 : 0.1);
  let zoom = 1 + hp;
  let dx = 0;
  if (mode === 'reveal') zoom += 0.4 - 0.4 * outCubic(cam / 0.55);
  if (mode === 'push') zoom += cam * 0.014;
  if (mode === 'pull') zoom += 0.08 - clamp(cam / 4.4) * 0.08;
  if (mode === 'drift') {
    zoom += 0.04;
    dx = 24 - cam * 12;
  }
  const flick = c.clock ? (Math.floor(tau * 2) % 2 === 0 ? 1 : 0.55) : 1;
  const bob = Math.sin(tau * 2.2) * 10;
  return (
    <AbsoluteFill style={{transform: `translateX(${dx}px) scale(${zoom})`, transformOrigin: mode === 'reveal' ? '12% 24%' : '45% 35%'}}>
      <div style={{position: 'absolute', right: -40 - dx * 2.5, bottom: 60, fontWeight: 900, fontSize: 820, lineHeight: 1, color: 'rgba(255,210,63,0.07)', transform: `scale(${1 + cam * 0.02})`}}>
        {c.num ?? (idx === 0 ? '!' : '?')}
      </div>
      <div style={{position: 'absolute', top: 120, left: 96, fontWeight: 700, fontSize: 44, letterSpacing: 4, color: '#8fa0d8', opacity: tagP, transform: `translateX(${(1 - tagP) * -40}px)`}}>{c.tag}</div>
      {c.clock ? (
        <div style={{position: 'absolute', top: 250, right: 96, fontWeight: 900, fontSize: 110, color: '#ff5a6e', opacity: outCubic(tau / 0.3) * flick, transform: `scale(${1.4 - 0.4 * outBack(tau / 0.4)})`, transformOrigin: 'right center'}}>
          {c.clock}
        </div>
      ) : null}
      <div style={{position: 'absolute', top: c.num ? 380 : 430, left: 96, right: 60}}>
        {c.num ? (
          <div style={{fontWeight: 900, fontSize: 130, color: '#ffd23f', lineHeight: 1, marginBottom: 30, opacity: n, transform: `scale(${1.8 - 0.8 * outBack(n)}) rotate(${(1 - outCubic(n)) * -25}deg)`, transformOrigin: 'left center'}}>
            {c.num}
          </div>
        ) : null}
        <div style={{fontWeight: 900, fontSize: en ? 112 : 132, lineHeight: en ? 1.32 : 1.3, letterSpacing: en ? 0 : 2}}>
          {c.lines.map((l, k) => (
            <Line key={k} segs={l} tau={tau} k={k} en={en} />
          ))}
        </div>
        <div style={{fontWeight: 700, fontSize: en ? 50 : 54, lineHeight: 1.45, color: '#c9d4ff', marginTop: 40, opacity: subP, transform: `translateY(${(1 - subP) * 30}px)`}}>
          {c.sub.map((s, i) => (
            <div key={i}>{s}</div>
          ))}
        </div>
      </div>
      {/* the phone, glowing and breathing */}
      {c.phone > 0 ? <div
        style={{
          position: 'absolute', left: 540 - 150, top: 1200 + bob, width: 300, height: 560, borderRadius: 46, border: '10px solid #1e2440',
          background: 'linear-gradient(160deg,#6aa8ff,#3a5bd9 60%,#2a2f8a)', opacity: c.phone, filter: c.gray ? 'grayscale(1)' : undefined,
          boxShadow: `0 0 ${140 + Math.sin(tau * 3) * 30}px 40px rgba(90,150,255,${0.25 + Math.sin(tau * 3) * 0.08})`,
        }}
      /> : null}
      <div style={{opacity: outCubic((tau - 0.1) / 0.45), transform: `translateY(${(1 - outCubic((tau - 0.1) / 0.45)) * 60}px)`}}>
        <Stage scene={idx} t={tau} en={en} />
      </div>
      {c.src ? (
        <div style={{position: 'absolute', bottom: 120, left: 0, right: 0, textAlign: 'center', fontWeight: 700, fontSize: 34, color: '#6f7fb8', opacity: subP}}>{c.src}</div>
      ) : null}
      {/* page dots */}
      <div style={{position: 'absolute', bottom: 56, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 18}}>
        {DUR.map((_, i) => (
          <div key={i} style={{height: 22, width: i === idx ? 22 + 40 * outCubic(tau / 0.4) : 22, borderRadius: 11, background: i === idx ? '#ffd23f' : '#2a3358'}} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Slow-drifting glow and a few rising specks, shared by every card.
export const Backdrop: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg,#070b1c 0%,#0d1430 55%,#0a0f22 100%)'}}>
    <AbsoluteFill style={{background: `radial-gradient(900px 700px at ${50 + Math.sin(t * 0.4) * 8}% ${62 + Math.cos(t * 0.3) * 4}%, rgba(80,140,255,.30), transparent 70%)`}} />
    {Array.from({length: 26}).map((_, i) => {
      const r = (Math.sin(i * 91.7) + 1) / 2;
      const y = 1920 - (((t * (18 + r * 30) + i * 140) % 2100) - 90);
      return <div key={i} style={{position: 'absolute', left: (i * 397) % 1080, top: y, width: 6 + r * 6, height: 6 + r * 6, borderRadius: 6, background: 'rgba(160,190,255,0.25)'}} />;
    })}
  </AbsoluteFill>
);

export const Cards: React.FC<{lang: 'zh' | 'en'}> = ({lang}) => {
  useFont();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cards = lang === 'zh' ? ZH : EN;
  const en = lang === 'en';
  return (
    <AbsoluteFill style={{fontFamily: '"Noto Sans SC", sans-serif', color: '#fff', overflow: 'hidden'}}>
      <Backdrop t={t} />
      {cards.map((c, i) => {
        const s = STARTS[i];
        const e = s + DUR[i];
        const enterFrom = i === 0 ? s : s - T;
        if (t < enterFrom || t > e) return null;
        let style: React.CSSProperties = {};
        if (i > 0 && t < s) style = transStyle(TRANS[(i - 1) % TRANS.length], inOut(clamp((t - (s - T)) / T)), 'in');
        if (i < cards.length - 1 && t > e - T) style = transStyle(TRANS[i % TRANS.length], inOut(clamp((t - (e - T)) / T)), 'out');
        return (
          <AbsoluteFill key={i} style={style}>
            <CardView c={c} tau={t - s} idx={i} en={en} />
          </AbsoluteFill>
        );
      })}
      {/* sound: each change has its own, and each highlight a different hit */}
      {cards.map((c, i) => (
        <span key={`s${i}`}>
          {i > 0
            ? SOUND[TRANS[(i - 1) % TRANS.length]].map((f, j) => (
                <Sequence key={f} from={Math.max(0, Math.round((STARTS[i] - T - 0.04 + j * 0.3) * fps))} durationInFrames={Math.round(0.9 * fps)}>
                  <Audio src={staticFile('sfx/' + f)} volume={f === 'boom.wav' ? 0.5 : 0.55} />
                </Sequence>
              ))
            : null}
          <Sequence from={Math.max(0, Math.round((STARTS[i] + hlTime(c) - (i === 0 ? HOOK_HEAD : 0)) * fps))} durationInFrames={Math.round(0.4 * fps)}>
            <Audio src={staticFile('sfx/' + HL_SOUND[i % HL_SOUND.length])} volume={0.5} />
          </Sequence>
          {c.num || c.clock ? (
            <Sequence from={Math.round((STARTS[i] + 0.05) * fps)} durationInFrames={Math.round(0.4 * fps)}>
              <Audio src={staticFile('sfx/click.wav')} volume={0.4} />
            </Sequence>
          ) : null}
        </span>
      ))}
    </AbsoluteFill>
  );
};
