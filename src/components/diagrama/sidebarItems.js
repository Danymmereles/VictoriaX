// ===========================================================================
// Elementos de la barra lateral. Cada uno crea un tipo de nodo; los dos
// Conectores crean el mismo tipo con el punto de conexión de un lado o
// del otro (el lado no se cambia después: el doble clic edita la etiqueta).
//
// Función Generada (22/11) no se arrastra: al hacer clic abre un menú con
// sus tres tipos (fdp, Subrutina y Random), y lo que se arrastra es la
// opción del menú (ver FuncionGeneradaMenu.jsx).
// ===========================================================================

import { FUNCION_GENERADA, NODE_NAMES } from "./nodeNames";

const conDefectos = (item) => ({ data: {}, label: NODE_NAMES[item.type], ...item });

// Opciones del menú de Función Generada, en orden
export const OPCIONES_FUNCION_GENERADA = [
    {
        id: "fg-fdp",
        type: "preparation",
        detalle: "Variable de datos",
        ayuda: "Llama a una variable de datos del Análisis Previo (función de probabilidad), p. ej. IA.",
    },
    {
        id: "fg-subrutina",
        type: "subroutine",
        detalle: "Crea su pestaña",
        ayuda: "Función propia del algoritmo: calcular() o calcular(A, B). La primera vez que se nombra crea su pestaña; con el mismo nombre, la llama.",
    },
    {
        id: "fg-random",
        type: "random",
        detalle: "Real entre 0 y 1",
        ayuda: "R1, R2…: toma un valor nuevo entre 0 y 1 cada vez que pasa por el nodo. Aparece en la tabla de variables.",
    },
].map(conDefectos);

// En orden (el Contexto no: es fijo en Main)
export const SIDEBAR_ITEMS = [
    { id: "input", type: "input" },
    { id: "process", type: "process" },
    { id: "decision", type: "decision" },
    { id: "document", type: "document" },
    { id: "io", type: "io" },
    { id: "funcion-generada", type: "preparation", label: FUNCION_GENERADA, opciones: OPCIONES_FUNCION_GENERADA },
    { id: "connector-left", type: "connector", data: { handleSide: "left" }, label: "Conector (punto a la izquierda)" },
    { id: "connector-right", type: "connector", data: { handleSide: "right" }, label: "Conector (punto a la derecha)" },
    { id: "end", type: "end" },
].map(conDefectos);

// Elemento que se está arrastrando (ver DnDContext), o null. El botón de
// Función Generada no se arrastra: se arrastran sus opciones.
export const itemDeBarra = (id) =>
    [...SIDEBAR_ITEMS, ...OPCIONES_FUNCION_GENERADA].find(
        (item) => item.id === id && !item.opciones
    ) ?? null;
