import React, { useState } from "react";
import { Mail, UserMinus, UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ROLES } from "@/lib/permisos";
import { useToast } from "@/components/ui/use-toast";

export default function IntegrantesPanel({ curso, inscripciones, usuarios, puedeGestionar, onChange }) {
  const { toast } = useToast();
  const [nuevoDoc, setNuevoDoc] = useState("");
  const [nuevoAlu, setNuevoAlu] = useState("");

  const integrantes = usuarios.filter((u) => inscripciones.some((i) => i.usuario_id === u.id));
  const docentes = integrantes.filter((u) => u.rol === ROLES.DOCENTE);
  const alumnos = integrantes.filter((u) => u.rol === ROLES.ESTUDIANTE);
  const docentesDisp = usuarios.filter(
    (u) => u.rol === ROLES.DOCENTE && !inscripciones.some((i) => i.usuario_id === u.id)
  );
  const alumnosDisp = usuarios.filter(
    (u) => u.rol === ROLES.ESTUDIANTE && !inscripciones.some((i) => i.usuario_id === u.id)
  );

  async function agregar(uid, reset) {
    try {
      await base44.entities.Inscripcion.create({ curso_id: curso.id, usuario_id: uid });
      toast({ title: "Integrante agregado" });
      reset("");
      onChange();
    } catch {
      toast({ title: "No se pudo agregar", variant: "destructive" });
    }
  }

  async function eliminar(u) {
    if (u.rol === ROLES.DOCENTE && docentes.length <= 1) {
      toast({
        title: "No se puede eliminar",
        description: "El curso debe tener al menos un docente.",
        variant: "destructive",
      });
      return;
    }
    const insc = inscripciones.find((i) => i.usuario_id === u.id);
    try {
      await base44.entities.Inscripcion.delete(insc.id);
      toast({ title: "Integrante eliminado" });
      onChange();
    } catch {
      toast({ title: "No se pudo eliminar", variant: "destructive" });
    }
  }

  function renderGrupo(titulo, lista, disponibles, valor, setValor, etiqueta) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-xl font-semibold">{titulo}</h3>
          <Badge variant="outline">{lista.length}</Badge>
        </div>
        <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
          {lista.length === 0 && <p className="p-5 text-sm text-muted-foreground">Sin integrantes.</p>}
          {lista.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{u.nombre_completo}</p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" /> {u.email}
                </p>
              </div>
              {puedeGestionar ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => eliminar(u)}
                  disabled={u.rol === ROLES.DOCENTE && docentes.length <= 1}
                  title="Eliminar integrante"
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              ) : (
                <Badge variant="outline">{etiqueta}</Badge>
              )}
            </div>
          ))}
        </div>
        {puedeGestionar && (
          <div className="mt-4 flex gap-2">
            <Select value={valor} onValueChange={setValor}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={disponibles.length ? "Agregar integrante…" : "No hay disponibles"} />
              </SelectTrigger>
              <SelectContent>
                {disponibles.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nombre_completo} — {u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => valor && agregar(valor, setValor)} disabled={!valor} className="gap-2">
              <UserPlus className="w-4 h-4" /> Agregar
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <section>
      <h2 className="font-heading text-2xl font-semibold">Integrantes</h2>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {renderGrupo("Docentes", docentes, docentesDisp, nuevoDoc, setNuevoDoc, "Docente")}
        {renderGrupo("Alumnos", alumnos, alumnosDisp, nuevoAlu, setNuevoAlu, "Estudiante")}
      </div>
    </section>
  );
}