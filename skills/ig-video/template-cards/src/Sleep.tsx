import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, useFont} from './Cards';
import {At, Hl, Pop, clamp, inOut, outCubic} from './Spec';

// 睡前刷手机, six scenes in 25 s, in the original card design.

export const SLEEP_FRAMES = 25 * 30;
const BOUNDS = [0, 5, 8, 12, 17, 22, 25];
const XF = 0.45; // scene change: zoom out + crossfade
const LINES = [0.1, 0.45, 0.8, 1.3]; // when each text block slides up

const Tag: React.FC<{t: number; text: string}> = ({t, text}) => (
  <Pop t={t} at={-0.1} style={{position: 'absolute', top: 120, left: 96, fontWeight: 700, fontSize: 44, letterSpacing: 4, color: '#8fa0d8'}}>
    {text}
  </Pop>
);
const Big: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{fontWeight: 900, fontSize: 132, lineHeight: 1.3, letterSpacing: 2}}>{children}</div>
);
const Mid: React.FC<{t: number; at: number; lines: string[]}> = ({t, at, lines}) => (
  <Pop t={t} at={at} style={{fontWeight: 700, fontSize: 64, lineHeight: 1.4, color: '#c9d4ff', marginTop: 40}}>
    {lines.map((l) => (
      <div key={l}>{l}</div>
    ))}
  </Pop>
);
const Num: React.FC<{t: number; n: string}> = ({t, n}) => (
  <Pop t={t} at={-0.05} style={{fontWeight: 900, fontSize: 120, color: '#ffd23f', lineHeight: 1, marginBottom: 28}}>
    {n}
  </Pop>
);
// The glowing phone at the bottom of the card, as in the original design.
const Phone: React.FC<{t: number; opacity: number; gray?: boolean; y?: number}> = ({t, opacity, gray, y = 0}) => {
  const p = 0.5 + 0.5 * Math.sin(t * 2.2);
  return (
    <div
      style={{
        position: 'absolute', left: 390, top: 1240 + y, width: 300, height: 560, borderRadius: 46, border: '10px solid #1e2440', opacity,
        background: 'linear-gradient(160deg,#6aa8ff,#3a5bd9 60%,#2a2f8a)', filter: gray ? 'grayscale(1)' : undefined,
        boxShadow: `0 0 ${140 + p * 40}px ${36 + p * 10}px rgba(90,150,255,${0.3 + p * 0.1})`,
      }}
    >
      <div style={{position: 'absolute', left: 105, top: 14, width: 90, height: 12, borderRadius: 8, background: '#1e2440'}} />
    </div>
  );
};
const Body: React.FC<{children: React.ReactNode}> = ({children}) => <div style={{position: 'absolute', top: 420, left: 96, right: 60}}>{children}</div>;

