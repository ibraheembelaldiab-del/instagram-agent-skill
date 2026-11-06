import {Box} from './voxels';
import {Voxelize, blend, capsule, ellipsoid, type Sdf} from './voxelize';

// The mascot, rebuilt from fine blocks: a round head and body, a red scarf
// with a fluttering tail, a teal traveller's backpack and a leaf sprout on
// top. Same props as before: `wave` swings the right arm, `hop` lifts him,
// `happy` closes the eyes, `shocked` goes wide-eyed, `talk` opens the mouth.

const K = '#22222a';
const W = '#fbfaf4';
const STEP = 0.11;

const HEAD_C: [number, number, number] = [0, 3.75, 0];
const HEAD_R: [number, number, number] = [1.28, 1.12, 1.1];

const head: Sdf = (x, y, z) => {
  const h = ellipsoid(x, y, z, ...HEAD_C, ...HEAD_R);
  const ears = Math.min(ellipsoid(x, y, z, -0.92, 4.72, -0.1, 0.4, 0.4, 0.3), ellipsoid(x, y, z, 0.92, 4.72, -0.1, 0.4, 0.4, 0.3));
  return blend(h, ears, 0.18);
};
// Black ears and tilted eye patches, a little nose; everything else white.
const paintHead = (x: number, y: number, z: number) => {
  if (y > 4.45 && Math.abs(x) > 0.6) return K;
  for (const sx of [-1, 1]) {
    const dx = x - sx * 0.46;
    const dy = y - 3.78;
    const a = sx * 0.45;
    const u = dx * Math.cos(a) + dy * Math.sin(a);
    const v = -dx * Math.sin(a) + dy * Math.cos(a);
    if (z > 0.4 && (u / 0.3) ** 2 + (v / 0.42) ** 2 < 1) return K;
  }
  if (z > 0.8 && Math.abs(x) < 0.17 && y > 3.3 && y < 3.48) return K;
  return W;
};

const body: Sdf = (x, y, z) => {
  const b = ellipsoid(x, y, z, 0, 1.65, 0, 1.05, 1.15, 0.92);
  const legs = Math.min(ellipsoid(x, y, z, -0.52, 0.42, 0.12, 0.42, 0.45, 0.46), ellipsoid(x, y, z, 0.52, 0.42, 0.12, 0.42, 0.45, 0.46));
  return blend(b, legs, 0.25);
};
// The panda's black "vest" over the shoulders, black legs, a soft white belly.
const paintBody = (x: number, y: number, z: number) => {
  if (y < 0.85) return K;
  if (y > 2.05 && Math.abs(x) > 0.25) return K;
  return z > 0.5 && Math.abs(x) < 0.6 ? '#fffdf6' : W;
};

// The scarf: a ring round the neck.
const scarf: Sdf = (x, y, z) => {
  const q = Math.hypot(x / 1.0, z / 0.9) - 0.88;
  return Math.hypot(q, y - 2.78) - 0.2;
};
const paintScarf = (x: number, y: number) => (Math.abs(y - 2.78) < 0.05 ? '#ffd23f' : x > 0 ? '#e2362f' : '#d02f2a');

const pack: Sdf = (x, y, z) => {
  const dx = Math.abs(x) - 0.6;
  const dy = Math.abs(y - 1.8) - 0.65;
  const dz = Math.abs(z + 1.05) - 0.3;
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dy, dz), 0) - 0.15;
};
const paintPack = (x: number, y: number) => (y > 2.25 ? '#1f8a86' : Math.abs(y - 1.6) < 0.1 ? '#ffd23f' : '#2aa9a2');

const arm: Sdf = (x, y, z) => capsule(x, y, z, [0, 0, 0], [0, 1.05, 0], 0.3);
const paintArm = () => K;

const leaf: Sdf = (x, y, z) =>
  Math.min(capsule(x, y, z, [0, 0, 0], [0, 0.35, 0], 0.06), ellipsoid(x, y, z, 0.22, 0.42, 0, 0.26, 0.1, 0.14), ellipsoid(x, y, z, -0.18, 0.5, 0, 0.2, 0.08, 0.12));
const paintLeaf = (x: number, y: number) => (y < 0.3 ? '#5b9a3c' : x > 0 ? '#7ccf4f' : '#8fdc60');

// Bounds for each part, fixed so the blocks are built once.
const B = {
  head: [[-1.45, 2.55, -1.25], [1.45, 5.2, 1.25]] as const,
  body: [[-1.2, -0.05, -1.05], [1.2, 2.85, 1.05]] as const,
  scarf: [[-1.25, 2.5, -1.15], [1.25, 3.05, 1.15]] as const,
  pack: [[-0.8, 1.0, -1.55], [0.8, 2.6, -0.6]] as const,
  arm: [[-0.35, -0.35, -0.35], [0.35, 1.45, 0.35]] as const,
  leaf: [[-0.45, -0.1, -0.2], [0.55, 0.65, 0.2]] as const,
};
const v = (a: readonly number[]) => a as unknown as [number, number, number];
const HMIN = v(B.head[0]), HMAX = v(B.head[1]);
const BMIN = v(B.body[0]), BMAX = v(B.body[1]);
const SMIN = v(B.scarf[0]), SMAX = v(B.scarf[1]);
const PMIN = v(B.pack[0]), PMAX = v(B.pack[1]);
const AMIN = v(B.arm[0]), AMAX = v(B.arm[1]);
const LMIN = v(B.leaf[0]), LMAX = v(B.leaf[1]);

