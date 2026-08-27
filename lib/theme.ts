import { useColorScheme } from 'react-native';

const dark = {
  bg: '#0B0D12',
  bgElevated: '#12151C',
  card: 'rgba(255,255,255,0.06)',
  cardBorder: 'rgba(255,255,255,0.10)',
  glass: 'rgba(255,255,255,0.08)',
  text: '#F5F6F8',
  textMuted: '#9BA1AC',
  textFaint: '#666C78',
  primary: '#7C6CFF',
  primaryMuted: 'rgba(124,108,255,0.16)',
  accent: '#3DDC97',
  danger: '#FF6B6B',
  warning: '#FFB84D',
  gradientA: '#7C6CFF',
  gradientB: '#4E3FE0',
  overlay: 'rgba(0,0,0,0.55)',
  divider: 'rgba(255,255,255,0.08)',
  tabBarBg: 'rgba(18,21,28,0.92)',
};

const light = {
  bg: '#F7F7FA',
  bgElevated: '#FFFFFF',
  card: 'rgba(255,255,255,0.75)',
  cardBorder: 'rgba(20,20,30,0.08)',
  glass: 'rgba(255,255,255,0.6)',
  text: '#14151A',
  textMuted: '#5B5F6B',
  textFaint: '#9297A3',
  primary: '#6A57F0',
  primaryMuted: 'rgba(106,87,240,0.10)',
  accent: '#1FAE79',
  danger: '#E0453F',
  warning: '#D68A1E',
  gradientA: '#6A57F0',
  gradientB: '#8E7CFF',
  overlay: 'rgba(0,0,0,0.35)',
  divider: 'rgba(20,20,30,0.08)',
  tabBarBg: 'rgba(255,255,255,0.92)',
};

export type Theme = typeof dark;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'light' ? light : dark;
}

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
};

export const typography = {
  display: { fontSize: 30, fontWeight: '700' as const },
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 19, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyMedium: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  tiny: { fontSize: 11, fontWeight: '500' as const },
};
