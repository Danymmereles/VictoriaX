// ===========================================================================
// MOTOR de ejecución de diagramas de flujo. Lógica pura, sin React.
//
// Etapas, como en un intérprete profesional:
//
//   diagrama del editor
//     │  components/diagrama/ejecucion/armarPrograma.js
//     ▼
//   PROGRAMA (JSON)        programa.js   formato y verificación
//     │  cargar.js                       JSON → objetos (Programa, Pagina, Nodo)
//     ▼
//   PROGRAMA CARGADO
//     │  compilador/                     cada nodo → instrucción con su función
//     ▼
//   PROGRAMA COMPILADO
//     │  interprete.js                   paso a paso, pila de llamadas
//     ▼
//   RESULTADO               (estado, salidas de los Resultado, variables, error)
//
//   registro.js  evolución de las variables (un punto por instante de T)
//                para el gráfico de la ejecución
//
//   runtime/  valores y operaciones, memoria (globales y marcos), Random
//             con semilla, errores de ejecución y funciones (vacío en
//             esta versión: LN, EXP... van en runtime/funciones.js).
//
// El texto de cada nodo ya viene analizado (su árbol, lib/lenguaje/ast.js),
// así que el motor no depende del parser.
// ===========================================================================

import { cargarPrograma } from "./cargar.js";
import { compilarPrograma } from "./compilador/index.js";
import { Ejecucion } from "./interprete.js";

export { FORMATO_PROGRAMA, VERSION_PROGRAMA, ErrorDePrograma, validarPrograma } from "./programa.js";
export { cargarPrograma } from "./cargar.js";
export { compilarPrograma } from "./compilador/index.js";
export { Ejecucion, MAX_PASOS } from "./interprete.js";
export { formatear } from "./runtime/valores.js";
export { MAX_INSTANTES } from "./registro.js";

// Todo junto: programa (JSON) → ejecución lista para correr o ir paso a paso
export function prepararEjecucion(programa, opciones) {
    return new Ejecucion(compilarPrograma(cargarPrograma(programa)), opciones);
}
