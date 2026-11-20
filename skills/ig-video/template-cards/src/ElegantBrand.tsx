import {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {At, clamp, inOut, outBack, outCubic} from './Spec';

// "话术博弈" in the black-and-gold knowledge-showcase style: serif type, thin
// gold line drawings, chat bubbles that act out each trick, a chapter tag
// with a progress bar, subtitles at the bottom, and a "YOUR CALL" vote.

const GOLD = '#ffd23f';
const GOLD_DIM = 'rgba(255,210,63,0.35)';
const RED = '#ff5a6e';
const INK = '#0b1026';
const SERIF = '"Noto Serif SC", serif';

const DUR = [4.5, 8, 8, 8, 4.5];
const STARTS = DUR.map((_, i) => DUR.slice(0, i).reduce((a, b) => a + b, 0));
export const BRAND_FRAMES = Math.round(DUR.reduce((a, b) => a + b, 0) * 30);
const XF = 0.5;

type L = 'zh' | 'en';
const T = {
  zh: {
    hookA: '能帮我个忙吗？',
    hookB: '能帮我个忙吗？因为我赶时间。',
    no: '拒绝',
    yes: '答应',
    hook1: '加一个词',
    hook2: '答应率',
    hookSub: ['同一个请求，只多了', '「因为」两个字'],
    tags: [
      ['01', '一个「因为」', '职场篇'],
      ['02', '先小后大', '熟人篇'],
      ['03', '复述对方', '生活篇'],
    ],
    t1a: '我能先用一下复印机吗？',
    t1b: '我能先用吗？因为我要复印。',
    t1sub: ['理由是句废话，', '答应的人也从', '60%', '升到', '93%'],
    t2a: '能签个名支持安全驾驶吗？',
    t2b: '能在你家门口立块大牌子吗？',
    t2sub: ['先答应过小事的人，', '再答应大请求：', '17%', '→', '76%'],
    t2l: ['没先问小事', '先签过名'],
    t3a: '一杯美式，少冰。',
    t3b: '好的，一杯美式，少冰。',
    t3c: '好的。',
    t3sub: ['服务员一字不差地复述点单，', '拿到的小费', '明显更多', '', ''],
    t3l: ['只说「好的」', '复述点单'],
    src: ['研究：Langer 等, 1978', '研究：Freedman & Fraser, 1966', '研究：van Baaren 等, 2003'],
    call: ['情商', '心机'],
    callSub: '你觉得这是情商还是心机？情商扣1，心机扣2。',
    me: '我',
    them: '对方',
  },
  en: {
    hookA: 'Can you do me a favor?',
    hookB: "Can you do me a favor? Because I'm in a rush.",
    no: 'No',
    yes: 'Yes',
    hook1: 'One word',
    hook2: 'yes rate',
    hookSub: ['Same request. The only difference:', 'the word "because"'],
    tags: [
      ['01', 'Add "because"', 'WORK'],
      ['02', 'Start small', 'FRIENDS'],
      ['03', 'Echo them', 'DAILY'],
    ],
    t1a: 'Can I use the copier first?',
    t1b: 'Can I go first? Because I need copies.',
    t1sub: ['Even a pointless reason took', '"yes" from', '60%', 'to', '93%'],
    t2a: 'Will you sign for safe driving?',
    t2b: 'Can we put a big sign on your lawn?',
    t2sub: ['People who said yes to a small ask first:', 'the big yes went', '17%', '→', '76%'],
    t2l: ['Asked big first', 'Signed first'],
    t3a: 'An americano, light ice.',
    t3b: 'Sure, an americano, light ice.',
    t3c: 'Sure.',
    t3sub: ['Waiters who repeated the order', 'word for word got', 'bigger tips', '', ''],
    t3l: ['Just "sure"', 'Repeated it'],
    src: ['Research: Langer et al., 1978', 'Research: Freedman & Fraser, 1966', 'Research: van Baaren et al., 2003'],
    call: ['Smart', 'Sneaky'],
    callSub: 'Smart or sneaky? Comment 1 for smart, 2 for sneaky.',
    me: 'ME',
    them: 'THEM',
  },
};

const useSerif = () => {
  const [h] = useState(() => delayRender('serif'));
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = ['400', '700', '900'].map((w) => `@import url('${staticFile(`serif/${w}.css`)}');`).join('');
    document.head.appendChild(el);
    setTimeout(async () => {
      await Promise.all(['400 40px "Noto Serif SC"', '700 40px "Noto Serif SC"', '900 40px "Noto Serif SC"'].map((f) => document.fonts.load(f, '能帮我个忙吗因为赶时间拒绝答应加一个词率同请求只多了字职场熟人生活先小后大复述对方用印机要理由是句废话从升到签名支持安全驾驶在你家门口立块大牌子过事的再没问美式少冰好服务员不差地点单拿费明显更情商心机觉得这还扣研究等 Can you')));
      await document.fonts.ready;
      continueRender(h);
    }, 50);
  }, [h]);
};

