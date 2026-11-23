// ===========================================================================
// Lenguaje del diagrama de flujo (BNF v0.15, ver bnf-diagrama.md).
//
// Front-end de compilador, por etapas:
//   lexico.js       texto → tokens (línea, columna y posición de cada uno)
//   cursor.js       recorrido de los tokens, errores con su ubicación
//   operadores.js   tabla de operadores: precedencia y asociatividad
//   expresiones.js  parser de expresiones por precedencia (Pratt) → árbol
//   chequeo.js      qué expresión va en cada lugar + reglas de la cátedra
//   sintaxis.js     cada tipo de nodo: sentencias, listas, firmas
//   usos.js         variables que lee y asigna un árbol
//   ast.js          formas del árbol (AST) que usa el motor
//   funciones.js    catálogo de funciones (vacío en esta versión: LN, EXP...)
//   nombres.js      qué nombres son válidos (siglas, variables, etiquetas)
//
// Lógica pura, sin React. La usan el Análisis Previo (lib/analisisPrevio.js),
// la tabla de variables, los nodos del diagrama y el armado del programa
// que ejecuta el motor (lib/motor).
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
export { REGLAS_DE_LA_CATEDRA } from "./chequeo.js";
export { NIVEL } from "./operadores.js";
export { FUNCIONES, buscarFuncion } from "./funciones.js";
export * as ast from "./ast.js";
