import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function EstadisticasCurso({ ejercicios, alumnos, entregas, onVerResolucion }) {
  const [abiertos, setAbiertos] = useState({});

  function toggle(ejId, key) {
    setAbiertos((s) => ({ ...s, [ejId]: { ...(s[ejId] || {}), [key]: !s[ejId]?.[key] } }));
  }

  if (alumnos.length === 0)
    return <p className="text-sm text-muted-foreground">No hay alumnos inscriptos en el curso.</p>;

  return (
    <div className="space-y-3">
      {ejercicios.map((ej) => {
        const ents = entregas.filter((e) => e.ejercicio_id === ej.id);
        const resolvieron = ents.filter((e) => e.entregado);
        const vieron = ents.filter((e) => e.resolucion_vista);
        const a = abiertos[ej.id] || {};
        return (
          <div key={ej.id} className="rounded-xl border border-border bg-card/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#AF9BEF]/15 text-sm font-semibold text-[#AF9BEF]">
                  {ej.numero}
                </span>
                <span className="font-medium">{ej.titulo}</span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">
                  Resolvieron: <strong className="text-foreground">{resolvieron.length}</strong>/{alumnos.length}
                </span>
                <span className="text-muted-foreground">
                  Vieron resolución: <strong className="text-foreground">{vieron.length}</strong>/{alumnos.length}
                </span>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <button
                onClick={() => toggle(ej.id, "resolvieron")}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted/40"
              >
                {a.resolvieron ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span>Estudiantes que resolvieron ({resolvieron.length})</span>
              </button>
              {a.resolvieron && (
                <ul className="ml-6 space-y-1">
                  {resolvieron.length === 0 && (
                    <li className="text-sm text-muted-foreground/70">Nadie todavía.</li>
                  )}
                  {resolvieron.map((e) => {
                    const al = alumnos.find((u) => u.id === e.usuario_id);
                    return (
                      <li key={e.id}>
                        <button
                          onClick={() => onVerResolucion(e, al, ej)}
                          className="text-sm text-[#AF9BEF] hover:underline"
                        >
                          {al?.nombre_completo || "Estudiante"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                onClick={() => toggle(ej.id, "vieron")}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted/40"
              >
                {a.vieron ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span>Estudiantes que accedieron a la resolución ({vieron.length})</span>
              </button>
              {a.vieron && (
                <ul className="ml-6 space-y-1">
                  {vieron.length === 0 && <li className="text-sm text-muted-foreground/70">Nadie todavía.</li>}
                  {vieron.map((e) => {
                    const al = alumnos.find((u) => u.id === e.usuario_id);
                    return (
                      <li key={e.id}>
                        <button
                          onClick={() => onVerResolucion(e, al, ej)}
                          className="text-sm text-[#AF9BEF] hover:underline"
                        >
                          {al?.nombre_completo || "Estudiante"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}