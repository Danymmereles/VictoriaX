// ===========================================================================
// Qué variables se pueden graficar contra T. Lógica pura.
//
// No tiene sentido graficarlas todas: T es el eje horizontal, TF y HV son
// constantes, los tiempos de los eventos futuros crecen solos y las
// variables de datos ya se sabe cómo se comportan (son fdp). Se ofrecen:
//   - Estado: las del Análisis Previo (NS, cola, pedidos…);
//   - Auxiliares: las creadas en el diagrama (generadas y agregadas a
//     mano en la tabla) y las variables de los Para de Main.
// Sin vectores ni Random.
//
// variablesParaGraficar({ variables, main }) →
//   { tiempo: "T" | null,
//     variables: [{ nombre, grupo: "estado" | "auxiliar", dePara?, color }] }
//   tiempo: null si la tabla no tiene T (no hay eje horizontal)
//   color:  índice fijo en la paleta del gráfico (--dg-chart-1…6), así
//           cada variable tiene siempre el mismo color
// ===========================================================================

import { ORIGEN_GENERADA } from "../../variables.js";
import { variablesDeLosPara } from "../../para/para.js";

export const VARIABLE_DE_TIEMPO = "T";

// Se excluyen aunque estén en la tabla
export const NO_SE_GRAFICAN = new Set([VARIABLE_DE_TIEMPO, "TF", "HV"]);

const nombreDe = (variable) => String(variable?.nombre ?? "").trim();

export function variablesParaGraficar({ variables = [], main = null } = {}) {
    const usados = new Set();

    const sirve = (variable) => {
        const nombre = nombreDe(variable);
        return nombre && !variable.esVector && !variable.esRandom && !NO_SE_GRAFICAN.has(nombre);
    };

    const sinRepetir = (nombre) => {
        if (usados.has(nombre)) return false;
        usados.add(nombre);
        return true;
    };

    const estado = variables
        .filter((v) => v.origen === "estado" && sirve(v))
        .map(nombreDe)
        .filter(sinRepetir)
        .map((nombre) => ({ nombre, grupo: "estado" }));

    const auxiliares = variables
        .filter((v) => (!v.origen || v.origen === ORIGEN_GENERADA) && sirve(v))
        .map(nombreDe)
        .filter(sinRepetir)
        .map((nombre) => ({ nombre, grupo: "auxiliar" }));

    // Las que crean los Para de Main (si no están en la tabla)
    const tabla = new Set(variables.map(nombreDe));
    const dePara = [...variablesDeLosPara(main?.nodes ?? [])]
        .filter((nombre) => !tabla.has(nombre) && !NO_SE_GRAFICAN.has(nombre))
        .filter(sinRepetir)
        .map((nombre) => ({ nombre, grupo: "auxiliar", dePara: true }));

    const tieneTiempo = variables.some(
        (v) => nombreDe(v) === VARIABLE_DE_TIEMPO && !v.esVector && !v.esRandom
    );

    return {
        tiempo: tieneTiempo ? VARIABLE_DE_TIEMPO : null,
        variables: [...estado, ...auxiliares, ...dePara].map((v, color) => ({ ...v, color })),
    };
}
