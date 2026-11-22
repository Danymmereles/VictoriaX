// ===========================================================================
// Nombres válidos del lenguaje del diagrama (BNF v0.14, sección 1).
// Lógica pura. La usan el Análisis Previo (siglas), la tabla de variables
// y los nodos del diagrama, para que los tres acepten lo mismo.
//
//   <identificador> ::= ( <letra> | "_" ) { <letra> | <digito> | "_" }
//                       (* que no sea una palabra reservada *)
//
// Como en JavaScript: distingue mayúsculas (Ic e IC son distintas) y
// acepta "_". Solo letras sin tilde (a-z, A-Z): ni ñ ni tildes.
// Las palabras reservadas no distinguen mayúsculas: "and" tampoco vale.
// ===========================================================================

export const PALABRAS_RESERVADAS = ["AND", "OR", "NOT", "TRUE", "FALSE", "NULL", "RND"];

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
