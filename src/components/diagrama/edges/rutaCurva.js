// ===========================================================================
// Flecha Curva: curva suave (Bézier cúbica por tramos). Lógica pura.
//
// ruta: {
//   puntos:  [{ x, y, tangente?: { x, y } }]  quiebres por donde pasa la
//            curva, fijos en el lienzo. Sin tangente: automática (suave).
//   origen?:  { x, y }  control de la salida, relativo al punto de salida
//   destino?: { x, y }  control de la llegada, relativo al de llegada
// }
// null = la curva automática (la misma que el conector "default" de
// React Flow). Los controles de las puntas son relativos para que sigan
// a los nodos.
// ===========================================================================

import { alinear, coord, restar, sumar } from "./geometria.js";

const quiebres = (ruta) => ruta?.puntos ?? [];

function normalizar(ruta) {
    const limpia = {};

    if (ruta?.puntos?.length) limpia.puntos = ruta.puntos;
    if (ruta?.origen) limpia.origen = ruta.origen;
    if (ruta?.destino) limpia.destino = ruta.destino;

    return Object.keys(limpia).length ? limpia : null;
}

// Control automático de una punta (getBezierPath de React Flow, MIT)
function desplazamiento(distancia, curvatura = 0.25) {
    return distancia >= 0 ? 0.5 * distancia : curvatura * 25 * Math.sqrt(-distancia);
}

export function controlAutomatico(lado, p, hacia) {
    switch (lado) {
        case "left":
            return { x: p.x - desplazamiento(p.x - hacia.x), y: p.y };
        case "right":
            return { x: p.x + desplazamiento(hacia.x - p.x), y: p.y };
        case "top":
            return { x: p.x, y: p.y - desplazamiento(p.y - hacia.y) };
        default:
            return { x: p.x, y: p.y + desplazamiento(hacia.y - p.y) };
    }
}

/*
 * Devuelve:
 *   puntos:    salida, quiebres y llegada
 *   tramos:    [{ a, c1, c2, b }] una Bézier cúbica por tramo
 *   controles: { origen, destino, quiebres: [{ antes, despues }] }
 */
export function geometriaCurva({ origen, ladoOrigen, destino, ladoDestino, ruta }) {
    const lista = quiebres(ruta);
    const puntos = [origen, ...lista, destino];

    // Tangente automática: Catmull-Rom (pasa suave por el quiebre)
    const tangentes = lista.map(
        (q, i) =>
            q.tangente ?? {
                x: (puntos[i + 2].x - puntos[i].x) / 6,
                y: (puntos[i + 2].y - puntos[i].y) / 6,
            }
    );

    const controlOrigen = ruta?.origen
        ? sumar(origen, ruta.origen)
        : controlAutomatico(ladoOrigen, origen, puntos[1]);
    const controlDestino = ruta?.destino
        ? sumar(destino, ruta.destino)
        : controlAutomatico(ladoDestino, destino, puntos[puntos.length - 2]);

    const tramos = puntos.slice(1).map((b, i) => ({
        a: puntos[i],
        c1: i === 0 ? controlOrigen : sumar(lista[i - 1], tangentes[i - 1]),
        c2: i === lista.length ? controlDestino : restar(lista[i], tangentes[i]),
        b,
    }));

    return {
        puntos,
        tramos,
        controles: {
            origen: controlOrigen,
            destino: controlDestino,
            quiebres: lista.map((q, i) => ({
                antes: restar(q, tangentes[i]),
                despues: sumar(q, tangentes[i]),
            })),
        },
    };
}

export const caminoCurvo = (tramos) =>
    `M ${coord(tramos[0].a)}` +
    tramos.map((t) => ` C ${coord(t.c1)} ${coord(t.c2)} ${coord(t.b)}`).join("");

export function puntoEnTramo({ a, c1, c2, b }, u) {
    const v = 1 - u;
    return {
        x: v ** 3 * a.x + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u ** 3 * b.x,
        y: v ** 3 * a.y + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u ** 3 * b.y,
    };
}

// Mitad de cada tramo: arrastrarla agrega un quiebre en esa posición
export const puntosMediosCurva = (tramos) =>
    tramos.map((t, i) => ({ indice: i, ...puntoEnTramo(t, 0.5) }));

export const insertarQuiebreCurva = (ruta, indice, p) => {
    const lista = [...quiebres(ruta)];
    lista.splice(indice, 0, { x: p.x, y: p.y });
    return normalizar({ ...ruta, puntos: lista });
};

// Mueve el quiebre (con su tangente) y lo alinea con los puntos vecinos
export const moverQuiebreCurva = (ruta, indice, p, origen, destino) => {
    const todos = [origen, ...quiebres(ruta), destino];
    const lista = [...quiebres(ruta)];
    lista[indice] = { ...lista[indice], ...alinear(p, [todos[indice], todos[indice + 2]]) };
    return normalizar({ ...ruta, puntos: lista });
};

export const quitarQuiebreCurva = (ruta, indice) =>
    normalizar({ ...ruta, puntos: quiebres(ruta).filter((_, i) => i !== indice) });

/*
 * Mueve uno de los dos controles de un quiebre (lado "antes" o
 * "despues"). La tangente es simétrica: el otro control se mueve igual.
 */
export const moverTangente = (ruta, indice, lado, p) => {
    const lista = [...quiebres(ruta)];
    const q = lista[indice];
    const t = lado === "despues" ? restar(p, q) : restar(q, p);
    lista[indice] = { ...q, tangente: t };
    return normalizar({ ...ruta, puntos: lista });
};

export const tangenteAutomatica = (ruta, indice) => {
    const lista = [...quiebres(ruta)];
    const q = { ...lista[indice] };
    delete q.tangente;
    lista[indice] = q;
    return normalizar({ ...ruta, puntos: lista });
};

// Control de una punta ("origen" o "destino"), relativo a esa punta
export const moverControlExtremo = (ruta, punta, p, extremo) =>
    normalizar({ ...ruta, [punta]: restar(p, extremo) });

export const controlExtremoAutomatico = (ruta, punta) =>
    normalizar({ ...ruta, [punta]: undefined });
