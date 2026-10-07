/**
 * useTheme — returns Colors for current color scheme
 */
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  return { colors, isDark, scheme: isDark ? 'dark' : 'light' } as const;
}
