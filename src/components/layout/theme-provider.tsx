"use client";

import * as React from "react";
import { Theme, ThemeValue, ThemeContextType } from "@/typings";

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeValue>("system");

  React.useEffect(() => {
    const saved = localStorage.getItem("mcq_theme") as ThemeValue | null;
    if (saved) {
      setThemeState(saved);
      applyTheme(saved);
    } else {
      applyTheme("system");
    }
  }, []);

  const applyTheme = (t: ThemeValue) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "oled", "sepia");

    if (t === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(isDark ? "dark" : "light");
    } else {
      root.classList.add(t);
    }
  };

  const setTheme = (newTheme: ThemeValue) => {
    setThemeState(newTheme);
    localStorage.setItem("mcq_theme", newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
