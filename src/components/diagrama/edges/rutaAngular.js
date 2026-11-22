// ===========================================================================
// Flecha Angular: solo tramos horizontales y verticales, con esquinas
// redondeadas. Lógica pura.
//
// Modelo: la flecha es una sucesión de tramos que alternan vertical y
// horizontal. El primero sale en la dirección del punto de salida y el
// último entra en la dirección del de llegada. Cada tramo tiene una
// coordenada fija (x si es vertical, y si es horizontal):
//
//   fijos = [salida, ...intermedios, llegada]
//
// La del primero y la del último las dan los puntos de conexión (siguen a
// los nodos); las intermedias son las que el usuario mueve.
//
// ruta: { intermedios: [n, ...] }  null = ruta automática (la misma que el
// conector "smoothstep" de React Flow).
// ===========================================================================

import { DIRECCIONES, coord, esLateral, iman } from "./geometria.js";

// Largo del tramo corto que sale de un punto de conexión (igual que
// React Flow) y radio de las esquinas
export const SALIENTE = 20;
export const RADIO = 5;

// Tramo más corto que muestra su manija
const LARGO_MINIMO_MANIJA = 16;

const V = "V";
const H = "H";

const orientacionDe = (lado) => (esLateral(lado) ? H : V);
const otra = (o) => (o === V ? H : V);
const orientacionDelTramo = (inicial, j) => (j % 2 === 0 ? inicial : otra(inicial));

// Coordenada fija de un tramo con esa orientación que pasa por p
const fijoDe = (p, o) => (o === V ? p.x : p.y);


// ---------------------------------------------------------------------------
// Ruta automática: adaptación de getPoints del conector smoothstep de
// React Flow (@xyflow/system, licencia MIT), con su "centro" por defecto.
// ---------------------------------------------------------------------------

function direccionGeneral(origen, ladoOrigen, destino) {
    if (esLateral(ladoOrigen)) {
        return origen.x < destino.x ? { x: 1, y: 0 } : { x: -1, y: 0 };
    }
    return origen.y < destino.y ? { x: 0, y: 1 } : { x: 0, y: -1 };
}

export function puntosAutomaticos({ origen, ladoOrigen, destino, ladoDestino }) {
    const dirOrigen = DIRECCIONES[ladoOrigen] ?? DIRECCIONES.bottom;
    const dirDestino = DIRECCIONES[ladoDestino] ?? DIRECCIONES.top;
    const salida = { x: origen.x + dirOrigen.x * SALIENTE, y: origen.y + dirOrigen.y * SALIENTE };
    const llegada = { x: destino.x + dirDestino.x * SALIENTE, y: destino.y + dirDestino.y * SALIENTE };
    const dir = direccionGeneral(salida, ladoOrigen, llegada);
    const eje = dir.x !== 0 ? "x" : "y";
    const sentido = dir[eje];

    const ajusteSalida = { x: 0, y: 0 };
    const ajusteLlegada = { x: 0, y: 0 };
    let puntos;

    if (dirOrigen[eje] * dirDestino[eje] === -1) {
        // Lados opuestos: un tramo al medio
        const centroX = (origen.x + destino.x) / 2;
        const centroY = (origen.y + destino.y) / 2;
        const corteVertical = [
            { x: centroX, y: salida.y },
            { x: centroX, y: llegada.y },
        ];
        const corteHorizontal = [
            { x: salida.x, y: centroY },
            { x: llegada.x, y: centroY },
        ];

        if (dirOrigen[eje] === sentido) {
            puntos = eje === "x" ? corteVertical : corteHorizontal;
        } else {
            puntos = eje === "x" ? corteHorizontal : corteVertical;
        }
    } else {
        // Lados iguales o perpendiculares: una esquina
        const origenDestino = [{ x: salida.x, y: llegada.y }];
        const destinoOrigen = [{ x: llegada.x, y: salida.y }];

        if (eje === "x") {
            puntos = dirOrigen.x === sentido ? destinoOrigen : origenDestino;
        } else {
            puntos = dirOrigen.y === sentido ? origenDestino : destinoOrigen;
        }

        if (ladoOrigen === ladoDestino) {
            const diferencia = Math.abs(origen[eje] - destino[eje]);

            if (diferencia <= SALIENTE) {
                const ajuste = Math.min(SALIENTE - 1, SALIENTE - diferencia);

                if (dirOrigen[eje] === sentido) {
                    ajusteSalida[eje] = (salida[eje] > origen[eje] ? -1 : 1) * ajuste;
                } else {
                    ajusteLlegada[eje] = (llegada[eje] > destino[eje] ? -1 : 1) * ajuste;
                }
            }
        } else {
            const ejeOpuesto = eje === "x" ? "y" : "x";
            const mismoSentido = dirOrigen[eje] === dirDestino[ejeOpuesto];
            const salidaMayor = salida[ejeOpuesto] > llegada[ejeOpuesto];
            const salidaMenor = salida[ejeOpuesto] < llegada[ejeOpuesto];
            const invertir =
                (dirOrigen[eje] === 1 &&
                    ((!mismoSentido && salidaMayor) || (mismoSentido && salidaMenor))) ||
                (dirOrigen[eje] !== 1 &&
                    ((!mismoSentido && salidaMenor) || (mismoSentido && salidaMayor)));

            if (invertir) {
                puntos = eje === "x" ? origenDestino : destinoOrigen;
            }
        }
    }

    return [
        origen,
        { x: salida.x + ajusteSalida.x, y: salida.y + ajusteSalida.y },
        ...puntos,
        { x: llegada.x + ajusteLlegada.x, y: llegada.y + ajusteLlegada.y },
        destino,
    ];
}

