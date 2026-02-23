import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ColorScheme {
  key: string;
  label: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  success: string;
  danger: string;
  gold: string;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    key: 'brown', label: '棕橙',
    primary: '#C06B3E', primaryHover: '#A85A32', primaryLight: 'rgba(192,107,62,0.07)',
    primaryBorder: 'rgba(192,107,62,0.28)', success: '#5B8C5A', danger: '#C75450', gold: '#D4A853',
  },
  {
    key: 'blue', label: '靛蓝',
    primary: '#4A7FB5', primaryHover: '#3A6A9E', primaryLight: 'rgba(74,127,181,0.07)',
    primaryBorder: 'rgba(74,127,181,0.28)', success: '#5B8C5A', danger: '#C75450', gold: '#D4A853',
  },
  {
    key: 'green', label: '翠绿',
    primary: '#5B8C5A', primaryHover: '#4A7549', primaryLight: 'rgba(91,140,90,0.07)',
    primaryBorder: 'rgba(91,140,90,0.28)', success: '#5B8C5A', danger: '#C75450', gold: '#D4A853',
  },
  {
    key: 'purple', label: '雅紫',
    primary: '#7B6BAE', primaryHover: '#695A9E', primaryLight: 'rgba(123,107,174,0.07)',
    primaryBorder: 'rgba(123,107,174,0.28)', success: '#5B8C5A', danger: '#C75450', gold: '#D4A853',
  },
];

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colorScheme: ColorScheme;
  setColorSchemeKey: (key: string) => void;
}

const ThemeContext = createContext<ThemeContextType>(null!);

function applyColorScheme(scheme: ColorScheme) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', scheme.primary);
  root.style.setProperty('--color-primary-hover', scheme.primaryHover);
  root.style.setProperty('--color-primary-light', scheme.primaryLight);
  root.style.setProperty('--color-primary-border', scheme.primaryBorder);
  root.style.setProperty('--color-sidebar-active', `${scheme.primary}26`);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem('colorScheme');
    return COLOR_SCHEMES.find(s => s.key === saved) || COLOR_SCHEMES[0];
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    applyColorScheme(colorScheme);
    localStorage.setItem('colorScheme', colorScheme.key);
  }, [colorScheme]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const setColorSchemeKey = useCallback((key: string) => {
    const found = COLOR_SCHEMES.find(s => s.key === key);
    if (found) setColorScheme(found);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colorScheme, setColorSchemeKey }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
