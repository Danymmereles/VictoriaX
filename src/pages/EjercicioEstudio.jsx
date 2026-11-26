import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lock, FileText } from "lucide-react";
import { ejerciciosClient } from "@/api/ejerciciosClient";
import { resolucionesClient, ESTADOS } from "@/api/resolucionesClient";
import { useSesionUsuario } from "@/lib/sesionUsuario";
import { useGuardadoResolucion } from "@/lib/useGuardadoResolucion";
import { ROLES } from "@/lib/permisos";
import { analisisVacio } from "@/lib/analisisPrevio";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import AnalisisPrevioPanel from "@/components/analisis/AnalisisPrevioPanel";
import ResolucionEjemplo from "@/components/estudio/ResolucionEjemplo";
import NavegacionEjercicio from "@/components/estudio/NavegacionEjercicio";

export default function EjercicioEstudio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, permisos } = useSesionUsuario();
  const esSuper = Boolean(permisos?.puedoVerTodasLasInstituciones);
  const [ejercicio, setEjercicio] = useState(null);
  const [analisis, setAnalisis] = useState(analisisVacio());
  const [validacion, setValidacion] = useState({ errores: [], esValido: false });
  const [mostrarResolucion, setMostrarResolucion] = useState(false);
  const [guia, setGuia] = useState([]);
  const [errorEjercicio, setErrorEjercicio] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  // El análisis previo se guarda en MySQL; la resolución se crea al primer cambio.
  const { resolucion, error: errorGuardado, activo: guardadoActivo, iniciar, detener, guardar } =
    useGuardadoResolucion(analisis);

  useEffect(() => {
    if (!usuario) navigate("/login");
  }, [usuario, navigate]);

  // La navegación anterior/siguiente recorre la guía de la institución del ejercicio
  // (para el super admin puede ser otra que la suya).
  const institucionEjercicio = ejercicio?.institucion;
  useEffect(() => {
    if (!usuario || !institucionEjercicio) return;
    ejerciciosClient
      .list({ descendente: true, institucion: institucionEjercicio })
      .then(setGuia)
      .catch(() => setGuia([]));
  }, [usuario, institucionEjercicio]);

  useEffect(() => {
    if (!usuario) return undefined;
    let cancelado = false;
    // Lo que haya quedado sin guardar del ejercicio anterior se envía antes de cambiar.
    detener();
    setEjercicio(null);
    setErrorEjercicio("");
    setErrorCarga("");
    setAnalisis(analisisVacio());
    setMostrarResolucion(false);
    (async () => {
      try {
        const ej = await ejerciciosClient.get(id);
        if (cancelado) return;
        setEjercicio(ej);
      } catch (error) {
        if (!cancelado) setErrorEjercicio(error.message || "No se pudo cargar el ejercicio.");
        return;
      }
      try {
        const existente = await resolucionesClient.porEjercicio(id);
        if (cancelado) return;
        if (existente) {
          setAnalisis(existente.analisis);
          setMostrarResolucion(existente.estado === ESTADOS.FINALIZADO);
        }
        iniciar({ resolucion: existente, idEjercicio: id });
      } catch {
        // Sin conexión con las resoluciones igual se puede resolver, pero no se guarda.
        if (!cancelado) {
          setErrorCarga(
            "No se pudo cargar tu resolución: podés resolver el análisis previo, pero tu progreso no se va a guardar ni se puede entregar.",
          );
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [usuario, id, iniciar, detener]);

  if (!usuario || !ejercicio || (!guardadoActivo && !errorCarga)) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <main className="mx-auto max-w-5xl px-6 py-32 text-center text-muted-foreground">
          {errorEjercicio ? (
            <>
              <p>{errorEjercicio}</p>
              <Link to="/modo-estudio" className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                <ArrowLeft className="w-4 h-4" /> Volver al listado
              </Link>
            </>
          ) : (
            "Cargando ejercicio…"
          )}
        </main>
        <Footer />
      </div>
    );
  }

  const esDocenteOAdmin =
    usuario.rol === ROLES.DOCENTE || usuario.rol === ROLES.ADMINISTRADOR || esSuper;
  const listado = esSuper
    ? `/modo-estudio?institucion=${encodeURIComponent(ejercicio.institucion)}`
    : "/modo-estudio";
  const estado = resolucion?.estado ?? ESTADOS.BORRADOR;
  const entregado = estado === ESTADOS.ENTREGADO || estado === ESTADOS.FINALIZADO;
  const bloqueado = estado === ESTADOS.FINALIZADO;
  const puedeEntregar = guardadoActivo && validacion.esValido && !bloqueado;

  const ordenados = [...guia].sort((a, b) => a.numero - b.numero);
  const indice = ordenados.findIndex((e) => e.id === id);
  const anterior = indice > 0 ? ordenados[indice - 1] : null;
  const siguiente = indice >= 0 && indice < ordenados.length - 1 ? ordenados[indice + 1] : null;

  // Los errores de guardado ya se muestran con errorGuardado.
  async function entregar() {
    await guardar(analisis, ESTADOS.ENTREGADO).catch(() => {});
  }

  // Un estudiante que ve la resolución deja su análisis FINALIZADO (bloqueado).
  async function toggleResolucion() {
    const nuevo = !mostrarResolucion;
    if (nuevo && usuario.rol === ROLES.ESTUDIANTE && estado === ESTADOS.ENTREGADO) {
      try {
        await guardar(analisis, ESTADOS.FINALIZADO);
      } catch {
        return;
      }
    }
    setMostrarResolucion(nuevo);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link to={listado} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Volver al listado
        </Link>

        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Ejercicio Nº {ejercicio.numero}
          {esSuper && <span className="normal-case tracking-normal"> · {ejercicio.institucion}</span>}
        </p>
        <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">{ejercicio.titulo}</h1>

        <article
          className="mt-8 max-w-none rounded-2xl border border-border bg-card/40 p-6 text-[15px] leading-relaxed text-foreground/90 [&_p]:mt-4 [&_p]:first:mt-0 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-2 [&_li]:pl-1 [&_li]:marker:text-primary [&_ul_ul]:mt-2 [&_ul_ul]:pl-5 [&_ul_ul_li]:mt-1 [&_ul_ul_li]:text-[14px] [&_table]:mt-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_img]:mt-4 [&_img]:w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-border/60"
          dangerouslySetInnerHTML={{ __html: ejercicio.consigna_html }}
        />

        <section className="mt-10">
          <h2 className="font-heading text-2xl font-semibold">Análisis Previo</h2>
          {(errorCarga || errorGuardado) && (
            <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm text-amber-700 dark:text-amber-300">
              {errorCarga || `No se pudo guardar tu progreso: ${errorGuardado}`}
            </p>
          )}
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

        {guardadoActivo && (
          <>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6">
              <div className="text-sm text-muted-foreground">
                {bloqueado
                  ? "El ejercicio está entregado y ya viste la resolución."
                  : entregado
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
                  <CheckCircle2 className="w-4 h-4" /> {entregado ? "Actualizar entrega" : "Entregar"}
                </button>
              )}
            </div>

            {(entregado || esDocenteOAdmin) && (
              <div className="mt-6 flex flex-wrap gap-4">
                <button onClick={toggleResolucion} className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm hover:border-[#AF9BEF]">
                  <FileText className="w-4 h-4" /> {mostrarResolucion ? "Ocultar resolución" : "Ver resolución"}
                </button>
              </div>
            )}

            {mostrarResolucion && <ResolucionEjemplo numero={ejercicio.numero} />}
          </>
        )}

        {guia.length > 0 && <NavegacionEjercicio anterior={anterior} siguiente={siguiente} />}
      </main>
      <Footer />
    </div>
  );
}