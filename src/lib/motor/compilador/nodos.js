// ===========================================================================
// Compilador de nodos: cada nodo cargado (cargar.js) pasa a ser una
// INSTRUCCIÓN con su función ejecutar(ctx), que hace su trabajo y dice
// cómo sigue el flujo. Lógica pura.
//
// ejecutar(ctx) devuelve un salto:
//   { siguiente: nodoId }              seguir en esta página
//   { fin: true }                      terminar la página
//   { llamar: pagina, retorno: nodoId, // ir a otra página y volver
//     antes, alEntrar, alSalir, alVolver }
// Los cuatro pasos de una llamada (los usa interprete.js):
//   antes(memoria)              en quien llama, antes de entrar
//   alEntrar(memoria, datos)    ya en la página llamada
//   alSalir(memoria, marco)     al llegar a su Fin, antes de salir
//   alVolver(memoria, datos)    de nuevo en quien llamó
//
// ctx: { memoria, aleatorio(), emitir(valores) } (ver interprete.js)
// ===========================================================================

import { fallar } from "../runtime/errores.js";
import { copiar, exigirNumero, formatear } from "../runtime/valores.js";

import { compilarExpresion } from "./expresiones.js";
import { compilarSentencias } from "./sentencias.js";
import { textoDe } from "./texto.js";

const base = (nodo) => ({
    id: nodo.id,
    // El nodo del diagrama (la vuelta de un Para es el mismo Para)
    nodo: nodo.para ?? nodo.id,
    tipo: nodo.tipo,
    subtipo: nodo.subtipo,
    texto: nodo.texto,
});

/*
 * paginaCompilada(tipo, nombre): la página destino de una llamada (ya
 * compilada). Se resuelve al ejecutar, así el orden de compilación no
 * importa.
 */
export function compilarNodo(nodo, paginaCompilada) {
    const siguiente = { siguiente: nodo.siguiente };

    switch (nodo.tipo) {
        case "contexto": {
            const sentencias = compilarSentencias(nodo.arbol);
            return {
                ...base(nodo),
                ejecutar(ctx) {
                    sentencias(ctx);
                    // Vectores con dimensión variable (N): ahora que el
                    // Contexto pudo cambiar N
                    ctx.memoria.crearVectoresPendientes();
                    return siguiente;
                },
            };
        }

        case "asignacion": {
            const sentencias = compilarSentencias(nodo.arbol);
            return {
                ...base(nodo),
                ejecutar(ctx) {
                    sentencias(ctx);
                    return siguiente;
                },
            };
        }

        case "decision": {
            const condicion = compilarExpresion(nodo.arbol);
            const texto = textoDe(nodo.arbol);
            const si = { siguiente: nodo.si };
            const no = { siguiente: nodo.no };

            return {
                ...base(nodo),
                ejecutar(ctx) {
                    const valor = condicion(ctx);
                    if (typeof valor !== "boolean") {
                        fallar(`La condición ${texto} no da TRUE ni FALSE: da ${formatear(valor)}.`);
                    }
                    return valor ? si : no;
                },
            };
        }

        case "resultado": {
            const nombres = nodo.arbol.nombres;
            return {
                ...base(nodo),
                ejecutar(ctx) {
                    ctx.emitir(nombres.map((nombre) => ({ nombre, valor: copiar(ctx.memoria.leer(nombre)) })));
                    return siguiente;
                },
            };
        }

        case "para":
        case "paraVuelta":
            return compilarPara(nodo);

        case "fin":
            return { ...base(nodo), ejecutar: () => ({ fin: true }) };

        case "funcionGenerada":
            return compilarFuncionGenerada(nodo, paginaCompilada, siguiente);

        default:
            throw new Error(`Nodo desconocido: ${nodo.tipo}`);
    }
}


/*
 * Para (for), como en C: for (V = desde; V <= hasta; V++)
 *   entrada (arriba):   V = desde
 *   vuelta (izquierda): V = V + 1
 * y en los dos casos: si V <= hasta sigue por el cuerpo; si no, por la
 * salida. El valor final se vuelve a calcular en cada vuelta (puede
 * depender de variables que cambian en el cuerpo). Al terminar, V queda
 * en el primer valor que pasa el final.
 */
function compilarPara(nodo) {
    const para = nodo.tipo === "para" ? nodo : nodo.pagina.nodos.get(nodo.para);
    const { variable, desde, hasta } = para.arbol;

    const valorInicial = compilarExpresion(desde);
    const valorFinal = compilarExpresion(hasta);
    const textoInicial = textoDe(desde);
    const textoFinal = textoDe(hasta);

    const cuerpo = { siguiente: para.cuerpo };
    const salida = { siguiente: para.salida };

    const seguir = (ctx, valor) => {
        const final = valorFinal(ctx);
        exigirNumero(final, `El valor final (${textoFinal})`, "usar en el Para");
        return valor <= final ? cuerpo : salida;
    };

    if (nodo.tipo === "para") {
        return {
            ...base(nodo),
            ejecutar(ctx) {
                const valor = valorInicial(ctx);
                exigirNumero(valor, `El valor inicial (${textoInicial})`, "usar en el Para");
                ctx.memoria.escribirContador(variable, valor);
                return seguir(ctx, valor);
            },
        };
    }

    return {
        ...base(nodo),
        texto: para.texto,
        ejecutar(ctx) {
            const actual = ctx.memoria.leer(variable);
            exigirNumero(actual, variable, "sumar 1 en el Para");
            const valor = actual + 1;
            ctx.memoria.escribirContador(variable, valor);
            return seguir(ctx, valor);
        },
    };
}


function compilarFuncionGenerada(nodo, paginaCompilada, siguiente) {
    const { nombre } = nodo.arbol;

    // Random: un valor nuevo entre 0 y 1
    if (nodo.subtipo === "random") {
        return {
            ...base(nodo),
            ejecutar(ctx) {
                ctx.memoria.escribirRandom(nombre, ctx.aleatorio());
                return siguiente;
            },
        };
    }

    // fdp: IA = IA(). Su pestaña tiene que asignar IA antes del Fin
    if (nodo.subtipo === "fdp") {
        const salto = {
            retorno: nodo.siguiente,
            alSalir(memoria, marco) {
                if (!marco.asignadas.has(nombre)) {
                    fallar(`${nombre} terminó sin asignar un valor: su pestaña tiene que darle valor a ${nombre} antes del Fin.`);
                }
            },
        };

        return {
            ...base(nodo),
            ejecutar: () => ({ ...salto, llamar: paginaCompilada("fdp", nombre) }),
        };
    }

    // Subrutina calcular(A, B): los parámetros van y vuelven. Al llamar,
    // toman los valores de A y B de quien llama; al llegar al Fin, los
    // valores nuevos vuelven a A y B.
    const parametros = nodo.arbol.parametros;

    const salto = {
        retorno: nodo.siguiente,
        antes: (memoria) => parametros.map((p) => copiar(memoria.leer(p))),
        alEntrar(memoria, valores) {
            const propios = memoria.marco.pagina.parametros;
            propios.forEach((p, i) => memoria.crearLocal(p, valores[i]));
        },
        alSalir: (memoria) => memoria.marco.pagina.parametros.map((p) => copiar(memoria.leer(p))),
        alVolver(memoria, valores) {
            parametros.forEach((p, i) => memoria.escribir(p, valores[i]));
        },
    };

    return {
        ...base(nodo),
        ejecutar: () => ({ ...salto, llamar: paginaCompilada("subrutina", nombre) }),
    };
}
