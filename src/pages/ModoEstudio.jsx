import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSesionUsuario } from "@/lib/sesionUsuario";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";

export default function ModoEstudio() {
  const navigate = useNavigate();
  const { usuario } = useSesionUsuario();
  const [ejercicios, setEjercicios] = useState(null);

  useEffect(() => {
    if (!usuario) navigate("/login");
  }, [usuario, navigate]);

  useEffect(() => {
    if (!usuario) return;
    base44.entities.Ejercicio.list("numero").then(setEjercicios);
  }, [usuario]);

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Modo Estudio</p>
        <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">Guía de Trabajos Prácticos</h1>
        <p className="mt-4 text-muted-foreground">
          Elegí un ejercicio para resolver su análisis previo y entregarlo.
        </p>

        <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
          {ejercicios === null && <p className="p-6 text-sm text-muted-foreground">Cargando ejercicios…</p>}
          {ejercicios?.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">Todavía no hay ejercicios cargados.</p>
          )}
          {ejercicios?.map((ej) => (
            <Link
              key={ej.id}
              to={`/modo-estudio/${ej.id}`}
              className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#AF9BEF]/15 text-sm font-semibold text-[#AF9BEF]">
                  {ej.numero}
                </span>
                <span className="font-medium">{ej.titulo}</span>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>

        <Link to="/" className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>
      </main>
      <Footer />
    </div>
  );
}