import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Configura la dimensión de un vector: valor fijo o una variable de control declarada.
export default function VectorConfigDialog({ open, dimension, controlVars, onConfirm, onClose }) {
  const [tipo, setTipo] = useState(dimension?.tipo || "fijo");
  const [valor, setValor] = useState(dimension?.tipo === "fijo" ? dimension?.valor ?? "" : "");
  const [variableControl, setVariableControl] = useState(
    dimension?.tipo === "variable" ? dimension?.variableControl || "" : ""
  );

  useEffect(() => {
    setTipo(dimension?.tipo || "fijo");
    setValor(dimension?.tipo === "fijo" ? dimension?.valor ?? "" : "");
    setVariableControl(dimension?.tipo === "variable" ? dimension?.variableControl || "" : "");
  }, [dimension, open]);

  function confirmar() {
    onConfirm({ tipo, ...(tipo === "fijo" ? { valor } : { variableControl }) });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar dimensión del vector</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={tipo === "fijo"} onChange={() => setTipo("fijo")} /> Valor fijo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={tipo === "variable"} onChange={() => setTipo("variable")} /> Variable de control
            </label>
          </div>
          {tipo === "fijo" ? (
            <input
              type="number"
              min="1"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Dimensión"
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm"
            />
          ) : (
            <select
              value={variableControl}
              onChange={(e) => setVariableControl(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm"
            >
              <option value="">Seleccioná una variable de control</option>
              {controlVars.map((v) => (
                <option key={v.id} value={v.sigla}>{v.sigla}</option>
              ))}
            </select>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirmar}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}