import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Edit, Section} from './types';
import {Captions} from './captions/Captions';
import {IrisOverlay, IosGradeOverlay, iosFilter, LuxGradeOverlay, luxFilter, sectionStyle} from './fx/Fx';
import {Broll, Collage, Framed, RedSun, Stat} from './scenes/Lux';
import {Black, Clock, NotesChrome} from './scenes/Ios';
import {Calendar, Messages, Photos, Reminders, Timer} from './scenes/IosReal';
import {ease, prog} from './util';
import {Cutout, EmojiPill, Hero, NameCard, Poster} from './scenes/Kinetic';
import {Media} from './scenes/Media';
import {F} from './fonts';
import {FPS} from './util';

type SP = {now: number; from: number; to: number; props: any};
// Each section stays mounted this many frames past its end, underneath the next section, so animated
// entries (slide, whip, pop, blur, defocus) reveal the previous scene instead of the black root.
const OVERLAP = 8;
const SCENES: Record<string, React.FC<SP>> = {
  broll: Broll,
  stat: Stat,
  redsun: RedSun,
  framed: Framed,
  collage: Collage,
  messages: Messages,
  calendar: Calendar,
  clock: Clock,
  timer: Timer,
  reminders: Reminders,
  photos: Photos,
  black: Black,
  hero: Hero,
  poster: Poster,
  namecard: NameCard,
  cutout: Cutout,
  emoji: EmojiPill,
  image: ({now, from, props}) => (
    <AbsoluteFill style={{transform: `scale(${1 + 0.03 * (now - from)})`, background: '#000'}}>
      <Media src={props.src} />
    </AbsoluteFill>
  ),
};

/** Talking-head section. The a-roll is already silence-cut to the output timeline, so startFrom = section start.
 * props: {zoom (1.0 wide / 1.15-1.25 punch-in), push (+scale over the section), x/y focus (0-1), chrome?: 'notes'} */
const Face: React.FC<{edit: Edit; s: Section; now: number}> = ({edit, s, now}) => {
  const pr = s.props ?? {};
  // glide: ease from the previous face section's framing (z0/x0/y0, filled in by compile) over 12 frames
  const g = pr.z0 !== undefined ? prog(now, s.from, 12, ease.inOut) : 1;
  const z = pr.z0 !== undefined ? pr.z0 + ((pr.zoom ?? 1) - pr.z0) * g : pr.zoom ?? 1;
  const fx = pr.x0 !== undefined ? pr.x0 + ((pr.x ?? 0.5) - pr.x0) * g : pr.x ?? 0.5;
  const fy = pr.y0 !== undefined ? pr.y0 + ((pr.y ?? 0.35) - pr.y0) * g : pr.y ?? 0.35;
  const zoom = z + (pr.push ?? 0.04) * ((now - s.from) / Math.max(0.5, s.to - s.from));
  const filt = edit.style === 'lux' ? luxFilter : edit.style === 'ios' ? iosFilter : undefined;
  if (!edit.aroll) return <AbsoluteFill style={{background: '#111'}} />;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${fx * 100}% ${fy * 100}%`, filter: filt}}>
        <OffthreadVideo src={staticFile(edit.aroll)} muted startFrom={Math.round(s.from * FPS)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      {edit.style === 'lux' ? <LuxGradeOverlay /> : null}
      {edit.style === 'ios' ? <IosGradeOverlay /> : null}
      {pr.chrome === 'notes' ? <NotesChrome /> : null}
    </AbsoluteFill>
  );
};

export const Reel: React.FC<{edit: Edit}> = ({edit}) => {
  const frame = useCurrentFrame();
  const now = frame / FPS;
  // invert_flash: first 2 frames of a section flagged invertFlash
  const flash = edit.sections.some((s) => s.invertFlash && now >= s.from && now < s.from + 2 / FPS);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{filter: flash ? 'invert(1) hue-rotate(180deg)' : undefined}}>
        {edit.sections.map((s) => {
          const from = Math.round(s.from * FPS);
          const total = Math.round(edit.duration * FPS);
          const dur = Math.min(total - from, Math.max(1, Math.round(s.to * FPS) - from) + OVERLAP);
          const Scene = SCENES[s.kind];
          return (
            <Sequence key={s.id} from={from} durationInFrames={dur} layout="none">
              <AbsoluteFill style={sectionStyle(s, now)}>
                {s.kind === 'face' || !Scene ? (
                  <Face edit={edit} s={s} now={now} />
                ) : (
                  <AbsoluteFill style={{transform: `scale(${s.props?.uiZoom ?? 1})`, transformOrigin: `50% ${(s.props?.uiY ?? 0) * 100}%`}}>
                    <Scene now={now} from={s.from} to={s.to} props={s.props ?? {}} />
                  </AbsoluteFill>
                )}
              </AbsoluteFill>
              <IrisOverlay s={s} now={now} />
            </Sequence>
          );
        })}
        <Captions caps={edit.captions} now={now} />
        {edit.watermark ? (
          <div style={{position: 'absolute', bottom: 1920 * 0.07, width: 1080, textAlign: 'center', fontFamily: F.grotesk, fontWeight: 700, fontSize: 22, color: 'rgba(255,255,255,.6)', mixBlendMode: 'difference'}}>{edit.watermark}</div>
        ) : null}
      </AbsoluteFill>
      {edit.audio ? <Audio src={staticFile(edit.audio)} /> : null}
    </AbsoluteFill>
  );
};
