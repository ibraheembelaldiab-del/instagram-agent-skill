import {useThree} from '@react-three/fiber';
import {useLayoutEffect} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {PerspectiveCamera} from 'three';
import {ISLANDS} from './islands';
import {Box, Cloud, rand, type V3} from './voxels';

export type Beat = {start: number; dur: number; say: string; sign?: string; labels?: string[]; same?: boolean; marks?: number[]; chapter?: string; fakeEnd?: boolean; punch?: number};

// Lines marked `same` stay on the island of the line before, so one island can
// play out over several lines. `marks` tells it when each of those lines starts.
const toScenes = (beats: Beat[]): Beat[] => {
  const out: Beat[] = [];
  for (const b of beats) {
    const prev = out[out.length - 1];
    if (b.same && prev) {
      prev.marks = [...(prev.marks ?? [0]), b.start - prev.start];
      prev.dur = b.start + b.dur - prev.start;
    } else {
      out.push({...b, marks: [0]});
    }
  }
  return out;
};

// Islands wander in every direction, so the trips between them do too.
const SPACING = 48;
export const islandPos = (i: number): V3 => [Math.sin(i * 1.9) * 34, Math.cos(i * 1.3) * 8 - i * 2, -i * SPACING];

const TRANSITION = 0.9; // seconds: the petals stream over and the camera rides them
const SKY = '#ffd9ec';

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// One move per scene, so the camera never does the same thing twice in a row.
type Move = 'wide' | 'hello' | 'crane' | 'orbitL' | 'orbitR' | 'push' | 'low' | 'top' | 'pull' | 'goodbye';
const MOVES: Move[] = ['push', 'crane', 'wide', 'push', 'low', 'orbitL', 'top', 'crane', 'pull', 'orbitR', 'push', 'top', 'orbitL', 'goodbye'];

const pose = (i: number, u: number, dur: number, last: number): {pos: V3; look: V3} => {
  const c = islandPos(i);
  const k = ease(Math.min(1, u / Math.max(0.5, dur)));
  // The last scene is always the close goodbye, however long the video is.
  const move = i === last ? 'goodbye' : (MOVES[i] === 'goodbye' ? 'orbitL' : MOVES[i] ?? 'orbitL');
  const side = i % 2 ? 1 : -1;
  let angle = side * 0.4;
  let radius = 24;
  let height = 9;
  let lookY = 3.8;
  switch (move) {
    case 'wide':
      // Far enough back to see the whole island, drifting slowly around it.
      radius = 38;
      height = 15;
      angle += u * 0.12;
      lookY = 4.5;
      break;
    case 'hello':
      radius = lerp(30, 17, k);
      height = lerp(15, 6, k);
      lookY = 4.2;
      break;
    case 'crane':
      height = lerp(2, 16, k);
      lookY = lerp(5, 3, k);
      break;
    case 'orbitL':
      angle += u * 0.35;
      break;
    case 'orbitR':
      angle -= u * 0.35;
      break;
    case 'push':
      radius = lerp(34, 18, k);
      break;
    case 'pull':
      radius = lerp(16, 30, k);
      height = lerp(5, 12, k);
      break;
    case 'low':
      height = 1.2;
      radius = 25;
      lookY = 6;
      angle += u * 0.15;
      break;
    case 'top':
      height = 19;
      radius = 15;
      angle += u * 0.5;
      lookY = 2;
      break;
    case 'goodbye':
      // Slowly in to the panda's face, which sits about 4.5 high.
      radius = lerp(16, 8.5, k);
      height = lerp(6, 5, k);
      angle = lerp(-0.25, 0, k);
      lookY = 3.7;
      break;
  }
  return {pos: [c[0] + Math.sin(angle) * radius, c[1] + height, c[2] + Math.cos(angle) * radius], look: [c[0], c[1] + lookY, c[2]]};
};

const CameraRig: React.FC<{beats: Beat[]; time: number}> = ({beats, time}) => {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useLayoutEffect(() => {
    const last = beats.length - 1;
    let i = beats.findIndex((b) => time < b.start + b.dur);
    if (i < 0) i = last;
    const u = time - beats[i].start;
    let {pos, look} = pose(i, u, beats[i].dur, last);
    let fov = 50;
    const left = beats[i].dur - u;
    if (i < last && left < TRANSITION) {
      // Ride the bridge: rise over it in an arc, glancing ahead to the next island.
      const k = ease(1 - left / TRANSITION);
      const next = pose(i + 1, 0, beats[i + 1].dur, last);
      pos = lerp3(pos, next.pos, k);
      pos[1] += Math.sin(k * Math.PI) * 12;
      look = lerp3(look, next.look, Math.min(1, k * 1.4));
      fov = 50 + Math.sin(k * Math.PI) * 22;
    }
    camera.position.set(...pos);
    camera.lookAt(...look);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }, [beats, time, camera]);
  return null;
};

