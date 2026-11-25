// ===========================================================================
// Cursor sobre los tokens (ver lexico.js). Lógica pura.
//
// Lo usan el parser de expresiones (expresiones.js) y el de cada tipo de
// nodo (sintaxis.js). Los errores salen con la línea, la columna y el
// rango del token donde se detectaron.
// ===========================================================================

import { ErrorDeSintaxis } from "./lexico.js";

export const describir = (t) =>
    t.tipo === "fin" || t.tipo === "salto" ? "el final de la línea" : `"${t.valor}"`;

export class Cursor {
    // saltosComoEspacio: en la Decisión, el Resultado, etc. el salto de
    // línea no separa nada (solo la Asignación y el Contexto van por línea)
    constructor(tokens, { saltosComoEspacio }) {
        this.tokens = saltosComoEspacio ? tokens.filter((t) => t.tipo !== "salto") : tokens;
        this.pos = 0;
    }

    get actual() {
        return this.tokens[this.pos];
    }

    get proximo() {
        return this.tokens[this.pos + 1] ?? this.tokens[this.tokens.length - 1];
    }

    // Último token consumido (para el rango de un nodo)
    get anterior() {
        return this.tokens[this.pos - 1] ?? this.tokens[0];
    }

    avanzar() {
        return this.tokens[this.pos++];
    }

    es(tipo, valor) {
        const t = this.actual;
        return t.tipo === tipo && (valor === undefined || t.valor === valor);
    }

    esOp(...valores) {
        return this.actual.tipo === "op" && valores.includes(this.actual.valor);
    }

    finDeLinea() {
        return this.es("fin") || this.es("salto");
    }

    esperarOp(valor, mensaje) {
        if (!this.esOp(valor)) this.error(mensaje);
        return this.avanzar();
    }

    error(mensaje, token = this.actual) {
        throw new ErrorDeSintaxis(mensaje, token.linea, token.columna, [token.inicio, token.fin]);
    }
}
