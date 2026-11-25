// ===========================================================================
// Parser de expresiones por precedencia (Pratt). Lógica pura.
//
// Es la técnica de los compiladores actuales (V8, TypeScript, rustc): un
// solo bucle que lee la tabla de operadores (operadores.js) en lugar de una
// función por nivel de precedencia. Lee CUALQUIER expresión (cuentas,
// comparaciones y condiciones juntas) y arma su árbol; qué combinaciones
// valen en cada lugar lo decide después chequeo.js, igual que un compilador
// separa el análisis sintáctico del chequeo de tipos.
//
//   parsearExpresion(cursor, minimo)
//     minimo: el nivel desde el que se sigue agrupando. Con
//     NIVEL.COMPARACION solo se leen cuentas (índices de vectores, +=).
//
// Cada nodo lleva rango: [inicio, fin] en el texto, y los que estaban
// entre paréntesis, parentesis: true (lo usan las reglas de la cátedra).
// ===========================================================================

import * as ast from "./ast.js";
import { describir } from "./cursor.js";
import { SEPARADOR_DE_ARGUMENTOS, buscarFuncion, rangoDeArgumentos } from "./funciones.js";
import { NIVEL, esComparacion, operadorBinario, operadorPrefijo } from "./operadores.js";

const ubicar = (nodo, inicio, fin) => ({ ...nodo, rango: [inicio, fin] });

export function parsearExpresion(c, minimo = NIVEL.MINIMO) {
    let izquierda = prefijo(c);

    for (;;) {
        const operador = operadorBinario(c.actual);

        // Solo sigue si el operador agrupa más fuerte que el contexto
        if (!operador || operador.nivel <= minimo) {
            return izquierda;
        }

        const token = c.avanzar();

        // Asociativo a derecha (^): el lado derecho acepta el mismo nivel
        const nivelDerecho =
            operador.asociatividad === "derecha" ? operador.nivel - 1 : operador.nivel;
        const derecha = parsearExpresion(c, nivelDerecho);

        izquierda = combinar(operador, token.valor, izquierda, derecha);

        // Comparaciones no asociativas: 0 < A < 10 no significa lo que parece
        if (operador.asociatividad === "ninguna" && esComparacion(c.actual)) {
            c.error("No se pueden encadenar comparaciones: usá AND (A > 0 AND A < 10).");
        }
    }
}

function combinar(operador, op, izquierda, derecha) {
    const rango = [izquierda.rango[0], derecha.rango[1]];

    if (operador.nodo === "logica") {
        // A AND B AND C: un solo nodo con tres operandos
        const operandos =
            izquierda.tipo === "logica" && izquierda.op === op && !izquierda.parentesis
                ? [...izquierda.operandos, derecha]
                : [izquierda, derecha];
        return ubicar(ast.logica(op, operandos), ...rango);
    }

    const constructor = operador.nodo === "comparacion" ? ast.comparacion : ast.binario;
    return ubicar(constructor(op, izquierda, derecha), ...rango);
}

// Lo que puede empezar una expresión: un valor, un paréntesis o un prefijo
function prefijo(c) {
    const t = c.actual;
    const operador = operadorPrefijo(t);

    if (operador) {
        c.avanzar();
        const operando = parsearExpresion(c, operador.nivel);
        const nodo = operador.nodo === "negacion" ? ast.negacion(operando) : ast.unario("-", operando);
        return ubicar(nodo, t.inicio, operando.rango[1]);
    }

    if (t.tipo === "numero") {
        c.avanzar();
        return ubicar(ast.numero(t.valor), t.inicio, t.fin);
    }

    if (t.tipo === "reservada" && ["TRUE", "FALSE", "NULL"].includes(t.valor)) {
        c.avanzar();
        const valor = t.valor === "NULL" ? null : t.valor === "TRUE";
        return ubicar(ast.constante(valor), t.inicio, t.fin);
    }

    if (t.tipo === "nombre") {
        return variable(c);
    }

    if (c.esOp("(")) {
        c.avanzar();
        const interior = parsearExpresion(c);
        c.esperarOp(")", `Falta cerrar el paréntesis: se encontró ${describir(c.actual)}.`);
        return { ...interior, parentesis: true, rango: [t.inicio, c.anterior.fin] };
    }

    if (c.finDeLinea()) {
        c.error("Falta un valor al final.");
    }

    c.error(`Falta un valor antes de ${describir(t)}.`);
}

// <variable> ::= <identificador> [ "[" <cuenta> "]" ]
export function variable(c) {
    const t = c.avanzar();
    const nombre = t.valor;

    // Una llamada dentro de una cuenta: solo a las funciones del catálogo
    // (vacío en esta versión). RND() ya no existe (v0.15) y las
    // subrutinas se llaman con su propio nodo
    if (c.esOp("(")) {
        const funcion = buscarFuncion(nombre);

        if (funcion) {
            return llamada(c, t, funcion);
        }

        c.error(
            nombre.toUpperCase() === "RND"
                ? "RND() ya no se usa: agregá un nodo Random (R1) y usá su nombre."
                : `${nombre}(...) no va dentro de una cuenta: las subrutinas se llaman con un nodo Función Generada.`,
            t
        );
    }

    if (!c.esOp("[")) {
        return ubicar(ast.variable(nombre), t.inicio, t.fin);
    }

    c.avanzar();
    if (c.esOp("]")) c.error(`Falta el índice: ${nombre}[0].`);

    const indice = parsearExpresion(c, NIVEL.COMPARACION);
    c.esperarOp("]", `Falta cerrar el corchete de ${nombre}[...].`);

    if (c.esOp("[")) {
        c.error("Solo hay vectores (una dimensión): no se usa M[i][j].");
    }

    return ubicar(ast.variable(nombre, indice), t.inicio, c.anterior.fin);
}

// NOMBRE(arg1; arg2): una función del catálogo (ver funciones.js)
function llamada(c, t, funcion) {
    const nombre = t.valor.toUpperCase();
    const argumentos = [];

    c.avanzar(); // (

    if (!c.esOp(")")) {
        do {
            argumentos.push(parsearExpresion(c));

            if (c.esOp(",")) {
                c.error(`Los argumentos de ${nombre} van separados por ${SEPARADOR_DE_ARGUMENTOS} (la coma es el decimal).`);
            }
        } while (c.esOp(SEPARADOR_DE_ARGUMENTOS) && c.avanzar());
    }

    c.esperarOp(")", `Falta cerrar el paréntesis de ${nombre}(...).`);

    const [minimo, maximo] = rangoDeArgumentos(funcion);

    if (argumentos.length < minimo || argumentos.length > maximo) {
        const cuantos = minimo === maximo ? `${minimo}` : `entre ${minimo} y ${maximo}`;
        c.error(`${nombre} lleva ${cuantos} ${maximo === 1 ? "argumento" : "argumentos"}.`, t);
    }

    return ubicar(ast.llamada(nombre, argumentos), t.inicio, c.anterior.fin);
}
