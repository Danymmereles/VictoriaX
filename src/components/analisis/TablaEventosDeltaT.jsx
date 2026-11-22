import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { deltaTDe, nuevoEventoPropio } from "@/lib/analisisPrevio";
import ListaComprometidos from "./ListaComprometidos";

// Δt constante: tres listas (eventos propios y comprometidos anteriores /
// posteriores). En esta metodología los eventos no pueden ser vectores.
export default function TablaEventosDeltaT({ eventos, onChange }) {
  const { propios, anteriores, posteriores } = deltaTDe(eventos);

  function emitir(patch) {
    // Δt constante usa las tres listas: filas queda vacío.
    onChange({ ...eventos, filas: [], propios, anteriores, posteriores, ...patch });
  }
  function actualizarPropio(i, nombre) {
    emitir({ propios: propios.map((p, k) => (k === i ? { ...p, nombre } : p)) });
  }

  return (
    <div>
      <h4 className="font-heading text-lg font-semibold">Delta T Constante</h4>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Eventos Propios</p>
            <span className="text-xs text-muted-foreground">{propios.filter((p) => (p.nombre || "").trim()).length}</span>
          </div>
          <div className="mt-3 space-y-2">
            {propios.length === 0 && <p className="text-xs text-muted-foreground">Sin eventos.</p>}
            {propios.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2">
                <input
                  value={p.nombre}
                  onChange={(e) => actualizarPropio(i, e.target.value)}
                  placeholder="Nombre"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={() => emitir({ propios: propios.filter((_, k) => k !== i) })}
                  aria-label={`Quitar ${p.nombre || "evento propio"}`}
                  className="grid place-items-center rounded-lg border border-border px-2 py-2 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => emitir({ propios: [...propios, nuevoEventoPropio()] })}
              className="inline-flex items-center gap-1 text-xs text-[#AF9BEF] hover:underline"
            >
              <Plus className="w-3 h-3" /> Agregar
            </button>
          </div>
        </div>

        <ListaComprometidos
          titulo="Comprometidos Anteriores"
          items={anteriores}
          onChange={(lista) => emitir({ anteriores: lista })}
        />
        <ListaComprometidos
          titulo="Comprometidos Posteriores"
          items={posteriores}
          onChange={(lista) => emitir({ posteriores: lista })}
        />
      </div>
    </div>
  );
}