import {ThreeCanvas} from '@remotion/three';
import {Panda} from './panda';
import {useThree} from '@react-three/fiber';
import {useLayoutEffect} from 'react';
import type {PerspectiveCamera} from 'three';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {World, type Beat} from './World';

export type Reel3DData = {
  fps: number;
  audio?: string;
  music?: string;
  musicVolume?: number;
  // Reaction format: a panda in a circle reacts to the scene, then at line
  // `pause` the video freezes and the circle comes to the middle to talk.
  pip?: {pause: number};
  // A big title for the first seconds: the scroll-stopper. Keep it under 14
  // characters of Chinese or 8 words of English, and make it a question or a claim.
  hook?: string;
  // Whooshes between scenes, a pop when a sign lands, a thud on the hook.
  sfx?: boolean;
  // Cherry-blossom petals flowing between scenes.
  petals?: boolean;
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
        fontSize: spaced ? 52 : 46,
        fontWeight: 800,
        lineHeight: 1.25,
        fontFamily: FONT,
        color: 'white',
        WebkitTextStroke: spaced ? '2px #5a1f3a' : undefined,
        textShadow: spaced ? '0 4px 0 #5a1f3a, 0 8px 18px rgba(90,31,58,0.5)' : '0 2px 4px rgba(0,0,0,0.6)',
      }}
    >
      {/* Chinese strokes are dense: a dark box reads cleaner than an outline. */}
      <span
        style={
          spaced
            ? undefined
            : {background: 'rgba(30,12,24,0.62)', padding: '10px 22px', borderRadius: 18, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', lineHeight: 1.6}
        }
      >
      {words.map((w, i) => (
        <span key={i} style={{color: i < progress ? '#ffe066' : 'white'}}>
          {w}
          {spaced ? ' ' : ''}
        </span>
      ))}
      </span>
    </div>
  );
};


// Points the circle's own camera at the panda's face.
const FaceCam: React.FC = () => {
  const camera = useThree((st) => st.camera) as PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(0, 2.6, 12);
    camera.lookAt(0, 2.1, 0);
    camera.fov = 32;
    camera.updateProjectionMatrix();
  });
  return null;
};

// The reacting panda, filmed close in its own little circle.
const PandaCam: React.FC<{beats: Beat[]; pause: number}> = ({beats, pause}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const p = beats[pause];
  const end = p.start + p.dur;
  if (t > end + 0.4) return null;
  // Slide from the top-right corner to the middle when the video pauses.
  const k = interpolate(t, [p.start - 0.1, p.start + 0.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const e = k * k * (3 - 2 * k);
  const out = interpolate(t, [end - 0.1, end + 0.4], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const size = 400 + e * 360;
  const left = (width - 400 - 40) * (1 - e) + ((width - size) / 2) * e;
  const top = 250 * (1 - e) + ((height - size) / 2) * e;
  const talking = t > p.start + 0.4;
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        border: '10px solid #ff9a1f',
        boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
        background: 'radial-gradient(circle, #cfe6fb 0%, #8fc2ea 100%)',
        opacity: out,
        transform: `scale(${out})`,
      }}
    >
      <ThreeCanvas width={Math.round(size - 20)} height={Math.round(size - 20)} camera={{fov: 30, position: [0, 3.7, 9]}}>
        <FaceCam />
        <hemisphereLight args={['#fff3fb', '#a8d8ff', 1.5]} />
        <directionalLight position={[5, 8, 10]} intensity={1.4} />
        <group position={[0, -0.3 + Math.abs(Math.sin(t * 3)) * 0.1, 0]} rotation={[0, Math.sin(t * 2) * 0.12, talking ? 0 : Math.sin(t * 1.6) * 0.08]}>
          <Panda happy={!talking && Math.floor(t * 1.2) % 3 === 2} talk={talking ? Math.abs(Math.sin(t * 9)) : 0} wave={talking ? 1.4 + Math.sin(t * 5) * 0.4 : 0.2} />
        </group>
      </ThreeCanvas>
    </div>
  );
};

