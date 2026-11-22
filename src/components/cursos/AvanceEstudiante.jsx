import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ESTADOS = [
  { key: "borrador", label: "Borrador", filtro: (e) => !e.entregado, variant: "secondary" },
  { key: "entregado", label: "Entregado", filtro: (e) => e.entregado && !e.resolucion_vista, variant: "default" },
  { key: "finalizado", label: "Finalizado", filtro: (e) => e.resolucion_vista, variant: "outline" },
];

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function AvanceEstudiante({ alumnos, ejercicios, entregas, onVerResolucion }) {
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [abiertos, setAbiertos] = useState({});

  function toggle(k) {
    setAbiertos((s) => ({ ...s, [k]: !s[k] }));
  }

  function tituloEj(ejercicioId) {
    const e = ejercicios.find((x) => x.id === ejercicioId);
    return e ? `Nº ${e.numero} · ${e.titulo}` : ejercicioId;
  }

  const ordenados = useMemo(
    () =>
      [...alumnos].sort((a, b) =>
        (a.nombre_completo || "").localeCompare(b.nombre_completo || "", "es", {
          sensitivity: "base",
        }),
      ),
    [alumnos],
  );

  const visibles = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    if (!termino) return ordenados;
    return ordenados.filter((al) => normalizar(al.nombre_completo).includes(termino));
  }, [ordenados, busqueda]);

  if (alumnos.length === 0)
    return <p className="text-sm text-muted-foreground">No hay alumnos inscriptos en el curso.</p>;

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar estudiante por nombre"
          aria-label="Buscar estudiante por nombre"
          className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm"
        />
      </div>

      {visibles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay estudiantes que coincidan con la búsqueda.
        </p>
      ) : (
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {visibles.map((al) => {
            const ents = entregas.filter((e) => e.usuario_id === al.id);
            const activo = seleccionado === al.id;
            return (
              <div key={al.id}>
                <button
                  onClick={() => setSeleccionado(activo ? null : al.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <span className="flex items-center gap-2">
                    {activo ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>
                      <span className="block font-medium">{al.nombre_completo}</span>
                      <span className="block text-xs text-muted-foreground">{al.email}</span>
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-2 text-xs">
                    {ESTADOS.map((es) => (
                      <Badge key={es.key} variant={es.variant}>
                        {es.label}: {ents.filter(es.filtro).length}
                      </Badge>
                    ))}
                  </span>
                </button>

                {activo && (
                  <div className="space-y-1 border-t border-border/60 bg-muted/20 px-4 pb-4 pt-3">
                    {ESTADOS.map((es) => {
                      const lista = ents.filter(es.filtro);
                      const k = `${al.id}_${es.key}`;
                      return (
                        <div key={es.key} className="rounded-lg border border-border/60 bg-background/60">
                          <button
                            onClick={() => toggle(k)}
                            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/40"
                          >
                            <span className="flex items-center gap-2">
                              {abiertos[k] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <span>{es.label}</span>
                            </span>
                            <Badge variant={es.variant}>{lista.length}</Badge>
                          </button>
                          {abiertos[k] && (
                            <ul className="space-y-1 border-t border-border/60 px-3 py-2">
                              {lista.length === 0 && (
                                <li className="text-sm text-muted-foreground/70">Ninguno.</li>
                              )}
                              {lista.map((e) => (
                                <li key={e.id}>
                                  <button
                                    onClick={() =>
                                      onVerResolucion(
                                        e,
                                        al,
                                        ejercicios.find((x) => x.id === e.ejercicio_id),
                                      )
                                    }
                                    className="text-left text-sm text-[#AF9BEF] hover:underline"
                                  >
                                    {tituloEj(e.ejercicio_id)}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}