// A stream of small petal blocks flows from this island to the next, swirling
// like cherry blossoms in the wind, and the camera rides along with it.
const PETALS = 130;
const PINKS = ['#ff7fb0', '#ff9cc4', '#ffffff', '#ff5f9e', '#ffc4dc'];
const PetalStream: React.FC<{from: V3; to: V3; k: number; time: number; seed: number}> = ({from, to, k, time, seed}) => (
  <>
    {Array.from({length: PETALS}).map((_, j) => {
      const r = seed * 97 + j;
      // Each petal leaves at its own moment and travels the whole way.
      const f = (k * 1.6 - rand(r) * 0.6);
      if (f <= 0 || f >= 1) return null;
      const swirl = time * 3 + rand(r + 1) * 6.28;
      const width = 2.5 + rand(r + 2) * 4;
      const base: V3 = [lerp(from[0], to[0], f), lerp(from[1], to[1], f) + 3 + Math.sin(f * Math.PI) * 5, lerp(from[2], to[2], f)];
      const p: V3 = [base[0] + Math.cos(swirl) * width, base[1] + Math.sin(swirl * 1.3) * width * 0.6, base[2] + Math.sin(swirl) * width];
      const size = 0.45 + rand(r + 3) * 0.35;
      return <Box key={j} p={p} s={[size, size * 0.3, size]} c={PINKS[j % PINKS.length]} r={[swirl, swirl * 0.7, swirl * 0.4]} />;
    })}
  </>
);

// Petals that always drift down around the island in view.
const Drift: React.FC<{at: V3; time: number}> = ({at, time}) => (
  <>
    {Array.from({length: 45}).map((_, j) => {
      const fall = (time * (0.5 + rand(j) * 0.4) + rand(j + 50)) % 1;
      const x = at[0] + (rand(j + 10) - 0.5) * 26 + Math.sin(time * 1.5 + j) * 1.5;
      // Behind the island, so a petal never drifts across a close-up.
      const z = at[2] - 3 - rand(j + 20) * 18;
      const y = at[1] + 16 - fall * 18;
      const spin = time * 2 + j;
      return <Box key={j} p={[x, y, z]} s={[0.45, 0.12, 0.45]} c={PINKS[j % PINKS.length]} r={[spin, spin * 0.6, 0]} />;
    })}
  </>
);

export const World: React.FC<{beats: Beat[]; freezeAt?: number; petals?: boolean}> = ({beats: lines, freezeAt, petals = true}) => {
  const beats = toScenes(lines);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // While frozen, the world holds still on one moment, like a paused video.
  const time = freezeAt !== undefined ? Math.min(frame / fps, freezeAt) : frame / fps;
  let cur = beats.findIndex((b) => time < b.start + b.dur);
  if (cur < 0) cur = beats.length - 1;
  const b = beats[cur];
  // The petals set off a little before the camera leaves.
  const BUILD = TRANSITION + 0.5;
  const buildK = cur < beats.length - 1 ? Math.max(0, 1 - (b.start + b.dur - time) / BUILD) : 0;
  const a = islandPos(cur);
  const n = islandPos(cur + 1);
  return (
    <>
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[SKY, 45, 120]} />
      <hemisphereLight args={['#fff3fb', '#a8d8ff', 1.4]} />
      <directionalLight
        position={[30, 45, 35]}
        intensity={1.6}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={50}
        shadow-camera-bottom={-30}
        shadow-camera-far={200}
        shadow-bias={-0.0008}
      />
      <ambientLight intensity={0.25} />
      <CameraRig beats={beats} time={time} />
      {beats.map((bt, i) => {
        if (Math.abs(i - cur) > 1) return null;
        const Scene = ISLANDS[i] ?? ISLANDS[ISLANDS.length - 1];
        return (
          <group key={i} position={islandPos(i)}>
            <Scene t={time - bt.start} dur={bt.dur} sign={bt.sign} labels={bt.labels} marks={bt.marks} />
          </group>
        );
      })}
      {petals && buildK > 0 ? <PetalStream from={a} to={n} k={buildK} time={time} seed={cur} /> : null}
      {petals ? <Drift at={a} time={time} /> : null}
      {Array.from({length: 40}).map((_, i) => {
        const z = -rand(i) * SPACING * beats.length;
        const side = rand(i + 7) > 0.5 ? 1 : -1;
        return (
          <Cloud
            key={`c${i}`}
            p={[(rand(i + 3) - 0.5) * 160, (z / SPACING) * 2 + side * (24 + rand(i + 5) * 14), z]}
            s={1 + rand(i + 11) * 2.5}
          />
        );
      })}
    </>
  );
};
