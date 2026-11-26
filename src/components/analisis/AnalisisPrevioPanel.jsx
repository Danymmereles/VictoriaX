import React, { useEffect, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { camposConError, claveEventoFuturo, erroresPorCampo, eventosVacio, idsEventosConError, validarAnalisis } from "@/lib/analisisPrevio";
import MetodologiaSelector from "./MetodologiaSelector";
import VariableList from "./VariableList";
import VariableControlImplicita from "./VariableControlImplicita";
import TablaEventos from "./TablaEventos";
import EventosFuturos from "./EventosFuturos";

// Panel de Análisis Previo reutilizable (Modo Estudio): mismas secciones y misma
// validación que el Modo Libre, pero con la variable de control resuelta con
// checkbox de "implícita" en vez del popup de confirmación al pasar a diagramar.
export default function AnalisisPrevioPanel({ analisis, setAnalisis, onValidacionChange }) {
  function setMetodologia(m) {
    // Al cambiar de metodología se vacían las tablas de eventos y de eventos futuros.
    setAnalisis((a) => (a.metodologia === m ? a : { ...a, metodologia: m, eventos: eventosVacio(), eventosFuturos: [] }));
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
  function setControlImplicita(controlImplicita) {
    setAnalisis((a) => ({ ...a, controlImplicita }));
  }

  const validacion = useMemo(() => validarAnalisis(analisis), [analisis]);
  const campos = useMemo(() => camposConError(validacion), [validacion]);
  const controlOk = Boolean(analisis.controlImplicita) || analisis.variables.control.length > 0;

  const idsConError = (lista) => lista.filter((v) => campos.has(`variable:${v.id}`)).map((v) => v.id);
  const filasConError = idsEventosConError(campos);
  const variablesConError = [...campos].some((c) => c.startsWith("variables.") || c.startsWith("variable:"));
  const porCampo = useMemo(() => erroresPorCampo(validacion), [validacion]);
  const erroresFuturos = Object.fromEntries(
    (analisis.eventosFuturos || [])
      .map((e, i) => [e.id, porCampo.get(claveEventoFuturo(e, i))])
      .filter(([, e]) => e)
  );

  useEffect(() => {
    onValidacionChange?.({ ...validacion, esValido: validacion.esValido && controlOk });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validacion, controlOk]);

  return (
    <div className="space-y-8">
      <Seccion titulo="Metodología" desc="Define la estructura de la tabla de eventos." error={campos.has("metodologia")}>
        <MetodologiaSelector value={analisis.metodologia} onChange={setMetodologia} error={campos.has("metodologia")} />
      </Seccion>

      <Seccion titulo="Variables" desc="Exógenas (Datos y Control) y Endógenas (Estado y Resultado)." error={variablesConError}>
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
              />
              <VariableControlImplicita
                variables={analisis.variables.control}
                onChange={(control) => setVariables({ control })}
                implicita={Boolean(analisis.controlImplicita)}
                onChangeImplicita={setControlImplicita}
                error={!controlOk}
                idsConError={idsConError(analisis.variables.control)}
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
              />
              <VariableList
                titulo="Variables de Resultado"
                variables={analisis.variables.resultado}
                onChange={(resultado) => setVariables({ resultado })}
                permitirVector
                controlVars={analisis.variables.control}
                error={campos.has("variables.resultado")}
                idsConError={idsConError(analisis.variables.resultado)}
              />
            </div>
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Tabla de Eventos Independientes" desc="Según la metodología seleccionada." error={campos.has("eventos") || filasConError.length > 0}>
        <TablaEventos analisis={analisis} onChange={setEventos} error={campos.has("eventos")} filasConError={filasConError} />
      </Seccion>

      <Seccion titulo="Tabla de Eventos Futuros" desc="Listado de siglas de tiempo ligadas a eventos." error={campos.has("eventosFuturos") || Object.keys(erroresFuturos).length > 0}>
        <EventosFuturos analisis={analisis} onChange={setEventosFuturos} errores={erroresFuturos} />
      </Seccion>

      <Validacion validacion={validacion} controlOk={controlOk} />
    </div>
  );
}

function Seccion({ titulo, desc, children, error = false }) {
  return (
    <section className={`rounded-2xl border bg-card/40 p-6 ${error ? "border-destructive" : "border-border"}`}>
      <h3 className={`font-heading text-xl font-semibold ${error ? "text-destructive" : ""}`}>{titulo}</h3>
      {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Validacion({ validacion, controlOk }) {
  const errores = [...validacion.errores];
  if (!controlOk) errores.push("Marcá la variable de control como implícita o agregá al menos una.");
  if (errores.length === 0 && validacion.advertencias.length === 0) return null;
  return (
    <div className="space-y-3">
      {errores.length > 0 && (
        <div className="rounded-xl border border-destructive/30 dark:border-destructive bg-destructive/5 dark:bg-destructive/20 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-destructive"><AlertTriangle className="w-4 h-4" /> Errores bloqueantes</p>
          <ul className="mt-2 list-disc pl-8 text-sm text-destructive dark:text-white">
            {errores.map((e, i) => <li key={i}>{e}</li>)}
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