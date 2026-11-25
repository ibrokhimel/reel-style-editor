// Mirrors public/edit.json written by scripts/compile_edit.py. All times are seconds on the OUTPUT timeline.
export type Style = 'lux' | 'ios' | 'kinetic';
export type Enter = 'cut' | 'blur' | 'defocus' | 'iris' | 'whip' | 'slide' | 'pop' | 'app';
export type Exit = 'none' | 'iris' | 'whip' | 'blur';

// w = text, t = onset, e = end, s = serif-italic accent, c = colour tag, x = emoji suffix
export type Word = {w: string; t: number; e: number; s?: boolean; c?: 'pos' | 'neg' | 'accent'; x?: string};

export type Section = {
  id: string;
  kind: string; // face | broll | image | stat | redsun | framed | collage | messages | calendar | clock | reminders | photos | black | hero | poster | namecard | cutout | emoji
  from: number;
  to: number;
  enter?: Enter;
  exit?: Exit;
  invertFlash?: boolean;
  props?: any;
};

export type Caption = {
  preset:
    | 'LUX_KARAOKE' | 'LUX_TWOTIER' | 'LUX_BROLL_WORD'
    | 'IOS_PILL' | 'IOS_NOTES' | 'IOS_PLAIN' | 'IOS_CHECKLIST' | 'IOS_TYPE'
    | 'KINETIC_HERO'
    | 'CLEAN';
  from: number;
  to: number;
  words?: Word[];
  small?: Word[];
  big?: Word[];
  pill?: Word[];
  rows?: Word[][];
  bigInPill?: boolean;
  y?: number; // 0-1 centre override
};

export type Edit = {
  style: Style;
  duration: number;
  aroll?: string | null; // public/ path of the silence-cut talking head
  audio?: string | null; // public/ path of the final mix
  watermark?: string;
  words: Word[];
  sections: Section[];
  captions: Caption[];
};
