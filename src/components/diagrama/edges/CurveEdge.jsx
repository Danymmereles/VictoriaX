import { BaseEdge } from "@xyflow/react";

import { GuideLine, HandleLayer, RouteHandle } from "./EdgeHandles.jsx";
import { useEdgeRoute } from "./useEdgeRoute.js";
import {
    caminoCurvo,
    controlExtremoAutomatico,
    geometriaCurva,
    insertarQuiebreCurva,
    moverControlExtremo,
    moverQuiebreCurva,
    moverTangente,
    puntosMediosCurva,
    quitarQuiebreCurva,
    tangenteAutomatica,
} from "./rutaCurva.js";

/*
 * Flecha Curva editable (tipo "default").
 * Seleccionada muestra:
 *   - un círculo en el control de cada punta: cambia cómo sale y cómo
 *     llega la curva;
 *   - un cuadrado chico en la mitad de cada tramo: arrastrarlo agrega un
 *     punto por donde pasa la curva;
 *   - un cuadrado por punto, con dos círculos (su tangente): el punto se
 *     mueve y se borra con doble clic; los círculos cambian la curvatura.
 * Doble clic en un círculo: vuelve a la forma automática.
 */
export default function CurveEdge({
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
    const { ruta, arrastrar, cambiar } = useEdgeRoute(id, data, "default");

    const origen = { x: sourceX, y: sourceY };
    const destino = { x: targetX, y: targetY };

    const geo = geometriaCurva({
        origen,
        ladoOrigen: sourcePosition,
        destino,
        ladoDestino: targetPosition,
        ruta,
    });

    const quiebres = geo.puntos.slice(1, -1);
    const { controles } = geo;

    const extremos = [
        { punta: "origen", punto: origen, control: controles.origen },
        { punta: "destino", punto: destino, control: controles.destino },
    ];

    return (
        <>
            <BaseEdge
                id={id}
                path={caminoCurvo(geo.tramos)}
                markerEnd={markerEnd}
                style={style}
                interactionWidth={interactionWidth}
            />

            {selected && (
                <g className="edge-guides">
                    {extremos.map(({ punta, punto, control }) => (
                        <GuideLine key={punta} from={punto} to={control} />
                    ))}
                    {controles.quiebres.map((c, i) => (
                        <GuideLine key={i} from={c.antes} to={c.despues} />
                    ))}
                </g>
            )}

            <HandleLayer visible={selected}>
                {extremos.map(({ punta, punto, control }) => (
                    <RouteHandle
                        key={punta}
                        kind="control"
                        x={control.x}
                        y={control.y}
                        title="Arrastrá para cambiar la curva · doble clic: forma automática"
                        onPointerDown={(event) =>
                            arrastrar(event, {
                                calcular: (p) => moverControlExtremo(ruta, punta, p, punto),
                            })
                        }
                        onDoubleClick={() => cambiar(controlExtremoAutomatico(ruta, punta))}
                    />
                ))}

                {puntosMediosCurva(geo.tramos).map((m) => (
                    <RouteHandle
                        key={`m${m.indice}`}
                        kind="midpoint"
                        x={m.x}
                        y={m.y}
                        title="Arrastrá para agregar un punto a la curva"
                        onPointerDown={(event) => {
                            const base = insertarQuiebreCurva(ruta, m.indice, m);
                            arrastrar(event, {
                                calcular: (p) => moverQuiebreCurva(base, m.indice, p, origen, destino),
                            });
                        }}
                    />
                ))}

                {controles.quiebres.flatMap((c, i) =>
                    ["antes", "despues"].map((lado) => (
                        <RouteHandle
                            key={`t${i}${lado}`}
                            kind="control"
                            x={c[lado].x}
                            y={c[lado].y}
                            title="Arrastrá para cambiar la curvatura · doble clic: automática"
                            onPointerDown={(event) =>
                                arrastrar(event, {
                                    calcular: (p) => moverTangente(ruta, i, lado, p),
                                })
                            }
                            onDoubleClick={() => cambiar(tangenteAutomatica(ruta, i))}
                        />
                    ))
                )}

                {quiebres.map((q, i) => (
                    <RouteHandle
                        key={`q${i}`}
                        kind="waypoint"
                        x={q.x}
                        y={q.y}
                        title="Arrastrá para mover el punto · doble clic para quitarlo"
                        onPointerDown={(event) =>
                            arrastrar(event, {
                                calcular: (p) => moverQuiebreCurva(ruta, i, p, origen, destino),
                            })
                        }
                        onDoubleClick={() => cambiar(quitarQuiebreCurva(ruta, i))}
                    />
                ))}
            </HandleLayer>
        </>
    );
}