const Fade: React.FC<{t: number; at: number; children: React.ReactNode; style?: React.CSSProperties; dy?: number}> = ({t, at, children, style, dy = 30}) => {
  const p = outCubic((t - at) / 0.45);
  return <div style={{...style, opacity: p, transform: `${style?.transform ?? ''} translateY(${(1 - p) * dy}px)`}}>{children}</div>;
};

// A chat bubble with a gold (or red) outline and a small speaker label.
const Bubble: React.FC<{t: number; at: number; text: string; side: 'l' | 'r'; tone?: 'gold' | 'red' | 'dim'; who: string; y: number; dim?: boolean}> = ({t, at, text, side, tone = 'gold', who, y, dim}) => {
  const p = outBack((t - at) / 0.5);
  const c = tone === 'red' ? RED : tone === 'dim' ? GOLD_DIM : GOLD;
  return (
    <div style={{position: 'absolute', top: y, [side === 'l' ? 'left' : 'right']: 70, display: 'flex', flexDirection: side === 'l' ? 'row' : 'row-reverse', alignItems: 'center', gap: 18, opacity: clamp((t - at) / 0.25) * (dim ? 0.45 : 1), transform: `scale(${0.85 + 0.15 * p})`, transformOrigin: side === 'l' ? 'left center' : 'right center'}}>
      <div style={{width: 64, height: 64, borderRadius: 32, border: `2px solid ${c}`, color: c, fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF}}>{who}</div>
      <div style={{maxWidth: 760, padding: '22px 30px', borderRadius: 18, border: `2px solid ${c}`, background: 'rgba(13,20,48,0.85)', color: '#ffffff', fontSize: 44, lineHeight: 1.35, fontFamily: SERIF, boxShadow: tone === 'gold' ? '0 0 30px rgba(255,210,63,0.18)' : undefined}}>{text}</div>
    </div>
  );
};

// A verdict stamp: ✕ red or ✓ gold.
const Verdict: React.FC<{t: number; at: number; ok: boolean; text: string; y: number; side: 'l' | 'r'}> = ({t, at, ok, text, y, side}) => {
  const p = outBack((t - at) / 0.4);
  return (
    <div style={{position: 'absolute', top: y, [side === 'l' ? 'left' : 'right']: 160, opacity: clamp((t - at) / 0.2), transform: `scale(${p})`, color: ok ? GOLD : RED, fontFamily: SERIF, fontWeight: 700, fontSize: 38, border: `2px solid ${ok ? GOLD : RED}`, borderRadius: 40, padding: '6px 26px'}}>
      {ok ? '✓ ' : '✕ '}
      {text}
    </div>
  );
};

