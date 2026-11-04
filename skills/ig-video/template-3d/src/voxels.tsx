import {DataTexture, NearestFilter, RGBAFormat, RepeatWrapping} from 'three';
import {layout} from './pixelfont';
import {Voxelize, type Sdf} from './voxelize';

// Small building blocks. Everything is a box, or a low-poly shape with flat
// shading, so the whole world reads as one blocky toy set.

export type V3 = [number, number, number];

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// Overshoots a little, then settles. 0 before `delay`, 1 once it has landed.
export const pop = (t: number, delay = 0, len = 0.35) => {
  const x = clamp((t - delay) / len);
  if (x <= 0) return 0.0001;
  return 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2;
};

// A tiny noisy pixel texture, like the grain on a block in a block game.
// One texture per repeat count, shared by every box of that size.
const TEX = new Map<number, DataTexture>();
const pixelTexture = (repeat: number) => {
  const key = Math.min(80, Math.max(1, Math.round(repeat)));
  const hit = TEX.get(key);
  if (hit) return hit;
  const N = 16;
  const data = new Uint8Array(N * N * 4);
  for (let i = 0; i < N * N; i++) {
    const x = Math.sin(i * 12.9898) * 43758.5453;
    const n = x - Math.floor(x);
    // Mostly light grain, with the odd darker speck and a soft edge line.
    const edge = i % N === 0 || i < N ? 0.86 : 1;
    const v = Math.round(255 * edge * (n < 0.08 ? 0.72 : 0.84 + n * 0.16));
    data.set([v, v, v, 255], i * 4);
  }
  const tex = new DataTexture(data, N, N, RGBAFormat);
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(key, key);
  tex.needsUpdate = true;
  TEX.set(key, tex);
  return tex;
};

export const Box: React.FC<{
  p?: V3;
  s?: V3;
  c: string;
  r?: V3;
  glow?: number;
  opacity?: number;
}> = ({p = [0, 0, 0], s = [1, 1, 1], c, r = [0, 0, 0], glow = 0, opacity = 1}) => {
  const big = Math.max(s[0], s[1], s[2]);
  // Small trim pieces stay plain; anything a block or bigger gets grain.
  const map = big >= 0.6 && glow === 0 && opacity === 1 ? pixelTexture(big / 1.2) : null;
  return (
    <mesh position={p} rotation={r} castShadow={opacity === 1} receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        map={map}
        flatShading
        roughness={0.9}
        emissive={c}
        emissiveIntensity={glow}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
};

export const Cyl: React.FC<{p?: V3; r1: number; r2?: number; h: number; c: string; seg?: number}> = ({
  p = [0, 0, 0],
  r1,
  r2,
  h,
  c,
  seg = 10,
}) => (
  <mesh position={p}>
    <cylinderGeometry args={[r1, r2 ?? r1, h, seg]} />
    <meshStandardMaterial color={c} flatShading />
  </mesh>
);

export const Ball: React.FC<{p: V3; r: number; c: string; s?: V3}> = ({p, r, c, s = [1, 1, 1]}) => (
  <mesh position={p} scale={s}>
    <icosahedronGeometry args={[r, 1]} />
    <meshStandardMaterial color={c} flatShading />
  </mesh>
);

// A sign made of cubes. Letters pop in one after another, then bob gently.
export const PixelText: React.FC<{
  text: string;
  t: number;
  p?: V3;
  size?: number;
  c?: string;
  edge?: string;
  ry?: number;
  delay?: number;
  glow?: number;
}> = ({text, t, p = [0, 0, 0], size = 0.35, c = '#fff6e5', edge = '#b8322a', ry = 0, delay = 0, glow = 0}) => {
  const {pixels} = layout(text);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {pixels.map((px, i) => {
        const k = pop(t, delay + px.letter * 0.06);
        const bob = Math.sin(t * 5 + px.letter * 0.8) * 0.08;
        return (
          <group key={i} position={[px.x * size, px.y * size + bob, 0]} scale={k * px.s}>
            <Box s={[size * 0.96, size * 0.96, size * 0.9]} c={c} glow={glow} />
            <Box p={[0, -size * 0.18, -size * 0.35]} s={[size, size, size * 0.4]} c={edge} />
          </group>
        );
      })}
    </group>
  );
};

