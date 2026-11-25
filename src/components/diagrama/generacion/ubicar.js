// ===========================================================================
// Layout de los bloques generados (ver bloques.js) y conversión a nodos y
// conectores de React Flow. Lógica pura.
//
// El algoritmo generado es estructurado (secuencias y decisiones que se
// vuelven a unir), así que alcanza con un layout por ancho de subárbol:
//   - cada bloque tiene un eje vertical (x = 0) por donde entra;
//   - una Decisión deja la rama SÍ a la derecha y la NO a la izquierda,
//     igual que sus puntos de salida (handles "yes" a la derecha, "no" a
//     la izquierda), así las flechas no se cruzan;
//   - el bloque siguiente va debajo de la rama más larga.
//
// Los nodos se ubican por su centro superior (origin [0.5, 0] de React
// Flow): aunque el tamaño real difiera un poco del estimado, cada nodo
// queda centrado en su eje.
// ===========================================================================

import { placeholderDe } from "../nodeNames.js";
import { esTerminal } from "./bloques.js";

export const SEPARACION_V = 48;
export const SEPARACION_H = 48;

// Estimación del texto (14px, ver CustomNode.css)
const ANCHO_LETRA = 7.6;
const ALTO_LINEA = 17.5;

// Tamaño mínimo, márgenes (padX por lado, padY total) y ancho máximo del
// texto de cada figura. Copia de CustomNode.css.
const MEDIDAS = {
    input: { ancho: 120, alto: 55, padX: 22, padY: 16, texto: 220 },
    process: { ancho: 120, alto: 55, padX: 12, padY: 16, texto: 220 },
    output: { ancho: 120, alto: 55, padX: 22, padY: 16, texto: 220 },
    decision: { ancho: 120, alto: 120, padX: 30, padY: 60, texto: 140 },
    document: { ancho: 160, alto: 90, padX: 16, padY: 32, texto: 220 },
    io: { ancho: 160, alto: 80, padX: 32, padY: 16, texto: 220 },
    preparation: { ancho: 160, alto: 80, padX: 32, padY: 16, texto: 220 },
    subroutine: { ancho: 160, alto: 80, padX: 32, padY: 16, texto: 220 },
    random: { ancho: 120, alto: 64, padX: 26, padY: 16, texto: 220 },
    connector: { ancho: 56, alto: 56, padX: 6, padY: 12, texto: 220 },
    context: { ancho: 180, alto: 80, padX: 28, padY: 24, texto: 320 },
    end: { ancho: 100, alto: 48, padX: 22, padY: 16, texto: 220 },
};

const TAMANO_CONECTOR = MEDIDAS.connector.ancho;

// Datos del nodo de React Flow que salen del spec del bloque
const CAMPOS_DATA = ["type", "label", "hint", "pending", "handleSide", "anchorOf"];

export function estimarTamano(spec) {
    const m = MEDIDAS[spec.type] ?? MEDIDAS.process;
    const texto =
        spec.type === "end"
            ? "Fin"
            : spec.label || spec.hint || placeholderDe(spec.type);

    let anchoTexto = 0;
    let renglones = 0;

    String(texto)
        .split("\n")
        .forEach((linea) => {
            const ancho = linea.length * ANCHO_LETRA;
            renglones += Math.max(1, Math.ceil(ancho / m.texto));
            anchoTexto = Math.max(anchoTexto, Math.min(ancho, m.texto));
        });

    return {
        ancho: Math.max(m.ancho, Math.ceil(anchoTexto + 2 * m.padX)),
        alto: Math.max(m.alto, Math.ceil(renglones * ALTO_LINEA + m.padY)),
    };
}


// ---------------------------------------------------------------------------
// Marcos: resultado de ubicar un bloque, relativo a su eje (x = 0) y a su
// borde superior (y = 0).
//   nodos:    [{ id, spec, x (centro), y (arriba), ancho, alto }]
//   aristas:  [{ source, sourceHandle, target, targetHandle }]
//   entrada:  { id, handle } por donde entra el flujo
//   salidas:  [{ id, handle }] que siguen en el bloque de abajo
//   izq, der: extensión horizontal respecto del eje
//   alto
// ---------------------------------------------------------------------------

const VACIO = { vacio: true };

function mover(marco, dx, dy) {
    return {
        ...marco,
        nodos: marco.nodos.map((n) => ({ ...n, x: n.x + dx, y: n.y + dy })),
    };
}

function conectar(salidas, entrada, aristas) {
    salidas.forEach((s) => {
        aristas.push({
            source: s.id,
            sourceHandle: s.handle,
            target: entrada.id,
            targetHandle: entrada.handle,
        });
    });
}

