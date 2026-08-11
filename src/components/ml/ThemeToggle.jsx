import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_EVENT = "ml-arena:theme-change";

function getCurrentTheme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(getCurrentTheme);
  const dark = theme === "dark";

  useEffect(() => {
    const syncTheme = () => setTheme(getCurrentTheme());
    const syncStorage = () => setTheme(getCurrentTheme());
    window.addEventListener(THEME_EVENT, syncTheme);
    window.addEventListener("storage", syncStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, syncTheme);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = dark ? "light" : "dark";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    try {
      localStorage.setItem("ml-arena-theme", nextTheme);
    } catch {}
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", nextTheme === "dark" ? "#050914" : "#ffffff");
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: nextTheme }));
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"}
      title={dark ? "Светлая тема" : "Тёмная тема"}
      onClick={toggleTheme}
      className={`group relative h-9 w-[66px] shrink-0 rounded-full border border-border bg-secondary p-1 shadow-inner transition-[background-color,border-color] duration-300 hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${className}`}
    >
      <Sun size={13} className={`absolute left-2 top-1/2 -translate-y-1/2 transition-colors duration-300 ${dark ? "text-muted-foreground/45" : "text-amber-500"}`} />
      <Moon size={13} className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors duration-300 ${dark ? "text-blue-300" : "text-muted-foreground/45"}`} />
      <span className={`relative z-[1] flex h-7 w-7 items-center justify-center rounded-full bg-card text-primary shadow-md ring-1 ring-border transition-transform duration-300 ease-out ${dark ? "translate-x-[30px]" : "translate-x-0"}`}>
        {dark ? <Moon size={14} /> : <Sun size={14} />}
      </span>
    </button>
  );
}
