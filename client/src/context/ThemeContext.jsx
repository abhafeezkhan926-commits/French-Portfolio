import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { const saved = localStorage.getItem('lobna-theme'); return saved === 'light' || saved === 'dark' ? saved : 'dark'; } catch { return 'dark'; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('lobna-theme', theme); } catch { /* storage can be disabled */ }
  }, [theme]);
  const toggleTheme = () => setTheme(current => current === 'dark' ? 'light' : 'dark');
  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
