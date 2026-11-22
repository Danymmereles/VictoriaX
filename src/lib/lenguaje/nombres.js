// ===========================================================================
// Nombres válidos del lenguaje del diagrama (BNF v0.15, sección 1).
// Lógica pura. La usan el Análisis Previo (siglas), la tabla de variables
// y los nodos del diagrama, para que los tres acepten lo mismo.
//
//   <identificador> ::= ( <letra> | "_" ) { <letra> | <digito> | "_" }
//                       (* que no sea una palabra reservada *)
//
// Como en JavaScript: distingue mayúsculas (Ic e IC son distintas) y
// acepta "_". Solo letras sin tilde (a-z, A-Z): ni ñ ni tildes.
// Las palabras reservadas no distinguen mayúsculas: "and" tampoco vale.
//
// v0.15: RND() dejó de existir (ahora hay nodos Random: R1, R2...). Los
// nombres R seguidos de un número quedan reservados para esos nodos.
// ===========================================================================

export const PALABRAS_RESERVADAS = ["AND", "OR", "NOT", "TRUE", "FALSE", "NULL"];

const FORMA_NOMBRE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const esPalabraReservada = (texto) =>
    PALABRAS_RESERVADAS.includes(String(texto).toUpperCase());

/*
 * Por qué un nombre no es válido, o null si es válido.
 * El mensaje sirve tal cual para mostrarlo al usuario.
 */
export function motivoNombreInvalido(nombre) {
    const texto = String(nombre ?? "");

    if (!texto.trim()) {
        return "Falta el nombre.";
    }

    if (/\s/.test(texto.trim())) {
        return "No puede tener espacios.";
    }

    if (/^[0-9]/.test(texto)) {
        return "No puede empezar con un número.";
    }

    if (/[^\x00-\x7F]/.test(texto)) {
        return "No puede tener tildes ni ñ.";
    }

    if (!FORMA_NOMBRE.test(texto)) {
        return "Solo letras, números y _ (sin símbolos).";
    }

    if (esPalabraReservada(texto)) {
        return `Es una palabra reservada (${PALABRAS_RESERVADAS.join(", ")}).`;
    }

    return null;
}

export const esNombreValido = (nombre) => motivoNombreInvalido(nombre) === null;


// ---------------------------------------------------------------------------
// Random (v0.15): R1, R2, ..., RN. Cada uno es una variable que toma un
// valor nuevo, real entre 0 y 1, cada vez que se pasa por su nodo.
// ---------------------------------------------------------------------------

// R seguido de un número (también R0 o R01): reservado para los Random
export const esNombreDeRandom = (nombre) => /^R[0-9]+$/.test(String(nombre ?? "").trim());

// Nombre de un nodo Random: R y un número entero desde 1, sin ceros adelante
export function motivoNombreRandomInvalido(nombre) {
    const texto = String(nombre ?? "").trim();

    if (!texto) {
        return "Falta el nombre del Random (R1, R2…).";
    }

    if (/^R[1-9][0-9]*$/.test(texto)) {
        return null;
    }

    if (/^R0[0-9]*$/.test(texto)) {
        return "El número del Random empieza en 1, sin ceros adelante (R1, R2…).";
    }

    return "Un Random se llama R seguido de un número: R1, R2, R3…";
}

/*
 * Nombre de una VARIABLE (tabla, siglas del Análisis Previo, parámetros):
 * la regla de nombres y, además, que no sea el de un Random.
 */
export function motivoNombreDeVariable(nombre) {
    const motivo = motivoNombreInvalido(nombre);

    if (motivo) {
        return motivo;
    }

    if (esNombreDeRandom(nombre)) {
        return "Está reservado para los nodos Random (R1, R2…).";
    }

    return null;
}
