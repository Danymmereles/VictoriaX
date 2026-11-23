// ===========================================================================
// Chequeo de las expresiones, después del parser. Lógica pura.
//
// Como el chequeo de tipos de un compilador: el parser (expresiones.js)
// acepta cualquier combinación y acá se decide si tiene sentido según
// dónde está. Cada nodo tiene una CLASE:
//   cuenta     número, -x, + - * / % \ ^
//   condicion  comparación, AND / OR, NOT (expresiones que dan TRUE/FALSE)
//   logico     TRUE, FALSE
//   nulo       NULL
//   variable   (su tipo se conoce recién al ejecutar)
// y cada lugar pide algo:
//   cuenta     operandos de + - * / % \ ^, índices, < <= > >=
//   igualdad   operandos de == !=
//   condicion  la Decisión, AND / OR / NOT
//   valor      lo que se asigna (cualquier cosa)
//
// Además, las REGLAS DE LA CÁTEDRA (BNF, sección 4), que los lenguajes
// comunes no exigen y acá se pueden apagar:
//   parentesisEntreAndYOr  A AND B OR C necesita paréntesis
//   parentesisEnNot        NOT (A > B), no NOT A > B
// ===========================================================================

import { ErrorDeSintaxis } from "./lexico.js";
import { esOrden } from "./operadores.js";

export const REGLAS_DE_LA_CATEDRA = {
    parentesisEntreAndYOr: true,
    parentesisEnNot: true,
};

function clase(nodo) {
    switch (nodo.tipo) {
        case "numero":
        case "unario":
        case "binario":
        case "llamada": // por ahora solo funciones numéricas (funciones.js)
            return "cuenta";
        case "comparacion":
        case "logica":
        case "negacion":
            return "condicion";
        case "constante":
            return nodo.valor === null ? "nulo" : "logico";
        default:
            return "variable";
    }
}

const TEXTO_CONSTANTE = (nodo) => (nodo.valor ? "TRUE" : "FALSE");

/*
 * chequear(arbol, lugar, { texto, reglas })
 *   lugar: "condicion" | "valor" | "cuenta"
 *   texto: el texto completo, para ubicar la línea y la columna del error
 * Lanza ErrorDeSintaxis con el rango del nodo que falla.
 */
export function chequear(arbol, lugar, { texto, reglas = REGLAS_DE_LA_CATEDRA }) {
    const error = (nodo, mensaje) => {
        const [inicio, fin] = nodo.rango ?? [0, 0];
        const antes = texto.slice(0, inicio);
        const linea = antes.split("\n").length;
        const columna = inicio - antes.lastIndexOf("\n");
        throw new ErrorDeSintaxis(mensaje, linea, columna, [inicio, fin]);
    };

    const revisar = (nodo, pide, padre = null) => {
        const c = clase(nodo);

        // ¿Esta clase de nodo va en este lugar?
        if (pide === "cuenta") {
            if (c === "nulo") {
                error(nodo, "NULL solo se compara con == o !=.");
            }
            if (c === "logico") {
                error(
                    nodo,
                    padre?.tipo === "comparacion"
                        ? "TRUE y FALSE solo se comparan con == o !=."
                        : `${TEXTO_CONSTANTE(nodo)} no se puede usar en una cuenta.`
                );
            }
            if (c === "condicion") {
                error(
                    nodo,
                    padre?.tipo === "comparacion"
                        ? "No se pueden comparar expresiones lógicas entre sí."
                        : "Una condición no va dentro de una cuenta."
                );
            }
        } else if (pide === "igualdad") {
            if (c === "condicion") {
                error(nodo, "No se pueden comparar expresiones lógicas entre sí.");
            }
        } else if (pide === "condicion") {
            if (c === "cuenta") {
                error(nodo, "Falta una comparación (por ejemplo, A > 0).");
            }
            if (c === "nulo") {
                error(nodo, "NULL solo se compara con == o !=.");
            }
        }

        // Reglas de la cátedra
        if (nodo.tipo === "logica" && reglas.parentesisEntreAndYOr) {
            const mezcla = nodo.operandos.find(
                (o) => o.tipo === "logica" && o.op !== nodo.op && !o.parentesis
            );
            if (mezcla) {
                error(mezcla, "No se pueden mezclar AND y OR sin paréntesis.");
            }
        }

        if (nodo.tipo === "negacion" && reglas.parentesisEnNot && !nodo.operando.parentesis) {
            error(nodo, "NOT va con paréntesis: NOT (A > B).");
        }

        // Lo que pide cada operando
        switch (nodo.tipo) {
            case "variable":
                if (nodo.indice) revisar(nodo.indice, "cuenta", nodo);
                break;
            case "unario":
                revisar(nodo.operando, "cuenta", nodo);
                break;
            case "binario":
                revisar(nodo.izq, "cuenta", nodo);
                revisar(nodo.der, "cuenta", nodo);
                break;
            case "comparacion": {
                const pideOperando = esOrden(nodo.op) ? "cuenta" : "igualdad";
                revisar(nodo.izq, pideOperando, nodo);
                revisar(nodo.der, pideOperando, nodo);
                break;
            }
            case "logica":
                nodo.operandos.forEach((o) => revisar(o, "condicion", nodo));
                break;
            case "negacion":
                revisar(nodo.operando, "condicion", nodo);
                break;
            case "llamada":
                nodo.argumentos.forEach((a) => revisar(a, "cuenta", nodo));
                break;
            default:
                break;
        }
    };

    revisar(arbol, lugar);
}
