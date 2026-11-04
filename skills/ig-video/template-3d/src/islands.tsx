import {Lantern, Person} from './people';
import {Panda} from './panda';
import {Box, Cyl, Island, PixelText, Plane, clamp, pop, rand} from './voxels';

// 成都: favourite city, then and now, and its own tiny Disneyland.

type P = {t: number; dur: number; sign?: string; labels?: string[]; marks?: number[]};

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

// The old city and the new one, as lists of blocks: [x, z, width, height, colour].
type B = [number, number, number, number, string];
const OLD: B[] = Array.from({length: 14}).map((_, i) => [
  (i % 5) * 2.4 - 4.8,
  Math.floor(i / 5) * 2.6 - 2.6,
  2,
  0.9 + rand(i) * 0.7,
  ['#9a9a92', '#a8a49a', '#8f8d86'][i % 3],
]);
const NEW: B[] = Array.from({length: 14}).map((_, i) => [
  (i % 5) * 2.4 - 4.8,
  Math.floor(i / 5) * 2.6 - 2.6,
  1.8,
  3 + rand(i + 30) * 7,
  ['#cfe3f2', '#e8dcff', '#bcd7ee', '#ffd7e6'][i % 4],
]);

const City: React.FC<{blocks: B[]; neon?: number; roofs?: boolean}> = ({blocks, neon = 0, roofs}) => (
  <group>
    {blocks.map(([x, z, w, h, c], i) => (
      <group key={i} position={[x, 0, z]}>
        <Box p={[0, h / 2, 0]} s={[w, h, w]} c={c} />
        {roofs ? <Box p={[0, h + 0.15, 0]} s={[w + 0.3, 0.3, w + 0.3]} c="#5c5a55" /> : null}
        {neon > 0 ? <Box p={[0, h * 0.7, w / 2 + 0.02]} s={[w * 0.8, 0.12, 0.02]} c={['#ff4fa0', '#3cf0ff', '#ffd23f'][i % 3]} glow={neon} /> : null}
      </group>
    ))}
  </group>
);

// The tower with a giant panda climbing up its side.
const Favourite: React.FC<P> = ({t, sign = '成都'}) => (
  <group>
    <Island w={16} />
    <Box p={[0, 5, -1]} s={[4, 10, 4]} c="#d9e4ee" />
    {[1, 3, 5, 7, 9].map((y) => (
      <Box key={y} p={[0, y, 1.02]} s={[3.6, 0.15, 0.02]} c="#9fb6c9" />
    ))}
    <group position={[1.6, 7.5 + Math.sin(t * 2) * 0.15, 0.9]} rotation={[0, -0.4, -0.25]}>
      <Panda s={0.7} wave={1.8} />
    </group>
    <City blocks={NEW.slice(0, 5).map(([x, z, w, h, c]) => [x * 1.2, z + 4.5, w, h * 0.5, c])} />
    <PixelText text={sign} t={t} p={[0, 11.5, 0]} size={0.38} />
  </group>
);

const Rolling: React.FC<P> = ({t, sign = '熊猫'}) => (
  <group>
    <Island w={16} />
    {[-4.5, 4.8].map((x, i) => (
      <group key={x} position={[x, 0, -3]}>
        {[0, 1, 2, 3, 4].map((k) => (
          <Box key={k} p={[(k % 2) * 0.3, 1 + k * 1.1, 0]} s={[0.35, 1.1, 0.35]} c={k % 2 ? '#6fbf5a' : '#5aa84a'} r={[0, 0, 0.05 * (i ? 1 : -1)]} />
        ))}
      </group>
    ))}
    {[0, 1].map((i) => {
      const roll = t * 3 + i * 2;
      return (
        <group key={i} position={[-2 + i * 3.5 + Math.sin(t + i) * 0.8, 1.2, 1]} rotation={[0, 0, -roll]}>
          <group position={[0, -2.2, 0]}>
            <Panda s={0.6} />
          </group>
        </group>
      );
    })}
    <PixelText text={sign} t={t} p={[0, 8.5, 0]} size={0.42} />
  </group>
);

