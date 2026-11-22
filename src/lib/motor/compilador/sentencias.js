// ===========================================================================
// Compilador de sentencias (Asignación y Contexto): AST → función (ctx).
// Lógica pura.
//
//   T = expr       asignación
//   T op= expr     T = T op (expr)
//   T++ / T--      T = T + 1 / T = T - 1
// Si una sentencia falla, el error lleva su línea.
// ===========================================================================

import { ErrorDeEjecucion, fallar } from "../runtime/errores.js";
import { aritmetica, esVector } from "../runtime/valores.js";

import { compilarExpresion } from "./expresiones.js";
import { textoDe } from "./texto.js";

// Dónde se guarda: (ctx, valor) => void
function compilarDestino(destino) {
    const { nombre } = destino;

    if (!destino.indice) {
        return (ctx, valor) => ctx.memoria.escribir(nombre, valor);
    }

    const indice = compilarExpresion(destino.indice);
    const textoIndice = textoDe(destino.indice);
    return (ctx, valor) => ctx.memoria.escribirPosicion(nombre, indice(ctx), valor, textoIndice);
}

const UNO = { tipo: "numero", valor: 1 };

export function compilarSentencia(s) {
    const guardar = compilarDestino(s.destino);
    const textoDestino = textoDe(s.destino);

    if (s.tipo === "asignacion") {
        const valor = compilarExpresion(s.valor);
        const textoValor = textoDe(s.valor);

        return (ctx) => {
            const v = valor(ctx);
            if (esVector(v)) {
                fallar(`${textoValor} es un vector: asigná una posición, por ejemplo ${textoValor}[0].`);
            }
            guardar(ctx, v);
        };
    }

    // compuesta e incremento: destino = destino op valor
    const operando = s.tipo === "incremento" ? UNO : s.valor;
    const actual = compilarExpresion(s.destino);
    const valor = compilarExpresion(operando);
    const textoValor = textoDe(operando);
    const { op } = s;

    return (ctx) => guardar(ctx, aritmetica(op, actual(ctx), valor(ctx), textoDestino, textoValor));
}

export function compilarSentencias(arbol) {
    const lista = arbol.sentencias.map((s) => ({ ejecutar: compilarSentencia(s), linea: s.linea }));

    return (ctx) => {
        for (const { ejecutar, linea } of lista) {
            try {
                ejecutar(ctx);
            } catch (error) {
                if (error instanceof ErrorDeEjecucion && error.linea === null) {
                    error.linea = linea;
                }
                throw error;
            }
        }
    };
}