// The floating island every scene sits on: organic, layered, tapering to a point.
const ISLAND_SHAPES = new Map<string, Sdf>();
const islandShape = (w: number) => {
  const key = String(w);
  const hit = ISLAND_SHAPES.get(key);
  if (hit) return hit;
  const R = w * 0.53;
  const depth = w * 0.95;
  const sdf: Sdf = (x, y, z) => {
    const a = Math.atan2(z, x);
    // An uneven rim, so the top is never a perfect square or circle.
    const rim = R * (0.9 + 0.08 * Math.sin(a * 3 + w) + 0.05 * Math.sin(a * 7 + 1.3) + 0.03 * Math.sin(a * 13));
    const r = Math.hypot(x, z);
    if (y > 0) return y;
    if (y > -1.4) return r - rim;
    // Below the soil the rock tapers, jagged, to a point.
    const k = (-y - 1.4) / depth;
    const jag = 0.12 * Math.sin(a * 5 + y * 0.9) + 0.08 * Math.sin(a * 11 - y * 1.7);
    const radius = rim * Math.max(0, 1 - Math.pow(k, 0.75)) * (1 + jag);
    return Math.max(r - radius, -y - 1.4 - depth);
  };
  ISLAND_SHAPES.set(key, sdf);
  return sdf;
};

const GRASS = ['#79b84f', '#6aa645', '#84c25a', '#73b04b'];
const DIRT = ['#8a6142', '#7a5539', '#94694a'];
const STONE = ['#8f877c', '#7f786e', '#9a9286', '#736d64'];
const paintIsland = (top: string) => (x: number, y: number, z: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  const r = n - Math.floor(n);
  if (y > -0.7) return top === '#8fd16a' ? GRASS[Math.floor(r * 4)] : r > 0.5 ? top : shade(top, 0.9);
  if (y > -1.7) return r > 0.85 ? GRASS[1] : DIRT[Math.floor(r * 3)];
  // Moss creeping down the upper rock, a few ore specks, and darker stone below.
  if (y > -4 && r > 0.82) return '#5f9a3e';
  if (r > 0.97) return '#c9a35a';
  const depthShade = Math.max(0.55, 1 - (-y - 1.7) * 0.035);
  return shade(STONE[Math.floor(r * 4)], depthShade);
};
const shade = (hex: string, k: number) => {
  const v = parseInt(hex.slice(1), 16);
  const ch = (sh: number) => Math.round(((v >> sh) & 255) * k);
  return '#' + [ch(16), ch(8), ch(0)].map((c) => c.toString(16).padStart(2, '0')).join('');
};
const PAINTERS = new Map<string, (x: number, y: number, z: number) => string>();

export const Island: React.FC<{w?: number; top?: string; falls?: boolean}> = ({w = 14, top = '#8fd16a', falls = false}) => {
  const R = w * 0.6;
  const step = 0.6;
  if (!PAINTERS.has(top)) PAINTERS.set(top, paintIsland(top));
  return (
    <group>
      <Voxelize sdf={islandShape(w)} min={[-R, -w * 0.95 - 1.6, -R]} max={[R, -step / 2, R]} step={step} paint={PAINTERS.get(top)!} />
      {falls ? (
        <>
          <Box p={[w * 0.47, -6, w * 0.15]} s={[0.5, 12, 0.9]} c="#cfeaff" opacity={0.55} />
          <Box p={[w * 0.46, -0.15, w * 0.15]} s={[0.7, 0.3, 1.2]} c="#9fd3ff" opacity={0.8} />
        </>
      ) : null}
    </group>
  );
};

export const Plane: React.FC<{p: V3; ry: number; rz?: number; scale?: number}> = ({p, ry, rz = 0, scale = 1}) => (
  <group position={p} rotation={[0, ry, rz]} scale={scale}>
    <Box s={[4, 0.8, 0.8]} c="#ffffff" />
    <Box p={[2.2, 0, 0]} s={[0.6, 0.6, 0.6]} c="#9fd8ff" />
    <Box p={[0, 0, 0]} s={[1.1, 0.2, 5]} c="#e9eef5" />
    <Box p={[-1.8, 0.6, 0]} s={[0.6, 1, 0.2]} c="#ff7a6b" />
    <Box p={[-1.8, 0.2, 0]} s={[0.6, 0.15, 1.8]} c="#e9eef5" />
  </group>
);

export const Slice: React.FC<{p: V3; r?: V3}> = ({p, r = [0, 0, 0]}) => (
  <group position={p} rotation={r}>
    <Box s={[1.6, 0.12, 0.9]} c="#c8443a" />
    <Box p={[0, 0.07, 0.15]} s={[1.3, 0.04, 0.1]} c="#ffe1d4" />
    <Box p={[0.1, 0.07, -0.2]} s={[1.0, 0.04, 0.08]} c="#ffe1d4" />
  </group>
);

export const Cloud: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <Box s={[5, 1.2, 3]} c="#ffffff" />
    <Box p={[1, 0.9, 0]} s={[2.6, 1, 2.2]} c="#ffffff" />
    <Box p={[-1.4, 0.6, 0.3]} s={[2, 0.8, 2]} c="#fff4fa" />
  </group>
);

// Deterministic randomness, so every render of a frame is identical.
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
};
