import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useSesionUsuario } from "@/lib/sesionUsuario";

export default function Hero() {
  const { usuario } = useSesionUsuario();
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-[#AF9BEF]/20 blur-[140px]" />
      <div className="pointer-events-none absolute top-40 -right-32 h-[26rem] w-[26rem] rounded-full bg-[#73C3EE]/20 blur-[130px]" />
      <div className="mx-auto grid max-w-[100rem] items-center gap-16 px-6 py-24 lg:grid-cols-12 lg:px-12 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs tracking-[0.2em] uppercase text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-[#EA84B4]" /> Simulación evento a evento y ΔT Constante
          </span>
          <h1 className="mt-8 font-heading text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">
            Dejá de imaginar
            <br />
            <span className="bg-gradient-to-r from-[#73C3EE] via-[#AF9BEF] to-[#EA84B4] bg-clip-text text-transparent">
              la simulación.
            </span>
            <br />
            Empezá a verla.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            VictoriaX es la plataforma web para aprender, modelar y ejecutar simulaciones de
            evento a evento y delta t constante. Del análisis previo al diagrama, y del
            diagrama a los gráficos de resultados.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/modo-libre"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-4 text-base font-medium text-background transition-transform hover:scale-[1.02]"
            >
              Entrar a Modo Libre
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            {(!usuario || usuario.puedeUsarModoEstudio) && (
              <Link
                to={usuario ? "/modo-estudio" : "/login"}
                className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-4 text-base font-medium transition-colors hover:border-[#AF9BEF]"
              >
                {usuario ? "Ir a Modo Estudio" : "Acceder a Modo Estudio"}
              </Link>
            )}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            {(!usuario || usuario.puedeUsarModoEstudio)
              ? "Modo Libre está disponible para todos · Modo Estudio requiere cuenta académica"
              : "Modo Libre está disponible para todos"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="lg:col-span-6"
        >
          <div className="relative rounded-3xl border border-border/70 bg-card/40 p-3 backdrop-blur">
            <Image
              src="https://media.base44.com/images/public/6a71341ab9dae936a9cf65a7/ecca53016_generated_3bdc9426.png"
              alt="Esquema tridimensional de una red de simulación de eventos discretos"
              className="h-[26rem] w-full rounded-2xl object-cover lg:h-[32rem]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}