// A paused-video look: grey wash and a big pause sign.
const PauseLook: React.FC<{beats: Beat[]; pause: number}> = ({beats, pause}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const p = beats[pause];
  if (t < p.start || t > p.start + p.dur) return null;
  const a = interpolate(t, [p.start, p.start + 0.2, p.start + p.dur - 0.2, p.start + p.dur], [0, 1, 1, 0]);
  return (
    <AbsoluteFill style={{background: `rgba(40,30,40,${0.45 * a})`, justifyContent: 'flex-start', alignItems: 'center'}}>
      <div style={{marginTop: 300, display: 'flex', gap: 34, opacity: a}}>
        <div style={{width: 46, height: 150, background: 'white', borderRadius: 12}} />
        <div style={{width: 46, height: 150, background: 'white', borderRadius: 12}} />
      </div>
    </AbsoluteFill>
  );
};


// A fake ending: the picture dims, a big "完" fades in, and the next line
// ("等等！还有一个！") breaks it.
const FakeEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const k = interpolate(t, [0, 0.4], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: `rgba(10,8,14,${0.72 * k})`, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 240, color: '#ffffff', opacity: k, transform: `scale(${1.3 - 0.3 * k})`, letterSpacing: 20}}>完</div>
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 48, color: '#bbbbbb', opacity: k, marginTop: 10}}>THE END</div>
    </AbsoluteFill>
  );
};

// A chapter tag at the top: a black "#01" badge and a yellow label, which
// slide in when a new chapter starts and stay until the next one.
const ChapterTag: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const [num, ...rest] = text.split(' ');
  const inX = interpolate(t, [0, 0.25], [-700, 0], {extrapolateRight: 'clamp'});
  const pop = interpolate(t, [0.2, 0.32, 0.45], [1, 1.12, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 150, left: 56, display: 'flex', alignItems: 'center', gap: 18, transform: `translateX(${inX}px)`, fontFamily: FONT, fontWeight: 900}}>
      <div style={{background: '#16141a', color: '#ffd23f', fontSize: 64, padding: '6px 24px', borderRadius: 18, transform: `scale(${pop})`, boxShadow: '0 6px 0 rgba(0,0,0,0.25)'}}>{num}</div>
      <div style={{background: '#ffd23f', color: '#16141a', fontSize: 70, padding: '4px 26px', borderRadius: 10, boxShadow: '0 6px 0 rgba(0,0,0,0.25)'}}>{rest.join(' ')}</div>
    </div>
  );
};