/*
 * Puntos → coordenadas fijas de los tramos. Une los tramos seguidos con
 * la misma orientación y descarta los de largo 0.
 */
function fijosDesdePuntos(puntos, inicial) {
    const tramos = [];

    for (let i = 1; i < puntos.length; i++) {
        const a = puntos[i - 1];
        const b = puntos[i];

        if (Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01) {
            continue;
        }

        const o = Math.abs(a.x - b.x) < 0.01 ? V : H;

        if (tramos.length && tramos[tramos.length - 1].o === o) {
            continue;
        }

        tramos.push({ o, fijo: fijoDe(a, o) });
    }

    // El primer tramo siempre sale en la dirección de la salida
    if (!tramos.length || tramos[0].o !== inicial) {
        tramos.unshift({ o: inicial, fijo: fijoDe(puntos[0], inicial) });
    }

    return tramos.map((t) => t.fijo);
}


// ---------------------------------------------------------------------------
// Geometría de la flecha (automática o con la ruta del usuario)
// ---------------------------------------------------------------------------

// ¿La ruta guardada sirve para estos puntos de conexión?
function fijosGuardados({ origen, ladoOrigen, destino, ladoDestino, ruta }) {
    const intermedios = ruta?.intermedios;

    if (!Array.isArray(intermedios)) {
        return null;
    }

    const inicial = orientacionDe(ladoOrigen);
    const final = orientacionDe(ladoDestino);
    const fijoSalida = fijoDe(origen, inicial);
    const fijoLlegada = fijoDe(destino, final);

    // Un solo tramo: salida y llegada alineadas
    if (intermedios.length === 0 && inicial === final) {
        return Math.abs(fijoSalida - fijoLlegada) < 0.5 ? [fijoSalida] : null;
    }

    const cantidad = intermedios.length + 2;

    if (orientacionDelTramo(inicial, cantidad - 1) !== final) {
        return null;
    }

    return [fijoSalida, ...intermedios, fijoLlegada];
}

// Esquinas: entre el tramo j y el j + 1
function puntosDesdeFijos(fijos, inicial, origen, destino) {
    const puntos = [origen];

    for (let j = 0; j < fijos.length - 1; j++) {
        const o = orientacionDelTramo(inicial, j);
        puntos.push(o === V ? { x: fijos[j], y: fijos[j + 1] } : { x: fijos[j + 1], y: fijos[j] });
    }

    puntos.push(destino);
    return puntos;
}

/*
 * Devuelve:
 *   inicial:  orientación del primer tramo ("V" o "H")
 *   fijos:    coordenada fija de cada tramo
 *   puntos:   salida, esquinas y llegada
 *   tramos:   [{ indice, orientacion, medio, largo, movible }]
 *   personalizada: si usa la ruta del usuario
 */
export function geometriaAngular({ origen, ladoOrigen, destino, ladoDestino, ruta }) {
    const inicial = orientacionDe(ladoOrigen);
    const guardados = fijosGuardados({ origen, ladoOrigen, destino, ladoDestino, ruta });
    const fijos =
        guardados ??
        fijosDesdePuntos(
            puntosAutomaticos({ origen, ladoOrigen, destino, ladoDestino }),
            inicial
        );

    const puntos = puntosDesdeFijos(fijos, inicial, origen, destino);
    const cantidad = fijos.length;

    const tramos = puntos.slice(1).map((b, j) => {
        const a = puntos[j];
        const interno = j > 0 && j < cantidad - 1;
        const largo = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

        return {
            indice: j,
            orientacion: orientacionDelTramo(inicial, j),
            medio: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
            largo,
            // Se mueven los tramos del medio; si no hay, los de las puntas
            // (se agregan quiebres para seguir saliendo derecho del nodo)
            movible: (interno || cantidad <= 2) && largo >= LARGO_MINIMO_MANIJA,
        };
    });

    return { inicial, fijos, puntos, tramos, personalizada: Boolean(guardados) };
}

