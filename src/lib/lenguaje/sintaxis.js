// ===========================================================================
// Sintaxis del lenguaje del diagrama (BNF v0.14). Lógica pura.
//
// analizar(texto, tipo) revisa el texto de un nodo:
//   tipo: "decision"   expresión lógica (sección 4)
//         "asignacion" una sentencia por línea (sección 6)
//         "contexto"   igual que la Asignación (sección 8)
//         "resultado"  nombres separados por coma (sección 9)
//         "etiqueta"   un nombre (Conector, sección 7)
//
// Devuelve:
//   { ok: true, usos }  o  { ok: false, error: { mensaje, linea } }
//   usos: { lecturas: [{ nombre, indexada }],
//           asignaciones: [{ nombre, indexada }], usaRnd }
// Los usos sirven para los controles que dependen de la tabla de
// variables (ver components/diagrama/validacion.js).
//
// Parser descendente: una función por regla de la BNF.
// ===========================================================================

import { ErrorDeSintaxis, tokenizar } from "./lexico.js";

const OP_ORDEN = ["<", "<=", ">", ">="];
const OP_IGUALDAD = ["==", "!="];
const OP_SUMA = ["+", "-"];
const OP_MULT = ["*", "/", "%", "\\"];
const OP_ASIG_COMP = ["+=", "-=", "*=", "/=", "%=", "^=", "\\="];

const esRelacional = (t) =>
    t.tipo === "op" && (OP_ORDEN.includes(t.valor) || OP_IGUALDAD.includes(t.valor));

const describir = (t) =>
    t.tipo === "fin" || t.tipo === "salto" ? "el final de la línea" : `"${t.valor}"`;

class Parser {
    constructor(tokens, { saltosComoEspacio }) {
        this.tokens = saltosComoEspacio ? tokens.filter((t) => t.tipo !== "salto") : tokens;
        this.pos = 0;
        this.usos = { lecturas: [], asignaciones: [], usaRnd: false };
    }

    get actual() {
        return this.tokens[this.pos];
    }

    error(mensaje) {
        throw new ErrorDeSintaxis(mensaje, this.actual.linea);
    }

    es(tipo, valor) {
        const t = this.actual;
        return t.tipo === tipo && (valor === undefined || t.valor === valor);
    }

    esOp(...valores) {
        return this.actual.tipo === "op" && valores.includes(this.actual.valor);
    }

    avanzar() {
        return this.tokens[this.pos++];
    }

    esperarOp(valor, mensaje) {
        if (!this.esOp(valor)) this.error(mensaje);
        return this.avanzar();
    }

    finDeLinea() {
        return this.es("fin") || this.es("salto");
    }

    // Guarda y restaura la posición y los usos (para retroceder)
    marca() {
        return {
            pos: this.pos,
            lecturas: this.usos.lecturas.length,
            asignaciones: this.usos.asignaciones.length,
            usaRnd: this.usos.usaRnd,
        };
    }

    volver(m) {
        this.pos = m.pos;
        this.usos.lecturas.length = m.lecturas;
        this.usos.asignaciones.length = m.asignaciones;
        this.usos.usaRnd = m.usaRnd;
    }


    // ---------------- Expresiones aritméticas (sección 3) ----------------

    // Devuelve true si la expresión es una variable sola (sin operadores)
    exprArit() {
        let sola = this.termino();
        while (this.esOp(...OP_SUMA)) {
            this.avanzar();
            this.termino();
            sola = false;
        }
        return sola;
    }

    termino() {
        let sola = this.unario();
        while (this.esOp(...OP_MULT)) {
            this.avanzar();
            this.unario();
            sola = false;
        }
        return sola;
    }

    unario() {
        if (this.esOp("-")) {
            this.avanzar();
            this.unario();
            return false;
        }
        return this.potencia();
    }

    potencia() {
        const sola = this.primario();
        if (this.esOp("^")) {
            this.avanzar();
            this.unario();
            return false;
        }
        return sola;
    }