const Bikes: React.FC<{t: number}> = ({t}) => (
  <>
    {[0, 1, 2].map((i) => {
      const x = -7 + ((t * 2 + i * 4.5) % 14);
      return (
        <group key={i} position={[x, 0, 4.6 - i * 0.5]}>
          <Cyl p={[-0.5, 0.35, 0]} r1={0.35} h={0.08} c="#333" seg={10} />
          <Cyl p={[0.5, 0.35, 0]} r1={0.35} h={0.08} c="#333" seg={10} />
          <Box p={[0, 0.6, 0]} s={[1, 0.08, 0.08]} c="#333" />
          <Person p={[0, 0.2, 0]} ry={Math.PI / 2} shirt="#6e7f8f" hair="#222" />
        </group>
      );
    })}
  </>
);

const NEON = ['#ff4fa0', '#3cf0ff', '#ffd23f', '#9b6bff', '#4dff9a', '#ff7a3c'];
const BODIES = ['#7fd3ff', '#ff9fd0', '#b9a3ff', '#ffe08a', '#8ff0c8'];

// Rings of little flowers around the island: one planted on the edge, one
// floating just outside it and slowly turning.
const FlowerRings: React.FC<{t: number}> = ({t}) => (
  <>
    {[
      {r: 7.1, n: 40, y: 0, spin: 0},
    ].map((ring, ri) => (
      <group key={ri} rotation={[0, t * ring.spin, 0]}>
        {Array.from({length: ring.n}).map((_, j) => {
          const a = (j / ring.n) * Math.PI * 2;
          const sway = Math.sin(t * 3 + j) * 0.12;
          const bob = ri ? Math.sin(t * 2 + j * 0.5) * 0.3 : 0;
          return (
            <group key={j} position={[Math.cos(a) * ring.r, ring.y + bob, Math.sin(a) * ring.r]} rotation={[sway, 0, sway]}>
              {ri === 0 ? <Box p={[0, 0.35, 0]} s={[0.08, 0.7, 0.08]} c="#4f9a3d" /> : null}
              <Box p={[0, ri ? 0 : 0.8, 0]} s={[0.42, 0.42, 0.42]} c={['#ff7fb0', '#ffd23f', '#b48cff', '#ffffff', '#ff5f9e'][j % 5]} r={[0.6, 0.6, 0]} />
              <Box p={[0, ri ? 0 : 0.8, 0]} s={[0.16, 0.16, 0.5]} c="#ffe48a" />
            </group>
          );
        })}
      </group>
    ))}
  </>
);


// A small tornado of blossoms: it spins up, almost hides the island while the
// city changes inside it, then lets go and the petals scatter.
const PETAL_COLS = ['#ff7fb0', '#ff9cc4', '#ffffff', '#ff5f9e', '#ffc4dc', '#ffd6e6'];
const Tornado: React.FC<{t: number; from: number; to: number}> = ({t, from, to}) => {
  const up = clamp((t - (from - 0.5)) / 0.5);
  const down = clamp((t - to) / 0.6);
  const power = up * (1 - down);
  if (power <= 0 && down <= 0) return null;
  return (
    <>
      {Array.from({length: 560}).map((_, j) => {
        const h = ((t * (0.9 + rand(j) * 0.8) + rand(j + 1)) % 1) * 13;
        // Narrow at the bottom, wide at the top, spinning faster up high.
        const radius = (2.5 + h * 0.55 + rand(j + 2) * 1.5) * (0.4 + 0.6 * power) + down * 10 * rand(j + 3);
        const a = rand(j + 4) * 6.28 + t * (3 + h * 0.25);
        const size = 0.55 + rand(j + 5) * 0.55;
        if (power <= 0.02 && down >= 1) return null;
        return (
          <Box
            key={j}
            p={[Math.cos(a) * radius, h + down * 3 * rand(j + 6), Math.sin(a) * radius]}
            s={[size * Math.max(power, 1 - down), size * 0.3, size * Math.max(power, 1 - down)]}
            c={PETAL_COLS[j % PETAL_COLS.length]}
            r={[a, a * 0.6, h]}
          />
        );
      })}
    </>
  );
};

