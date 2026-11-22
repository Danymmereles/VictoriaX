import { BaseEdge } from "@xyflow/react";

import { HandleLayer, RouteHandle } from "./EdgeHandles.jsx";
import { useEdgeRoute } from "./useEdgeRoute.js";
import {
    caminoAngular,
    geometriaAngular,
    moverTramo,
    simplificarAngular,
} from "./rutaAngular.js";

/*
 * Flecha Angular editable (tipo "smoothstep").
 * Seleccionada muestra una píldora en cada tramo que se puede mover:
 * arrastrarla desplaza el tramo (los vecinos se estiran). Si el tramo
 * sale de un nodo, se agrega un tramo corto para seguir saliendo derecho.
 * Doble clic en una píldora: vuelve a la ruta automática.
 */
export default function AngularEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    markerEnd,
    style,
    interactionWidth,
}) {
    const { ruta, arrastrar, cambiar } = useEdgeRoute(id, data, "smoothstep");

    const contexto = {
        origen: { x: sourceX, y: sourceY },
        ladoOrigen: sourcePosition,
        destino: { x: targetX, y: targetY },
        ladoDestino: targetPosition,
    };

    const geo = geometriaAngular({ ...contexto, ruta });

    return (
        <>
            <BaseEdge
                id={id}
                path={caminoAngular(geo.puntos)}
                markerEnd={markerEnd}
                style={style}
                interactionWidth={interactionWidth}
            />

            <HandleLayer visible={selected}>
                {geo.tramos
                    .filter((tramo) => tramo.movible)
                    .map((tramo) => {
                        const vertical = tramo.orientacion === "V";

                        return (
                            <RouteHandle
                                key={tramo.indice}
                                kind="segment"
                                orientation={vertical ? "vertical" : "horizontal"}
                                x={tramo.medio.x}
                                y={tramo.medio.y}
                                title="Arrastrá para mover el tramo · doble clic: ruta automática"
                                onPointerDown={(event) =>
                                    arrastrar(event, {
                                        calcular: (p) =>
                                            moverTramo(geo, tramo.indice, vertical ? p.x : p.y, contexto),
                                        terminar: (r) => simplificarAngular(r, contexto),
                                    })
                                }
                                onDoubleClick={() => cambiar(null)}
                            />
                        );
                    })}
            </HandleLayer>
        </>
    );
}
