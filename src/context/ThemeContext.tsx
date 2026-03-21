import { useState, useEffect, type ReactNode } from 'react';
import { THEMES, ThemeContext, type ColorTheme } from './themeConstants';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    const stored = localStorage.getItem('algoviz_color_theme');
    return stored === 'amber' ? 'amber' : 'green';
  });

  const [crtEffects, setCrtEffects] = useState(() => {
    const stored = localStorage.getItem('algoviz_crt_effects');
    return stored !== 'off';
  });

  useEffect(() => {
    localStorage.setItem('algoviz_color_theme', colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    localStorage.setItem('algoviz_crt_effects', crtEffects ? 'on' : 'off');
  }, [crtEffects]);

  const toggleColorTheme = () => setColorTheme(prev => prev === 'green' ? 'amber' : 'green');
  const toggleCrtEffects = () => setCrtEffects(prev => !prev);

  return (
    <ThemeContext.Provider value={{
      colorTheme,
      colors: THEMES[colorTheme],
      crtEffects,
      toggleColorTheme,
      toggleCrtEffects,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
