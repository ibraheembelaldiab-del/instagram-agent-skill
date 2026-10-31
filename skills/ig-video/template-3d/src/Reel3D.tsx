import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {World, type Beat} from './World';

export type Reel3DData = {
  fps: number;
  audio?: string;
  music?: string;
  musicVolume?: number;
  beats: Beat[];
};

const FONT = '"DejaVu Sans", "PingFang SC", "Microsoft YaHei", "WenQuanYi Zen Hei", sans-serif';

// Burned-in captions, low and in the safe zone, word by word.
const Caption: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const spaced = text.includes(' ');
  const words = spaced ? text.split(' ') : Array.from(text);
  const progress = interpolate(frame, [0, durationInFrames - fps * 0.3], [0, words.length], {
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 430,
        left: 70,
        right: 160,
        textAlign: 'center',
        fontSize: 52,
        fontWeight: 800,
        lineHeight: 1.25,
        fontFamily: FONT,
        color: 'white',
        // Chinese strokes are dense, so a thick outline turns them to mud.
        WebkitTextStroke: spaced ? '2px #5a1f3a' : '0.5px #5a1f3a',
        textShadow: '0 4px 0 #5a1f3a, 0 8px 18px rgba(90,31,58,0.5)',
      }}
    >
      {words.map((w, i) => (
        <span key={i} style={{color: i < progress ? '#ffe066' : 'white'}}>
          {w}
          {spaced ? ' ' : ''}
        </span>
      ))}
    </div>
  );
};

export const Reel3D: React.FC<Reel3DData> = (data) => {
  const {fps, width, height} = useVideoConfig();
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} camera={{fov: 50, near: 0.1, far: 400}}>
        <World beats={data.beats} />
      </ThreeCanvas>
      {data.beats.map((b, i) => (
        <Sequence key={i} from={Math.round(b.start * fps)} durationInFrames={Math.max(1, Math.round(b.dur * fps))}>
          <Caption text={b.say} />
        </Sequence>
      ))}
      {data.audio ? <Audio src={staticFile(data.audio)} /> : null}
      {data.music ? <Audio src={staticFile(data.music)} volume={data.musicVolume ?? 0.12} /> : null}
    </AbsoluteFill>
  );
};
