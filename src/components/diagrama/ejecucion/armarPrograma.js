// ===========================================================================
// Del diagrama al PROGRAMA (JSON) que interpreta el motor. Lógica pura.
//
// Es el equivalente al XML del Victoria anterior: describe cada página,
// cada nodo (tipo, subtipo, texto y su árbol) y con qué nodo sigue. El
// formato está documentado en lib/motor/programa.js.
//
// Al armarlo se revisa lo que impide interpretar el diagrama:
//   - salidas sin conectar (cada nodo sigue por un camino; la Decisión
//     necesita su SI y su NO);
//   - Conectores: cada etiqueta con exactamente una llegada; un Conector
//     no puede tener flechas que entran y salen;
//   - nodos vacíos, Entrada y Entrada / Salida (todavía no se ejecutan);
//   - el Para (for): su ciclo y su salida conectados, y al menos una
//     flecha que vuelve por la izquierda;
//   - cada página con al menos un Fin.
// Los Conectores no llegan al programa: cada salto apunta directo al nodo
// que sigue a su llegada.
//
// armarPrograma({ paginas, variables }) → { programa, errores }
//   paginas:   foto del diagrama (ver fotoDelDiagrama.js)
//   variables: la tabla, con los Random (todasLasVariables)
//   errores:   [{ paginaId, pagina, nodoId, mensaje, clase }]; si hay alguno,
//              programa es null.
// ===========================================================================

import { PARTES_DEL_PARA, analizar } from "@/lib/lenguaje";
import { FORMATO_PROGRAMA, VERSION_PROGRAMA } from "@/lib/motor/programa.js";

import { describirNodo } from "./caminos.js";
import { HANDLES_DEL_PARA, analizarNodoPara, esPara, paraVacio, textoDePara } from "../para/para.js";

// Tipo de nodo del editor → tipo y subtipo en el programa, y regla de la
// BNF de su texto
const TIPOS = {
    context: { tipo: "contexto", regla: "contexto" },
    process: { tipo: "asignacion", regla: "asignacion" },
    decision: { tipo: "decision", regla: "decision" },
    document: { tipo: "resultado", regla: "resultado" },
    end: { tipo: "fin" },
    preparation: { tipo: "funcionGenerada", subtipo: "fdp", regla: "fdp" },
    // El ancla (la firma) no llega acá: es el inicio de la página
    subroutine: { tipo: "funcionGenerada", subtipo: "subrutina", regla: "llamada" },
    random: { tipo: "funcionGenerada", subtipo: "random", regla: "random" },
    for: { tipo: "para" },
};

// Todavía sin comportamiento al ejecutar (BNF: Entrada y Entrada / Salida)
const SIN_EJECUCION = {
    input: "Entrada",
    io: "Entrada / Salida",
    output: "Salida",
};

const texto = (node) => String(node.data?.label ?? "");

// Id de la vuelta de un Para en el programa (su entrada de la izquierda)
export const idDeVuelta = (paraId) => `${paraId}#vuelta`;
const esConector = (node) => node?.data?.type === "connector";
const esAncla = (node) => Boolean(node?.data?.anchorOf);

// Valor inicial de la tabla como número (acepta coma o punto)
const numeroDeTabla = (valor) => Number(String(valor ?? "0").trim().replace(",", ".") || 0);

function dimensionDe(variable) {
    const d = variable.dimension;

    if (!variable.esVector || !d) {
        return null;
    }

    return d.tipo === "fijo"
        ? { tipo: "fijo", valor: Number(d.valor) }
        : { tipo: "variable", variable: d.variableControl };
}


/*
 * Una página: nodos con su siguiente. Agrega a `errores` lo que impide
 * interpretarla.
 */
