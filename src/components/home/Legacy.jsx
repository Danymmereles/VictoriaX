import React from "react";
import { motion } from "framer-motion";

const milestones = [
  { year: "2017", title: "Victoria Desktop", desc: "Nace como aplicación de escritorio para modelar simulaciones dentro de la cátedra." },
  { year: "Hoy", title: "VictoriaX Web", desc: "Se reconstruye como plataforma web accesible desde cualquier dispositivo, sin instalación." },
  { year: "Nuevo", title: "Modo Estudio", desc: "El salto: de herramienta de modelado a plataforma de aprendizaje con caminos guiados." },
];

export default function Legacy() {
  return (
    <section id="legado" className="mx-auto max-w-[100rem] px-6 py-24 lg:px-12">
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Legado</p>
          <h2 className="mt-4 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Una idea de 2017, reescrita para la web.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            VictoriaX toma el espíritu de Victoria y explota su potencial: más accesible, más
            didáctica y pensada para acompañar el aprendizaje, no solo para dibujar modelos.
          </p>
        </div>
        <div className="lg:col-span-8">
          <div className="relative border-l border-border pl-10">
            {milestones.map((m, i) => (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative pb-14 last:pb-0"
              >
                <span className="absolute -left-[46px] top-1.5 h-3 w-3 rounded-full bg-gradient-to-r from-[#73C3EE] to-[#EA84B4]" />
                <p className="text-sm tracking-[0.2em] text-muted-foreground">{m.year}</p>
                <h3 className="mt-2 font-heading text-2xl font-semibold">{m.title}</h3>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}