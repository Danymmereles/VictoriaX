import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { METODOLOGIAS, deltaTDe } from "@/lib/analisisPrevio";

function metodoLabel(m) {
  if (m === METODOLOGIAS.EVENTO_A_EVENTO) return "Evento a Evento";
  if (m === METODOLOGIAS.DELTA_T_CONSTANTE) return "Delta T Constante";
  return "—";
}

function dimTexto(dim) {
  if (!dim) return "";
  if (dim.tipo === "fijo") return `Vector (dim ${dim.valor})`;
  if (dim.tipo === "variable") return `Vector (dim ≈ ${dim.variableControl || "?"})`;
  return "";
}

function VariablesResumen({ variables }) {
  const grupos = [
    { label: "Datos", vars: variables.datos },
    { label: "Control", vars: variables.control },
    { label: "Estado", vars: variables.estado },
    { label: "Resultado", vars: variables.resultado },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {grupos.map((g) => (
        <div key={g.label}>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{g.label}</p>
          {g.vars.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground/70">Sin variables</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {g.vars.map((v) => (
                <li key={v.id} className="flex items-baseline gap-2 text-sm">
                  <span className="font-mono font-medium">{v.sigla || "—"}</span>
                  <span className="text-muted-foreground">{v.descripcion || ""}</span>
                  {v.esVector && (
                    <Badge variant="outline" className="ml-1 text-[10px]">
                      {dimTexto(v.dimension) || "Vector"}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function ColumnaEventos({ titulo, items }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{titulo}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground/70">Sin eventos</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {items.map((n, i) => (
            <li key={`${n}-${i}`} className="font-mono">{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EventosResumen({ analisis }) {
  const filas = analisis.eventos?.filas || [];
  const esEaE = analisis.metodologia === METODOLOGIAS.EVENTO_A_EVENTO;
  if (esEaE && filas.length === 0)
    return <p className="text-sm text-muted-foreground/70">Sin eventos cargados.</p>;
  if (esEaE) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-4">Evento</th>
              <th className="py-2 pr-4">Futuro no cond.</th>
              <th className="py-2 pr-4">Futuro cond.</th>
              <th className="py-2">Condición</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id} className="border-t border-border">
                <td className="py-2 pr-4 font-mono">
                  {f.evento?.nombre || "—"}
                  {f.evento?.esVector ? ` ${dimTexto(f.evento.dimension)}` : ""}
                </td>
                <td className="py-2 pr-4">{f.futuroNoCond || "—"}</td>
                <td className="py-2 pr-4">{f.futuroCond || "—"}</td>
                <td className="py-2">{f.condicion || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  const { propios, anteriores, posteriores } = deltaTDe(analisis.eventos);
  if (propios.length === 0 && anteriores.length === 0 && posteriores.length === 0)
    return <p className="text-sm text-muted-foreground/70">Sin eventos cargados.</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <ColumnaEventos
        titulo="Eventos propios"
        items={propios
          .filter((p) => p.nombre.trim())
          .map((p) => `${p.nombre}${p.esVector ? ` ${dimTexto(p.dimension)}` : ""}`)}
      />
      <ColumnaEventos
        titulo="Comprometidos anteriores"
        items={anteriores.map((x) => x.nombre).filter((n) => n && n.trim())}
      />
      <ColumnaEventos
        titulo="Comprometidos posteriores"
        items={posteriores.map((x) => x.nombre).filter((n) => n && n.trim())}
      />
    </div>
  );
}

export default function ResolucionEstudiante({ open, onClose, entrega, alumno, ejercicio }) {
  const a = entrega?.analisis_previo || null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Resolución de {alumno?.nombre_completo || "estudiante"}</DialogTitle>
          <DialogDescription>
            Ejercicio Nº {ejercicio?.numero ?? "—"} · {ejercicio?.titulo || ""}
          </DialogDescription>
        </DialogHeader>
        {entrega && (
          <div className="flex flex-wrap gap-2">
            <Badge variant={entrega.entregado ? "default" : "secondary"}>
              {entrega.entregado ? "Entregado" : "Borrador"}
            </Badge>
            {entrega.resolucion_vista && <Badge variant="outline">Vio la resolución</Badge>}
          </div>
        )}
        {!a || !a.metodologia ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            El estudiante aún no completó el análisis previo.
          </p>
        ) : (
          <div className="space-y-6">
            <section className="rounded-xl border border-border bg-card/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Metodología</p>
              <p className="mt-1 font-medium">{metodoLabel(a.metodologia)}</p>
            </section>
            <section className="rounded-xl border border-border bg-card/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Variables</p>
              <div className="mt-3">
                <VariablesResumen variables={a.variables} />
              </div>
            </section>
            <section className="rounded-xl border border-border bg-card/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tabla de Eventos</p>
              <div className="mt-3">
                <EventosResumen analisis={a} />
              </div>
            </section>
            {a.eventosFuturos?.length > 0 && (
              <section className="rounded-xl border border-border bg-card/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Eventos Futuros</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {a.eventosFuturos.map((ef) => (
                    <li key={ef.id}>
                      <span className="font-mono">{ef.sigla}</span> →{" "}
                      {a.metodologia === METODOLOGIAS.DELTA_T_CONSTANTE
                        ? `${ef.eventoAnterior || ef.eventoRef || "—"} / ${ef.eventoPosterior || "—"}`
                        : ef.eventoRef || "—"}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}