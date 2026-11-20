import {Panda} from './panda';
import {Ball, Box, Cyl, Island, PixelText, clamp, pop, rand} from './voxels';

// 中国人习以为常，外国人却看呆了: one island per everyday wonder.
// Each island gets `t`, seconds since its line started.

type P = {t: number; dur: number; sign?: string; labels?: string[]};

const RED = '#d7322b';
const GOLD = '#f2c14e';

export const Lantern: React.FC<{p: [number, number, number]; t: number; i?: number}> = ({p, t, i = 0}) => (
  <group position={p} rotation={[0, 0, Math.sin(t * 2 + i) * 0.08]}>
    <Box p={[0, 0.9, 0]} s={[0.08, 0.6, 0.08]} c="#3b2a20" />
    <Box s={[0.9, 1.1, 0.9]} c={RED} glow={0.5} />
    <Box p={[0, 0.6, 0]} s={[0.6, 0.12, 0.6]} c={GOLD} />
    <Box p={[0, -0.6, 0]} s={[0.6, 0.12, 0.6]} c={GOLD} />
    <Box p={[0, -0.95, 0]} s={[0.12, 0.5, 0.12]} c={GOLD} />
  </group>
);

export const Person: React.FC<{p: [number, number, number]; ry?: number; shirt?: string; hair?: string; arms?: number; bounce?: number}> = ({
  p,
  ry = 0,
  shirt = '#6c8cd5',
  hair = '#2b1d16',
  arms = 0,
  bounce = 0,
}) => (
  <group position={[p[0], p[1] + bounce, p[2]]} rotation={[0, ry, 0]}>
    <Box p={[-0.25, 0.5, 0]} s={[0.35, 1, 0.4]} c="#3b3f52" />
    <Box p={[0.25, 0.5, 0]} s={[0.35, 1, 0.4]} c="#3b3f52" />
    <Box p={[0, 1.55, 0]} s={[1, 1.1, 0.6]} c={shirt} />
    <group position={[-0.65, 1.95, 0]} rotation={[0, 0, arms]}>
      <Box p={[0, -0.45, 0]} s={[0.3, 0.9, 0.3]} c={shirt} />
    </group>
    <group position={[0.65, 1.95, 0]} rotation={[0, 0, -arms]}>
      <Box p={[0, -0.45, 0]} s={[0.3, 0.9, 0.3]} c={shirt} />
    </group>
    <Box p={[0, 2.5, 0]} s={[0.8, 0.8, 0.8]} c="#f2c27b" />
    <Box p={[0, 2.95, -0.05]} s={[0.85, 0.25, 0.85]} c={hair} />
    <Box p={[-0.18, 2.55, 0.41]} s={[0.1, 0.12, 0.02]} c="#2b1410" />
    <Box p={[0.18, 2.55, 0.41]} s={[0.1, 0.12, 0.02]} c="#2b1410" />
  </group>
);

export const Pagoda: React.FC<{p: [number, number, number]}> = ({p}) => (
  <group position={p}>
    {[0, 1, 2].map((k) => (
      <group key={k} position={[0, k * 1.6, 0]}>
        <Box p={[0, 0.6, 0]} s={[2.4 - k * 0.5, 1.2, 2.4 - k * 0.5]} c="#fff1d6" />
        <Box p={[0, 1.35, 0]} s={[3.2 - k * 0.6, 0.3, 3.2 - k * 0.6]} c={RED} />
      </group>
    ))}
    <Box p={[0, 5.2, 0]} s={[0.2, 0.8, 0.2]} c={GOLD} />
  </group>
);

const Wall: React.FC = () => (
  <group>
    {Array.from({length: 7}).map((_, i) => {
      const x = -6 + i * 2;
      const y = Math.sin(i * 0.9) * 0.8 + 1;
      return (
        <group key={i} position={[x, y, -3 + Math.cos(i * 0.7) * 1.2]}>
          <Box p={[0, 0, 0]} s={[2.1, 2, 1.6]} c="#c9b28a" />
          <Box p={[-0.6, 1.25, 0]} s={[0.5, 0.5, 1.6]} c="#b89e74" />
          <Box p={[0.4, 1.25, 0]} s={[0.5, 0.5, 1.6]} c="#b89e74" />
        </group>
      );
    })}
    <group position={[0, 2.8, -3.2]}>
      <Box p={[0, 0.8, 0]} s={[2, 1.6, 2]} c="#c9b28a" />
      <Box p={[0, 1.9, 0]} s={[2.8, 0.35, 2.8]} c={RED} />
    </group>
  </group>
);

