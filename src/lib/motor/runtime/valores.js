// ===========================================================================
// Valores y operaciones del lenguaje (BNF, sección 2). Lógica pura.
//
// Valores: número (real), lógico (TRUE / FALSE), NULL y vector (Array).
// No hay conversiones automáticas: cada operación controla sus tipos y,
// si no corresponden, es un error de ejecución con un mensaje para el
// alumno. `texto` es cómo se escribió cada operando (ver compilador/texto.js).
// ===========================================================================

import { fallar } from "./errores.js";

export const esNumero = (v) => typeof v === "number";
export const esLogico = (v) => typeof v === "boolean";
export const esVector = (v) => Array.isArray(v);

// Los vectores se copian al pasarlos o mostrarlos
export const copiar = (v) => (esVector(v) ? v.slice() : v);

// Como lo ve el alumno: coma decimal, TRUE / FALSE, NULL, [1; 2; 3]
export function formatear(v) {
    if (v === null || v === undefined) return "NULL";
    if (esLogico(v)) return v ? "TRUE" : "FALSE";
    if (esVector(v)) return `[${v.map(formatear).join("; ")}]`;
    return String(v).replace(".", ",");
}

const VERBOS = {
    "+": "sumar",
    "-": "restar",
    "*": "multiplicar",
    "/": "dividir",
    "\\": "hacer la división entera",
    "%": "calcular el resto",
    "^": "calcular la potencia",
};

export function exigirNumero(v, texto, verbo) {
    if (esNumero(v)) return;

    if (v === null) {
        fallar(`${texto} no tiene valor (NULL): no se puede ${verbo}.`);
    }

    if (esVector(v)) {
        fallar(`${texto} es un vector: usá una posición, por ejemplo ${texto}[0].`);
    }

    fallar(`${texto} vale ${formatear(v)}: para ${verbo} hace falta un número.`);
}

export function resultadoReal(r, descripcion) {
    if (!Number.isFinite(r)) {
        fallar(`${descripcion} no da un número real.`);
    }
    return r === 0 ? 0 : r; // sin -0
}

// + - * / \ % ^
export function aritmetica(op, a, b, textoA, textoB) {
    const verbo = VERBOS[op];
    exigirNumero(a, textoA, verbo);
    exigirNumero(b, textoB, verbo);

    if ((op === "/" || op === "\\" || op === "%") && b === 0) {
        fallar(`División por cero: ${textoB} vale 0.`);
    }

    let r;
    switch (op) {
        case "+": r = a + b; break;
        case "-": r = a - b; break;
        case "*": r = a * b; break;
        case "/": r = a / b; break;
        case "\\": r = Math.trunc(a / b); break; // trunca hacia 0
        case "%": r = a % b; break;              // signo de a, como fmod de C
        case "^": r = Math.pow(a, b); break;
        default: fallar(`Operador desconocido: ${op}`);
    }

    return resultadoReal(r, `${textoA} ${op} ${textoB}`);
}

export function negativo(a, texto) {
    exigirNumero(a, texto, "cambiar el signo");
    return a === 0 ? 0 : -a;
}

// < <= > >= (números) y == != (mismo tipo, o cualquiera contra NULL)
export function comparar(op, a, b, textoA, textoB) {
    if (op === "==" || op === "!=") {
        if (esVector(a) || esVector(b)) {
            fallar(`No se compara un vector entero: usá una posición (${esVector(a) ? textoA : textoB}[0]).`);
        }

        let iguales;
        if (a === null || b === null) {
            iguales = a === b;
        } else if (typeof a !== typeof b) {
            fallar(`No se puede comparar ${textoA} (${formatear(a)}) con ${textoB} (${formatear(b)}): uno es un número y el otro TRUE / FALSE.`);
        } else {
            iguales = a === b;
        }

        return op === "==" ? iguales : !iguales;
    }

    exigirNumero(a, textoA, "comparar");
    exigirNumero(b, textoB, "comparar");

    switch (op) {
        case "<": return a < b;
        case "<=": return a <= b;
        case ">": return a > b;
        case ">=": return a >= b;
        default: return fallar(`Comparación desconocida: ${op}`);
    }
}

// AND, OR, NOT y la condición de una Decisión
export function exigirLogico(v, texto, donde) {
    if (esLogico(v)) return v;

    if (v === null) {
        fallar(`${texto} no tiene valor (NULL): ${donde} necesita TRUE o FALSE.`);
    }

    fallar(`${texto} vale ${formatear(v)}: ${donde} necesita TRUE o FALSE.`);
}

// Posición de un vector: entera, de 0 a largo - 1
export function exigirIndice(i, nombre, largo, textoIndice) {
    if (!esNumero(i)) {
        fallar(`La posición de ${nombre}[${textoIndice}] no es un número (vale ${formatear(i)}).`);
    }

    if (!Number.isInteger(i)) {
        fallar(`La posición de ${nombre}[${textoIndice}] tiene decimales (${formatear(i)}).`);
    }

    if (i < 0 || i >= largo) {
        fallar(`${nombre}[${formatear(i)}] está fuera del vector: las posiciones van de 0 a ${largo - 1}.`);
    }

    return i;
}
