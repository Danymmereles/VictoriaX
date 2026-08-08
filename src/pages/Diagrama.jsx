import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Workflow } from "lucide-react";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";

export default function Diagrama() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-3xl px-6 py-32 text-center">
        <Workflow className="mx-auto w-10 h-10 text-[#AF9BEF]" />
        <h1 className="mt-6 font-heading text-4xl font-semibold">Sección Diagramar</h1>
        <p className="mt-4 text-muted-foreground">
          Completaste el análisis previo. La construcción del diagrama de flujo y la ejecución
          se habilitarán en la próxima etapa.
        </p>
        <Link to="/modo-libre" className="mt-10 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm hover:border-[#AF9BEF]">
          <ArrowLeft className="w-4 h-4" /> Volver al análisis previo
        </Link>
      </main>
      <Footer />
    </div>
  );
}