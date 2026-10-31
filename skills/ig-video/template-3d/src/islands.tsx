import {Ball, Box, Cyl, Island, PixelText, Plane, Slice, clamp, pop, rand} from './voxels';

// One floating island per beat of the script. Each gets `t`, the seconds since
// its beat started (negative while the camera is still flying in).

// sign and labels come from reel.json, so another language swaps the text.
type P = {t: number; dur: number; sign?: string; labels?: string[]};

const Pot: React.FC<{t: number; r?: number}> = ({t, r = 3.6}) => (
  <group>
    <Cyl p={[0, 0.9, 0]} r1={r} r2={r * 0.85} h={1.8} c="#2f2f36" seg={12} />
    <Cyl p={[0, 1.85, 0]} r1={r * 0.92} h={0.1} c="#f0a23a" seg={12} />
    {Array.from({length: 10}).map((_, i) => {
      const cyc = (t * 1.4 + rand(i) * 3) % 1;
      const a = rand(i + 9) * Math.PI * 2;
      const d = rand(i + 20) * r * 0.75;
      return <Ball key={i} p={[Math.cos(a) * d, 1.9 + cyc * 0.4, Math.sin(a) * d]} r={0.12 + cyc * 0.18} c="#fff1c2" />;
    })}
    {Array.from({length: 6}).map((_, i) => {
      const rise = (t * 0.9 + i / 6) % 1;
      return (
        <Box
          key={`s${i}`}
          p={[Math.sin(i * 2.1) * 1.8, 2.5 + rise * 5, Math.cos(i * 2.1) * 1.5]}
          s={[0.6 + rise, 0.6 + rise, 0.6 + rise]}
          c="#ffffff"
          opacity={0.55 * (1 - rise)}
        />
      );
    })}
  </group>
);

const City: React.FC<{t: number; sign?: string}> = ({t, sign}) => (
  <group>
    <Island w={20} top="#7cc7e8" />
    <Box p={[0, 0.05, 0]} s={[16, 0.2, 16]} c="#9be07a" />
    {Array.from({length: 22}).map((_, i) => {
      const x = Math.floor(rand(i) * 6) * 2.3 - 6;
      const z = Math.floor(rand(i + 40) * 6) * 2.3 - 6;
      const h = 1.5 + rand(i + 80) * 5;
      const cols = ['#ffd7e6', '#fff1c9', '#cfe8ff', '#ffe0c7', '#e8dcff'];
      return (
        <group key={i} position={[x, 0, z]}>
          <Box p={[0, h / 2, 0]} s={[1.8, h, 1.8]} c={cols[i % cols.length]} />
          <Box p={[0, h + 0.15, 0]} s={[2, 0.3, 2]} c="#e46d5f" />
        </group>
      );
    })}
    <Box p={[2, 5, 1]} s={[1.6, 10, 1.6]} c="#f6f0ff" />
    <Box p={[2, 10.4, 1]} s={[0.4, 1.2, 0.4]} c="#ff6b6b" glow={0.6} />
    <Plane p={[Math.cos(t * 0.9) * 10, 13 + Math.sin(t * 2) * 0.5, Math.sin(t * 0.9) * 10]} ry={-t * 0.9} rz={0.25} />
    {sign ? <PixelText text={sign} t={t} p={[0, 15, 2]} size={0.34} /> : null}
  </group>
);

const Hook: React.FC<P> = ({t, sign = 'SHANTOU'}) => <City t={t} sign={sign} />;

const Sport: React.FC<P> = ({t, sign = 'SPORT!'}) => (
  <group>
    <Island />
    <Box p={[0, 0.2, 0]} s={[9, 0.4, 9]} c="#a0522d" />
    <group position={[0, 0.4, 0]}>
      <Pot t={t} />
    </group>
    <PixelText text={sign} t={t} p={[0, 7, 0]} size={0.3} delay={0.2} />
  </group>
);

