import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { nuevoEventoFuturo, eventosDeclarados, deltaTDe, METODOLOGIAS } from "@/lib/analisisPrevio";
import ErrorDeSigla from "./ErrorDeSigla";

const nombresCargados = (lista) => lista.map((x) => x.nombre).filter((n) => n && n.trim());

// `errores` (opcional): { [id]: { mensajes, sigla } } con los problemas de cada evento.
export default function EventosFuturos({ analisis, onChange, errores = {} }) {
  const { eventosFuturos, metodologia } = analisis;
  const esDeltaT = metodologia === METODOLOGIAS.DELTA_T_CONSTANTE;
  const opciones = metodologia ? eventosDeclarados(analisis) : [];

  // Δt constante: cada sigla liga un comprometido anterior con uno posterior.
  const { anteriores, posteriores } = deltaTDe(analisis.eventos);
  const opcionesAnteriores = nombresCargados(anteriores);
  const opcionesPosteriores = nombresCargados(posteriores);

  function actualizar(i, patch) {
    onChange(eventosFuturos.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function quitar(i) {
    onChange(eventosFuturos.filter((_, idx) => idx !== i));
  }
  function agregar() {
    onChange([...eventosFuturos, nuevoEventoFuturo()]);
  }
  // La referencia al evento anterior es también la que usa el diagrama (TPC).
  function setAnterior(i, valor) {
    actualizar(i, { eventoAnterior: valor, eventoRef: valor });
  }

  const estiloSelect = (conError) =>
    `rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-60 ${conError ? "border-destructive" : "border-input"}`;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-lg font-semibold">Eventos Futuros</h4>
        <button onClick={agregar} className="inline-flex items-center gap-1 text-sm font-medium text-[#AF9BEF] hover:underline">
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {metodologia === METODOLOGIAS.EVENTO_A_EVENTO
          ? "Obligatoria en Evento a Evento: cargá al menos un evento futuro. Cada sigla representa el tiempo de ejecución de un evento."
          : esDeltaT
          ? "Obligatorio en Delta T Constante: cada sigla debe indicar un evento comprometido anterior y uno posterior."
          : "Cada sigla representa el tiempo de ejecución de un evento."}
      </p>
      <div className="mt-4 space-y-3">
        {eventosFuturos.length === 0 && <p className="text-sm text-muted-foreground">Sin eventos futuros.</p>}
        {eventosFuturos.map((e, i) => {
          const error = errores[e.id];
          const campos = esDeltaT
            ? "sm:grid-cols-[120px_1fr_1fr_auto]"
            : "sm:grid-cols-[140px_1fr_auto]";
          return (
            <div key={e.id}>
              <div className={`grid items-center gap-3 ${campos}`}>
                <input
                  value={e.sigla}
                  onChange={(ev) => actualizar(i, { sigla: ev.target.value })}
                  placeholder="Siglas"
                  aria-invalid={Boolean(error?.sigla)}
                  className={estiloSelect(error?.sigla)}
                />
                {esDeltaT ? (
                  <>
                    <select
                      value={e.eventoAnterior || ""}
                      onChange={(ev) => setAnterior(i, ev.target.value)}
                      aria-label="Evento comprometido anterior"
                      aria-invalid={Boolean(error && !error.sigla)}
                      disabled={opcionesAnteriores.length === 0}
                      className={estiloSelect(Boolean(error && !error.sigla))}
                    >
                      <option value="">
                        {opcionesAnteriores.length === 0 ? "Sin comprometidos anteriores" : "Comprometido anterior"}
                      </option>
                      {opcionesAnteriores.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <select
                      value={e.eventoPosterior || ""}
                      onChange={(ev) => actualizar(i, { eventoPosterior: ev.target.value })}
                      aria-label="Evento comprometido posterior"
                      aria-invalid={Boolean(error && !error.sigla)}
                      disabled={opcionesPosteriores.length === 0}
                      className={estiloSelect(Boolean(error && !error.sigla))}
                    >
                      <option value="">
                        {opcionesPosteriores.length === 0 ? "Sin comprometidos posteriores" : "Comprometido posterior"}
                      </option>
                      {opcionesPosteriores.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </>
                ) : (
                  <select
                    value={e.eventoRef}
                    onChange={(ev) => actualizar(i, { eventoRef: ev.target.value })}
                    disabled={!metodologia}
                    className={estiloSelect(Boolean(error && !error.sigla))}
                  >
                    <option value="">{metodologia ? "Seleccionar evento" : "Elegí metodología primero"}</option>
                    {opciones.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                <button onClick={() => quitar(i)} className="grid place-items-center rounded-lg border border-border px-3 py-2 hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {error && (error.sigla ? (
                <ErrorDeSigla mensajes={error.mensajes} />
              ) : (
                <div className="mt-2 space-y-1">
                  {error.mensajes.map((m) => <p key={m} className="text-xs text-destructive">{m}</p>)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}