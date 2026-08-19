import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeMode } from "../types";

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const savedTheme = localStorage.getItem("kaboom_theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      }
    } catch {
      // Ignore localStorage error
    }
    return "dark";
  });

  useEffect(() => {
    try {
      localStorage.setItem("kaboom_theme", theme);
    } catch {
      // Ignore localStorage error
    }

    // Apply class to html/body for seamless dark/light styling
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
      document.body.style.backgroundColor = "#f1f5f9";
      document.body.style.color = "#0f172a";
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
      document.body.style.backgroundColor = "#020617";
      document.body.style.color = "#f8fafc";
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
