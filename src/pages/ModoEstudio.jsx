import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Route as RouteIcon } from "lucide-react";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";

export default function ModoEstudio() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 py-32 text-center">
        <RouteIcon className="w-8 h-8 text-[#AF9BEF]" />
        <h1 className="mt-8 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Modo Estudio</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          El camino de aprendizaje con los ejercicios de la cátedra está en construcción. Se
          habilitará únicamente para usuarios con sesión institucional iniciada.
        </p>
        <Link to="/" className="mt-10 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm hover:border-[#AF9BEF]">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>
      </main>
      <Footer />
    </div>
  );
}