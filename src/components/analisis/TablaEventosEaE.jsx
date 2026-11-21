import React, { useState } from "react";
import { Plus, Trash2, Settings } from "lucide-react";
import { nuevoEventoEaE } from "@/lib/analisisPrevio";
import VectorConfigDialog from "./VectorConfigDialog";
import ErrorBadge from "./ErrorBadge";

export default function TablaEventosEaE({ filas, onChange, controlVars, filasConError = [] }) {
  const [vectorPara, setVectorPara] = useState(null);

  function actualizar(i, patch) {
    onChange(filas.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function actualizarEvento(i, patch) {
    actualizar(i, { evento: { ...filas[i].evento, ...patch } });
  }
  function quitar(i) {
    onChange(filas.filter((_, idx) => idx !== i));
  }
  function agregar() {
    onChange([...filas, nuevoEventoEaE()]);
  }

  const declarados = filas.map((f) => f.evento?.nombre).filter((n) => n && n.trim());

  return (
    <div>
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-lg font-semibold">Evento a Evento</h4>
        <button onClick={agregar} className="inline-flex items-center gap-1 text-sm font-medium text-[#AF9BEF] hover:underline">
          <Plus className="w-4 h-4" /> Agregar fila
        </button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Evento</th>
              <th className="px-3 py-3">Futuro No Condicionado</th>
              <th className="px-3 py-3">Futuro Condicionado</th>
              <th className="px-3 py-3">Condición</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Sin filas.</td></tr>
            )}
            {filas.map((f, i) => {
              const conError = filasConError.includes(f.id);
              return (
                <tr key={f.id} className={`border-t border-border align-top ${conError ? "bg-destructive/5" : ""}`}>
                  <td className={`border-l-2 px-3 py-3 ${conError ? "border-l-destructive" : "border-l-transparent"}`}>
                    <div className="flex items-center gap-2">
                      <input
                        value={f.evento.nombre}
                        onChange={(e) => actualizarEvento(i, { nombre: e.target.value })}
                        placeholder="Nombre"
                        className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={f.evento.esVector}
                            onChange={() =>
                              f.evento.esVector
                                ? actualizarEvento(i, { esVector: false, dimension: null })
                                : setVectorPara(i)
                            }
                          />{" "}
                          Vector
                        </label>
                        {f.evento.esVector && (
                          <button onClick={() => setVectorPara(i)} className="inline-flex items-center gap-1 text-xs text-[#AF9BEF] hover:underline">
                            <Settings className="w-3 h-3" /> {f.evento.dimension ? "Editar" : "Configurar"}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <select value={f.futuroNoCond} onChange={(e) => actualizar(i, { futuroNoCond: e.target.value })} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                      <option value="">(vacío)</option>
                      {declarados.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <select value={f.futuroCond} onChange={(e) => actualizar(i, { futuroCond: e.target.value })} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                      <option value="">(vacío)</option>
                      {declarados.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <input value={f.condicion} onChange={(e) => actualizar(i, { condicion: e.target.value })} placeholder="Ej: E1 >= 5" className="w-full min-w-[10rem] rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex flex-col items-end gap-2">
                      {conError && <ErrorBadge>Revisá</ErrorBadge>}
                      <button onClick={() => quitar(i)} className="grid place-items-center rounded-lg border border-border px-2 py-2 hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <VectorConfigDialog
        open={vectorPara !== null}
        dimension={vectorPara !== null ? filas[vectorPara]?.evento.dimension : null}
        controlVars={controlVars}
        onClose={() => setVectorPara(null)}
        onConfirm={(dim) => {
          actualizarEvento(vectorPara, { esVector: true, dimension: dim });
          setVectorPara(null);
        }}
      />
    </div>
  );
}