// 1980 to 2026 on one island: each old house jumps, spins and lands as a
// bright tower, then wobbles like jelly for a moment.
const JUMP = 0.6;
const Change: React.FC<P> = ({t, marks = [0, 1.8, 4.2]}) => {
  const go = (marks[1] ?? 1.8) + 0.25;
  const done = go + JUMP + OLD.length * 0.035;
  const modern = t > go + JUMP * 0.5;
  return (
    <group>
      <Island w={16} top={modern ? '#8fd16a' : '#a7a58f'} />
      <FlowerRings t={t} />
      <Tornado t={t} from={go} to={done + 0.2} />
      {OLD.map(([x, z, w, h, c], i) => {
        const [, , nw, nh] = NEW[i];
        const start = go + i * 0.035;
        const k = clamp((t - start) / JUMP);
        const e = ease(k);
        const lift = Math.sin(k * Math.PI) * 5;
        const changed = k > 0.5;
        const hh = changed ? nh : h;
        const ww = changed ? nw : w;
        // After landing: a quick squash and stretch that settles down.
        const since = t - (start + JUMP);
        const wob = since > 0 ? Math.exp(-3.5 * since) * Math.sin(since * 16) * 0.28 : 0;
        const sy = 1 + wob;
        const sxz = 1 - wob * 0.5;
        return (
          <group key={i} position={[x, lift, z]} rotation={[0, e * Math.PI * 2, 0]} scale={[sxz, sy, sxz]}>
            <Box p={[0, hh / 2, 0]} s={[ww, hh, ww]} c={changed ? BODIES[i % 5] : c} />
            {!changed ? <Box p={[0, h + 0.15, 0]} s={[w + 0.3, 0.3, w + 0.3]} c="#5c5a55" /> : null}
            {changed && since > -0.2
              ? Array.from({length: Math.floor(nh / 1.1)}).map((_, k2) => (
                  <Box key={k2} p={[0, 0.8 + k2 * 1.1, nw / 2 + 0.02]} s={[nw * 0.75, 0.35, 0.02]} c={NEON[(i + k2) % NEON.length]} glow={0.4 + 0.6 * ((k2 + Math.floor(t * 4)) % 2)} />
                ))
              : null}
            {changed ? <Box p={[0, nh + 0.25, 0]} s={[nw * 0.5, 0.5, nw * 0.5]} c={NEON[i % NEON.length]} glow={0.5 + 0.5 * Math.sin(t * 6 + i)} /> : null}
          </group>
        );
      })}
      {!modern ? <Bikes t={t} /> : null}
      {t > done
        ? Array.from({length: 24}).map((_, j) => {
            const tw = Math.max(0, Math.sin(t * 5 + j * 1.7));
            return <Box key={`s${j}`} p={[(rand(j) - 0.5) * 14, 2 + rand(j + 3) * 10, (rand(j + 6) - 0.5) * 8]} s={[0.25 * tw, 0.25 * tw, 0.25 * tw]} c="#fff6c8" glow={1} r={[0.7, 0.7, 0]} />;
          })
        : null}
      {modern ? (
        <PixelText key="new" text="2026" t={t - go - JUMP * 0.5} p={[0, 12, 0]} size={0.38} c="#ffffff" edge="#ff4fa0" />
      ) : (
        <PixelText key="old" text="1980" t={t} p={[0, 8, 0]} size={0.42} c="#e8e2cf" edge="#6b6455" />
      )}
    </group>
  );
};

