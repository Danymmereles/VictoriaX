import { useReactFlow } from "@xyflow/react";

import { fotoDelDiagrama } from "../fotoDelDiagrama.js";
import { elegirDestino, guardarEn, nombreDeArchivo } from "./guardarArchivo.js";
import { imagenDelDiagrama } from "./imagen.js";
import { diagramaComoJson, jsonComoBlob } from "./json.js";

const esperarPintado = () =>
    new Promise((resolver) => requestAnimationFrame(() => requestAnimationFrame(resolver)));

/*
 * Exportar el diagrama (botón Exportar de la barra lateral).
 *   - PNG / JPG: la página que se está viendo (ver imagen.js).
 *   - JSON: todas las páginas, la tabla de variables y el tipo de flecha
 *     (ver json.js).
 * Primero se elige dónde guardar (ver guardarArchivo.js) y después se
 * arma el archivo.
 *
 * Devuelve exportar(formato) → nombre del archivo guardado, o null si el
 * usuario canceló.
 */
export function useExportar({ canvasRef, pages, activePage, pagesStoreRef, variables, edgeType }) {
    const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();

    // Todas las páginas: la activa está en React Flow, las demás guardadas
    const todasLasPaginas = () =>
        fotoDelDiagrama({
            pages,
            activePage,
            store: pagesStoreRef.current,
            activa: { nodes: getNodes(), edges: getEdges() },
        });

    // La imagen sale sin la selección (brillo, manijas); después se restaura
    const sinSeleccion = async (tarea) => {
        const nodos = new Set(getNodes().filter((n) => n.selected).map((n) => n.id));
        const flechas = new Set(getEdges().filter((e) => e.selected).map((e) => e.id));
        const habiaSeleccion = nodos.size > 0 || flechas.size > 0;

        if (habiaSeleccion) {
            setNodes((ns) => ns.map((n) => (n.selected ? { ...n, selected: false } : n)));
            setEdges((es) => es.map((e) => (e.selected ? { ...e, selected: false } : e)));
            await esperarPintado();
        }

        try {
            return await tarea();
        } finally {
            if (habiaSeleccion) {
                setNodes((ns) => ns.map((n) => (nodos.has(n.id) ? { ...n, selected: true } : n)));
                setEdges((es) => es.map((e) => (flechas.has(e.id) ? { ...e, selected: true } : e)));
            }
        }
    };

    return async function exportar(formato) {
        const pagina = pages.find((p) => p.id === activePage);
        const base = formato === "json" ? "diagrama" : `diagrama-${pagina?.nombre ?? "Main"}`;

        // Antes que nada (todavía dentro del clic): dónde guardar
        const destino = await elegirDestino(nombreDeArchivo(base, formato), formato);

        if (!destino) {
            return null;
        }

        const blob =
            formato === "json"
                ? jsonComoBlob(diagramaComoJson({ paginas: todasLasPaginas(), variables, edgeType }))
                : await sinSeleccion(() =>
                    imagenDelDiagrama(canvasRef.current.querySelector(".react-flow"), formato)
                );

        await guardarEn(destino, blob);
        return destino.nombre;
    };
}
