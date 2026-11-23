// ===========================================================================
// Importar: leer un diagrama exportado como JSON (ver exportar/json.js).
// Lógica pura.
//
// leerDiagrama(texto, { funciones, tiposDeFlecha })
//   funciones:     variables de datos del Análisis Previo actual
//                  [{ id, nombre, descripcion }] (sus pestañas)
//   tiposDeFlecha: tipos válidos ("straight", "smoothstep", "default")
// Devuelve:
//   { ok: false, error }  si el archivo no sirve (no se toca nada), o
//   { ok: true, diagrama, avisos }
//   diagrama: {
//     main:        { nodes, edges },
//     datos:       { [id de la pestaña actual]: { nodes, edges } },
//     subrutinas:  [{ id, nombre, parametros, nodes, edges }],
//     variables:   tabla (sin los Random, que salen de sus nodos),
//     edgeType,
//   }
//   avisos: lo que se arregló o no se pudo traer (se muestra al usuario).
//
// Las pestañas de las variables de datos salen del Análisis Previo, así
// que las del archivo se ubican por NOMBRE: si el archivo tiene una que el
// Análisis Previo actual no tiene, no se importa (con un aviso).
// ===========================================================================

import { FORMATO_JSON, VERSION_JSON } from "../exportar/json.js";
import { firmaDe, textoFirma } from "../funcionGenerada.js";
import {
    CONTEXT_NODE_TYPE,
    MAIN_PAGE_ID,
    crearNodoAncla,
    crearNodoContexto,
} from "../pages.js";
import {
    ORIGEN_FUTURO,
    ORIGEN_RANDOM,
    esImportada,
    nuevoIdVariable,
    sincronizarConAnalisis,
} from "../variables.js";

const esLista = (x) => Array.isArray(x);

function falla(error) {
    return { ok: false, error };
}

// Tipo de una página del archivo (los archivos viejos no lo tenían)
function tipoDe(pagina) {
    if (pagina.tipo) return pagina.tipo;
    return pagina.id === MAIN_PAGE_ID ? "main" : "fdp";
}

/*
 * Nodos y flechas válidos de una página. Las flechas que apuntan a un
 * nodo que no existe se descartan (con un aviso).
 */
function limpiarPagina(pagina, edgeType, aviso) {
    const nodes = pagina.nodes.filter((n) => n && n.id && n.data?.type);
    const ids = new Set(nodes.map((n) => n.id));

    const edges = pagina.edges.filter((e) => e && ids.has(e.source) && ids.has(e.target));
    if (edges.length < pagina.edges.length) {
        aviso(`${pagina.nombre}: se descartaron ${pagina.edges.length - edges.length} flechas sueltas.`);
    }

    return {
        nodes: nodes.map((n) => ({ type: "custom", position: { x: 0, y: 0 }, ...n, selected: false })),
        edges: edges.map((e) => ({ ...e, type: edgeType, selected: false })),
    };
}

/*
 * El ancla (inicio) de una pestaña se vuelve a crear con el id de la
 * pestaña actual (las de datos pueden tener otro id que en el archivo),
 * en el mismo lugar, y sus flechas pasan al ancla nueva. Si no tenía
 * ancla, se agrega.
 */
function conAncla({ nodes, edges }, pagina) {
    const vieja = nodes.find((n) => n.data.anchorOf);
    const ancla = crearNodoAncla(pagina, vieja?.position);

    const id = (x) => (vieja && x === vieja.id ? ancla.id : x);

    return {
        nodes: [ancla, ...nodes.filter((n) => n !== vieja)],
        edges: edges.map((e) => ({ ...e, source: id(e.source), target: id(e.target) })),
    };
}

