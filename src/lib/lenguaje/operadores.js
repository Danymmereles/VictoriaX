// ===========================================================================
// Tabla de operadores del lenguaje: precedencia y asociatividad, en UN
// solo lugar. Lógica pura.
//
// Como en los lenguajes actuales (Python, JavaScript, Rust), el parser
// (expresiones.js) no tiene una función por nivel: lee esta tabla. Para
// agregar un operador o cambiar una precedencia alcanza con tocar acá.
//
// nivel: más alto = se agrupa primero (2 + 3 * 4 = 2 + (3 * 4))
//   1  OR
//   2  AND                 (AND antes que OR, como en todos los lenguajes)
//   3  NOT                 (prefijo, como el not de Python)
//   4  < <= > >= == !=     (no asociativos: 0 < A < 10 es un error, como en Rust)
//   5  + -
//   6  * / % \
//   7  -                   (cambio de signo, prefijo)
//   8  ^                   (asociativo a derecha: 2 ^ 3 ^ 2 = 2 ^ 9; -2 ^ 2 = -4)
// ===========================================================================

export const NIVEL = {
    MINIMO: 0,
    OR: 1,
    AND: 2,
    NOT: 3,
    COMPARACION: 4,
    SUMA: 5,
    PRODUCTO: 6,
    SIGNO: 7,
    POTENCIA: 8,
};

// asociatividad: "izquierda" | "derecha" | "ninguna"
// nodo: qué nodo del AST arma (ver ast.js)
const BINARIOS = {
    OR: { nivel: NIVEL.OR, asociatividad: "izquierda", nodo: "logica" },
    AND: { nivel: NIVEL.AND, asociatividad: "izquierda", nodo: "logica" },
    "<": { nivel: NIVEL.COMPARACION, asociatividad: "ninguna", nodo: "comparacion" },
    "<=": { nivel: NIVEL.COMPARACION, asociatividad: "ninguna", nodo: "comparacion" },
    ">": { nivel: NIVEL.COMPARACION, asociatividad: "ninguna", nodo: "comparacion" },
    ">=": { nivel: NIVEL.COMPARACION, asociatividad: "ninguna", nodo: "comparacion" },
    "==": { nivel: NIVEL.COMPARACION, asociatividad: "ninguna", nodo: "comparacion" },
    "!=": { nivel: NIVEL.COMPARACION, asociatividad: "ninguna", nodo: "comparacion" },
    "+": { nivel: NIVEL.SUMA, asociatividad: "izquierda", nodo: "binario" },
    "-": { nivel: NIVEL.SUMA, asociatividad: "izquierda", nodo: "binario" },
    "*": { nivel: NIVEL.PRODUCTO, asociatividad: "izquierda", nodo: "binario" },
    "/": { nivel: NIVEL.PRODUCTO, asociatividad: "izquierda", nodo: "binario" },
    "%": { nivel: NIVEL.PRODUCTO, asociatividad: "izquierda", nodo: "binario" },
    "\\": { nivel: NIVEL.PRODUCTO, asociatividad: "izquierda", nodo: "binario" },
    "^": { nivel: NIVEL.POTENCIA, asociatividad: "derecha", nodo: "binario" },
};

const PREFIJOS = {
    NOT: { nivel: NIVEL.NOT, nodo: "negacion" },
    "-": { nivel: NIVEL.SIGNO, nodo: "unario" },
};

// Los operadores son tokens "op" (+, <=) o palabras reservadas (AND, NOT)
const clave = (t) => (t.tipo === "op" || t.tipo === "reservada" ? t.valor : null);

export const operadorBinario = (t) => BINARIOS[clave(t)] ?? null;
export const operadorPrefijo = (t) => PREFIJOS[clave(t)] ?? null;

export const esComparacion = (t) => operadorBinario(t)?.nodo === "comparacion";
export const esOrden = (op) => ["<", "<=", ">", ">="].includes(op);
