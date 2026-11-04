import {Box} from './voxels';

const K = '#1e1e24';
const W = '#fbfbf7';

// The mascot. `wave` swings the right arm; `hop` lifts him off the ground.
export const Panda: React.FC<{
  p?: [number, number, number];
  ry?: number;
  s?: number;
  wave?: number;
  hop?: number;
  happy?: boolean;
  // Wide eyes, open mouth, both paws up at the cheeks.
  shocked?: boolean;
  // 0..1, how open the mouth is while talking.
  talk?: number;
}> = ({p = [0, 0, 0], ry = 0, s = 1, wave = 0, hop = 0, happy = false, shocked = false, talk = 0}) => (
  <group position={[p[0], p[1] + hop, p[2]]} rotation={[0, ry, 0]} scale={s}>
    <Box p={[-0.5, 0.45, 0]} s={[0.7, 0.9, 0.8]} c={K} />
    <Box p={[0.5, 0.45, 0]} s={[0.7, 0.9, 0.8]} c={K} />
    <Box p={[0, 1.7, 0]} s={[2, 1.8, 1.5]} c={W} />
    <Box p={[0, 2.3, 0]} s={[2.05, 0.6, 1.55]} c={K} />
    {shocked ? (
      <>
        <group position={[-1.15, 2.5, 0.3]} rotation={[-0.5, 0, -2.5]}>
          <Box p={[0.1, 0.55, 0]} s={[0.55, 1.3, 0.6]} c={K} />
        </group>
        <group position={[1.15, 2.5, 0.3]} rotation={[-0.5, 0, 2.5]}>
          <Box p={[-0.1, 0.55, 0]} s={[0.55, 1.3, 0.6]} c={K} />
        </group>
      </>
    ) : (
      <Box p={[-1.25, 2.1, 0]} s={[0.55, 1.2, 0.6]} c={K} />
    )}
    <group position={[1.15, 2.5, 0]} rotation={[0, 0, wave]} visible={!shocked}>
      <Box p={[0.1, 0.5, 0]} s={[0.55, 1.2, 0.6]} c={K} />
    </group>
    <Box p={[0, 3.75, 0]} s={[2.2, 2, 2]} c={W} />
    <Box p={[-0.85, 4.9, 0]} s={[0.65, 0.65, 0.6]} c={K} />
    <Box p={[0.85, 4.9, 0]} s={[0.65, 0.65, 0.6]} c={K} />
    <Box p={[-0.5, 3.85, 1.01]} s={[0.6, 0.72, 0.04]} c={K} r={[0, 0, 0.35]} />
    <Box p={[0.5, 3.85, 1.01]} s={[0.6, 0.72, 0.04]} c={K} r={[0, 0, -0.35]} />
    {happy ? (
      // Closed, smiling eyes: a little arch on each patch.
      <>
        {[-0.45, 0.45].map((x) => (
          <group key={x}>
            <Box p={[x - 0.09, 3.95, 1.04]} s={[0.2, 0.06, 0.03]} c="#ffffff" r={[0, 0, 0.6]} />
            <Box p={[x + 0.09, 3.95, 1.04]} s={[0.2, 0.06, 0.03]} c="#ffffff" r={[0, 0, -0.6]} />
          </group>
        ))}
      </>
    ) : shocked ? (
      <>
        {[-0.45, 0.45].map((x) => (
          <group key={x}>
            <Box p={[x, 3.95, 1.04]} s={[0.38, 0.38, 0.03]} c="#ffffff" />
            <Box p={[x, 3.95, 1.06]} s={[0.14, 0.14, 0.02]} c={K} />
          </group>
        ))}
      </>
    ) : (
      <>
        <Box p={[-0.45, 3.95, 1.04]} s={[0.2, 0.2, 0.03]} c="#ffffff" />
        <Box p={[0.45, 3.95, 1.04]} s={[0.2, 0.2, 0.03]} c="#ffffff" />
      </>
    )}
    {shocked || talk > 0.05 ? <Box p={[0, 3.02, 1.04]} s={[0.42, 0.12 + (shocked ? 0.34 : talk * 0.3), 0.03]} c="#7a1c14" /> : null}
    <Box p={[0, 3.4, 1.03]} s={[0.36, 0.24, 0.04]} c={K} />
    <Box p={[-0.16, 3.1, 1.03]} s={happy ? [0.34, 0.07, 0.03] : [0.24, 0.06, 0.03]} c={K} r={[0, 0, -0.5]} />
    <Box p={[0.16, 3.1, 1.03]} s={happy ? [0.34, 0.07, 0.03] : [0.24, 0.06, 0.03]} c={K} r={[0, 0, 0.5]} />
    <Box p={[-0.78, 3.3, 1.02]} s={[0.3, 0.2, 0.02]} c={happy ? '#ff8fa8' : '#ffb3c1'} />
    <Box p={[0.78, 3.3, 1.02]} s={[0.3, 0.2, 0.02]} c={happy ? '#ff8fa8' : '#ffb3c1'} />
  </group>
);

