import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
    Handle,
    Position,
    useReactFlow,
} from "@xyflow/react";

import { FlowShape } from "./shapes";
import { useHistory } from "./HistoryContext";
import { usePageContext } from "./PageContext";
import "./CustomNode.css";

/*
 * Mide el tamaño real del nodo (sin el zoom del lienzo)
 * para dibujar el SVG a escala 1:1. Así el contorno
 * mide lo mismo en todas las figuras, aunque el nodo
 * crezca por un texto largo.
 */
function useNodeSize(ref) {
    const [size, setSize] = useState(null);

    useLayoutEffect(() => {
        const element = ref.current;

        if (!element) {
            return;
        }

        const measure = () => {
            setSize((current) => {
                const width = element.offsetWidth;
                const height = element.offsetHeight;

                if (current?.width === width && current?.height === height) {
                    return current;
                }

                return { width, height };
            });
        };

        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(element);

        return () => observer.disconnect();
    }, [ref]);

    return size;
}

// Tiempo que se muestra el aviso de un nombre rechazado
const NOTICE_MS = 2800;

export default function CustomNode({ id, data, selected }) {
    const { setNodes } = useReactFlow();
    const { takeSnapshot } = useHistory();
    const { nodeIssues, validateLabel } = usePageContext();

    const nodeRef = useRef(null);
    const size = useNodeSize(nodeRef);

    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(data.label);

    // Evita guardar dos veces (Enter + blur al desmontar el input)
    const editingRef = useRef(false);

    // Aviso breve cuando un nombre se rechaza
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        if (!notice) {
            return undefined;
        }

        const timer = setTimeout(() => setNotice(null), NOTICE_MS);
        return () => clearTimeout(timer);
    }, [notice]);

    const isDecision = data.type === "decision";

    // Nodo ancla: encabeza la página de su variable de datos.
    // Es el inicio (solo salida) y su nombre viene del Análisis Previo.
    const isAnchor = Boolean(data.anchorOf);

    const issue = nodeIssues?.[id];

    const startEditing = () => {
        if (isAnchor) {
            return;
        }

        setText(data.label);
        editingRef.current = true;
        setEditing(true);
    };

    const stopEditing = () => {
        editingRef.current = false;
        setEditing(false);
    };

    const saveText = () => {
        if (!editingRef.current) {
            return;
        }

        stopEditing();

        const newLabel = text.trim() || data.label;

        if (newLabel === data.label) {
            return;
        }

        const rejection = validateLabel?.({ data, nombre: newLabel });

        if (rejection) {
            setText(data.label);
            setNotice(rejection);
            return;
        }

        takeSnapshot();

        setNodes((nodes) =>
            nodes.map((node) =>
                node.id === id
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            label: newLabel,
                        },
                    }
                    : node
            )
        );
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            saveText();
        }

        if (event.key === "Escape") {
            setText(data.label);
            stopEditing();
        }
    };

    return (
        <div
            ref={nodeRef}
            className={[
                "flow-node",
                `flow-node--${data.type}`,
                selected && "is-selected",
                isAnchor && "is-anchor",
                issue && "has-issue",
            ]
                .filter(Boolean)
                .join(" ")}
            title={
                issue ||
                (isAnchor
                    ? "Inicio de la variable de datos. Su nombre se cambia en el Análisis Previo."
                    : undefined)
            }
        >
            {isAnchor && (
                <span className="flow-node__badge" aria-hidden="true">
                    Inicio
                </span>
            )}

            {size && (
                <FlowShape
                    type={data.type}
                    width={size.width}
                    height={size.height}
                    className="flow-node__shape"
                />
            )}

            {/* El ancla es el inicio: no recibe conexiones */}
            {!isAnchor && (
                <Handle
                    type="target"
                    position={Position.Top}
                    id={isDecision ? "input" : undefined}
                    className={isDecision ? "decision-handle" : undefined}
                />
            )}

            {/*
              * Al editar, el texto sigue en su lugar (invisible) y es
              * el que define el tamaño del nodo; el input se superpone
              * encima sin ocupar espacio. Así la figura no se deforma.
              */}
            <div className="flow-node__label">
                <span
                    className={`flow-node__text ${editing ? "is-editing" : ""}`}
                    onDoubleClick={startEditing}
                >
                    {editing ? text || "\u00a0" : data.label}
                </span>

                {editing && (
                    <input
                        autoFocus
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        onBlur={saveText}
                        onKeyDown={handleKeyDown}
                        className="node-edit-input nodrag"
                        aria-label="Texto del nodo"
                    />
                )}
            </div>

            {isDecision ? (
                <>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="yes"
                        className="decision-handle"
                    />

                    <Handle
                        type="source"
                        position={Position.Left}
                        id="no"
                        className="decision-handle"
                    />

                    <span className="decision-label decision-label-yes">
                        SI
                    </span>

                    <span className="decision-label decision-label-no">
                        NO
                    </span>
                </>
            ) : (
                <Handle
                    type="source"
                    position={Position.Bottom}
                />
            )}

            {notice && (
                <span className="flow-node__notice" role="alert">
                    {notice}
                </span>
            )}
        </div>
    );
}
