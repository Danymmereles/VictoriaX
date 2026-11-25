// Resoluciones y su análisis previo (API propia + MySQL).
// La API guarda el análisis en cuatro columnas; acá se traduce desde y hacia el
// objeto que usan las páginas (ver analisisVacio() en lib/analisisPrevio.js).
import { request } from "@/api/apiClient";
import { analisisVacio, eventosVacio } from "@/lib/analisisPrevio";

export const ESTADOS = {
  BORRADOR: "BORRADOR",
  ENTREGADO: "ENTREGADO",
  FINALIZADO: "FINALIZADO",
};

// controlImplicita (Modo Estudio) viaja dentro del JSON de variables.
export function aColumnas(analisis) {
  return {
    tipo_metodologia: analisis.metodologia ?? null,
    variables: { ...analisis.variables, controlImplicita: Boolean(analisis.controlImplicita) },
    tabla_eventos: analisis.eventos ?? eventosVacio(),
    tabla_eventos_futuros: analisis.eventosFuturos ?? [],
  };
}

export function deColumnas(columnas) {
  const { controlImplicita, ...variables } = columnas.variables ?? {};
  return {
    ...analisisVacio(),
    metodologia: columnas.tipo_metodologia ?? null,
    variables: { ...analisisVacio().variables, ...variables },
    eventos: columnas.tabla_eventos ?? eventosVacio(),
    eventosFuturos: columnas.tabla_eventos_futuros ?? [],
    ...(controlImplicita ? { controlImplicita: true } : {}),
  };
}

// Agrega `analisis` con la forma que usan las páginas.
const conAnalisis = (resolucion) => ({ ...resolucion, analisis: deColumnas(resolucion.analisis_previo) });

export const resolucionesClient = {
  // La resolución del usuario para un ejercicio del Modo Estudio, o null.
  async porEjercicio(idEjercicio) {
    const { resoluciones } = await request(`/api/resoluciones?ejercicio=${encodeURIComponent(idEjercicio)}`);
    return resoluciones[0] ? conAnalisis(resoluciones[0]) : null;
  },

  // La resolución del Modo Libre modificada más recientemente, o null.
  async ultimaLibre() {
    const { resoluciones } = await request("/api/resoluciones?modo=libre");
    return resoluciones[0] ? conAnalisis(resoluciones[0]) : null;
  },

  // Crea el análisis previo y su resolución (BORRADOR). Sin idEjercicio es del Modo Libre.
  async create({ idEjercicio = null, analisis }) {
    const { resolucion } = await request("/api/resoluciones", {
      method: "POST",
      body: { id_ejercicio: idEjercicio, analisis_previo: aColumnas(analisis) },
    });
    return conAnalisis(resolucion);
  },

  async update(id, { analisis, estado } = {}) {
    const { resolucion } = await request(`/api/resoluciones/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: {
        ...(analisis ? { analisis_previo: aColumnas(analisis) } : {}),
        ...(estado ? { estado } : {}),
      },
    });
    return conAnalisis(resolucion);
  },
};
