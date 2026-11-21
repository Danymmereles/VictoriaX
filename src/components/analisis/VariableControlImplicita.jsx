import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { nuevaVariable } from "@/lib/analisisPrevio";
import ErrorBadge from "./ErrorBadge";

// Variante de VariableList para Variables de Control en Modo Estudio: en vez del
// popup de confirmación del Modo Libre, se marca "implícita" con un checkbox que
// desaparece en cuanto se agrega una variable explícita.
export default function VariableControlImplicita({
  variables,
  onChange,
  implicita,
  onChangeImplicita,
  error = false,
  idsConError = [],
}) {
  function actualizar(i, patch) {
    onChange(variables.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }
  function quitar(i) {
    onChange(variables.filter((_, idx) => idx !== i));
  }
  function agregar() {
    onChangeImplicita(false);
    onChange([...variables, nuevaVariable()]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className={`font-heading text-lg font-semibold ${error ? "text-destructive" : ""}`}>Variables de Control</h4>
        {error && <ErrorBadge />}
      </div>

      {variables.length === 0 && (
        <label className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={implicita}
            onChange={(e) => onChangeImplicita(e.target.checked)}
          />
          Variable de control implícita (no hay ninguna variable de control explícita)
        </label>
      )}

      {!implicita && (
        <div className="mt-4 space-y-3">
          {variables.map((v, i) => {
            const conError = idsConError.includes(v.id);
            return (
              <div key={v.id} className="rounded-xl border border-border bg-card p-4">
                <div className="grid gap-3 sm:grid-cols-[120px_1fr_auto]">
                  <input value={v.sigla} onChange={(e) => actualizar(i, { sigla: e.target.value })} placeholder="Siglas" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  <input value={v.descripcion} onChange={(e) => actualizar(i, { descripcion: e.target.value })} placeholder="Descripción" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  <button onClick={() => quitar(i)} className="grid place-items-center rounded-lg border border-border px-3 hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {conError && <ErrorBadge className="mt-3" />}
              </div>
            );
          })}
          <button onClick={agregar} className="inline-flex items-center gap-1 text-sm font-medium text-[#AF9BEF] hover:underline">
            <Plus className="w-4 h-4" /> Agregar variable de control
          </button>
        </div>
      )}
    </div>
  );
}