// ===========================================================================
// Tamaño del nodo Para: el círculo crece hasta que entra el texto de cada
// parte. Se mide con un canvas (sin tocar el DOM), con la letra del nodo.
// ===========================================================================

export const DIAMETRO_MINIMO = 112;
export const DIAMETRO_MAXIMO = 320;

const FUENTE = '500 14px Inter, ui-sans-serif, system-ui, sans-serif';

let contexto = null;

function anchoDe(texto) {
    if (typeof document === "undefined") {
        return String(texto).length * 8;
    }

    if (!contexto) {
        contexto = document.createElement("canvas").getContext("2d");
    }

    if (!contexto) {
        return String(texto).length * 8;
    }

    contexto.font = FUENTE;
    return contexto.measureText(String(texto)).width;
}

/*
 * Cada texto va en su zona del círculo (ver NodoPara.css):
 *   arriba:  76% del diámetro de ancho;
 *   abajo:   37% para cada valor (separados por la línea del medio).
 * El círculo crece hasta que el texto más largo entra en su zona, con
 * un pequeño margen, hasta DIAMETRO_MAXIMO: más allá, el texto se corta
 * con "…" (el texto entero se ve al pasar el mouse).
 */
export const ZONA_DE_ARRIBA = 0.76;
export const ZONA_DE_ABAJO = 0.37;

export function diametroDelPara({ variable, desde, hasta }) {
    const arriba = (anchoDe(variable) + 10) / ZONA_DE_ARRIBA;
    const abajo = (Math.max(anchoDe(desde), anchoDe(hasta)) + 6) / ZONA_DE_ABAJO;

    const diametro = Math.ceil(Math.max(DIAMETRO_MINIMO, arriba, abajo));
    return Math.min(DIAMETRO_MAXIMO, diametro + (diametro % 2));
}
