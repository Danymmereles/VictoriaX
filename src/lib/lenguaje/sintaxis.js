// ===========================================================================
// Sintaxis del lenguaje del diagrama (BNF v0.15). Lógica pura.
//
// analizar(texto, tipo) revisa el texto de un nodo y arma su árbol:
//   tipo: "decision"   expresión lógica (sección 4)
//         "asignacion" una sentencia por línea (sección 6)
//         "contexto"   igual que la Asignación (sección 8)
//         "resultado"  nombres separados por coma (sección 9)
//         "etiqueta"   un nombre (Conector, sección 7)
//         "fdp"        un nombre (Función Generada tipo fdp)
//         "subrutina"  nombre(parametros) (Función Generada tipo Subrutina)
//         "random"     R1, R2... (Función Generada tipo Random)
//
// Devuelve:
//   { ok: true, arbol, usos }
//   { ok: false, error: { mensaje, linea, columna, rango } }
//   arbol: el AST (ver ast.js); cada nodo con su rango en el texto.
//   usos:  variables que se leen y se asignan (ver usos.js).
//
// Etapas, como en un compilador:
//   lexico.js       texto → tokens (con línea, columna y posición)
//   expresiones.js  tokens → árbol de cada expresión (precedencia, Pratt)
//   chequeo.js      ¿tiene sentido cada expresión donde está? y las
//                   reglas de la cátedra
//   este archivo    la forma de cada tipo de nodo: sentencias, listas,
//                   firmas
// ===========================================================================

import * as ast from "./ast.js";
import { chequear, REGLAS_DE_LA_CATEDRA } from "./chequeo.js";
import { Cursor, describir } from "./cursor.js";
import { parsearExpresion, variable } from "./expresiones.js";
import { ErrorDeSintaxis, tokenizar } from "./lexico.js";
import { motivoNombreRandomInvalido } from "./nombres.js";
import { NIVEL } from "./operadores.js";
import { usosDe } from "./usos.js";

const OP_ASIG_COMP = ["+=", "-=", "*=", "/=", "%=", "^=", "\\="];

const ubicar = (nodo, inicio, fin) => ({ ...nodo, rango: [inicio, fin] });


// ---------------- Decisión (sección 4) ----------------

function decision(c, chequearEn) {
    const arbol = parsearExpresion(c);

    if (!c.es("fin")) {
        if (c.esOp("=")) c.error("Para comparar se usa ==, no =.");
        c.error(`Sobra ${describir(c.actual)} al final de la condición.`);
    }

    chequearEn(arbol, "condicion");
    return arbol;
}


// ---------------- Asignación y Contexto (sección 6) ----------------

function sentencia(c, chequearEn) {
    if (!c.es("nombre")) {
        if (c.es("reservada")) {
            c.error(`${c.actual.valor} es una palabra reservada: no se le asigna un valor.`);
        }
        c.error("Cada línea empieza con la variable que cambia (por ejemplo, T = 0).");
    }

    const inicio = c.actual;
    const destino = variable(c);
    chequearEn(destino, "valor");
    let nodo;

    if (c.esOp("=")) {
        c.avanzar();
        if (c.finDeLinea()) c.error("Falta el valor después de =.");

        const valor = parsearExpresion(c);
        chequearEn(valor, "valor");
        nodo = ast.asignacion(destino, valor, inicio.linea);
    } else if (c.esOp(...OP_ASIG_COMP)) {
        // "+=" → "+"; el valor es una cuenta
        const op = c.avanzar().valor.slice(0, -1);
        const valor = parsearExpresion(c, NIVEL.COMPARACION);
        chequearEn(valor, "cuenta");
        nodo = ast.compuesta(destino, op, valor, inicio.linea);
    } else if (c.esOp("++", "--")) {
        nodo = ast.incremento(destino, c.avanzar().valor[0], inicio.linea);
    } else if (c.esOp("==")) {
        c.error("Para asignar se usa =, no ==.");
    } else {
        c.error(`Falta = después de ${destino.nombre}.`);
    }

    if (!c.finDeLinea()) {
        if (c.esOp("=")) c.error("Va una sola asignación por línea.");
        if (c.esOp(";")) c.error("Va una sentencia por línea: no se usa ;.");
        c.error(`Sobra ${describir(c.actual)}: va una sentencia por línea.`);
    }

    return ubicar(nodo, inicio.inicio, c.anterior.fin);
}

function sentencias(c, chequearEn) {
    const lista = [];

    while (!c.es("fin")) {
        if (c.es("salto")) {
            c.avanzar();
            continue;
        }
        lista.push(sentencia(c, chequearEn));
    }

    return ast.sentencias(lista);
}


// ---------------- Resultado (sección 9) y etiqueta (sección 7) ----------------

