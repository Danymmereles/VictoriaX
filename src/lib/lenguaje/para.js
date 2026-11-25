// ===========================================================================
// Nodo Para (for), BNF v0.16 sección 5d. Lógica pura.
//
// Un círculo en tres partes:
//   arriba             la variable que va iterando (I, J, V…)
//   abajo a la izq.    el valor inicial (desde)
//   abajo a la der.    el valor final (hasta), incluido
// Va siempre de a 1: "V | 9 | 11" es for (V = 9; V <= 11; V++).
//
// analizarPara({ variable, desde, hasta }) analiza las tres partes:
//   { ok: true, arbol: { tipo: "para", variable, desde, hasta }, usos }
//   { ok: false, error: { campo, mensaje, linea, columna, rango } }
//   campo: "variable" | "desde" | "hasta" (dónde está el error)
// ===========================================================================

import * as ast from "./ast.js";
import { analizar } from "./sintaxis.js";
import { usosDe } from "./usos.js";

// Cómo se nombra cada parte en los mensajes
export const PARTES_DEL_PARA = {
    variable: "Variable",
    desde: "Valor inicial",
    hasta: "Valor final",
};

export function analizarPara({ variable = "", desde = "", hasta = "" } = {}, opciones) {
    const partes = [
        ["variable", variable, "contador"],
        ["desde", desde, "expresion"],
        ["hasta", hasta, "expresion"],
    ];

    const arboles = {};

    for (const [campo, texto, regla] of partes) {
        const resultado = analizar(texto, regla, opciones);

        if (!resultado.ok) {
            return { ok: false, error: { campo, ...resultado.error } };
        }
        arboles[campo] = resultado.arbol;
    }

    const arbol = ast.para(arboles.variable.nombre, arboles.desde, arboles.hasta);
    return { ok: true, arbol, usos: usosDe(arbol) };
}

// "V desde 9 hasta 11", para mensajes y para el programa
export function textoDelPara({ variable = "", desde = "", hasta = "" } = {}) {
    const limpio = (t) => String(t ?? "").trim() || "?";
    return `${limpio(variable)} desde ${limpio(desde)} hasta ${limpio(hasta)}`;
}