const Hotpot: React.FC<P> = ({t, sign = '火锅'}) => (
  <group>
    <Island />
    <Cyl p={[0, 1.2, 0]} r1={3.2} h={0.3} c="#a0522d" seg={14} />
    <Box p={[0, 0.6, 0]} s={[0.6, 1.2, 0.6]} c="#7d5534" />
    <Cyl p={[0, 1.95, 0]} r1={2} r2={1.7} h={1.2} c="#2f2f36" seg={14} />
    <Cyl p={[0, 2.56, 0]} r1={1.9} h={0.06} c="#d2301f" seg={14} />
    {Array.from({length: 8}).map((_, i) => {
      const cyc = (t * 1.5 + rand(i) * 3) % 1;
      const a = rand(i + 5) * 6.28;
      return <Box key={i} p={[Math.cos(a) * 1.2, 2.62 + cyc * 0.3, Math.sin(a) * 1.2]} s={[0.25, 0.25, 0.25]} c="#ff8a3d" />;
    })}
    {Array.from({length: 6}).map((_, i) => {
      const rise = (t * 0.9 + i / 6) % 1;
      return <Box key={`s${i}`} p={[Math.sin(i * 2) * 0.9, 3.2 + rise * 4.5, Math.cos(i * 2) * 0.7]} s={[0.5 + rise, 0.5 + rise, 0.5 + rise]} c="#ffffff" opacity={0.55 * (1 - rise)} />;
    })}
    <PixelText text={sign} t={t} p={[0, 9, 0]} size={0.42} />
  </group>
);

const Mahjong: React.FC<P> = ({t, sign = '麻将'}) => (
  <group>
    <Island top="#8fd16a" />
    <Box p={[0, 1.2, 0]} s={[3.2, 0.25, 3.2]} c="#2f8a57" />
    <Box p={[0, 0.6, 0]} s={[0.4, 1.2, 0.4]} c="#7d5534" />
    {Array.from({length: 12}).map((_, i) => (
      <Box key={i} p={[-1.2 + (i % 6) * 0.48, 1.45 + (Math.floor(i / 6) === 0 && Math.sin(t * 8 + i) > 0.9 ? 0.2 : 0), Math.floor(i / 6) ? 1 : -1]} s={[0.4, 0.3, 0.25]} c="#fff7e6" />
    ))}
    {[0, 1, 2, 3].map((i) => {
      const a = (i * Math.PI) / 2;
      return (
        <Person
          key={i}
          p={[Math.sin(a) * 2.6, 0, Math.cos(a) * 2.6]}
          ry={a + Math.PI}
          shirt={['#ffffff', '#6c8cd5', '#c9b28a', '#e46d5f'][i]}
          hair="#d8d8d8"
          arms={i === Math.floor(t * 2) % 4 ? 0.9 : 0.1}
        />
      );
    })}
    <PixelText text={sign} t={t} p={[0, 8.5, 0]} size={0.42} />
  </group>
);

const Hill: React.FC<P> = ({t, sign = '打滚'}) => {
  const u = (t * 0.45) % 1;
  return (
    <group>
      <Island w={16} />
      {[0, 1, 2, 3].map((k) => (
        <Box key={k} p={[-4 + k * 1.2, 0.5 + (3 - k) * 0.9, 0]} s={[4, 1 + (3 - k) * 1.8, 6]} c="#7cc45f" />
      ))}
      <group position={[-4.5 + u * 9, 4.2 - u * 3.8, 0.5]} rotation={[0, 0, -u * 14]}>
        <group position={[0, -2.2, 0]}>
          <Panda s={0.6} />
        </group>
      </group>
      <PixelText text={sign} t={t} p={[0, 9, 0]} size={0.42} />
    </group>
  );
};


