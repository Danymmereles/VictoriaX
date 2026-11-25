// ===========================================================================
// Foto del diagrama: todas las páginas con sus nodos y flechas, en el
// orden de la barra de páginas. Lógica pura.
//
// La página activa está en React Flow (se pasa como `activa`); las demás,
// guardadas en pagesStoreRef. Una página que nunca se abrió arranca con su
// ancla (o vacía, si es Main).
//
// La usan Exportar (JSON) y Ejecutar (revisión antes de interpretar), así
// los dos ven exactamente el mismo diagrama.
// ===========================================================================

import { MAIN_PAGE_ID, crearPaginaFuncion, emptyPage } from "./pages.js";

// Lo que se guarda de cada página (las subrutinas suman su firma y sus
// parámetros)
const datosDePagina = ({ id, nombre, tipo, firma, parametros }) => ({ id, nombre, tipo, firma, parametros });

export function fotoDelDiagrama({ pages, activePage, store, activa }) {
    return pages.map((pagina) => {
        if (pagina.id === activePage) {
            return { ...datosDePagina(pagina), nodes: activa.nodes, edges: activa.edges };
        }

        const guardada =
            store[pagina.id] ??
            (pagina.id === MAIN_PAGE_ID ? emptyPage() : crearPaginaFuncion(pagina));

        return { ...datosDePagina(pagina), nodes: guardada.nodes, edges: guardada.edges };
    });
}
