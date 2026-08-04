import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ className = "" }) {
  const [dark, setDark] = useState(() => localStorage.getItem("vx-theme") !== "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("vx-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      aria-label="Cambiar tema"
      className={`h-10 w-10 grid place-items-center rounded-full border border-border/70 bg-background/60 backdrop-blur transition-colors hover:border-[#73C3EE] ${className}`}
    >
      {dark ? <Sun className="w-4 h-4 text-[#73C3EE]" /> : <Moon className="w-4 h-4 text-[#AF9BEF]" />}
    </button>
  );
}