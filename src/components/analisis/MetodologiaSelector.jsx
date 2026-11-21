import React from "react";
import { METODOLOGIAS } from "@/lib/analisisPrevio";
import ErrorBadge from "./ErrorBadge";

const opciones = [
  {
    key: METODOLOGIAS.EVENTO_A_EVENTO,
    titulo: "Evento a Evento",
    desc: "Tabla con Evento, Evento Futuro No Condicionado, Evento Futuro Condicionado y Condición.",
  },
  {
    key: METODOLOGIAS.DELTA_T_CONSTANTE,
    titulo: "Delta T Constante",
    desc: "Tabla con Eventos Propios, Eventos Comprometidos Anteriores y Posteriores.",
  },
];

export default function MetodologiaSelector({ value, onChange, error = false }) {
  return (
    <div>
      {error && <ErrorBadge className="mb-3">Elegí una metodología</ErrorBadge>}
      <div className="grid gap-4 sm:grid-cols-2">
        {opciones.map((o) => {
          const activo = value === o.key;
          const estado = activo
            ? "border-[#AF9BEF] bg-[#AF9BEF]/5"
            : error
            ? "border-destructive/50 bg-destructive/5 hover:border-destructive"
            : "border-border hover:border-[#AF9BEF]/50";
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onChange(o.key)}
              className={`rounded-2xl border p-6 text-left transition-all ${estado}`}
            >
              <div className="flex items-center gap-3">
                <span className={`grid h-5 w-5 place-items-center rounded-full border ${activo ? "border-[#AF9BEF] bg-[#AF9BEF]" : "border-border"}`}>
                  {activo && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
                <h3 className="font-heading text-xl font-semibold">{o.titulo}</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{o.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}