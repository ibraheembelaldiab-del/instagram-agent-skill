import {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {At, clamp, inOut, outBack, outCubic} from './Spec';

// 话术博弈 · 「因为」的魔法 — a 16:9 "Vibe 知识大赏" style knowledge film in the
// Brain Manual palette. No voice-over: Chinese subtitles with English below,
// five zones (signature, chapter tag, central animation, note band ~70%,
// subtitle band ~85-91%), something moving every second, sources at the end.

const W = 1920;
const H = 1080;
const BG = '#0a0a1e';
const Y = '#ffd23f';
const R = '#ff5a6e';
const B = '#7fb2ff';
const T1 = '#ffffff';
const T2 = '#c9d4ff';
const T3 = '#8090c8';
const SERIF = '"Noto Serif SC", serif';

type Beat = {zh: string; en: string; kind: string; dur: number; p?: Record<string, unknown>; chapter?: string};

const BEATS: Beat[] = [
  {kind: 'hook', dur: 5.5, zh: 'Same request. Just two extra words.', en: '', chapter: '序'},
  {kind: 'big', dur: 4.2, zh: 'The yes rate went from 60% to 93%.', en: '', p: {a: '60%', b: '93%'}},
  {kind: 'title', dur: 4, zh: 'The magic word is "because".', en: '', p: {t: 'The Persuasion Game', s: 'The "because" effect', e: 'PSYCHOLOGY OF YES'}},
  {kind: 'year', dur: 5, zh: 'In 1978, Harvard psychologist Ellen Langer ran an experiment.', en: '', chapter: '01 The copier study'},
  {kind: 'queue', dur: 4.8, zh: 'People tried to cut in line at a copy machine.', en: ''},
  {kind: 'three', dur: 6.5, zh: 'They asked in one of three ways.', en: ''},
  {kind: 'bars', dur: 6.5, zh: 'No reason: 60%. Real reason: 94%. Empty reason: 93%.', en: '', p: {v: [60, 94, 93], l: ['No reason', 'Real reason', 'Empty reason'], hi: 2}},
  {kind: 'quote', dur: 5, zh: '"Because I have to make copies" is not a reason at all.', en: ''},
  {kind: 'brain', dur: 5.5, zh: 'The brain hears "because" and assumes there is a reason.', en: '', chapter: '02 Autopilot'},
  {kind: 'twist', dur: 3.5, zh: 'But here is the twist.', en: ''},
  {kind: 'bars', dur: 7, zh: 'For 20 pages, the empty reason failed: 24%, same as none.', en: '', p: {v: [24, 42, 24], l: ['No reason', 'Real reason', 'Empty reason'], hi: 1, head: 'Big request · 20 pages'}},
  {kind: 'rule', dur: 5, zh: 'Small ask: any "because". Big ask: a real reason.', en: ''},
  {kind: 'year', dur: 5, zh: 'In 1966, two Stanford researchers tried another move.', en: '', p: {y: 1966, s: 'Stanford · Foot-in-the-door'}, chapter: '03 Start small'},
  {kind: 'stairs', dur: 6, zh: 'First a small signature. A big favor two weeks later.', en: ''},
  {kind: 'bars2', dur: 6.5, zh: 'Asked straight away: 17%. After a small yes: 76%.', en: ''},
  {kind: 'echo', dur: 6, zh: 'In 2003, a Dutch waitress repeated orders word for word.', en: '', chapter: '04 Echo them'},
  {kind: 'coins', dur: 5, zh: 'She got noticeably bigger tips.', en: ''},
  {kind: 'life', dur: 7, zh: 'Try it in your own life:', en: '', chapter: '05 Your life'},
  {kind: 'rule2', dur: 4.5, zh: "It's not a trick. It's psychology.", en: ''},
  {kind: 'call', dur: 6, zh: 'Smart or sneaky? Comment 1 for smart, 2 for sneaky.', en: ''},
  {kind: 'cite', dur: 7, zh: 'For education. Diagrams are illustrations; numbers are from the papers.', en: ''},
];
const STARTS = BEATS.map((_, i) => BEATS.slice(0, i).reduce((a, b) => a + b.dur, 0));
export const VIBE_EN_FRAMES = Math.round(BEATS.reduce((a, b) => a + b.dur, 0) * 30);
const chapterAt = (i: number) => {
  for (let k = i; k >= 0; k--) if (BEATS[k].chapter) return BEATS[k].chapter as string;
  return '';
};

const useSerif = () => {
  const [h] = useState(() => delayRender('serif'));
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = ['400', '700', '900'].map((w) => `@import url('${staticFile(`serif/${w}.css`)}');`).join('');
    document.head.appendChild(el);
    const sample = BEATS.map((b) => b.zh).join('') + '话术博弈的魔法脑子说明书示意图哈佛斯坦福登门槛实验复印机插队情商心机扣研究来源';
    setTimeout(async () => {
      await Promise.all(['400', '700', '900'].map((w) => document.fonts.load(`${w} 40px "Noto Serif SC"`, sample)));
      await document.fonts.ready;
      continueRender(h);
    }, 50);
  }, [h]);
};