// Each scene: its content, and where and how much the camera zooms.
const Scene: React.FC<{i: number; t: number}> = ({i, t}) => {
  if (i === 0) {
    const m = 17 + Math.min(4, Math.floor(t / 1.2));
    const colon = Math.floor(t * 2) % 2 === 0;
    return (
      <AbsoluteFill style={{transform: `scale(${1 + clamp(t / 5) * 0.08})`, transformOrigin: '18% 30%'}}>
        <Tag t={t} text="睡前刷手机" />
        <div style={{position: 'absolute', top: 260, right: 96, fontWeight: 900, fontSize: 110, color: '#ff5a6e', fontVariantNumeric: 'tabular-nums'}}>
          02<span style={{opacity: colon ? 1 : 0.35}}>:</span>
          {String(m).padStart(2, '0')}
        </div>
        <Body>
          <Big>
            <Pop t={t} at={-0.2}>凌晨2点</Pop>
            <Pop t={t} at={LINES[1]}>你还在</Pop>
            <Pop t={t} at={LINES[2]}>
              <Hl t={t} at={LINES[2]}>刷手机</Hl>吗？
            </Pop>
          </Big>
          <Mid t={t} at={LINES[3]} lines={['这3个方法，救了我的睡眠 →']} />
        </Body>
        <Phone t={t} opacity={0.9} />
      </AbsoluteFill>
    );
  }
  if (i === 1) {
    const z = 1 + inOut((t - 1.0) / 1.2) * 0.22;
    return (
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '33% 36%'}}>
        <Tag t={t} text="说实话" />
        <Body>
          <Big>
            <Pop t={t} at={LINES[0]}>你昨晚</Pop>
            <Pop t={t} at={LINES[1]}>
              刷到<Hl t={t} at={LINES[1]}>几点</Hl>？
            </Pop>
          </Big>
          <Mid t={t} at={LINES[2]} lines={['评论区告诉我 👇', '关注我，看下一期']} />
        </Body>
        <Phone t={t} opacity={0.6} />
      </AbsoluteFill>
    );
  }
  if (i === 2) {
    const z = 1.14 - outCubic(t / 1.4) * 0.14;
    const out = inOut((t - 1.8) / 1.2);
    return (
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '50% 45%'}}>
        <Tag t={t} text="方法 1/3" />
        <Body>
          <Num t={t} n="01" />
          <Big>
            <Pop t={t} at={LINES[0]}>手机</Pop>
            <Pop t={t} at={LINES[1]}>
              <Hl t={t} at={LINES[1]}>放门外</Hl>
            </Pop>
          </Big>
          <Mid t={t} at={LINES[2]} lines={['够不着，就不会刷。']} />
        </Body>
        <Phone t={t} opacity={0.5 * (1 - out * 0.6)} y={out * 900} />
      </AbsoluteFill>
    );
  }
  if (i === 3) {
    const z = 1 + inOut((t - 0.9) / 1.0) * 0.26;
    const ring = t > 1.6 && t < 2.8;
    return (
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '24% 33%'}}>
        <Tag t={t} text="方法 2/3" />
        <Body>
          <Num t={t} n="02" />
          <Big>
            <Pop t={t} at={LINES[0]}>
              <span style={{color: '#ff5a6e', textShadow: ring ? `0 0 ${20 + Math.sin(t * 30) * 12}px rgba(255,90,110,0.9)` : undefined}}>23:00</span>
              {ring
                ? [0, 1].map((k) => {
                    const r = ((t - 1.6) * 1.8 + k * 0.5) % 1;
                    return <span key={k} style={{position: 'absolute', left: 170 - r * 60, top: 150 - r * 60, width: 260 + r * 120, height: 120 + r * 120, borderRadius: 200, border: `6px solid rgba(255,90,110,${0.8 * (1 - r)})`}} />;
                  })
                : null}
            </Pop>
            <Pop t={t} at={LINES[1]}>
              <Hl t={t} at={LINES[1]}>关机闹钟</Hl>
            </Pop>
          </Big>
          <Mid t={t} at={LINES[2]} lines={['铃一响，手机锁起来。']} />
        </Body>
        <Phone t={t} opacity={0.5} />
      </AbsoluteFill>
    );
  }
  if (i === 4) {
    const z = 1 + inOut((t - 1.0) / 1.2) * 0.22;
    return (
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '36% 44%'}}>
        <Tag t={t} text="方法 3/3" />
        <Body>
          <Num t={t} n="03" />
          <Big>
            <Pop t={t} at={LINES[0]}>睡前写下</Pop>
            <Pop t={t} at={LINES[1]}>
              <Hl t={t} at={LINES[1]}>明天3件事</Hl>
            </Pop>
          </Big>
          <Mid t={t} at={LINES[2]} lines={['写完，关灯，睡觉。']} />
        </Body>
        <Phone t={t} opacity={0.3} gray />
      </AbsoluteFill>
    );
  }
  // The title returns, then everything fades to dark.
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + clamp(t / 3) * 0.05})`}}>
      <Pop t={t} at={0.1} style={{fontWeight: 900, fontSize: 140, letterSpacing: 6}}>
        <Hl t={t} at={0.1}>睡前刷手机</Hl>
      </Pop>
    </AbsoluteFill>
  );
};

export const Sleep: React.FC = () => {
  useFont();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const fade = clamp((t - 23.6) / 1.2);
  const ticks: number[] = [];
  for (let k = 0.2; k < 5; k += 0.5) ticks.push(k);
  return (
    <AbsoluteFill style={{fontFamily: '"Noto Sans SC", sans-serif', color: '#fff', overflow: 'hidden'}}>
      <Backdrop t={t} />
      {BOUNDS.slice(0, -1).map((s, i) => {
        const e = BOUNDS[i + 1];
        const last = i === BOUNDS.length - 2;
        const inK = i === 0 ? 1 : inOut((t - (s - XF / 2)) / XF);
        const outK = last ? 0 : inOut((t - (e - XF / 2)) / XF);
        if (inK <= 0 || outK >= 1) return null;
        // leaving: zoom out and fade; arriving: settle in from slightly close
        const scale = (1 - outK * 0.12) * (1 + (1 - inK) * 0.08);
        return (
          <AbsoluteFill key={i} style={{opacity: inK * (1 - outK), transform: `scale(${scale})`}}>
            <Scene i={i} t={t - s} />
          </AbsoluteFill>
        );
      })}
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
      {/* sound */}
      {BOUNDS.slice(1, -1).map((b) => (
        <At key={`w${b}`} t={b - 0.35} f="whoosh.wav" v={0.5} />
      ))}
      {[
        [0, 4],
        [1, 3],
        [2, 3],
        [3, 3],
        [4, 3],
      ].flatMap(([sc, n]) => LINES.slice(0, n).map((a) => <At key={`d${sc}${a}`} t={BOUNDS[sc] + a + 0.05} f="ding.wav" v={0.28} />))}
      {ticks.map((k) => (
        <At key={`k${k}`} t={k} f="tick.wav" v={0.3} len={0.2} />
      ))}
      <At t={BOUNDS[3] + 1.6} f="alarm.wav" v={0.45} len={1.3} />
      <At t={BOUNDS[5] + 0.3} f="chime.wav" v={0.5} len={2.6} />
    </AbsoluteFill>
  );
};
