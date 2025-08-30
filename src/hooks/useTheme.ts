import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type Theme = 'light' | 'dark' | 'system' | 'high-contrast' | 'dyslexia-friendly';

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system', 1);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'high-contrast', 'dyslexia-friendly');

    let effectiveTheme = theme;

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      effectiveTheme = systemTheme;
    }

    root.classList.add(effectiveTheme);

    // Handle reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return {
    theme,
    setTheme,
  };
}