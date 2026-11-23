// ===========================================================================
// Nodo Para (for) en el editor. Lógica pura.
//
// data: { type: "for", label: <variable>, desde: <texto>, hasta: <texto> }
// La variable va en label, como el texto de los demás nodos, así lo que
// trabaja con el nombre del nodo (nombres repetidos, describirNodo…)
// sigue funcionando.
//
// Puntos de conexión (handles):
//   arriba      ENTRADA (target)  llega el flujo: V toma el valor inicial
//   izquierda   VUELTA  (target)  vuelve el cuerpo: V = V + 1
//   abajo       CICLO   (source)  el cuerpo, mientras V <= valor final
//   derecha     SALIDA  (source)  sigue, cuando V pasa el valor final
// Ver la gramática en lib/lenguaje/para.js.
// ===========================================================================

import { analizarPara, textoDelPara } from "@/lib/lenguaje";

export const TIPO_PARA = "for";

export const HANDLES_DEL_PARA = {
    entrada: "entrada",
    vuelta: "vuelta",
    ciclo: "ciclo",
    salida: "salida",
};

export const esPara = (node) => node?.data?.type === TIPO_PARA;

// Las tres partes del nodo, como texto
export const partesDelPara = (data = {}) => ({
    variable: String(data.label ?? ""),
    desde: String(data.desde ?? ""),
    hasta: String(data.hasta ?? ""),
});

// Sin nada escrito todavía (no se marca en el editor)
export const paraVacio = (data) =>
    Object.values(partesDelPara(data)).every((texto) => !texto.trim());

// "V desde 9 hasta 11"
export const textoDePara = (data) => textoDelPara(partesDelPara(data));

// Cache: el editor revisa los nodos cada vez que cambia la página
const cache = new Map();
const LIMITE_CACHE = 300;

export function analizarNodoPara(data) {
    const partes = partesDelPara(data);
    const clave = `${partes.variable}\u0000${partes.desde}\u0000${partes.hasta}`;

    if (!cache.has(clave)) {
        if (cache.size >= LIMITE_CACHE) {
            cache.delete(cache.keys().next().value);
        }
        cache.set(clave, analizarPara(partes));
    }

    return cache.get(clave);
}

// Variables que crean los Para de una página (nombres válidos)
export function variablesDeLosPara(nodes) {
    const nombres = new Set();

    nodes.filter(esPara).forEach((node) => {
        const resultado = analizarNodoPara(node.data);
        if (resultado.ok) nombres.add(resultado.arbol.variable);
    });

    return nombres;
}
