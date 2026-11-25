import React from 'react';
import {Img, OffthreadVideo, staticFile} from 'remotion';

const isVideo = (src: string) => /\.(mp4|mov|webm|mkv)$/i.test(src);

/** Image or muted video from public/. startFrom in seconds (video only). */
export const Media: React.FC<{src: string; startFrom?: number; style?: React.CSSProperties; fit?: 'cover' | 'contain'}> = ({src, startFrom = 0, style, fit = 'cover'}) => {
  const s: React.CSSProperties = {width: '100%', height: '100%', objectFit: fit, ...style};
  if (isVideo(src)) return <OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(startFrom * 30)} style={s} />;
  return <Img src={staticFile(src)} style={s} />;
};

/** Character-by-character reveal (~20 chars/s) used by LUX titles. */
export const CharReveal: React.FC<{text: string; now: number; at: number; cps?: number; style?: React.CSSProperties}> = ({text, now, at, cps = 20, style}) => {
  const n = Math.max(0, Math.min(text.length, Math.floor((now - at) * cps) + 1));
  if (now < at) return <span style={{...style, opacity: 0}}>{text}</span>;
  return (
    <span style={{whiteSpace: 'pre', ...style}}>
      {text.slice(0, n)}
      <span style={{opacity: 0}}>{text.slice(n)}</span>
    </span>
  );
};