// Points on the front of the head, for the eyes and mouth to sit on.
const face = (x: number, y: number) => {
  const k = 1 - ((x - HEAD_C[0]) / HEAD_R[0]) ** 2 - ((y - HEAD_C[1]) / HEAD_R[1]) ** 2;
  return HEAD_C[2] + HEAD_R[2] * Math.sqrt(Math.max(0, k)) + 0.04;
};

const Arm: React.FC<{p: [number, number, number]; rz: number; rx?: number}> = ({p, rz, rx = 0}) => (
  <group position={p} rotation={[rx, 0, rz]}>
    <Voxelize sdf={arm} min={AMIN} max={AMAX} step={STEP} paint={paintArm} />
  </group>
);

export const Panda: React.FC<{
  p?: [number, number, number];
  ry?: number;
  s?: number;
  wave?: number;
  hop?: number;
  happy?: boolean;
  shocked?: boolean;
  talk?: number;
  t?: number;
  // Tongue out, for a burnt mouth.
  tongue?: boolean;
}> = ({p = [0, 0, 0], ry = 0, s = 1, wave = 0, hop = 0, happy = false, shocked = false, talk = 0, t = 0, tongue = false}) => {
  const ex = 0.46;
  const ey = 3.82;
  return (
    <group position={[p[0], p[1] + hop, p[2]]} rotation={[0, ry, 0]} scale={s}>
      <Voxelize sdf={body} min={BMIN} max={BMAX} step={STEP} paint={paintBody} />
      <Voxelize sdf={pack} min={PMIN} max={PMAX} step={STEP} paint={paintPack} />
      <Voxelize sdf={head} min={HMIN} max={HMAX} step={STEP} paint={paintHead} />
      <Voxelize sdf={scarf} min={SMIN} max={SMAX} step={STEP} paint={paintScarf} />
      {/* the scarf's tail, fluttering behind */}
      <group position={[0.55, 2.7, -0.75]} rotation={[0.5 + Math.sin(t * 6) * 0.15, 0.4, -0.2 + Math.sin(t * 5) * 0.12]}>
        <Box p={[0, -0.35, 0]} s={[0.32, 0.7, 0.1]} c="#d02f2a" />
        <Box p={[0, -0.72, 0]} s={[0.32, 0.08, 0.1]} c="#ffd23f" />
      </group>
      {/* the leaf sprout */}
      <group position={[0.15, 4.82, 0]} rotation={[0, 0, Math.sin(t * 3) * 0.12]}>
        <Voxelize sdf={leaf} min={LMIN} max={LMAX} step={0.06} paint={paintLeaf} />
      </group>
      {shocked ? (
        <>
          <Arm p={[-0.95, 2.4, 0.3]} rz={0.2} rx={0.55} />
          <Arm p={[0.95, 2.4, 0.3]} rz={-0.2} rx={0.55} />
        </>
      ) : (
        <>
          <Arm p={[-0.95, 2.4, 0.05]} rz={2.95} />
          <Arm p={[0.95, 2.4, 0.05]} rz={-2.84 + (Math.min(wave, 2) / 1.6) * 2.2} />
        </>
      )}
      {/* eyes */}
      {[-ex, ex].map((x) =>
        happy ? (
          <group key={x} position={[x, ey, face(x, ey)]}>
            <Box p={[-0.09, 0, 0]} s={[0.2, 0.06, 0.03]} c="#ffffff" r={[0, 0, 0.6]} />
            <Box p={[0.09, 0, 0]} s={[0.2, 0.06, 0.03]} c="#ffffff" r={[0, 0, -0.6]} />
          </group>
        ) : (
          <group key={x} position={[x, ey, face(x, ey)]}>
            {shocked ? <Box s={[0.36, 0.36, 0.03]} c="#ffffff" /> : null}
            <Box p={[0, -0.02, 0.02]} s={shocked ? [0.14, 0.14, 0.02] : [0.24, 0.3, 0.02]} c="#4a2f22" />
            <Box p={[0, -0.02, 0.025]} s={shocked ? [0.1, 0.1, 0.02] : [0.2, 0.34, 0.02]} c="#4a2f22" />
            <Box p={[0.05, 0.07, 0.035]} s={[0.09, 0.09, 0.02]} c="#ffffff" />
            <Box p={[-0.06, -0.1, 0.035]} s={[0.05, 0.05, 0.02]} c="#ffffff" />
          </group>
        ),
      )}
      {/* mouth */}
      {shocked || talk > 0.05 ? (
        <Box p={[0, 3.13, face(0, 3.13)]} s={[0.34, 0.1 + (shocked ? 0.3 : talk * 0.26), 0.03]} c="#8a2a22" />
      ) : (
        <>
          <Box p={[-0.11, 3.18, face(-0.11, 3.18)]} s={[0.2, 0.05, 0.03]} c={K} r={[0, 0, -0.5]} />
          <Box p={[0.11, 3.18, face(0.11, 3.18)]} s={[0.2, 0.05, 0.03]} c={K} r={[0, 0, 0.5]} />
        </>
      )}
      {tongue ? <Box p={[0.04, 3.0 + Math.sin(t * 20) * 0.03, face(0, 3.0) + 0.06]} s={[0.24, 0.2, 0.1]} c="#ff5a6e" /> : null}
      {/* blush */}
      {[-0.82, 0.82].map((x) => (
        <Box key={`b${x}`} p={[x, 3.42, face(x, 3.42) - 0.03]} s={[0.28, 0.14, 0.02]} c={happy ? '#ff8fa8' : '#ffb3c1'} />
      ))}
    </group>
  );
};
