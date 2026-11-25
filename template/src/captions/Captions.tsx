import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Caption, Word} from '../types';
import {F} from '../fonts';
import {ease, prog, tween, W, H} from '../util';

// Measured values live in references/STYLE_GUIDE.md §4. Sizes are px on 1080x1920.
const LEAD = 2 / 30; // captions start animating 2 frames before the word onset

/** Blur-in word: blur b->0, opacity 0->1, y dy->0 over `frames`. ghost = opacity shown before onset. */
const RevealWord: React.FC<{
  w: Word;
  now: number;
  frames?: number;
  blur?: number;
  dy?: number;
  ghost?: number;
  style?: React.CSSProperties;
}> = ({w, now, frames = 6, blur = 10, dy = 6, ghost = 0, style}) => {
  const p = prog(now, w.t - LEAD, frames);
  const before = now < w.t - LEAD;
  const op = before ? ghost : p;
  const bl = before ? (ghost ? 3 : blur) : blur * (1 - p);
  return (
    <span
      style={{
        display: 'inline-block',
        opacity: op,
        filter: bl > 0.05 ? `blur(${bl}px)` : undefined,
        transform: `translateY(${before ? 0 : dy * (1 - p)}px)`,
        whiteSpace: 'pre',
        ...style,
      }}
    >
      {w.w}
      {w.x ? <span style={{fontFamily: F.emoji, marginLeft: '0.25em'}}>{w.x}</span> : null}
    </span>
  );
};

const Line: React.FC<{
  y: number;
  children: React.ReactNode;
  gap?: string;
  align?: 'center' | 'flex-start';
  left?: number;
  width?: number;
  style?: React.CSSProperties;
}> = ({y, children, gap = '0.2em', align = 'center', left, width = 0.8, style}) => (
  <div
    style={{
      position: 'absolute',
      top: y * H,
      left: left !== undefined ? left * W : (W * (1 - width)) / 2,
      width: W * width,
      transform: 'translateY(-50%)',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: align,
      alignItems: 'baseline',
      columnGap: gap,
      ...style,
    }}
  >
    {children}
  </div>
);

const serifStyle = (size: number): React.CSSProperties => ({
  fontFamily: F.serif,
  fontStyle: 'italic',
  fontWeight: 400,
  fontSize: size,
  letterSpacing: '-0.01em',
});

// ---------- LUX ----------
const LuxKaraoke: React.FC<{c: Caption; now: number}> = ({c, now}) => (
  <Line
    y={c.y ?? 0.56}
    gap="0.18em"
    style={{
      fontFamily: F.grotesk,
      fontWeight: 800,
      fontSize: 56,
      letterSpacing: '-0.03em',
      color: '#F5F7FB',
      textShadow: '0 4px 14px rgba(0,0,0,.5), 0 0 3px rgba(0,0,0,.35)',
      lineHeight: 1.05,
    }}
  >
    {(c.words ?? []).map((w, i) => (
      <RevealWord key={i} w={w} now={now} style={w.s ? serifStyle(72) : undefined} />
    ))}
  </Line>
);