// Two bars that grow to their values.
const Bars: React.FC<{t: number; at: number; a: number; b: number; la: string; lb: string; y: number}> = ({t, at, a, b, la, lb, y}) => {
  const k = inOut((t - at) / 1.1);
  const row = (label: string, v: number, hi: boolean, i: number) => (
    <div key={label} style={{display: 'flex', alignItems: 'center', gap: 24, marginBottom: 26, opacity: clamp((t - at - i * 0.15) / 0.3)}}>
      <div style={{width: 250, textAlign: 'right', color: hi ? GOLD : '#8fa0d8', fontFamily: SERIF, fontSize: 36}}>{label}</div>
      <div style={{width: 560, height: 46, borderRadius: 23, background: 'rgba(255,255,255,0.06)', overflow: 'hidden'}}>
        <div style={{width: `${v * k}%`, height: '100%', borderRadius: 23, background: hi ? `linear-gradient(90deg, #e0b020, ${GOLD})` : '#3a4370'}} />
      </div>
      <div style={{width: 120, color: hi ? GOLD : '#8fa0d8', fontFamily: SERIF, fontWeight: 900, fontSize: 48}}>{Math.round(v * k)}%</div>
    </div>
  );
  return <div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>{[row(la, a, false, 0), row(lb, b, true, 1)]}</div>;
};

// Thin gold line art of a face, as in the reference style.
const Face: React.FC<{t: number; x: number; y: number; s?: number; mood?: 'flat' | 'smile'}> = ({t, x, y, s = 1, mood = 'flat'}) => (
  <svg width={260 * s} height={320 * s} viewBox="0 0 260 320" style={{position: 'absolute', left: x, top: y, opacity: clamp(t / 0.5)}}>
    <g fill="none" stroke="#ffffff" strokeWidth={3} strokeLinecap="round">
      <path d="M130 20 C 60 20 30 80 35 150 C 40 230 85 290 130 295 C 175 290 220 230 225 150 C 230 80 200 20 130 20 Z" />
      <path d="M70 120 q25 -18 50 0 M140 120 q25 -18 50 0" />
      <ellipse cx="95" cy="140" rx="18" ry="9" /><ellipse cx="165" cy="140" rx="18" ry="9" />
      <circle cx="95" cy="140" r="4" fill="#ffffff" /><circle cx="165" cy="140" r="4" fill="#ffffff" />
      <path d="M130 150 L120 200 L135 205" />
      {mood === 'smile' ? <path d="M95 235 q35 28 70 0" /> : <path d="M100 240 q30 -10 60 0" />}
    </g>
  </svg>
);

// Chapter tag with progress segments at the top.
const Tag: React.FC<{t: number; idx: number; n: string; title: string; cat: string}> = ({t, idx, n, title, cat}) => (
  <Fade t={t} at={0} style={{position: 'absolute', top: 90, left: 70}}>
    <div style={{display: 'flex', gap: 10, marginBottom: 18}}>
      {[0, 1, 2].map((k) => (
        <div key={k} style={{width: 70, height: 6, borderRadius: 3, background: k < idx ? GOLD : k === idx ? `linear-gradient(90deg, ${GOLD} ${clamp(t / 7) * 100}%, #2a3358 0)` : '#2a3358'}} />
      ))}
    </div>
    <div style={{display: 'flex', alignItems: 'center', gap: 18, fontFamily: SERIF, color: '#ffffff'}}>
      <span style={{fontStyle: 'italic', color: GOLD, fontSize: 40}}>{n}</span>
      <span style={{fontSize: 44, fontWeight: 700}}>{title}</span>
      <span style={{fontSize: 26, color: GOLD, border: `2px solid ${GOLD_DIM}`, borderRadius: 20, padding: '2px 16px'}}>{cat}</span>
    </div>
  </Fade>
);

// The subtitle line at the bottom, with gold highlights on the numbers.
const Sub: React.FC<{t: number; at: number; parts: string[]}> = ({t, at, parts}) => (
  <Fade t={t} at={at} style={{position: 'absolute', bottom: 260, left: 60, right: 60, textAlign: 'center', fontFamily: SERIF, color: '#ffffff', fontSize: 50, lineHeight: 1.5}}>
    <div>{parts[0]}</div>
    <div>
      {parts[1]}
      <span style={{color: GOLD, fontWeight: 900}}> {parts[2]} </span>
      {parts[3]}
      <span style={{color: GOLD, fontWeight: 900}}> {parts[4]}</span>
    </div>
  </Fade>
);
const Src: React.FC<{t: number; at: number; text: string}> = ({t, at, text}) => (
  <Fade t={t} at={at} style={{position: 'absolute', bottom: 150, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, color: '#8090c8', fontSize: 30}}>
    {text}
  </Fade>
);

