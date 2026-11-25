import React from 'react';
import {AbsoluteFill} from 'remotion';
import {F} from '../fonts';
import {Paper, LuxGradeOverlay, luxFilter} from '../fx/Fx';
import {ease, prog, tween, W, H} from '../util';
import {CharReveal, Media} from './Media';

// Scene props are documented in references/scenes.md. `at` values arrive as ABSOLUTE output seconds (compile_edit.py resolves them).
type P = {now: number; from: number; to: number; props: any};

const echo = (dy = 14): React.CSSProperties => ({textShadow: `0 ${dy}px 18px rgba(40,36,32,.35), 0 3px 6px rgba(40,36,32,.25)`});

/** B-roll video/image full-frame, LUX grade, slow push +4%/2 s. props: {src, startFrom?} */
export const Broll: React.FC<P> = ({now, from, props}) => (
  <AbsoluteFill style={{background: '#0A0505', overflow: 'hidden'}}>
    <AbsoluteFill style={{transform: `scale(${1.02 + 0.02 * (now - from)})`, filter: luxFilter}}>
      <Media src={props.src} startFrom={props.startFrom ?? 0} />
    </AbsoluteFill>
    <LuxGradeOverlay />
  </AbsoluteFill>
);

/** Stat slide. props: {big: "90%", bigAt, sub: [{text, serif?, at}]} — number glyphs blur-in staggered 3 f, 8 f each. */
export const Stat: React.FC<P> = ({now, from, props}) => {
  const bigAt = props.bigAt ?? from + 0.15;
  const chars: string[] = Array.from(String(props.big ?? ''));
  return (
    <AbsoluteFill>
      <Paper now={now} />
      <div style={{position: 'absolute', top: H * 0.44, width: W, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center'}}>
        {chars.map((ch, i) => {
          const p = prog(now, bigAt + (i * 3) / 30, 8);
          return (
            <span
              key={i}
              style={{
                fontFamily: F.grotesk,
                fontWeight: 800,
                fontSize: 230,
                letterSpacing: '-0.06em',
                lineHeight: 1,
                background: 'linear-gradient(180deg,#302E2A 0%,#474543 55%,#8A8987 100%)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                opacity: p,
                filter: `blur(${12 * (1 - p)}px) drop-shadow(0 16px 14px rgba(40,36,32,.35))`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{position: 'absolute', top: H * 0.54, width: W, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', alignItems: 'baseline', columnGap: 14, color: '#3A3836', ...echo(8)}}>
        {(props.sub ?? []).map((s: any, i: number) => {
          const p = prog(now, s.at ?? bigAt + 0.4, 8);
          return (
            <span
              key={i}
              style={{
                opacity: p,
                filter: `blur(${10 * (1 - p)}px)`,
                ...(s.serif
                  ? {fontFamily: F.serif, fontStyle: 'italic', fontSize: 64, color: '#55524F'}
                  : {fontFamily: F.grotesk, fontWeight: 800, fontSize: 50, letterSpacing: '-0.04em'}),
              }}
            >
              {s.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Red-sun cutout. props: {img (transparent PNG cutout), lines: [{text, size:'s'|'l', serif?, at}]} */
export const RedSun: React.FC<P> = ({now, from, props}) => {
  const fp = prog(now, from, 5, ease.outQuad);
  return (
    <AbsoluteFill>
      <Paper now={now} />
      <div style={{position: 'absolute', width: 1026, height: 1026, left: (W - 1026) / 2, top: H * 0.58 - 513, borderRadius: '50%', background: '#BF0203'}} />
      <div style={{position: 'absolute', width: 270, height: 270, left: W - 150, top: 260, borderRadius: '50%', background: '#BF0203'}} />
      <div style={{position: 'absolute', width: 160, height: 160, left: -70, top: H * 0.86, borderRadius: '50%', background: '#BF0203'}} />
      {props.img ? (
        <div style={{position: 'absolute', left: 0, bottom: 0, width: W, height: H * 0.62, filter: `blur(${10 * (1 - fp)}px)`}}>
          <Media src={props.img} fit="contain" style={{objectPosition: 'bottom center'}} />
        </div>
      ) : null}
      <div style={{position: 'absolute', top: H * 0.17, width: W, display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 0.92, color: '#2E2B29', ...echo()}}>
        {(props.lines ?? []).map((l: any, i: number) => (
          <CharReveal
            key={i}
            text={l.text}
            now={now}
            at={l.at ?? from + 0.1 + i * 0.4}
            style={
              l.serif
                ? {fontFamily: F.serif, fontStyle: 'italic', fontSize: l.size === 's' ? 48 : 120, alignSelf: 'center', marginLeft: 180}
                : {fontFamily: F.grotesk, fontWeight: l.size === 's' ? 700 : 800, fontSize: l.size === 's' ? 38 : 128, letterSpacing: l.size === 's' ? '-0.02em' : '-0.045em'}
            }
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Framed 16:9 clip on paper. props: {src, startFrom?, title, titleAt?, caption?, captionAt?} */
export const Framed: React.FC<P> = ({now, from, props}) => {
  const p = prog(now, from, 8);
  return (
    <AbsoluteFill>
      <Paper now={now} />
      <div style={{position: 'absolute', top: H * 0.3, width: W, textAlign: 'center', fontFamily: F.grotesk, fontWeight: 800, fontSize: 76, letterSpacing: '-0.04em', color: '#2E2B29', ...echo(10)}}>
        <CharReveal text={props.title ?? ''} now={now} at={props.titleAt ?? from + 0.1} />
      </div>
      <div style={{position: 'absolute', left: W * 0.05, top: H * 0.36, width: W * 0.9, height: W * 0.9 * 0.5625, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,.35)', filter: `blur(${20 * (1 - p)}px)`, transform: `scale(${0.97 + 0.03 * p})`}}>
        <Media src={props.src} startFrom={props.startFrom ?? 0} />
      </div>
      {props.caption ? (
        <div style={{position: 'absolute', top: H * 0.36 + W * 0.9 * 0.5625 + 26, width: W, textAlign: 'center', fontFamily: F.grotesk, fontWeight: 600, fontSize: 32, color: '#4A4848', opacity: prog(now, props.captionAt ?? from + 0.6, 8)}}>
          {props.caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Sepia collage. props: {img, headline, headlineAt?, script?, scriptAt?, note?} */
export const Collage: React.FC<P> = ({now, from, props}) => {
  const p = prog(now, from, 6);
  return (
    <AbsoluteFill>
      <Paper now={now} />
      <div style={{position: 'absolute', left: W * 0.1, top: H * 0.12, width: W * 0.8, height: H * 0.73, borderRadius: 26, background: '#C3B9A4', overflow: 'hidden', boxShadow: '0 16px 36px rgba(60,48,30,.25)'}}>
        <div style={{position: 'absolute', left: W * 0.06, bottom: H * 0.05, width: W * 0.5, height: W * 0.5, background: '#1F2A44'}} />
        {props.img ? (
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', filter: `sepia(0.65) contrast(1.05) blur(${8 * (1 - p)}px)`}}>
            <Media src={props.img} fit="contain" style={{objectPosition: 'bottom right'}} />
          </div>
        ) : null}
        <div style={{position: 'absolute', top: '16%', width: '100%', textAlign: 'center', fontFamily: F.grotesk, fontWeight: 900, fontSize: 104, letterSpacing: '-0.05em', color: '#2F2517', ...echo(8)}}>
          <CharReveal text={props.headline ?? ''} now={now} at={props.headlineAt ?? from + 0.1} />
        </div>
        {props.script ? (
          <div style={{position: 'absolute', top: '22%', width: '100%', textAlign: 'center', paddingLeft: 140, fontFamily: F.serif, fontStyle: 'italic', fontSize: 120, color: 'rgba(255,255,255,.9)', opacity: tween(now, props.scriptAt ?? from + 0.4, (props.scriptAt ?? from + 0.4) + 0.3, 0, 1)}}>
            {props.script}
          </div>
        ) : null}
        {props.note ? (
          <div style={{position: 'absolute', top: '30%', right: '8%', width: '40%', fontFamily: F.grotesk, fontWeight: 600, fontSize: 18, lineHeight: 1.3, color: '#2F2517', opacity: 0.8}}>{props.note}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
