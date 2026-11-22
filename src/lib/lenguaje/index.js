// ===========================================================================
// Lenguaje del diagrama de flujo (BNF v0.15, ver bnf-diagrama.md).
//
//   nombres.js   qué nombres son válidos (siglas, variables, etiquetas)
//   lexico.js    texto → tokens
//   sintaxis.js  revisa el texto de cada tipo de nodo
//
// Lógica pura, sin React. La usan el Análisis Previo (lib/analisisPrevio.js),
// la tabla de variables y los nodos del diagrama. Más adelante, la base del
// intérprete de la ejecución.
// ===========================================================================

export {
    PALABRAS_RESERVADAS,
    esNombreDeRandom,
    esNombreValido,
    esPalabraReservada,
    motivoNombreDeVariable,
    motivoNombreInvalido,
    motivoNombreRandomInvalido,
} from "./nombres.js";
export { ErrorDeSintaxis, tokenizar } from "./lexico.js";
export { TIPOS_DE_TEXTO, analizar } from "./sintaxis.js";
