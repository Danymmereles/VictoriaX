// ===========================================================================
// Páginas del algoritmo: Main + un subproceso por cada nodo "Preparación"
// DE MAIN. Lógica pura, sin React.
//
// Reglas:
// - Solo los nodos Preparación de Main crean páginas. La página está ligada
//   al NODO (su id): si se renombra en Main, la página conserva su contenido.
// - Cada página de subproceso arranca con su "nodo ancla": el mismo nodo
//   Preparación, fijo, como inicio del algoritmo (no se borra ni se renombra
//   ahí; su nombre siempre es el del nodo de Main).
// - Dentro de un subproceso, los otros nodos Preparación son LLAMADAS a
//   subprocesos de Main: su nombre debe existir en Main y no puede ser el del
//   subproceso que se está definiendo.
// - Si se borra el nodo de Main, la página deja de mostrarse (su contenido se
//   conserva para Deshacer).
// ===========================================================================

export const MAIN_PAGE_ID = "main";
export const MAIN_PAGE_NAME = "Main";

// Tipo de nodo que define (en Main) o llama (en un subproceso) un subproceso
export const SUBPROCESS_NODE_TYPE = "preparation";

export const emptyPage = () => ({ nodes: [], edges: [], viewport: null });

export const esSubproceso = (node) => node?.data?.type === SUBPROCESS_NODE_TYPE;

// Nodo ancla: el nodo Preparación que encabeza su propia página
export const esAncla = (node) => Boolean(node?.data?.anchorOf);

export const anchorIdDe = (pageId) => `anchor-${pageId}`;

const clave = (nombre) => String(nombre ?? "").trim().toUpperCase();

export const mismoNombre = (a, b) => clave(a) === clave(b);


/*
 * Lista de páginas a partir de los nodos de Main.
 * Devuelve: [{ id, nombre, duplicada }]
 */
export function derivarPaginas(nodosMain) {
    const paginas = [
        { id: MAIN_PAGE_ID, nombre: MAIN_PAGE_NAME },
        ...(nodosMain || []).filter(esSubproceso).map((nodo) => ({
            id: nodo.id,
            nombre: String(nodo.data?.label ?? "").trim(),
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
 * Contenido inicial de la página de un subproceso: solo su nodo ancla.
 * `posicion` permite ubicarlo donde se vea al abrir la página.
 */
export function crearPaginaSubproceso(pagina, posicion = { x: 0, y: 0 }) {
    return {
        nodes: [
            {
                id: anchorIdDe(pagina.id),
                type: "custom",
                position: posicion,
                // React Flow no lo borra con Supr
                deletable: false,
                data: {
                    type: SUBPROCESS_NODE_TYPE,
                    label: pagina.nombre,
                    anchorOf: pagina.id,
                },
            },
        ],
        edges: [],
        viewport: null,
    };
}


// El ancla siempre muestra el nombre actual del nodo de Main
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
 * Valida el nombre nuevo de un nodo ANTES de aceptarlo.
 * Devuelve un mensaje si se debe rechazar, o null.
 */
export function validarNombreNodo({ data, nombre, pagina }) {
    if (
        pagina &&
        pagina.id !== MAIN_PAGE_ID &&
        data?.type === SUBPROCESS_NODE_TYPE &&
        mismoNombre(nombre, pagina.nombre)
    ) {
        return `El subproceso "${pagina.nombre}" no puede llamarse a sí mismo.`;
    }

    return null;
}


/*
 * Problemas de los nodos de la página actual (no bloquean, se marcan):
 *   { [nodeId]: mensaje }
 * - Main: nodos Preparación cuyo nombre está repetido o es "Main".
 * - Subproceso: llamadas a subprocesos que no existen en Main, o cuyo
 *   nombre está repetido en Main (no se sabe a cuál se refiere).
 */
export function problemasDeNodos({ nodes, pagina, paginas }) {
    const problemas = {};

    if (!pagina) {
        return problemas;
    }

    if (pagina.id === MAIN_PAGE_ID) {
        nodes.filter(esSubproceso).forEach((node) => {
            const suya = paginas.find((p) => p.id === node.id);

            if (suya?.duplicada) {
                problemas[node.id] = mensajeDuplicada(suya);
            }
        });

        return problemas;
    }

    const subprocesos = paginas.filter((p) => p.id !== MAIN_PAGE_ID);

    nodes
        .filter((node) => esSubproceso(node) && !esAncla(node))
        .forEach((node) => {
            const nombre = String(node.data?.label ?? "").trim();
            const coincidencias = subprocesos.filter((p) => mismoNombre(p.nombre, nombre));

            if (coincidencias.length === 0) {
                problemas[node.id] = `No hay un subproceso "${nombre}" en Main.`;
            } else if (coincidencias.length > 1) {
                problemas[node.id] = `Hay más de un subproceso "${nombre}" en Main.`;
            }
        });

    return problemas;
}


/*
 * Nombres de subprocesos repetidos, para la validación (en el editor o al
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
        ? `"${MAIN_PAGE_NAME}" está reservado para el algoritmo principal.`
        : `Hay más de un subproceso llamado "${pagina.nombre}".`;
}