const China: React.FC<P> = ({t, sign = '中国'}) => (
  <group>
    <Island w={18} />
    <Wall />
    <Pagoda p={[-4.5, 0, 3]} />
    {[-1, 1.5, 4].map((x, i) => (
      <Lantern key={i} i={i} t={t} p={[x + 1, 4 + (i % 2) * 0.6, 3]} />
    ))}
    <Box p={[4.5, 0.15, 3]} s={[3, 0.3, 3]} c="#7cc7e8" />
    <PixelText text={sign} t={t} p={[0, 9.5, 0]} size={0.42} />
  </group>
);

// The coin stays still while the train blurs past: that is the joke.
const Train: React.FC<P> = ({t, sign = '350'}) => {
  const x = -22 + ((t * 26) % 44);
  return (
    <group>
      <Island w={16} />
      <Box p={[0, 0.1, -2]} s={[16, 0.2, 1.6]} c="#8a8f99" />
      <group position={[x, 1.3, -2]}>
        <Box s={[10, 2, 1.8]} c="#f4f6fa" />
        <Box p={[5.6, -0.2, 0]} s={[1.6, 1.6, 1.7]} c="#f4f6fa" r={[0, 0, -0.35]} />
        <Box p={[0, -0.55, 0.91]} s={[10, 0.25, 0.02]} c="#2d6cdf" />
        {Array.from({length: 8}).map((_, i) => (
          <Box key={i} p={[-4.2 + i * 1.15, 0.3, 0.91]} s={[0.8, 0.5, 0.02]} c="#1d2533" />
        ))}
      </group>
      {Array.from({length: 6}).map((_, i) => (
        <Box key={`l${i}`} p={[-6 + ((t * 40 + i * 3) % 12), 1 + i * 0.3, -0.6]} s={[2.5, 0.06, 0.06]} c="#ffffff" opacity={0.7} />
      ))}
      <Box p={[0, 1, 2.5]} s={[3.5, 0.3, 1.6]} c="#a0522d" />
      <Box p={[0, 0.45, 2.5]} s={[0.4, 0.9, 0.4]} c="#7d5534" />
      <group position={[0, 1.95, 2.5]} rotation={[Math.PI / 2, 0, 0]} scale={pop(t, 0.2)}>
        <Cyl r1={0.8} h={0.15} c={GOLD} seg={18} />
      </group>
      <PixelText text={sign} t={t} p={[0, 7.5, 0]} size={0.42} />
    </group>
  );
};

const QR: React.FC = () => (
  <group>
    {Array.from({length: 49}).map((_, k) => {
      const x = k % 7;
      const y = Math.floor(k / 7);
      const corner = (x < 2 && y < 2) || (x > 4 && y < 2) || (x < 2 && y > 4);
      if (!corner && rand(k + 3) < 0.5) return null;
      return <Box key={k} p={[(x - 3) * 0.16, (3 - y) * 0.16, 0]} s={[0.15, 0.15, 0.02]} c="#111" />;
    })}
  </group>
);

const Scan: React.FC<P> = ({t, sign = '扫码'}) => {
  const ok = pop(t, 1.3);
  return (
    <group>
      <Island />
      <group position={[-2, 0, 0]}>
        <Box p={[0, 1.2, 0]} s={[3.6, 2.4, 2]} c="#e9e2d0" />
        <Box p={[0, 2.5, 0]} s={[3.8, 0.2, 2.2]} c="#c0c4cc" />
        <Cyl p={[0, 2.62, 0]} r1={1.1} h={0.1} c="#e7b25a" seg={16} />
        <Box p={[0, 4, -0.8]} s={[0.12, 3, 0.12]} c="#888" />
        <Box p={[0, 5.5, -0.8]} s={[4.5, 0.25, 3]} c={RED} />
        <group position={[1.9, 1.7, 1.02]}>
          <Box s={[1.4, 1.4, 0.05]} c="#ffffff" />
          <group position={[0, 0, 0.04]}>
            <QR />
          </group>
        </group>
      </group>
      <group position={[2.6, 2.6 + Math.sin(t * 3) * 0.1, 2]} rotation={[0, -0.6, 0]}>
        <Box s={[1, 1.9, 0.15]} c="#1c1c22" />
        <Box p={[0, 0, 0.08]} s={[0.85, 1.6, 0.02]} c={ok > 0.5 ? '#2fbf71' : '#9fd8ff'} glow={0.6} />
        <Box p={[0, 0.7 - ((t * 1.5) % 1.4), 0.1]} s={[0.85, 0.05, 0.02]} c="#3cff7a" glow={1} />
      </group>
      <group position={[2.6, 4.6, 2]} scale={ok}>
        <PixelText text="!" t={10} p={[0, 0, 0]} size={0.2} c="#2fbf71" edge="#1a7a46" />
      </group>
      <Person p={[4, 0, 0.5]} ry={-0.8} />
      <PixelText text={sign} t={t} p={[0, 8, 0]} size={0.42} />
    </group>
  );
};