    primario() {
        const t = this.actual;

        if (t.tipo === "numero") {
            this.avanzar();
            return false;
        }

        if (t.tipo === "nombre") {
            this.variable("lecturas");
            return true;
        }

        if (this.es("reservada", "RND")) {
            this.avanzar();
            this.esperarOp("(", "RND va con paréntesis: RND().");
            this.esperarOp(")", "RND() no lleva nada entre los paréntesis.");
            this.usos.usaRnd = true;
            return false;
        }

        if (this.esOp("(")) {
            this.avanzar();
            this.exprArit();
            this.esperarOp(")", `Falta cerrar el paréntesis: se encontró ${describir(this.actual)}.`);
            return false;
        }

        if (this.es("reservada", "NULL")) {
            this.error("NULL solo se compara con == o !=.");
        }

        if (this.es("reservada", "TRUE") || this.es("reservada", "FALSE")) {
            this.error(`${t.valor} no se puede usar en una cuenta.`);
        }

        if (this.finDeLinea()) {
            this.error("Falta un valor al final.");
        }

        this.error(`Falta un valor antes de ${describir(t)}.`);
    }

    // <variable> ::= <identificador> [ "[" <expr-arit> "]" ]
    variable(uso) {
        const nombre = this.avanzar().valor;
        let indexada = false;

        if (this.esOp("[")) {
            this.avanzar();
            if (this.esOp("]")) this.error(`Falta el índice: ${nombre}[0].`);
            this.exprArit();
            this.esperarOp("]", `Falta cerrar el corchete de ${nombre}[...].`);
            indexada = true;

            if (this.esOp("[")) {
                this.error("Solo hay vectores (una dimensión): no se usa M[i][j].");
            }
        }

        this.usos[uso].push({ nombre, indexada });
    }


    // ---------------- Expresiones lógicas (sección 4) ----------------

    exprLogica() {
        this.operandoLogico();

        if (this.es("reservada", "AND") || this.es("reservada", "OR")) {
            const conector = this.actual.valor;

            while (this.es("reservada", conector)) {
                this.avanzar();
                this.operandoLogico();
            }

            if (this.es("reservada", "AND") || this.es("reservada", "OR")) {
                this.error("No se pueden mezclar AND y OR sin paréntesis.");
            }
        }
    }

    operandoLogico() {
        if (this.es("reservada", "NOT")) {
            this.avanzar();
            this.esperarOp("(", "NOT va con paréntesis: NOT (A > B).");
            this.exprLogica();
            this.esperarOp(")", `Falta cerrar el paréntesis de NOT: se encontró ${describir(this.actual)}.`);
            return;
        }

        // "(" abre una expresión lógica o una aritmética: primero la lógica
        if (this.esOp("(")) {
            const m = this.marca();
            let logicaSeguidaDeComparacion = false;

            try {
                this.avanzar();
                this.exprLogica();
                this.esperarOp(")", "Falta cerrar el paréntesis.");

                if (!esRelacional(this.actual)) {
                    return;
                }
                logicaSeguidaDeComparacion = true;
            } catch {
                // no era lógica: se prueba como aritmética
            }

            this.volver(m);

            try {
                this.comparacionOValor();
                return;
            } catch (error) {
                if (logicaSeguidaDeComparacion) {
                    this.error("No se pueden comparar expresiones lógicas entre sí.");
                }
                throw error;
            }
        }

        this.comparacionOValor();
    }

    // <comparacion> | <constante-logica> | <variable>
    comparacionOValor() {
        if (this.es("reservada", "TRUE") || this.es("reservada", "FALSE")) {
            this.avanzar();
            if (this.esOp(...OP_IGUALDAD)) {
                this.avanzar();
                this.valor();
            } else if (this.esOp(...OP_ORDEN)) {
                this.error("TRUE y FALSE solo se comparan con == o !=.");
            }
            this.sinComparacionEncadenada();
            return;
        }

        if (this.es("reservada", "NULL")) {
            this.avanzar();
            if (!this.esOp(...OP_IGUALDAD)) {
                this.error("NULL solo se compara con == o !=.");
            }
            this.avanzar();
            this.valor();
            this.sinComparacionEncadenada();
            return;
        }

        const sola = this.exprArit();

        if (this.esOp(...OP_ORDEN)) {
            this.avanzar();
            this.exprArit();
        } else if (this.esOp(...OP_IGUALDAD)) {
            this.avanzar();
            this.valor();
        } else if (!sola) {
            if (this.esOp("=")) {
                this.error("Para comparar se usa ==, no =.");
            }
            this.error("Falta una comparación (por ejemplo, A > 0).");
        }

        this.sinComparacionEncadenada();
    }

    // <valor> ::= <expr-arit> | TRUE | FALSE | NULL
    valor() {
        if (this.es("reservada", "TRUE") || this.es("reservada", "FALSE") || this.es("reservada", "NULL")) {
            this.avanzar();
            return;
        }
        this.exprArit();
    }