function armarPagina(pagina, errores) {
    // clase: "estructura" (cómo está conectado) o "sintaxis" (el texto)
    const error = (nodoId, mensaje, clase = "estructura") =>
        errores.push({
            paginaId: pagina.id,
            pagina: pagina.firma ?? pagina.nombre,
            nodoId,
            mensaje,
            clase,
        });

    const nodos = new Map(pagina.nodes.map((node) => [node.id, node]));
    const salidas = new Map();   // nodoId → { salida → destino }
    const entradas = new Map();  // nodoId → cantidad de flechas que llegan

    // Nombre de cada punto de salida en el programa
    const SALIDA = {
        yes: "si",
        no: "no",
        [HANDLES_DEL_PARA.ciclo]: "cuerpo",
        [HANDLES_DEL_PARA.salida]: "salida",
    };

    pagina.edges.forEach((edge) => {
        const salida = SALIDA[edge.sourceHandle] ?? "siguiente";
        // Lo que vuelve por la izquierda de un Para va a su vuelta
        const llegada = edge.targetHandle === HANDLES_DEL_PARA.vuelta && esPara(nodos.get(edge.target))
            ? idDeVuelta(edge.target)
            : edge.target;

        salidas.set(edge.source, { ...(salidas.get(edge.source) ?? {}), [salida]: llegada });
        entradas.set(llegada, (entradas.get(llegada) ?? 0) + 1);
    });

    // ---- Conectores: llegadas por etiqueta ----
    const llegadas = new Map(); // etiqueta → nodoId del Conector de llegada

    pagina.nodes.filter(esConector).forEach((node) => {
        const etiqueta = texto(node).trim();
        const sale = Boolean(salidas.get(node.id)?.siguiente);
        const entra = (entradas.get(node.id) ?? 0) > 0;

        if (!etiqueta) {
            if (sale || entra) error(node.id, "Un Conector sin etiqueta: escribile un nombre (por ejemplo, C1).");
            return;
        }

        if (sale && entra) {
            error(node.id, `El Conector ${etiqueta} tiene flechas que entran y salen: es de llegada (solo sale) o de salto (solo entra).`);
        } else if (sale) {
            if (llegadas.has(etiqueta)) {
                error(node.id, `Hay dos Conectores de llegada ${etiqueta}: el salto no sabría a cuál ir.`);
            }
            llegadas.set(etiqueta, node.id);
        }
    });

    // Destino real de una flecha: si llega a un Conector de salto, el nodo
    // que sigue a su llegada (puede encadenar varios Conectores)
    const destino = (nodoId, origenId) => {
        const vistos = new Set();
        let actual = nodoId;

        while (esConector(nodos.get(actual))) {
            const conector = nodos.get(actual);
            const etiqueta = texto(conector).trim();

            if (vistos.has(actual)) {
                error(origenId, `Los Conectores ${etiqueta} forman un ciclo sin nodos.`);
                return null;
            }
            vistos.add(actual);

            // Es una llegada a la que entra una flecha: ya se informó
            if (salidas.get(actual)?.siguiente) {
                actual = salidas.get(actual).siguiente;
                continue;
            }

            const llegada = llegadas.get(etiqueta);

            if (!llegada) {
                error(actual, `El Conector ${etiqueta || "sin etiqueta"} salta a una llegada ${etiqueta} que no existe en esta página.`);
                return null;
            }

            actual = salidas.get(llegada).siguiente;
        }

        return actual ?? null;
    };

    // ---- Nodos ----
    const programa = [];
    let inicio = null;
    let tieneFin = false;

    pagina.nodes.forEach((node) => {
        const tipoEditor = node.data?.type;

        if (esConector(node)) {
            return;
        }

        if (SIN_EJECUCION[tipoEditor]) {
            error(node.id, `${SIN_EJECUCION[tipoEditor]} todavía no se puede ejecutar: sacalo del diagrama.`);
            return;
        }

        const forma = TIPOS[tipoEditor];

        if (!forma) {
            error(node.id, `Nodo desconocido (${tipoEditor}).`);
            return;
        }

        const sale = salidas.get(node.id) ?? {};

        if (forma.tipo === "para") {
            programa.push(...armarPara(node, sale));
            return;
        }

        // El inicio de la página: el Contexto (Main) o el ancla
        if (esAncla(node) || forma.tipo === "contexto") {
            if (esAncla(node)) {
                if (!sale.siguiente) {
                    error(node.id, `El inicio de ${pagina.firma ?? pagina.nombre} no está conectado a nada.`);
                } else {
                    inicio = destino(sale.siguiente, node.id);
                }
                return;
            }
            inicio = node.id;
        }

        if (forma.tipo === "fin") {
            tieneFin = true;
            programa.push(armarFin(node));
            return;
        }

        // Texto y árbol
        const contenido = texto(node);
        let arbol = null;

        if (!contenido.trim() && forma.tipo !== "contexto") {
            error(node.id, `${describirNodo(node)} está vacío: escribí su contenido.`, "sintaxis");
        } else {
            const resultado = analizar(contenido, forma.regla);
            if (resultado.ok) {
                arbol = resultado.arbol;
            } else {
                error(node.id, `${describirNodo(node)}: ${resultado.error.mensaje}`, "sintaxis");
            }
        }

        const nodo = {
            id: node.id,
            tipo: forma.tipo,
            ...(forma.subtipo && { subtipo: forma.subtipo }),
            texto: contenido,
            arbol,
        };

        // Conexiones
        if (forma.tipo === "decision") {
            if (!sale.si || !sale.no) {
                error(node.id, `${describirNodo(node)} necesita sus dos salidas conectadas (SI y NO).`);
            }
            nodo.si = sale.si ? destino(sale.si, node.id) : null;
            nodo.no = sale.no ? destino(sale.no, node.id) : null;
        } else {
            if (!sale.siguiente) {
                error(node.id, `${describirNodo(node)} no tiene salida: cada nodo sigue hacia otro (o termina en un Fin).`);
            }
            nodo.siguiente = sale.siguiente ? destino(sale.siguiente, node.id) : null;
        }

        programa.push(nodo);
    });

    // Fin. En una subrutina devuelve una variable o un valor (v0.17):
    // { tipo: "fin", texto, arbol: { tipo: "retorno", valor } }
    function armarFin(node) {
        if (pagina.tipo !== "subrutina") {
            return { id: node.id, tipo: "fin" };
        }

        const contenido = texto(node).trim();
        let arbol = null;

        if (!contenido) {
            error(node.id, `Un Fin de ${pagina.firma ?? pagina.nombre} no devuelve nada: escribí una variable o un valor (por ejemplo, I o 0).`, "sintaxis");
        } else {
            const resultado = analizar(contenido, "retorno");
            if (resultado.ok) {
                arbol = resultado.arbol;
            } else {
                error(node.id, `Fin "${contenido}": ${resultado.error.mensaje}`, "sintaxis");
            }
        }

        return { id: node.id, tipo: "fin", texto: contenido, arbol };
    }

    // Para (for): dos nodos en el programa, la entrada (arriba) y la
    // vuelta (izquierda)
    function armarPara(node, sale) {
        const contenido = textoDePara(node.data);
        let arbol = null;

        if (paraVacio(node.data)) {
            error(node.id, "Un Para está vacío: escribí su variable, el valor inicial y el final.", "sintaxis");
        } else {
            const resultado = analizarNodoPara(node.data);
            if (resultado.ok) {
                arbol = resultado.arbol;
            } else {
                const { campo, mensaje } = resultado.error;
                error(node.id, `${describirNodo(node)}: ${PARTES_DEL_PARA[campo]}: ${mensaje}`, "sintaxis");
            }
        }

        if (!sale.cuerpo || !sale.salida) {
            error(node.id, `${describirNodo(node)} necesita sus dos salidas conectadas: el ciclo (abajo) y la salida (derecha).`);
        }

        if (!entradas.get(idDeVuelta(node.id))) {
            error(node.id, `${describirNodo(node)}: falta la vuelta del ciclo (una flecha que llega por la izquierda).`);
        }

        return [
            {
                id: node.id,
                tipo: "para",
                texto: contenido,
                arbol,
                cuerpo: sale.cuerpo ? destino(sale.cuerpo, node.id) : null,
                salida: sale.salida ? destino(sale.salida, node.id) : null,
            },
            { id: idDeVuelta(node.id), tipo: "paraVuelta", para: node.id, texto: contenido },
        ];
    }

    if (!tieneFin) {
        error(null, `La página ${pagina.firma ?? pagina.nombre} no tiene un Fin.`);
    }

    if (!inicio) {
        error(null, `La página ${pagina.firma ?? pagina.nombre} no tiene inicio.`);
    }

    return {
        id: pagina.id,
        tipo: pagina.tipo,
        nombre: pagina.nombre,
        ...(pagina.tipo === "subrutina" && { parametros: pagina.parametros ?? [] }),
        inicio,
        nodos: programa,
    };
}


export function armarPrograma({ paginas, variables }) {
    const errores = [];

    const paginasDelPrograma = paginas.map((pagina) => armarPagina(pagina, errores));

    const tabla = variables.filter((v) => !v.esRandom);

    const programa = {
        formato: FORMATO_PROGRAMA,
        version: VERSION_PROGRAMA,
        creado: new Date().toISOString(),
        inicio: paginasDelPrograma.find((p) => p.tipo === "main")?.id ?? null,
        variables: tabla.map((v) => ({
            nombre: String(v.nombre).trim(),
            valorInicial: numeroDeTabla(v.valorInicial),
            ...(v.esVector && { esVector: true, dimension: dimensionDe(v) }),
        })),
        randoms: variables.filter((v) => v.esRandom).map((v) => v.nombre),
        paginas: paginasDelPrograma,
    };

    return { programa: errores.length ? null : programa, errores };
}
