import { createContext, useContext, useState, useEffect, useCallback } from "react";

export const THEMES = {
  default: {
    name: 'Neon Pink',
    primary: '348 48% 58%',
    accent: '280 100% 65%',
    neonPink: '348 100% 65%',
    neonPurple: '280 100% 65%',
    neonBlue: '200 100% 60%',
    neonGreen: '120 100% 50%',
    neonOrange: '25 100% 55%',
  },
  purple: {
    name: 'Cyber Purple',
    primary: '280 100% 65%',
    accent: '260 100% 70%',
    neonPink: '280 100% 65%',
    neonPurple: '260 100% 70%',
    neonBlue: '240 100% 65%',
    neonGreen: '150 100% 55%',
    neonOrange: '280 100% 65%',
  },
  blue: {
    name: 'Neon Blue',
    primary: '200 100% 60%',
    accent: '180 100% 65%',
    neonPink: '200 100% 60%',
    neonPurple: '220 100% 65%',
    neonBlue: '180 100% 65%',
    neonGreen: '160 100% 55%',
    neonOrange: '200 100% 60%',
  },
  green: {
    name: 'Cyber Green',
    primary: '120 100% 50%',
    accent: '140 100% 55%',
    neonPink: '120 100% 50%',
    neonPurple: '140 100% 55%',
    neonBlue: '160 100% 55%',
    neonGreen: '120 100% 50%',
    neonOrange: '140 100% 55%',
  },
  orange: {
    name: 'Neon Orange',
    primary: '25 100% 55%',
    accent: '35 100% 60%',
    neonPink: '25 100% 55%',
    neonPurple: '15 100% 60%',
    neonBlue: '200 100% 60%',
    neonGreen: '45 100% 55%',
    neonOrange: '25 100% 55%',
  },
} as const;

export type ThemeKey = keyof typeof THEMES;

interface ThemeContextType {
  currentTheme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>(() => {
    const saved = localStorage.getItem('theme-preference');
    return (saved as ThemeKey) || 'default';
  });

  const setTheme = useCallback((theme: ThemeKey) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme-preference', theme);

    // Apply CSS variables to root element
    const themeConfig = THEMES[theme];
    const root = document.documentElement;

    root.style.setProperty('--primary', themeConfig.primary);
    root.style.setProperty('--accent', themeConfig.accent);
    root.style.setProperty('--neon-pink', themeConfig.neonPink);
    root.style.setProperty('--neon-purple', themeConfig.neonPurple);
    root.style.setProperty('--neon-blue', themeConfig.neonBlue);
    root.style.setProperty('--neon-green', themeConfig.neonGreen);
    root.style.setProperty('--neon-orange', themeConfig.neonOrange);

    // Update dependent variables
    root.style.setProperty('--ring', themeConfig.primary);
    root.style.setProperty('--sidebar-primary', themeConfig.primary);
    root.style.setProperty('--sidebar-ring', themeConfig.primary);
  }, []);

  // Apply theme on mount and when changed
  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
