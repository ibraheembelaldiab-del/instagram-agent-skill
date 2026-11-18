import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, useFont} from './Cards';
import {clamp, inOut, outBack} from './Spec';
import EN from './phantom-en.json';
import ZH from './phantom-zh.json';

// Phantom phone vibration (Drouin 2012, Rothberg 2010). Packaging as in the
// repackaged silent-in-a-fight episode after the Nov 17 numbers (good engagement,
// weak packaging): the whole hook is big text on frame one (it is the cover),
// a close-up face that fills the screen, two points, an early comment prompt,
// a curiosity gap before point two and a share prompt at the end.

type Beat = {say: string; top: string; src?: string; start: number; dur: number; words: [string, number, number][]};
const total = (b: Beat[]) => b[b.length - 1].start + b[b.length - 1].dur;
export const PHANTOM_EN_FRAMES = Math.ceil(total(EN as Beat[]) * 30);
export const PHANTOM_ZH_FRAMES = Math.ceil(total(ZH as Beat[]) * 30);

const Y = '#ffd23f';
const W = '#ffffff';
const RED = '#ff5a6e';
const GREEN = '#4dd68a';
const DIM = '#8fa0d8';

const T = {
  en: {
    hook: ['Felt your phone buzz…', 'and nothing was there?', '89% of students have.'],
    hl: 2, bzz: 'Bzzz…', none: 'No new messages', week: 'times a week?', twitch: 'twitch', brain: 'MESSAGE?!', calm: 'relaxed', anx: 'always checking',
    off: 'Vibrate', pocket: 'other pocket', share: 'Send to them', brand: ['Brain', 'Manual'], src: 'Research: ',
  },
  zh: {
    hook: ['手机明明没响', '你却感觉它在震？', '89%的大学生都有过'],
    hl: 2, bzz: '嗡嗡…', none: '没有新消息', week: '一周几次？', twitch: '抽动', brain: '消息？！', calm: '不在意', anx: '时刻在意',
    off: '振动', pocket: '换个口袋', share: '转给TA', brand: ['脑子', '说明书'], src: '研究：',
  },
};

// A big phone, buzzing (or not).
const Phone: React.FC<{x: number; y: number; s?: number; buzz?: number; t: number; screen: string; ghost?: boolean}> = ({x, y, s = 1, buzz = 0, t, screen, ghost}) => {
  const jx = buzz * Math.sin(t * 70) * 10;
  return (
    <g transform={`translate(${x + jx} ${y}) scale(${s})`} opacity={ghost ? 0.55 : 1}>
      {buzz > 0
        ? [1, 2, 3].map((k) => (
            <g key={k} opacity={buzz * (0.8 - k * 0.2) * (0.6 + 0.4 * Math.sin(t * 18 + k))}>
              <path d={`M${-200 - k * 36} -120 q-30 120 0 240`} stroke={Y} strokeWidth={12} fill="none" strokeLinecap="round" />
              <path d={`M${200 + k * 36} -120 q30 120 0 240`} stroke={Y} strokeWidth={12} fill="none" strokeLinecap="round" />
            </g>
          ))
        : null}
      <rect x={-170} y={-320} width={340} height={640} rx={52} fill={ghost ? 'none' : '#2a3a7a'} stroke={ghost ? W : '#0d1430'} strokeWidth={ghost ? 8 : 18} strokeDasharray={ghost ? '26 18' : undefined} style={{filter: ghost ? undefined : 'drop-shadow(0 0 50px rgba(120,170,255,0.55))'}} />
      {!ghost ? <rect x={-145} y={-280} width={290} height={560} rx={36} fill="#5a7ff0" /> : null}
      {!ghost ? <rect x={-50} y={-305} width={100} height={18} rx={9} fill="#0d1430" /> : null}
      <text x={0} y={10} textAnchor="middle" fill={W} fontSize={screen.length > 8 ? 34 : 44} fontWeight={900} fontFamily="Noto Sans SC">{screen}</text>
    </g>
  );
};
const MiniFace: React.FC<{x: number; y: number; mood: 'calm' | 'anx'; t: number}> = ({x, y, mood, t}) => (
  <g transform={`translate(${x + (mood === 'anx' ? Math.sin(t * 30) * 3 : 0)} ${y}) scale(1.45)`}>
    <circle r={120} fill="#16204a" stroke={mood === 'anx' ? RED : GREEN} strokeWidth={12} />
    <circle cx={-40} cy={-15} r={mood === 'anx' ? 16 : 10} fill={W} />
    <circle cx={40} cy={-15} r={mood === 'anx' ? 16 : 10} fill={W} />
    <path d={mood === 'anx' ? 'M-35 55 q35 -20 70 0' : 'M-35 40 q35 30 70 0'} stroke={W} strokeWidth={10} fill="none" strokeLinecap="round" />
  </g>
);

