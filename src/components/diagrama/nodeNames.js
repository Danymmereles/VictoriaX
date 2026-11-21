// ===========================================================================
// Nombres de los tipos de nodo. Única fuente: los usan la barra lateral
// (tooltip de cada figura) y los nodos (texto de ayuda cuando están vacíos).
// ===========================================================================

export const NODE_NAMES = {
    input: "Entrada",
    process: "Proceso",
    decision: "Decisión",
    output: "Salida",
    document: "Documento",
    io: "Entrada / Salida",
    preparation: "Preparación",
    connector: "Conector",
    context: "Contexto",
    end: "Fin",
};

// Nodo Fin: su texto es fijo ("Fin") y no se edita
export const END_NODE_TYPE = "end";

/*
 * Texto de ayuda de un nodo sin texto: se ve atenuado y desaparece al
 * editar, sin que el usuario tenga que borrarlo. El conector usa una
 * etiqueta de ejemplo, porque su nombre no entra en el círculo.
 */
export function placeholderDe(type) {
    if (type === "connector") {
        return "A";
    }

    return NODE_NAMES[type] ?? "Nodo";
}
