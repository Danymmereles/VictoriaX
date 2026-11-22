import React, { useState } from "react";
import { ChevronDown, Lightbulb, Sparkles } from "lucide-react";

export default function ApoyoPedagogico({ apoyo }) {
  const [abierto, setAbierto] = useState(true);
  const secuencia = apoyo?.secuencia ?? [];
  const variables = apoyo?.variables ?? [];

  if (!secuencia.length && !variables.length && !apoyo?.sugerencia) return null;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card/60">
      <div className="h-1 w-full bg-gradient-to-r from-[#73C3EE] via-[#AF9BEF] to-[#EA84B4]" />
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/40"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
            <Lightbulb className="h-4 w-4" />
          </span>
          <span>
            <span className="block font-heading text-sm font-semibold">Apoyo pedagógico</span>
            <span className="block text-xs text-muted-foreground">Secuencia del proceso y variables clave de este enunciado</span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <div className="border-t border-border/60 px-6 py-6">
          <div className="grid gap-8 md:grid-cols-2">
            {secuencia.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Secuencia del proceso</p>
                <ol className="mt-4 space-y-3">
                  {secuencia.map((paso, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border bg-background text-[11px] font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-foreground/85">{paso}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {variables.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Variables y datos clave</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {variables.map((v, i) => (
                    <li key={i} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
                      {v}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {apoyo.sugerencia && (
            <div className="mt-6 flex gap-3 rounded-xl border border-border/70 bg-muted/40 p-4">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-sm leading-relaxed text-foreground/85">{apoyo.sugerencia}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}