import { EdgeLabelRenderer } from "@xyflow/react";

import { coord } from "./geometria.js";

/*
 * Manijas de una flecha seleccionada (como en Lucidchart). Van en la
 * capa de etiquetas de React Flow, encima de los nodos, en coordenadas
 * del lienzo.
 *
 *   kind:
 *     "waypoint"  cuadrado lleno: quiebre (se mueve)
 *     "midpoint"  cuadrado chico: mitad de un tramo (agrega un quiebre)
 *     "control"   círculo: control de la curva (cambia la forma)
 *     "segment"   píldora: tramo de la flecha angular (se desplaza)
 *   orientation: "vertical" | "horizontal" (solo "segment")
 */
export function RouteHandle({
    x,
    y,
    kind,
    orientation,
    title,
    onPointerDown,
    onDoubleClick,
}) {
    return (
        <div
            className={[
                "edge-handle",
                `edge-handle--${kind}`,
                orientation && `is-${orientation}`,
                // React Flow: no arrastrar nodos ni el lienzo desde acá
                "nodrag",
                "nopan",
            ]
                .filter(Boolean)
                .join(" ")}
            style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
            title={title}
            aria-label={title}
            role="button"
            onPointerDown={onPointerDown}
            onDoubleClick={(event) => {
                event.stopPropagation();
                onDoubleClick?.(event);
            }}
        />
    );
}

// Capa de manijas: solo se dibuja con la flecha seleccionada
export function HandleLayer({ visible, children }) {
    if (!visible) {
        return null;
    }

    return <EdgeLabelRenderer>{children}</EdgeLabelRenderer>;
}

// Línea guía entre un punto y su control (dentro del SVG de la flecha)
export function GuideLine({ from, to }) {
    return <path className="edge-guide" d={`M ${coord(from)} L ${coord(to)}`} />;
}
