// ===========================================================================
// Páginas del algoritmo: Main + una página por cada VARIABLE DE DATOS del
// Análisis Previo. Lógica pura, sin React.
//
// Reglas (acordadas el 05/11):
// - Las variables de datos son funciones de probabilidad: cada una tiene su
//   página para definir el algoritmo que genera su valor (p. ej. "IC").
//   Las páginas salen del Análisis Previo, no de los nodos.
// - Cada página de variable arranca con su "nodo ancla": un nodo Función Generada
//   fijo con el nombre de la variable, como inicio del algoritmo (no se borra
//   ni se renombra).
// - En cualquier página, un nodo Función Generada fdp es una LLAMADA a una
//   variable de datos ("dame un valor de IC"): su nombre debe ser una variable
//   de datos y, dentro de la página de una variable, no puede ser ella misma.
// - Subrutinas (22/11): además, una página por cada subrutina que crea el
//   usuario con una Función Generada tipo Subrutina (ver funcionGenerada.js).
//   Su ancla muestra la firma, calcular(A, B), y ahí se cambian los parámetros.
//
// Cada página: { id, nombre, descripcion, tipo, duplicada }
//   tipo: "main" | "fdp" | "subrutina". Las de subrutina suman firma,
//   parametros y sinUso (ningún nodo la llama: se puede borrar).
// ===========================================================================

import { TIPO_SUBRUTINA, firmaDe, firmaDelAncla, textoFirma } from "./funcionGenerada.js";

export const MAIN_PAGE_ID = "main";
export const MAIN_PAGE_NAME = "Main";

// Tipo de nodo que llama a una variable de datos (nodo "Función Generada", tipo preparation)
export const CALL_NODE_TYPE = "preparation";

export const emptyPage = () => ({ nodes: [], edges: [], viewport: null });

export const esLlamada = (node) => node?.data?.type === CALL_NODE_TYPE;

// Nodo ancla: el nodo Función Generada que encabeza la página de su variable
export const esAncla = (node) => Boolean(node?.data?.anchorOf);

export const anchorIdDe = (pageId) => `anchor-${pageId}`;


// ---------------------------------------------------------------------------
// Nodo Contexto: inicio fijo de Main (20/11). Reemplaza al "Inicio" ovalado.
// Ahí el usuario declara variables, una por línea. No está en la barra
// lateral, no se borra y solo tiene salida (abajo).
// ---------------------------------------------------------------------------
export const CONTEXT_NODE_TYPE = "context";
export const CONTEXT_NODE_ID = "context-main";

export const esContexto = (node) => node?.data?.type === CONTEXT_NODE_TYPE;

export function crearNodoContexto(posicion = { x: 0, y: 0 }) {
    return {
        id: CONTEXT_NODE_ID,
        type: "custom",
        position: posicion,
        deletable: false,
        data: {
            type: CONTEXT_NODE_TYPE,
            label: "",
        },
    };
}

// Nodos que el usuario no crea ni puede borrar (Contexto y anclas)
export const esNodoFijo = (node) => esAncla(node) || esContexto(node);

// ¿La página tiene algo hecho por el usuario?
export function tieneContenido({ nodes = [], edges = [] }) {
    return (
        edges.length > 0 ||
        nodes.some(
            (node) =>
                !esNodoFijo(node) ||
                (esContexto(node) && String(node.data?.label ?? "").trim())
        )
    );
}

// Como en JavaScript, los nombres distinguen mayúsculas (BNF v0.14):
// IA e ia son variables distintas.
const clave = (nombre) => String(nombre ?? "").trim();

export const mismoNombre = (a, b) => clave(a) === clave(b);


/*
 * Lista de páginas: Main, las variables de datos y las subrutinas.
 *   funciones:  [{ id, nombre, descripcion }] (ver variables.js)
 *   subrutinas: [{ id, nombre, parametros }] creadas por el usuario
 *   enUso:      Set de nombres de subrutinas que algún nodo llama
 */
export function derivarPaginas(funciones, subrutinas = [], enUso = null) {
    const paginas = [
        { id: MAIN_PAGE_ID, nombre: MAIN_PAGE_NAME, descripcion: "", tipo: "main" },
        ...(funciones || []).map((f) => ({
            id: f.id,
            nombre: String(f.nombre ?? "").trim(),
            descripcion: f.descripcion || "",
            tipo: "fdp",
        })),
        ...subrutinas.map((s) => ({
            id: s.id,
            nombre: s.nombre,
            descripcion: "",
            tipo: "subrutina",
            firma: textoFirma(s),
            parametros: s.parametros,
            sinUso: Boolean(enUso) && !enUso.has(s.nombre),
        })),
    ];

    // Nombres repetidos (distinguen mayúsculas). "Main" está reservado.
    const conteo = {};
    paginas.forEach((p) => {
        conteo[clave(p.nombre)] = (conteo[clave(p.nombre)] || 0) + 1;
    });

    return paginas.map((p) => ({
        ...p,
        duplicada: p.id !== MAIN_PAGE_ID && conteo[clave(p.nombre)] > 1,
    }));
}


