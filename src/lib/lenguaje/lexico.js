// ===========================================================================
// Léxico del lenguaje del diagrama (BNF v0.15, sección 1). Lógica pura.
//
// Convierte el texto de un nodo en tokens:
//   { tipo, valor, linea }
//   tipo: "nombre" | "numero" | "reservada" | "op" | "salto" | "fin"
// Los espacios y tabulaciones se ignoran. El salto de línea es un token:
// separa sentencias en Asignación y Contexto (los demás nodos lo tratan
// como un espacio). Los operadores más largos se leen primero.
// ===========================================================================

import { esPalabraReservada } from "./nombres.js";

export class ErrorDeSintaxis extends Error {
    constructor(mensaje, linea) {
        super(mensaje);
        this.linea = linea;
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

    while (i < s.length) {
        const c = s[i];

        if (c === "\n") {
            tokens.push({ tipo: "salto", valor: "\n", linea });
            linea++;
            i++;
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
                throw new ErrorDeSintaxis(
                    `Usá coma decimal: ${punto.replace(".", ",")} en lugar de ${punto}.`,
                    linea
                );
            }

            if (siguiente && /[A-Za-z_]/.test(siguiente)) {
                const palabra = /^[0-9A-Za-z_]+/.exec(s.slice(i))[0];
                throw new ErrorDeSintaxis(
                    `"${palabra}": un nombre no puede empezar con un número.`,
                    linea
                );
            }

            tokens.push({ tipo: "numero", valor: m[0], linea });
            i += m[0].length;
            continue;
        }

        // Nombre o palabra reservada
        if (/[A-Za-z_]/.test(c)) {
            const palabra = /^[A-Za-z0-9_]+/.exec(s.slice(i))[0];

            if (/[^\x00-\x7F]/.test(s[i + palabra.length] ?? "")) {
                throw new ErrorDeSintaxis("Los nombres no pueden tener tildes ni ñ.", linea);
            }

            tokens.push(
                esPalabraReservada(palabra)
                    ? { tipo: "reservada", valor: palabra.toUpperCase(), linea }
                    : { tipo: "nombre", valor: palabra, linea }
            );
            i += palabra.length;
            continue;
        }

        const operador = OPERADORES.find((op) => s.startsWith(op, i));

        if (operador) {
            tokens.push({ tipo: "op", valor: operador, linea });
            i += operador.length;
            continue;
        }

        const sugerencia =
            SUGERENCIAS[s.slice(i, i + 2)] ?? SUGERENCIAS[c];

        if (sugerencia) {
            throw new ErrorDeSintaxis(sugerencia, linea);
        }

        if (/[^\x00-\x7F]/.test(c) && /\p{L}/u.test(c)) {
            throw new ErrorDeSintaxis("Los nombres no pueden tener tildes ni ñ.", linea);
        }

        throw new ErrorDeSintaxis(`Carácter no válido: ${c}`, linea);
    }

    tokens.push({ tipo: "fin", valor: "", linea });
    return tokens;
}
