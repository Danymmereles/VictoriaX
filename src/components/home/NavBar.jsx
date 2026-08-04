import React from "react";
import { Link } from "react-router-dom";
import Wordmark from "@/components/brand/Wordmark";
import ThemeToggle from "@/components/theme/ThemeToggle";

const links = [
  { label: "Modos", href: "#modos" },
  { label: "Cómo funciona", href: "#flujo" },
  { label: "Legado", href: "#legado" },
  { label: "Proyecto", href: "#proyecto" },
];

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[100rem] items-center justify-between px-6 lg:px-12">
        <Wordmark />
        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/login"
            className="rounded-full bg-gradient-to-r from-[#73C3EE] via-[#AF9BEF] to-[#EA84B4] px-5 py-2.5 text-sm font-medium text-[#0A0D14] transition-transform hover:scale-[1.03]"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  );
}