const Delivery: React.FC<P> = ({t, sign = '外卖'}) => {
  const k = clamp(t / 2.2);
  const x = -7 + k * 9;
  return (
    <group>
      <Island w={16} />
      <group position={[4.5, 0, -1]}>
        <Box p={[0, 2, 0]} s={[4, 4, 3.5]} c="#ffe0c7" />
        <Box p={[0, 4.3, 0]} s={[4.6, 0.6, 4]} c="#8c5a3c" />
        <Box p={[-2.01, 1.1, 0.3]} s={[0.05, 2.2, 1.2]} c="#7a4a2a" />
        <Box p={[-2.03, 2.8, -1]} s={[0.05, 0.9, 0.9]} c="#ffe48a" glow={0.8} />
      </group>
      <group position={[x, 0, 0.3]} rotation={[0, 0, 0]}>
        <Cyl p={[-0.9, 0.4, 0]} r1={0.4} h={0.3} c="#222" seg={10} />
        <Cyl p={[0.9, 0.4, 0]} r1={0.4} h={0.3} c="#222" seg={10} />
        <Box p={[0, 0.8, 0]} s={[2.2, 0.5, 0.6]} c="#ffd21f" />
        <Box p={[-0.7, 1.6, 0]} s={[0.9, 0.9, 0.9]} c="#ffd21f" />
        <Person p={[0.3, 0.6, 0]} ry={Math.PI / 2} shirt="#ffd21f" hair="#ffd21f" />
      </group>
      <Ball p={[7, 11, -7]} r={1.1} c="#fff6c8" />
      <PixelText text={sign} t={t} p={[0, 7.5, 0]} size={0.42} />
    </group>
  );
};

const Seat: React.FC<P> = ({t, sign = '占座'}) => {
  const back = clamp((t - 1) / 0.8);
  return (
    <group>
      <Island />
      <Cyl p={[0, 1.6, 0]} r1={2} h={0.2} c="#f6efe6" seg={14} />
      <Box p={[0, 0.8, 0]} s={[0.3, 1.6, 0.3]} c="#666" />
      <Box p={[0.3, 1.75, 0.3]} s={[0.7, 0.08, 1.3]} c="#1c1c22" r={[0, 0.4, 0]} />
      <Box p={[0.3, 1.8, 0.3]} s={[0.6, 0.02, 1.15]} c="#9fd8ff" r={[0, 0.4, 0]} glow={0.5 + 0.5 * Math.sin(t * 6)} />
      <Box p={[-1, 1.9, -0.6]} s={[0.5, 0.5, 0.5]} c="#ffffff" />
      <Box p={[-3, 0.6, 0]} s={[1.4, 0.2, 1.4]} c="#a0522d" />
      <Box p={[-3.6, 1.4, 0]} s={[0.2, 1.6, 1.4]} c="#a0522d" />
      <Person p={[-3 - (1 - back) * 4, 0, 1.5]} ry={Math.PI / 2} shirt="#e46d5f" />
      <PixelText text={sign} t={t} p={[0, 7, 0]} size={0.42} />
    </group>
  );
};

