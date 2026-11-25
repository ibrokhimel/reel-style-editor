import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Section} from '../types';
import {ease, prog, tween, W, H} from '../util';

// ---------- backgrounds ----------

/** Fine film grain via SVG turbulence (static seed per frame bucket so it shimmers slightly). */
export const Grain: React.FC<{opacity?: number; seed?: number}> = ({opacity = 0.05, seed = 1}) => (
  <AbsoluteFill style={{opacity, mixBlendMode: 'multiply'}}>
    <svg width={W} height={H}>
      <filter id={`g${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={W} height={H} filter={`url(#g${seed})`} />
    </svg>
  </AbsoluteFill>
);

/** LUX paper: #E9E6E3 base, centre lift, window-blind gobo shadow at -35°, period ≈ 9% W, multiply @ ~16%. */
export const Paper: React.FC<{now: number; gobo?: 'blinds' | 'none'}> = ({now, gobo = 'blinds'}) => (
  <AbsoluteFill style={{background: '#E9E6E3', overflow: 'hidden'}}>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 42% 38%, #F7F5F4 0%, #EFEDEB 45%, #E3E0DD 100%)'}} />
    {gobo === 'blinds' ? (
      <div
        style={{
          position: 'absolute',
          left: -W,
          top: -H * 0.5,
          width: W * 3,
          height: H * 2,
          transform: `rotate(-35deg) translateX(${now * 6}px)`,
          background: 'repeating-linear-gradient(90deg, rgba(70,66,62,1) 0 44px, rgba(0,0,0,0) 44px 97px)',
          opacity: 0.16,
          filter: 'blur(16px)',
          mixBlendMode: 'multiply',
        }}
      />
    ) : null}
    <Grain opacity={0.06} seed={3} />
  </AbsoluteFill>
);

/** KINETIC: #EDEDED + 24 px dot grid with radial fade + drifting dashed arcs (~40 px/s). */
export const DotGrid: React.FC<{now: number}> = ({now}) => {
  const off = -now * 40;
  return (
    <AbsoluteFill style={{background: '#EDEDED', overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(circle, #CDCDCD 1.5px, rgba(0,0,0,0) 1.8px)',
          backgroundSize: '24px 24px',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 60% at 50% 50%, #000 30%, rgba(0,0,0,.4) 100%)',
          maskImage: 'radial-gradient(ellipse 75% 60% at 50% 50%, #000 30%, rgba(0,0,0,.4) 100%)',
        }}
      />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, transform: `translate(${Math.sin(now * 0.4) * 20}px, ${Math.cos(now * 0.3) * 14}px)`}}>
        {[
          `M -60 ${H * 0.18} Q ${W * 0.35} ${H * 0.02} ${W + 80} ${-40}`,
          `M -80 ${H * 0.86} Q ${W * 0.3} ${H * 0.72} ${W * 0.62} ${H * 0.98}`,
          `M ${W * 0.55} ${H * 0.6} Q ${W * 0.85} ${H * 0.5} ${W + 60} ${H * 0.62}`,
        ].map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#9A9A9A" strokeWidth={3} strokeDasharray="14 10" strokeDashoffset={off * (i % 2 ? -1 : 1)} strokeLinecap="round" opacity={0.75} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// ---------- grades ----------

/** LUX talking head: low-key warm, crushed blacks, 25% vignette. Apply as CSS filter + overlays. */
export const luxFilter = 'brightness(0.92) contrast(1.15) saturate(0.95) sepia(0.12)';
export const LuxGradeOverlay: React.FC = () => (
  <>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)'}} />
    <AbsoluteFill style={{background: 'rgba(255,140,60,.05)', mixBlendMode: 'soft-light'}} />
  </>
);

/** iOS face: bottom gradient from y .55 to 1.0 (#1A1012 @ 85%) with magenta tint near y .7. */
export const iosFilter = 'contrast(1.08) saturate(1.05)';
export const IosGradeOverlay: React.FC = () => (
  <>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(157,90,95,.20) 70%, rgba(26,16,18,.85) 100%)'}} />
  </>
);

// ---------- transitions (applied by SectionWrap) ----------

/** Enter animation for the first frames of a section; exit for the last. Returns style for the section layer. */
export const sectionStyle = (s: Section, now: number): React.CSSProperties => {
  const t = now - s.from;
  const left = s.to - now;
  let filter = '';
  let transform = '';
  let opacity = 1;
  switch (s.enter ?? 'cut') {
    case 'blur': {
      const p = prog(t, 0, 6);
      filter += `blur(${14 * (1 - p)}px) `;
      break;
    }
    case 'defocus': {
      const p = prog(t, 0, 8, ease.sine);
      filter += `blur(${28 * (1 - p)}px) `;
      break;
    }
    case 'whip': {
      const p = prog(t, 0, 6, ease.back);
      transform += `scale(${0.4 + 0.6 * p}) `;
      filter += `blur(${20 * (1 - Math.min(1, p))}px) `;
      break;
    }
    case 'slide': {
      const p = prog(t, 0, 7, ease.quint);
      transform += `translateX(${(1 - p) * W}px) `;
      filter += `blur(${10 * (1 - p)}px) `;
      break;
    }
    case 'app': {
      // iOS app launch: screen grows from 86% with large corner radius to full frame (10 f, quint out)
      const p = prog(t, 0, 10, ease.quint);
      transform += `scale(${0.86 + 0.14 * p}) `;
      opacity = Math.min(1, p * 3);
      break;
    }
    case 'pop': {
      const p = prog(t, 0, 6, ease.back);
      transform += `scale(${0.85 + 0.15 * p}) `;
      opacity = Math.min(1, p * 1.5);
      break;
    }
    default:
      break;
  }
  switch (s.exit ?? 'none') {
    case 'whip': {
      const p = ease.inQuart(Math.min(1, Math.max(0, 1 - left / (5 / 30))));
      transform += `perspective(1200px) rotateY(${20 * p}deg) scale(${1 + 0.6 * p}) `;
      filter += `blur(${18 * p}px) `;
      break;
    }
    case 'blur': {
      const p = ease.sine(Math.min(1, Math.max(0, 1 - left / (6 / 30))));
      filter += `blur(${24 * p}px) `;
      break;
    }
    default:
      break;
  }
  const radius = s.enter === 'app' ? 120 * (1 - prog(t, 0, 10, ease.quint)) : 0;
  return {filter: filter || undefined, transform: transform || undefined, opacity, borderRadius: radius || undefined, overflow: radius ? 'hidden' : undefined};
};

/** Iris: black circle. Enter 'iris' = circle shrinks off the frame (6 f); exit 'iris' = circle grows to cover (8 f). */
export const IrisOverlay: React.FC<{s: Section; now: number}> = ({s, now}) => {
  const t = now - s.from;
  const left = s.to - now;
  let r = 0;
  if (s.enter === 'iris' && t < 6 / 30) r = 1 - prog(t, 0, 6, ease.out);
  if (s.exit === 'iris' && left < 8 / 30) r = Math.max(r, ease.in(Math.min(1, Math.max(0, 1 - left / (8 / 30)))));
  if (r <= 0.001) return null;
  const R = r * 1.25 * Math.hypot(W, H);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: W * 0.4 - R / 2, top: H * 0.55 - R / 2, width: R, height: R, borderRadius: '50%', background: '#090909', filter: 'blur(3px)'}} />
    </AbsoluteFill>
  );
};
