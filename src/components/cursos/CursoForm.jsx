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
import ListaSeleccionUsuarios from "@/components/cursos/ListaSeleccionUsuarios";

// Institución del curso:
//  - super admin (puedeElegirInstitucion): la elige al crear; recién ahí se listan sus docentes.
//  - admin: es la suya (institucionFija) y no se puede cambiar.
// Al editar se muestra la del curso, sin poder cambiarla.
export default function CursoForm({
  open,
  onClose,
  onSave,
  curso = null,
  usuarios = [],
  instituciones = [],
  puedeElegirInstitucion = false,
  institucionFija = "",
}) {
  const esCrear = !curso;
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [periodo, setPeriodo] = useState("CUAT1");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [forzarCierre, setForzarCierre] = useState(false);
  const [docentesSel, setDocentesSel] = useState([]);
  const eligeInstitucion = esCrear && puedeElegirInstitucion;
  const institucionInicial = curso?.institucion || (eligeInstitucion ? "" : institucionFija);
  const [institucion, setInstitucion] = useState(institucionInicial);
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
      setInstitucion(institucionInicial);
      setError("");
    }
  }, [open, curso, institucionInicial]);

  // Los docentes tienen que ser de la institución del curso.
  const docentes = institucion
    ? usuarios.filter((u) => u.rol === ROLES.DOCENTE && u.institucion === institucion)
    : [];

  function previsual() {
    if (nombre.trim()) return nombre.trim();
    return [codigo, periodoAbrev(periodo), fechaInicio ? anioLectivo({ fecha_inicio: fechaInicio }) : ""]
      .filter(Boolean)
      .join(" - ");
  }

  function submit() {
    if (eligeInstitucion && !institucion) return setError("Elegí la institución del curso.");
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
        ...(eligeInstitucion ? { institucion } : {}),
      },
      esCrear ? docentesSel : null
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{esCrear ? "Crear curso" : "Editar curso"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Institución</Label>
            {eligeInstitucion ? (
              <Select
                value={institucion}
                onValueChange={(v) => {
                  setInstitucion(v);
                  setDocentesSel([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elegí una institución" />
                </SelectTrigger>
                <SelectContent>
                  {instituciones.map((inst) => (
                    <SelectItem key={inst} value={inst}>
                      {inst}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={institucion} disabled readOnly />
            )}
          </div>
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
              <div className="mt-2">
                {institucion ? (
                  <ListaSeleccionUsuarios
                    usuarios={docentes}
                    seleccion={docentesSel}
                    onChange={setDocentesSel}
                    vacio={`No hay docentes en ${institucion}.`}
                    placeholder="Buscar docente por nombre o email…"
                  />
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Elegí una institución para ver sus docentes.
                  </p>
                )}
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