import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import {
  analisisVacio,
  validarAnalisis,
  camposConError,
  erroresPorCampo,
  claveEventoFuturo,
  eventosVacio,
  METODOLOGIAS
} from "@/lib/analisisPrevio";
import { cargarAnalisis, guardarAnalisis, limpiarAnalisis } from "@/lib/analisisPrevioStorage";
import { resolucionesClient } from "@/api/resolucionesClient";
import { useSesionUsuario } from "@/lib/sesionUsuario";
import { useGuardadoResolucion } from "@/lib/useGuardadoResolucion";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import MetodologiaSelector from "@/components/analisis/MetodologiaSelector";
import VariableList from "@/components/analisis/VariableList";
import TablaEventos from "@/components/analisis/TablaEventos";
import EventosFuturos from "@/components/analisis/EventosFuturos";
import AdvertenciasDialog from "@/components/analisis/AdvertenciasDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function ModoLibre() {
  const navigate = useNavigate();
  const [analisis, setAnalisis] = useState(() => cargarAnalisis() || analisisVacio());
  const [mostrarImplicita, setMostrarImplicita] = useState(false);
  const [mostrarAdvertencias, setMostrarAdvertencias] = useState(false);

  const [errorCarga, setErrorCarga] = useState("");
  const { usuario } = useSesionUsuario();
  const idUsuario = usuario?.id;
  const { error: errorGuardado, iniciar, detener } = useGuardadoResolucion(analisis);

  // El navegador guarda siempre una copia: la usa el diagrama y sirve sin sesión.
  useEffect(() => {
    guardarAnalisis(analisis);
  }, [analisis]);

  // Con sesión, el análisis se guarda en MySQL (ANALISIS_PREVIO + RESOLUCION sin ejercicio)
  // y se retoma el último del Modo Libre.
  useEffect(() => {
    detener();
    setErrorCarga("");
    if (!idUsuario) return undefined;
    let cancelado = false;
    resolucionesClient
      .ultimaLibre()
      .then((ultima) => {
        if (cancelado) return;
        if (ultima) setAnalisis(ultima.analisis);
        iniciar({ resolucion: ultima });
      })
      .catch(() => {
        if (!cancelado) setErrorCarga("No se pudo conectar con el servidor: el análisis se guarda solo en este navegador.");
      });
    return () => {
      cancelado = true;
    };
  }, [idUsuario, iniciar, detener]);

  const validacion = useMemo(() => validarAnalisis(analisis), [analisis]);
  const campos = useMemo(() => camposConError(validacion), [validacion]);
  const controlVacio = analisis.variables.control.length === 0;

  const idsConError = (lista) => lista.filter((v) => campos.has(`variable:${v.id}`)).map((v) => v.id);
  // Motivo de cada error, por id (para mostrar por qué una sigla no es válida)
  const porCampo = useMemo(() => erroresPorCampo(validacion), [validacion]);
  const erroresDe = (lista, clave) =>
    Object.fromEntries(lista.map((x, i) => [x.id, porCampo.get(clave(x, i))]).filter(([, e]) => e));
  const erroresVariables = (lista) => erroresDe(lista, (v) => `variable:${v.id}`);
  const erroresFuturos = erroresDe(analisis.eventosFuturos || [], claveEventoFuturo);
  const filasConError = (analisis.eventos.filas || []).filter((f) => campos.has(`evento:${f.id}`)).map((f) => f.id);
  const variablesConError = [...campos].some((c) => c.startsWith("variables.") || c.startsWith("variable:"));

  function setMetodologia(m) {
    setAnalisis((a) => ({...a, metodologia: m, eventos: eventosVacio() }));
  }
  
  function setVariables(patch) {
    setAnalisis((a) => ({ ...a, variables: { ...a.variables, ...patch } }));
  }
  function setEventos(eventos) {
    setAnalisis((a) => ({ ...a, eventos }));
  }
  function setEventosFuturos(eventosFuturos) {
    setAnalisis((a) => ({ ...a, eventosFuturos }));
  }

  function continuarAlDiagrama() {
    if (validacion.advertencias.length > 0) {
      setMostrarAdvertencias(true);
      return;
    }
    navigate("/modo-libre/diagrama");
  }

  function irADiagrama() {
    if (controlVacio) {
      setMostrarImplicita(true);
      return;
    }
    continuarAlDiagrama();
  }

  function reiniciar() {
    const mensaje = idUsuario
      ? "¿Empezar un análisis previo nuevo? El actual queda guardado en tu cuenta."
      : "¿Reiniciar el análisis previo? Se perderán los datos cargados.";
    if (window.confirm(mensaje)) {
      setAnalisis(analisisVacio());
      limpiarAnalisis();
      // El nuevo análisis crea otra resolución al primer cambio.
      if (idUsuario && !errorCarga) iniciar();
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Modo Libre · Etapa 1</p>
            <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">Análisis Previo</h1>
          </div>
          <button onClick={reiniciar} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <RotateCcw className="w-4 h-4" /> Reiniciar
          </button>
        </div>

        <Pasos activo={1} />

        {(errorCarga || errorGuardado) && (
          <p className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm text-amber-700 dark:text-amber-300">
            {errorCarga || `No se pudo guardar el análisis en tu cuenta: ${errorGuardado}`}
          </p>
        )}

        <Seccion titulo="1 · Metodología" desc="Define la estructura de la tabla de eventos." error={campos.has("metodologia")}>
          <MetodologiaSelector value={analisis.metodologia} onChange={setMetodologia} error={campos.has("metodologia")} />
        </Seccion>

        <Seccion titulo="2 · Variables" desc="Exógenas (Datos y Control) y Endógenas (Estado y Resultado)." error={variablesConError}>
          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Exógenas</p>
              <div className="mt-4 grid gap-8 lg:grid-cols-2">
                <VariableList
                  titulo="Variables de Datos"
                  variables={analisis.variables.datos}
                  onChange={(datos) => setVariables({ datos })}
                  error={campos.has("variables.datos")}
                  idsConError={idsConError(analisis.variables.datos)}
                  errores={erroresVariables(analisis.variables.datos)}
                />
                <VariableList
                  titulo="Variables de Control"
                  variables={analisis.variables.control}
                  onChange={(control) => setVariables({ control })}
                  idsConError={idsConError(analisis.variables.control)}
                  errores={erroresVariables(analisis.variables.control)}
                />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Endógenas</p>
              <div className="mt-4 grid gap-8 lg:grid-cols-2">
                <VariableList
                  titulo="Variables de Estado"
                  variables={analisis.variables.estado}
                  onChange={(estado) => setVariables({ estado })}
                  permitirVector
                  controlVars={analisis.variables.control}
                  error={campos.has("variables.estado")}
                  idsConError={idsConError(analisis.variables.estado)}
                  errores={erroresVariables(analisis.variables.estado)}
                />
                <VariableList
                  titulo="Variables de Resultado"
                  variables={analisis.variables.resultado}
                  onChange={(resultado) => setVariables({ resultado })}
                  permitirVector
                  controlVars={analisis.variables.control}
                  error={campos.has("variables.resultado")}
                  idsConError={idsConError(analisis.variables.resultado)}
                  errores={erroresVariables(analisis.variables.resultado)}
                />
              </div>
            </div>
          </div>
        </Seccion>

        <Seccion titulo="3 · Tabla de Eventos" desc={analisis.metodologia === METODOLOGIAS.DELTA_T_CONSTANTE ? "Delta T Constante." : "Evento a Evento."} error={campos.has("eventos") || filasConError.length > 0}>
          <TablaEventos analisis={analisis} onChange={setEventos} error={campos.has("eventos")} filasConError={filasConError} />
        </Seccion>

        <Seccion titulo="4 · Tabla de Eventos Futuros" desc="Listado de siglas de tiempo ligadas a eventos." error={campos.has("eventosFuturos") || Object.keys(erroresFuturos).length > 0}>
          <EventosFuturos analisis={analisis} onChange={setEventosFuturos} errores={erroresFuturos} />
        </Seccion>

        <Validacion validacion={validacion} />

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6">
          <div className="text-sm text-muted-foreground">
            {validacion.esValido
              ? controlVacio
                ? "Listo. Falta confirmar la variable de control implícita."
                : "Análisis completo. Podés pasar a diagramar."
              : `Corregí ${validacion.errores.length} error(es) para continuar.`}
          </div>
          <button
            onClick={irADiagrama}
            disabled={!validacion.esValido}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#73C3EE] via-[#AF9BEF] to-[#EA84B4] px-7 py-3 text-sm font-medium text-[#0A0D14] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pasar a Diagramar <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
      <Footer />

      <AlertDialog open={mostrarImplicita} onOpenChange={setMostrarImplicita}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Variable de control implícita</AlertDialogTitle>
            <AlertDialogDescription>
              No cargaste ninguna variable de control. ¿Confirmás que la variable de control es implícita?
              Podés cancelar y cargar una.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver a editar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setMostrarImplicita(false); continuarAlDiagrama(); }}>Confirmar y diagramar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdvertenciasDialog
        open={mostrarAdvertencias}
        onOpenChange={setMostrarAdvertencias}
        advertencias={validacion.advertencias}
        onContinuar={() => navigate("/modo-libre/diagrama")}
      />
    </div>
  );
}

