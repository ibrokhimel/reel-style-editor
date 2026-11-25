import {loadFont as loadInterTight} from '@remotion/google-fonts/InterTight';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadSerif} from '@remotion/google-fonts/InstrumentSerif';
import {loadFont as loadScript} from '@remotion/google-fonts/DancingScript';

// Inter / Inter Tight cover Latin + Cyrillic (Uzbek, Russian). Instrument Serif and Dancing Script are Latin-only:
// Cyrillic accent words fall back to Georgia italic / Segoe Script.
const tight = loadInterTight('normal', {weights: ['500', '600', '700', '800', '900'], subsets: ['latin', 'latin-ext', 'cyrillic']});
loadInterTight('italic', {weights: ['700', '800', '900'], subsets: ['latin', 'latin-ext', 'cyrillic']});
const inter = loadInter('normal', {weights: ['400', '500', '600'], subsets: ['latin', 'latin-ext', 'cyrillic']});
const serif = loadSerif('italic', {weights: ['400'], subsets: ['latin', 'latin-ext']});
const script = loadScript('normal', {weights: ['700'], subsets: ['latin', 'latin-ext']});

export const F = {
  grotesk: `${tight.fontFamily}, "Segoe UI", sans-serif`, // LUX + KINETIC
  ui: `${inter.fontFamily}, "Segoe UI", sans-serif`, // iOS (SF Pro stand-in)
  serif: `${serif.fontFamily}, Georgia, serif`, // premium accent words
  script: `${script.fontFamily}, "Segoe Script", cursive`, // neon script (Photos scene)
  emoji: '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif',
};
