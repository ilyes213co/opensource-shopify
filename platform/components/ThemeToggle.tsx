"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const currentTheme = document.documentElement.dataset.theme as "light" | "dark" | undefined;
    if (currentTheme === "light" || currentTheme === "dark") {
      setTheme(currentTheme);
    } else {
      const saved = localStorage.getItem("theme") || localStorage.getItem("app_theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial: "light" | "dark" =
        saved === "light" ? "light" : saved === "dark" ? "dark" : prefersDark ? "dark" : "light";
      setTheme(initial);
      document.documentElement.setAttribute("data-theme", initial);
      if (initial === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    setMounted(true);
  }, []);

  const apply = (next: "light" | "dark") => {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("theme", next);
      localStorage.setItem("app_theme", next);
    } catch (e) {
      // ignore localStorage errors in sandboxed environments
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = theme === "dark" ? "light" : "dark";

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(rect.left + rect.width / 2);
    const y = Math.round(rect.top + rect.height / 2);

    document.documentElement.style.setProperty("--x", `${x}px`);
    document.documentElement.style.setProperty("--y", `${y}px`);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const doc = document as Document & {
      startViewTransition?: (callback: () => void | Promise<void>) => { ready: Promise<void> };
    };

    if (typeof doc.startViewTransition === "function" && !prefersReducedMotion) {
      doc.startViewTransition(() => {
        apply(next);
      });
    } else {
      apply(next);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Changer de thème"
      title="Changer de thème"
      className={`w-10 h-10 rounded-xl border border-line bg-surface hover:bg-surface-2 text-ink flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/30 ${className}`}
    >
      {mounted ? (
        theme === "dark" ? (
          <Sun className="w-5 h-5 text-amber-400 transition-transform duration-300 hover:rotate-45" />
        ) : (
          <Moon className="w-5 h-5 text-brand transition-transform duration-300 hover:-rotate-12" />
        )
      ) : (
        <span className="w-5 h-5 block" />
      )}
    </button>
  );
}
