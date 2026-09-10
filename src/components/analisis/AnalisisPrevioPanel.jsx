import React, { useEffect, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { validarAnalisis } from "@/lib/analisisPrevio";
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
    setAnalisis((a) => ({ ...a, metodologia: m, eventos: { filas: [] } }));
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
  const controlOk = Boolean(analisis.controlImplicita) || analisis.variables.control.length > 0;

  useEffect(() => {
    onValidacionChange?.({ ...validacion, esValido: validacion.esValido && controlOk });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validacion, controlOk]);

  return (
    <div className="space-y-8">
      <Seccion titulo="Metodología" desc="Define la estructura de la tabla de eventos.">
        <MetodologiaSelector value={analisis.metodologia} onChange={setMetodologia} />
      </Seccion>

      <Seccion titulo="Variables" desc="Exógenas (Datos y Control) y Endógenas (Estado y Resultado).">
        <div className="space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Exógenas</p>
            <div className="mt-4 grid gap-8 lg:grid-cols-2">
              <VariableList titulo="Variables de Datos" variables={analisis.variables.datos} onChange={(datos) => setVariables({ datos })} />
              <VariableControlImplicita
                variables={analisis.variables.control}
                onChange={(control) => setVariables({ control })}
                implicita={Boolean(analisis.controlImplicita)}
                onChangeImplicita={setControlImplicita}
              />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Endógenas</p>
            <div className="mt-4 grid gap-8 lg:grid-cols-2">
              <VariableList titulo="Variables de Estado" variables={analisis.variables.estado} onChange={(estado) => setVariables({ estado })} permitirVector controlVars={analisis.variables.control} />
              <VariableList titulo="Variables de Resultado" variables={analisis.variables.resultado} onChange={(resultado) => setVariables({ resultado })} permitirVector controlVars={analisis.variables.control} />
            </div>
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Tabla de Eventos" desc="Según la metodología seleccionada.">
        <TablaEventos analisis={analisis} onChange={setEventos} />
      </Seccion>

      <Seccion titulo="Tabla de Eventos Futuros" desc="Listado de siglas de tiempo ligadas a eventos.">
        <EventosFuturos analisis={analisis} onChange={setEventosFuturos} />
      </Seccion>

      <Validacion validacion={validacion} controlOk={controlOk} />
    </div>
  );
}

function Seccion({ titulo, desc, children }) {
  return (
    <section className="rounded-2xl border border-border bg-card/40 p-6">
      <h3 className="font-heading text-xl font-semibold">{titulo}</h3>
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
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-destructive"><AlertTriangle className="w-4 h-4" /> Errores bloqueantes</p>
          <ul className="mt-2 list-disc pl-8 text-sm text-destructive/90">
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