const Scene: React.FC<{i: number; t: number; L: typeof T.zh}> = ({i, t, L}) => {
  if (i === 0) {
    return (
      <AbsoluteFill style={{transform: `scale(${1 + clamp(t / 4.5) * 0.04})`}}>
        <Face t={t + 1} x={70} y={190} s={0.75} mood={t > 2.4 ? 'smile' : 'flat'} />
        <Bubble t={t} at={-0.3} text={L.hookA} side="r" who={L.me} y={300} dim={t > 1.6} />
        <Verdict t={t} at={0.7} ok={false} text={L.no} y={430} side="r" />
        <Bubble t={t} at={1.6} text={L.hookB} side="r" who={L.me} y={560} />
        <Verdict t={t} at={2.4} ok text={L.yes} y={740} side="r" />
        <Fade t={t} at={-0.2} style={{position: 'absolute', top: 930, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF}}>
          <div style={{fontSize: 96, fontWeight: 900, color: '#ffffff', letterSpacing: 6}}>{L.hook1}</div>
          <div style={{fontSize: 64, color: '#c9d4ff', marginTop: 10}}>
            {L.hook2}
            <span style={{color: '#8fa0d8'}}> 60% </span>→<span style={{color: GOLD, fontWeight: 900, fontSize: 110}}> 93%</span>
          </div>
        </Fade>
        <Fade t={t} at={2.6} style={{position: 'absolute', bottom: 300, left: 60, right: 60, textAlign: 'center', fontFamily: SERIF, color: '#ffffff', fontSize: 46, lineHeight: 1.5}}>
          <div>{L.hookSub[0]}</div>
          <div style={{color: GOLD}}>{L.hookSub[1]}</div>
        </Fade>
        <Src t={t} at={3} text={L.src[0]} />
      </AbsoluteFill>
    );
  }
  if (i === 1) {
    const [n, title, cat] = L.tags[0];
    return (
      <AbsoluteFill style={{transform: `scale(${1 + clamp(t / 8) * 0.03})`}}>
        <Tag t={t} idx={0} n={n} title={title} cat={cat} />
        {/* a copier and a queue, in gold line */}
        <svg width={1080} height={420} style={{position: 'absolute', top: 290, left: 0, opacity: clamp(t / 0.5)}}>
          <g fill="none" stroke="#ffffff" strokeWidth={3}>
            <rect x={760} y={160} width={200} height={150} rx={10} /><rect x={780} y={130} width={160} height={30} rx={6} /><line x1={790} y1={210} x2={930} y2={210} />
            {[0, 1, 2].map((k) => (
              <g key={k} transform={`translate(${200 + k * 150} 150)`}><circle cx={0} cy={0} r={34} /><path d="M-55 130 C -55 60, 55 60, 55 130" /></g>
            ))}
          </g>
          <circle cx={200} cy={150} r={34} fill="none" stroke={GOLD} strokeWidth={4} />
        </svg>
        <Bubble t={t} at={0.6} text={L.t1a} side="l" who={L.me} y={720} dim={t > 2.4} />
        <Bubble t={t} at={2.0} text={L.t1b} side="l" who={L.me} y={860} />
        <Bars t={t} at={3.0} a={60} b={93} la={L.t1a.length > 14 ? 'No reason' : '没理由'} lb={L.t1a.length > 14 ? '"Because"' : '有「因为」'} y={1040} />
        <Sub t={t} at={3.6} parts={L.t1sub} />
        <Src t={t} at={4} text={L.src[0]} />
      </AbsoluteFill>
    );
  }
  if (i === 2) {
    const [n, title, cat] = L.tags[1];
    const step = inOut((t - 2.2) / 0.8);
    return (
      <AbsoluteFill style={{transform: `scale(${1 + clamp(t / 8) * 0.03})`}}>
        <Tag t={t} idx={1} n={n} title={title} cat={cat} />
        {/* a small step, then a big one */}
        <svg width={1080} height={420} style={{position: 'absolute', top: 300, left: 0, opacity: clamp(t / 0.5)}}>
          <g fill="none" stroke="#ffffff" strokeWidth={3}>
            <path d="M160 360 L360 360 L360 300 L560 300 L560 160 L900 160" />
          </g>
          <circle cx={260 + step * 420} cy={300 - step * 140 - 40} r={30} fill="none" stroke={GOLD} strokeWidth={4} />
          <line x1={260 + step * 420} y1={300 - step * 140 - 10} x2={260 + step * 420} y2={300 - step * 140 + 50} stroke={GOLD} strokeWidth={4} />
          <text x={260} y={395} fill={GOLD} fontFamily="Noto Serif SC" fontSize={30} textAnchor="middle">①</text>
          <text x={730} y={200} fill={GOLD} fontFamily="Noto Serif SC" fontSize={30} textAnchor="middle">②</text>
        </svg>
        <Bubble t={t} at={0.6} text={L.t2a} side="l" who="①" y={740} />
        <Bubble t={t} at={2.2} text={L.t2b} side="l" who="②" y={880} />
        <Bars t={t} at={3.2} a={17} b={76} la={L.t2l[0]} lb={L.t2l[1]} y={1060} />
        <Sub t={t} at={3.8} parts={L.t2sub} />
        <Src t={t} at={4.2} text={L.src[1]} />
      </AbsoluteFill>
    );
  }
  if (i === 3) {
    const [n, title, cat] = L.tags[2];
    return (
      <AbsoluteFill style={{transform: `scale(${1 + clamp(t / 8) * 0.03})`}}>
        <Tag t={t} idx={2} n={n} title={title} cat={cat} />
        <Bubble t={t} at={0.5} text={L.t3a} side="l" who={L.them} y={330} />
        <Bubble t={t} at={1.4} text={L.t3c} side="r" who={L.me} y={480} tone="dim" />
        <Verdict t={t} at={1.9} ok={false} text="🪙" y={600} side="r" />
        <Bubble t={t} at={2.6} text={L.t3b} side="r" who={L.me} y={720} />
        {/* coins dropping in */}
        {Array.from({length: 6}).map((_, k) => {
          const p = outCubic((t - 3.2 - k * 0.12) / 0.4);
          return <div key={k} style={{position: 'absolute', right: 120 + k * 46, top: 860 - (1 - p) * 80, width: 40, height: 40, borderRadius: 20, border: `3px solid ${GOLD}`, background: 'rgba(255,210,63,0.25)', opacity: p}} />;
        })}
        {/* tips: two coin piles, no invented numbers */}
        {[0, 1].map((side) => (
          <div key={side} style={{position: 'absolute', top: 1010, left: side ? 600 : 140, width: 340, textAlign: 'center', fontFamily: SERIF, color: side ? GOLD : '#8fa0d8', fontSize: 34, opacity: clamp((t - 3.6 - side * 0.3) / 0.4)}}>
            <div style={{height: 170, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center'}}>
              {Array.from({length: side ? 6 : 2}).map((_, k) => (
                <div key={k} style={{width: 120, height: 24, marginTop: -4, borderRadius: 12, border: `3px solid ${side ? GOLD : '#3a4370'}`, background: side ? 'rgba(255,210,63,0.25)' : 'rgba(58,67,112,0.35)', opacity: clamp((t - 3.7 - side * 0.3 - k * 0.1) / 0.2)}} />
              ))}
            </div>
            <div style={{marginTop: 14}}>{L.t3l[side]}</div>
          </div>
        ))}
        <Sub t={t} at={4.2} parts={L.t3sub} />
        <Src t={t} at={4.6} text={L.src[2]} />
      </AbsoluteFill>
    );
  }
  // YOUR CALL: the comment vote.
  const card = (label: string, num: number, red: boolean, at: number) => {
    const p = outBack((t - at) / 0.5);
    const c = red ? RED : GOLD;
    return (
      <div style={{width: 380, height: 380, borderRadius: 26, border: `4px solid ${c}`, background: red ? 'rgba(255,90,110,0.12)' : 'rgba(255,210,63,0.12)', boxShadow: `0 0 50px ${red ? 'rgba(255,90,110,0.35)' : 'rgba(255,210,63,0.35)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})`, opacity: clamp((t - at) / 0.2), fontFamily: SERIF, color: c}}>
        <div style={{fontSize: label.length > 3 ? 84 : 110, fontWeight: 900}}>{label}</div>
        <div style={{fontSize: 52, marginTop: 10}}>{L.me === '我' ? '扣' : 'Comment'} {num}</div>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <Fade t={t} at={0} style={{position: 'absolute', top: 520, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, color: GOLD, fontSize: 40, letterSpacing: 18}}>
        YOUR CALL
      </Fade>
      <div style={{position: 'absolute', top: 640, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 50}}>
        {card(L.call[0], 1, false, 0.3)}
        <span style={{fontFamily: SERIF, fontStyle: 'italic', color: '#8090c8', fontSize: 44, opacity: clamp((t - 0.6) / 0.3)}}>vs</span>
        {card(L.call[1], 2, true, 0.6)}
      </div>
      <Fade t={t} at={1.2} style={{position: 'absolute', bottom: 300, left: 60, right: 60, textAlign: 'center', fontFamily: SERIF, color: '#ffffff', fontSize: 46, lineHeight: 1.5}}>
        {L.callSub}
      </Fade>
    </AbsoluteFill>
  );
};

export const ElegantBrand: React.FC<{lang: L}> = ({lang}) => {
  useSerif();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const L = T[lang];
  const total = STARTS[4] + DUR[4];
  const fade = clamp((t - (total - 1.0)) / 0.9);
  return (
    <AbsoluteFill style={{background: INK, overflow: 'hidden'}}>
      {/* warm glow drifting slowly, and fine dust */}
      <AbsoluteFill style={{background: `radial-gradient(900px 800px at ${50 + Math.sin(t * 0.3) * 6}% ${45 + Math.cos(t * 0.25) * 5}%, rgba(80,140,255,0.24), transparent 70%)`}} />
      {Array.from({length: 30}).map((_, k) => {
        const r = (Math.sin(k * 77.7) + 1) / 2;
        const y = 1920 - (((t * (10 + r * 16) + k * 97) % 2000) - 40);
        return <div key={k} style={{position: 'absolute', left: (k * 331) % 1080, top: y, width: 3 + r * 4, height: 3 + r * 4, borderRadius: 4, background: 'rgba(160,190,255,0.25)'}} />;
      })}
      {DUR.map((d, i) => {
        const s = STARTS[i];
        const e = s + d;
        const inK = i === 0 ? 1 : inOut((t - (s - XF / 2)) / XF);
        const outK = i === DUR.length - 1 ? 0 : inOut((t - (e - XF / 2)) / XF);
        if (inK <= 0 || outK >= 1) return null;
        return (
          <AbsoluteFill key={i} style={{opacity: inK * (1 - outK), transform: `scale(${(1 - outK * 0.06) * (1 + (1 - inK) * 0.05)})`}}>
            <Scene i={i} t={t - s} L={L} />
          </AbsoluteFill>
        );
      })}
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
      {/* sound: a whoosh at each change, soft dings on bubbles and verdicts, a chime at the vote */}
      {STARTS.slice(1).map((b) => (
        <At key={`w${b}`} t={b - 0.3} f="whoosh.wav" v={0.4} />
      ))}
      {[
        [0, 0.05], [0, 0.7], [0, 1.6], [0, 2.4],
        [1, 0.6], [1, 2.0], [1, 3.0],
        [2, 0.6], [2, 2.2], [2, 3.2],
        [3, 0.5], [3, 1.4], [3, 2.6], [3, 3.2],
      ].map(([sc, a]) => (
        <At key={`d${sc}-${a}`} t={STARTS[sc] + a} f={a === 0.7 || (sc === 3 && a === 1.4) ? 'click.wav' : 'ding.wav'} v={0.26} />
      ))}
      <At t={STARTS[4] + 0.3} f="chime.wav" v={0.45} len={2.6} />
    </AbsoluteFill>
  );
};
