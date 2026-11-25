import React from 'react';
import {AbsoluteFill} from 'remotion';
import {F} from '../fonts';
import {ease, prog, tween, W, H} from '../util';
import {Media} from './Media';

type P = {now: number; from: number; to: number; props: any};

const BLUE = '#0578FA';
const YEL = '#E3B92E';

const StatusBar: React.FC<{dark?: boolean}> = ({dark}) => (
  <div style={{position: 'absolute', top: 0, left: 0, width: W, height: 120, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 70px 0', boxSizing: 'border-box', fontFamily: F.ui, fontWeight: 600, fontSize: 40, color: dark ? '#fff' : '#000'}}>
    <span>9:41</span>
    <div style={{width: 250, height: 70, borderRadius: 40, background: '#000', position: 'absolute', left: W / 2 - 125, top: 24}} />
    <span style={{letterSpacing: 4}}>▮▮▮ ◔ ▭</span>
  </div>
);

/** Messages thread. props: {name, avatar? (emoji), bubbles: [{me: bool, text, at}]} */
export const Messages: React.FC<P> = ({now, props}) => {
  const bubbles: any[] = props.bubbles ?? [];
  let y = 430;
  return (
    <AbsoluteFill style={{background: '#FFFFFF'}}>
      <StatusBar />
      <div style={{position: 'absolute', top: 120, width: W, height: 230, borderBottom: '1px solid #E5E5EA', background: '#F9F9F9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{width: 120, height: 120, borderRadius: 60, background: 'linear-gradient(#A5ABB8,#858C99)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.emoji, fontSize: 70}}>{props.avatar ?? '🙂'}</div>
        <div style={{fontFamily: F.ui, fontSize: 30, marginTop: 10, color: '#000'}}>{props.name ?? 'Tom'} ›</div>
        <span style={{position: 'absolute', left: 40, top: 70, color: BLUE, fontSize: 70, fontFamily: F.ui}}>‹</span>
      </div>
      {bubbles.map((b, i) => {
        const typing = now >= b.at - 0.35 && now < b.at;
        const p = prog(now, b.at, 6, ease.back);
        const lines = Math.ceil(String(b.text).length / 22);
        const h = 44 + lines * 66;
        const top = y;
        y += h + 26;
        if (now < b.at - 0.35) return null;
        return (
          <div key={i} style={{position: 'absolute', top, [b.me ? 'right' : 'left']: 40, maxWidth: W * 0.7, transformOrigin: b.me ? 'right bottom' : 'left bottom', transform: `scale(${typing ? 0.9 : 0.6 + 0.4 * p})`}}>
            <div style={{padding: '22px 34px', borderRadius: 44, background: b.me ? BLUE : '#E9E9EB', color: b.me ? '#fff' : '#000', fontFamily: F.ui, fontSize: 54, lineHeight: 1.2}}>
              {typing ? '• • •' : b.text}
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', bottom: 70, left: 40, right: 40, height: 96, borderRadius: 48, border: '2px solid #D1D1D6', display: 'flex', alignItems: 'center', paddingLeft: 40, fontFamily: F.ui, fontSize: 38, color: '#B0B0B5'}}>iMessage</div>
    </AbsoluteFill>
  );
};

/** Calendar day view. props: {month:'June', day:'Sunday 1 June', events:[{title, hour(0-23 float), dur(h), color:'yellow'|'blue', at}], tapAt?} */
export const Calendar: React.FC<P> = ({now, from, props}) => {
  const hourH = 120;
  const top0 = 560;
  const tapAt = props.tapAt;
  const tp = tapAt !== undefined ? tween(now, tapAt - 0.3, tapAt + 0.2, 0, 1) : 0;
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <StatusBar />
      <div style={{position: 'absolute', top: 150, left: 50, color: '#FF3B30', fontFamily: F.ui, fontSize: 46}}>‹ {props.month ?? 'June'}</div>
      <div style={{position: 'absolute', top: 260, left: 40, right: 40, display: 'flex', justifyContent: 'space-between'}}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} style={{width: 120, textAlign: 'center', fontFamily: F.ui}}>
            <div style={{fontSize: 26, color: '#8E8E93'}}>{d}</div>
            <div style={{margin: '10px auto 0', width: 84, height: 84, borderRadius: 42, background: i === 0 ? '#FF3B30' : 'transparent', color: i === 0 ? '#fff' : '#000', fontSize: 40, lineHeight: '84px', fontWeight: 600}}>{i + 1}</div>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', top: 440, width: W, textAlign: 'center', fontFamily: F.ui, fontSize: 34, color: '#000'}}>{props.day ?? 'Sunday 1 June'}</div>
      {Array.from({length: 11}).map((_, h) => (
        <div key={h} style={{position: 'absolute', top: top0 + h * hourH, left: 40, right: 30, borderTop: '1px solid #E5E5EA', fontFamily: F.ui, fontSize: 24, color: '#8E8E93'}}>
          <span style={{position: 'relative', top: -16, background: '#fff', paddingRight: 10}}>{h === 0 ? '12 AM' : `${h} AM`}</span>
        </div>
      ))}
      {(props.events ?? []).map((e: any, i: number) => {
        const p = prog(now, e.at ?? from, 6);
        const yellow = e.color !== 'blue';
        return (
          <div key={i} style={{position: 'absolute', left: 150, right: 40, top: top0 + (e.hour ?? 0) * hourH, height: (e.dur ?? 1) * hourH - 6, background: yellow ? '#F7E58A' : '#CFE7F7', borderLeft: `8px solid ${yellow ? YEL : '#4AA3DF'}`, borderRadius: 8, opacity: p, padding: '14px 20px', boxSizing: 'border-box', fontFamily: F.ui, fontWeight: 600, fontSize: 42, color: '#3A3000'}}>
            {e.title}
          </div>
        );
      })}
      {tapAt !== undefined && tp > 0 && tp < 1 ? (
        <div style={{position: 'absolute', left: W * 0.5 - 50, top: top0 + 1.5 * hourH - 50, width: 100, height: 100, borderRadius: 50, border: '12px solid #33C1E8', background: '#fff', transform: `scale(${0.6 + 0.6 * tp})`, opacity: 1 - tp * 0.6, boxShadow: '0 0 20px rgba(51,193,232,.6)'}} />
      ) : null}
    </AbsoluteFill>
  );
};

/** Clock widget on grey radial. props: {start:'10:10', spinHours: 6} — hands sweep over the section. */
export const Clock: React.FC<P> = ({now, from, to, props}) => {
  const [hh, mm] = String(props.start ?? '10:10').split(':').map(Number);
  const k = tween(now, from + 0.15, to - 0.1, 0, 1, ease.inOut);
  const mins = hh * 60 + mm + k * (props.spinHours ?? 6) * 60;
  const p = prog(now, from, 8, ease.back);
  const R = 200;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #DADFEE 0%, #A5AAB4 55%, #7F838D 100%)'}}>
      <div style={{position: 'absolute', left: W / 2 - 280, top: H * 0.45 - 230, width: 560, height: 460, borderRadius: 48, background: 'rgba(255,255,255,.28)', boxShadow: '0 30px 60px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.6)', backdropFilter: 'blur(10px)', transform: `perspective(1200px) rotateX(${(1 - p) * 30}deg) scale(${0.7 + 0.3 * p})`, opacity: Math.min(1, p * 1.4)}}>
        <svg width={560} height={460}>
          <circle cx={280} cy={230} r={R} fill="#fff" />
          {Array.from({length: 12}).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={280 + Math.sin(a) * (R - 14)} y1={230 - Math.cos(a) * (R - 14)} x2={280 + Math.sin(a) * (R - 34)} y2={230 - Math.cos(a) * (R - 34)} stroke="#222" strokeWidth={6} strokeLinecap="round" />;
          })}
          <line x1={280} y1={230} x2={280 + Math.sin(((mins / 60) % 12) / 12 * Math.PI * 2) * 110} y2={230 - Math.cos(((mins / 60) % 12) / 12 * Math.PI * 2) * 110} stroke="#111" strokeWidth={12} strokeLinecap="round" />
          <line x1={280} y1={230} x2={280 + Math.sin((mins % 60) / 60 * Math.PI * 2) * 160} y2={230 - Math.cos((mins % 60) / 60 * Math.PI * 2) * 160} stroke="#111" strokeWidth={8} strokeLinecap="round" />
          <line x1={280} y1={230} x2={280 + Math.sin(now * 6) * 175} y2={230 - Math.cos(now * 6) * 175} stroke="#FF3B30" strokeWidth={4} />
          <circle cx={280} cy={230} r={10} fill="#FF3B30" />
        </svg>
      </div>
      {props.label ? (
        <div
          style={{
            position: 'absolute',
            top: H * 0.45 + 290,
            width: W,
            textAlign: 'center',
            fontFamily: F.ui,
            fontWeight: 600,
            fontSize: 64,
            color: '#1C1C1E',
            opacity: prog(now, props.labelAt ?? from + 0.5, 8),
            filter: `blur(${8 * (1 - prog(now, props.labelAt ?? from + 0.5, 8))}px)`,
            transform: `translateY(${30 * (1 - prog(now, props.labelAt ?? from + 0.5, 8))}px)`,
          }}
        >
          {props.label}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Reminders / sticky cards on a frosted panel. props: {title:'June 1st', cards:[{text, at, color?}]} */
export const Reminders: React.FC<P> = ({now, from, props}) => {
  const cards: any[] = props.cards ?? [];
  const pinCols = ['#C83544', '#2C46BF', '#5DD238', '#E3B92E'];
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg,#B3C0E8 0%,#C4CBE1 60%,#BCC5E5 100%)'}}>
      <div style={{position: 'absolute', left: 60, top: H * 0.33, width: W - 120, height: 600, borderRadius: 40, background: 'rgba(255,255,255,.35)', boxShadow: '0 20px 50px rgba(60,70,120,.2), inset 0 1px 0 rgba(255,255,255,.7)', opacity: prog(now, from, 6)}}>
        <div style={{position: 'absolute', left: 50, top: 40, fontFamily: F.ui, fontWeight: 700, fontSize: 58, color: '#1C1C1E'}}>{props.title ?? 'June 1st'}</div>
      </div>
      {cards.map((c, i) => {
        const at = c.at ?? from + 0.2 + i * 0.25;
        const p = prog(now, at, 8, ease.back);
        const cw = 300;
        const gap = 26;
        const x = (W - (cards.length * cw + (cards.length - 1) * gap)) / 2 + i * (cw + gap);
        const rot = [-8, 4, -3, 7][i % 4];
        return (
          <div key={i} style={{position: 'absolute', left: x, top: H * 0.33 + 160, width: cw, height: 330, background: '#FAFAFB', borderRadius: 22, boxShadow: '0 12px 28px rgba(40,50,90,.25)', transform: `translateY(${(1 - p) * 500}px) rotate(${rot * p}deg)`, opacity: now < at ? 0 : 1, padding: 30, boxSizing: 'border-box', fontFamily: F.ui, fontWeight: 600, fontSize: 44, lineHeight: 1.15, color: '#1C1C1E'}}>
            <div style={{width: 22, height: 22, borderRadius: 11, background: c.color ?? pinCols[i % 4], position: 'absolute', top: -8, left: -8}} />
            {c.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Photos viewer + neon script words. props: {img|src, startFrom?, lines:[{text, at, script?}]} */
export const Photos: React.FC<P> = ({now, from, props}) => {
  const p = prog(now, from, 8, ease.quint);
  return (
    <AbsoluteFill style={{background: '#E8E8EB'}}>
      <div style={{position: 'absolute', top: 70, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', color: BLUE, fontFamily: F.ui, fontSize: 56}}>
        <span>‹</span>
        <span>✕</span>
      </div>
      <div style={{position: 'absolute', left: W * 0.07, top: H * 0.12, width: W * 0.86, height: H * 0.5, borderRadius: 36, overflow: 'hidden', transform: `scale(${0.8 + 0.2 * p})`, opacity: p}}>
        <AbsoluteFill style={{transform: `scale(${1.05 + 0.03 * (now - from)})`}}>
          <Media src={props.img ?? props.src} startFrom={props.startFrom ?? 0} />
        </AbsoluteFill>
        {/* darkening behind the words so white/neon text reads on bright photos */}
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(10,8,6,.62) 72%, rgba(10,8,6,.75) 100%)'}} />
        <div style={{position: 'absolute', left: 40, top: '52%', display: 'flex', flexDirection: 'column'}}>
          {(props.lines ?? []).map((l: any, i: number) => {
            const lp = prog(now, l.at ?? from + 0.3 + i * 0.4, 8);
            return (
              <span
                key={i}
                style={{
                  opacity: lp,
                  filter: `blur(${8 * (1 - lp)}px)`,
                  ...(l.script
                    ? {fontFamily: F.script, fontSize: 140, color: '#F2E21D', textShadow: '0 0 18px rgba(242,226,29,.8), 0 0 40px rgba(242,226,29,.4)', lineHeight: 0.9}
                    : {fontFamily: F.ui, fontSize: 90, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,.4)', lineHeight: 1})
                }}
              >
                {l.text}
              </span>
            );
          })}
        </div>
      </div>
      <div style={{position: 'absolute', top: H * 0.67, left: W * 0.08, width: W * 0.84, display: 'flex', gap: 8}}>
        {Array.from({length: 16}).map((_, i) => (
          <div key={i} style={{flex: 1, height: 64, borderRadius: 6, background: '#111'}} />
        ))}
      </div>
      <div style={{position: 'absolute', bottom: 90, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', color: BLUE, fontFamily: F.ui, fontSize: 50}}>
        <span>⇪</span>
        <span>♡ ⓘ</span>
        <span>🗑</span>
      </div>
    </AbsoluteFill>
  );
};

/** Black beat for IOS_TYPE captions. */
export const Black: React.FC<P> = () => <AbsoluteFill style={{background: '#090909'}} />;

/** Notes-app chrome drawn OVER the face (face props.chrome = 'notes'): yellow UI, scanlines, darken 25%. */
export const NotesChrome: React.FC = () => (
  <AbsoluteFill>
    <AbsoluteFill style={{background: 'rgba(0,0,0,.25)'}} />
    <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.08) 0 1px, rgba(0,0,0,0) 1px 3px)'}} />
    <div style={{position: 'absolute', top: 90, left: 50, right: 50, display: 'flex', justifyContent: 'space-between', fontFamily: F.ui, fontSize: 44, color: YEL}}>
      <span>‹ All iCloud</span>
      <span style={{width: 60, height: 60, borderRadius: 30, border: `4px solid ${YEL}`, textAlign: 'center', lineHeight: '46px', fontSize: 36}}>⋯</span>
    </div>
    <div style={{position: 'absolute', bottom: 70, left: 90, right: 90, display: 'flex', justifyContent: 'space-between', fontFamily: F.ui, fontSize: 56, color: YEL, opacity: 0.9}}>
      <span>☰</span>
      <span>◉</span>
      <span>Ⓐ</span>
      <span>✎</span>
    </div>
  </AbsoluteFill>
);
