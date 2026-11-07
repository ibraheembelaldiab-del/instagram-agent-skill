// The lower half of each card. The viewer appears only on the first and last
// card: a white stick figure sitting up in bed in the middle of the night,
// lit by the phone. The cards between show only the phone.

const W = '#ffffff';
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const outBack = (x: number) => {
  const c = 1.7;
  const k = clamp(x) - 1;
  return 1 + (c + 1) * k ** 3 + c * k ** 2;
};
const outCubic = (x: number) => 1 - (1 - clamp(x)) ** 3;

// The big phone, glowing, with something on its screen.
const Phone: React.FC<{x: number; y: number; rot?: number; glow?: number; gray?: boolean; t: number; children?: React.ReactNode}> = ({x, y, rot = 0, glow = 1, gray, t, children}) => (
  <div
    style={{
      position: 'absolute', left: x, top: y, width: 280, height: 520, borderRadius: 42, border: '10px solid #1e2440',
      background: gray ? 'linear-gradient(160deg,#3a3f55,#23263a)' : 'linear-gradient(160deg,#6aa8ff,#3a5bd9 60%,#2a2f8a)',
      boxShadow: gray ? 'none' : `0 0 ${130 + Math.sin(t * 3) * 25}px 34px rgba(90,150,255,${0.3 * glow})`,
      transform: `rotate(${rot}deg)`, overflow: 'hidden',
    }}
  >
    <div style={{position: 'absolute', left: 95, top: 12, width: 70, height: 12, borderRadius: 8, background: '#1e2440'}} />
    {children}
  </div>
);
const Feed: React.FC<{t: number; speed?: number}> = ({t, speed = 160}) => (
  <>
    {Array.from({length: 8}).map((_, i) => {
      const y = ((i * 90 - t * speed) % 720 + 720) % 720 - 80;
      return <div key={i} style={{position: 'absolute', left: 26, top: y, width: 208, height: 72, borderRadius: 12, background: 'rgba(255,255,255,0.22)'}} />;
    })}
  </>
);

// The viewer in bed at night. `look` 0 = head down at the phone, 1 = looking up at you.
const Bedroom: React.FC<{t: number; look: number; bubble: number; en?: boolean}> = ({t, look, bubble}) => {
  const breathe = Math.sin(t * 2.2) * 3;
  const thumb = look < 0.5 ? Math.sin(t * 9) * 6 : 0;
  // joints
  const hip: [number, number] = [380, 1640];
  const neck: [number, number] = [345 + 10 * (1 - look), 1460 + breathe];
  const head: [number, number] = [375 + 18 * (1 - look) - 10 * look, 1402 + breathe + 12 * (1 - look) - 6 * look];
  const elbowL: [number, number] = [430, 1555];
  const elbowR: [number, number] = [455, 1540];
  const phoneAt: [number, number] = [505 - look * 25, 1455 + look * 50];
  const handL: [number, number] = [phoneAt[0] - 6, phoneAt[1] + 40];
  const handR: [number, number] = [phoneAt[0] + 18, phoneAt[1] + 30 + thumb];
  const L = (a: [number, number], b: [number, number]) => `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`;
  const glow = 0.85 + Math.sin(t * 7) * 0.08 + Math.sin(t * 2.3) * 0.05;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <g transform="translate(540 1480) scale(1.28) translate(-560 -1450)">
      <defs>
        <radialGradient id="beam" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform={`translate(${phoneAt[0]} ${phoneAt[1]}) scale(260)`}>
          <stop offset="0" stopColor="#8fb8ff" stopOpacity={0.55 * glow} />
          <stop offset="1" stopColor="#8fb8ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* window with the moon */}
      <g transform="translate(0 90)">
      <rect x={720} y={1110} width={240} height={250} rx={14} fill="#0a1230" stroke="#2a3358" strokeWidth={10} />
      <line x1={840} y1={1110} x2={840} y2={1360} stroke="#2a3358" strokeWidth={8} />
      <line x1={720} y1={1235} x2={960} y2={1235} stroke="#2a3358" strokeWidth={8} />
      <circle cx={900} cy={1170} r={34} fill="#f4f1d8" />
      <circle cx={914} cy={1160} r={30} fill="#0a1230" />
      {[[760, 1150], [790, 1290], [930, 1300]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3 + (i % 2)} fill="#c9d4ff" opacity={0.5 + 0.5 * Math.sin(t * 3 + i)} />
      ))}
      </g>
      {/* the bed: headboard, pillow, mattress */}
      <rect x={150} y={1400} width={40} height={330} rx={12} fill="#1c2346" />
      <rect x={190} y={1520} width={150} height={80} rx={36} fill="#2c3664" />
      <rect x={170} y={1650} width={790} height={70} rx={20} fill="#1c2346" />
      {/* the phone's light falling on him */}
      <circle cx={phoneAt[0]} cy={phoneAt[1]} r={260} fill="url(#beam)" />
      {/* the stick figure */}
      <g stroke={W} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" style={{filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.35))'}}>
        <path d={L(neck, hip)} />
        <circle cx={head[0]} cy={head[1]} r={44} fill="#16204a" />
        {/* eyes: two dots, lit by the screen; they look down, then at you */}
        <circle cx={head[0] + 14 - look * 14} cy={head[1] + 8 - look * 8} r={4} fill={W} stroke="none" />
        <circle cx={head[0] + 30 - look * 18} cy={head[1] + 8 - look * 8} r={4} fill={W} stroke="none" />
      </g>
      {/* the blanket over his knees */}
      <path d="M 330 1660 C 420 1600, 470 1470, 600 1470 C 720 1470, 760 1600, 960 1650 L 960 1690 L 330 1690 Z" fill="#26305a" stroke="#3c4a86" strokeWidth={6} />
      <g stroke={W} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" style={{filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.35))'}}>
        <path d={L(neck, elbowL) + ' ' + L(elbowL, handL)} />
        <path d={L(neck, elbowR) + ' ' + L(elbowR, handR)} />
      </g>
      {/* the little phone in his hands */}
      <g transform={`translate(${phoneAt[0]} ${phoneAt[1]}) rotate(${-18 + look * 10})`}>
        <rect x={-24} y={-44} width={48} height={88} rx={10} fill="#7fb2ff" stroke="#1e2440" strokeWidth={5} style={{filter: `drop-shadow(0 0 ${20 * glow}px rgba(140,180,255,0.9))`}} />
      </g>
      {/* the comment bubble on the last card */}
      {bubble > 0 ? (
        <g transform={`translate(560 1300) scale(${outBack(bubble)})`}>
          <rect x={0} y={-60} width={230} height={100} rx={30} fill="#ffd23f" />
          <path d="M 30 38 L 10 70 L 70 38 Z" fill="#ffd23f" />
          <text x={115} y={8} textAnchor="middle" fontSize={56} fontWeight={900} fill="#16141a" fontFamily="Noto Sans SC">???</text>
        </g>
      ) : null}
      </g>
    </svg>
  );
};

