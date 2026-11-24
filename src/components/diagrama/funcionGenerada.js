// ===========================================================================
// Función Generada: los tres tipos del hexágono (22/11). Lógica pura.
//
//   fdp        (tipo "preparation") llama a una variable de datos del
//              Análisis Previo: "IA" = dame un valor de IA. Ver pages.js.
//   Subrutina  (tipo "subroutine")  calcular(A, B): función del usuario.
//              La primera vez que se nombra se crea su pestaña; otro nodo
//              con el mismo nombre la llama (no crea otra). Los parámetros
//              son variables propias de esa pestaña.
//   Random     (tipo "random")      R1, R2...: toma un valor nuevo, real
//              entre 0 y 1, cada vez que se pasa por el nodo. No tiene
//              pestaña: aparece en la tabla de variables, sin valor inicial.
//
// Las pestañas de subrutinas se mantienen aunque ya ningún nodo las use:
// quedan marcadas "sin uso" y el usuario las borra con un botón.
// ===========================================================================

import { analizar } from "@/lib/lenguaje";

export const TIPO_FDP = "preparation";
export const TIPO_SUBRUTINA = "subroutine";
export const TIPO_RANDOM = "random";

export const TIPOS_FUNCION_GENERADA = [TIPO_FDP, TIPO_SUBRUTINA, TIPO_RANDOM];

export const esFuncionGenerada = (node) =>
    TIPOS_FUNCION_GENERADA.includes(node?.data?.type);

export const esSubrutina = (node) => node?.data?.type === TIPO_SUBRUTINA;
export const esRandom = (node) => node?.data?.type === TIPO_RANDOM;

const texto = (node) => String(node?.data?.label ?? "").trim();


// ---------------------------------------------------------------------------
// Subrutinas
// ---------------------------------------------------------------------------

/*
 * Firma escrita en un nodo Subrutina: { nombre, parametros }, o null si el
 * texto no respeta la BNF (el error lo muestra validacion.js).
 * El nodo que la llama puede guardar lo que devuelve (v0.17):
 * "IN = calcular(A)" → { nombre: "calcular", parametros: ["A"] }.
 */
export function firmaDe(textoDelNodo, { regla = "llamada" } = {}) {
    const resultado = analizar(String(textoDelNodo ?? ""), regla);
    return resultado.ok ? resultado.usos.subrutina : null;
}

// La firma del inicio de una pestaña: sin destino (IN = …)
export const firmaDelAncla = (textoDelNodo) => firmaDe(textoDelNodo, { regla: "subrutina" });

export const textoFirma = ({ nombre, parametros = [] }) =>
    `${nombre}(${parametros.join(", ")})`;

const mismosParametros = (a, b) =>
    a.length === b.length && a.every((p, i) => p === b[i]);


/*
 * Por qué un nombre no puede ser el de una subrutina nueva, o null.
 *   ocupados: { variables: Set, datos: Set, randoms: Set } nombres en uso
 */
export function conflictoDeNombre(nombre, { variables, datos, randoms }) {
    if (nombre === "Main") {
        return `"Main" está reservado para el algoritmo principal.`;
    }

    if (datos.has(nombre)) {
        return `"${nombre}" es una variable de datos: para llamarla usá una Función Generada fdp.`;
    }

    if (randoms.has(nombre)) {
        return `"${nombre}" es un Random.`;
    }

    if (variables.has(nombre)) {
        return `"${nombre}" ya es una variable de la tabla: la subrutina necesita otro nombre.`;
    }

    return null;
}


/*
 * Problema de un nodo Subrutina (no el ancla), o null.
 *   firma:       la del nodo (ya válida según la BNF)
 *   subrutinas:  [{ nombre, parametros }] ya creadas
 *   pagina:      página donde está el nodo
 */
export function problemaDeSubrutina({ firma, subrutinas, pagina, ocupados }) {
    if (pagina?.tipo === "subrutina" && pagina.nombre === firma.nombre) {
        return `La subrutina ${firma.nombre} no puede llamarse a sí misma.`;
    }

    const existente = subrutinas.find((s) => s.nombre === firma.nombre);

    if (existente) {
        return mismosParametros(existente.parametros, firma.parametros)
            ? null
            : `${firma.nombre} ya existe como ${textoFirma(existente)}: usá los mismos parámetros (se cambian en el inicio de su pestaña).`;
    }

    return conflictoDeNombre(firma.nombre, ocupados);
}


/*
 * Subrutinas que hay que crear por los nodos de una página: firmas
 * válidas, con un nombre que todavía no tiene pestaña y que no choca
 * con otra cosa. La primera aparición define los parámetros.
 */
export function subrutinasNuevas({ nodes, subrutinas, pagina, ocupados }) {
    const nuevas = [];

    nodes
        .filter((node) => esSubrutina(node) && !node.data.anchorOf)
        .forEach((node) => {
            const firma = firmaDe(node.data.label);

            if (
                !firma ||
                [...subrutinas, ...nuevas].some((s) => s.nombre === firma.nombre) ||
                problemaDeSubrutina({ firma, subrutinas, pagina, ocupados })
            ) {
                return;
            }

            nuevas.push(firma);
        });

    return nuevas;
}


/*
 * Nombres de las subrutinas que algún nodo llama (en cualquier página).
 *   listas: [nodes, nodes, ...] una por página
 */
export function subrutinasEnUso(listas) {
    const nombres = new Set();

    listas.flat().forEach((node) => {
        if (esSubrutina(node) && !node.data.anchorOf) {
            const firma = firmaDe(node.data.label);
            if (firma) nombres.add(firma.nombre);
        }
    });

    return nombres;
}


/*
 * Parámetros nuevos escritos en el ancla de una pestaña de subrutina
 * (ahí se cambian), o null si no cambiaron o el texto no sirve.
 */
export function parametrosDelAncla(nodes, subrutina) {
    const ancla = nodes.find((node) => node.data?.anchorOf && esSubrutina(node));
    const firma = ancla && firmaDelAncla(ancla.data.label);

    if (
        !firma ||
        firma.nombre !== subrutina.nombre ||
        mismosParametros(firma.parametros, subrutina.parametros)
    ) {
        return null;
    }

    return firma.parametros;
}


// ---------------------------------------------------------------------------
// Random
// ---------------------------------------------------------------------------

const numeroDeRandom = (nombre) => Number(nombre.slice(1));

/*
 * Nombres de los Random del diagrama (válidos, sin repetir), en orden:
 * R1, R2, R10... Cada uno es una variable de la tabla.
 *   listas: [nodes, nodes, ...] una por página
 */
export function randomsDelDiagrama(listas) {
    const nombres = new Set(
        listas
            .flat()
            .filter(esRandom)
            .map(texto)
            .filter((nombre) => analizar(nombre, "random").ok)
    );

    return [...nombres].sort((a, b) => numeroDeRandom(a) - numeroDeRandom(b));
}

// Nombre para un Random nuevo: el primer Rn que no se usa
export function siguienteRandom(listas) {
    const usados = new Set(randomsDelDiagrama(listas));
    let n = 1;

    while (usados.has(`R${n}`)) n++;

    return `R${n}`;
}