const In: React.FC<{t: number; at?: number; d?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({t, at = 0, d = 0.5, children, style}) => {
  const p = outCubic((t - at) / d);
  return <div style={{...style, opacity: p, transform: `${style?.transform ?? ''} translateY(${(1 - p) * 24}px)`}}>{children}</div>;
};
const Bubble: React.FC<{t: number; at: number; text: string; x: number; y: number; dim?: boolean; who?: string}> = ({t, at, text, x, y, dim, who = 'Me'}) => {
  const p = outBack((t - at) / 0.5);
  return (
    <div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 16, opacity: clamp((t - at) / 0.25) * (dim ? 0.4 : 1), transform: `scale(${0.85 + 0.15 * p})`, transformOrigin: 'left center'}}>
      <div style={{width: 58, height: 58, borderRadius: 29, border: `2px solid ${Y}`, color: Y, fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{who}</div>
      <div style={{padding: '16px 28px', borderRadius: 16, border: `2px solid ${dim ? T3 : Y}`, background: 'rgba(13,20,48,0.9)', color: T1, fontSize: 42, whiteSpace: 'nowrap', boxShadow: dim ? undefined : '0 0 30px rgba(255,210,63,0.15)'}}>{text}</div>
    </div>
  );
};
const Stamp: React.FC<{t: number; at: number; ok: boolean; text: string; x: number; y: number}> = ({t, at, ok, text, x, y}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `scale(${outBack((t - at) / 0.4)})`, opacity: clamp((t - at) / 0.2), color: ok ? Y : R, border: `3px solid ${ok ? Y : R}`, borderRadius: 40, padding: '4px 26px', fontSize: 36, fontWeight: 700}}>
    {ok ? '✓ ' : '✕ '}
    {text}
  </div>
);
const Bars: React.FC<{t: number; v: number[]; l: string[]; hi: number; head?: string; x?: number; y?: number}> = ({t, v, l, hi, head, x = 420, y = 250}) => (
  <div style={{position: 'absolute', left: x, top: y}}>
    {head ? <In t={t} style={{color: Y, fontSize: 36, marginBottom: 26, letterSpacing: 4}}>{head}</In> : null}
    {v.map((val, i) => {
      const k = inOut((t - 0.3 - i * 0.35) / 1.1);
      const on = i === hi;
      return (
        <div key={i} style={{display: 'flex', alignItems: 'center', gap: 26, marginBottom: 30, opacity: clamp((t - 0.2 - i * 0.35) / 0.3)}}>
          <div style={{width: 280, textAlign: 'right', fontSize: 36, color: on ? Y : T2, whiteSpace: 'nowrap'}}>{l[i]}</div>
          <div style={{width: 640, height: 54, borderRadius: 27, background: 'rgba(255,255,255,0.07)', overflow: 'hidden'}}>
            <div style={{width: `${val * k}%`, height: '100%', borderRadius: 27, background: on ? `linear-gradient(90deg,#e0b020,${Y})` : '#3a4370'}} />
          </div>
          <div style={{width: 130, fontSize: 56, fontWeight: 900, color: on ? Y : T2, fontVariantNumeric: 'tabular-nums'}}>{Math.round(val * k)}%</div>
        </div>
      );
    })}
  </div>
);
// Thin line person (head + shoulders), as in the style.
const Person: React.FC<{x: number; y: number; s?: number; c?: string; o?: number}> = ({x, y, s = 1, c = T1, o = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={c} strokeWidth={3 / s} opacity={o}>
    <circle cx={0} cy={0} r={34} />
    <path d="M-58 130 C -58 60, 58 60, 58 130" />
  </g>
);

const Center: React.FC<{b: Beat; t: number; i: number}> = ({b, t}) => {
  const p = b.p ?? {};
  switch (b.kind) {
    case 'hook':
      return (
        <>
          <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
            <g fill="none" stroke={T1} strokeWidth={3}>
              <path d="M420 230 C 330 230 300 300 305 380 C 310 470 360 520 420 525 C 480 520 530 470 535 380 C 540 300 510 230 420 230 Z" />
              <ellipse cx={385} cy={360} rx={18} ry={9} /><ellipse cx={455} cy={360} rx={18} ry={9} />
              <path d={t > 3.2 ? 'M385 455 q35 26 70 0' : 'M390 460 q30 -10 60 0'} />
            </g>
            <text x={420} y={590} fill={T3} fontSize={30} textAnchor="middle" fontFamily="Noto Serif SC">Coworker</text>
          </svg>
          <Bubble t={t} at={-0.6} text="Can you do me a favor?" x={700} y={250} dim={t > 1.8} />
          <Stamp t={t} at={0.8} ok={false} text="No" x={1300} y={262} />
          <Bubble t={t} at={1.8} text="Can you do me a favor? Because I'm in a rush." x={700} y={400} />
          <Stamp t={t} at={2.9} ok text="Yes" x={780} y={520} />
        </>
      );
    case 'big': {
      const k = inOut((t - 0.3) / 1.4);
      return (
        <div style={{position: 'absolute', top: 280, left: 0, right: 0, textAlign: 'center'}}>
          <span style={{fontSize: 130, color: T3}}>60%</span>
          <span style={{fontSize: 90, color: T2, margin: '0 40px'}}>→</span>
          <span style={{fontSize: 210, fontWeight: 900, color: Y, textShadow: '0 0 40px rgba(255,210,63,0.35)'}}>{Math.round(60 + 33 * k)}%</span>
        </div>
      );
    }
    case 'title':
      return (
        <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center'}}>
          <In t={t} style={{fontSize: 40, color: T3, letterSpacing: 18}}>{p.e as string}</In>
          <In t={t} at={0.2} style={{fontSize: 140, fontWeight: 900, color: T1, letterSpacing: 16, marginTop: 20}}>{p.t as string}</In>
          <In t={t} at={0.5} style={{display: 'inline-block', marginTop: 24, background: Y, color: '#16141a', fontSize: 70, fontWeight: 900, padding: '4px 34px', borderRadius: 14}}>{p.s as string}</In>
        </div>
      );
    case 'year': {
      const y = (p.y as number) ?? 1978;
      const k = outCubic(t / 1.2);
      return (
        <>
          <div style={{position: 'absolute', top: 200, left: 300, fontSize: 240, fontWeight: 900, color: Y, fontVariantNumeric: 'tabular-nums', letterSpacing: 6}}>{Math.round(y - 30 * (1 - k))}</div>
          <In t={t} at={0.6} style={{position: 'absolute', top: 470, left: 310, fontSize: 48, color: T2, letterSpacing: 6}}>{(p.s as string) ?? 'Harvard · The copy machine study'}</In>
          <In t={t} at={0.9} style={{position: 'absolute', top: 200, left: 1180, width: 420, height: 330, border: `2px solid ${T3}`, borderRadius: 8, background: 'rgba(13,20,48,0.7)', padding: 30, transform: 'rotate(3deg)'}}>
            <div style={{fontSize: 26, color: T2, lineHeight: 1.5}}>{y === 1978 ? 'The Mindlessness of Ostensibly Thoughtful Action' : 'Compliance Without Pressure: The Foot-in-the-Door Technique'}</div>
            {[0, 1, 2, 3, 4].map((k2) => (
              <div key={k2} style={{height: 10, width: `${90 - k2 * 9}%`, background: 'rgba(201,212,255,0.18)', borderRadius: 5, marginTop: 18}} />
            ))}
            <div style={{position: 'absolute', bottom: 16, right: 20, fontSize: 22, color: T3}}>Illustration</div>
          </In>
        </>
      );
    }
    case 'queue': {
      const cut = inOut((t - 1.5) / 1.2);
      return (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <g fill="none" stroke={T1} strokeWidth={3}>
            <rect x={1380} y={300} width={260} height={200} rx={12} /><rect x={1405} y={260} width={210} height={40} rx={8} /><line x1={1410} y1={380} x2={1610} y2={380} />
          </g>
          {[0, 1, 2, 3].map((k) => (
            <Person key={k} x={560 + k * 170} y={330} />
          ))}
          <Person x={1240 - (1 - cut) * 900} y={330 + Math.sin(cut * Math.PI) * -60} c={Y} />
          <text x={1510} y={550} fill={T3} fontSize={30} textAnchor="middle" fontFamily="Noto Serif SC">Copier</text>
        </svg>
      );
    }
    case 'three':
      return (
        <div style={{position: 'absolute', top: 210, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 40}}>
          {[
            ['A', 'No reason', 'May I use the copier?'],
            ['B', 'Real reason', "May I go first? Because I'm in a rush."],
            ['C', 'Empty reason', 'May I go first? Because I have to make copies.'],
          ].map(([k, lab, txt], i) => (
            <In key={k} t={t} at={0.3 + i * 0.9} style={{width: 480, height: 330, border: `2px solid ${i === 2 ? Y : T3}`, borderRadius: 18, background: 'rgba(13,20,48,0.8)', padding: 30}}>
              <div style={{fontSize: 70, fontWeight: 900, color: i === 2 ? Y : T2}}>{k}</div>
              <div style={{fontSize: 36, color: i === 2 ? Y : T2, marginTop: 6}}>{lab}</div>
              <div style={{fontSize: 36, color: T1, marginTop: 28, lineHeight: 1.45}}>{txt}</div>
            </In>
          ))}
        </div>
      );
    case 'bars':
      return <Bars t={t} v={p.v as number[]} l={p.l as string[]} hi={p.hi as number} head={p.head as string | undefined} />;
    case 'quote':
      return (
        <div style={{position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center'}}>
          <In t={t} style={{fontSize: 72, color: T1}}>"Because I have to make copies"</In>
          <In t={t} at={0.8} style={{display: 'inline-block', marginTop: 40, fontSize: 44, color: R, border: `3px solid ${R}`, borderRadius: 40, padding: '6px 34px', transform: `rotate(-4deg) scale(${outBack((t - 0.8) / 0.4)})`}}>
            ✕ Not a reason
          </In>
        </div>
      );
    case 'brain': {
      const spin = t * 60;
      const lit = clamp((t - 1.2) / 0.4);
      return (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <g transform="translate(700 380)">
            <circle r={150} fill="none" stroke={T3} strokeWidth={3} />
            <g transform={`rotate(${spin})`}>
              {Array.from({length: 12}).map((_, k) => (
                <rect key={k} x={-10} y={-170} width={20} height={30} fill={T3} transform={`rotate(${k * 30})`} />
              ))}
            </g>
            <text y={18} textAnchor="middle" fill={T1} fontSize={46} fontFamily="Noto Serif SC">Autopilot</text>
          </g>
          <g opacity={clamp(t / 0.4)}>
            <text x={1050} y={330} fill={Y} fontSize={72} fontFamily="Noto Serif SC" fontWeight={900}>"Because"</text>
            <path d={`M1040 360 L ${1040 - 160 * clamp((t - 0.5) / 0.6)} 380`} stroke={Y} strokeWidth={4} />
          </g>
          <g opacity={lit}>
            <rect x={1050} y={420} width={520} height={110} rx={55} fill="rgba(255,210,63,0.15)" stroke={Y} strokeWidth={3} />
            <text x={1310} y={490} textAnchor="middle" fill={Y} fontSize={46} fontFamily="Noto Serif SC">→ A reason? Yes.</text>
          </g>
        </svg>
      );
    }
    case 'twist':
      return (
        <div style={{position: 'absolute', top: 270, left: 0, right: 0, textAlign: 'center', fontSize: 190, fontWeight: 900, color: T1, letterSpacing: 20, transform: `scale(${1.3 - 0.3 * outBack(t / 0.5)})`, opacity: clamp(t / 0.3)}}>
          But…
        </div>
      );
    case 'rule':
    case 'rule2': {
      const lines = b.kind === 'rule' ? [['Small ask', 'any "because"'], ['Big ask', 'a real reason']] : [['', 'Not a trick.'], ['', "It's psychology."]];
      return (
        <div style={{position: 'absolute', top: 230, left: 520}}>
          {lines.map(([a, c], i) => (
            <In key={i} t={t} at={0.2 + i * 0.7} style={{fontSize: 84, fontWeight: 900, marginBottom: 30, color: T1}}>
              <span style={{color: T3, marginRight: 30}}>{a}</span>
              <span style={{background: i === lines.length - 1 ? Y : 'transparent', color: i === lines.length - 1 ? '#16141a' : T1, padding: '0 20px', borderRadius: 12}}>{c}</span>
            </In>
          ))}
        </div>
      );
    }
    case 'stairs': {
      const k = inOut((t - 2) / 1.2);
      return (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <path d="M420 600 L760 600 L760 500 L1100 500 L1100 300 L1520 300" fill="none" stroke={T1} strokeWidth={3} />
          <g opacity={clamp(t / 0.4)}>
            <rect x={520} y={470} width={160} height={70} rx={10} fill="none" stroke={T2} strokeWidth={3} />
            <text x={600} y={516} textAnchor="middle" fill={T2} fontSize={30} fontFamily="Noto Serif SC">Sign</text>
          </g>
          <g opacity={clamp((t - 2.6) / 0.4)}>
            <rect x={1150} y={150} width={340} height={110} rx={10} fill="rgba(255,210,63,0.12)" stroke={Y} strokeWidth={3} />
            <text x={1320} y={218} textAnchor="middle" fill={Y} fontSize={30} fontFamily="Noto Serif SC">Big sign on lawn</text>
          </g>
          <Person x={600 + k * 640} y={420 - k * 200 - 70} s={0.8} c={Y} />
          <text x={930} y={470} fill={T3} fontSize={28} fontFamily="Noto Serif SC" opacity={clamp((t - 1.4) / 0.4)}>2 weeks later</text>
        </svg>
      );
    }
    case 'bars2':
      return <Bars t={t} v={[17, 76]} l={['Asked first', 'Signed first']} hi={1} head="Agreed to the big sign" y={300} />;
    case 'echo':
      return (
        <>
          <Bubble t={t} at={0.2} who="C" text="An americano, light ice." x={420} y={260} />
          <Bubble t={t} at={1.6} who="W" text="Sure, an americano, light ice." x={820} y={420} />
          <In t={t} at={2.6} style={{position: 'absolute', left: 900, top: 540, fontSize: 34, color: T3}}>word for word</In>
        </>
      );
    case 'coins':
      return (
        <div style={{position: 'absolute', top: 200, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 260}}>
          {[0, 1].map((side) => (
            <div key={side} style={{textAlign: 'center', color: side ? Y : T2, fontSize: 38}}>
              <div style={{height: 300, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center'}}>
                {Array.from({length: side ? 9 : 3}).map((_, k) => (
                  <div key={k} style={{width: 170, height: 32, marginTop: -6, borderRadius: 16, border: `3px solid ${side ? Y : '#3a4370'}`, background: side ? 'rgba(255,210,63,0.22)' : 'rgba(58,67,112,0.35)', opacity: clamp((t - 0.3 - side * 0.4 - k * 0.12) / 0.2), transform: `translateY(${(1 - clamp((t - 0.3 - side * 0.4 - k * 0.12) / 0.25)) * -40}px)`}} />
                ))}
              </div>
              <div style={{marginTop: 20}}>{side ? 'Repeated it' : 'Just "sure"'}</div>
            </div>
          ))}
        </div>
      );
    case 'life':
      return (
        <div style={{position: 'absolute', top: 190, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 50}}>
          {[
            ['Work', 'Can you check this?', "Because it's due Friday."],
            ['Friends', 'Lend me a pen?', '…then: grab my package?'],
            ['Dating', '"Today was so long."', '"So long, huh?"'],
          ].map(([tag, a, c], i) => (
            <In key={tag} t={t} at={0.3 + i * 0.8} style={{width: 470, height: 360, border: `2px solid ${T3}`, borderRadius: 18, background: 'rgba(13,20,48,0.8)', padding: 30}}>
              <div style={{fontSize: 30, color: Y, border: `2px solid rgba(255,210,63,0.4)`, borderRadius: 20, display: 'inline-block', padding: '0 18px'}}>{tag}</div>
              <div style={{fontSize: 40, color: T1, marginTop: 30, lineHeight: 1.5}}>{a}</div>
              <div style={{fontSize: 40, color: Y, marginTop: 6, lineHeight: 1.5}}>{c}</div>
            </In>
          ))}
        </div>
      );
    case 'call': {
      const card = (label: string, n: number, red: boolean, at: number) => (
        <div style={{width: 420, height: 300, borderRadius: 24, border: `4px solid ${red ? R : Y}`, background: red ? 'rgba(255,90,110,0.12)' : 'rgba(255,210,63,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: red ? R : Y, transform: `scale(${outBack((t - at) / 0.5)})`, opacity: clamp((t - at) / 0.2), boxShadow: `0 0 50px ${red ? 'rgba(255,90,110,0.3)' : 'rgba(255,210,63,0.3)'}`}}>
          <div style={{fontSize: 92, fontWeight: 900}}>{label}</div>
          <div style={{fontSize: 44}}>Comment {n}</div>
        </div>
      );
      return (
        <>
          <In t={t} style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', fontSize: 36, color: Y, letterSpacing: 20}}>YOUR CALL</In>
          <div style={{position: 'absolute', top: 230, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 60}}>
            {card('Smart', 1, false, 0.3)}
            <span style={{fontSize: 44, color: T3, fontStyle: 'italic'}}>vs</span>
            {card('Sneaky', 2, true, 0.6)}
          </div>
        </>
      );
    }
    case 'cite':
      return (
        <div style={{position: 'absolute', top: 170, left: 360, right: 360}}>
          <In t={t} style={{fontSize: 34, color: Y, letterSpacing: 10, marginBottom: 30}}>REFERENCES</In>
          {[
            'Langer, E. J., Blank, A., & Chanowitz, B. (1978). The mindlessness of ostensibly thoughtful action. Journal of Personality and Social Psychology, 36(6), 635–642.',
            'Freedman, J. L., & Fraser, S. C. (1966). Compliance without pressure: The foot-in-the-door technique. Journal of Personality and Social Psychology, 4(2), 195–202.',
            'van Baaren, R. B., Holland, R. W., Steenaert, B., & van Knippenberg, A. (2003). Mimicry for money. Journal of Experimental Social Psychology, 39(4), 393–398.',
          ].map((r, i) => (
            <In key={i} t={t} at={0.4 + i * 0.5} style={{fontSize: 27, color: T2, lineHeight: 1.5, marginBottom: 22, fontStyle: 'italic'}}>{r}</In>
          ))}
        </div>
      );
    default:
      return null;
  }
};

export const VibeEN: React.FC = () => {
  useSerif();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  let i = BEATS.findIndex((_, k) => t < STARTS[k] + BEATS[k].dur);
  if (i < 0) i = BEATS.length - 1;
  const b = BEATS[i];
  const u = t - STARTS[i];
  const fadeIn = i === 0 ? 1 : clamp(u / 0.35);
  const fadeOut = 1 - clamp((u - (b.dur - 0.3)) / 0.3);
  const chapter = chapterAt(i);
  const total = STARTS[BEATS.length - 1] + BEATS[BEATS.length - 1].dur;
  const endFade = clamp((t - (total - 1)) / 0.9);
  return (
    <AbsoluteFill style={{background: BG, fontFamily: SERIF, color: T1, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(1100px 700px at ${50 + Math.sin(t * 0.21) * 7}% ${40 + Math.cos(t * 0.17) * 5}%, rgba(80,140,255,0.2), transparent 70%)`}} />
      {Array.from({length: 40}).map((_, k) => {
        const r = (Math.sin(k * 91.3) + 1) / 2;
        const y = H - (((t * (12 + r * 18) + k * 61) % (H + 60)) - 30);
        return <div key={k} style={{position: 'absolute', left: (k * 347) % W, top: y, width: 3 + r * 4, height: 3 + r * 4, borderRadius: 4, background: 'rgba(160,190,255,0.28)'}} />;
      })}
      {/* zone 1: signature */}
      <div style={{position: 'absolute', top: 36, left: 48, fontSize: 28, color: T3, letterSpacing: 4}}>
        Brain<span style={{background: Y, color: '#16141a', padding: '0 8px', borderRadius: 6, marginLeft: 8}}>Manual</span>
      </div>
      {/* zone 2: chapter tag with progress */}
      {chapter && chapter !== '序' ? (
        <div style={{position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20}}>
          <div style={{display: 'flex', gap: 8}}>
            {[0, 1, 2, 3, 4].map((k) => (
              <div key={k} style={{width: 46, height: 5, borderRadius: 3, background: k < parseInt(chapter) ? Y : '#2a3358'}} />
            ))}
          </div>
          <div style={{fontSize: 30, color: T2, letterSpacing: 4}}>{chapter}</div>
        </div>
      ) : null}
      {/* zone 3: the animation, with a slow push-in */}
      <AbsoluteFill style={{opacity: fadeIn * fadeOut, transform: `scale(${1 + clamp(u / b.dur) * 0.03})`}}>
        <Center b={b} t={u} i={i} />
      </AbsoluteFill>
      {/* zone 5: bilingual subtitles at 85-91% */}
      <div style={{position: 'absolute', top: 905, left: 120, right: 120, textAlign: 'center', opacity: (i === 0 ? 1 : clamp(u / 0.25)) * fadeOut}}>
        <div style={{fontSize: 58, color: T1, textShadow: '0 2px 12px rgba(0,0,0,0.6)'}}>{b.zh}</div>
        {b.en ? <div style={{fontSize: 32, color: T2, fontStyle: 'italic', marginTop: 8}}>{b.en}</div> : null}
      </div>
      <AbsoluteFill style={{background: '#000', opacity: endFade}} />
      {/* sound: a soft ding on each new line, a whoosh into each chapter, clicks on stamps */}
      {BEATS.map((bb, k) => (
        <At key={`s${k}`} t={STARTS[k] + 0.02} f={bb.chapter && k > 0 ? 'whoosh.wav' : 'ding.wav'} v={bb.chapter && k > 0 ? 0.35 : 0.18} />
      ))}
      <At t={0.8} f="click.wav" v={0.35} len={0.3} />
      <At t={2.9} f="pop.wav" v={0.35} len={0.5} />
      <At t={STARTS[9]} f="boom.wav" v={0.4} len={1} />
      <At t={STARTS[19] + 0.3} f="chime.wav" v={0.35} len={2.6} />
    </AbsoluteFill>
  );
};