export const Stage: React.FC<{scene: number; t: number; en?: boolean}> = ({scene, t, en}) => {
  if (scene === 0) return <Bedroom t={t} look={0} bubble={0} />;
  if (scene === 4) {
    const look = outCubic((t - 0.4) / 0.6);
    return <Bedroom t={t} look={look} bubble={clamp((t - 0.9) / 0.35)} />;
  }
  if (scene === 1) {
    // The phone pulls you in; a task reminder slides down and gets swiped away.
    const n = clamp((t - 0.5) / 0.3);
    const gone = clamp((t - 1.8) / 0.3);
    return (
      <Phone x={400} y={1200} t={t} glow={1.2}>
        <Feed t={t} />
        <div style={{position: 'absolute', left: 16, right: 16, top: -90 + n * 130, height: 76, borderRadius: 16, background: '#ffffff', color: '#16141a', fontWeight: 900, fontSize: 30, display: 'flex', alignItems: 'center', paddingLeft: 18, transform: `translateX(${gone * 320}px)`, opacity: 1 - gone}}>
          ⏰ {en ? 'Task: due today' : '任务：今天截止'}
        </div>
      </Phone>
    );
  }
  if (scene === 2) {
    // The screen goes quiet and shows a heart.
    const h = clamp((t - 0.6) / 0.4);
    return (
      <Phone x={400} y={1200} t={t} glow={0.6}>
        <div style={{position: 'absolute', inset: 0, background: `rgba(10,16,40,${0.65 * h})`}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 190, textAlign: 'center', fontSize: 130, transform: `scale(${outBack(h) * (1 + Math.sin(t * 5) * 0.05)})`, color: '#ff5a6e', filter: 'drop-shadow(0 0 20px rgba(255,90,110,0.8))'}}>
          ♥
        </div>
      </Phone>
    );
  }
  // scene 3: 20:00 comes up and the phone slides away, going dark.
  const away = clamp((t - 1.2) / 0.6);
  const c = clamp((t - 0.3) / 0.35);
  return (
    <>
      <div style={{position: 'absolute', left: 150, top: 1230, width: 200, height: 200, borderRadius: 100, border: '10px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 54, color: '#ffd23f', transform: `scale(${outBack(c)})`, boxShadow: '0 0 30px rgba(255,255,255,0.25)'}}>
        20:00
      </div>
      <Phone x={480 + away * 300} y={1200 + away * 60} t={t} gray={away > 0.5} glow={1 - away} rot={away * 20}>
        {away < 0.5 ? <Feed t={t} /> : null}
      </Phone>
    </>
  );
};
