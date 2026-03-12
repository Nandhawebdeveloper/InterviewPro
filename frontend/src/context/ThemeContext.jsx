/**
 * context/ThemeContext.jsx – Dark / Light Mode Manager
 *
 * • Reads localStorage first (user-selected preference).
 * • Falls back to OS-level prefers-color-scheme.
 * • Writes the active theme as a [data-theme] attribute on <html>
 *   so all CSS variables resolve correctly.
 * • Exposes { theme, toggleTheme, isDark } via useTheme().
 */

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "interviewpro-theme";

/**
 * Resolve the initial theme:
 *   localStorage  →  OS preference  →  "light"
 */
const getInitialTheme = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
};

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const t = getInitialTheme();
    applyTheme(t);
    return t;
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
};

export default ThemeContext;
