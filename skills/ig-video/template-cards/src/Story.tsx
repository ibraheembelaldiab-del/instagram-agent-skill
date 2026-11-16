import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, useFont} from './Cards';
import {BedScene, clamp, inOut, outBack, outCubic} from './Spec';
import {Bedroom} from './Stage';
import BEATS from './story-beats.json';

// Voice-over story, the pattern that is getting numbers on Instagram/TikTok
// right now: 55-75 s, a calm voice, soft piano, a white stick figure on a dark
// background, a short label on top and captions that light up word by word.

type Beat = {say: string; top: string; src?: string; start: number; dur: number; words: [string, number, number][]};
const B = BEATS as Beat[];
const END = B[B.length - 1].start + B[B.length - 1].dur;
export const STORY_FRAMES = Math.ceil(END * 30);

const Y = '#ffd23f';
const W = '#ffffff';
const DIM = '#8fa0d8';

// A standing stick figure, feet at (x, y).
const Fig: React.FC<{x: number; y: number; s?: number; shirt?: string; dim?: boolean; lean?: number; look?: number; arms?: 'down' | 'up' | 'phone'}> = ({x, y, s = 1, shirt, dim, lean = 0, look = 0, arms = 'down'}) => {
  const c = dim ? '#5a6390' : W;
  const sw = 11;
  const hx = x + lean * 0.6;
  return (
    <g style={{filter: dim ? undefined : 'drop-shadow(0 0 10px rgba(255,255,255,0.35))'}}>
      {shirt ? <rect x={hx - 30 * s} y={y - 205 * s} width={60 * s} height={95 * s} rx={12 * s} fill={shirt} /> : null}
      <g stroke={c} strokeWidth={sw * s} strokeLinecap="round" fill="none">
        <line x1={hx} y1={y - 215 * s} x2={x} y2={y - 100 * s} />
        <line x1={x} y1={y - 100 * s} x2={x - 32 * s} y2={y} />
        <line x1={x} y1={y - 100 * s} x2={x + 32 * s} y2={y} />
        {arms === 'up' ? (
          <path d={`M${hx - 45 * s} ${y - 270 * s} L${hx} ${y - 200 * s} L${hx + 45 * s} ${y - 270 * s}`} />
        ) : arms === 'phone' ? (
          <path d={`M${hx - 40 * s} ${y - 120 * s} L${hx} ${y - 200 * s} L${hx + 38 * s} ${y - 150 * s} L${hx + 20 * s} ${y - 185 * s}`} />
        ) : (
          <path d={`M${hx - 42 * s} ${y - 110 * s} L${hx} ${y - 200 * s} L${hx + 42 * s} ${y - 110 * s}`} />
        )}
        <circle cx={hx} cy={y - 252 * s} r={38 * s} fill="#16204a" />
      </g>
      <circle cx={hx - 11 * s + look * 10 * s} cy={y - 255 * s} r={4.5 * s} fill={c} />
      <circle cx={hx + 11 * s + look * 10 * s} cy={y - 255 * s} r={4.5 * s} fill={c} />
      {arms === 'phone' ? <rect x={hx + 12 * s} y={y - 205 * s} width={22 * s} height={38 * s} rx={5 * s} fill="#7fb2ff" style={{filter: 'drop-shadow(0 0 10px rgba(140,180,255,0.9))'}} /> : null}
    </g>
  );
};
// A seated audience member: head and shoulders, optionally looking.
const Seat: React.FC<{x: number; y: number; on?: boolean; phone?: boolean}> = ({x, y, on, phone}) => (
  <g>
    <g stroke={on ? Y : '#5a6390'} strokeWidth={9} fill="none" strokeLinecap="round">
      <circle cx={x} cy={y - 70} r={30} fill="#121a3d" />
      <path d={`M${x - 52} ${y + 30} C ${x - 52} ${y - 25}, ${x + 52} ${y - 25}, ${x + 52} ${y + 30}`} />
    </g>
    {phone ? <rect x={x + 8} y={y - 20} width={20} height={32} rx={4} fill="#3a5bd9" /> : null}
    {on ? <circle cx={x} cy={y - 125} r={9} fill={Y} /> : null}
  </g>
);
const Thought: React.FC<{x: number; y: number; text: string; k: number; color?: string}> = ({x, y, text, k, color = W}) => (
  <g transform={`translate(${x} ${y}) scale(${outBack(k)})`} opacity={clamp(k * 3)}>
    <rect x={-text.length * 13 - 26} y={-44} width={text.length * 26 + 52} height={78} rx={39} fill="rgba(13,20,48,0.92)" stroke={color} strokeWidth={4} />
    <circle cx={-10} cy={50} r={9} fill="rgba(13,20,48,0.92)" stroke={color} strokeWidth={3} />
    <text x={0} y={10} textAnchor="middle" fill={color} fontSize={34} fontWeight={700} fontFamily="Noto Sans SC">{text}</text>
  </g>
);
const Cone: React.FC<{x: number; y: number; top?: number; w?: number; k?: number; angle?: number}> = ({x, y, top = 620, w = 180, k = 1, angle = 0}) => (
  <g transform={`rotate(${angle} ${x} ${top})`} opacity={k}>
    <defs>
      <linearGradient id={`cone${x}${y}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff6c8" stopOpacity="0.05" />
        <stop offset="1" stopColor="#fff6c8" stopOpacity="0.28" />
      </linearGradient>
    </defs>
    <polygon points={`${x - 18},${top} ${x + 18},${top} ${x + w},${y} ${x - w},${y}`} fill={`url(#cone${x}${y})`} />
    <ellipse cx={x} cy={y} rx={w} ry={w * 0.18} fill="rgba(255,246,200,0.22)" />
  </g>
);

const SEATS: [number, number][] = [[170, 1330], [370, 1290], [710, 1290], [910, 1330], [250, 1500], [830, 1500], [430, 1720], [650, 1720]];
const Room: React.FC<{u: number; mode: 'enter' | 'guess' | 'real'}> = ({u, mode}) => {
  const walk = mode === 'enter' ? inOut(u / 3) : 1;
  const wx = 60 + walk * 480;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <rect x={20} y={1180} width={120} height={300} rx={8} fill="none" stroke="#3a4370" strokeWidth={6} />
      <Cone x={wx} y={1610} k={mode === 'enter' ? clamp((u - 2.5) / 0.6) : 1} />
      {SEATS.map(([x, y], i) => (
        <Seat key={i} x={x} y={y} on={mode === 'guess' ? i % 2 === 0 && u > 1 : mode === 'real' ? (i === 1 || i === 5) && u > 0.8 : false} phone={mode === 'real' && !(i === 1 || i === 5)} />
      ))}
      <Fig x={wx} y={1610} s={1.05} shirt={Y} />
      {mode === 'guess' ? <Thought x={wx} y={1220} text="everyone saw it…" k={clamp((u - 0.4) / 0.5)} /> : null}
    </svg>
  );
};

const Scene: React.FC<{i: number; u: number; d: number}> = ({i, u, d}) => {
  if (i === 0) {
    return (
      <>
        <Bedroom t={u} look={0} bubble={0} />
        {u > 2 ? (
          <div style={{position: 'absolute', left: 470, top: 1210, padding: '14px 26px', borderRadius: 28, background: W, color: '#16141a', fontWeight: 900, fontSize: 40, transform: `scale(${outBack((u - 2) / 0.4)})`, transformOrigin: '0 100%'}}>Why did I say that…</div>
        ) : null}
      </>
    );
  }
  if (i === 1) {
    return (
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Cone x={540} y={1620} top={640} w={230} k={outCubic(u / 0.8)} />
        <Fig x={540} y={1620} s={1.2} lean={Math.sin(u * 2) * 4} />
      </svg>
    );
  }
  if (i === 2) return <Room u={u} mode="enter" />;
  if (i === 3) return <Room u={u} mode="guess" />;
  if (i === 4) {
    const k = inOut((u - 0.3) / 1);
    return (
      <>
        <Room u={u} mode="real" />
        <div style={{position: 'absolute', top: 700, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 60, alignItems: 'flex-end'}}>
          <div style={{textAlign: 'center', color: DIM, opacity: 1 - k * 0.5}}>
            <div style={{fontSize: 34, fontWeight: 700}}>guessed</div>
            <div style={{fontSize: 110, fontWeight: 900, textDecoration: k > 0.5 ? 'line-through' : undefined}}>~50%</div>
          </div>
          <div style={{textAlign: 'center', color: Y, opacity: k, transform: `scale(${0.7 + 0.3 * outBack(k)})`}}>
            <div style={{fontSize: 34, fontWeight: 700}}>actually</div>
            <div style={{fontSize: 150, fontWeight: 900}}>~25%</div>
          </div>
        </div>
      </>
    );
  }
  if (i === 5 || i === 8) {
    const xs = [150, 345, 540, 735, 930];
    const words = i === 5 ? ['my hair?', 'what I said…', 'do I look weird?', 'my outfit…', 'awkward…'] : ['me', 'me', 'me', 'me', 'me'];
    return (
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {xs.map((x, k) => (
          <g key={k}>
            <Cone x={x} y={1640} top={1000} w={85} k={clamp((u - 0.2 - k * 0.25) / 0.5)} />
            <Fig x={x} y={1640} s={0.72} arms={k % 2 ? 'phone' : 'down'} />
            <Thought x={x} y={k % 2 ? 1180 : 1080} text={words[k]} k={clamp((u - 0.6 - k * 0.35) / 0.4)} color={i === 8 ? Y : W} />
          </g>
        ))}
      </svg>
    );
  }
  if (i === 6) {
    const trip = clamp((u - 0.5) / 0.5);
    return (
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <g transform={`rotate(${trip * 28} 540 1640)`}>
          <Fig x={540} y={1640} s={1.05} shirt={Y} arms={trip > 0.5 ? 'up' : 'down'} />
        </g>
        {[[170, 'happens'], [910, 'no big deal'], [540, 'same, honestly']].map(([x, t], k) => (
          <g key={k}>
            {k < 2 ? <Fig x={x as number} y={1640} s={0.8} /> : null}
            <Thought x={x as number} y={k < 2 ? 1330 : 1180} text={t as string} k={clamp((u - 1.5 - k * 0.6) / 0.4)} color={Y} />
          </g>
        ))}
      </svg>
    );
  }
  if (i === 7) {
    const swing = inOut((u - 1.5) / 1.6);
    return (
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Cone x={540} y={1640} top={700} w={170} angle={swing * -38} />
        <Fig x={540} y={1640} s={1} />
        {[150, 300, 780, 930].map((x, k) => (
          <Fig key={k} x={x} y={1640 - (k % 2) * 30} s={0.7} dim={swing < 0.5} />
        ))}
        <text x={850} y={1150} fontSize={150} fontWeight={900} fill={Y} opacity={clamp((u - 3) / 0.5)} fontFamily="Noto Sans SC">?</text>
      </svg>
    );
  }
  // 9: he lets it go, puts the phone down and sleeps
  return (
    <div style={{position: 'absolute', inset: 0, transform: 'translateY(40px)'}}>
      <BedScene t={u} asleep={inOut((u - 0.8) / 1.4)} />
    </div>
  );
};

// Captions: the line being spoken, in chunks of four words, current word in yellow.
const Captions: React.FC<{t: number}> = ({t}) => {
  let bi = B.findIndex((b) => t < b.start + b.dur);
  if (bi < 0) bi = B.length - 1;
  const ws = B[bi].words;
  if (!ws.length) return null;
  const groups: [string, number, number][][] = [];
  for (let k = 0; k < ws.length; k += 3) groups.push(ws.slice(k, k + 3));
  let g = groups.findIndex((gr, k) => t < (groups[k + 1]?.[0][1] ?? Infinity));
  if (g < 0) g = groups.length - 1;
  const gr = groups[g];
  const pop = outBack(clamp((t - gr[0][1]) / 0.18));
  return (
    <div style={{position: 'absolute', top: 340, left: 70, right: 70, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 20, fontWeight: 900, fontSize: 70, lineHeight: 1.2, transform: `scale(${0.9 + 0.1 * pop})`, textShadow: '0 4px 18px rgba(0,0,0,0.7)'}}>
      {gr.map(([w, s], k) => (
        <span key={k} style={{color: t >= s ? (t < s + 0.45 || k === gr.length - 1 ? Y : W) : 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap'}}>
          {w}
        </span>
      ))}
    </div>
  );
};

export const Story: React.FC = () => {
  useFont();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  let i = B.findIndex((b) => t < b.start + b.dur);
  if (i < 0) i = B.length - 1;
  const b = B[i];
  const u = t - b.start;
  const inK = i === 0 ? 1 : clamp(u / 0.35);
  const fade = clamp((t - (END - 1)) / 0.9);
  return (
    <AbsoluteFill style={{fontFamily: '"Noto Sans SC", sans-serif', color: W, overflow: 'hidden'}}>
      <Backdrop t={t} />
      <AbsoluteFill style={{opacity: inK, transform: `scale(${1 + clamp(u / b.dur) * 0.04})`, transformOrigin: '50% 75%'}}>
        <Scene i={i} u={i === 0 ? u + 1.2 : u} d={b.dur} />
      </AbsoluteFill>
      {/* top label */}
      <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', opacity: i === 0 ? 1 : clamp(u / 0.3)}}>
        <span style={{fontSize: 46, fontWeight: 900, color: '#16141a', background: Y, padding: '6px 26px', borderRadius: 14}}>{b.top}</span>
      </div>
      <Captions t={t} />
      {b.src ? <div style={{position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center', fontSize: 30, fontWeight: 700, color: DIM, opacity: clamp(u / 0.5)}}>Research: {b.src}</div> : null}
      <div style={{position: 'absolute', top: 70, left: 60, fontSize: 30, color: '#8090c8', letterSpacing: 4}}>
        Brain <span style={{background: Y, color: '#16141a', padding: '0 8px', borderRadius: 6}}>Manual</span>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
      <Audio src={staticFile('voice.wav')} />
      <Audio src={staticFile('piano.wav')} volume={0.13} />
      {B.slice(1).map((bb, k) => (
        <Sequence key={k} from={Math.max(0, Math.round((bb.start - 0.25) * fps))} durationInFrames={Math.round(0.8 * fps)}>
          <Audio src={staticFile('sfx/whoosh.wav')} volume={0.12} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
