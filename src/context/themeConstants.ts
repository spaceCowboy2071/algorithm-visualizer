import { createContext } from 'react';

export type ColorTheme = 'green' | 'amber';

export interface ThemeColors {
  main: string;
  bg: string;
  cursorBg: string;
  cursorText: string;
  border: string;
  borderFaint: string;
  led: string;
  ledGlow: string;
  btnBorder: string;
}

export const THEMES: Record<ColorTheme, ThemeColors> = {
  green: {
    main: '#3fb950',
    bg: 'rgba(63,185,80,0.12)',
    cursorBg: '#3fb950',
    cursorText: '#0d1117',
    border: 'rgba(63,185,80,0.25)',
    borderFaint: 'rgba(63,185,80,0.2)',
    led: '#4ade80',
    ledGlow: '0 0 4px #4ade80',
    btnBorder: 'rgba(63,185,80,0.3)',
  },
  amber: {
    main: '#FFBF40',
    bg: 'rgba(255,191,64,0.12)',
    cursorBg: '#FFBF40',
    cursorText: '#0d1117',
    border: 'rgba(255,191,64,0.25)',
    borderFaint: 'rgba(255,191,64,0.2)',
    led: '#FFBF40',
    ledGlow: '0 0 4px #FFBF40',
    btnBorder: 'rgba(255,191,64,0.3)',
  },
};

export interface ThemeContextType {
  colorTheme: ColorTheme;
  colors: ThemeColors;
  crtEffects: boolean;
  toggleColorTheme: () => void;
  toggleCrtEffects: () => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);
