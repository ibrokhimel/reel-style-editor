import React from 'react';
import {AbsoluteFill} from 'remotion';
import {F} from '../fonts';
import {DotGrid} from '../fx/Fx';
import {plumGrad} from '../captions/Captions';
import {ease, prog, W, H} from '../util';
import {Media} from './Media';

type P = {now: number; from: number; to: number; props: any};
const PLUM_TEXT = '#3B2343';
const bw = 'grayscale(1) contrast(1.12)';

/** Plain dot-grid backdrop for KINETIC_HERO captions. */
export const Hero: React.FC<P> = ({now}) => <DotGrid now={now} />;

/** Silhouette poster card. props: {img, silhouette?: true, small, big, at?} — subject breaks 15% out of the card top. */
export const Poster: React.FC<P> = ({now, from, props}) => {
  const p = prog(now, from, 6, ease.back);
  const cw = 594;
  const ch = 864;
  const left = (W - cw) / 2;
  const top = H * 0.45 - ch / 2;
  const tp = prog(now, props.at ?? from + 0.3, 8);
  return (
    <AbsoluteFill>
      <DotGrid now={now} />
      <div style={{position: 'absolute', left, top, width: cw, height: ch, transform: `scale(${0.4 + 0.6 * p})`, filter: `blur(${20 * (1 - Math.min(1, p))}px)`}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 36, background: plumGrad, boxShadow: '0 30px 60px rgba(0,0,0,.25)'}} />
        <div style={{position: 'absolute', inset: 0, borderRadius: 36, background: 'linear-gradient(115deg, rgba(255,255,255,0) 40%, rgba(255,255,255,.10) 48%, rgba(255,255,255,0) 56%)'}} />
        {props.img ? (
          <div style={{position: 'absolute', left: -40, right: -40, bottom: 0, height: ch * 1.15, filter: props.silhouette === false ? bw : 'brightness(0) opacity(.92)'}}>
            <Media src={props.img} fit="contain" style={{objectPosition: 'bottom center'}} />
          </div>
        ) : null}
        <div style={{position: 'absolute', left: 50, bottom: 70, opacity: tp, filter: `blur(${10 * (1 - tp)}px)`, color: '#fff'}}>
          <div style={{fontFamily: F.grotesk, fontWeight: 600, fontSize: 34, marginLeft: 70}}>{props.small}</div>
          <div style={{fontFamily: F.grotesk, fontStyle: 'italic', fontWeight: 900, fontSize: 150, letterSpacing: '-0.06em', lineHeight: 0.9}}>{props.big}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Name card + growing timeline list. props: {img, first, last, tag?, items:[{text, at}]} */
export const NameCard: React.FC<P> = ({now, from, props}) => {
  const p = prog(now, from, 6, ease.back);
  const cw = 842;
  const ch = 538;
  const left = (W - cw) / 2;
  const top = H * 0.21;
  const items: any[] = props.items ?? [];
  const pitch = 66;
  const shown = items.filter((it) => now >= it.at - 0.13).length;
  const lineLen = shown ? 40 + (shown - 1) * pitch + 20 : 0;
  return (
    <AbsoluteFill>
      <DotGrid now={now} />
      <div style={{position: 'absolute', left, top, width: cw, height: ch, transform: `scale(${0.4 + 0.6 * p})`, filter: `blur(${20 * (1 - Math.min(1, p))}px)`}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 34, background: plumGrad, boxShadow: '0 30px 60px rgba(0,0,0,.25)', overflow: 'hidden'}}>
          <div style={{position: 'absolute', top: 40, width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 36px', boxSizing: 'border-box', fontFamily: F.grotesk, fontStyle: 'italic', fontWeight: 900, fontSize: 140, letterSpacing: '-0.06em', color: '#fff'}}>
            <span>{props.first}</span>
            <span>{props.last}</span>
          </div>
          {props.img ? (
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: ch * 0.95, filter: bw}}>
              <Media src={props.img} fit="contain" style={{objectPosition: 'bottom center'}} />
            </div>
          ) : null}
          {props.tag ? <div style={{position: 'absolute', right: 40, top: 205, fontFamily: F.grotesk, fontWeight: 600, fontSize: 26, color: '#fff'}}>{props.tag}</div> : null}
        </div>
      </div>
      <div style={{position: 'absolute', left: left + 60, top: top + ch, width: 3, height: lineLen, background: '#5D3A66', transition: 'none'}} />
      {items.map((it, i) => {
        const ip = prog(now, it.at - 0.13, 6);
        if (now < it.at - 0.13) return null;
        return (
          <div key={i} style={{position: 'absolute', left: left + 50, top: top + ch + 40 + i * pitch - 12, display: 'flex', alignItems: 'center', gap: 22, opacity: ip, transform: `translateX(${(1 - ip) * -20}px)`}}>
            <div style={{width: 24, height: 24, borderRadius: 12, background: '#43294A'}} />
            <span style={{fontFamily: F.grotesk, fontWeight: 600, fontSize: 36, color: PLUM_TEXT, filter: `blur(${6 * (1 - ip)}px)`}}>{it.text}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** B/W cutout, bottom-anchored, 70% H, focus pull. Pair with a KINETIC_HERO caption at y≈0.17. props: {img} */
export const Cutout: React.FC<P> = ({now, from, props}) => {
  const p = prog(now, from, 6, ease.outQuad);
  return (
    <AbsoluteFill>
      <DotGrid now={now} />
      <div style={{position: 'absolute', left: 0, bottom: 0, width: W, height: H * 0.72, filter: `${bw} blur(${12 * (1 - p)}px)`, transform: `scale(${1.15 - 0.15 * p})`, transformOrigin: 'bottom center'}}>
        <Media src={props.img} fit="contain" style={{objectPosition: 'bottom center'}} />
      </div>
    </AbsoluteFill>
  );
};

/** Emoji standing on a plum pill. Pair with KINETIC_HERO at y≈0.66. props: {emoji:'🧑‍💻'} */
export const EmojiPill: React.FC<P> = ({now, from, props}) => {
  const pp = prog(now, from, 10, ease.back);
  const ep = prog(now, from + 0.15, 8, ease.back);
  const y = H * 0.44;
  return (
    <AbsoluteFill>
      <DotGrid now={now} />
      <div style={{position: 'absolute', left: (W - 640) / 2, top: y, width: 640, height: 150, borderRadius: 40, background: plumGrad, boxShadow: '0 20px 40px rgba(0,0,0,.25)', transform: `scaleX(${Math.max(0.02, pp)}) scaleY(${Math.min(1, 0.3 + pp)})`}} />
      <div style={{position: 'absolute', left: 0, width: W, top: y - 230, textAlign: 'center', fontFamily: F.emoji, fontSize: 300, lineHeight: 1, transform: `translateY(${(1 - ep) * 80}px) scale(${ep})`, opacity: Math.min(1, ep * 2)}}>{props.emoji ?? '🧑‍💻'}</div>
    </AbsoluteFill>
  );
};
