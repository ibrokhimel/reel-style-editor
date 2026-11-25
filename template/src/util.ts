import {Easing, interpolate} from 'remotion';
export const FPS = 30;
export const W = 1080;
export const H = 1920;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = {
  out: Easing.out(Easing.cubic),
  outQuad: Easing.out(Easing.quad),
  in: Easing.in(Easing.cubic),
  inQuart: Easing.in(Easing.poly(4)),
  inOut: Easing.inOut(Easing.cubic),
  sine: Easing.inOut(Easing.sin),
  back: Easing.out(Easing.back(1.6)),
  quint: Easing.out(Easing.poly(5)),
};
/** map time `now` (s) in [a,b] (s) to [v0,v1] */
export const tween = (now: number, a: number, b: number, v0: number, v1: number, e = ease.out) =>
  b <= a ? (now >= b ? v1 : v0) : interpolate(now, [a, b], [v0, v1], {...clamp, easing: e});
export const f2s = (f: number) => f / FPS;
/** progress 0..1 of an animation starting at `start` lasting `frames` */
export const prog = (now: number, start: number, frames: number, e = ease.out) => tween(now, start, start + frames / FPS, 0, 1, e);