const Scene: React.FC<{i: number; u: number; d: number; L: typeof T.en}> = ({i, u, d, L}) => {
  const svg = (c: React.ReactNode) => <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>{c}</svg>;
  if (i === 0) {
    const on = u < 2.2 ? 1 : 0;
    return svg(<Phone x={540} y={1230} t={u} buzz={on} screen={u < 2.2 ? L.bzz : L.none} />);
  }
  if (i === 1) {
    return svg(
      <>
        <Phone x={540} y={1180} t={u} ghost screen="?" />
        {['1?', '3?', '10?'].map((n, k) => (
          <g key={k} transform={`translate(${[220, 860, 540][k]} ${[900, 1000, 1640][k]}) scale(${outBack(clamp((u - 0.6 - k * 0.4) / 0.4))})`}>
            <rect x={-90} y={-55} width={180} height={100} rx={28} fill="rgba(13,20,48,0.95)" stroke={Y} strokeWidth={5} />
            <text x={0} y={18} textAnchor="middle" fill={Y} fontSize={54} fontWeight={900} fontFamily="Noto Sans SC">{n}</text>
          </g>
        ))}
        <text x={540} y={1780} textAnchor="middle" fill={W} fontSize={44} fontWeight={900} fontFamily="Noto Sans SC" opacity={clamp((u - 1.8) / 0.4)}>{L.week}</text>
      </>,
    );
  }
  if (i === 2) {
    // skin twitch → brain alarm → phantom buzz; then a curiosity "?"
    const a = clamp((u - 0.3) / 0.6);
    const b = clamp((u - 1.6) / 0.6);
    const c = clamp((u - 3.0) / 0.6);
    const gap = clamp((u - d * 0.72) / 0.4);
    return svg(
      <>
        {/* a pocket */}
        <path d="M120 1350 h340 v330 q-170 90 -340 0 z" fill="#1c2a5c" stroke={DIM} strokeWidth={8} />
        <g opacity={a}>
          {[0, 1, 2].map((k) => <line key={k} x1={230 + k * 60} y1={1500} x2={250 + k * 60} y2={1470 + Math.sin(u * 30 + k) * 12} stroke={Y} strokeWidth={8} strokeLinecap="round" />)}
          <text x={290} y={1600} textAnchor="middle" fill={Y} fontSize={40} fontWeight={900} fontFamily="Noto Sans SC">{L.twitch}</text>
        </g>
        <path d="M470 1450 C 560 1300 620 1200 700 1120" stroke={W} strokeWidth={8} fill="none" strokeDasharray="18 14" opacity={b} />
        <g transform="translate(790 1000)" opacity={b}>
          <ellipse rx={170} ry={130} fill="#16204a" stroke={RED} strokeWidth={10} style={{filter: `drop-shadow(0 0 ${20 + 10 * Math.sin(u * 10)}px ${RED})`}} />
          <path d="M-90 -30 q40 -50 80 0 q40 -50 80 0 M-90 40 q60 -40 180 0" stroke={RED} strokeWidth={8} fill="none" />
        </g>
        <g opacity={c}>
          <rect x={560} y={1230} width={460} height={110} rx={30} fill="rgba(255,90,110,0.15)" stroke={RED} strokeWidth={6} />
          <text x={790} y={1305} textAnchor="middle" fill={RED} fontSize={56} fontWeight={900} fontFamily="Noto Sans SC">{L.brain}</text>
        </g>
        {gap > 0 ? <text x={540} y={860} textAnchor="middle" fill={Y} fontSize={220} fontWeight={900} fontFamily="Noto Sans SC" transform={`translate(540 860) scale(${outBack(gap)}) translate(-540 -860)`}>?</text> : null}
      </>,
    );
  }
  if (i === 3) {
    const fix = clamp((u - d * 0.45) / 0.5);
    return svg(
      <>
        <g opacity={1 - fix}>
          <MiniFace x={280} y={1150} mood="calm" t={u} />
          <MiniFace x={790} y={1150} mood="anx" t={u} />
          <text x={280} y={1420} textAnchor="middle" fill={GREEN} fontSize={50} fontWeight={900} fontFamily="Noto Sans SC">{L.calm}</text>
          <text x={790} y={1420} textAnchor="middle" fill={RED} fontSize={50} fontWeight={900} fontFamily="Noto Sans SC">{L.anx}</text>
          {[1, 2].map((k) => <path key={k} d={`M${960 + k * 30} ${1060} q25 90 0 180`} stroke={RED} strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.5 + 0.5 * Math.sin(u * 12 + k)} />)}
        </g>
        <g opacity={fix}>
          {/* a vibrate switch turned off */}
          <rect x={250} y={1000} width={580} height={180} rx={90} fill="#1c2a5c" stroke={DIM} strokeWidth={8} />
          <circle cx={340 + (1 - fix) * 400} cy={1090} r={70} fill={W} />
          <text x={620} y={1110} textAnchor="middle" fill={W} fontSize={56} fontWeight={900} fontFamily="Noto Sans SC">{L.off} OFF</text>
          <path d="M300 1450 h200 M460 1410 l40 40 l-40 40" stroke={Y} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x={760} y={1470} textAnchor="middle" fill={Y} fontSize={52} fontWeight={900} fontFamily="Noto Sans SC">{L.pocket}</text>
        </g>
      </>,
    );
  }
  const k = outBack(clamp(u / 0.5));
  return svg(
    <g transform={`translate(540 1200) scale(${k})`}>
      <rect x={-170} y={-300} width={340} height={600} rx={50} fill="#3a5bd9" stroke="#1e2440" strokeWidth={14} style={{filter: 'drop-shadow(0 0 60px rgba(120,170,255,0.7))'}} />
      <path d="M-60 40 L60 -40 M60 -40 L20 -50 M60 -40 L52 0" stroke={W} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${Math.sin(u * 4) * 8})`} />
      <text x={0} y={180} textAnchor="middle" fill={Y} fontSize={L.share.length > 6 ? 42 : 60} fontWeight={900} fontFamily="Noto Sans SC">{L.share}</text>
    </g>,
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
    <div style={{position: 'absolute', top: 470, left: 60, right: 60, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: zh ? 0 : 18, fontWeight: 900, fontSize: zh ? 66 : 60, lineHeight: 1.2, textShadow: '0 4px 18px rgba(0,0,0,0.8)'}}>
      {groups[g].map(([w, s], k) => (
        <span key={k} style={{whiteSpace: 'nowrap', color: t >= s ? (t < s + 0.45 ? Y : W) : 'rgba(255,255,255,0.4)'}}>{w}</span>
      ))}
    </div>
  );
};

export const Phantom: React.FC<{lang: 'en' | 'zh'}> = ({lang}) => {
  useFont();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const B = (lang === 'zh' ? ZH : EN) as Beat[];
  const L = T[lang];
  const END = total(B);
  let i = B.findIndex((b) => t < b.start + b.dur);
  if (i < 0) i = B.length - 1;
  const b = B[i];
  const u = t - b.start;
  const inK = i === 0 ? 1 : clamp(u / 0.3);
  const fade = clamp((t - (END - 0.8)) / 0.7);
  const hookOn = i === 0;
  return (
    <AbsoluteFill style={{fontFamily: '"Noto Sans SC", sans-serif', color: W, overflow: 'hidden'}}>
      <Backdrop t={t} />
      <AbsoluteFill style={{opacity: inK, transform: `scale(${1 + clamp(u / b.dur) * 0.05})`, transformOrigin: '50% 62%'}}>
        <Scene i={i} u={u} d={b.dur} L={L} />
      </AbsoluteFill>
      {hookOn ? (
        // The cover: the whole hook, big, from frame one.
        <div style={{position: 'absolute', top: 150, left: 60, right: 60, textAlign: 'center', fontWeight: 900, fontSize: lang === 'zh' ? 92 : 78, lineHeight: 1.38, textShadow: '0 6px 24px rgba(0,0,0,0.8)'}}>
          {L.hook.map((line, k) => (
            <div key={k}>
              {k === L.hl ? <span style={{display: 'inline-block', marginTop: 14, background: Y, color: '#16141a', padding: '0 18px', borderRadius: 14, lineHeight: 1.25}}>{line}</span> : line}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center'}}>
            <span style={{fontSize: 56, fontWeight: 900, color: '#16141a', background: Y, padding: '8px 30px', borderRadius: 16}}>{b.top}</span>
          </div>
          <Captions t={t} B={B} zh={lang === 'zh'} />
        </>
      )}
      {b.src ? <div style={{position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center', fontSize: 30, fontWeight: 700, color: DIM}}>{L.src}{b.src}</div> : null}
      <div style={{position: 'absolute', top: 70, left: 60, fontSize: 30, color: DIM, letterSpacing: 4}}>
        {L.brand[0]}<span style={{background: Y, color: '#16141a', padding: '0 8px', borderRadius: 6, marginLeft: 6}}>{L.brand[1]}</span>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
      <Audio src={staticFile(`phantom/${lang}-voice.wav`)} />
      {B.slice(1).map((bb, k) => (
        <Sequence key={k} from={Math.max(0, Math.round((bb.start - 0.2) * fps))} durationInFrames={Math.round(0.7 * fps)}>
          <Audio src={staticFile('sfx/whoosh.wav')} volume={0.15} />
        </Sequence>
      ))}
      {[0, 0.6, 1.2].map((s) => (
        <Sequence key={`b${s}`} from={Math.round(s * fps)} durationInFrames={Math.round(0.5 * fps)}>
          <Audio src={staticFile('sfx/buzz.wav')} volume={0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
