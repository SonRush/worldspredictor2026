/**
 * Logos that would vanish on one of the themes get a contrasting plate behind them
 * (see .logo-crest in styles.css). Derived from the mean luminance of each logo's
 * opaque pixels: below ~110 → 'dark' (needs a light plate on the dark theme),
 * above ~225 → 'light' (GEN's pale gold is added by eye) (needs a dark plate on the light theme).
 */
export const LOGO_TONE: Record<string, 'dark' | 'light'> = {
  AL: 'dark',
  CFO: 'dark',
  FUR: 'dark',
  T1: 'dark',
  TES: 'dark',
  DK: 'light',
  GEN: 'light',
  G2: 'light',
  TL: 'light',
  TSW: 'light',
};