const Cut: React.FC<P> = ({t, sign = 'FRESH'}) => {
  const chop = Math.abs(Math.sin(t * 7));
  const slices = Math.min(6, Math.floor(clamp(t, 0, 3) * 2.4));
  return (
    <group>
      <Island />
      <Box p={[0, 0.3, 0]} s={[9, 0.6, 6]} c="#d9b38c" />
      <group position={[-1.5, 1.8, 0]}>
        <Box s={[4, 2.4, 2.6]} c="#c8443a" />
        {[0.5, -0.1, -0.7].map((y, i) => (
          <Box key={i} p={[0, y, 1.31]} s={[3.6, 0.15, 0.05]} c="#ffe1d4" />
        ))}
      </group>
      <group position={[0.9, 3.2 + chop * 1.6, 0]}>
        <Box s={[0.15, 2.4, 2]} c="#d8dde6" />
        <Box p={[0, 1.8, 0]} s={[0.4, 1.4, 0.5]} c="#5b3a26" />
      </group>
      {Array.from({length: slices}).map((_, i) => (
        <Slice key={i} p={[2.8, 0.7 + i * 0.16, 0]} r={[0, i * 0.3, 0]} />
      ))}
      <PixelText text={sign} t={t} p={[0, 7.5, 0]} size={0.3} />
    </group>
  );
};

const PLATES: [number, number][] = [
  [-4.6, 1],
  [0, -1.5],
  [4.6, 1],
];

const Plates: React.FC<P> = ({t, labels = ['DIAOLONG', 'WUHUAZHI', 'XIONGKOULAO']}) => (
  <group>
    <Island w={16} />
    <Box p={[0, 0.2, 0]} s={[13, 0.4, 7]} c="#a0522d" />
    {PLATES.map(([x, z], i) => {
      const name = labels[i] ?? '';
      const k = pop(t, i * 0.25);
      return (
        <group key={name} position={[x, 0.5, z]} scale={k}>
          <Cyl r1={1.6} r2={1.3} h={0.25} c="#ffffff" seg={14} />
          <Slice p={[-0.2, 0.25, 0]} r={[0, 0.4, 0]} />
          <Slice p={[0.3, 0.4, 0.2]} r={[0, -0.3, 0]} />
          <PixelText text={name} t={t} p={[0, 2.2 + i * 1.5, 0]} size={0.11} delay={i * 0.25} edge="#7a1c14" />
        </group>
      );
    })}
  </group>
);

const Cow: React.FC<P> = ({t, sign = 'CUTS'}) => {
  const glow = 0.5 + 0.5 * Math.sin(t * 9);
  return (
    <group>
      <Island />
      <group position={[0, 0, 0]} rotation={[0, Math.sin(t) * 0.15, 0]}>
        {[[-1.6, -0.9], [-1.6, 0.9], [1.6, -0.9], [1.6, 0.9]].map(([x, z], i) => (
          <Box key={i} p={[x, 0.9, z]} s={[0.7, 1.8, 0.7]} c="#fff8ee" />
        ))}
        <Box p={[0, 2.7, 0]} s={[4.6, 2, 2.6]} c="#fff8ee" />
        <Box p={[-0.8, 3.2, 1.31]} s={[1.2, 0.9, 0.05]} c="#2f2f36" />
        <Box p={[1.2, 2.4, -1.31]} s={[1, 1, 0.05]} c="#2f2f36" />
        <Box p={[3, 3.3, 0]} s={[1.6, 1.6, 1.8]} c="#fff8ee" />
        <Box p={[3.85, 2.9, 0]} s={[0.2, 0.7, 1.2]} c="#ffb3c1" />
        <Box p={[3.85, 3.6, 0.5]} s={[0.1, 0.25, 0.25]} c="#2f2f36" />
        <Box p={[3.85, 3.6, -0.5]} s={[0.1, 0.25, 0.25]} c="#2f2f36" />
        <Box p={[3, 4.3, 0.8]} s={[0.25, 0.6, 0.25]} c="#f3e2b5" />
        <Box p={[3, 4.3, -0.8]} s={[0.25, 0.6, 0.25]} c="#f3e2b5" />
        {[[-1.4, 3.75], [0.4, 3.75], [1.6, 2.3]].map(([x, y], i) => (
          <Box key={`g${i}`} p={[x, y, 1.35]} s={[0.9, 0.9, 0.12]} c="#ff3b30" glow={glow} />
        ))}
      </group>
      <PixelText text={sign} t={t} p={[0, 7, 0]} size={0.3} />
    </group>
  );
};

