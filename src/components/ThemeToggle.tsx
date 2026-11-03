"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasDarkClass = document.documentElement.classList.contains("dark");
    setIsDark(hasDarkClass);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const willBeDark = !root.classList.contains("dark");

    if (willBeDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
      title={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
      className={`size-9 flex items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${className}`}
    >
      {/* CSS-driven icon visibility prevents SSR hydration mismatch */}
      <Sun className="size-4.5 hidden dark:block text-amber-400 transition-transform duration-200 hover:rotate-45" />
      <Moon className="size-4.5 block dark:hidden text-slate-700 transition-transform duration-200 hover:-rotate-12" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

export default ThemeToggle;

