import React, { createContext, useContext, useEffect, useState } from 'react';
import lightTheme from '../theme-light.css?inline';
import darkTheme from '../theme-dark.css?inline';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-bs-theme', theme);

    // Remove previous theme style
    const existingStyle = document.getElementById('dynamic-theme-style');
    if (existingStyle) existingStyle.remove();

    // Add current theme CSS
    const style = document.createElement('style');
    style.id = 'dynamic-theme-style';
    style.innerHTML = theme === 'light' ? lightTheme : darkTheme;
    document.head.appendChild(style);
  }, [theme]);

  const toggleTheme = () => {
    console.log('Toggling theme');
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      console.log('New theme:', newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};