const Timer: React.FC<P> = ({t}) => (
  <group>
    <Island />
    <group position={[0, 4, 0]} scale={pop(t)}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <Cyl r1={3} h={0.6} c="#fff6e5" seg={20} />
        <Cyl p={[0, 0.31, 0]} r1={2.6} h={0.05} c="#2b1410" seg={20} />
        <group position={[0, 0.4, 0]} rotation={[0, -t * 6, 0]}>
          <Box p={[0, 0, -1.1]} s={[0.25, 0.1, 2.2]} c="#fff6e5" />
        </group>
      </group>
      <Box p={[0, 3.4, 0]} s={[0.8, 0.8, 0.6]} c="#fff6e5" />
    </group>
  </group>
);

const Dip: React.FC<P> = ({t, dur}) => {
  const u = clamp(t / Math.max(0.1, dur));
  const down = u < 0.15 ? u / 0.15 : u > 0.85 ? (1 - u) / 0.15 : 1;
  const n = Math.max(1, Math.ceil(10 * (1 - clamp((u - 0.15) / 0.7))));
  return (
    <group>
      <Island />
      <Pot t={t} r={3.2} />
      <group position={[0.5, 6 - down * 3.4, 0]} rotation={[0, 0, 0.25]}>
        <Box p={[-0.2, 1.5, 0]} s={[0.12, 3.4, 0.12]} c="#d8b06a" />
        <Box p={[0.2, 1.5, 0]} s={[0.12, 3.4, 0.12]} c="#d8b06a" />
        <Slice p={[0, -0.3, 0]} r={[0, 0, Math.PI / 2]} />
      </group>
      <PixelText key={n} text={String(n)} t={t * 6} p={[-2.5, 7.5, 0]} size={0.4} />
    </group>
  );
};

const Head: React.FC<{p: [number, number, number]; ry: number; t: number; i: number}> = ({p, ry, t, i}) => {
  const look = Math.sin(t * 3 + i) * 0.15;
  return (
    <group position={p} rotation={[0, ry + look, 0]} scale={pop(t, i * 0.15)}>
      <Box p={[0, 0.9, 0]} s={[1.2, 1.8, 0.9]} c="#6c8cd5" />
      <Box p={[0, 2.4, 0]} s={[1.5, 1.5, 1.5]} c="#f2c27b" />
      <Box p={[0, 3.25, 0]} s={[1.55, 0.3, 1.55]} c="#3b2a20" />
      <Box p={[-0.35, 2.5, 0.76]} s={[0.35, 0.12, 0.05]} c="#2b1410" />
      <Box p={[0.35, 2.5, 0.76]} s={[0.35, 0.12, 0.05]} c="#2b1410" />
      <Box p={[-0.35, 2.75, 0.76]} s={[0.45, 0.1, 0.05]} c="#2b1410" r={[0, 0, -0.35]} />
      <Box p={[0.35, 2.75, 0.76]} s={[0.45, 0.1, 0.05]} c="#2b1410" r={[0, 0, 0.35]} />
      <Box p={[0, 2.0, 0.76]} s={[0.5, 0.1, 0.05]} c="#2b1410" />
    </group>
  );
};

const Judge: React.FC<P> = ({t, sign = '?!'}) => (
  <group>
    <Island />
    <Cyl p={[0, 1.2, 0]} r1={2.6} h={0.3} c="#a0522d" seg={12} />
    <Box p={[0, 0.6, 0]} s={[0.6, 1.2, 0.6]} c="#7d5534" />
    <group position={[0, 1.4, 0]} scale={0.6}>
      <Pot t={t} r={2.4} />
    </group>
    {[0, 1, 2, 3].map((i) => {
      // Seated behind the table, all glaring at the camera side.
      const a = Math.PI + 0.35 + i * 0.8;
      const x = Math.cos(a) * 4.3;
      const z = Math.sin(a) * 4.3;
      return <Head key={i} i={i} t={t} p={[x, 0, z]} ry={Math.atan2(-x, -z) * 0.4} />;
    })}
    <PixelText text={sign} t={t} p={[0, 7, 0]} size={0.4} />
  </group>
);

