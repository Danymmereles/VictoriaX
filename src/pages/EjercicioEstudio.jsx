import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lock, FileText, BarChart3 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSesionUsuario } from "@/lib/sesionUsuario";
import { ROLES } from "@/lib/permisos";
import { analisisVacio } from "@/lib/analisisPrevio";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import AnalisisPrevioPanel from "@/components/analisis/AnalisisPrevioPanel";
import ResolucionEjemplo from "@/components/estudio/ResolucionEjemplo";
import EstadisticasPlaceholder from "@/components/estudio/EstadisticasPlaceholder";

export default function EjercicioEstudio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useSesionUsuario();
  const [ejercicio, setEjercicio] = useState(null);
  const [entrega, setEntrega] = useState(null);
  const [analisis, setAnalisis] = useState(analisisVacio());
  const [validacion, setValidacion] = useState({ errores: [], esValido: false });
  const [mostrarResolucion, setMostrarResolucion] = useState(false);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);

  useEffect(() => {
    if (!usuario) navigate("/login");
  }, [usuario, navigate]);

  useEffect(() => {
    if (!usuario) return;
    (async () => {
      const ej = await base44.entities.Ejercicio.get(id);
      setEjercicio(ej);
      const existentes = await base44.entities.Entrega.filter({ usuario_id: usuario.id, ejercicio_id: id });
      if (existentes[0]) {
        setEntrega(existentes[0]);
        setAnalisis(existentes[0].analisis_previo || analisisVacio());
        setMostrarResolucion(Boolean(existentes[0].resolucion_vista));
      } else {
        const creada = await base44.entities.Entrega.create({
          usuario_id: usuario.id,
          ejercicio_id: id,
          analisis_previo: analisisVacio(),
          entregado: false,
          resolucion_vista: false,
        });
        setEntrega(creada);
      }
    })();
  }, [usuario, id]);

  useEffect(() => {
    if (!entrega) return;
    const timeout = setTimeout(() => {
      base44.entities.Entrega.update(entrega.id, { analisis_previo: analisis });
    }, 600);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analisis, entrega?.id]);

  if (!usuario || !ejercicio || !entrega) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <main className="mx-auto max-w-5xl px-6 py-32 text-center text-muted-foreground">Cargando ejercicio…</main>
        <Footer />
      </div>
    );
  }

  const esDocenteOAdmin = usuario.rol === ROLES.DOCENTE || usuario.rol === ROLES.ADMINISTRADOR;
  const bloqueado = entrega.resolucion_vista && usuario.rol === ROLES.ESTUDIANTE;
  const puedeEntregar = validacion.esValido && !bloqueado;

  async function entregar() {
    const actualizada = await base44.entities.Entrega.update(entrega.id, {
      analisis_previo: analisis,
      entregado: true,
    });
    setEntrega(actualizada);
  }

  async function toggleResolucion() {
    const nuevo = !mostrarResolucion;
    setMostrarResolucion(nuevo);
    if (nuevo && usuario.rol === ROLES.ESTUDIANTE && !entrega.resolucion_vista) {
      const actualizada = await base44.entities.Entrega.update(entrega.id, { resolucion_vista: true });
      setEntrega(actualizada);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link to="/modo-estudio" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Volver al listado
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">Ejercicio Nº {ejercicio.numero}</p>
        <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">{ejercicio.titulo}</h1>

        <article
          className="prose prose-sm sm:prose-base dark:prose-invert mt-8 max-w-none rounded-2xl border border-border bg-card/40 p-6"
          dangerouslySetInnerHTML={{ __html: ejercicio.consigna_html }}
        />

        <section className="mt-10">
          <h2 className="font-heading text-2xl font-semibold">Análisis Previo</h2>
          {bloqueado && (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" /> Ya viste la resolución: el análisis quedó bloqueado.
            </p>
          )}
          <fieldset disabled={bloqueado} className="contents">
            <div className="mt-6">
              <AnalisisPrevioPanel analisis={analisis} setAnalisis={setAnalisis} onValidacionChange={setValidacion} />
            </div>
          </fieldset>
        </section>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6">
          <div className="text-sm text-muted-foreground">
            {bloqueado
              ? "El ejercicio está entregado y ya viste la resolución."
              : entrega.entregado
              ? "Entregado. Podés seguir modificando hasta ver la resolución."
              : puedeEntregar
              ? "Listo para entregar."
              : "Completá el análisis previo para poder entregar."}
          </div>
          {!bloqueado && (
            <button
              onClick={entregar}
              disabled={!puedeEntregar}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#73C3EE] via-[#AF9BEF] to-[#EA84B4] px-7 py-3 text-sm font-medium text-[#0A0D14] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> {entrega.entregado ? "Actualizar entrega" : "Entregar"}
            </button>
          )}
        </div>

        {(entrega.entregado || esDocenteOAdmin) && (
          <div className="mt-6 flex flex-wrap gap-4">
            <button onClick={toggleResolucion} className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm hover:border-[#AF9BEF]">
              <FileText className="w-4 h-4" /> {mostrarResolucion ? "Ocultar resolución" : "Ver resolución"}
            </button>
            {esDocenteOAdmin && (
              <button onClick={() => setMostrarEstadisticas((v) => !v)} className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm hover:border-[#AF9BEF]">
                <BarChart3 className="w-4 h-4" /> Estadísticas
              </button>
            )}
          </div>
        )}

        {mostrarResolucion && <ResolucionEjemplo />}
        {mostrarEstadisticas && <EstadisticasPlaceholder />}
      </main>
      <Footer />
    </div>
  );
}