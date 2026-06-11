import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "dark" | "light";
interface ThemeContextValue { theme: Theme; setTheme: (t: Theme) => void; }
const ThemeContext = createContext<ThemeContextValue>({ theme: "dark", setTheme: () => {} });

export function ThemeProvider({ children, defaultTheme = "dark" }: { children: ReactNode; defaultTheme?: Theme }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem("tixora-theme") as Theme) ?? defaultTheme; } catch { return defaultTheme; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
    try { localStorage.setItem("tixora-theme", theme); } catch {}
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