export function leerDiagrama(texto, { funciones = [], tiposDeFlecha = [] } = {}) {
    let json;

    try {
        json = JSON.parse(texto);
    } catch {
        return falla("El archivo no es un JSON válido.");
    }

    if (json?.formato !== FORMATO_JSON) {
        return falla("El archivo no es un diagrama de VictoriaX (se exporta con Exportar → JSON).");
    }

    if (typeof json.version !== "number" || json.version > VERSION_JSON) {
        return falla("El archivo es de una versión más nueva de VictoriaX.");
    }

    if (!esLista(json.paginas) || json.paginas.some((p) => !esLista(p?.nodes) || !esLista(p?.edges))) {
        return falla("El archivo está incompleto: faltan las páginas del diagrama.");
    }

    const avisos = [];
    const aviso = (texto) => avisos.push(texto);

    const edgeType = tiposDeFlecha.includes(json.edgeType) ? json.edgeType : tiposDeFlecha[0] ?? "smoothstep";

    // ---- Main ----
    const paginaMain = json.paginas.find((p) => tipoDe(p) === "main");
    if (!paginaMain) {
        return falla("El archivo no tiene la página Main.");
    }

    const main = limpiarPagina({ ...paginaMain, nombre: "Main" }, edgeType, aviso);
    if (!main.nodes.some((n) => n.data.type === CONTEXT_NODE_TYPE)) {
        main.nodes.unshift(crearNodoContexto());
        aviso("Main no tenía el Contexto: se agregó.");
    }

    // ---- Pestañas de las variables de datos (por nombre) ----
    const datos = {};

    json.paginas
        .filter((p) => tipoDe(p) === "fdp")
        .forEach((p) => {
            const actual = funciones.find((f) => f.nombre === p.nombre);

            if (!actual) {
                aviso(`La pestaña ${p.nombre} no está en el Análisis Previo actual: no se importó.`);
                return;
            }

            const pagina = { id: actual.id, nombre: actual.nombre, tipo: "fdp" };
            datos[actual.id] = conAncla(limpiarPagina(p, edgeType, aviso), pagina);
        });

    // ---- Subrutinas (se crean de nuevo, con sus parámetros) ----
    const subrutinas = [];

    json.paginas
        .filter((p) => tipoDe(p) === "subrutina")
        .forEach((p) => {
            const firma = esLista(p.parametros)
                ? { nombre: p.nombre, parametros: p.parametros }
                : firmaDe(p.firma ?? "");

            if (
                !p.id ||
                !firma?.nombre ||
                subrutinas.some((s) => s.nombre === firma.nombre || s.id === p.id)
            ) {
                aviso(`Se descartó una pestaña de subrutina inválida o repetida (${p.firma ?? p.nombre}).`);
                return;
            }

            const pagina = {
                id: p.id,
                nombre: firma.nombre,
                parametros: firma.parametros,
                tipo: "subrutina",
                firma: textoFirma(firma),
            };
            subrutinas.push({ ...pagina, ...conAncla(limpiarPagina(p, edgeType, aviso), pagina) });
        });

    // ---- Tabla de variables (los Random salen de sus nodos) ----
    const variables = (esLista(json.variables) ? json.variables : [])
        .filter((v) => v && typeof v.nombre === "string" && v.origen !== ORIGEN_RANDOM)
        .map((v) => ({
            ...v,
            id: nuevoIdVariable(),
            valorInicial: String(v.valorInicial ?? "0"),
        }));

    return {
        ok: true,
        diagrama: { main, datos, subrutinas, variables, edgeType },
        avisos,
    };
}


/*
 * Tabla de variables del archivo, puesta al día con el Análisis Previo
 * actual: las de Control, Estado y Resultado son las del análisis (con
 * el valor inicial del archivo); las de los eventos futuros, las
 * generadas y las agregadas a mano quedan como en el archivo.
 * Devuelve { variables, fuera }: fuera = nombres que el análisis ya no
 * tiene (no se importan).
 */
export function tablaDelArchivo(tabla, analisis) {
    const futuras = tabla.filter((v) => v.origen === ORIGEN_FUTURO);
    const resto = tabla.filter((v) => v.origen !== ORIGEN_FUTURO);

    const sincronizada = sincronizarConAnalisis(resto, analisis);
    const quedan = new Set(sincronizada.map((v) => v.nombre.trim()));

    return {
        variables: [
            ...sincronizada.filter(esImportada),
            ...futuras,
            ...sincronizada.filter((v) => !esImportada(v)),
        ],
        fuera: resto
            .filter((v) => esImportada(v) && !quedan.has(v.nombre.trim()))
            .map((v) => v.nombre),
    };
}