function handleDeEntrada(type) {
    if (type === "decision") return "input";
    if (type === "connector") return "c-in";
    return null;
}

function ubicarNodo(spec, ctx) {
    const id = spec.id ?? ctx.nuevoId();
    const { ancho, alto } = estimarTamano(spec);

    return {
        nodos: [{ id, spec, x: 0, y: 0, ancho, alto }],
        aristas: [],
        entrada: { id, handle: handleDeEntrada(spec.type) },
        salidas: esTerminal(spec)
            ? []
            : [{ id, handle: spec.type === "connector" ? "c-out" : null }],
        izq: -ancho / 2,
        der: ancho / 2,
        alto,
    };
}

function ubicarSecuencia(bloque, ctx) {
    const marcos = bloque.items
        .map((item) => ubicarBloque(item, ctx))
        .filter((m) => !m.vacio);

    if (marcos.length === 0) {
        return VACIO;
    }

    const nodos = [];
    const aristas = [];
    let entrada = null;
    let salidas = [];
    let izq = 0;
    let der = 0;
    let y = 0;

    marcos.forEach((marco, k) => {
        const m = mover(marco, 0, y);

        nodos.push(...m.nodos);
        aristas.push(...m.aristas);

        if (k === 0) {
            entrada = m.entrada;
        } else {
            conectar(salidas, m.entrada, aristas);
        }

        salidas = m.salidas;
        izq = Math.min(izq, marco.izq);
        der = Math.max(der, marco.der);
        y += marco.alto + SEPARACION_V;
    });

    return { nodos, aristas, entrada, salidas, izq, der, alto: y - SEPARACION_V };
}

function ubicarSi(bloque, ctx) {
    const d = ubicarNodo(bloque.decision, ctx);
    const idD = d.entrada.id;
    const { ancho, alto } = d.nodos[0];

    const nodos = [...d.nodos];
    const aristas = [];
    const salidas = [];
    let izq = -ancho / 2;
    let der = ancho / 2;
    let altoRamas = 0;

    const yRama = alto + SEPARACION_V;
    // Las ramas salen hacia afuera del rombo
    const margen = ancho / 2 + 24;

    const ramas = [
        { bloque: bloque.si, handle: "yes", lado: 1 },
        { bloque: bloque.no, handle: "no", lado: -1 },
    ];

    ramas.forEach(({ bloque: rama, handle, lado }) => {
        const marco = rama ? ubicarBloque(rama, ctx) : VACIO;

        if (marco.vacio) {
            // Rama vacía: la salida es el punto de la Decisión
            salidas.push({ id: idD, handle });
            return;
        }

        const eje =
            lado > 0
                ? Math.max(margen, SEPARACION_H / 2 - marco.izq)
                : -Math.max(margen, SEPARACION_H / 2 + marco.der);

        const m = mover(marco, eje, yRama);

        nodos.push(...m.nodos);
        aristas.push(...m.aristas, {
            source: idD,
            sourceHandle: handle,
            target: m.entrada.id,
            targetHandle: m.entrada.handle,
        });
        salidas.push(...m.salidas);

        izq = Math.min(izq, eje + marco.izq);
        der = Math.max(der, eje + marco.der);
        altoRamas = Math.max(altoRamas, marco.alto);
    });

    return {
        nodos,
        aristas,
        entrada: d.entrada,
        salidas,
        izq,
        der,
        alto: alto + (altoRamas ? SEPARACION_V + altoRamas : 0),
    };
}

/*
 * Conector de llegada arriba a la izquierda del primer nodo del bloque,
 * con su punto a la derecha, mirando al nodo.
 */
function ubicarLlegada(bloque, ctx) {
    const marco = ubicarBloque(bloque.bloque, ctx);

    if (marco.vacio) {
        return marco;
    }

    const destino = marco.nodos.find((n) => n.id === marco.entrada.id);
    const id = ctx.nuevoId();
    const x = destino.x - destino.ancho / 2 - SEPARACION_H - TAMANO_CONECTOR / 2;
    const y = destino.y - TAMANO_CONECTOR + 8;

    return {
        ...marco,
        nodos: [
            ...marco.nodos,
            {
                id,
                spec: { type: "connector", label: bloque.etiqueta, handleSide: "right" },
                x,
                y,
                ancho: TAMANO_CONECTOR,
                alto: TAMANO_CONECTOR,
            },
        ],
        aristas: [
            ...marco.aristas,
            {
                source: id,
                sourceHandle: "c-out",
                target: destino.id,
                targetHandle: marco.entrada.handle,
            },
        ],
        izq: Math.min(marco.izq, x - TAMANO_CONECTOR / 2),
    };
}

