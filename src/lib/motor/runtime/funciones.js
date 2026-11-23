// ===========================================================================
// Implementación de las FUNCIONES del lenguaje en el motor. Lógica pura.
//
// Vacío en esta primera versión (ver lib/lenguaje/funciones.js). Cada
// función del catálogo del lenguaje necesita acá su implementación, con el
// mismo nombre en mayúsculas:
//   LN: (x) => Math.log(x),
// Los argumentos llegan ya controlados como números y el resultado se
// controla como número real (ver compilador/expresiones.js).
// ===========================================================================

export const IMPLEMENTACIONES = {};

export const implementacionDe = (nombre) => IMPLEMENTACIONES[String(nombre).toUpperCase()] ?? null;
