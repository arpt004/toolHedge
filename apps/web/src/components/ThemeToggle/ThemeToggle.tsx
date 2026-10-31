import { useEffect, useState } from "react";
import "./ThemeToggle.css";

type Theme = "light" | "dark";

function readInitialTheme(): Theme {
  const current = document.documentElement.getAttribute("data-theme");
  return current === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem("toolhedge.theme", theme);
    } catch {
      /* Local persistence is optional. */
    }
  }, [theme]);

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={theme === "dark"}
      onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
    >
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
    </button>
  );
}
