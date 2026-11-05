// ===========================================================================
// Páginas del algoritmo: Main + una página por cada VARIABLE DE DATOS del
// Análisis Previo. Lógica pura, sin React.
//
// Reglas (acordadas el 05/11):
// - Las variables de datos son funciones de probabilidad: cada una tiene su
//   página para definir el algoritmo que genera su valor (p. ej. "IC").
//   Las páginas salen del Análisis Previo, no de los nodos.
// - Cada página de variable arranca con su "nodo ancla": un nodo Preparación
//   fijo con el nombre de la variable, como inicio del algoritmo (no se borra
//   ni se renombra).
// - En cualquier página, un nodo Preparación es una LLAMADA a una variable de
//   datos ("dame un valor de IC"): su nombre debe ser una variable de datos y,
//   dentro de la página de una variable, no puede ser ella misma.
// ===========================================================================

export const MAIN_PAGE_ID = "main";
export const MAIN_PAGE_NAME = "Main";

// Tipo de nodo que llama a una variable de datos (nodo "Preparación")
export const CALL_NODE_TYPE = "preparation";

export const emptyPage = () => ({ nodes: [], edges: [], viewport: null });

export const esLlamada = (node) => node?.data?.type === CALL_NODE_TYPE;

// Nodo ancla: el nodo Preparación que encabeza la página de su variable
export const esAncla = (node) => Boolean(node?.data?.anchorOf);

export const anchorIdDe = (pageId) => `anchor-${pageId}`;

const clave = (nombre) => String(nombre ?? "").trim().toUpperCase();

export const mismoNombre = (a, b) => clave(a) === clave(b);


/*
 * Lista de páginas a partir de las variables de datos.
 *   funciones: [{ id, nombre, descripcion }] (ver variables.js)
 * Devuelve: [{ id, nombre, descripcion, duplicada }]
 */
export function derivarPaginas(funciones) {
    const paginas = [
        { id: MAIN_PAGE_ID, nombre: MAIN_PAGE_NAME, descripcion: "" },
        ...(funciones || []).map((f) => ({
            id: f.id,
            nombre: String(f.nombre ?? "").trim(),
            descripcion: f.descripcion || "",
        })),
    ];

    // Nombres repetidos (sin distinguir mayúsculas). "Main" está reservado.
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
        nodes: [
            {
                id: anchorIdDe(pagina.id),
                type: "custom",
                position: posicion,
                // React Flow no lo borra con Supr
                deletable: false,
                data: {
                    type: CALL_NODE_TYPE,
                    label: pagina.nombre,
                    anchorOf: pagina.id,
                },
            },
        ],
        edges: [],
        viewport: null,
    };
}


// El ancla siempre muestra el nombre de su variable
export function sincronizarAncla(nodes, pagina) {
    if (!pagina || pagina.id === MAIN_PAGE_ID) {
        return nodes;
    }

    return nodes.map((node) =>
        esAncla(node) && node.data.label !== pagina.nombre
            ? { ...node, data: { ...node.data, label: pagina.nombre } }
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
            p.id !== MAIN_PAGE_ID &&
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
        pagina &&
        pagina.id !== MAIN_PAGE_ID &&
        data?.type === CALL_NODE_TYPE &&
        mismoNombre(nombre, pagina.nombre)
    ) {
        return `La variable de datos "${pagina.nombre}" no puede llamarse a sí misma.`;
    }

    return null;
}


/*
 * Problemas de los nodos de la página actual (no bloquean, se marcan):
 *   { [nodeId]: mensaje }
 * Llamadas (nodos Preparación, menos el ancla) cuyo nombre no es una
 * variable de datos, o es una variable repetida.
 */
export function problemasDeNodos({ nodes, pagina, paginas }) {
    const problemas = {};

    if (!pagina) {
        return problemas;
    }

    const funciones = paginas.filter((p) => p.id !== MAIN_PAGE_ID);

    nodes
        .filter((node) => esLlamada(node) && !esAncla(node))
        .forEach((node) => {
            const nombre = String(node.data?.label ?? "").trim();
            const coincidencias = funciones.filter((p) => mismoNombre(p.nombre, nombre));

            if (coincidencias.length === 0) {
                problemas[node.id] = `"${nombre}" no es una variable de datos del Análisis Previo.`;
            } else if (coincidencias.length > 1) {
                problemas[node.id] = `Hay más de una variable de datos "${nombre}".`;
            }
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
