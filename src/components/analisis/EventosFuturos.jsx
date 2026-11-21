import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { nuevoEventoFuturo, eventosDeclarados, METODOLOGIAS } from "@/lib/analisisPrevio";

export default function EventosFuturos({ analisis, onChange }) {
  const { eventosFuturos, metodologia } = analisis;
  const opciones = metodologia ? eventosDeclarados(analisis) : [];

  function actualizar(i, patch) {
    onChange(eventosFuturos.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function quitar(i) {
    onChange(eventosFuturos.filter((_, idx) => idx !== i));
  }
  function agregar() {
    onChange([...eventosFuturos, nuevoEventoFuturo()]);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-lg font-semibold">Eventos Futuros</h4>
        <button onClick={agregar} className="inline-flex items-center gap-1 text-sm font-medium text-[#AF9BEF] hover:underline">
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {metodologia === METODOLOGIAS.EVENTO_A_EVENTO
          ? "Obligatoria en Evento a Evento: cargá al menos un evento futuro. Cada sigla representa el tiempo de ejecución de un evento."
          : "Cada sigla representa el tiempo de ejecución de un evento."}
      </p>
      <div className="mt-4 space-y-3">
        {eventosFuturos.length === 0 && <p className="text-sm text-muted-foreground">Sin eventos futuros.</p>}
        {eventosFuturos.map((e, i) => (
          <div key={e.id} className="grid items-center gap-3 sm:grid-cols-[140px_1fr_auto]">
            <input value={e.sigla} onChange={(ev) => actualizar(i, { sigla: ev.target.value })} placeholder="Siglas" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <select value={e.eventoRef} onChange={(ev) => actualizar(i, { eventoRef: ev.target.value })} disabled={!metodologia} className="rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-60">
              <option value="">{metodologia ? "Seleccionar evento" : "Elegí metodología primero"}</option>
              {opciones.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <button onClick={() => quitar(i)} className="grid place-items-center rounded-lg border border-border px-3 py-2 hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}