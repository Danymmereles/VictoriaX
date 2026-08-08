import React, { useState } from "react";
import { Plus, Trash2, Settings } from "lucide-react";
import { nuevoEventoDeltaT } from "@/lib/analisisPrevio";
import VectorConfigDialog from "./VectorConfigDialog";

export default function TablaEventosDeltaT({ filas, onChange, controlVars }) {
  const [vectorPara, setVectorPara] = useState(null);

  function actualizar(i, patch) {
    onChange(filas.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function actualizarPropios(i, patch) {
    actualizar(i, { propios: { ...filas[i].propios, ...patch } });
  }
  function quitar(i) {
    onChange(filas.filter((_, idx) => idx !== i));
  }
  function agregar() {
    onChange([...filas, nuevoEventoDeltaT()]);
  }
  function actualizarLista(i, campo, idx, val) {
    actualizar(i, { [campo]: filas[i][campo].map((x, k) => (k === idx ? val : x)) });
  }
  function agregarALista(i, campo) {
    actualizar(i, { [campo]: [...filas[i][campo], ""] });
  }
  function quitarDeLista(i, campo, idx) {
    actualizar(i, { [campo]: filas[i][campo].filter((_, k) => k !== idx) });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-lg font-semibold">Delta T Constante</h4>
        <button onClick={agregar} className="inline-flex items-center gap-1 text-sm font-medium text-[#AF9BEF] hover:underline">
          <Plus className="w-4 h-4" /> Agregar fila
        </button>
      </div>
      <div className="mt-4 space-y-4">
        {filas.length === 0 && <p className="text-sm text-muted-foreground">Sin filas.</p>}
        {filas.map((f, i) => (
          <div key={f.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Fila {i + 1}</span>
              <button onClick={() => quitar(i)} className="inline-flex items-center gap-1 text-sm text-destructive hover:underline">
                <Trash2 className="w-4 h-4" /> Quitar fila
              </button>
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Eventos Propios</label>
                <input
                  value={f.propios.nombre}
                  onChange={(e) => actualizarPropios(i, { nombre: e.target.value })}
                  placeholder="Nombre"
                  className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <div className="mt-2 flex items-center gap-3">
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={f.propios.esVector}
                      onChange={() =>
                        f.propios.esVector
                          ? actualizarPropios(i, { esVector: false, dimension: null })
                          : setVectorPara(i)
                      }
                    />{" "}
                    Vector
                  </label>
                  {f.propios.esVector && (
                    <button onClick={() => setVectorPara(i)} className="inline-flex items-center gap-1 text-xs text-[#AF9BEF] hover:underline">
                      <Settings className="w-3 h-3" /> {f.propios.dimension ? "Editar" : "Configurar"}
                    </button>
                  )}
                </div>
              </div>
              <ListaEventos titulo="Comprometidos Anteriores" items={f.anteriores} onChange={(idx, v) => actualizarLista(i, "anteriores", idx, v)} onAdd={() => agregarALista(i, "anteriores")} onRemove={(idx) => quitarDeLista(i, "anteriores", idx)} />
              <ListaEventos titulo="Comprometidos Posteriores" items={f.posteriores} onChange={(idx, v) => actualizarLista(i, "posteriores", idx, v)} onAdd={() => agregarALista(i, "posteriores")} onRemove={(idx) => quitarDeLista(i, "posteriores", idx)} />
            </div>
          </div>
        ))}
      </div>

      <VectorConfigDialog
        open={vectorPara !== null}
        dimension={vectorPara !== null ? filas[vectorPara]?.propios.dimension : null}
        controlVars={controlVars}
        onClose={() => setVectorPara(null)}
        onConfirm={(dim) => {
          actualizarPropios(vectorPara, { esVector: true, dimension: dim });
          setVectorPara(null);
        }}
      />
    </div>
  );
}

function ListaEventos({ titulo, items, onChange, onAdd, onRemove }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{titulo}</label>
      <div className="mt-2 space-y-2">
        {items.length === 0 && <p className="text-xs text-muted-foreground">Sin eventos.</p>}
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input value={it} onChange={(e) => onChange(idx, e.target.value)} placeholder="Evento" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <button onClick={() => onRemove(idx)} className="grid place-items-center rounded-lg border border-border px-2 py-2 hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button onClick={onAdd} className="inline-flex items-center gap-1 text-xs text-[#AF9BEF] hover:underline">
          <Plus className="w-3 h-3" /> Agregar
        </button>
      </div>
    </div>
  );
}