// Red maples along a blue river, leaves tumbling down.
const Maple: React.FC<P> = ({t, sign = '枫叶'}) => (
  <group>
    <Island w={16} />
    <Box p={[0, 0.12, 2.5]} s={[16, 0.25, 3]} c="#6fb6e6" />
    {[-5, -2, 1, 4].map((x, i) => (
      <group key={i} position={[x, 0, -1.5 + (i % 2) * 0.8]}>
        <Box p={[0, 1.2, 0]} s={[0.4, 2.4, 0.4]} c="#6b4a2f" />
        <Box p={[0, 3, 0]} s={[2.6, 1.6, 2.6]} c={['#e2452b', '#f07a2a', '#c9302c', '#ee5a24'][i]} />
        <Box p={[0, 4, 0]} s={[1.6, 0.9, 1.6]} c={['#f07a2a', '#e2452b', '#ee5a24', '#c9302c'][i]} />
      </group>
    ))}
    {Array.from({length: 22}).map((_, j) => {
      const fall = (t * 0.6 + rand(j)) % 1;
      const spin = t * 3 + j;
      return (
        <Box key={j} p={[(rand(j + 4) - 0.5) * 14 + Math.sin(t * 2 + j) * 0.6, 5 - fall * 5, (rand(j + 9) - 0.5) * 6]} s={[0.35, 0.08, 0.35]} c={j % 2 ? '#e2452b' : '#f2a33a'} r={[spin, spin * 0.5, 0]} />
      );
    })}
    <PixelText text={sign} t={t} p={[0, 8.5, 0]} size={0.42} c="#fff1d6" edge="#c9302c" />
  </group>
);

// A sea of purple flower blocks with a plane coming in low overhead.
const Flowers: React.FC<P> = ({t, sign = '花海'}) => (
  <group>
    <Island w={16} />
    {Array.from({length: 84}).map((_, j) => {
      const x = (j % 12) * 1.2 - 6.6;
      const z = Math.floor(j / 12) * 1.2 - 3.6;
      const sway = Math.sin(t * 3 + j * 0.4) * 0.08;
      return <Box key={j} p={[x, 0.45 + sway, z]} s={[0.5, 0.9, 0.5]} c={['#8a5cd6', '#a47be6', '#7446c4'][j % 3]} />;
    })}
    <Plane p={[-14 + t * 9, 5.5 + Math.sin(t) * 0.3, -1]} ry={0} rz={0.05} scale={1.6} />
    <PixelText text={sign} t={t} p={[0, 9.5, 0]} size={0.42} c="#f1e6ff" edge="#6a3fb8" />
  </group>
);

// "Disneyland": fireworks over a plain housing block.
const Disney: React.FC<P> = ({t, sign = '迪士尼'}) => (
  <group>
    <Island w={16} />
    <Box p={[0, 3, -2]} s={[9, 6, 3]} c="#e9dccb" />
    {Array.from({length: 12}).map((_, j) => (
      <Box key={j} p={[-3.4 + (j % 4) * 2.3, 1.5 + Math.floor(j / 4) * 1.7, -0.48]} s={[1, 0.9, 0.04]} c="#9fc4de" />
    ))}
    {[0, 1, 2].map((k) => {
      const age = (t * 0.8 + k / 3) % 1;
      return (
        <group key={k} position={[-4 + k * 4, 9 + k * 0.6, -2]} scale={0.3 + age * 1.6}>
          {Array.from({length: 8}).map((_, j) => {
            const a = (j / 8) * Math.PI * 2;
            return <Box key={j} p={[Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0]} s={[0.3, 0.3, 0.3]} c={['#ff5f9e', '#ffd23f', '#3cf0ff'][k]} glow={0.8} opacity={1 - age} />;
          })}
        </group>
      );
    })}
    <PixelText text={sign} t={t} p={[0, 12.5, 0]} size={0.34} />
  </group>
);

// The punchline: one exercise machine, and a queue.
const Queue: React.FC<P> = ({t, sign = '排队'}) => {
  const ride = Math.sin(t * 6);
  return (
    <group>
      <Island w={16} top="#cfd8c4" />
      <group position={[-4, 0, 0]}>
        <Box p={[0, 0.2, 0]} s={[2, 0.4, 1]} c="#2f6fd6" />
        <Box p={[0.6, 1.2, 0]} s={[0.2, 2, 0.2]} c="#f2c14e" />
        <Box p={[-0.2, 1 + ride * 0.15, 0]} s={[1, 0.2, 0.6]} c="#f2c14e" r={[0, 0, ride * 0.25]} />
        <Person p={[-0.3, 0.9 + ride * 0.15, 0]} ry={Math.PI / 2} shirt="#e46d5f" arms={1.2} />
      </group>
      {Array.from({length: 8}).map((_, i) => (
        <Person
          key={i}
          p={[-1.8 + i * 1.1, 0, 0.3 + Math.sin(i) * 0.3]}
          ry={-Math.PI / 2}
          shirt={['#6c8cd5', '#5fb07a', '#9b7fd1', '#f2c14e', '#e4407a', '#6cc4a4', '#e46d5f', '#8c5a3c'][i]}
          bounce={Math.abs(Math.sin(t * 4 + i)) * 0.1}
        />
      ))}
      <PixelText text={sign} t={t} p={[0, 8.5, 0]} size={0.42} />
    </group>
  );
};

