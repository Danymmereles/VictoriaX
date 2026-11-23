// ===========================================================================
// Memoria de una ejecución: variables globales y un marco por llamada.
// Lógica pura.
//
// Globales: la tabla de Main (con sus valores iniciales), las variables de
// datos (arrancan en NULL) y los Random. Se ven desde todas las páginas.
//
// Marco: uno por página en ejecución (Main, cada llamada a una fdp o a una
// subrutina), con sus variables propias:
//   - en las pestañas de fdp y de subrutinas, una variable que no es global
//     se crea al asignarla y arranca de cero en cada llamada; leerla antes
//     de asignarla es un error;
//   - los parámetros de una subrutina son variables propias de su marco;
//   - en Main todo tiene que estar en la tabla, salvo la variable de un
//     Para, que el Para crea si no existe (global en Main, propia en las
//     pestañas).
// Al leer o escribir se busca primero en el marco y después en las globales.
//
// Vectores: todas las posiciones arrancan con el valor de la tabla. Si la
// dimensión es una variable (N), el vector se crea después del Contexto,
// con el valor que N tenga en ese momento.
// ===========================================================================

import { fallar } from "./errores.js";
import { esNumero, esVector, exigirIndice, formatear } from "./valores.js";

// Vector que todavía no se creó (su dimensión depende de otra variable)
const PENDIENTE = Symbol("vector pendiente");

export class Memoria {
    constructor(programa) {
        this.globales = new Map();
        this.randoms = new Set(programa.randoms);
        this.pendientes = [];
        this.marcos = [];

        programa.variables.forEach((v) => {
            if (!v.esVector) {
                this.globales.set(v.nombre, v.valorInicial);
            } else if (v.dimension?.tipo === "fijo") {
                this.globales.set(v.nombre, this.crearVector(v.nombre, v.dimension.valor, v.valorInicial));
            } else {
                this.globales.set(v.nombre, PENDIENTE);
                this.pendientes.push(v);
            }
        });

        programa.datos.forEach((nombre) => this.globales.set(nombre, null));
        programa.randoms.forEach((nombre) => this.globales.set(nombre, null));
    }

    crearVector(nombre, dimension, valorInicial) {
        if (!esNumero(dimension) || !Number.isInteger(dimension) || dimension < 1) {
            fallar(`La dimensión de ${nombre} tiene que ser un entero mayor que 0 (vale ${formatear(dimension)}).`);
        }
        return new Array(dimension).fill(valorInicial);
    }

    // Después del Contexto: los vectores con dimensión variable
    crearVectoresPendientes() {
        this.pendientes.forEach((v) => {
            const variable = v.dimension?.variable;

            if (!variable || !this.globales.has(variable)) {
                fallar(`${v.nombre} es un vector sin dimensión definida.`);
            }

            this.globales.set(v.nombre, this.crearVector(v.nombre, this.globales.get(variable), v.valorInicial));
        });
        this.pendientes = [];
    }


    // ---------------- Marcos ----------------

    get marco() {
        return this.marcos[this.marcos.length - 1];
    }

    entrar(pagina) {
        const marco = { pagina, locales: new Map(), asignadas: new Set() };
        this.marcos.push(marco);
        return marco;
    }

    salir() {
        return this.marcos.pop();
    }


    // ---------------- Lectura y escritura ----------------

    leer(nombre) {
        const { locales } = this.marco;

        if (locales.has(nombre)) {
            return locales.get(nombre);
        }

        if (this.globales.has(nombre)) {
            const valor = this.globales.get(nombre);

            if (valor === PENDIENTE) {
                fallar(`${nombre} todavía no existe: es un vector cuya dimensión se toma después del Contexto.`);
            }
            return valor;
        }

        fallar(`${nombre} no tiene valor todavía: se usa antes de asignarle uno.`);
    }

    escribir(nombre, valor) {
        const { locales, asignadas, pagina } = this.marco;

        if (this.randoms.has(nombre)) {
            fallar(`${nombre} es un Random: toma un valor nuevo cada vez que pasa por su nodo, no se le asigna.`);
        }

        if (esVector(valor) && !locales.has(nombre)) {
            const actual = this.globales.get(nombre);
            if (this.globales.has(nombre) && !esVector(actual)) {
                fallar(`No se puede guardar un vector entero en ${nombre}.`);
            }
        }

        if (locales.has(nombre)) {
            locales.set(nombre, valor);
        } else if (this.globales.has(nombre)) {
            if (esVector(this.globales.get(nombre)) && !esVector(valor)) {
                fallar(`${nombre} es un vector: asigná una posición, por ejemplo ${nombre}[0] = ${formatear(valor)}.`);
            }
            this.globales.set(nombre, valor);
        } else if (pagina.tipo === "main") {
            fallar(`${nombre} no está en la tabla de variables.`);
        } else {
            locales.set(nombre, valor);
        }

        asignadas.add(nombre);
    }

    leerPosicion(nombre, indice, textoIndice) {
        const vector = this.leer(nombre);

        if (!esVector(vector)) {
            fallar(`${nombre} no es un vector: va sin [ ].`);
        }

        return vector[exigirIndice(indice, nombre, vector.length, textoIndice)];
    }

    escribirPosicion(nombre, indice, valor, textoIndice) {
        if (this.randoms.has(nombre)) {
            fallar(`${nombre} es un Random: no se le asigna.`);
        }

        const vector = this.leer(nombre);

        if (!esVector(vector)) {
            fallar(`${nombre} no es un vector: va sin [ ].`);
        }

        vector[exigirIndice(indice, nombre, vector.length, textoIndice)] = valor;
        this.marco.asignadas.add(nombre);
    }

    // Solo el nodo Random escribe un Random
    escribirRandom(nombre, valor) {
        this.globales.set(nombre, valor);
    }

    // Variable de un Para (for): usa la que existe (propia o global) o la
    // crea: en Main como global, en una pestaña como propia
    escribirContador(nombre, valor) {
        const { locales, asignadas, pagina } = this.marco;

        if (this.randoms.has(nombre)) {
            fallar(`${nombre} es un Random: el Para necesita otra variable.`);
        }

        if (locales.has(nombre)) {
            locales.set(nombre, valor);
        } else if (this.globales.has(nombre)) {
            if (esVector(this.globales.get(nombre))) {
                fallar(`${nombre} es un vector: el Para necesita una variable común.`);
            }
            this.globales.set(nombre, valor);
        } else if (pagina.tipo === "main") {
            this.globales.set(nombre, valor);
        } else {
            locales.set(nombre, valor);
        }

        asignadas.add(nombre);
    }

    // Parámetros de una subrutina, al entrar a su página
    crearLocal(nombre, valor) {
        this.marco.locales.set(nombre, valor);
    }

    // Copia de las globales (para mostrar el estado)
    instantanea() {
        const estado = {};
        this.globales.forEach((valor, nombre) => {
            estado[nombre] = valor === PENDIENTE ? null : esVector(valor) ? valor.slice() : valor;
        });
        return estado;
    }
}
