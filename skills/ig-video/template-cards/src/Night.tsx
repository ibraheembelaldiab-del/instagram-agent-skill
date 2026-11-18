import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, inOut, outBack} from './Spec';

// 明明很累，却刷手机到凌晨 — horizontal, no voice, text + music explainer
// (the long-form pattern of the 1.4M-view plateau video, in our navy/yellow look).
// Kroese 2014 · Chang 2015 · Exelmans & Van den Bulck 2016 · Gollwitzer 1999 · Gollwitzer & Sheeran 2006

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
  {sc: 'clock', t: '明明困得睁不开眼，{r|还在刷手机}。'},
  {sc: 'clock', t: '定好12点睡，一抬头，{r|已经2点了}。'},
  {sc: 'clock', t: '第二天发誓早睡，晚上{r|又是这样}。'},
  {sc: 'clock', t: '这不只是你一个人。'},
  {sc: 'card1', t: '2014年，荷兰的心理学家给它起了名字：', card: ['睡前拖延', 'BEDTIME PROCRASTINATION'], src: 'Kroese et al., 2014'},
  {sc: 'card1', t: '没什么非做不可的事，{r|就是不去睡}。', card: ['睡前拖延', 'BEDTIME PROCRASTINATION'], src: 'Kroese et al., 2014'},
  {sc: 'gap', t: '这些人{g|不是不想睡}，', src: 'Kroese et al., 2014'},
  {sc: 'gap', t: '他们本来就打算早睡，只是{r|做不到}。', src: 'Kroese et al., 2014'},
  {sc: 'gap', t: '为什么？'},
  {sc: 'day', t: '白天的时间，给了{d|上课、上班、别人}。'},
  {sc: 'day', t: '只有深夜这几个小时，{y|是你自己的}。'},
  {sc: 'day', t: '去睡觉，就像把这点时间{r|也交出去}。'},
  {sc: 'card2', t: '网上管这叫{p|报复性熬夜}。', card: ['报复性熬夜', 'REVENGE BEDTIME PROCRASTINATION']},
  {sc: 'card2', t: '但这场报复，{r|输的是你自己}。', card: ['报复性熬夜', 'REVENGE BEDTIME PROCRASTINATION']},
  {sc: 'screen', t: '有个实验，让人睡前用{p|发光屏幕}看书。', src: 'Chang et al., 2015 · PNAS'},
  {sc: 'screen', t: '比起看纸质书，他们{r|多花约10分钟}才睡着，', src: 'Chang et al., 2015 · PNAS'},
  {sc: 'screen', t: '第二天早上，{r|也更不清醒}。', src: 'Chang et al., 2015 · PNAS'},
  {sc: 'survey', t: '另一项研究调查了{p|844}个成年人：', src: 'Exelmans & Van den Bulck, 2016'},
  {sc: 'survey', t: '睡前还在玩手机的人，{r|失眠更多，白天更累}。', src: 'Exelmans & Van den Bulck, 2016'},
  {sc: 'will', t: '那怎么办？{r|靠意志力}？'},
  {sc: 'will', t: '要是意志力有用，{r|你早就睡了}。'},
  {sc: 'card3', t: '心理学家有个更简单的办法：', card: ['如果……就……', 'IMPLEMENTATION INTENTIONS'], src: 'Gollwitzer, 1999'},
  {sc: 'plan', t: '不是说：{r|"我要早睡"}，'},
  {sc: 'plan', t: '而是说：{g|"如果到了11点，我就把手机放到客厅充电"}。', hold: 1.2},
  {sc: 'meta', t: '一项汇总了{p|94组实验}的分析发现，', src: 'Gollwitzer & Sheeran, 2006'},
  {sc: 'meta', t: '这样定计划的人，{g|明显更容易做到}。', src: 'Gollwitzer & Sheeran, 2006'},
  {sc: 'meta', t: '因为到了那个时间，你{g|不用再做决定}，照着做就行。', src: 'Gollwitzer & Sheeran, 2006'},
  {sc: 'fill', t: '今晚就试一次。'},
  {sc: 'fill', t: '在评论区写下{y|你的时间}。'},
  {sc: 'end', t: '你熬的不是夜，是{y|舍不得结束的一天}。', hold: 0.8},
  {sc: 'end', t: '转给那个总说{y|"马上就睡"}的朋友。'},
  {sc: 'refs', t: '', hold: 2.2},
];
const plain = (s: string) => s.replace(/\{\w\|([^}]*)\}/g, '$1');
const DUR = LINES.map((l) => (l.t ? Math.max(2.0, 0.9 + plain(l.t).length * 0.15) : 0) + (l.hold ?? 0));
const START: number[] = [];
DUR.reduce((a, d, i) => ((START[i] = a), a + d), 0.3);
const TOTAL = START[START.length - 1] + DUR[DUR.length - 1] + 0.4;
export const NIGHT_FRAMES = Math.ceil(TOTAL * 30);

