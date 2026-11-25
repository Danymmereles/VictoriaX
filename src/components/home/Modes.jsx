import React from "react";
import { Link } from "react-router-dom";
import { Lock, PenTool, Route as RouteIcon, Unlock } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useSesionUsuario } from "@/lib/sesionUsuario";

export default function Modes() {
  const { usuario } = useSesionUsuario();
  const puedeUsarModoEstudio = Boolean(usuario?.puedeUsarModoEstudio);
  const mostrarModoEstudio = !usuario || puedeUsarModoEstudio;

  const modes = [
    {
      id: "libre",
      tag: "Sin cuenta",
      icon: PenTool,
      title: "Modo Libre",
      desc: "Modelado inmediato y sin fricciones: cargá tu tabla de análisis previo, generá el diagrama de flujo, ejecutalo y obtené los gráficos de resultados que necesites.",
      bullets: ["Análisis previo tabular", "Diagrama de flujo ejecutable", "Gráficos de resultados configurables"],
      img: "https://media.base44.com/images/public/6a71341ab9dae936a9cf65a7/9d41c6530_generated_ec53f922.png",
      to: "/modo-libre",
      cta: "Empezar a modelar",
      accent: "#73C3EE",
      state: { icon: Unlock, label: "Acceso libre" },
    },
    ...(mostrarModoEstudio
      ? [
          {
            id: "estudio",
            tag: "Requiere sesión",
            icon: RouteIcon,
            title: "Modo Estudio",
            desc: "Un camino de aprendizaje con ejercicios analizados por la cátedra: resolvelos, envialos y compará tu solución con la resolución propuesta.",
            bullets: ["Ejercicios oficiales de la cátedra", "Envío y seguimiento del progreso", "Resolución propuesta al finalizar"],
            img: "https://media.base44.com/images/public/6a71341ab9dae936a9cf65a7/08266ca5c_generated_22613875.png",
            to: !usuario ? "/login" : "/modo-estudio",
            cta: !usuario ? "Iniciar sesión para acceder" : "Ir a Modo Estudio",
            accent: "#AF9BEF",
            state: {
              icon: puedeUsarModoEstudio ? Unlock : Lock,
              label: !usuario ? "Sesión requerida" : "Sesión iniciada",
            },
          },
        ]
      : []),
  ];

  return (
    <section id="modos" className="mx-auto max-w-[100rem] px-6 py-24 lg:px-12">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {modes.length === 1 ? "Modo disponible" : "Dos puertas de entrada"}
        </p>
        <h2 className="mt-4 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          {modes.length === 1 ? "Modelá tu simulación." : "Modelar o aprender. O ambas."}
        </h2>
      </div>

      <div className={`mt-16 grid gap-8 ${modes.length === 1 ? "max-w-2xl" : "lg:grid-cols-2"}`}>
        {modes.map((m) => (
          <div
            key={m.id}
            className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card/40 p-8 transition-colors hover:border-[color:var(--vx-accent)]"
            style={{ "--vx-accent": m.accent }}
          >
            <span
              className="absolute right-8 top-8 h-2 w-2 rounded-full transition-transform group-hover:scale-[2.2]"
              style={{ backgroundColor: m.accent }}
            />
            <div className="flex items-center gap-3">
              <m.icon className="w-5 h-5" style={{ color: m.accent }} />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <m.state.icon className="w-3 h-3" /> {m.state.label}
              </span>
            </div>
            <h3 className="mt-6 font-heading text-3xl font-semibold tracking-tight">{m.title}</h3>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{m.desc}</p>
            <ul className="mt-6 space-y-2">
              {m.bullets.map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="h-px w-6" style={{ backgroundColor: m.accent }} />
                  {b}
                </li>
              ))}
            </ul>
            <Image src={m.img} alt={m.title} className="mt-8 h-56 w-full rounded-2xl object-cover" />
            {m.to ? (
              <Link
                to={m.to}
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
              >
                {m.cta}
              </Link>
            ) : (
              <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm text-muted-foreground" aria-disabled="true">
                {m.cta}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}