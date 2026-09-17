import { useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

// ── LIGHT tema ────────────────────────────────────────────────────────────────
export const lightColors = {
  bgApp:       '#f4f5fb',
  bgCard:      '#ffffff',
  bgCard2:     '#f8f9ff',
  bgInput:     '#f1f3ff',

  border:      '#eaedf5',
  borderInput: '#dde1f0',

  textPrimary:   '#0f0f1a',
  textSecondary: '#5a6282',
  textMuted:     '#9ba3c0',
  textInverse:   '#ffffff',

  brand:       '#6366f1',
  brandLight:  '#818cf8',
  brandBg:     'rgba(99,102,241,0.10)',
  brandBorder: 'rgba(99,102,241,0.25)',

  green:       '#10b981',
  greenBg:     'rgba(16,185,129,0.10)',
  yellow:      '#f59e0b',
  yellowBg:    'rgba(245,158,11,0.10)',
  red:         '#ef4444',
  redBg:       'rgba(239,68,68,0.10)',
  blue:        '#3b82f6',
  blueBg:      'rgba(59,130,246,0.10)',

  navBg:       '#ffffff',
  navBorder:   '#eaedf5',
  navActive:   '#6366f1',
  navInactive: '#9ba3c0',

  shadowColor: '#000',
  statusBar:   'dark',
};

// ── DARK tema ─────────────────────────────────────────────────────────────────
export const darkColors = {
  bgApp:       '#0c0c18',
  bgCard:      '#14142a',
  bgCard2:     '#1a1a2e',
  bgInput:     '#1e1e35',

  border:      'rgba(255,255,255,0.07)',
  borderInput: 'rgba(255,255,255,0.10)',

  textPrimary:   '#f0f0ff',
  textSecondary: '#9499c0',
  textMuted:     '#5a5f7a',
  textInverse:   '#0c0c18',

  brand:       '#818cf8',
  brandLight:  '#a5b4fc',
  brandBg:     'rgba(129,140,248,0.12)',
  brandBorder: 'rgba(129,140,248,0.25)',

  green:       '#34d399',
  greenBg:     'rgba(52,211,153,0.12)',
  yellow:      '#fbbf24',
  yellowBg:    'rgba(251,191,36,0.12)',
  red:         '#f87171',
  redBg:       'rgba(248,113,113,0.12)',
  blue:        '#60a5fa',
  blueBg:      'rgba(96,165,250,0.12)',

  navBg:       '#111124',
  navBorder:   'rgba(255,255,255,0.06)',
  navActive:   '#818cf8',
  navInactive: '#5a5f7a',

  shadowColor: '#000',
  statusBar:   'light',
};

// ── useTheme hook ─────────────────────────────────────────────────────────────
export function useTheme() {
  const systemScheme = useColorScheme();
  const themeMode    = useSelector(s => s.theme.mode); // 'light' | 'dark' | 'system'

  const resolved = themeMode === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : themeMode;

  const colors = resolved === 'dark' ? darkColors : lightColors;
  const isDark  = resolved === 'dark';

  return { colors, isDark, mode: themeMode, resolved };
}

// ── Spacing ───────────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// ── Border radius ─────────────────────────────────────────────────────────────
export const radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  full: 999,
};

// ── Typography ────────────────────────────────────────────────────────────────
export const typography = {
  h1:   { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  h2:   { fontSize: 22, fontWeight: '800' },
  h3:   { fontSize: 18, fontWeight: '800' },
  h4:   { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 14, fontWeight: '500' },
  sm:   { fontSize: 13, fontWeight: '500' },
  xs:   { fontSize: 11, fontWeight: '600' },
  label:{ fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
};
