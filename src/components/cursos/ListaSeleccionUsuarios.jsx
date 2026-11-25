import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Lista de usuarios con buscador (nombre o email) y selección múltiple.
// `seleccion` es un arreglo de ids; `onChange` recibe el nuevo arreglo.
export default function ListaSeleccionUsuarios({
  usuarios,
  seleccion,
  onChange,
  vacio = "No hay usuarios disponibles.",
  placeholder = "Buscar por nombre o email…",
  disabled = false,
}) {
  const [busqueda, setBusqueda] = useState("");

  const visibles = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    return usuarios
      .filter((u) => !termino || [u.nombre_completo, u.email].some((c) => normalizar(c).includes(termino)))
      .sort((a, b) => String(a.nombre_completo).localeCompare(String(b.nombre_completo), "es"));
  }, [usuarios, busqueda]);

  const elegidos = new Set(seleccion);
  const todosVisiblesElegidos = visibles.length > 0 && visibles.every((u) => elegidos.has(u.id));

  function alternar(id) {
    onChange(elegidos.has(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id]);
  }

  // Marca o desmarca solo los que se ven con la búsqueda actual.
  function alternarVisibles() {
    const ids = new Set(visibles.map((u) => u.id));
    onChange(
      todosVisiblesElegidos
        ? seleccion.filter((id) => !ids.has(id))
        : [...new Set([...seleccion, ...ids])]
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
          disabled={disabled}
          aria-label="Buscar usuarios"
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {seleccion.length} seleccionado{seleccion.length === 1 ? "" : "s"}
          {busqueda && ` · ${visibles.length} de ${usuarios.length} coinciden`}
        </span>
        {visibles.length > 0 && (
          <button type="button" onClick={alternarVisibles} className="font-medium text-[#AF9BEF] hover:underline">
            {todosVisiblesElegidos ? "Quitar todos" : busqueda ? "Seleccionar los que coinciden" : "Seleccionar todos"}
          </button>
        )}
      </div>

      <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
        {usuarios.length === 0 && <p className="p-2 text-sm text-muted-foreground">{vacio}</p>}
        {usuarios.length > 0 && visibles.length === 0 && (
          <p className="p-2 text-sm text-muted-foreground">Nadie coincide con la búsqueda.</p>
        )}
        {visibles.map((u) => (
          <label
            key={u.id}
            className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-muted/40"
          >
            <input
              type="checkbox"
              checked={elegidos.has(u.id)}
              onChange={() => alternar(u.id)}
              className="h-4 w-4 shrink-0 accent-[#AF9BEF]"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm">{u.nombre_completo}</span>
              <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