/*
 * Mueve el tramo j a la coordenada `valor` (x si es vertical, y si es
 * horizontal). Si el tramo toca un punto de conexión, se agrega un tramo
 * corto para que la flecha siga saliendo (o entrando) derecho.
 * Se pega a la coordenada de otros tramos paralelos cercanos.
 * Devuelve la ruta nueva.
 */
export function moverTramo(geo, j, valor, { origen, ladoOrigen, destino, ladoDestino }) {
    const { fijos, inicial } = geo;
    const cantidad = fijos.length;
    const o = orientacionDelTramo(inicial, j);

    // Paralelos para alinear: los vecinos de dos lugares y las puntas
    const paralelos = [fijos[j - 2], fijos[j + 2]].filter((v) => v !== undefined);
    if (orientacionDe(ladoOrigen) === o) paralelos.push(fijoDe(origen, o));
    if (orientacionDe(ladoDestino) === o) paralelos.push(fijoDe(destino, o));
    const v = iman(valor, paralelos);

    const dirOrigen = DIRECCIONES[ladoOrigen];
    const dirDestino = DIRECCIONES[ladoDestino];
    const ejeOrigen = esLateral(ladoOrigen) ? "x" : "y";
    const ejeDestino = esLateral(ladoDestino) ? "x" : "y";
    const salienteOrigen = origen[ejeOrigen] + dirOrigen[ejeOrigen] * SALIENTE;
    const salienteDestino = destino[ejeDestino] + dirDestino[ejeDestino] * SALIENTE;

    let nuevos;

    if (cantidad === 1) {
        nuevos = [fijos[0], salienteOrigen, v, salienteDestino, fijoDe(destino, orientacionDe(ladoDestino))];
    } else if (j === 0) {
        nuevos = [fijos[0], salienteOrigen, v, ...fijos.slice(1)];
    } else if (j === cantidad - 1) {
        nuevos = [...fijos.slice(0, -1), v, salienteDestino, fijos[cantidad - 1]];
    } else {
        nuevos = [...fijos];
        nuevos[j] = v;
    }

    return { intermedios: nuevos.slice(1, -1) };
}

/*
 * Al soltar: saca los tramos de largo 0 (cuando un tramo quedó alineado
 * con otro paralelo, los dos se unen).
 */
export function simplificarAngular(ruta, contexto) {
    const geo = geometriaAngular({ ...contexto, ruta });

    if (!geo.personalizada) {
        return ruta;
    }

    let fijos = [...geo.fijos];
    let cambio = true;

    while (cambio && fijos.length >= 3) {
        cambio = false;

        for (let j = 1; j < fijos.length - 1; j++) {
            if (Math.abs(fijos[j + 1] - fijos[j - 1]) < 0.5) {
                if (fijos.length === 3) {
                    fijos = [fijos[0]];
                } else if (j + 1 === fijos.length - 1) {
                    fijos.splice(j - 1, 2);
                } else {
                    fijos.splice(j, 2);
                }
                cambio = true;
                break;
            }
        }
    }

    return { intermedios: fijos.length === 1 ? [] : fijos.slice(1, -1) };
}

/*
 * Camino SVG con esquinas redondeadas (adaptación de getBend de React
 * Flow, licencia MIT).
 */
export function caminoAngular(puntos, radio = RADIO) {
    let d = `M ${coord(puntos[0])}`;

    for (let i = 1; i < puntos.length - 1; i++) {
        const a = puntos[i - 1];
        const b = puntos[i];
        const c = puntos[i + 1];
        const r = Math.min(
            Math.hypot(a.x - b.x, a.y - b.y) / 2,
            Math.hypot(b.x - c.x, b.y - c.y) / 2,
            radio
        );

        if ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y) || r === 0) {
            d += ` L ${coord(b)}`;
        } else if (a.y === b.y) {
            const sx = a.x < c.x ? -1 : 1;
            const sy = a.y < c.y ? 1 : -1;
            d += ` L ${coord({ x: b.x + r * sx, y: b.y })} Q ${coord(b)} ${coord({ x: b.x, y: b.y + r * sy })}`;
        } else {
            const sx = a.x < c.x ? 1 : -1;
            const sy = a.y < c.y ? -1 : 1;
            d += ` L ${coord({ x: b.x, y: b.y + r * sy })} Q ${coord(b)} ${coord({ x: b.x + r * sx, y: b.y })}`;
        }
    }

    return `${d} L ${coord(puntos[puntos.length - 1])}`;
}