const Warm: React.FC<P> = ({t, sign = '烟火气'}) => (
  <group>
    <Island w={16} top="#3b3550" />
    {[-4, 0, 4].map((x, i) => (
      <group key={i} position={[x, 0, -1.5]}>
        <Box p={[0, 1.6, 0]} s={[3.4, 3.2, 2.6]} c={['#8c5a3c', '#a0522d', '#7a4a2a'][i]} />
        <Box p={[0, 3.4, 0]} s={[4, 0.4, 3.2]} c="#3b2a20" />
        <Box p={[0, 1.4, 1.31]} s={[1.6, 1.4, 0.02]} c="#ffd27a" glow={0.8} />
      </group>
    ))}
    {[-5, -1.5, 2, 5.5].map((x, i) => (
      <Lantern key={i} p={[x, 4.6, 1.2]} t={t} i={i} />
    ))}
    {[-2.5, 0.5, 3].map((x, i) => (
      <Person key={`p${i}`} p={[x, 0, 2.8]} ry={Math.sin(t + i) * 0.5} shirt={['#e46d5f', '#6c8cd5', '#f2c14e'][i]} />
    ))}
    <PixelText text={sign} t={t} p={[0, 8.5, 0]} size={0.36} c="#ffe48a" edge="#b8322a" />
  </group>
);

const Ask: React.FC<P> = ({t, sign = '?!'}) => (
  <group>
    <Island />
    {[0, 1, 2].map((i) => (
      <group key={i} position={[-4 + i * 4, 2.5 + i * 0.8, 0]} scale={pop(t, 0.2 + i * 0.2)}>
        <Box s={[2.6, 1.6, 0.4]} c="#ffffff" />
        <Box p={[-0.6, -0.95, 0]} s={[0.5, 0.5, 0.4]} c="#ffffff" />
        <Box p={[0, 0.3, 0.21]} s={[1.8, 0.2, 0.02]} c="#c8ccd6" />
        <Box p={[-0.3, -0.2, 0.21]} s={[1.2, 0.2, 0.02]} c="#c8ccd6" />
      </group>
    ))}
    <Panda p={[0, 0, 2.5]} s={0.6} wave={1.6 + Math.sin(t * 9) * 0.5} />
    <PixelText text={sign} t={t} p={[0, 7.5, 0]} size={0.5} />
  </group>
);

const Goodbye: React.FC<P> = ({t}) => (
  <group>
    <Island />
    <group rotation={[0, 0, Math.sin(t * 1.5) * 0.05]}>
      <Panda p={[0, 0, 0]} s={1.2} happy={t > 0.6} wave={t > 0.6 ? 0.2 : 1.6 + Math.sin(t * 9) * 0.5} />
    </group>
    {[0, 1, 2].map((i) => {
      const rise = (t * 0.5 + i / 3) % 1;
      return t > 0.8 ? (
        <PixelText key={i} text="@" t={10} p={[-2.6 + i * 2.6, 6.5 + rise * 3, 0.5]} size={0.16} c="#ff5a6e" edge="#c22f45" />
      ) : null;
    })}
  </group>
);

export const ISLANDS: React.FC<P>[] = [
  Favourite, Rolling, Change, Hotpot, Mahjong, Hill, Maple, Flowers, Disney, Queue, Warm, Ask, Goodbye,
];