function Seccion({ titulo, desc, children, error = false }) {
  return (
    <section className={`mt-10 rounded-2xl border bg-card/40 p-6 ${error ? "border-destructive" : "border-border"}`}>
      <h2 className={`font-heading text-2xl font-semibold ${error ? "text-destructive" : ""}`}>{titulo}</h2>
      {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Pasos({ activo }) {
  const pasos = ["Análisis Previo", "Diagrama"];
  return (
    <div className="mt-8 flex items-center gap-3">
      {pasos.map((p, i) => {
        const n = i + 1;
        const esActivo = n === activo;
        return (
          <div key={p} className="flex items-center gap-3">
            <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-medium ${esActivo ? "bg-[#AF9BEF] text-[#0A0D14]" : "border border-border text-muted-foreground"}`}>{n}</span>
            <span className={`text-sm ${esActivo ? "font-medium text-foreground" : "text-muted-foreground"}`}>{p}</span>
            {i < pasos.length - 1 && <span className="h-px w-10 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

function Validacion({ validacion }) {
  if (validacion.errores.length === 0 && validacion.advertencias.length === 0) return null;
  return (
    <div className="mt-8 space-y-3">
      {validacion.errores.length > 0 && (
        <div className="rounded-xl border border-destructive/30 dark:border-destructive bg-destructive/5 dark:bg-destructive/20 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-destructive"><AlertTriangle className="w-4 h-4" /> Errores bloqueantes</p>
          <ul className="mt-2 list-disc pl-8 text-sm text-destructive/90">
            {validacion.errores.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
      {validacion.advertencias.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><AlertTriangle className="w-4 h-4" /> Advertencias</p>
          <ul className="mt-2 list-disc pl-8 text-sm text-muted-foreground">
            {validacion.advertencias.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
