// ===========================================================================
// Errores de ejecución: detienen la corrida e indican qué pasó, en qué
// página, en qué nodo y (en Asignación / Contexto) en qué línea.
// ===========================================================================

export class ErrorDeEjecucion extends Error {
    constructor(mensaje) {
        super(mensaje);
        this.linea = null;     // la completa sentencias.js
        this.ubicacion = null; // la completa el intérprete: { paginaId, pagina, nodoId, texto }
    }
}

export const fallar = (mensaje) => {
    throw new ErrorDeEjecucion(mensaje);
};
