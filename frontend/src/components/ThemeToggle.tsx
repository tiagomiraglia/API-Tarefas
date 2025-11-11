import React from 'react';
import { useTheme } from './ThemeProvider';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-outline-secondary"
      title={`Alternar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      {theme === 'light' ? (
        <i className="bi bi-moon"></i>
      ) : (
        <i className="bi bi-sun"></i>
      )}
    </button>
  );
};

export default ThemeToggle;