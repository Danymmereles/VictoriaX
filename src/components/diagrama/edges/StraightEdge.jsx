import { BaseEdge } from "@xyflow/react";

import { HandleLayer, RouteHandle } from "./EdgeHandles.jsx";
import { useEdgeRoute } from "./useEdgeRoute.js";
import {
    caminoRecto,
    insertarQuiebre,
    limpiarRecta,
    moverQuiebre,
    puntosDeRecta,
    puntosMediosRecta,
    quitarQuiebre,
} from "./rutaRecta.js";

/*
 * Flecha Derecha editable (tipo "straight").
 * Seleccionada muestra:
 *   - un cuadrado chico en la mitad de cada tramo: arrastrarlo crea un
 *     quiebre;
 *   - un cuadrado por quiebre: se mueve arrastrándolo y se borra con
 *     doble clic (o dejándolo en línea con sus vecinos).
 */
export default function StraightEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
    selected,
    markerEnd,
    style,
    interactionWidth,
}) {
    const { ruta, arrastrar, cambiar } = useEdgeRoute(id, data, "straight");

    const origen = { x: sourceX, y: sourceY };
    const destino = { x: targetX, y: targetY };
    const puntos = puntosDeRecta(origen, destino, ruta);
    const quiebres = puntos.slice(1, -1);

    const terminar = (r) => limpiarRecta(r, origen, destino);

    return (
        <>
            <BaseEdge
                id={id}
                path={caminoRecto(puntos)}
                markerEnd={markerEnd}
                style={style}
                interactionWidth={interactionWidth}
            />

            <HandleLayer visible={selected}>
                {puntosMediosRecta(puntos).map((m) => (
                    <RouteHandle
                        key={`m${m.indice}`}
                        kind="midpoint"
                        x={m.x}
                        y={m.y}
                        title="Arrastrá para agregar un quiebre"
                        onPointerDown={(event) => {
                            const base = insertarQuiebre(ruta, m.indice, m);
                            arrastrar(event, {
                                calcular: (p) => moverQuiebre(base, m.indice, p, origen, destino),
                                terminar,
                            });
                        }}
                    />
                ))}

                {quiebres.map((q, i) => (
                    <RouteHandle
                        key={`q${i}`}
                        kind="waypoint"
                        x={q.x}
                        y={q.y}
                        title="Arrastrá para mover el quiebre · doble clic para quitarlo"
                        onPointerDown={(event) =>
                            arrastrar(event, {
                                calcular: (p) => moverQuiebre(ruta, i, p, origen, destino),
                                terminar,
                            })
                        }
                        onDoubleClick={() => cambiar(quitarQuiebre(ruta, i))}
                    />
                ))}
            </HandleLayer>
        </>
    );
}
