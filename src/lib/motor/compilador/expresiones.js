// ===========================================================================
// Compilador de expresiones: AST → función (ctx) => valor. Lógica pura.
//
// "Compilar a funciones": cada nodo del árbol se convierte UNA vez en una
// función de JS que ya sabe qué hacer; al ejecutar solo se llaman esas
// funciones (no se vuelve a recorrer ni a analizar el texto).
//
// ctx: { memoria } (ver interprete.js)
// ===========================================================================

import { fallar } from "../runtime/errores.js";
import { implementacionDe } from "../runtime/funciones.js";
import { aritmetica, comparar, exigirLogico, exigirNumero, negativo, resultadoReal } from "../runtime/valores.js";

import { textoDe } from "./texto.js";

export function compilarExpresion(a) {
    switch (a.tipo) {
        case "numero":
        case "constante": {
            const valor = a.valor;
            return () => valor;
        }

        case "variable": {
            const nombre = a.nombre;

            if (!a.indice) {
                return (ctx) => ctx.memoria.leer(nombre);
            }

            const indice = compilarExpresion(a.indice);
            const textoIndice = textoDe(a.indice);
            return (ctx) => ctx.memoria.leerPosicion(nombre, indice(ctx), textoIndice);
        }

        case "unario": {
            const operando = compilarExpresion(a.operando);
            const texto = textoDe(a.operando);
            return (ctx) => negativo(operando(ctx), texto);
        }

        case "binario": {
            const { op } = a;
            const izq = compilarExpresion(a.izq);
            const der = compilarExpresion(a.der);
            const textoIzq = textoDe(a.izq);
            const textoDer = textoDe(a.der);
            return (ctx) => aritmetica(op, izq(ctx), der(ctx), textoIzq, textoDer);
        }

        case "comparacion": {
            const { op } = a;
            const izq = compilarExpresion(a.izq);
            const der = compilarExpresion(a.der);
            const textoIzq = textoDe(a.izq);
            const textoDer = textoDe(a.der);
            return (ctx) => comparar(op, izq(ctx), der(ctx), textoIzq, textoDer);
        }

        // Cortocircuito: AND corta en el primer FALSE, OR en el primer TRUE
        case "logica": {
            const operandos = a.operandos.map(compilarExpresion);
            const textos = a.operandos.map((o) => textoDe(o));
            const corta = a.op === "OR";

            return (ctx) => {
                for (let i = 0; i < operandos.length; i++) {
                    if (exigirLogico(operandos[i](ctx), textos[i], a.op) === corta) {
                        return corta;
                    }
                }
                return !corta;
            };
        }

        case "negacion": {
            const operando = compilarExpresion(a.operando);
            const texto = textoDe(a.operando);
            return (ctx) => !exigirLogico(operando(ctx), texto, "NOT");
        }

        // Función del catálogo (vacío en esta versión, ver runtime/funciones.js)
        case "llamada": {
            const funcion = implementacionDe(a.nombre);
            if (!funcion) {
                fallar(`La función ${a.nombre} no existe en esta versión.`);
            }

            const argumentos = a.argumentos.map(compilarExpresion);
            const textos = a.argumentos.map((x) => textoDe(x));
            const texto = textoDe(a);

            return (ctx) => {
                const valores = argumentos.map((argumento, i) => {
                    const v = argumento(ctx);
                    exigirNumero(v, textos[i], `calcular ${a.nombre}`);
                    return v;
                });
                return resultadoReal(funcion(...valores), texto);
            };
        }

        default:
            throw new Error(`Expresión desconocida: ${a.tipo}`);
    }
}
