// ===========================================================================
// Seam de guardado del Análisis Previo (Modo Libre).
// ---------------------------------------------------------------------------
// Hoy: localStorage (sin cuenta). Mañana: entidad en BD ligada al usuario
// logueado (solo la última versión). La lógica de "ligar al usuario al loguearse"
// también vivirá acá. Reemplazar solo estas tres funciones; el resto no cambia.
// ===========================================================================

const KEY = "vx-analisis-previo";

export function guardarAnalisis(analisis) {
  try {
    localStorage.setItem(KEY, JSON.stringify(analisis));
  } catch {}
}

export function cargarAnalisis() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function limpiarAnalisis() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}