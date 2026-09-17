import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ESTADOS = [
  { key: "borrador", label: "Borrador", filtro: (e) => !e.entregado, variant: "secondary" },
  { key: "entregado", label: "Entregado", filtro: (e) => e.entregado && !e.resolucion_vista, variant: "default" },
  { key: "finalizado", label: "Finalizado", filtro: (e) => e.resolucion_vista, variant: "outline" },
];

export default function AvanceEstudiante({ alumnos, ejercicios, entregas, onVerResolucion }) {
  const [abierto, setAbierto] = useState({});

  function toggle(k) {
    setAbierto((s) => ({ ...s, [k]: !s[k] }));
  }

  function tituloEj(ejercicioId) {
    const e = ejercicios.find((x) => x.id === ejercicioId);
    return e ? `Nº ${e.numero} · ${e.titulo}` : ejercicioId;
  }

  if (alumnos.length === 0)
    return <p className="text-sm text-muted-foreground">No hay alumnos inscriptos en el curso.</p>;

  return (
    <div className="space-y-3">
      {alumnos.map((al) => {
        const ents = entregas.filter((e) => e.usuario_id === al.id);
        return (
          <div key={al.id} className="rounded-xl border border-border bg-card/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{al.nombre_completo}</p>
                <p className="text-xs text-muted-foreground">{al.email}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {ESTADOS.map((es) => (
                  <Badge key={es.key} variant={es.variant}>
                    {es.label}: {ents.filter(es.filtro).length}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {ESTADOS.map((es) => {
                const lista = ents.filter(es.filtro);
                const k = `${al.id}_${es.key}`;
                return (
                  <div key={es.key}>
                    <button
                      onClick={() => toggle(k)}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted/40"
                    >
                      {abierto[k] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span>{es.label} ({lista.length})</span>
                    </button>
                    {abierto[k] && (
                      <ul className="ml-6 space-y-1">
                        {lista.length === 0 && <li className="text-sm text-muted-foreground/70">Ninguno.</li>}
                        {lista.map((e) => (
                          <li key={e.id}>
                            <button
                              onClick={() =>
                                onVerResolucion(e, al, ejercicios.find((x) => x.id === e.ejercicio_id))
                              }
                              className="text-sm text-[#AF9BEF] hover:underline"
                            >
                              {tituloEj(e.ejercicio_id)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}