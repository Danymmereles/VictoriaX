// ===========================================================================
// Revisión de caminos, antes de interpretar el diagrama. Lógica pura.
//
// Un algoritmo convencional sigue por UN solo camino desde cada salida:
//   - cada punto de salida de un nodo tiene a lo sumo una flecha
//     (la Decisión tiene dos salidas, SI y NO: una flecha cada una);
//   - a un nodo sí pueden LLEGAR varias flechas (por ejemplo, después de
//     una Decisión los dos caminos se vuelven a juntar).
//
// React Flow deja sacar varias flechas del mismo punto, así que esto se
// revisa acá: al presionar Ejecutar (todas las páginas) y en el editor
// (la página activa, para marcar el nodo en rojo).
// ===========================================================================

import { NODE_NAMES } from "../nodeNames.js";
import { esPara, textoDePara } from "../para/para.js";

// Nombre de cada salida, según el punto de conexión (sourceHandle)
const SALIDAS = {
    yes: "SI",
    no: "NO",
    // Para (for)
    ciclo: "ciclo",
};

const salidaDe = (edge) => SALIDAS[edge.sourceHandle] ?? "salida";

// Asignación "T = TPLL", o "Asignación sin texto"
export function describirNodo(node) {
    if (esPara(node)) {
        return `Para "${textoDePara(node.data)}"`;
    }

    const nombre = NODE_NAMES[node?.data?.type] ?? "nodo";
    const texto = String(node?.data?.label ?? "").trim().replace(/\s*\n\s*/g, " · ");

    return texto ? `${nombre} "${texto}"` : `${nombre} sin texto`;
}

function mensajeDe(node, salida, cantidad) {
    const donde = salida === "salida" ? "" : ` por el ${salida}`;
    return `${describirNodo(node)} tiene ${cantidad} flechas de salida${donde}: un nodo sigue por un solo camino (las que llegan sí pueden ser varias).`;
}

/*
 * Nodos de UNA página con más de una flecha en el mismo punto de salida.
 * Devuelve [{ nodoId, salida, cantidad, mensaje }].
 */
export function salidasRepetidas({ nodes, edges }) {
    const porSalida = new Map();

    edges.forEach((edge) => {
        const clave = `${edge.source}\u0000${salidaDe(edge)}`;
        porSalida.set(clave, [...(porSalida.get(clave) ?? []), edge]);
    });

    const nodos = new Map(nodes.map((node) => [node.id, node]));
    const problemas = [];

    porSalida.forEach((flechas) => {
        if (flechas.length < 2) {
            return;
        }

        const node = nodos.get(flechas[0].source);
        const salida = salidaDe(flechas[0]);

        problemas.push({
            nodoId: flechas[0].source,
            salida,
            cantidad: flechas.length,
            mensaje: mensajeDe(node, salida, flechas.length),
        });
    });

    return problemas;
}

// Para el editor: { [nodeId]: mensaje } de la página activa
export function problemasDeSalidas({ nodes, edges }) {
    const problemas = {};

    salidasRepetidas({ nodes, edges }).forEach((p) => {
        problemas[p.nodoId] = problemas[p.nodoId]
            ? `${problemas[p.nodoId]} ${p.mensaje}`
            : p.mensaje;
    });

    return problemas;
}

/*
 * Revisión de todo el diagrama (ver fotoDelDiagrama.js) antes de
 * interpretarlo. Devuelve los errores que impiden ejecutar:
 *   [{ paginaId, pagina, nodoId, mensaje }]
 * Lista vacía: se puede seguir.
 */
export function revisarCaminos(paginas) {
    return paginas.flatMap((pagina) =>
        salidasRepetidas(pagina).map((p) => ({
            paginaId: pagina.id,
            pagina: pagina.firma ?? pagina.nombre,
            nodoId: p.nodoId,
            mensaje: p.mensaje,
        }))
    );
}
