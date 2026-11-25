import React, { useState } from "react";
import { Loader2, Mail, UserMinus, UserPlus } from "lucide-react";
import { cursosClient } from "@/api/cursosClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROLES } from "@/lib/permisos";
import { useToast } from "@/components/ui/use-toast";
import ListaSeleccionUsuarios from "@/components/cursos/ListaSeleccionUsuarios";

// `usuarios` ya viene limitado a la institución del curso (ver CursoDetalle).
export default function IntegrantesPanel({ curso, inscripciones, usuarios, puedeGestionar, onChange }) {
  const { toast } = useToast();
  // Rol que se está seleccionando en el diálogo (DOCENTE o ESTUDIANTE), o null si está cerrado.
  const [seleccionando, setSeleccionando] = useState(null);
  const [seleccion, setSeleccion] = useState([]);
  const [agregando, setAgregando] = useState(false);

  const inscripto = (u) => inscripciones.some((i) => i.usuario_id === u.id);
  const integrantes = usuarios.filter(inscripto);
  const docentes = integrantes.filter((u) => u.rol === ROLES.DOCENTE);
  const alumnos = integrantes.filter((u) => u.rol === ROLES.ESTUDIANTE);
  const disponibles = (rol) => usuarios.filter((u) => u.rol === rol && !inscripto(u));

  const textos = {
    [ROLES.DOCENTE]: { titulo: "Seleccionar docentes", singular: "docente", plural: "docentes" },
    [ROLES.ESTUDIANTE]: { titulo: "Seleccionar alumnos", singular: "alumno", plural: "alumnos" },
  };

  function abrir(rol) {
    setSeleccion([]);
    setSeleccionando(rol);
  }

  async function agregarSeleccionados() {
    if (seleccion.length === 0) return;
    setAgregando(true);
    try {
      await cursosClient.agregarIntegrantes(curso.id, seleccion);
      const t = textos[seleccionando];
      toast({
        title:
          seleccion.length === 1
            ? `Se agregó 1 ${t.singular}`
            : `Se agregaron ${seleccion.length} ${t.plural}`,
      });
      setSeleccionando(null);
      onChange();
    } catch (e) {
      toast({ title: "No se pudo agregar", description: e.message, variant: "destructive" });
    } finally {
      setAgregando(false);
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
    try {
      await cursosClient.quitarIntegrante(curso.id, u.id);
      toast({ title: "Integrante eliminado" });
      onChange();
    } catch (e) {
      toast({ title: "No se pudo eliminar", description: e.message, variant: "destructive" });
    }
  }

  function renderGrupo(titulo, lista, rol, etiqueta) {
    const libres = disponibles(rol);
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
              <div className="min-w-0">
                <p className="truncate font-medium">{u.nombre_completo}</p>
                <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0" /> {u.email}
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
          <Button
            variant="outline"
            onClick={() => abrir(rol)}
            disabled={libres.length === 0}
            className="mt-4 w-full gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {libres.length === 0
              ? `No hay ${textos[rol].plural} para agregar`
              : `${textos[rol].titulo} (${libres.length} disponibles)`}
          </Button>
        )}
      </div>
    );
  }

  const t = seleccionando ? textos[seleccionando] : null;

  return (
    <section>
      <h2 className="font-heading text-2xl font-semibold">Integrantes</h2>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {renderGrupo("Docentes", docentes, ROLES.DOCENTE, "Docente")}
        {renderGrupo("Alumnos", alumnos, ROLES.ESTUDIANTE, "Estudiante")}
      </div>

      <Dialog open={Boolean(seleccionando)} onOpenChange={(o) => !o && !agregando && setSeleccionando(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t?.titulo}</DialogTitle>
            <DialogDescription>
              {t && `Se muestran los ${t.plural} de ${curso.institucion} que todavía no están en el curso.`}
            </DialogDescription>
          </DialogHeader>
          {seleccionando && (
            <ListaSeleccionUsuarios
              usuarios={disponibles(seleccionando)}
              seleccion={seleccion}
              onChange={setSeleccion}
              vacio={`No hay ${t.plural} para agregar.`}
              placeholder={`Buscar ${t.singular} por nombre o email…`}
              disabled={agregando}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeleccionando(null)} disabled={agregando}>
              Cancelar
            </Button>
            <Button onClick={agregarSeleccionados} disabled={seleccion.length === 0 || agregando} className="gap-2">
              {agregando && <Loader2 className="w-4 h-4 animate-spin" />}
              Agregar {seleccion.length > 0 ? `(${seleccion.length})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