const Balls: React.FC<P> = ({t, sign = 'BOING!'}) => (
  <group>
    <Island />
    <Box p={[0, 0.2, 0]} s={[9, 0.4, 5]} c="#d9b38c" />
    {[-2.6, 0, 2.6].map((x, i) => {
      const cyc = (t * 1.6 + i * 0.33) % 1;
      const h = 4 * cyc * (1 - cyc);
      const squash = h < 0.12 ? 1 + (0.12 - h) * 3 : 1;
      return <Ball key={i} p={[x, 1.2 + h * 4, 0]} r={1} c="#a9573f" s={[squash, 1 / squash, squash]} />;
    })}
    <PixelText text={sign} t={t} p={[0, 7.5, 0]} size={0.3} />
  </group>
);

const Sauce: React.FC<P> = ({t, dur, sign = 'SHACHA'}) => {
  const u = clamp(t / Math.max(0.1, dur));
  const down = Math.sin(u * Math.PI);
  return (
    <group>
      <Island />
      <Cyl p={[0, 0.9, 0]} r1={2.6} r2={1.8} h={1.8} c="#fff6e5" seg={14} />
      <Cyl p={[0, 1.82, 0]} r1={2.4} h={0.06} c="#7a3b17" seg={14} />
      <group position={[0.3, 6 - down * 3.6, 0]} rotation={[0, 0, 0.2]}>
        <Box p={[-0.2, 1.5, 0]} s={[0.12, 3.4, 0.12]} c="#d8b06a" />
        <Box p={[0.2, 1.5, 0]} s={[0.12, 3.4, 0.12]} c="#d8b06a" />
        <Slice p={[0, -0.3, 0]} r={[0, 0, Math.PI / 2]} />
      </group>
      <PixelText text={sign} t={t} p={[0, 7.5, 0]} size={0.3} />
    </group>
  );
};

const Bite: React.FC<P> = ({t}) => {
  const chew = 0.2 + Math.abs(Math.sin(t * 9)) * 0.5;
  return (
    <group>
      <Island />
      <group position={[0, 0, 0]} scale={pop(t)}>
        <Box p={[0, 1.4, 0]} s={[2.2, 2.8, 1.4]} c="#6c8cd5" />
        <Box p={[0, 4.2, 0]} s={[3, 3, 3]} c="#f2c27b" />
        <Box p={[0, 5.85, 0]} s={[3.1, 0.4, 3.1]} c="#3b2a20" />
        <Box p={[-0.7, 4.7, 1.51]} s={[0.6, 0.15, 0.05]} c="#2b1410" r={[0, 0, 0.3]} />
        <Box p={[0.7, 4.7, 1.51]} s={[0.6, 0.15, 0.05]} c="#2b1410" r={[0, 0, -0.3]} />
        <Box p={[0, 3.5, 1.51]} s={[1, chew, 0.05]} c="#7a1c14" />
        <Box p={[-1.1, 3.9, 1.51]} s={[0.5, 0.35, 0.05]} c="#ff9a9a" />
        <Box p={[1.1, 3.9, 1.51]} s={[0.5, 0.35, 0.05]} c="#ff9a9a" />
      </group>
      {[0, 1, 2].map((i) => {
        const rise = (t * 0.8 + i / 3) % 1;
        return <PixelText key={i} text="@" t={10} p={[-3 + i * 3, 6 + rise * 4, 0]} size={0.22} c="#ff5a6e" edge="#c22f45" />;
      })}
    </group>
  );
};

const Save: React.FC<P> = ({t, sign = 'SAVE'}) => (
  <group>
    <Island />
    <group rotation={[0, Math.sin(t * 2) * 0.4, 0]}>
      <PixelText text="%" t={t} p={[0, 2, 0]} size={0.8} c="#fff6e5" edge="#e0a93a" />
    </group>
    <PixelText text={sign} t={t} p={[0, 9, 0]} size={0.3} delay={0.2} />
  </group>
);

const Bye: React.FC<P> = ({t, sign = 'SHANTOU'}) => (
  <group>
    <City t={t + 3} />
    <Plane p={[-6 + t * 6, 6 + t * 3, 4]} ry={0} rz={0.35} scale={1.3} />
    <PixelText text={sign} t={t} p={[0, 15, 2]} size={0.34} />
  </group>
);

export const ISLANDS: React.FC<P>[] = [Hook, Sport, Cut, Plates, Cow, Timer, Dip, Judge, Balls, Sauce, Bite, Save, Bye];
