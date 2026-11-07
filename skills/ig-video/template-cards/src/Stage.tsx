// The lower half of each card: the glowing phone and a white stick person
// (the viewer) acting out the point. One scene per card, gently animated.

type Pt = [number, number];
const W = '#ffffff';

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const outBack = (x: number) => {
  const c = 1.7;
  const k = clamp(x) - 1;
  return 1 + (c + 1) * k ** 3 + c * k ** 2;
};

// A stick figure from its joints: head centre, neck, hip, elbows, hands, knees, feet.
type Pose = {head: Pt; neck: Pt; hip: Pt; le: Pt; lh: Pt; re: Pt; rh: Pt; lk: Pt; lf: Pt; rk: Pt; rf: Pt};
const Stick: React.FC<{p: Pose}> = ({p}) => {
  const line = (a: Pt, b: Pt, k: string) => <line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
  return (
    <g stroke={W} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" style={{filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.35))'}}>
      <circle cx={p.head[0]} cy={p.head[1]} r={42} fill="#0d1430" />
      {line(p.neck, p.hip, 'b')}
      {line(p.neck, p.le, 'a1')}
      {line(p.le, p.lh, 'a2')}
      {line(p.neck, p.re, 'a3')}
      {line(p.re, p.rh, 'a4')}
      {line(p.hip, p.lk, 'l1')}
      {line(p.lk, p.lf, 'l2')}
      {line(p.hip, p.rk, 'l3')}
      {line(p.rk, p.rf, 'l4')}
    </g>
  );
};
const add = (a: Pt, dx: number, dy: number): Pt => [a[0] + dx, a[1] + dy];
const standing = (x: number, lean = 0): Pose => ({
  head: [x + lean * 1.4, 1330], neck: [x + lean, 1385], hip: [x, 1560],
  le: [x - 55, 1460], lh: [x - 70, 1545], re: [x + 55, 1460], rh: [x + 70, 1545],
  lk: [x - 30, 1650], lf: [x - 45, 1745], rk: [x + 30, 1650], rf: [x + 45, 1745],
});

// The phone: a glowing slab with a notch; optional screen content.
const Phone: React.FC<{x: number; y: number; rot?: number; glow?: number; gray?: boolean; t: number; children?: React.ReactNode}> = ({x, y, rot = 0, glow = 1, gray, t, children}) => (
  <div
    style={{
      position: 'absolute', left: x, top: y, width: 260, height: 480, borderRadius: 40, border: '10px solid #1e2440',
      background: gray ? 'linear-gradient(160deg,#4a4f66,#2a2d3c)' : 'linear-gradient(160deg,#6aa8ff,#3a5bd9 60%,#2a2f8a)',
      boxShadow: gray ? 'none' : `0 0 ${120 + Math.sin(t * 3) * 25}px 30px rgba(90,150,255,${0.28 * glow})`,
      transform: `rotate(${rot}deg)`, overflow: 'hidden',
    }}
  >
    <div style={{position: 'absolute', left: 85, top: 12, width: 70, height: 12, borderRadius: 8, background: '#1e2440'}} />
    {children}
  </div>
);

// Scrolling feed lines on the screen.
const Feed: React.FC<{t: number}> = ({t}) => (
  <>
    {Array.from({length: 7}).map((_, i) => {
      const y = ((i * 90 - t * 160) % 630 + 630) % 630 - 60;
      return (
        <div key={i} style={{position: 'absolute', left: 24, top: y, width: 192, height: 70, borderRadius: 12, background: 'rgba(255,255,255,0.22)'}} />
      );
    })}
  </>
);

