// ===========================================================================
// Flecha Derecha: línea quebrada. Lógica pura.
//
// ruta: { puntos: [{ x, y }] }  quiebres en coordenadas del lienzo, de la
// salida a la llegada. null = línea recta directa.
// Los quiebres quedan fijos en el lienzo aunque se muevan los nodos.
// ===========================================================================

import { alinear, coord, distanciaASegmento, puntoMedio } from "./geometria.js";

// Un quiebre a menos de esto de la recta entre sus vecinos sobra
const TOLERANCIA_RECTA = 1.5;

const quiebres = (ruta) => ruta?.puntos ?? [];

const normalizar = (puntos) => (puntos.length ? { puntos } : null);

// Todos los puntos de la línea: salida, quiebres y llegada
export const puntosDeRecta = (origen, destino, ruta) => [
    origen,
    ...quiebres(ruta),
    destino,
];

export const caminoRecto = (puntos) =>
    `M ${coord(puntos[0])}` +
    puntos
        .slice(1)
        .map((p) => ` L ${coord(p)}`)
        .join("");

/*
 * Punto medio de cada tramo: arrastrarlo agrega un quiebre.
 * indice: posición del quiebre nuevo dentro de ruta.puntos
 */
export const puntosMediosRecta = (puntos) =>
    puntos.slice(1).map((p, i) => ({ indice: i, ...puntoMedio(puntos[i], p) }));

export const insertarQuiebre = (ruta, indice, p) => {
    const lista = [...quiebres(ruta)];
    lista.splice(indice, 0, { x: p.x, y: p.y });
    return { puntos: lista };
};

/*
 * Mueve el quiebre `indice` a p. Se alinea con los puntos vecinos (la
 * salida, la llegada u otros quiebres) cuando está cerca, para que sea
 * fácil dejar tramos verticales u horizontales.
 */
export const moverQuiebre = (ruta, indice, p, origen, destino) => {
    const todos = puntosDeRecta(origen, destino, ruta);
    const vecinos = [todos[indice], todos[indice + 2]];
    const lista = [...quiebres(ruta)];
    lista[indice] = alinear(p, vecinos);
    return { puntos: lista };
};

export const quitarQuiebre = (ruta, indice) =>
    normalizar(quiebres(ruta).filter((_, i) => i !== indice));

// Al soltar: saca los quiebres que quedaron en línea recta con sus vecinos
export function limpiarRecta(ruta, origen, destino) {
    let lista = quiebres(ruta);
    let cambio = true;

    while (cambio) {
        cambio = false;
        const todos = [origen, ...lista, destino];

        for (let i = 0; i < lista.length; i++) {
            if (distanciaASegmento(todos[i + 1], todos[i], todos[i + 2]) < TOLERANCIA_RECTA) {
                lista = lista.filter((_, k) => k !== i);
                cambio = true;
                break;
            }
        }
    }

    return normalizar(lista);
}
