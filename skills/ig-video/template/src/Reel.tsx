import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type Beat = {
  start: number; // seconds
  dur: number; // seconds
  say: string; // the spoken line, burned in as a caption
  card?: string; // on-screen text, six words or fewer
  shot?: string; // what to film, shown until a clip is added
  clip?: string; // file in public/clips
};

export type ReelData = {
  fps: number;
  audio?: string; // voiceover file in public/, e.g. "voiceover.wav"

  colors: {bg: string[]; card: string; text: string; accent: string};
  beats: Beat[];
};

// Instagram covers the bottom ~20% and the right edge with the caption and
// buttons, so everything sits in the middle band.
const SAFE_TOP = 220;
const SAFE_BOTTOM = 420;
const SAFE_RIGHT = 160;

const Background: React.FC<{beat: Beat; color: string; index: number}> = ({
  beat,
  color,
  index,
}) => {
  const frame = useCurrentFrame();
  if (beat.clip) {
    return (
      <AbsoluteFill>
        <OffthreadVideo
          src={staticFile(`clips/${beat.clip}`)}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>
    );
  }
  // Slow drift so frame one is never a still image.
  const shift = interpolate(frame, [0, 120], [0, 40]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at ${30 + shift}% ${40 + index * 7}%, ${color}, #120806 75%)`,
      }}
    >
      <Steam />
      {beat.shot ? (
        <div
          style={{
            position: 'absolute',
            top: SAFE_TOP - 120,
            left: 80,
            right: SAFE_RIGHT,
            color: 'rgba(255,255,255,0.45)',
            fontSize: 30,
            fontFamily: 'DejaVu Sans, sans-serif',
            letterSpacing: 1,
          }}
        >
          🎥 FILM: {beat.shot}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const Steam: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({length: 14}).map((_, i) => {
        const speed = 2 + (i % 4);
        const y = 1920 - ((frame * speed + i * 160) % 2200);
        const x = 80 + ((i * 137) % 900) + Math.sin((frame + i * 20) / 25) * 30;
        const size = 40 + (i % 5) * 30;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              filter: 'blur(8px)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Card: React.FC<{text: string; data: ReelData}> = ({text, data}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // Starts at 0.6 scale on frame 0, so there is motion in the first frame.
  const pop = spring({frame, fps, config: {damping: 12, mass: 0.6}});
  const scale = interpolate(pop, [0, 1], [0.6, 1]);
  return (
    <div
      style={{
        position: 'absolute',
        top: SAFE_TOP + 260,
        left: 70,
        right: SAFE_RIGHT - 30,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          transform: `scale(${scale}) rotate(-2deg)`,
          opacity: Math.min(1, pop * 2),
          background: data.colors.card,
          color: data.colors.text,
          padding: '28px 44px',
          borderRadius: 24,
          fontSize: 92,
          fontWeight: 900,
          lineHeight: 1.05,
          textAlign: 'center',
          fontFamily: 'DejaVu Sans, sans-serif',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Caption: React.FC<{text: string; data: ReelData}> = ({text, data}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  // Words light up in order across the beat, like spoken captions.
  const words = text.split(' ');
  const progress = interpolate(frame, [0, durationInFrames - fps * 0.3], [0, words.length], {
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: SAFE_BOTTOM,
        left: 70,
        right: SAFE_RIGHT,
        textAlign: 'center',
        fontSize: 54,
        fontWeight: 800,
        lineHeight: 1.25,
        fontFamily: 'DejaVu Sans, sans-serif',
        color: 'white',
        textShadow: '0 4px 14px rgba(0,0,0,0.9)',
      }}
    >
      {words.map((w, i) => (
        <span key={i} style={{color: i < progress ? data.colors.accent : 'white'}}>
          {w}{' '}
        </span>
      ))}
    </div>
  );
};

export const Reel: React.FC<ReelData> = (data) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#120806'}}>
      {data.audio ? <Audio src={staticFile(data.audio)} /> : null}
      {data.beats.map((beat, i) => (
        <Sequence
          key={i}
          from={Math.round(beat.start * fps)}
          durationInFrames={Math.round(beat.dur * fps)}
        >
          <Background beat={beat} index={i} color={data.colors.bg[i % data.colors.bg.length]} />
          {beat.card ? <Card text={beat.card} data={data} /> : null}
          <Caption text={beat.say} data={data} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
