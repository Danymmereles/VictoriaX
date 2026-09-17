import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PERIODOS, periodoAbrev, anioLectivo } from "@/lib/cursos";
import { ROLES } from "@/lib/permisos";

export default function CursoForm({ open, onClose, onSave, curso = null, usuarios = [] }) {
  const esCrear = !curso;
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [periodo, setPeriodo] = useState("CUAT1");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [forzarCierre, setForzarCierre] = useState(false);
  const [docentesSel, setDocentesSel] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setCodigo(curso?.codigo || "");
      setNombre(curso?.nombre || "");
      setPeriodo(curso?.periodo_lectivo || "CUAT1");
      setFechaInicio(curso?.fecha_inicio ? String(curso.fecha_inicio).slice(0, 10) : "");
      setFechaFinal(curso?.fecha_final ? String(curso.fecha_final).slice(0, 10) : "");
      setForzarCierre(Boolean(curso?.forzar_cierre));
      setDocentesSel([]);
      setError("");
    }
  }, [open, curso]);

  const docentes = usuarios.filter((u) => u.rol === ROLES.DOCENTE);

  function toggleDocente(id) {
    setDocentesSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function previsual() {
    if (nombre.trim()) return nombre.trim();
    return [codigo, periodoAbrev(periodo), fechaInicio ? anioLectivo({ fecha_inicio: fechaInicio }) : ""]
      .filter(Boolean)
      .join(" - ");
  }

  function submit() {
    if (!codigo.trim()) return setError("El código es obligatorio.");
    if (!periodo) return setError("Seleccioná un período lectivo.");
    if (!fechaInicio || !fechaFinal) return setError("Las fechas de inicio y final son obligatorias.");
    if (new Date(fechaFinal) < new Date(fechaInicio))
      return setError("La fecha final no puede ser anterior a la de inicio.");
    if (esCrear && docentesSel.length === 0)
      return setError("El curso debe tener al menos un docente integrante.");
    onSave(
      {
        codigo: codigo.trim(),
        nombre: nombre.trim() || null,
        periodo_lectivo: periodo,
        fecha_inicio: fechaInicio,
        fecha_final: fechaFinal,
        forzar_cierre: forzarCierre,
      },
      esCrear ? docentesSel : null
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{esCrear ? "Crear curso" : "Editar curso"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Código del curso</Label>
            <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej. K4651" />
          </div>
          <div>
            <Label>Nombre personalizado (opcional)</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Dejar vacío para usar el nombre automático"
            />
            {codigo && (
              <p className="mt-1 text-xs text-muted-foreground">
                Vista previa: <span className="font-medium">{previsual()}</span>
              </p>
            )}
          </div>
          <div>
            <Label>Período lectivo</Label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODOS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha de inicio</Label>
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div>
              <Label>Fecha de final</Label>
              <Input type="date" value={fechaFinal} onChange={(e) => setFechaFinal(e.target.value)} />
            </div>
          </div>
          {!esCrear && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Forzar cierre anticipado</p>
                <p className="text-xs text-muted-foreground">
                  Marca el curso como no vigente sin esperar a la fecha final.
                </p>
              </div>
              <Switch checked={forzarCierre} onCheckedChange={setForzarCierre} />
            </div>
          )}
          {esCrear && (
            <div>
              <Label>Docentes integrantes (obligatorio al menos uno)</Label>
              <div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {docentes.length === 0 && (
                  <p className="p-2 text-sm text-muted-foreground">No hay usuarios con rol docente.</p>
                )}
                {docentes.map((d) => (
                  <label
                    key={d.id}
                    className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-muted/40"
                  >
                    <input
                      type="checkbox"
                      checked={docentesSel.includes(d.id)}
                      onChange={() => toggleDocente(d.id)}
                      className="h-4 w-4 accent-[#AF9BEF]"
                    />
                    <span className="text-sm">{d.nombre_completo}</span>
                    <span className="text-xs text-muted-foreground">{d.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit}>{esCrear ? "Crear" : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}