export const Stage: React.FC<{scene: number; t: number; en?: boolean}> = ({scene, t, en}) => {
  const breathe = Math.sin(t * 2.4) * 4;
  if (scene === 0) {
    // Slumped in front of the phone, thumb scrolling.
    const p = standing(330, 26);
    p.head = [372, 1345 + breathe];
    p.neck = [355, 1400];
    p.re = [440, 1440];
    p.rh = [560, 1420 + Math.sin(t * 8) * 18];
    p.le = [300, 1480];
    p.lh = [300, 1560];
    return (
      <>
        <Phone x={600} y={1190} t={t}>
          <Feed t={t} />
        </Phone>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <Stick p={p} />
        </svg>
      </>
    );
  }
  if (scene === 1) {
    // A grey task box under a rain cloud; he turns his back on it, toward the phone.
    const lean = 18 + Math.sin(t * 1.5) * 4;
    const p = standing(520, lean);
    p.head = [545, 1335 + breathe];
    p.re = [600, 1430];
    p.rh = [680, 1400];
    p.le = [460, 1450];
    p.lh = [420, 1400 + Math.sin(t * 5) * 10];
    return (
      <>
        <div style={{position: 'absolute', left: 90, top: 1440, width: 230, height: 230, borderRadius: 18, background: '#3a3f55', border: '6px solid #565c78', color: '#a8afc8', fontWeight: 900, fontSize: 56, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {en ? 'TASK' : '任务'}
        </div>
        <div style={{position: 'absolute', left: 70, top: 1250, width: 270, height: 110, borderRadius: 60, background: '#5a6078'}} />
        {Array.from({length: 6}).map((_, i) => (
          <div key={i} style={{position: 'absolute', left: 100 + i * 40, top: 1370 + ((t * 300 + i * 37) % 60), width: 5, height: 26, borderRadius: 3, background: '#8fa0d8'}} />
        ))}
        <Phone x={720} y={1230} t={t} glow={1.2}>
          <Feed t={t} />
        </Phone>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <Stick p={p} />
        </svg>
      </>
    );
  }
  if (scene === 2) {
    // Arms crossed in a hug; a heart rises; the phone dims.
    const p = standing(420, 0);
    p.head = [420, 1330 + breathe];
    p.le = [470, 1450];
    p.lh = [380, 1430];
    p.re = [370, 1460];
    p.rh = [465, 1440];
    const h = clamp((t - 0.5) / 0.4);
    const rise = ((t - 0.5) * 30) % 200;
    return (
      <>
        <Phone x={700} y={1260} t={t} glow={0.3} gray rot={6} />
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <Stick p={p} />
          <g transform={`translate(420 ${1220 - rise * 0.4}) scale(${outBack(h) * (1 + Math.sin(t * 6) * 0.06)})`} opacity={h}>
            <path d="M0 30 C -60 -10 -40 -60 0 -30 C 40 -60 60 -10 0 30 Z" fill="#ff5a6e" style={{filter: 'drop-shadow(0 0 18px rgba(255,90,110,0.7))'}} />
          </g>
        </svg>
      </>
    );
  }
  if (scene === 3) {
    // Points at the clock: 20:00. The phone gets pushed away.
    const push = clamp((t - 1.2) / 0.6);
    const p = standing(330, 0);
    p.head = [330, 1330 + breathe];
    p.le = [270, 1400];
    p.lh = [215, 1330];
    p.re = [400, 1450];
    p.rh = [470 - push * 10, 1470];
    return (
      <>
        <div style={{position: 'absolute', left: 60, top: 1200, width: 170, height: 170, borderRadius: 85, border: '10px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 46, color: '#ffd23f', boxShadow: '0 0 30px rgba(255,255,255,0.25)'}}>
          20:00
        </div>
        <Phone x={560 + push * 260} y={1250 + push * 40} t={t} gray={push > 0.5} glow={1 - push} rot={push * 22}>
          {push < 0.5 ? <Feed t={t} /> : null}
        </Phone>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <Stick p={p} />
        </svg>
      </>
    );
  }
  // Waves at you; a comment bubble pops out of the phone.
  const p = standing(320, 0);
  p.head = [320, 1330 + breathe];
  p.re = [380, 1380];
  p.rh = [430 + Math.sin(t * 8) * 25, 1280];
  const b = clamp((t - 0.6) / 0.35);
  return (
    <>
      <Phone x={600} y={1240} t={t}>
        <div style={{position: 'absolute', left: 20, right: 20, bottom: 30, height: 60, borderRadius: 30, background: 'rgba(255,255,255,0.9)', color: '#16141a', fontWeight: 900, fontSize: 30, display: 'flex', alignItems: 'center', paddingLeft: 20}}>
          {'|'.padStart(1 + (Math.floor(t * 4) % 4), '·')}
        </div>
      </Phone>
      <div style={{position: 'absolute', left: 640, top: 1060, width: 300, height: 130, borderRadius: 30, background: '#ffd23f', color: '#16141a', fontWeight: 900, fontSize: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${outBack(b)})`, transformOrigin: '30% 100%'}}>
        ??? 💬
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Stick p={p} />
      </svg>
    </>
  );
};
