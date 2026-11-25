import React from 'react';
import {AbsoluteFill} from 'remotion';
import {F} from '../fonts';
import {ease, prog, tween, W, H} from '../util';
import {Media} from './Media';

// Dark-mode iOS 17 screens drawn at 2.75 px per point (393 pt wide phone -> 1080 px).
// Dark mode on purpose: white clean captions stay readable, and it matches dark screen recordings.
type P = {now: number; from: number; to: number; props: any};

const C = {
  bg: '#000000',
  bar: 'rgba(22,22,24,0.94)',
  sep: '#38383A',
  label: '#FFFFFF',
  label2: 'rgba(235,235,245,0.6)',
  label3: 'rgba(235,235,245,0.3)',
  fill: '#2C2C2E',
  fill2: '#3A3A3C',
  blue: '#0A84FF',
  red: '#FF453A',
  orange: '#FF9F0A',
  green: '#30D158',
  yellow: '#FFD60A',
  recv: '#26252A',
};
const pt = (v: number) => v * 2.75;
const sf: React.CSSProperties = {fontFamily: F.ui, fontFeatureSettings: '"tnum" 1, "cv11" 1', letterSpacing: '-0.01em'};

// ---------- shared chrome ----------
const Signal = () => (
  <svg width={52} height={34} viewBox="0 0 19 12">
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={i * 5} y={9 - i * 3} width={3.4} height={3 + i * 3} rx={1} fill="#fff" />
    ))}
  </svg>
);
const Wifi = () => (
  <svg width={46} height={34} viewBox="0 0 17 12">
    <path d="M8.5 11.5l2.3-2.6a3.3 3.3 0 0 0-4.6 0z" fill="#fff" />
    <path d="M3.9 6.8a6.6 6.6 0 0 1 9.2 0l-1.4 1.6a4.5 4.5 0 0 0-6.4 0z" fill="#fff" />
    <path d="M1.4 4a10.2 10.2 0 0 1 14.2 0l-1.4 1.6a8.1 8.1 0 0 0-11.4 0z" fill="#fff" />
  </svg>
);
const Battery = () => (
  <svg width={74} height={34} viewBox="0 0 27 12">
    <rect x={0.5} y={0.5} width={23} height={11} rx={3.2} fill="none" stroke="rgba(255,255,255,.4)" />
    <rect x={2} y={2} width={17} height={8} rx={1.8} fill="#fff" />
    <rect x={24.5} y={4} width={1.6} height={4} rx={0.8} fill="rgba(255,255,255,.4)" />
  </svg>
);
export const StatusBar: React.FC<{time?: string}> = ({time = '9:41'}) => (
  <div style={{position: 'absolute', top: 0, left: 0, width: W, height: pt(54), zIndex: 5}}>
    <div style={{position: 'absolute', left: pt(42), top: pt(17), ...sf, fontWeight: 600, fontSize: pt(17), color: '#fff'}}>{time}</div>
    <div style={{position: 'absolute', left: W / 2 - pt(63), top: pt(11), width: pt(126), height: pt(37), borderRadius: pt(19), background: '#000', boxShadow: '0 0 0 1px rgba(255,255,255,.04)'}} />
    <div style={{position: 'absolute', right: pt(28), top: pt(19), display: 'flex', gap: 14, alignItems: 'center'}}>
      <Signal />
      <Wifi />
      <Battery />
    </div>
  </div>
);
const Chevron: React.FC<{color?: string; size?: number}> = ({color = C.blue, size = 60}) => (
  <svg width={size * 0.6} height={size} viewBox="0 0 12 20">
    <path d="M10 2L2 10l8 8" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const HomeIndicator = () => <div style={{position: 'absolute', bottom: pt(8), left: W / 2 - pt(67), width: pt(134), height: pt(5), borderRadius: 10, background: 'rgba(255,255,255,.85)'}} />;

// ---------- Messages ----------
/** props: {name, avatar (emoji or initials), time:'Today 16:04', fontPt?: 17, bubbles:[{me, text, at}]} */
export const Messages: React.FC<P> = ({now, from, props}) => {
  const bubbles: any[] = props.bubbles ?? [];
  const top0 = pt(150);
  let y = top0 + 90;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <StatusBar />
      <div style={{position: 'absolute', top: 0, left: 0, width: W, height: pt(150), background: C.bar, borderBottom: `1px solid ${C.sep}`}}>
        <div style={{position: 'absolute', left: pt(14), top: pt(70)}}>
          <Chevron />
        </div>
        <div style={{position: 'absolute', left: W / 2 - pt(26), top: pt(58), width: pt(52), height: pt(52), borderRadius: '50%', background: 'linear-gradient(180deg,#A1A1A6,#6C6C70)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.emoji, fontSize: pt(30), color: '#fff'}}>
          {props.avatar ?? '🤖'}
        </div>
        <div style={{position: 'absolute', top: pt(116), width: W, textAlign: 'center', ...sf, fontSize: pt(12), color: C.label}}>
          {props.name ?? 'Contact'} <span style={{color: C.label2}}>›</span>
        </div>
      </div>
      <div style={{position: 'absolute', top: top0 + 26, width: W, textAlign: 'center', ...sf, fontSize: pt(11), color: C.label2}}>
        <b style={{fontWeight: 600}}>iMessage</b> · {props.time ?? 'Today 16:04'}
      </div>
      {bubbles.map((b, i) => {
        const at = b.at ?? from + 0.3 + i * 0.6;
        const typing = !b.me && now >= at - 0.45 && now < at;
        const p = prog(now, at, 7, ease.back);
        const fs = props.fontPt ?? 17; // bubble text size in points (iOS default 17; 21-22 reads better in a reel)
        const lines = Math.max(1, Math.ceil(String(b.text).length / ((24 * 17) / fs)));
        const h = pt(fs) * 1.28 * lines + pt(14);
        const nextSame = bubbles[i + 1] && !!bubbles[i + 1].me === !!b.me;
        const top = y;
        y += h + (nextSame ? pt(3) : pt(10));
        if (now < at - (b.me ? 0 : 0.45)) return null;
        const r = pt(18);
        const tail = !nextSame;
        return (
          <div key={i} style={{position: 'absolute', top, [b.me ? 'right' : 'left']: pt(14), maxWidth: W * 0.84, transformOrigin: b.me ? 'right bottom' : 'left bottom', transform: `scale(${typing ? 1 : 0.5 + 0.5 * p})`, opacity: typing ? 1 : Math.min(1, p * 2)}}>
            <div
              style={{
                padding: `${pt(7)}px ${pt(12)}px`,
                borderRadius: r,
                [b.me ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: tail ? pt(5) : r,
                background: b.me ? C.blue : C.recv,
                color: '#fff',
                ...sf,
                fontSize: pt(props.fontPt ?? 17),
                lineHeight: 1.28,
              }}
            >
              {typing ? (
                <span style={{letterSpacing: 10}}>
                  {[0, 1, 2].map((k) => (
                    <span key={k} style={{opacity: 0.35 + 0.65 * Math.max(0, Math.sin((now * 8) - k * 0.9))}}>●</span>
                  ))}
                </span>
              ) : (
                b.text
              )}
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', bottom: pt(34), left: pt(12), right: pt(12), height: pt(36), display: 'flex', alignItems: 'center', gap: pt(8)}}>
        <div style={{width: pt(32), height: pt(32), borderRadius: '50%', background: C.fill, color: C.label2, display: 'flex', alignItems: 'center', justifyContent: 'center', ...sf, fontSize: pt(24), fontWeight: 300}}>+</div>
        <div style={{flex: 1, height: pt(34), borderRadius: pt(17), border: `2px solid ${C.fill2}`, display: 'flex', alignItems: 'center', paddingLeft: pt(12), ...sf, fontSize: pt(16), color: '#636366'}}>iMessage</div>
      </div>
      <HomeIndicator />
    </AbsoluteFill>
  );
};

// ---------- Timer (Clock app) ----------
/** Running countdown. props: {seconds: 59 (start value), endTime: "16:05", drain?: 0.85, buttonsTop?: 545} — counts down fast across the section. */
export const Timer: React.FC<P> = ({now, from, to, props}) => {
  const total = props.seconds ?? 59;
  const k = tween(now, from, to, 0, 1, (t) => t);
  const left = Math.max(0, total * (1 - k * (props.drain ?? 0.85)));
  const mm = Math.floor(left / 60);
  const ss = Math.floor(left % 60);
  const R = pt(150);
  const cx = W / 2;
  const cy = pt(300);
  const circ = 2 * Math.PI * R;
  const frac = left / total;
  const tabs = props.tabs ?? ['World Clock', 'Alarm', 'Stopwatch', 'Timers'];
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <StatusBar />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.fill} strokeWidth={pt(8)} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.orange} strokeWidth={pt(8)} strokeLinecap="round" strokeDasharray={`${circ * frac} ${circ}`} transform={`rotate(-90 ${cx} ${cy})`} />
      </svg>
      <div style={{position: 'absolute', top: cy - pt(42), width: W, textAlign: 'center', ...sf, fontWeight: 200, fontSize: pt(72), color: '#fff', letterSpacing: '-0.02em'}}>
        {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
      </div>
      <div style={{position: 'absolute', top: cy + pt(48), width: W, textAlign: 'center', ...sf, fontSize: pt(17), color: C.label2}}>🔔 {props.endTime ?? '16:05'}</div>
      <div style={{position: 'absolute', top: pt(props.buttonsTop ?? 545), left: pt(16), right: pt(16), display: 'flex', justifyContent: 'space-between'}}>
        {[
          {t: props.cancel ?? 'Cancel', bg: '#333336', c: '#fff'},
          {t: props.pause ?? 'Pause', bg: '#3D2600', c: C.orange},
        ].map((b, i) => (
          <div key={i} style={{width: pt(84), height: pt(84), borderRadius: '50%', background: b.bg, boxShadow: `0 0 0 ${pt(2)}px #000, 0 0 0 ${pt(4)}px ${b.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...sf, fontSize: pt(15), color: b.c}}>
            {b.t}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', bottom: 0, left: 0, width: W, height: pt(83), background: 'rgba(22,22,24,.94)', borderTop: `1px solid ${C.sep}`, display: 'flex', justifyContent: 'space-around', paddingTop: pt(8), boxSizing: 'border-box'}}>
        {tabs.map((t: string, i: number) => (
          <div key={i} style={{textAlign: 'center', color: i === 3 ? C.orange : '#8E8E93', ...sf, fontSize: pt(10)}}>
            <div style={{fontSize: pt(22), lineHeight: 1.2}}>{['🌐', '⏰', '⏱', '⏲'][i]}</div>
            {t}
          </div>
        ))}
      </div>
      <HomeIndicator />
    </AbsoluteFill>
  );
};

// ---------- Reminders ----------
/** props: {back:'Lists', title:'Reading', color:'#0A84FF', items:[{text, note?, at, checkAt?}]} */
export const Reminders: React.FC<P> = ({now, from, props}) => {
  const color = props.color ?? C.blue;
  const items: any[] = props.items ?? [];
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <StatusBar />
      <div style={{position: 'absolute', top: pt(58), left: pt(10), display: 'flex', alignItems: 'center', gap: 10, color: C.blue, ...sf, fontSize: pt(17)}}>
        <Chevron size={56} /> {props.back ?? 'Lists'}
      </div>
      <div style={{position: 'absolute', top: pt(98), left: pt(20), right: pt(20), display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <span style={{...sf, fontWeight: 700, fontSize: pt(34), color, letterSpacing: '0.005em'}}>{props.title ?? 'Reading'}</span>
        <span style={{...sf, fontWeight: 600, fontSize: pt(28), color}}>{items.filter((it) => now >= (it.at ?? from)).length}</span>
      </div>
      {items.map((it, i) => {
        const at = it.at ?? from + 0.2 + i * 0.4;
        if (now < at - 0.05) return null;
        const p = prog(now, at, 7, ease.quint);
        const cp = it.checkAt !== undefined ? prog(now, it.checkAt, 6, ease.back) : 0;
        const rowH = it.note ? pt(66) : pt(52);
        const top = pt(160) + items.slice(0, i).reduce((s, x) => s + (x.note ? pt(66) : pt(52)), 0);
        return (
          <div key={i} style={{position: 'absolute', top, left: 0, width: W, height: rowH, opacity: p, transform: `translateY(${(1 - p) * -24}px)`}}>
            <div style={{position: 'absolute', left: pt(20), top: pt(12), width: pt(24), height: pt(24), borderRadius: '50%', border: `${pt(1.6)}px solid ${cp > 0 ? color : '#48484A'}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{width: pt(15), height: pt(15), borderRadius: '50%', background: color, transform: `scale(${cp})`}} />
            </div>
            <div style={{position: 'absolute', left: pt(56), top: pt(12), right: pt(20), ...sf, fontSize: pt(17), color: cp > 0.5 ? C.label2 : C.label}}>{it.text}</div>
            {it.note ? <div style={{position: 'absolute', left: pt(56), top: pt(36), ...sf, fontSize: pt(14), color: C.label2}}>{it.note}</div> : null}
            <div style={{position: 'absolute', left: pt(56), right: 0, bottom: 0, height: 1.5, background: C.sep}} />
          </div>
        );
      })}
      <div style={{position: 'absolute', bottom: pt(44), left: pt(18), display: 'flex', alignItems: 'center', gap: 18, color, ...sf, fontWeight: 600, fontSize: pt(17)}}>
        <div style={{width: pt(24), height: pt(24), borderRadius: '50%', background: color, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: pt(20), fontWeight: 700}}>+</div>
        {props.add ?? 'New Reminder'}
      </div>
      <HomeIndicator />
    </AbsoluteFill>
  );
};

// ---------- Calendar (day view) ----------
/** props: {month:'June', day:'Sunday, 1 June', days:['M','T','W','T','F','S','S'], today:7, startHour:9,
 *          events:[{title, sub?, hour, dur, color:'yellow'|'blue'|'green'|'red'|'orange', at}], tapAt?, nowLine?: 10.5} */
export const Calendar: React.FC<P> = ({now, from, props}) => {
  const cols: Record<string, string> = {yellow: C.yellow, blue: C.blue, green: C.green, red: C.red, orange: C.orange};
  const h0 = props.startHour ?? 9;
  const hourH = pt(58);
  const gridTop = pt(235);
  const days = props.days ?? ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = props.today ?? 7;
  const dates = props.dates ?? [26, 27, 28, 29, 30, 31, 1];
  const tapAt = props.tapAt;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <StatusBar />
      <div style={{position: 'absolute', top: pt(58), left: pt(10), display: 'flex', alignItems: 'center', gap: 8, color: C.red, ...sf, fontSize: pt(17)}}>
        <Chevron color={C.red} size={56} /> {props.month ?? 'June'}
      </div>
      <div style={{position: 'absolute', top: pt(100), left: pt(8), right: pt(8), display: 'flex', justifyContent: 'space-between'}}>
        {days.map((d: string, i: number) => (
          <div key={i} style={{width: pt(48), textAlign: 'center', ...sf}}>
            <div style={{fontSize: pt(11), color: C.label2}}>{d}</div>
            <div style={{margin: `${pt(6)}px auto 0`, width: pt(36), height: pt(36), borderRadius: '50%', background: i + 1 === today ? C.red : 'transparent', color: '#fff', fontSize: pt(19), fontWeight: i + 1 === today ? 600 : 400, lineHeight: `${pt(36)}px`}}>{dates[i]}</div>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', top: pt(180), width: W, textAlign: 'center', ...sf, fontSize: pt(15), color: C.label}}>{props.day ?? 'Sunday, 1 June'}</div>
      <div style={{position: 'absolute', top: pt(212), left: 0, width: W, height: 1.5, background: C.sep}} />
      {Array.from({length: 10}).map((_, k) => (
        <div key={k} style={{position: 'absolute', top: gridTop + k * hourH, left: pt(62), right: 0, height: 1.5, background: '#1C1C1E'}}>
          <span style={{position: 'absolute', left: -pt(50), top: -pt(8), ...sf, fontSize: pt(11), color: C.label2}}>{String(h0 + k).padStart(2, '0')}:00</span>
        </div>
      ))}
      {(props.events ?? []).map((e: any, i: number) => {
        const col = cols[e.color ?? 'yellow'] ?? e.color;
        const p = prog(now, e.at ?? from + 0.2 + i * 0.5, 7, ease.quint);
        const pressed = tapAt !== undefined && i === (props.tapIndex ?? 0) ? Math.max(0, 1 - Math.abs(now - tapAt) / 0.18) : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: pt(66),
              right: pt(8),
              top: gridTop + (e.hour - h0) * hourH + 2,
              height: (e.dur ?? 1) * hourH - 4,
              borderRadius: pt(5),
              background: `${col}${pressed > 0 ? '66' : '40'}`,
              borderLeft: `${pt(3.5)}px solid ${col}`,
              padding: `${pt(4)}px ${pt(7)}px`,
              boxSizing: 'border-box',
              opacity: p,
              transform: `scale(${(0.96 + 0.04 * p) * (1 - 0.02 * pressed)})`,
              transformOrigin: 'left center',
            }}
          >
            <div style={{...sf, fontWeight: 600, fontSize: pt(15), color: col}}>{e.title}</div>
            {e.sub ? <div style={{...sf, fontSize: pt(13), color: col, opacity: 0.8}}>{e.sub}</div> : null}
          </div>
        );
      })}
      {props.nowLine !== undefined ? (
        <div style={{position: 'absolute', top: gridTop + (props.nowLine - h0) * hourH, left: pt(54), right: 0, height: pt(1.5), background: C.red}}>
          <div style={{position: 'absolute', left: -pt(4), top: -pt(4), width: pt(9), height: pt(9), borderRadius: '50%', background: C.red}} />
        </div>
      ) : null}
      <HomeIndicator />
    </AbsoluteFill>
  );
};

// ---------- Photos viewer ----------
/** props: {img|src, startFrom?, date:'Today', time:'16:04'} */
export const Photos: React.FC<P> = ({now, from, props}) => (
  <AbsoluteFill style={{background: C.bg}}>
    <StatusBar />
    <div style={{position: 'absolute', top: pt(58), left: pt(12)}}>
      <Chevron />
    </div>
    <div style={{position: 'absolute', top: pt(56), width: W, textAlign: 'center', ...sf}}>
      <div style={{fontSize: pt(15), fontWeight: 600, color: '#fff'}}>{props.date ?? 'Today'}</div>
      <div style={{fontSize: pt(12), color: C.label2}}>{props.time ?? '16:04'}</div>
    </div>
    <div style={{position: 'absolute', top: pt(62), right: pt(16), ...sf, fontSize: pt(17), color: C.blue}}>{props.edit ?? 'Edit'}</div>
    <div style={{position: 'absolute', top: pt(110), left: 0, width: W, height: H * (props.imgBottom ?? 0.6) - pt(110), overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${1 + 0.02 * (now - from)})`}}>
        <Media src={props.img ?? props.src} startFrom={props.startFrom ?? 0} fit="contain" />
      </AbsoluteFill>
    </div>
    <div style={{position: 'absolute', bottom: pt(30), left: pt(24), right: pt(24), display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      {[
        <path key="s" d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7" />,
        <path key="h" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
        <g key="i"><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></g>,
        <path key="t" d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" />,
      ].map((d, i) => (
        <svg key={i} width={pt(26)} height={pt(26)} viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          {d}
        </svg>
      ))}
    </div>
    <HomeIndicator />
  </AbsoluteFill>
);
