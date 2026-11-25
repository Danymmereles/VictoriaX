// ===========================================================================
// Léxico del lenguaje del diagrama (BNF v0.15, sección 1). Lógica pura.
//
// Convierte el texto de un nodo en tokens:
//   { tipo, valor, linea, columna, inicio, fin }
//   linea y columna empiezan en 1; inicio / fin son posiciones en el texto
//   (fin no incluido), para señalar exactamente dónde está un error.
//   tipo: "nombre" | "numero" | "reservada" | "op" | "salto" | "fin"
// Los espacios y tabulaciones se ignoran. El salto de línea es un token:
// separa sentencias en Asignación y Contexto (los demás nodos lo tratan
// como un espacio). Los operadores más largos se leen primero.
// ===========================================================================

import { SEPARADOR_DE_ARGUMENTOS, hayFunciones } from "./funciones.js";
import { esPalabraReservada } from "./nombres.js";

export class ErrorDeSintaxis extends Error {
    // rango: [inicio, fin] en el texto, si se conoce
    constructor(mensaje, linea, columna = null, rango = null) {
        super(mensaje);
        this.linea = linea;
        this.columna = columna;
        this.rango = rango;
    }
}

const OPERADORES = [
    "++", "--", "+=", "-=", "*=", "/=", "%=", "^=", "\\=",
    "==", "!=", "<=", ">=",
    "+", "-", "*", "/", "%", "\\", "^", "<", ">", "=",
    "(", ")", "[", "]", ",",
];

// Errores frecuentes con un mensaje que explica qué usar
const SUGERENCIAS = {
    "&&": "Usá AND en lugar de &&.",
    "||": "Usá OR en lugar de ||.",
    "&": "Usá AND en lugar de &.",
    "|": "Usá OR en lugar de |.",
    "!": "Usá NOT (...) en lugar de !.",
    ";": "Va una sentencia por línea: no se usa ;.",
    ".": "El punto no se usa: los decimales van con coma (0,5).",
};

export function tokenizar(texto) {
    const tokens = [];
    const s = String(texto ?? "");
    let i = 0;
    let linea = 1;
    let inicioDeLinea = 0;

    const token = (tipo, valor, inicio, fin) =>
        tokens.push({ tipo, valor, linea, columna: inicio - inicioDeLinea + 1, inicio, fin });

    // Error en la posición actual (o en un rango)
    const error = (mensaje, inicio = i, fin = i + 1) => {
        throw new ErrorDeSintaxis(mensaje, linea, inicio - inicioDeLinea + 1, [inicio, fin]);
    };

    while (i < s.length) {
        const c = s[i];

        if (c === "\n") {
            token("salto", "\n", i, i + 1);
            linea++;
            i++;
            inicioDeLinea = i;
            continue;
        }

        if (c === " " || c === "\t" || c === "\r") {
            i++;
            continue;
        }

        // Número: 3 o 3,14 (coma decimal)
        if (/[0-9]/.test(c)) {
            const m = /^[0-9]+(,[0-9]+)?/.exec(s.slice(i));
            const siguiente = s[i + m[0].length];

            if (siguiente === "." && /[0-9]/.test(s[i + m[0].length + 1] ?? "")) {
                const punto = /^[0-9]+\.[0-9]+/.exec(s.slice(i))[0];
                error(`Usá coma decimal: ${punto.replace(".", ",")} en lugar de ${punto}.`, i, i + punto.length);
            }

            if (siguiente && /[A-Za-z_]/.test(siguiente)) {
                const palabra = /^[0-9A-Za-z_]+/.exec(s.slice(i))[0];
                error(`"${palabra}": un nombre no puede empezar con un número.`, i, i + palabra.length);
            }

            token("numero", m[0], i, i + m[0].length);
            i += m[0].length;
            continue;
        }

        // Nombre o palabra reservada
        if (/[A-Za-z_]/.test(c)) {
            const palabra = /^[A-Za-z0-9_]+/.exec(s.slice(i))[0];

            if (/[^\x00-\x7F]/.test(s[i + palabra.length] ?? "")) {
                error("Los nombres no pueden tener tildes ni ñ.", i, i + palabra.length + 1);
            }

            if (esPalabraReservada(palabra)) {
                token("reservada", palabra.toUpperCase(), i, i + palabra.length);
            } else {
                token("nombre", palabra, i, i + palabra.length);
            }
            i += palabra.length;
            continue;
        }

        // ";" separa los argumentos de una función. Mientras no haya
        // funciones (ver funciones.js) sigue siendo un error con su consejo
        if (c === SEPARADOR_DE_ARGUMENTOS && hayFunciones()) {
            token("op", c, i, i + 1);
            i++;
            continue;
        }

        const operador = OPERADORES.find((op) => s.startsWith(op, i));

        if (operador) {
            token("op", operador, i, i + operador.length);
            i += operador.length;
            continue;
        }

        const sugerencia =
            SUGERENCIAS[s.slice(i, i + 2)] ?? SUGERENCIAS[c];

        if (sugerencia) {
            error(sugerencia);
        }

        if (/[^\x00-\x7F]/.test(c) && /\p{L}/u.test(c)) {
            error("Los nombres no pueden tener tildes ni ñ.");
        }

        error(`Carácter no válido: ${c}`);
    }

    token("fin", "", s.length, s.length);
    return tokens;
}
