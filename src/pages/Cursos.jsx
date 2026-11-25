import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, GraduationCap, ArrowLeft } from "lucide-react";
import { cursosClient } from "@/api/cursosClient";
import { authClient } from "@/api/authClient";
import { institucionesClient } from "@/api/institucionesClient";
import { useSesionUsuario } from "@/lib/sesionUsuario";
import { nombreCurso, esVigente, periodoLabel, anioLectivo } from "@/lib/cursos";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import CursoForm from "@/components/cursos/CursoForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

export default function Cursos() {
  const navigate = useNavigate();
  const { usuario, permisos } = useSesionUsuario();
  const { toast } = useToast();
  const [cursos, setCursos] = useState(null);
  const [errorCarga, setErrorCarga] = useState("");
  // Super admin: ve los cursos de todas las instituciones y puede filtrar por una.
  const esSuper = Boolean(permisos?.puedoVerTodasLasInstituciones);
  const [institucionFiltro, setInstitucionFiltro] = useState("TODAS");
  const [instituciones, setInstituciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  useEffect(() => {
    if (!usuario) {
      navigate("/login");
      return;
    }
    // La API ya devuelve solo los cursos visibles para el usuario.
    cursosClient
      .list()
      .then(setCursos)
      .catch((e) => {
        setCursos([]);
        setErrorCarga(e.message || "No se pudieron cargar los cursos.");
      });
    // Los docentes disponibles para un curso nuevo (solo lo usa el administrador).
    authClient.listUsers().then(setUsuarios).catch(() => setUsuarios([]));
    if (permisos?.puedoVerTodasLasInstituciones) {
      institucionesClient.list().then(setInstituciones).catch(() => setInstituciones([]));
    }
  }, [usuario]);

  if (!usuario) return null;

  const esAdmin = Boolean(permisos?.puedoVerTodosLosCursos);
  const visibles = (cursos || []).filter(
    (c) => !esSuper || institucionFiltro === "TODAS" || c.institucion === institucionFiltro
  );
  const institucionesConCursos = [...new Set((cursos || []).map((c) => c.institucion))].sort((a, b) =>
    a.localeCompare(b, "es")
  );
  const filtrados = visibles.filter((c) => {
    const q = busqueda.toLowerCase();
    return nombreCurso(c).toLowerCase().includes(q) || (c.codigo || "").toLowerCase().includes(q);
  });

  async function recargar() {
    setCursos(await cursosClient.list());
  }

  async function guardar(data, docenteIds) {
    try {
      if (editando) {
        await cursosClient.update(editando.id, data);
      } else {
        // El curso y sus docentes se crean juntos.
        await cursosClient.create(data, docenteIds);
      }
      setFormOpen(false);
      setEditando(null);
      toast({ title: "Curso guardado" });
      recargar();
    } catch (e) {
      toast({ title: "No se pudo guardar", description: e.message, variant: "destructive" });
    }
  }

  async function eliminar() {
    const c = aEliminar;
    try {
      // Las inscripciones se borran junto con el curso.
      await cursosClient.remove(c.id);
      setAEliminar(null);
      toast({ title: "Curso eliminado" });
      recargar();
    } catch (e) {
      toast({ title: "No se pudo eliminar", description: e.message, variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Cursos</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            {esAdmin ? "Todos los cursos" : "Mis cursos"}
          </h1>
          {permisos?.puedoCrearCurso && (
            <Button
              onClick={() => {
                setEditando(null);
                setFormOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Crear curso
            </Button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o código…"
              className="pl-9"
            />
          </div>
          {esSuper && (
            <select
              value={institucionFiltro}
              onChange={(e) => setInstitucionFiltro(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Filtrar por institución"
            >
              <option value="TODAS">Todas las instituciones</option>
              {institucionesConCursos.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
          {cursos === null && <p className="p-6 text-sm text-muted-foreground">Cargando cursos…</p>}
          {errorCarga && <p className="p-6 text-sm text-destructive">{errorCarga}</p>}
          {cursos !== null && !errorCarga && filtrados.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">No se encontraron cursos.</p>
          )}
          {filtrados.map((c) => {
            const vig = esVigente(c);
            return (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <button onClick={() => navigate(`/cursos/${c.id}`)} className="flex items-center gap-4 text-left">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#AF9BEF]/15 text-muted-foreground">
                    <GraduationCap className="w-5 h-5" />
                  </span>
                  <span>
                    <span className="block font-medium">{nombreCurso(c)}</span>
                    <span className="block text-xs text-muted-foreground">
                      {c.codigo} · {periodoLabel(c.periodo_lectivo)} · {anioLectivo(c)}
                      {esSuper && <> · <span className="font-medium text-foreground/80">{c.institucion}</span></>}
                    </span>
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  {esAdmin && <Badge variant={vig ? "default" : "secondary"}>{vig ? "Vigente" : "No vigente"}</Badge>}
                  {permisos?.puedoEditarCurso && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditando(c);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  {permisos?.puedoEliminarCurso && (
                    <Button variant="ghost" size="icon" onClick={() => setAEliminar(c)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Link to="/" className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>
      </main>
      <Footer />

      <CursoForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditando(null);
        }}
        onSave={guardar}
        curso={editando}
        usuarios={usuarios}
        instituciones={instituciones}
        puedeElegirInstitucion={esSuper}
        institucionFija={usuario.institucion}
      />

      <AlertDialog open={Boolean(aEliminar)} onOpenChange={(o) => !o && setAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el curso?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará “{aEliminar ? nombreCurso(aEliminar) : ""}” y todos sus integrantes. Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={eliminar}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}