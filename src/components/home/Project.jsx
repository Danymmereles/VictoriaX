import React from "react";
import { Image } from "@/components/ui/image";

const UTN_LOGO = "https://base44.app/api/apps/6a71341ab9dae936a9cf65a7/files/mp/public/6a71341ab9dae936a9cf65a7/dd7d7623d_utn-frba.png";

export default function Project() {
  return (
    <section id="proyecto" className="mx-auto max-w-[100rem] px-6 py-24 lg:px-12">
      <div className="grid items-center gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">El proyecto</p>
          <h2 className="mt-4 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Un desarrollo académico, con respaldo de cátedra.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            VictoriaX está desarrollada por alumnos de 5.º año de Ingeniería en Sistemas de
            Información, con el aporte de las cátedras de <strong className="text-foreground">Simulación</strong> (4.º año),
            que define las necesidades pedagógicas y los contenidos, y de{" "}
            <strong className="text-foreground">Proyecto Final</strong> (5.º año), que acompaña el desarrollo
            profesional del producto.
          </p>
          <dl className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              ["Simulación", "Cátedra de 4.º año · dominio y contenidos"],
              ["Proyecto Final", "Cátedra de 5.º año · acompañamiento"],
              ["UTN.BA", "Facultad Regional Buenos Aires"],
            ].map(([t, d]) => (
              <div key={t} className="border-t border-border pt-4">
                <dt className="font-heading text-lg font-semibold">{t}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-border/70 bg-white p-10 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)]">
            <Image
              src={UTN_LOGO}
              alt="Universidad Tecnológica Nacional — Facultad Regional Buenos Aires"
              className="mx-auto w-full max-w-md object-contain"
              fittingType="fit"
            />
          </div>
        </div>
      </div>
    </section>
  );
}