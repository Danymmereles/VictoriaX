import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { ejerciciosClient } from "@/api/ejerciciosClient";
import { institucionesClient } from "@/api/institucionesClient";
import { useSesionUsuario } from "@/lib/sesionUsuario";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";

export default function ModoEstudio() {
  const navigate = useNavigate();
  const { usuario, permisos } = useSesionUsuario();
  const [ejercicios, setEjercicios] = useState(null);
  const [error, setError] = useState("");
  const [instituciones, setInstituciones] = useState([]);
  // El super admin elige de qué institución ver la guía (queda en la URL: ?institucion=).
  const [params, setParams] = useSearchParams();
  const esSuper = Boolean(permisos?.puedoVerTodasLasInstituciones);
  const institucion = (esSuper && params.get("institucion")) || usuario?.institucion || "";

  useEffect(() => {
    if (!usuario) navigate("/login");
  }, [usuario, navigate]);

  useEffect(() => {
    if (!esSuper) return;
    institucionesClient.list().then(setInstituciones).catch(() => setInstituciones([]));
  }, [esSuper]);

  useEffect(() => {
    if (!usuario) return;
    setEjercicios(null);
    setError("");
    ejerciciosClient
      .list({ institucion: esSuper ? institucion : undefined })
      .then(setEjercicios)
      .catch((e) => {
        setEjercicios([]);
        setError(e.message || "No se pudieron cargar los ejercicios.");
      });
  }, [usuario, esSuper, institucion]);

  if (!usuario) return null;

  const opciones = instituciones.includes(institucion) ? instituciones : [institucion, ...instituciones];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Modo Estudio</p>
        <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">Guía de Trabajos Prácticos</h1>
        <p className="mt-4 text-muted-foreground">
          Elegí un ejercicio para resolver su análisis previo y entregarlo.
        </p>

        {esSuper && (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <label htmlFor="institucion" className="text-sm font-medium text-muted-foreground">
              Institución
            </label>
            <select
              id="institucion"
              value={institucion}
              onChange={(e) => setParams({ institucion: e.target.value })}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            >
              {opciones.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
          {ejercicios === null && <p className="p-6 text-sm text-muted-foreground">Cargando ejercicios…</p>}
          {error && <p className="p-6 text-sm text-destructive">{error}</p>}
          {!error && ejercicios?.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">
              {esSuper ? `${institucion} todavía no tiene ejercicios cargados.` : "Todavía no hay ejercicios cargados."}
            </p>
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
