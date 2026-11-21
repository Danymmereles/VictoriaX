// ===========================================================================
// Elementos de la barra lateral. Cada uno crea un tipo de nodo; los dos
// Conectores crean el mismo tipo con el punto de conexión de un lado o
// del otro (el lado no se cambia después: el doble clic edita la etiqueta).
// ===========================================================================

import { NODE_NAMES } from "./nodeNames";

// En orden (el Contexto no: es fijo en Main)
export const SIDEBAR_ITEMS = [
    { id: "input", type: "input" },
    { id: "process", type: "process" },
    { id: "decision", type: "decision" },
    { id: "document", type: "document" },
    { id: "io", type: "io" },
    { id: "preparation", type: "preparation" },
    { id: "connector-left", type: "connector", data: { handleSide: "left" }, label: "Conector (punto a la izquierda)" },
    { id: "connector-right", type: "connector", data: { handleSide: "right" }, label: "Conector (punto a la derecha)" },
    { id: "end", type: "end" },
].map((item) => ({ data: {}, label: NODE_NAMES[item.type], ...item }));

// Elemento que se está arrastrando (ver DnDContext), o null
export const itemDeBarra = (id) =>
    SIDEBAR_ITEMS.find((item) => item.id === id) ?? null;