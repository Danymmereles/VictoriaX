/*
 * =====================================================
 * FLECHAS DE LOS CONECTORES (markerEnd)
 * -----------------------------------------------------
 * Definimos las puntas como <marker> SVG propios para
 * que tomen los colores del tema (DiagramaTheme.css),
 * en claro y oscuro, igual que la línea del conector.
 *
 * React Flow acepta un id de marker como string en
 * edge.markerEnd y lo referencia con url(#id).
 * =====================================================
 */

export const EDGE_MARKERS = {
    default: "dg-arrow",
    selected: "dg-arrow-selected",
};

// Asigna la flecha correcta a cada conector (la del
// seleccionado cambia de color junto con la línea)
export function withEdgeMarkers(edges) {
    return edges.map((edge) => {
        const markerEnd = edge.selected
            ? EDGE_MARKERS.selected
            : EDGE_MARKERS.default;

        return edge.markerEnd === markerEnd ? edge : { ...edge, markerEnd };
    });
}

function Arrow({ id }) {
    return (
        <marker
            id={id}
            className="dg-edge-marker"
            viewBox="0 0 10 10"
            // La punta queda en el borde del punto de conexión
            // (no debajo de él): 1 unidad ≈ 1.2px con trazo de 2px
            refX="12"
            refY="5"
            markerUnits="strokeWidth"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
        >
            <path d="M 1 1 L 9 5 L 1 9 Z" />
        </marker>
    );
}

// Se monta una vez dentro del área del diagrama
export default function EdgeMarkers() {
    return (
        <svg className="dg-edge-markers" aria-hidden="true" focusable="false">
            <defs>
                <Arrow id={EDGE_MARKERS.default} />
                <Arrow id={EDGE_MARKERS.selected} />
            </defs>
        </svg>
    );
}
