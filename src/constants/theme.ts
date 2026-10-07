/**
 * Maddie App — Extended Design Tokens
 * Extends the base theme with medical-app-specific colors
 */

import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EFF6FF',
    textSecondary: '#64748B',
    // Brand
    primary: '#2563EB',
    primaryLight: '#DBEAFE',
    primaryDark: '#1D4ED8',
    // Status
    success: '#059669',
    successLight: '#D1FAE5',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    // Misc
    border: '#E2E8F0',
    shadow: '#0F172A',
    card: '#FFFFFF',
    inputBg: '#F1F5F9',
  },
  dark: {
    text: '#F1F5F9',
    background: '#0B1120',
    backgroundElement: '#1E2942',
    backgroundSelected: '#1E3A5F',
    textSecondary: '#94A3B8',
    // Brand
    primary: '#3B82F6',
    primaryLight: '#1E3A5F',
    primaryDark: '#60A5FA',
    // Status
    success: '#10B981',
    successLight: '#064E3B',
    warning: '#F59E0B',
    warningLight: '#451A03',
    error: '#F87171',
    errorLight: '#450A0A',
    // Misc
    border: '#1E2942',
    shadow: '#000000',
    card: '#1E2942',
    inputBg: '#0F1E35',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;
export type ColorScheme = 'light' | 'dark';

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
