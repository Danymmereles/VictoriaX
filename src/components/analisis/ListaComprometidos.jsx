import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { nuevoComprometido } from "@/lib/analisisPrevio";

// Una de las dos columnas de eventos comprometidos (anteriores / posteriores)
// de la tabla Δt constante.
export default function ListaComprometidos({ titulo, items, idsConError = [], onChange }) {
  const cargados = items.filter((x) => (x.nombre || "").trim()).length;

  function actualizar(i, nombre) {
    onChange(items.map((x, k) => (k === i ? { ...x, nombre } : x)));
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{titulo}</p>
        <span className="text-xs text-muted-foreground">{cargados}</span>
      </div>
      <div className="mt-3 space-y-2">
        {items.length === 0 && <p className="text-xs text-muted-foreground">Sin eventos.</p>}
        {items.map((it, i) => (
          <div key={it.id} className="flex items-center gap-2">
            <input
              value={it.nombre}
              onChange={(e) => actualizar(i, e.target.value)}
              placeholder="Evento"
              className={`w-full rounded-lg border bg-background px-3 py-2 text-sm ${idsConError.includes(it.id) ? "border-destructive" : "border-input"}`}
            />
            <button
              onClick={() => onChange(items.filter((_, k) => k !== i))}
              aria-label={`Quitar ${it.nombre || "evento"}`}
              className="grid place-items-center rounded-lg border border-border px-2 py-2 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...items, nuevoComprometido()])}
          className="inline-flex items-center gap-1 text-xs text-[#AF9BEF] hover:underline"
        >
          <Plus className="w-3 h-3" /> Agregar
        </button>
      </div>
    </div>
  );
}