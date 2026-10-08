/**
 * useTheme — returns Colors for current color scheme
 * Styled for Mediq healthcare design system (clean, light theme)
 */
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

// Mediq UI design system is a clean light-first theme (#FFFFFF)
export const FORCE_LIGHT_THEME = true;

export function useTheme() {
  const systemScheme = useColorScheme();
  const isDark = FORCE_LIGHT_THEME ? false : systemScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  return { colors, isDark, scheme: isDark ? 'dark' : 'light' } as const;
}
