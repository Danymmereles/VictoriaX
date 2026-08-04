import React from "react";
import { GraduationCap, Presentation, Users } from "lucide-react";

const items = [
  {
    icon: GraduationCap,
    title: "Alumnos",
    desc: "Aprenden a modelar con ejercicios guiados, resuelven y comparan con la resolución propuesta por la cátedra.",
    color: "#73C3EE",
  },
  {
    icon: Presentation,
    title: "Docentes",
    desc: "Enseñan con una herramienta de diagramado y modelado, y arman los ejercicios del camino de aprendizaje.",
    color: "#AF9BEF",
  },
  {
    icon: Users,
    title: "Graduados",
    desc: "Recuperan y aplican conceptos de simulación para analizar el comportamiento de sistemas reales.",
    color: "#EA84B4",
  },
];

export default function Audiences() {
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto max-w-[100rem] px-6 py-24 lg:px-12">
        <h2 className="max-w-2xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Pensada para toda la cátedra.
        </h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="rounded-3xl border border-border/70 bg-background p-8">
              <it.icon className="w-6 h-6" style={{ color: it.color }} />
              <h3 className="mt-6 font-heading text-2xl font-semibold">{it.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}