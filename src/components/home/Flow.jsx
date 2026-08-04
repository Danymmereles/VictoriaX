import React from "react";
import { motion } from "framer-motion";
import { BarChart3, GitBranch, Play, Table2 } from "lucide-react";

const steps = [
  { icon: Table2, title: "Análisis previo", desc: "Definís variables, eventos y reglas en la tabla de análisis.", color: "#73C3EE" },
  { icon: GitBranch, title: "Diagrama", desc: "La tabla se traduce en un diagrama de flujo editable.", color: "#AF9BEF" },
  { icon: Play, title: "Ejecución", desc: "Corrés la simulación evento a evento y tiempo comprometido.", color: "#EA84B4" },
  { icon: BarChart3, title: "Resultados", desc: "Obtenés gráficos y métricas según lo que necesites analizar.", color: "#73C3EE" },
];

export default function Flow() {
  return (
    <section id="flujo" className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto max-w-[100rem] px-6 py-24 lg:px-12">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">El flujo</p>
          <h2 className="mt-4 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            De la tabla al gráfico, sin saltos.
          </h2>
        </div>
        <div className="relative mt-16 grid gap-10 md:grid-cols-4">
          <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-border md:block" />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <div
                className="relative z-10 grid h-12 w-12 place-items-center rounded-xl border border-border bg-background"
                style={{ boxShadow: `0 0 0 4px hsl(var(--background))` }}
              >
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <p className="mt-6 text-xs tracking-[0.25em] text-muted-foreground">0{i + 1}</p>
              <h3 className="mt-2 font-heading text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}