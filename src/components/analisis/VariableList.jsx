import React, { useState } from "react";
import { Plus, Trash2, Settings } from "lucide-react";
import { nuevaVariable } from "@/lib/analisisPrevio";
import VectorConfigDialog from "./VectorConfigDialog";

// Lista reutilizable de variables. `permitirVector` habilita configuración vectorial.
export default function VariableList({ titulo, variables, onChange, permitirVector = false, controlVars = [] }) {
  const [vectorPara, setVectorPara] = useState(null);

  function actualizar(i, patch) {
    onChange(variables.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }
  function quitar(i) {
    onChange(variables.filter((_, idx) => idx !== i));
  }
  function agregar() {
    onChange([...variables, nuevaVariable()]);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-lg font-semibold">{titulo}</h4>
        <button onClick={agregar} className="inline-flex items-center gap-1 text-sm font-medium text-[#AF9BEF] hover:underline">
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {variables.length === 0 && <p className="text-sm text-muted-foreground">Sin variables.</p>}
        {variables.map((v, i) => (
          <div key={v.id} className="rounded-xl border border-border bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-[120px_1fr_auto]">
              <input value={v.sigla} onChange={(e) => actualizar(i, { sigla: e.target.value })} placeholder="Siglas" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <input value={v.descripcion} onChange={(e) => actualizar(i, { descripcion: e.target.value })} placeholder="Descripción" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <button onClick={() => quitar(i)} className="grid place-items-center rounded-lg border border-border px-3 hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {permitirVector && (
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={v.esVector}
                    onChange={() => (v.esVector ? actualizar(i, { esVector: false, dimension: null }) : setVectorPara(i))}
                  />{" "}
                  Es vector
                </label>
                {v.esVector && (
                  <button onClick={() => setVectorPara(i)} className="inline-flex items-center gap-1 text-sm text-[#AF9BEF] hover:underline">
                    <Settings className="w-4 h-4" /> {v.dimension ? "Editar dimensión" : "Configurar dimensión"}
                  </button>
                )}
                {v.esVector && v.dimension && (
                  <span className="text-xs text-muted-foreground">
                    Dim: {v.dimension.tipo === "fijo" ? v.dimension.valor : `var ${v.dimension.variableControl}`}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <VectorConfigDialog
        open={vectorPara !== null}
        dimension={vectorPara !== null ? variables[vectorPara]?.dimension : null}
        controlVars={controlVars}
        onClose={() => setVectorPara(null)}
        onConfirm={(dim) => {
          actualizar(vectorPara, { esVector: true, dimension: dim });
          setVectorPara(null);
        }}
      />
    </div>
  );
}