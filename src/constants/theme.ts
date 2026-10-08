/**
 * Maddie App — Extended Design Tokens
 * Premium Healthcare Aesthetic Design System
 */

import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111827',
    background: '#FFFFFF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E8FBE9',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    // Brand
    primary: '#00D40E',
    primaryLight: '#E8FBE9',
    primaryDark: '#00B30C',
    primaryHover: '#00BD0D',
    // Accents
    accentSky: '#0EA5E9',
    accentSkyLight: '#E0F2FE',
    accentTeal: '#0D9488',
    accentTealLight: '#CCFBF1',
    accentPurple: '#7C3AED',
    accentPurpleLight: '#EDE9FE',
    accentRose: '#E11D48',
    accentRoseLight: '#FFE4E6',
    accentAmber: '#D97706',
    accentAmberLight: '#FEF3C7',
    // Status
    success: '#00D40E',
    successLight: '#DCFCE7',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    info: '#0284C7',
    infoLight: '#E0F2FE',
    // Misc
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    shadow: '#000000',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    inputBg: '#F4F4F4',
    inputBorder: '#E5E7EB',
    divider: '#F3F4F6',
  },
  dark: {
    text: '#F8FAFC',
    background: '#121212',
    backgroundElement: '#1E1E1E',
    backgroundSelected: '#063D16',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    // Brand
    primary: '#00D40E',
    primaryLight: '#063D16',
    primaryDark: '#00B30C',
    primaryHover: '#34D399',
    // Accents
    accentSky: '#38BDF8',
    accentSkyLight: '#082F49',
    accentTeal: '#14B8A6',
    accentTealLight: '#042F2E',
    accentPurple: '#A78BFA',
    accentPurpleLight: '#2E1065',
    accentRose: '#FB7185',
    accentRoseLight: '#4C0519',
    accentAmber: '#FBBF24',
    accentAmberLight: '#451A03',
    // Status
    success: '#00D40E',
    successLight: '#064E1C',
    warning: '#F59E0B',
    warningLight: '#451A03',
    error: '#F87171',
    errorLight: '#450A0A',
    info: '#38BDF8',
    infoLight: '#082F49',
    // Misc
    border: '#27272A',
    borderLight: '#27272A',
    shadow: '#000000',
    card: '#18181B',
    cardElevated: '#27272A',
    inputBg: '#1E1E1E',
    inputBorder: '#3F3F46',
    divider: '#27272A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;
export type ColorScheme = 'light' | 'dark';

export const CategoryColors: Record<string, { bg: string; text: string; border: string; emoji: string }> = {
  Blood: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA', emoji: '🩸' },
  'Blood Test': { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA', emoji: '🩸' },
  Urine: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', emoji: '🧫' },
  'Urine Test': { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', emoji: '🧫' },
  Radiology: { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE', emoji: '🩻' },
  'Full Body': { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0', emoji: '🏃‍♂️' },
  Cardiology: { bg: '#FFE4E6', text: '#BE123C', border: '#FECDD3', emoji: '❤️' },
  Pathology: { bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE', emoji: '🔬' },
  Microbiology: { bg: '#FCE7F3', text: '#BE185D', border: '#FBCFE8', emoji: '🦠' },
  Thyroid: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', emoji: '🦋' },
  Diabetes: { bg: '#FEF9C3', text: '#A16207', border: '#FEF08A', emoji: '🩺' },
  Other: { bg: '#E8FBE9', text: '#00B30C', border: '#BBF7D0', emoji: '🧪' },
};

export function getCategoryMeta(cat: string) {
  if (CategoryColors[cat]) return CategoryColors[cat];
  const lower = (cat || '').toLowerCase();
  if (lower.includes('blood')) return CategoryColors.Blood;
  if (lower.includes('urine')) return CategoryColors.Urine;
  if (lower.includes('radio') || lower.includes('scan') || lower.includes('x-ray')) return CategoryColors.Radiology;
  if (lower.includes('body')) return CategoryColors['Full Body'];
  if (lower.includes('cardio') || lower.includes('heart')) return CategoryColors.Cardiology;
  if (lower.includes('path')) return CategoryColors.Pathology;
  if (lower.includes('micro')) return CategoryColors.Microbiology;
  if (lower.includes('thyroid')) return CategoryColors.Thyroid;
  if (lower.includes('diabetes') || lower.includes('sugar')) return CategoryColors.Diabetes;
  return CategoryColors.Other;
}

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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

export const Shadow = {
  none: {},
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryGlow: {
    shadowColor: '#00D40E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

