import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, useFont} from './Cards';
import {At, BedScene, Hl, Pop, clamp, inOut, outCubic} from './Spec';
import {Bedroom} from './Stage';

// 拖延, six scenes in 25 s, in the same style as the 睡前刷手机 video:
// a check-style hook, then three research-backed truths with their sources.

export const HABIT_FRAMES = 25 * 30;
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
  <Pop t={t} at={at} style={{fontWeight: 700, fontSize: 54, lineHeight: 1.45, color: '#c9d4ff', marginTop: 40}}>
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
const Src: React.FC<{t: number; text: string}> = ({t, text}) => (
  <Pop t={t} at={1.8} style={{position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center', fontWeight: 700, fontSize: 34, color: '#6f7fb8'}}>
    {text}
  </Pop>
);
const Body: React.FC<{children: React.ReactNode}> = ({children}) => <div style={{position: 'absolute', top: 420, left: 96, right: 60}}>{children}</div>;

// Each scene: its content, and where and how much the camera zooms.
const Scene: React.FC<{i: number; t: number}> = ({i, t}) => {
  if (i === 0) {
    // New entrance: a calendar of 21 days fills with checks, a red stamp
    // slams onto it, and it stretches to 66 days. The viewer lies in bed below.
    const STAMP = 1.5;
    const GROW = 2.6;
    const stampK = clamp((t - STAMP) / 0.22);
    const g = inOut((t - GROW) / 1.1);
    const n = Math.round(21 + g * 45);
    const cols = g < 0.5 ? 7 : 11;
    const cell = cols === 7 ? 110 : 68;
    const gap = cols === 7 ? 16 : 10;
    const filled = Math.min(21, Math.floor(t / 0.065));
    const punch = t > STAMP ? Math.sin(clamp((t - STAMP) / 0.5) * Math.PI) * 0.06 : 0;
    return (
      <AbsoluteFill style={{transform: `scale(${1 + punch + clamp(t / 5) * 0.04})`, transformOrigin: '50% 45%'}}>
        <Tag t={t} text="关于习惯" />
        <div style={{position: 'absolute', top: 260, left: 96, right: 60, fontWeight: 900, fontSize: 130, lineHeight: 1.25}}>
          <Pop t={t} at={-0.25}>21天</Pop>
          <Pop t={t} at={0.15}>养成习惯？</Pop>
        </div>
        <div style={{position: 'absolute', top: 640, left: 96, width: 888, display: 'flex', flexWrap: 'wrap', gap}}>
          {Array.from({length: n}).map((_, k) => {
            const isNew = k >= 21;
            const appear = isNew ? clamp((g * 45 - (k - 21)) / 3) : 1;
            const done = k < filled && t < GROW + 0.2;
            return (
              <div key={k} style={{width: cell, height: cell, borderRadius: 12, background: done ? '#2f8a5a' : isNew ? 'rgba(255,210,63,0.22)' : 'rgba(255,255,255,0.1)', border: `3px solid ${isNew ? 'rgba(255,210,63,0.6)' : 'rgba(255,255,255,0.18)'}`, opacity: appear, transform: `scale(${0.6 + 0.4 * appear})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: cell * 0.5}}>
                {done ? '✓' : ''}
              </div>
            );
          })}
        </div>
        {t > STAMP ? (
          <div style={{position: 'absolute', left: 540, top: 820, transform: `translate(-50%, -50%) rotate(-12deg) scale(${2.4 - 1.4 * stampK})`, opacity: stampK, border: '14px solid #ff3b4e', borderRadius: 26, padding: '6px 40px', color: '#ff3b4e', fontWeight: 900, fontSize: 170, letterSpacing: 10, background: 'rgba(10,12,30,0.55)', boxShadow: '0 0 40px rgba(255,59,78,0.45)', whiteSpace: 'nowrap'}}>
            假的
          </div>
        ) : null}
        <Pop t={t} at={GROW + 0.3} style={{position: 'absolute', top: 1150, left: 96, right: 60, fontWeight: 900, fontSize: 64}}>
          研究：平均要<Hl t={t} at={GROW + 0.3}>66天</Hl>
        </Pop>
        <Pop t={t} at={GROW + 0.7} style={{position: 'absolute', top: 1250, left: 96, fontWeight: 700, fontSize: 32, color: '#8090c8'}}>研究：Lally 等, 2010</Pop>
        <div style={{position: 'absolute', inset: 0, transform: 'translateY(150px) scale(0.85)', transformOrigin: '540px 1700px'}}>
          <BedScene t={t} />
        </div>
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
            <Pop t={t} at={LINES[0]}>你最想养成</Pop>
            <Pop t={t} at={LINES[1]}>
              <Hl t={t} at={LINES[1]}>什么习惯</Hl>？
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
        <Tag t={t} text="真相 1/3" />
        <Body>
          <Num t={t} n="01" />
          <Big>
            <Pop t={t} at={LINES[0]}>你每天43%的事</Pop>
            <Pop t={t} at={LINES[1]}>
              是<Hl t={t} at={LINES[1]}>自动驾驶</Hl>
            </Pop>
          </Big>
          <Mid t={t} at={LINES[2]} lines={['不是你决定的，', '是习惯在替你做。']} />
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
        <Tag t={t} text="真相 2/3" />
        <Body>
          <Num t={t} n="02" />
          <Big>
            <Pop t={t} at={LINES[0]}>
              <span style={{color: '#ff5a6e', textShadow: ring ? `0 0 ${20 + Math.sin(t * 30) * 12}px rgba(255,90,110,0.9)` : undefined}}>断了一天？</span>
              {ring
                ? [0, 1].map((k) => {
                    const r = ((t - 1.6) * 1.8 + k * 0.5) % 1;
                    return <span key={k} style={{position: 'absolute', left: 170 - r * 60, top: 150 - r * 60, width: 260 + r * 120, height: 120 + r * 120, borderRadius: 200, border: `6px solid rgba(255,90,110,${0.8 * (1 - r)})`}} />;
                  })
                : null}
            </Pop>
            <Pop t={t} at={LINES[1]}>
              <Hl t={t} at={LINES[1]}>没关系</Hl>
            </Pop>
          </Big>
          <Mid t={t} at={LINES[2]} lines={['偶尔漏掉一天，', '几乎不影响习惯养成。']} />
        </Body>
        <Phone t={t} opacity={0.5} />
      </AbsoluteFill>
    );
  }
  if (i === 4) {
    const z = 1 + inOut((t - 1.0) / 1.2) * 0.22;
    return (
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '36% 44%'}}>
        <Tag t={t} text="真相 3/3" />
        <Body>
          <Num t={t} n="03" />
          <Big>
            <Pop t={t} at={LINES[0]}>绑在</Pop>
            <Pop t={t} at={LINES[1]}>
              <Hl t={t} at={LINES[1]}>同一个场景</Hl>
            </Pop>
          </Big>
          <Mid t={t} at={LINES[2]} lines={['「每天刷完牙，就读1页书」', '场景固定，习惯才会自动化。']} />
        </Body>
        <Phone t={t} opacity={0.3} gray />
      </AbsoluteFill>
    );
  }
  // The title returns; the viewer puts the phone away and falls asleep.
  return (
    <AbsoluteFill style={{transform: `scale(${1 + clamp(t / 3) * 0.04})`}}>
      <Pop t={t} at={0.1} style={{position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center', fontWeight: 900, fontSize: 140, letterSpacing: 6}}>
        <Hl t={t} at={0.1}>给自己66天</Hl>
      </Pop>
      <div style={{position: 'absolute', inset: 0, opacity: outCubic(t / 0.5), transform: 'translateY(-30px) scale(1.15)', transformOrigin: '540px 1620px'}}>
        <BedScene t={t} asleep={inOut((t - 0.5) / 1.2)} />
      </div>
    </AbsoluteFill>
  );
};

export const Habit: React.FC = () => {
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
      {/* research sources, pinned to the bottom so the zooms never push them away */}
      {[
        [2, '研究：Wood 等, 2002'],
        [3, '研究：Lally 等, 2010'],
        [4, '研究：Wood & Neal, 2007'],
      ].map(([i, text]) => {
        const s0 = BOUNDS[i as number];
        const e0 = BOUNDS[(i as number) + 1];
        const o = clamp((t - s0 - 1.6) / 0.4) * (1 - clamp((t - (e0 - 0.3)) / 0.3));
        return o > 0 ? (
          <div key={text as string} style={{position: 'absolute', bottom: 70, left: 0, right: 0, textAlign: 'center', fontWeight: 700, fontSize: 34, color: '#8090c8', opacity: o}}>
            {text}
          </div>
        ) : null;
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
      <At t={1.45} f="boom.wav" v={0.6} len={1} />
      <At t={2.55} f="whoosh.wav" v={0.35} />
      <At t={BOUNDS[3] + 1.6} f="alarm.wav" v={0.45} len={1.3} />
      <At t={BOUNDS[5] + 0.3} f="chime.wav" v={0.5} len={2.6} />
    </AbsoluteFill>
  );
};
