// ===========================================================================
// Árbol de sintaxis (AST) del lenguaje del diagrama. Lógica pura.
//
// El parser (sintaxis.js) arma estos objetos y el compilador
// (lib/motor/compilador) los convierte en funciones. Son objetos planos,
// así se pueden guardar en el JSON del programa.
//
// Expresiones
//   { tipo: "numero", valor }                     3,14 → 3.14
//   { tipo: "constante", valor }                  TRUE, FALSE, NULL (true, false, null)
//   { tipo: "variable", nombre, indice }          T, TPS[I] (indice: expresión o null)
//   { tipo: "unario", op: "-", operando }
//   { tipo: "binario", op, izq, der }             op: + - * / % \ ^
//   { tipo: "comparacion", op, izq, der }         op: < <= > >= == !=
//   { tipo: "logica", op, operandos }             op: AND | OR (dos o más operandos)
//   { tipo: "negacion", operando }                NOT (...)
//
// Sentencias (Asignación y Contexto), con la línea donde están
//   { tipo: "asignacion", destino, valor, linea }       T = TPLL
//   { tipo: "compuesta", destino, op, valor, linea }    T += 1 (op: + - * / % \ ^)
//   { tipo: "incremento", destino, op, linea }          T++ (op: +) / T-- (op: -)
//   destino: un nodo "variable"
//
// Texto completo de cada tipo de nodo
//   decision    una expresión
//   asignacion  { tipo: "sentencias", sentencias: [...] }   (también contexto)
//   resultado   { tipo: "resultado", nombres: [...] }
//   etiqueta    { tipo: "etiqueta", nombre }                 (Conector)
//   fdp         { tipo: "fdp", nombre }                      (Función Generada fdp)
//   subrutina   { tipo: "firma", nombre, parametros }
//   random      { tipo: "random", nombre }
// ===========================================================================

// "3,14" → 3.14 (coma decimal, ver BNF)
export const numero = (texto) => ({ tipo: "numero", valor: Number(String(texto).replace(",", ".")) });

export const constante = (valor) => ({ tipo: "constante", valor });

export const variable = (nombre, indice = null) => ({ tipo: "variable", nombre, indice });

export const unario = (op, operando) => ({ tipo: "unario", op, operando });

export const binario = (op, izq, der) => ({ tipo: "binario", op, izq, der });

export const comparacion = (op, izq, der) => ({ tipo: "comparacion", op, izq, der });

export const logica = (op, operandos) => ({ tipo: "logica", op, operandos });

export const negacion = (operando) => ({ tipo: "negacion", operando });

export const asignacion = (destino, valor, linea) => ({ tipo: "asignacion", destino, valor, linea });

export const compuesta = (destino, op, valor, linea) => ({ tipo: "compuesta", destino, op, valor, linea });

export const incremento = (destino, op, linea) => ({ tipo: "incremento", destino, op, linea });

export const sentencias = (lista) => ({ tipo: "sentencias", sentencias: lista });

export const resultado = (nombres) => ({ tipo: "resultado", nombres });

export const etiqueta = (nombre) => ({ tipo: "etiqueta", nombre });

export const fdp = (nombre) => ({ tipo: "fdp", nombre });

export const firma = (nombre, parametros) => ({ tipo: "firma", nombre, parametros });

export const random = (nombre) => ({ tipo: "random", nombre });