// scene spans
const SCENES: {sc: string; a: number; b: number; first: number}[] = [];
LINES.forEach((l, i) => {
  const last = SCENES[SCENES.length - 1];
  const end = START[i] + DUR[i];
  if (last && last.sc === l.sc) last.b = end;
  else SCENES.push({sc: l.sc, a: i === 0 ? 0 : START[i], b: end, first: i});
});

const ALLTEXT = LINES.map((l) => plain(l.t) + (l.card?.[0] ?? '')).join('') + '明明很累却刷手机到凌晨如果到了点我就把放到上课上班通勤家务睡觉自己纸质书发光屏幕分钟个成年人失眠更多白天更累意志力参考资料打算睡真的睡做不到';

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
  if (sc === 'clock') {
    const mins = 23 * 60 + Math.min(180, Math.floor(clamp((u - 1) / Math.max(d - 3, 1)) * 180));
    const hh = Math.floor(mins / 60) % 24;
    const mm = mins % 60;
    const late = mins >= 24 * 60 + 60;
    return svg(
      <>
        <Ground />
        <g transform="translate(700 470)" style={glow('rgba(120,170,255,0.7)', 40)}>
          <rect x={-120} y={-230} width={240} height={460} rx={34} fill="#0d1430" stroke="#9fb6ff" strokeWidth={4} />
          <clipPath id="scr"><rect x={-100} y={-200} width={200} height={400} rx={20} /></clipPath>
          <g clipPath="url(#scr)">
            {Array.from({length: 14}).map((_, j) => {
              const yy = ((j * 70 - u * 160) % 980 + 980) % 980 - 260;
              return (
                <g key={j} transform={`translate(0 ${yy})`}>
                  <rect x={-80} y={0} width={160} height={40} rx={8} fill="rgba(160,190,255,0.35)" />
                  <rect x={-80} y={48} width={100} height={8} rx={4} fill="rgba(160,190,255,0.25)" />
                </g>
              );
            })}
          </g>
        </g>
        <T x={1180} y={520} s={150} c={late ? RED : W} w={400} f={SANS} a="start">{`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`}</T>
        <line x1={1180} y1={580} x2={1580} y2={580} stroke="rgba(160,180,255,0.4)" strokeWidth={2} />
        <circle cx={1180 + clamp((mins - 1380) / 180) * 400} cy={580} r={9} fill={late ? RED : Y} style={glow(late ? RED : Y)} />
        <T x={1180} y={625} s={26} c={DIM} f={SANS} a="start">23:00</T>
        <T x={1580} y={625} s={26} c={DIM} f={SANS} a="end">02:00</T>
      </>,
    );
  }
  if (sc === 'gap') {
    const a = clamp((u - 0.3) / 0.6);
    const b = clamp((u - 1.4) / 1.2);
    const c = clamp((u - 2.9) / 0.5);
    const x0 = 360, x1 = 1560, xs = (h: number) => x0 + ((h - 22) / 5) * (x1 - x0);
    return svg(
      <>
        <line x1={x0} y1={560} x2={x1} y2={560} stroke="rgba(160,180,255,0.45)" strokeWidth={3} />
        {[22, 23, 24, 25, 26, 27].map((h) => (
          <g key={h}>
            <line x1={xs(h)} y1={550} x2={xs(h)} y2={570} stroke={DIM} strokeWidth={2} />
            <T x={xs(h)} y={615} s={28} c={DIM} f={SANS}>{`${String(h % 24).padStart(2, '0')}:00`}</T>
          </g>
        ))}
        <g opacity={a}>
          <circle cx={xs(23)} cy={560} r={16} fill={Y} style={glow(Y)} />
          <T x={xs(23)} y={480} s={42} c={Y}>打算睡</T>
        </g>
        <path d={`M${xs(23)} 560 Q ${(xs(23) + xs(26)) / 2} ${560 - 260 * b} ${xs(23) + (xs(26) - xs(23)) * b} 560`} stroke={RED} strokeWidth={4} fill="none" strokeDasharray="12 10" opacity={b > 0 ? 1 : 0} />
        <g opacity={c}>
          <circle cx={xs(26)} cy={560} r={16} fill={RED} style={glow(RED)} />
          <T x={xs(26)} y={480} s={42} c={RED}>真的睡</T>
          <T x={(xs(23) + xs(26)) / 2} y={390} s={48} c={RED} w={900}>做不到</T>
        </g>
      </>,
    );
  }
  if (sc === 'day') {
    const segs: [string, number, string][] = [['睡觉', 7, 'rgba(120,140,200,0.25)'], ['上课 / 上班', 9, 'rgba(120,140,200,0.45)'], ['通勤 · 吃饭 · 家务 · 别人', 5.5, 'rgba(120,140,200,0.32)'], ['自己', 2.5, Y]];
    let acc = 0;
    const X0 = 260, LEN = 1400;
    return svg(
      <>
        {segs.map(([lab, h, c], j) => {
          const x = X0 + (acc / 24) * LEN; const w = (h / 24) * LEN; acc += h;
          const on = clamp((u - 0.2 - j * 0.35) / 0.4);
          const mine = j === 3;
          const shine = mine ? clamp((u - (START[SCENES.find((s) => s.sc === 'day')!.first + 1] - START[SCENES.find((s) => s.sc === 'day')!.first])) / 0.5) : 0;
          return (
            <g key={j} opacity={on}>
              <rect x={x + 3} y={480} width={w - 6} height={90} rx={12} fill={c} style={mine ? glow(Y, 10 + 30 * shine) : undefined} />
              <T x={x + w / 2} y={mine ? 670 : 455} s={mine ? 48 + 10 * shine : 30} c={mine ? Y : DIM} f={SANS} w={mine ? 900 : 500}>{lab}</T>
            </g>
          );
        })}
        <T x={X0} y={610} s={26} c={DIM} f={SANS} a="start">0:00</T>
      </>,
    );
  }
  if (sc === 'screen') {
    const a = clamp((u - 0.4) / 0.8);
    const b = clamp((u - 2.4) / 1.4);
    return svg(
      <>
        <T x={560} y={360} s={40} c={DIM}>入睡用时</T>
        <g transform="translate(560 430)">
          <T x={-30} y={52} s={40} a="end">纸质书</T>
          <rect x={0} y={20} width={520 * a} height={44} rx={8} fill="rgba(160,190,255,0.5)" />
        </g>
        <g transform="translate(560 560)">
          <T x={-30} y={52} s={40} a="end">发光屏幕</T>
          <rect x={0} y={20} width={520 * a + 300 * b} height={44} rx={8} fill={PUR} style={glow(PUR, 14)} />
          <T x={540 + 300 * b} y={56} s={44} c={RED} w={900} f={SANS} a="start" o={b}>+10 分钟</T>
        </g>
      </>,
    );
  }
  if (sc === 'survey') {
    const n = Math.floor(clamp((u - 0.2) / 1.6) * 844);
    const bad = clamp((u - (d * 0.5)) / 0.6);
    return svg(
      <>
        <g transform="translate(560 270)">
          {Array.from({length: 844}).map((_, j) => (
            <circle key={j} cx={(j % 38) * 21} cy={Math.floor(j / 38) * 21} r={6} fill={j < n ? (bad > 0 && j % 3 === 0 ? RED : '#9fb6ff') : 'rgba(160,180,255,0.12)'} opacity={j % 3 === 0 ? 1 : 1 - bad * 0.6} />
          ))}
        </g>
        <T x={960} y={235} s={56} c={PUR} w={900} f={SANS}>{n}</T>
      </>,
    );
  }
  if (sc === 'will') {
    const drain = clamp((u - 0.4) / Math.max(d - 1, 1));
    return svg(
      <>
        <T x={960} y={380} s={44} c={DIM}>意志力</T>
        <rect x={660} y={430} width={600} height={70} rx={35} fill="none" stroke="#9fb6ff" strokeWidth={4} />
        <rect x={672} y={442} width={576 * (1 - drain * 0.92)} height={46} rx={23} fill={drain > 0.6 ? RED : GREEN} style={glow(drain > 0.6 ? RED : GREEN, 12)} />
        <T x={960} y={600} s={36} c={DIM} f={SANS}>{drain > 0.6 ? '00:47' : '09:00'}</T>
      </>,
    );
  }
  if (sc === 'plan') {
    const cross = clamp((u - 1.2) / 0.4);
    const two = k >= 1;
    const a = clamp((u - (two ? START[SCENES.find((s) => s.sc === 'plan')!.first + 1] - START[SCENES.find((s) => s.sc === 'plan')!.first] : 99)) / 0.5);
    return svg(
      <>
        <g opacity={1 - a * 0.75} transform={`translate(960 ${300 - a * 60})`}>
          <T x={0} y={0} s={64} c={W}>“我要早睡”</T>
          <line x1={-200} y1={-20} x2={-200 + 400 * cross} y2={-20} stroke={RED} strokeWidth={8} />
        </g>
        <g opacity={a}>
          <rect x={300} y={400} width={560} height={200} rx={24} fill="rgba(255,210,63,0.08)" stroke={Y} strokeWidth={3} />
          <T x={580} y={470} s={36} c={DIM} f={SANS}>如果</T>
          <T x={580} y={550} s={60} c={Y} w={900}>到了 11 点</T>
          <path d={`M880 500 h${150 * clamp((u - 2.2) / 0.5)}`} stroke={W} strokeWidth={6} />
          <path d="M1010 480 l25 20 l-25 20" stroke={W} strokeWidth={6} fill="none" opacity={clamp((u - 2.6) / 0.2)} />
          <g opacity={clamp((u - 2.6) / 0.5)}>
            <rect x={1060} y={400} width={560} height={200} rx={24} fill="rgba(126,224,161,0.08)" stroke={GREEN} strokeWidth={3} style={glow('rgba(126,224,161,0.6)', 16)} />
            <T x={1340} y={470} s={36} c={DIM} f={SANS}>就</T>
            <T x={1340} y={550} s={54} c={GREEN} w={900}>手机放客厅充电</T>
          </g>
        </g>
      </>,
    );
  }
  if (sc === 'meta') {
    const n = Math.floor(clamp((u - 0.2) / 1.5) * 94);
    const up = clamp((u - 3.2) / 0.6);
    return svg(
      <>
        <g transform="translate(610 250)">
          {Array.from({length: 94}).map((_, j) => (
            <rect key={j} x={(j % 16) * 44} y={Math.floor(j / 16) * 44} width={32} height={32} rx={6} fill={j < n ? (up > 0 ? GREEN : '#9fb6ff') : 'rgba(160,180,255,0.12)'} style={j < n && up > 0 ? glow('rgba(126,224,161,0.7)', 8 * up) : undefined} />
          ))}
        </g>
        <T x={960} y={215} s={52} c={PUR} w={900} f={SANS}>{n}</T>
      </>,
    );
  }
  if (sc === 'fill') {
    const p = clamp(u / 0.6);
    return svg(
      <g opacity={p} transform={`translate(960 ${470 + (1 - p) * 30})`}>
        <rect x={-760} y={-150} width={1520} height={300} rx={30} fill="rgba(255,210,63,0.06)" stroke={Y} strokeWidth={3} style={glow('rgba(255,210,63,0.5)', 24)} />
        <T x={0} y={-30} s={68} c={W}>如果到了 ___ 点，</T>
        <T x={0} y={80} s={68} c={W}>我就把手机放到 _____。</T>
      </g>,
    );
  }
  if (sc === 'end') {
    const p = clamp(u / 1.2);
    return svg(
      <>
        <Ground />
        <circle cx={960} cy={380} r={70} fill={Y} opacity={0.9 * p} style={glow(Y, 50)} />
        <circle cx={995} cy={360} r={64} fill="#0a0f26" opacity={p} />
      </>,
    );
  }
  if (sc === 'refs') {
    const refs = [
      'Kroese, de Ridder, Evers & Adriaanse (2014). Bedtime procrastination. Frontiers in Psychology.',
      'Chang, Aeschbach, Duffy & Czeisler (2015). Evening use of light-emitting eReaders… PNAS.',
      'Exelmans & Van den Bulck (2016). Bedtime mobile phone use and sleep in adults. Soc Sci Med.',
      'Gollwitzer (1999). Implementation intentions: strong effects of simple plans. Am Psychol.',
      'Gollwitzer & Sheeran (2006). Implementation intentions and goal achievement: a meta-analysis.',
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

export const Night: React.FC = () => {
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
      {sp.sc === 'clock' ? (
        <div style={{position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center', fontSize: 84, fontWeight: 900, letterSpacing: 4, textShadow: '0 4px 30px rgba(0,0,0,0.8)'}}>
          明明很累，却刷手机到<span style={{color: Y}}>凌晨</span>
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
      {SCENES.slice(1).map((s, j) => (
        <Sequence key={j} from={Math.round(s.a * fps)} durationInFrames={Math.round(1.0 * fps)}>
          <Audio src={staticFile('sfx/lowswoosh.wav')} volume={0.12} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
