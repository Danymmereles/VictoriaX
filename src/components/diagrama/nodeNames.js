// ===========================================================================
// Nombres de los tipos de nodo. Única fuente: los usan la barra lateral
// (tooltip de cada figura) y los nodos (texto de ayuda cuando están vacíos).
// ===========================================================================

export const NODE_NAMES = {
    input: "Entrada",
    process: "Asignación",
    decision: "Decisión",
    for: "Para",
    output: "Salida",
    document: "Resultado",
    io: "Entrada / Salida",
    // Función Generada: el hexágono tiene tres tipos (22/11)
    preparation: "fdp",
    subroutine: "Subrutina",
    random: "Random",
    connector: "Conector",
    context: "Contexto",
    end: "Fin",
};

// Nodo Fin: su texto es fijo ("Fin") y no se edita
export const END_NODE_TYPE = "end";

// Nombre del grupo en la barra lateral (fdp, Subrutina y Random)
export const FUNCION_GENERADA = "Función Generada";

/*
 * Texto de ayuda de un nodo sin texto: se ve atenuado y desaparece al
 * editar, sin que el usuario tenga que borrarlo. El conector usa una
 * etiqueta de ejemplo, porque su nombre no entra en el círculo.
 */
export function placeholderDe(type) {
    if (type === "connector") {
        return "A";
    }

    // Ejemplos de cómo se escriben (ver BNF v0.15)
    if (type === "subroutine") {
        return "subrutina()";
    }

    if (type === "random") {
        return "R1";
    }

    return NODE_NAMES[type] ?? "Nodo";
}