/*
 * Contenido inicial de la página de una variable de datos: solo su nodo
 * ancla. `posicion` permite ubicarlo donde se vea al abrir la página.
 */
export function crearPaginaFuncion(pagina, posicion = { x: 0, y: 0 }) {
    return {
        nodes: [crearNodoAncla(pagina, posicion)],
        edges: [],
        viewport: null,
    };
}

export function crearNodoAncla(pagina, posicion = { x: 0, y: 0 }) {
    return {
        id: anchorIdDe(pagina.id),
        type: "custom",
        position: posicion,
        // React Flow no lo borra con Supr
        deletable: false,
        data: {
            type: pagina.tipo === "subrutina" ? TIPO_SUBRUTINA : CALL_NODE_TYPE,
            label: pagina.firma ?? pagina.nombre,
            anchorOf: pagina.id,
        },
    };
}


// El ancla siempre muestra el nombre de su variable (o la firma de su
// subrutina)
export function sincronizarAncla(nodes, pagina) {
    if (!pagina || pagina.id === MAIN_PAGE_ID) {
        return nodes;
    }

    const label = pagina.firma ?? pagina.nombre;

    return nodes.map((node) =>
        esAncla(node) && node.data.label !== label
            ? { ...node, data: { ...node.data, label } }
            : node
    );
}


/*
 * Nombre por defecto de una llamada nueva: la primera variable de datos
 * que se pueda llamar desde esta página (no la propia). Si no hay,
 * el nombre genérico del nodo.
 */
export function nombreLlamadaPorDefecto({ pagina, paginas, generico }) {
    const disponible = paginas.find(
        (p) =>
            p.tipo === "fdp" &&
            p.id !== pagina?.id &&
            !p.duplicada &&
            p.nombre
    );

    return disponible?.nombre ?? generico;
}


/*
 * Valida el nombre nuevo de un nodo ANTES de aceptarlo.
 * Devuelve un mensaje si se debe rechazar, o null.
 */
export function validarNombreNodo({ data, nombre, pagina }) {
    if (
        pagina?.tipo === "fdp" &&
        data?.type === CALL_NODE_TYPE &&
        mismoNombre(nombre, pagina.nombre)
    ) {
        return `La variable de datos "${pagina.nombre}" no puede llamarse a sí misma.`;
    }

    if (pagina?.tipo === "subrutina" && data?.type === TIPO_SUBRUTINA) {
        const firma = data.anchorOf ? firmaDelAncla(nombre) : firmaDe(nombre);

        // Ancla: solo se cambian los parámetros
        if (data.anchorOf) {
            if (!firma || firma.nombre !== pagina.nombre) {
                return `En el inicio solo se cambian los parámetros: ${pagina.nombre}(A, B).`;
            }
        } else if (firma?.nombre === pagina.nombre) {
            return `La subrutina ${pagina.nombre} no puede llamarse a sí misma.`;
        }
    }

    return null;
}


/*
 * Problemas de los nodos de la página actual (no bloquean, se marcan):
 *   { [nodeId]: mensaje }
 * - Nodos generados desde el Análisis Previo que el usuario tiene que
 *   completar (data.pending, ver generacion/). Se marcan hasta editarlos.
 * - Llamadas (nodos Función Generada, menos el ancla) cuyo nombre no es una
 *   variable de datos, o es una variable repetida.
 */
export function problemasDeNodos({ nodes, pagina, paginas }) {
    const problemas = {};

    if (!pagina) {
        return problemas;
    }

    const funciones = paginas.filter((p) => p.tipo === "fdp");

    nodes
        .filter((node) => esLlamada(node) && !esAncla(node))
        .forEach((node) => {
            const nombre = String(node.data?.label ?? "").trim();
            const coincidencias = funciones.filter((p) => mismoNombre(p.nombre, nombre));

            if (!nombre) {
                problemas[node.id] = "Escribí el nombre de una variable de datos.";
            } else if (coincidencias.length === 0) {
                problemas[node.id] = `"${nombre}" no es una variable de datos del Análisis Previo.`;
            } else if (coincidencias.length > 1) {
                problemas[node.id] = `Hay más de una variable de datos "${nombre}".`;
            }
        });

    // Lo que falta completar explica mejor qué hacer: tiene prioridad
    nodes
        .filter((node) => node.data?.pending)
        .forEach((node) => {
            problemas[node.id] = node.data.pending;
        });

    return problemas;
}


/*
 * Nombres de variables repetidos, para la validación (en el editor o al
 * presionar Ejecutar, según se defina).
 */
export function nombresDuplicados(paginas) {
    const nombres = paginas.filter((p) => p.duplicada).map((p) => p.nombre);
    return [...new Set(nombres.map(clave))].map(
        (k) => nombres.find((n) => clave(n) === k)
    );
}

export function mensajeDuplicada(pagina) {
    return mismoNombre(pagina.nombre, MAIN_PAGE_NAME)
        ? `"${MAIN_PAGE_NAME}" está reservado para el algoritmo principal: renombrá la variable en el Análisis Previo.`
        : `Hay más de una variable de datos llamada "${pagina.nombre}".`;
}