// The hook title: slams in on frame one with a little shake, then gets out of the way.
const HookCard: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const slam = interpolate(t, [0, 0.18], [1.6, 1], {extrapolateRight: 'clamp'});
  const shake = t < 0.35 ? Math.sin(t * 90) * 10 * (1 - t / 0.35) : 0;
  const out = interpolate(t, [2.5, 3], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (t > 3) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 560,
        left: 60,
        right: 60,
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: text.length > 10 ? 76 : 96,
        lineHeight: 1.15,
        color: '#ffffff',
        transform: `translateX(${shake}px) scale(${slam * out})`,
        opacity: out,
      }}
    >
      {/* A dark label reads over any scene, Latin or Chinese. */}
      <span
        style={{
          background: 'rgba(20,14,24,0.78)',
          padding: '14px 30px',
          borderRadius: 26,
          border: '6px solid #ff9a1f',
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
          lineHeight: 1.5,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// Sound effects placed automatically from the scene list.
const Sfx: React.FC<{beats: Beat[]}> = ({beats}) => {
  const {fps} = useVideoConfig();
  const heads = beats.filter((b) => !b.same);
  return (
    <>
      <Sequence from={0} durationInFrames={Math.round(fps * 0.6)}>
        <Audio src={staticFile('sfx/thud.wav')} volume={0.55} />
      </Sequence>
      <Sequence from={0} durationInFrames={Math.round(fps * 1.5)}>
        <Audio src={staticFile('sfx/jingle.wav')} volume={0.32} />
      </Sequence>
      {beats.map((b, i) =>
        b.punch !== undefined ? (
          <Sequence key={`k${i}`} from={Math.round((b.start + b.punch) * fps)} durationInFrames={Math.round(fps * 0.6)}>
            <Audio src={staticFile('sfx/thud.wav')} volume={0.45} />
          </Sequence>
        ) : null,
      )}
      {heads.slice(1).map((b, i) => (
        <Sequence key={`w${i}`} from={Math.max(0, Math.round((b.start - 0.55) * fps))} durationInFrames={Math.round(fps * 0.7)}>
          <Audio src={staticFile('sfx/whoosh.wav')} volume={0.35} />
        </Sequence>
      ))}
      {heads.map((b, i) =>
        b.sign ? (
          <Sequence key={`p${i}`} from={Math.round((b.start + 0.05) * fps)} durationInFrames={Math.round(fps * 0.3)}>
            <Audio src={staticFile('sfx/pop.wav')} volume={0.3} />
          </Sequence>
        ) : null,
      )}
    </>
  );
};

// A quick zoom-in punch on the shocking moments: in fast, settle back.
const punchScale = (beats: Beat[], now: number) => {
  let s = 1;
  for (const b of beats) {
    if (b.punch === undefined) continue;
    const d = now - (b.start + b.punch);
    if (d > 0 && d < 0.5) s += 0.14 * (d < 0.08 ? d / 0.08 : Math.exp(-(d - 0.08) * 9));
  }
  return s;
};

export const Reel3D: React.FC<Reel3DData> = (data) => {
  const {fps, width, height} = useVideoConfig();
  const frame = useCurrentFrame();
  const pz = data.pip ? data.beats[data.pip.pause] : undefined;
  const now = frame / fps;
  // Hold the world still for the whole pause line.
  const freezeAt = pz && now >= pz.start && now < pz.start + pz.dur ? pz.start : undefined;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${punchScale(data.beats, now)})`}}>
        <ThreeCanvas width={width} height={height} shadows camera={{fov: 50, near: 0.1, far: 600}}>
          <World beats={data.beats} freezeAt={freezeAt} petals={data.petals ?? true} />
        </ThreeCanvas>
      </AbsoluteFill>
      {data.pip ? <PauseLook beats={data.beats} pause={data.pip.pause} /> : null}
      {data.pip ? <PandaCam beats={data.beats} pause={data.pip.pause} /> : null}
      {data.beats.map((b, i) => (
        <Sequence key={i} from={Math.round(b.start * fps)} durationInFrames={Math.max(1, Math.round(b.dur * fps))}>
          <Caption text={b.say} />
        </Sequence>
      ))}
      {data.beats.map((b, i) => {
        if (!b.chapter) return null;
                let last = i;
        while (data.beats[last + 1]?.same) last++;
        const end = data.beats[last].start + data.beats[last].dur;
        return (
          <Sequence key={`c${i}`} from={Math.round(b.start * fps)} durationInFrames={Math.max(1, Math.round((end - b.start) * fps))}>
            <ChapterTag text={b.chapter} />
          </Sequence>
        );
      })}
      {data.beats.map((b, i) =>
        b.fakeEnd ? (
          <Sequence key={`f${i}`} from={Math.round((b.start + 0.5) * fps)} durationInFrames={Math.max(1, Math.round((b.dur - 0.5) * fps))}>
            <FakeEnd />
          </Sequence>
        ) : null,
      )}
      {data.hook ? <HookCard text={data.hook} /> : null}
      {data.sfx !== false ? <Sfx beats={data.beats} /> : null}
      {data.audio ? <Audio src={staticFile(data.audio)} /> : null}
      {data.music ? <Audio src={staticFile(data.music)} volume={data.musicVolume ?? 0.12} /> : null}
    </AbsoluteFill>
  );
};
