/**
 * useTheme — returns active theme Colors object
 */
import { useTheme as useAppTheme } from '@/hooks/useTheme';

export function useTheme() {
  const { colors } = useAppTheme();
  return colors;
}
