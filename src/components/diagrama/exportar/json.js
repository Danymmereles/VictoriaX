// ===========================================================================
// Diagrama completo como JSON. Lógica pura.
//
// Todas las páginas (Main y una por variable de datos), la tabla de
// variables y el tipo de flecha. Los nodos y las flechas quedan en el
// formato de React Flow (lo que hace falta para volver a cargarlos), sin
// el estado de la pantalla (selección, tamaños medidos, puntas de flecha).
//
// {
//   formato: "victoriax-diagrama", version: 1, exportado: "<fecha ISO>",
//   edgeType: "smoothstep",
//   paginas: [{ id, nombre, tipo, firma?, nodes: [...], edges: [...] }],
//            tipo: "main" | "fdp" | "subrutina"; firma: calcular(A, B)
//   variables: [{ nombre, valorInicial, ... }]
// }
// ===========================================================================

export const FORMATO_JSON = "victoriax-diagrama";
export const VERSION_JSON = 1;

const CAMPOS_NODO = ["id", "type", "position", "origin", "deletable", "data"];
const CAMPOS_FLECHA = ["id", "source", "sourceHandle", "target", "targetHandle", "type", "data"];
// Los Random (origen "random") salen de sus nodos: se exportan para que la
// tabla quede completa, pero al importar no hace falta crearlos
const CAMPOS_VARIABLE = ["nombre", "valorInicial", "origen", "descripcion", "esVector", "dimension"];

function elegir(objeto, campos) {
    const limpio = {};

    campos.forEach((campo) => {
        if (objeto[campo] !== undefined && objeto[campo] !== null) {
            limpio[campo] = objeto[campo];
        }
    });

    return limpio;
}

/*
 *   paginas:   [{ id, nombre, nodes, edges }]
 *   variables: tabla de Main
 *   edgeType:  tipo de flecha global
 *   fecha:     opcional (para los tests)
 */
export function diagramaComoJson({ paginas, variables, edgeType, fecha = new Date() }) {
    return {
        formato: FORMATO_JSON,
        version: VERSION_JSON,
        exportado: fecha.toISOString(),
        edgeType,
        paginas: paginas.map((pagina) => ({
            ...elegir(pagina, ["id", "nombre", "tipo", "firma"]),
            nodes: pagina.nodes.map((nodo) => elegir(nodo, CAMPOS_NODO)),
            edges: pagina.edges.map((flecha) => elegir(flecha, CAMPOS_FLECHA)),
        })),
        variables: variables.map((variable) => elegir(variable, CAMPOS_VARIABLE)),
    };
}

export const jsonComoBlob = (datos) =>
    new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
