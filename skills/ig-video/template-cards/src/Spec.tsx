import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, useFont} from './Cards';

// Two scenes, 25 s, built to the brief:
// 1 (0-12 s): the hook text, slow zoom in; a glowing phone slides in from the right.
// 2 (12-25 s): tip 03 with its source; then the camera pulls out to the viewer
//    lying in bed in the dark, phone floating over him, clock running 20:00 -> 23:47.

export const SPEC_FRAMES = 25 * 30;
const S2 = 12;
const XF = 0.5; // crossfade between the scenes

export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const outCubic = (x: number) => 1 - (1 - clamp(x)) ** 3;
export const inOut = (x: number) => {
  const k = clamp(x);
  return k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
};
export const outBack = (x: number) => {
  const c = 1.5;
  const k = clamp(x) - 1;
  return 1 + (c + 1) * k ** 3 + c * k ** 2;
};
// A soft zoom bump each time a line appears, settling smoothly (no shake).
const bumps = (t: number, at: number[], size = 0.035) => at.reduce((s, a) => s + (t > a ? size * Math.sin(clamp((t - a) / 0.6) * Math.PI) * (1 - clamp((t - a) / 0.6) * 0.3) : 0), 0);

export const Pop: React.FC<{t: number; at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({t, at, children, style}) => {
  const p = outCubic((t - at) / 0.32);
  return <div style={{...style, opacity: p, transform: `translateY(${(1 - outBack((t - at) / 0.38)) * 60}px)`}}>{children}</div>;
};
export const Hl: React.FC<{t: number; at: number; children: React.ReactNode}> = ({t, at, children}) => {
  const w = outCubic((t - at - 0.1) / 0.28);
  return (
    <span style={{position: 'relative', display: 'inline-block', padding: '0 18px'}}>
      <span style={{position: 'absolute', inset: '8% 0 4% 0', background: '#ffd23f', borderRadius: 14, clipPath: `inset(0 ${(1 - w) * 100}% 0 0)`}} />
      <span style={{position: 'relative', color: w > 0.45 ? '#16141a' : '#fff'}}>{children}</span>
    </span>
  );
};

const Feed: React.FC<{t: number}> = ({t}) => (
  <>
    {Array.from({length: 8}).map((_, i) => {
      const y = ((i * 92 - t * 140) % 736 + 736) % 736 - 80;
      return (
        <div key={i} style={{position: 'absolute', left: 26, top: y, width: 228, height: 74, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 12}}>
          <div style={{width: 46, height: 46, borderRadius: 23, background: 'rgba(255,255,255,0.35)'}} />
          <div style={{width: 120, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.35)'}} />
        </div>
      );
    })}
  </>
);
const Phone: React.FC<{t: number; w?: number; h?: number}> = ({t, w = 300, h = 560}) => {
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  return (
    <div style={{position: 'relative', width: w, height: h, borderRadius: 44, border: '10px solid #1e2440', overflow: 'hidden', background: 'linear-gradient(160deg,#6aa8ff,#3a5bd9 60%,#2a2f8a)', boxShadow: `0 0 ${120 + pulse * 50}px ${30 + pulse * 14}px rgba(90,150,255,${0.26 + pulse * 0.12})`}}>
      <div style={{position: 'absolute', left: w / 2 - 35, top: 12, width: 70, height: 12, borderRadius: 8, background: '#1e2440', zIndex: 2}} />
      <Feed t={t} />
    </div>
  );
};

const L1 = [-0.2, 0.4, 0.9, 1.5]; // scene 1: line, line, highlight, subtitle
const PHONE_IN = 3.0;
const Scene1: React.FC<{t: number}> = ({t}) => {
  const zoom = 1 + clamp(t / 12) * 0.09 + bumps(t, L1.slice(1));
  const k = outCubic((t - PHONE_IN) / 0.8);
  const blur = Math.sin(clamp((t - PHONE_IN) / 0.8) * Math.PI) * 10;
  return (
    <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '18% 30%'}}>
      <div style={{position: 'absolute', top: 430, left: 96, right: 60, fontWeight: 900, fontSize: 132, lineHeight: 1.3, letterSpacing: 2}}>
        <Pop t={t} at={L1[0]}>你拖延，</Pop>
        <Pop t={t} at={L1[1]}>不是因为</Pop>
        <Pop t={t} at={L1[2]}>
          <Hl t={t} at={L1[2]}>懒</Hl>
        </Pop>
        <Pop t={t} at={L1[3]} style={{fontWeight: 700, fontSize: 54, lineHeight: 1.45, color: '#c9d4ff', marginTop: 40, letterSpacing: 0}}>
          心理学研究发现，真正原因是这个 →
        </Pop>
      </div>
      {t > PHONE_IN - 0.1 ? (
        <div style={{position: 'absolute', left: 390 + (1 - k) * 800, top: 1180, transform: `rotate(${(1 - k) * 12}deg)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}>
          <Phone t={t} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// The viewer lying in bed in the dark, the phone floating above his face.
const BedScene: React.FC<{t: number}> = ({t}) => {
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  const breathe = Math.sin(t * 1.8) * 4;
  const ph = {x: 300, y: 1370 + Math.sin(t * 1.3) * 8};
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="faceLight" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform={`translate(${ph.x} ${ph.y + 140}) scale(260)`}>
            <stop offset="0" stopColor="#8fb8ff" stopOpacity={0.45 + pulse * 0.15} />
            <stop offset="1" stopColor="#8fb8ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* bed frame, mattress, pillow */}
        <rect x={110} y={1500} width={36} height={260} rx={12} fill="#1c2346" />
        <rect x={930} y={1590} width={30} height={170} rx={10} fill="#1c2346" />
        <rect x={140} y={1640} width={800} height={70} rx={20} fill="#1c2346" />
        <rect x={160} y={1575} width={170} height={70} rx={32} fill="#2c3664" />
        {/* light from the phone on his face */}
        <circle cx={ph.x} cy={ph.y + 140} r={260} fill="url(#faceLight)" />
        {/* the stick figure lying down: head on the pillow, body under the blanket */}
        <g stroke="#ffffff" strokeWidth={13} strokeLinecap="round" fill="none" style={{filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.35))'}}>
          <line x1={310} y1={1600 + breathe * 0.3} x2={760} y2={1612} />
          <circle cx={262} cy={1548 + breathe * 0.3} r={42} fill="#16204a" />
          <circle cx={262} cy={1530 + breathe * 0.3} r={4} fill="#ffffff" stroke="none" />
          <circle cx={286} cy={1536 + breathe * 0.3} r={4} fill="#ffffff" stroke="none" />
        </g>
        <path d={`M 320 ${1640} C 360 ${1585 + breathe}, 520 ${1578 + breathe}, 700 ${1588 + breathe} C 820 1595, 900 1610, 935 1640 Z`} fill="#26305a" stroke="#3c4a86" strokeWidth={6} />
      </svg>
      <div style={{position: 'absolute', left: ph.x - 70, top: ph.y - 125, transform: 'rotate(8deg)'}}>
        <Phone t={t} w={140} h={250} />
      </div>
    </>
  );
};

const L2 = [-0.1, 0.4, 0.9, 1.6]; // 03, 写下, highlight, subtitle
const SRC2 = 2.4;
const PULL = 5.0; // camera starts pulling back to reveal the bed
const CLOCK_START = 5.5;
const CLOCK_END = 10.5;
const clockText = (u: number) => {
  const m = 20 * 60 + Math.round(clamp((u - CLOCK_START) / (CLOCK_END - CLOCK_START)) * (3 * 60 + 47));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
const Scene2: React.FC<{u: number}> = ({u}) => {
  const pull = inOut((u - PULL) / 4.5);
  const zoom = 1.32 - 0.32 * pull - clamp((u - PULL - 4.5) / 4) * 0.04 + bumps(u, L2.slice(1)) * (1 - pull);
  const bed = outCubic((u - PULL + 0.3) / 1.6);
  const late = clamp((u - CLOCK_START) / (CLOCK_END - CLOCK_START));
  return (
    <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '12% 18%'}}>
      <div style={{position: 'absolute', top: 360, left: 96, right: 60}}>
        <Pop t={u} at={L2[0]} style={{fontWeight: 900, fontSize: 130, color: '#ffd23f', lineHeight: 1, marginBottom: 30}}>03</Pop>
        <div style={{fontWeight: 900, fontSize: 132, lineHeight: 1.3, letterSpacing: 2}}>
          <Pop t={u} at={L2[1]}>写下</Pop>
          <Pop t={u} at={L2[2]}>
            <Hl t={u} at={L2[2]}>如果…就…</Hl>
          </Pop>
        </div>
        <Pop t={u} at={L2[3]} style={{fontWeight: 700, fontSize: 52, lineHeight: 1.5, color: '#c9d4ff', marginTop: 36}}>
          <div>「如果晚上8点，我就打开电脑」</div>
          <div>坚持的人从约35%升到91%。</div>
        </Pop>
      </div>
      {/* the room darkens a little as it gets late */}
      <AbsoluteFill style={{background: `rgba(2,4,14,${late * 0.35})`, pointerEvents: 'none'}} />
      <div style={{position: 'absolute', inset: 0, opacity: bed, transform: `translateY(${(1 - bed) * 40 + 10}px) scale(1.22)`, transformOrigin: '540px 1620px'}}>
        <BedScene t={u} />
      </div>
      {/* the small clock in the corner */}
      <div style={{position: 'absolute', right: 70, top: 1130, padding: '10px 22px', borderRadius: 16, border: '4px solid rgba(255,255,255,0.8)', fontWeight: 900, fontSize: 52, color: late > 0.6 ? '#ff5a6e' : '#ffffff', opacity: outCubic((u - CLOCK_START + 0.6) / 0.5), letterSpacing: 2}}>
        {clockText(u)}
      </div>
      <Pop t={u} at={SRC2} style={{position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center', fontWeight: 700, fontSize: 34, color: '#6f7fb8'}}>
        研究：Milne 等, 2002
      </Pop>
    </AbsoluteFill>
  );
};

export const At: React.FC<{t: number; f: string; v: number; len?: number}> = ({t, f, v, len = 1}) => {
  const {fps} = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(t * fps))} durationInFrames={Math.round(len * fps)}>
      <Audio src={staticFile('sfx/' + f)} volume={v} />
    </Sequence>
  );
};

export const Spec: React.FC = () => {
  useFont();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const x = inOut((t - (S2 - XF / 2)) / XF);
  const ticks: number[] = [];
  for (let k = S2 + CLOCK_START; k < S2 + CLOCK_END; k += 0.5) ticks.push(k);
  return (
    <AbsoluteFill style={{fontFamily: '"Noto Sans SC", sans-serif', color: '#fff', overflow: 'hidden'}}>
      <Backdrop t={t} />
      {x < 1 ? (
        <AbsoluteFill style={{opacity: 1 - x, transform: `scale(${1 + x * 0.06})`}}>
          <Scene1 t={t} />
        </AbsoluteFill>
      ) : null}
      {x > 0 ? (
        <AbsoluteFill style={{opacity: x, transform: `scale(${1.04 - x * 0.04})`}}>
          <Scene2 u={t - S2} />
        </AbsoluteFill>
      ) : null}
      {/* sound */}
      {L1.map((a, i) => (
        <At key={`d1${i}`} t={Math.max(0, a + 0.05)} f="ding.wav" v={0.32} />
      ))}
      <At t={PHONE_IN - 0.15} f="whoosh.wav" v={0.6} />
      {L2.map((a, i) => (
        <At key={`d2${i}`} t={S2 + Math.max(0, a) + 0.05} f="ding.wav" v={0.32} />
      ))}
      {ticks.map((k, i) => (
        <At key={`k${i}`} t={k} f="tick.wav" v={0.25} len={0.2} />
      ))}
      <At t={22} f="night.wav" v={0.5} len={3} />
    </AbsoluteFill>
  );
};