    sinComparacionEncadenada() {
        if (esRelacional(this.actual)) {
            this.error("No se pueden encadenar comparaciones: usá AND (A > 0 AND A < 10).");
        }
    }


    // ---------------- Sentencias (Asignación y Contexto, sección 6) ----------------

    sentencia() {
        if (!this.es("nombre")) {
            if (this.es("reservada")) {
                this.error(`${this.actual.valor} es una palabra reservada: no se le asigna un valor.`);
            }
            this.error("Cada línea empieza con la variable que cambia (por ejemplo, T = 0).");
        }

        const nombre = this.actual.valor;
        this.variable("asignaciones");

        if (this.esOp("=")) {
            this.avanzar();
            this.exprAsignable();
        } else if (this.esOp(...OP_ASIG_COMP)) {
            this.avanzar();
            this.exprArit();
        } else if (this.esOp("++", "--")) {
            this.avanzar();
        } else if (this.esOp("==")) {
            this.error("Para asignar se usa =, no ==.");
        } else {
            this.error(`Falta = después de ${nombre}.`);
        }

        if (!this.finDeLinea()) {
            if (this.esOp("=")) {
                this.error("Va una sola asignación por línea.");
            }
            this.error(`Sobra ${describir(this.actual)}: va una sentencia por línea.`);
        }
    }

    // <expr-asignable> ::= NULL | <expr-logica> | <expr-arit>
    exprAsignable() {
        if (this.es("reservada", "NULL")) {
            this.avanzar();
            return;
        }

        if (this.finDeLinea()) {
            this.error("Falta el valor después de =.");
        }

        const m = this.marca();

        try {
            this.exprArit();
            const sigueLogica =
                esRelacional(this.actual) ||
                this.es("reservada", "AND") ||
                this.es("reservada", "OR");
            // Si no sigue nada lógico, lo que sobra lo informa sentencia()
            if (!sigueLogica) return;
        } catch {
            // se prueba como lógica
        }

        this.volver(m);
        this.exprLogica();
    }

    sentencias() {
        while (!this.es("fin")) {
            if (this.es("salto")) {
                this.avanzar();
                continue;
            }
            this.sentencia();
        }
    }


    // ---------------- Resultado (sección 9) y etiqueta (sección 7) ----------------

    listaDeNombres() {
        do {
            if (!this.es("nombre")) {
                if (this.es("reservada")) {
                    this.error(`${this.actual.valor} es una palabra reservada.`);
                }
                this.error("Solo van nombres de variables separados por coma (A, B, C).");
            }
            this.usos.lecturas.push({ nombre: this.avanzar().valor, indexada: false, entera: true });

            if (this.esOp("[")) {
                this.error("Solo van nombres de variables: el vector se muestra entero (TPS).");
            }
        } while (this.esOp(",") && this.avanzar());

        if (!this.es("fin")) {
            this.error("Los nombres van separados por coma (A, B, C).");
        }
    }

    etiqueta() {
        if (!this.es("nombre")) {
            if (this.es("reservada")) {
                this.error(`${this.actual.valor} es una palabra reservada.`);
            }
            this.error("La etiqueta tiene que ser un nombre (letras, números y _, sin empezar con número).");
        }
        this.avanzar();
        if (!this.es("fin")) {
            this.error("La etiqueta es un solo nombre, sin espacios.");
        }
    }
}

export const TIPOS_DE_TEXTO = ["decision", "asignacion", "contexto", "resultado", "etiqueta"];

export function analizar(texto, tipo) {
    try {
        const tokens = tokenizar(texto);
        const multilinea = tipo === "asignacion" || tipo === "contexto";
        const p = new Parser(tokens, { saltosComoEspacio: !multilinea });

        if (tipo === "decision") {
            p.exprLogica();
            if (!p.es("fin")) {
                if (p.esOp("=")) p.error("Para comparar se usa ==, no =.");
                p.error(`Sobra ${describir(p.actual)} al final de la condición.`);
            }
            if (p.usos.usaRnd) {
                p.error("RND() no se puede usar en una Decisión: guardalo antes en una variable.");
            }
        } else if (multilinea) {
            p.sentencias();
        } else if (tipo === "resultado") {
            p.listaDeNombres();
        } else if (tipo === "etiqueta") {
            p.etiqueta();
        } else {
            throw new Error(`Tipo de texto desconocido: ${tipo}`);
        }

        return { ok: true, usos: p.usos };
    } catch (error) {
        if (error instanceof ErrorDeSintaxis) {
            return { ok: false, error: { mensaje: error.message, linea: error.linea } };
        }
        throw error;
    }
}