/*
 * Selección entre 3 eventos: tres decisiones en dos filas y las tres
 * ramas abajo, con la del evento 3 en el medio (llegan las dos
 * decisiones de la segunda fila).
 *
 *                 d1
 *         d3              d2
 *    e2          e3            e1
 */
function ubicarSeleccion3(bloque, ctx) {
    const d1 = ubicarNodo(bloque.d1, ctx);
    const d2 = ubicarNodo(bloque.d2, ctx);
    const d3 = ubicarNodo(bloque.d3, ctx);
    const f1 = ubicarBloque(bloque.e1, ctx);
    const f2 = ubicarBloque(bloque.e2, ctx);
    const f3 = ubicarBloque(bloque.e3, ctx);

    const [n1, n2, n3] = [d1, d2, d3].map((d) => d.nodos[0]);

    let eje1 = f3.der + SEPARACION_H - f1.izq;
    let eje2 = f3.izq - SEPARACION_H - f2.der;

    // Que d2 y d3 no se toquen
    const falta = (n2.ancho + n3.ancho) / 2 + SEPARACION_H - (eje1 - eje2) / 2;
    if (falta > 0) {
        eje1 += falta;
        eje2 -= falta;
    }

    const ejeD2 = eje1 / 2;
    const ejeD3 = eje2 / 2;

    const y2 = n1.alto + SEPARACION_V;
    const y3 = y2 + Math.max(n2.alto, n3.alto) + SEPARACION_V;

    const m1 = mover(f1, eje1, y3);
    const m2 = mover(f2, eje2, y3);
    const m3 = mover(f3, 0, y3);

    const arista = (source, sourceHandle, destino) => ({
        source,
        sourceHandle,
        target: destino.id,
        targetHandle: destino.handle,
    });

    return {
        nodos: [
            ...d1.nodos,
            ...mover(d2, ejeD2, y2).nodos,
            ...mover(d3, ejeD3, y2).nodos,
            ...m1.nodos,
            ...m2.nodos,
            ...m3.nodos,
        ],
        aristas: [
            ...m1.aristas,
            ...m2.aristas,
            ...m3.aristas,
            arista(n1.id, "yes", d2.entrada),
            arista(n1.id, "no", d3.entrada),
            arista(n2.id, "yes", m1.entrada),
            arista(n2.id, "no", m3.entrada),
            arista(n3.id, "yes", m3.entrada),
            arista(n3.id, "no", m2.entrada),
        ],
        entrada: d1.entrada,
        salidas: [...m1.salidas, ...m3.salidas, ...m2.salidas],
        izq: Math.min(eje2 + f2.izq, ejeD3 - n3.ancho / 2),
        der: Math.max(eje1 + f1.der, ejeD2 + n2.ancho / 2),
        alto: y3 + Math.max(f1.alto, f2.alto, f3.alto),
    };
}

function ubicarBloque(bloque, ctx) {
    switch (bloque?.kind) {
        case "nodo":
            return ubicarNodo(bloque.spec, ctx);
        case "seq":
            return ubicarSecuencia(bloque, ctx);
        case "si":
            return ubicarSi(bloque, ctx);
        case "llegada":
            return ubicarLlegada(bloque, ctx);
        case "sel3":
            return ubicarSeleccion3(bloque, ctx);
        default:
            return VACIO;
    }
}


function datosDe(spec) {
    const data = {};

    CAMPOS_DATA.forEach((campo) => {
        if (spec[campo] !== undefined) {
            data[campo] = spec[campo];
        }
    });

    return data;
}

/*
 * Ubica el bloque y lo convierte en nodos y conectores de React Flow.
 * El primer nodo queda con su centro superior en (0, 0).
 *   prefijo:  para los ids (uno por página, así no se repiten)
 *   edgeType: tipo de conector elegido en el editor
 */
export function ubicar(bloque, { prefijo, edgeType = "smoothstep" }) {
    let contador = 0;
    const ctx = { nuevoId: () => `gen-${prefijo}-${++contador}` };

    const marco = ubicarBloque(bloque, ctx);

    if (marco.vacio) {
        return { nodes: [], edges: [] };
    }

    const nodes = marco.nodos.map((n) => ({
        id: n.id,
        type: "custom",
        position: { x: Math.round(n.x), y: Math.round(n.y) },
        origin: [0.5, 0],
        ...(n.spec.deletable === false && { deletable: false }),
        data: datosDe(n.spec),
    }));

    const edges = marco.aristas.map((a, k) => ({
        id: `gen-${prefijo}-e${k + 1}`,
        source: a.source,
        target: a.target,
        ...(a.sourceHandle && { sourceHandle: a.sourceHandle }),
        ...(a.targetHandle && { targetHandle: a.targetHandle }),
        type: edgeType,
    }));

    return { nodes, edges };
}
