import { useDarkMode } from '../context/DarkModeContext';
import { getColors } from '../constants/bowtie';

export function useThemeColors() {
  const { isDarkMode } = useDarkMode();
  return getColors(isDarkMode);
}

export function useIsDarkMode() {
  const { isDarkMode } = useDarkMode();
  return isDarkMode;
}
