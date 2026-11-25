import React from "react";
import { Linkedin, Mail } from "lucide-react";
import { EQUIPO } from "@/lib/equipo";

export default function EquipoList({ mostrarEmail = false }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {EQUIPO.map((persona, index) => (
        <li
          key={persona.nombre}
          className={`flex flex-col gap-2 ${
            index === EQUIPO.length - 1 && EQUIPO.length % 2 === 1 ? "sm:col-span-2" : ""
          }`}
        >
          <span className="font-medium text-foreground">{persona.nombre}</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <a
              href={persona.linkedin}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
            >
              <Linkedin className="h-4 w-4" /> LinkedIn
            </a>
            {mostrarEmail && (
              <a
                href={`mailto:${persona.email}`}
                className="inline-flex items-center gap-1.5 break-all text-muted-foreground transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4 shrink-0" /> {persona.email}
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}