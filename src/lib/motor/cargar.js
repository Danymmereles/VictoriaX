// ===========================================================================
// Carga: del JSON del programa (programa.js) a objetos de JS. Lógica pura.
//
// Igual que el Victoria anterior llenaba objetos desde su XML: cada página
// y cada nodo pasan a ser un objeto con sus datos y sus conexiones. Todavía
// no ejecutan nada: eso lo agrega el compilador (compilador/).
// ===========================================================================

import { ErrorDePrograma, validarPrograma } from "./programa.js";

export class Nodo {
    constructor(datos, pagina) {
        this.id = datos.id;
        this.pagina = pagina;
        this.tipo = datos.tipo;
        this.subtipo = datos.subtipo ?? null;
        this.texto = datos.texto ?? "";
        this.arbol = datos.arbol ?? null;
        this.siguiente = datos.siguiente ?? null;
        this.si = datos.si ?? null;
        this.no = datos.no ?? null;
        // Para (for): cuerpo y salida; su vuelta apunta al Para
        this.cuerpo = datos.cuerpo ?? null;
        this.salida = datos.salida ?? null;
        this.para = datos.para ?? null;
    }
}

export class Pagina {
    constructor(datos) {
        this.id = datos.id;
        this.tipo = datos.tipo;
        this.nombre = datos.nombre;
        this.parametros = datos.parametros ?? [];
        this.inicio = datos.inicio;
        this.nodos = new Map(datos.nodos.map((nodo) => [nodo.id, new Nodo(nodo, this)]));
    }

    // Para los mensajes: "calcular(A, B)", "IA" o "Main"
    get titulo() {
        return this.tipo === "subrutina" ? `${this.nombre}(${this.parametros.join(", ")})` : this.nombre;
    }
}

export class Programa {
    constructor(json) {
        this.variables = json.variables;
        this.randoms = json.randoms ?? [];
        this.paginas = new Map(json.paginas.map((pagina) => [pagina.id, new Pagina(pagina)]));
        this.inicio = this.paginas.get(json.inicio);
    }

    paginaDe(tipo, nombre) {
        return [...this.paginas.values()].find((p) => p.tipo === tipo && p.nombre === nombre) ?? null;
    }

    // Nombres de las variables de datos (una página fdp cada una)
    get datos() {
        return [...this.paginas.values()].filter((p) => p.tipo === "fdp").map((p) => p.nombre);
    }
}

export function cargarPrograma(json) {
    const problemas = validarPrograma(json);

    if (problemas.length > 0) {
        throw new ErrorDePrograma(problemas);
    }

    return new Programa(json);
}