const Night: React.FC<P> = ({t, sign = '夜市'}) => (
  <group>
    <Island w={16} top="#3b3550" />
    {[-4.5, 0, 4.5].map((x, i) => (
      <group key={i} position={[x, 0, -1]}>
        <Box p={[0, 0.9, 0]} s={[3.6, 1.8, 2]} c={['#e46d5f', '#f2c14e', '#6cc4a4'][i]} />
        <Box p={[0, 3.2, 0]} s={[4, 0.3, 2.6]} c="#ffffff" />
        <Box p={[-1.7, 2.1, 1]} s={[0.12, 2.2, 0.12]} c="#888" />
        <Box p={[1.7, 2.1, 1]} s={[0.12, 2.2, 0.12]} c="#888" />
        {Array.from({length: 3}).map((_, k) => {
          const rise = (t * 0.8 + k / 3 + i * 0.2) % 1;
          return <Box key={k} p={[(k - 1) * 0.8, 2 + rise * 3, 0]} s={[0.4 + rise, 0.4 + rise, 0.4 + rise]} c="#ffffff" opacity={0.5 * (1 - rise)} />;
        })}
      </group>
    ))}
    {Array.from({length: 9}).map((_, i) => (
      <Box key={`b${i}`} p={[-6 + i * 1.5, 4.6 + Math.sin(i) * 0.2, 1.2]} s={[0.3, 0.3, 0.3]} c={GOLD} glow={0.6 + 0.4 * Math.sin(t * 6 + i)} />
    ))}
    <Lantern p={[-3, 5.6, 1.5]} t={t} />
    <Lantern p={[3, 5.6, 1.5]} t={t} i={2} />
    {[-3, -1, 1.5, 3.5].map((x, i) => (
      <Person key={`p${i}`} p={[x, 0, 2.6]} ry={Math.sin(t + i) * 0.6} shirt={['#6c8cd5', '#e46d5f', '#9b7fd1', '#5fb07a'][i]} />
    ))}
    <PixelText text={sign} t={t} p={[0, 8, 0]} size={0.42} c="#ffe48a" edge="#b8322a" />
  </group>
);

const Parcels: React.FC<P> = ({t, sign = '快递'}) => (
  <group>
    <Island />
    <Box p={[0, 0.5, 0]} s={[10, 0.4, 2]} c="#4b4f5c" />
    {Array.from({length: 7}).map((_, i) => {
      const x = -5 + ((t * 3 + i * 1.6) % 11);
      return (
        <group key={i} position={[x, 1.3, 0]}>
          <Box s={[1.1, 1, 1.1]} c="#d4a373" />
          <Box p={[0, 0.51, 0]} s={[1.12, 0.02, 0.25]} c="#b07c48" />
        </group>
      );
    })}
    {[0, 1, 2, 3, 4, 5].map((k) => (
      <group key={`s${k}`} position={[-3 + (k % 3) * 1.15, 0.5 + Math.floor(k / 3) * 1.05, 3]} scale={pop(t, k * 0.15)}>
        <Box s={[1.1, 1, 1.1]} c="#d4a373" />
      </group>
    ))}
    <PixelText text={sign} t={t} p={[0, 7, 0]} size={0.42} />
  </group>
);

const Dance: React.FC<P> = ({t, sign = '广场舞'}) => (
  <group>
    <Island w={16} top="#d9cdb8" />
    <Box p={[5.5, 1, -3]} s={[1.4, 2, 1.2]} c="#2b2b33" />
    <Cyl p={[5.5, 1.3, -2.38]} r1={0.45} h={0.05} c="#666" seg={12} />
    {Array.from({length: 6}).map((_, i) => {
      const x = -4 + (i % 3) * 3;
      const z = -1.5 + Math.floor(i / 3) * 3;
      const beat = t * 4.2;
      return (
        <Person
          key={i}
          p={[x, 0, z]}
          ry={Math.sin(beat * 0.5) * 0.5}
          shirt={['#e4407a', '#f2c14e', '#e4407a', '#9b7fd1', '#e46d5f', '#f2c14e'][i]}
          hair="#3a2a3a"
          arms={1.2 + Math.sin(beat) * 0.9}
          bounce={Math.abs(Math.sin(beat)) * 0.4}
        />
      );
    })}
    <PixelText text={sign} t={t} p={[0, 7.5, 0]} size={0.38} />
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
    <PixelText text={sign} t={t} p={[0, 7.5, 0]} size={0.5} />
  </group>
);

const End: React.FC<P> = (props) => <China {...props} />;


// The goodbye: the panda up close, eyes shut in a big smile.
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

export const CHINA_ISLANDS: React.FC<P>[] = [China, Train, Scan, Delivery, Seat, Night, Parcels, Dance, Ask, End, Goodbye];
