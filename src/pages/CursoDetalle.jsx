import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSesionUsuario } from "@/lib/sesionUsuario";
import { ROLES } from "@/lib/permisos";
import { nombreCurso, esVigente, periodoLabel, anioLectivo } from "@/lib/cursos";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import IntegrantesPanel from "@/components/cursos/IntegrantesPanel";
import EstadisticasCurso from "@/components/cursos/EstadisticasCurso";
import AvanceEstudiante from "@/components/cursos/AvanceEstudiante";
import ResolucionEstudiante from "@/components/cursos/ResolucionEstudiante";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function CursoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, permisos } = useSesionUsuario();
  const [curso, setCurso] = useState(null);
  const [inscripciones, setInscripciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ejercicios, setEjercicios] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [cargado, setCargado] = useState(false);
  const [resolucion, setResolucion] = useState(null);

  async function cargar() {
    const c = await base44.entities.Curso.get(id);
    setCurso(c);
    const ins = await base44.entities.Inscripcion.filter({ curso_id: id });
    setInscripciones(ins);
    const us = await base44.entities.Usuario.list();
    setUsuarios(us);
    const ejs = await base44.entities.Ejercicio.list("numero");
    setEjercicios(ejs);
    const alumnoIds = us
      .filter((u) => ins.some((i) => i.usuario_id === u.id) && u.rol === ROLES.ESTUDIANTE)
      .map((u) => u.id);
    if (alumnoIds.length) {
      const ents = await base44.entities.Entrega.filter({ usuario_id: { $in: alumnoIds } }, undefined, 1000);
      setEntregas(ents);
    }
    setCargado(true);
  }

  useEffect(() => {
    if (!usuario) {
      navigate("/login");
      return;
    }
    cargar();
  }, [usuario, id]);

  useEffect(() => {
    if (cargado && usuario && curso) {
      const esMiembro = inscripciones.some((i) => i.usuario_id === usuario.id);
      if (!permisos?.puedoVerTodosLosCursos && !esMiembro) navigate("/cursos");
    }
  }, [cargado, usuario, curso, inscripciones]);

  if (!usuario) return null;
  if (!curso)
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <main className="mx-auto max-w-5xl px-6 py-32 text-center text-muted-foreground">Cargando curso…</main>
        <Footer />
      </div>
    );

  const esAdmin = Boolean(permisos?.puedoVerTodosLosCursos);
  const esEstudiante = usuario.rol === ROLES.ESTUDIANTE;
  const docentes = usuarios.filter(
    (u) => inscripciones.some((i) => i.usuario_id === u.id) && u.rol === ROLES.DOCENTE
  );
  const alumnos = usuarios.filter(
    (u) => inscripciones.some((i) => i.usuario_id === u.id) && u.rol === ROLES.ESTUDIANTE
  );
  const puedeGestionar =
    permisos?.puedoGestionarIntegrantes &&
    (esAdmin || inscripciones.some((i) => i.usuario_id === usuario.id));

  function verResolucion(entrega, alumno, ejercicio) {
    setResolucion({ entrega, alumno, ejercicio });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <button
          onClick={() => navigate("/cursos")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a cursos
        </button>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Curso</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">{nombreCurso(curso)}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {curso.codigo} · {periodoLabel(curso.periodo_lectivo)} · {anioLectivo(curso)}
            </p>
          </div>
          {esAdmin && (
            <Badge variant={esVigente(curso) ? "default" : "secondary"}>
              {esVigente(curso) ? "Vigente" : "No vigente"}
            </Badge>
          )}
        </div>

        {esEstudiante ? (
          <section className="mt-10">
            <h2 className="font-heading text-2xl font-semibold">Docentes del curso</h2>
            <p className="mt-1 text-sm text-muted-foreground">Contacto con los docentes a cargo.</p>
            <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
              {docentes.length === 0 && <p className="p-6 text-sm text-muted-foreground">Sin docentes asignados.</p>}
              {docentes.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-medium">{d.nombre_completo}</p>
                    <p className="text-sm text-muted-foreground">{d.email}</p>
                  </div>
                  <Badge variant="outline">Docente</Badge>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <Tabs defaultValue="integrantes" className="mt-10">
            <TabsList>
              <TabsTrigger value="integrantes">Integrantes</TabsTrigger>
              <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
            </TabsList>
            <TabsContent value="integrantes" className="mt-6 space-y-10">
              <IntegrantesPanel
                curso={curso}
                inscripciones={inscripciones}
                usuarios={usuarios}
                puedeGestionar={puedeGestionar}
                onChange={cargar}
              />
              <section>
                <h2 className="font-heading text-2xl font-semibold">Avance por estudiante</h2>
                <p className="mt-1 text-sm text-muted-foreground">Estado de los ejercicios de cada alumno.</p>
                <div className="mt-6">
                  <AvanceEstudiante
                    alumnos={alumnos}
                    ejercicios={ejercicios}
                    entregas={entregas}
                    onVerResolucion={verResolucion}
                  />
                </div>
              </section>
            </TabsContent>
            <TabsContent value="estadisticas" className="mt-6">
              <section>
                <h2 className="font-heading text-2xl font-semibold">Estadísticas por ejercicio</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Resoluciones y accesos a la resolución por ejercicio.
                </p>
                <div className="mt-6">
                  <EstadisticasCurso
                    ejercicios={ejercicios}
                    alumnos={alumnos}
                    entregas={entregas}
                    onVerResolucion={verResolucion}
                  />
                </div>
              </section>
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
      <ResolucionEstudiante
        open={Boolean(resolucion)}
        onClose={() => setResolucion(null)}
        entrega={resolucion?.entrega}
        alumno={resolucion?.alumno}
        ejercicio={resolucion?.ejercicio}
      />
    </div>
  );
}