function listaDeNombres(c) {
    const nombres = [];

    do {
        if (!c.es("nombre")) {
            if (c.es("reservada")) c.error(`${c.actual.valor} es una palabra reservada.`);
            c.error("Solo van nombres de variables separados por coma (A, B, C).");
        }

        nombres.push(c.avanzar().valor);

        if (c.esOp("[")) {
            c.error("Solo van nombres de variables: el vector se muestra entero (TPS).");
        }
    } while (c.esOp(",") && c.avanzar());

    if (!c.es("fin")) {
        c.error("Los nombres van separados por coma (A, B, C).");
    }

    return ast.resultado(nombres);
}

function etiqueta(c) {
    if (!c.es("nombre")) {
        if (c.es("reservada")) c.error(`${c.actual.valor} es una palabra reservada.`);
        c.error("La etiqueta tiene que ser un nombre (letras, números y _, sin empezar con número).");
    }

    const nombre = c.avanzar().valor;

    if (!c.es("fin")) {
        c.error("La etiqueta es un solo nombre, sin espacios.");
    }

    return ast.etiqueta(nombre);
}


// ---------------- Función Generada (v0.15) ----------------

// fdp: el nombre de una variable de datos (IA)
function llamadaFdp(c) {
    if (!c.es("nombre") || c.proximo.tipo !== "fin") {
        c.error("Escribí el nombre de una variable de datos (por ejemplo, IA).");
    }
    return ast.fdp(c.avanzar().valor);
}

// <firma> ::= <identificador> "(" [ <identificador> { "," <identificador> } ] ")"
function firmaDeSubrutina(c) {
    if (!c.es("nombre")) {
        if (c.es("reservada")) c.error(`${c.actual.valor} es una palabra reservada.`);
        c.error("La subrutina empieza con su nombre: calcular() o calcular(A, B).");
    }

    const nombre = c.avanzar().valor;
    c.esperarOp("(", `Faltan los paréntesis: ${nombre}() (son obligatorios, aunque no tenga parámetros).`);

    const parametros = [];

    if (c.es("fin")) {
        c.error(`Falta cerrar el paréntesis: ${nombre}().`);
    }

    if (!c.esOp(")")) {
        do {
            if (!c.es("nombre")) {
                if (c.es("reservada")) c.error(`${c.actual.valor} es una palabra reservada.`);
                c.error("Los parámetros son nombres separados por coma: calcular(A, B).");
            }

            const parametro = c.avanzar();

            if (parametros.includes(parametro.valor)) {
                c.error(`El parámetro ${parametro.valor} está repetido.`, parametro);
            }
            parametros.push(parametro.valor);
        } while (c.esOp(",") && c.avanzar());
    }

    c.esperarOp(")", "Falta cerrar el paréntesis (los parámetros van separados por coma).");

    if (!c.es("fin")) {
        c.error("Después del paréntesis no va nada: calcular(A, B).");
    }

    return ast.firma(nombre, parametros);
}

function random(c) {
    if (!c.es("nombre") || c.proximo.tipo !== "fin") {
        c.error("Un Random se llama R seguido de un número: R1, R2, R3…");
    }

    const motivo = motivoNombreRandomInvalido(c.actual.valor);

    if (motivo) {
        c.error(motivo);
    }

    return ast.random(c.avanzar().valor);
}


// ---------------- Entrada ----------------

const PARSERS = {
    decision,
    asignacion: sentencias,
    contexto: sentencias,
    resultado: listaDeNombres,
    etiqueta,
    fdp: llamadaFdp,
    subrutina: firmaDeSubrutina,
    random,
};

export const TIPOS_DE_TEXTO = Object.keys(PARSERS);

/*
 * opciones.reglas: reglas de la cátedra (ver chequeo.js). Por defecto,
 * todas activas.
 */
export function analizar(texto, tipo, { reglas = REGLAS_DE_LA_CATEDRA } = {}) {
    const parser = PARSERS[tipo];

    if (!parser) {
        throw new Error(`Tipo de texto desconocido: ${tipo}`);
    }

    const fuente = String(texto ?? "");

    try {
        const multilinea = tipo === "asignacion" || tipo === "contexto";
        const c = new Cursor(tokenizar(fuente), { saltosComoEspacio: !multilinea });
        const chequearEn = (arbol, lugar) => chequear(arbol, lugar, { texto: fuente, reglas });

        const arbol = parser(c, chequearEn);
        return { ok: true, arbol, usos: usosDe(arbol) };
    } catch (error) {
        if (error instanceof ErrorDeSintaxis) {
            return {
                ok: false,
                error: {
                    mensaje: error.message,
                    linea: error.linea,
                    columna: error.columna,
                    rango: error.rango,
                },
            };
        }
        throw error;
    }
}