const LuxTwoTier: React.FC<{c: Caption; now: number}> = ({c, now}) => {
  const y = c.y ?? 0.55;
  const big = c.big ?? [];
  const bigSize = big.some((w) => w.s) ? 128 : 92;
  return (
    <div
      style={{
        position: 'absolute',
        top: y * H,
        left: W * 0.1,
        width: W * 0.8,
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textShadow: '0 4px 14px rgba(0,0,0,.5), 0 0 3px rgba(0,0,0,.35)',
      }}
    >
      <div style={{display: 'flex', gap: 8, fontFamily: F.grotesk, fontWeight: 700, fontSize: 38, letterSpacing: '-0.02em', color: '#F4F1EF', lineHeight: 1}}>
        {(c.small ?? []).map((w, i) => (
          <RevealWord key={i} w={w} now={now} blur={6} dy={4} />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'baseline',
          columnGap: 20,
          fontFamily: F.grotesk,
          fontWeight: 800,
          fontSize: 92,
          letterSpacing: '-0.045em',
          color: '#F7F5F2',
          lineHeight: 0.95,
          marginTop: 4,
        }}
      >
        {big.map((w, i) => (
          <RevealWord key={i} w={w} now={now} frames={4} ghost={0.25} blur={8} dy={0} style={w.s ? serifStyle(bigSize) : undefined} />
        ))}
      </div>
    </div>
  );
};

const LuxBrollWord: React.FC<{c: Caption; now: number}> = ({c, now}) => {
  const ws = c.words ?? [];
  let cur: Word | undefined;
  for (const w of ws) if (now >= w.t - LEAD) cur = w;
  if (!cur) return null;
  return (
    <Line y={c.y ?? 0.5} style={{fontFamily: F.grotesk, fontWeight: 600, fontSize: 42, color: '#F0ECEC', textShadow: '0 2px 12px rgba(0,0,0,.5)', textTransform: 'lowercase'}}>
      <span>{cur.w.replace(/[.,!?;:]+$/, '')}</span>
    </Line>
  );
};

// ---------- iOS ----------
const IosPill: React.FC<{c: Caption; now: number}> = ({c, now}) => {
  const p = prog(now, c.from - LEAD, 6, ease.quint);
  return (
    <div
      style={{
        position: 'absolute',
        top: (c.y ?? 0.74) * H,
        left: W * 0.06,
        maxWidth: W * 0.88,
        transform: 'translateY(-50%)',
        clipPath: `inset(0 ${100 - p * 100}% 0 0 round 16px)`,
        filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined,
      }}
    >
      <div
        style={{
          borderRadius: 16,
          padding: '30px 44px',
          background: 'linear-gradient(180deg,#3B57D9 0%,#2C46BF 55%,#2338A6 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.2), 0 10px 30px rgba(20,30,90,.35)',
          display: 'flex',
          flexWrap: 'wrap',
          columnGap: '0.24em',
          fontFamily: F.ui,
          fontWeight: 500,
          fontSize: 50,
          color: '#E5F0FD',
          lineHeight: 1.15,
        }}
      >
        {(c.words ?? []).map((w, i) => (
          <RevealWord key={i} w={w} now={now} frames={3} blur={6} dy={0} />
        ))}
      </div>
    </div>
  );
};

/** chunk_swap_drift: in from +48px blurred, out to -48px blurred, 6 frames each */
const chunkSwap = (c: Caption, now: number): React.CSSProperties => {
  const pin = prog(now, c.from - LEAD, 6, ease.sine);
  const pout = tween(now, c.to - 6 / 30, c.to, 0, 1, ease.sine);
  const b = 8 * (1 - pin) + 8 * pout;
  return {opacity: pin * (1 - pout), filter: b > 0.05 ? `blur(${b}px)` : undefined, transform: `translateY(calc(-50% + ${48 * (1 - pin) - 48 * pout}px))`};
};

const IosNotes: React.FC<{c: Caption; now: number}> = ({c, now}) => (
  <Line
    y={c.y ?? 0.69}
    width={0.86}
    gap="0.24em"
    style={{
      fontFamily: F.ui,
      fontWeight: 400,
      fontSize: 84,
      color: '#E8C92F',
      textShadow: '0 0 18px rgba(232,201,47,.7), 0 0 40px rgba(232,201,47,.35), 0 2px 4px rgba(0,0,0,.6)',
      lineHeight: 1.1,
      padding: '36px 40px',
      boxSizing: 'border-box',
      borderRadius: 60,
      // dark plate keeps the glow readable over busy UI / screen recordings
      background: 'radial-gradient(ellipse 70% 75% at 50% 50%, rgba(10,6,4,.78) 0%, rgba(10,6,4,.55) 55%, rgba(10,6,4,0) 100%)',
      ...chunkSwap(c, now),
    }}
  >
    {(c.words ?? []).map((w, i) => {
      const pe = prog(now, w.t, 4, ease.back);
      return (
        <span key={i} style={{whiteSpace: 'pre'}}>
          {w.w}
          {w.x ? (
            <span style={{fontFamily: F.emoji, fontSize: 64, marginLeft: '0.2em', display: 'inline-block', opacity: pe, transform: `scale(${pe})`}}>{w.x}</span>
          ) : null}
        </span>
      );
    })}
  </Line>
);

const IosPlain: React.FC<{c: Caption; now: number}> = ({c, now}) => (
  <Line
    y={c.y ?? 0.635}
    width={0.84}
    gap="0.22em"
    style={{fontFamily: F.ui, fontWeight: 500, fontSize: 80, color: '#F2EEEE', textShadow: '0 3px 16px rgba(0,0,0,.45)', lineHeight: 1.1}}
  >
    {(c.words ?? []).map((w, i) => (
      <RevealWord key={i} w={w} now={now} blur={8} dy={0} />
    ))}
  </Line>
);

const COL: Record<string, string> = {pos: '#5DD238', neg: '#C83544', accent: '#E8C92F'};
const Diamond: React.FC<{size: number; p: number}> = ({size, p}) => (
  <svg width={size} height={size} viewBox="0 0 44 44" style={{transform: `scale(${p})`, flex: 'none', filter: 'drop-shadow(0 0 6px rgba(255,255,255,.5))'}}>
    <rect x="10" y="10" width="24" height="24" transform="rotate(45 22 22)" fill="none" stroke="#fff" strokeWidth="3" />
  </svg>
);

const IosChecklist: React.FC<{c: Caption; now: number}> = ({c, now}) => {
  const y0 = c.y ?? 0.71;
  return (
    <>
      {(c.rows ?? []).map((row, r) => {
        if (!row.length || now < row[0].t - 0.2) return null;
        const pi = prog(now, row[0].t - 0.2, 4, ease.back);
        return (
          <div
            key={r}
            style={{position: 'absolute', top: (y0 + r * 0.08) * H, left: W * 0.07, width: W * 0.86, transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 28}}
          >
            <Diamond size={56} p={pi} />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                columnGap: '0.22em',
                fontFamily: F.ui,
                fontWeight: 400,
                fontSize: 70,
                color: '#F5E8EF',
                lineHeight: 1.1,
                textShadow: '0 2px 12px rgba(0,0,0,.4)',
              }}
            >
              {row.map((w, i) => (
                <span key={i} style={{opacity: tween(now, w.t - LEAD, w.t + 0.1, 0.3, 1), color: w.c ? COL[w.c] : undefined, whiteSpace: 'pre'}}>
                  {w.w}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

const IosType: React.FC<{c: Caption; now: number}> = ({c, now}) => {
  const ws = c.words ?? [];
  const last = ws[ws.length - 1];
  const dots = last && now > last.e + 0.05 ? Math.min(3, 1 + Math.floor((now - last.e) / 0.12)) : 0;
  return (
    <Line y={c.y ?? 0.48} align="flex-start" left={0.21} width={0.7} gap="0.25em" style={{fontFamily: F.ui, fontWeight: 400, fontSize: 52, color: '#DDDDDD'}}>
      {ws.map((w, i) => (
        <RevealWord key={i} w={w} now={now} frames={4} blur={6} dy={0} />
      ))}
      <span>{'.'.repeat(dots)}</span>
    </Line>
  );
};

// ---------- KINETIC ----------
const PLUM = '#43294A';
export const plumGrad = 'linear-gradient(135deg,#35183E 0%,#431D50 55%,#5D256D 100%)';

const KineticHero: React.FC<{c: Caption; now: number}> = ({c, now}) => {
  const small = c.small ?? [];
  const big = c.big ?? [];
  const pill = c.pill ?? [];
  const bigT = big.length ? big[0].t : c.to;
  // label_shrink (8 f): lead words sit large until the hero word lands, then shrink into a label above it
  const shrink = big.length ? prog(now, bigT - 4 / 30, 8, ease.inOut) : 0;
  const leadScale = 1.8 - 0.8 * shrink;
  const chars = big.reduce((n, w) => n + w.w.length, 0);
  const heroSize = chars > 12 ? 120 : chars > 9 ? 150 : 190;
  const pillP = c.bigInPill ? prog(now, bigT - 4 / 30, 10, ease.back) : 1;
  const heroStyle: React.CSSProperties = {
    fontFamily: F.grotesk,
    fontStyle: 'italic',
    fontWeight: 900,
    fontSize: c.bigInPill ? heroSize * 0.62 : heroSize,
    letterSpacing: '-0.05em',
    color: c.bigInPill ? '#FFFFFF' : PLUM,
    lineHeight: 0.95,
    textShadow: c.bigInPill ? 'none' : '0 10px 24px rgba(42,26,48,.3)',
  };
  return (
    <div style={{position: 'absolute', top: (c.y ?? 0.47) * H, left: 0, width: W, transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div
        style={{
          display: 'flex',
          gap: '0.22em',
          fontFamily: F.grotesk,
          fontStyle: 'italic',
          fontWeight: 800,
          fontSize: 42,
          letterSpacing: '-0.03em',
          color: '#8A7391',
          transform: `translateY(${(1 - shrink) * (big.length ? 70 : 0)}px) scale(${big.length ? leadScale : 1.8})`,
          marginBottom: 8,
        }}
      >
        {small.map((w, i) => (
          <RevealWord key={i} w={w} now={now} blur={8} dy={0} />
        ))}
      </div>
      {big.length ? (
        <div
          style={{
            padding: c.bigInPill ? '0.1em 0.5em 0.18em 0.4em' : 0,
            borderRadius: 999,
            background: c.bigInPill ? plumGrad : 'none',
            boxShadow: c.bigInPill ? '0 18px 36px rgba(0,0,0,.22)' : 'none',
            transform: c.bigInPill ? `scaleX(${Math.max(0.02, pillP)}) scaleY(${Math.min(1, 0.3 + pillP)})` : undefined,
            opacity: now < bigT - 4 / 30 ? 0 : 1,
            display: 'flex',
            columnGap: Math.round((c.bigInPill ? heroSize * 0.62 : heroSize) * 0.2),
          }}
        >
          {big.map((w, i) => (
            <RevealWord key={i} w={w} now={now} frames={8} blur={14} dy={0} style={heroStyle} />
          ))}
        </div>
      ) : null}
      {pill.length ? (
        <div
          style={{
            marginTop: -6,
            marginLeft: 280,
            padding: '6px 24px 10px',
            borderRadius: 999,
            background: plumGrad,
            boxShadow: '0 12px 24px rgba(0,0,0,.25)',
            transform: `scale(${prog(now, pill[0].t - LEAD, 8, ease.back)})`,
            fontFamily: F.grotesk,
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: 46,
            color: '#fff',
          }}
        >
          {pill.map((w) => w.w).join(' ')}
        </div>
      ) : null}
    </div>
  );
};

// ---------- CLEAN (default) ----------
/** Plain bold white words, soft shadow, no boxes/glow/colour. Each word fades + rises 8 px over 4 frames as it is
 * spoken; unspoken words are invisible but keep their layout slot so the line never jumps. */
const Clean: React.FC<{c: Caption; now: number}> = ({c, now}) => (
  <Line
    y={c.y ?? 0.66}
    width={0.84}
    gap="0.24em"
    style={{
      fontFamily: F.grotesk,
      fontWeight: 800,
      fontSize: 68,
      letterSpacing: '-0.02em',
      lineHeight: 1.12,
      color: '#FFFFFF',
      textShadow: '0 0 2px rgba(0,0,0,.55), 0 2px 4px rgba(0,0,0,.45), 0 6px 26px rgba(0,0,0,.6), 0 0 60px rgba(0,0,0,.35)',
    }}
  >
    {(c.words ?? []).map((w, i) => {
      const p = prog(now, w.t - LEAD, 4, ease.outQuad);
      return (
        <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: p, transform: `translateY(${8 * (1 - p)}px)`}}>
          {w.w}
        </span>
      );
    })}
  </Line>
);

export const Captions: React.FC<{caps: Caption[]; now: number}> = ({caps, now}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {caps.map((c, i) => {
      if (now < c.from || now >= c.to) return null;
      switch (c.preset) {
        case 'LUX_KARAOKE':
          return <LuxKaraoke key={i} c={c} now={now} />;
        case 'LUX_TWOTIER':
          return <LuxTwoTier key={i} c={c} now={now} />;
        case 'LUX_BROLL_WORD':
          return <LuxBrollWord key={i} c={c} now={now} />;
        case 'IOS_PILL':
          return <IosPill key={i} c={c} now={now} />;
        case 'IOS_NOTES':
          return <IosNotes key={i} c={c} now={now} />;
        case 'IOS_PLAIN':
          return <IosPlain key={i} c={c} now={now} />;
        case 'IOS_CHECKLIST':
          return <IosChecklist key={i} c={c} now={now} />;
        case 'IOS_TYPE':
          return <IosType key={i} c={c} now={now} />;
        case 'KINETIC_HERO':
          return <KineticHero key={i} c={c} now={now} />;
        case 'CLEAN':
          return <Clean key={i} c={c} now={now} />;
        default:
          return null;
      }
    })}
  </AbsoluteFill>
);
