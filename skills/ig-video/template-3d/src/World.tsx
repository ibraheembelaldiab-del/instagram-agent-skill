import {useThree} from '@react-three/fiber';
import {useLayoutEffect} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {PerspectiveCamera} from 'three';
import {ISLANDS} from './islands';
import {Cloud, rand, type V3} from './voxels';

export type Beat = {start: number; dur: number; say: string};

// Islands float down a long diagonal, so every move is a forward swoop.
const SPACING = 60;
export const islandPos = (i: number): V3 => [Math.sin(i * 1.3) * 26, -i * 5, -i * SPACING];

const TRANSITION = 0.5; // seconds of fly-through at the end of each beat
const SKY = '#ffd9ec';

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// Where the camera sits while beat i plays, u seconds in. It never stops:
// a slow orbit, plus a dive on the hook and a pull-back on the last line.
const pose = (i: number, u: number, last: number): {pos: V3; look: V3} => {
  const c = islandPos(i);
  let radius = 25;
  let height = 9;
  if (i === 0) {
    const k = ease(Math.min(1, u / 2.6));
    radius = lerp(60, 34, k);
    height = lerp(40, 14, k);
  }
  if (i === last) {
    const k = ease(Math.min(1, u / 2));
    radius = lerp(34, 52, k);
    height = lerp(14, 26, k);
  }
  const angle = -0.35 + (i % 3) * 0.35 + u * 0.22;
  const look: V3 = [c[0], c[1] + (i === 0 || i === last ? 7 : 3.8), c[2]];
  return {pos: [c[0] + Math.sin(angle) * radius, c[1] + height, c[2] + Math.cos(angle) * radius], look};
};

const CameraRig: React.FC<{beats: Beat[]; time: number}> = ({beats, time}) => {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useLayoutEffect(() => {
    const last = beats.length - 1;
    let i = beats.findIndex((b) => time < b.start + b.dur);
    if (i < 0) i = last;
    const u = time - beats[i].start;
    let {pos, look} = pose(i, u, last);
    let fov = 50;
    const left = beats[i].dur - u;
    if (i < last && left < TRANSITION) {
      // Fly through to the next island, widening the lens for speed.
      const k = ease(1 - left / TRANSITION);
      const next = pose(i + 1, 0, last);
      pos = lerp3(pos, next.pos, k);
      look = lerp3(look, next.look, k);
      fov = 50 + Math.sin(k * Math.PI) * 28;
    }
    camera.position.set(...pos);
    camera.lookAt(...look);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }, [beats, time, camera]);
  return null;
};

export const World: React.FC<{beats: Beat[]}> = ({beats}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  let cur = beats.findIndex((b) => time < b.start + b.dur);
  if (cur < 0) cur = beats.length - 1;
  return (
    <>
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[SKY, 45, 120]} />
      <hemisphereLight args={['#fff3fb', '#a8d8ff', 1.4]} />
      <directionalLight position={[20, 40, 25]} intensity={1.6} color="#fff4e0" />
      <ambientLight intensity={0.25} />
      <CameraRig beats={beats} time={time} />
      {beats.map((b, i) => {
        // Only the islands near the camera, so each frame renders fast.
        if (Math.abs(i - cur) > 1) return null;
        const Scene = ISLANDS[i] ?? ISLANDS[ISLANDS.length - 1];
        return (
          <group key={i} position={islandPos(i)}>
            <Scene t={time - b.start} dur={b.dur} />
          </group>
        );
      })}
      {Array.from({length: 40}).map((_, i) => {
        // Well above or below the flight path, never in front of the lens.
        const z = -rand(i) * SPACING * beats.length;
        const side = rand(i + 7) > 0.5 ? 1 : -1;
        return (
          <Cloud
            key={`c${i}`}
            p={[(rand(i + 3) - 0.5) * 140, (z / SPACING) * 5 + side * (22 + rand(i + 5) * 14), z]}
            s={1 + rand(i + 11) * 2.5}
          />
        );
      })}
    </>
  );
};
