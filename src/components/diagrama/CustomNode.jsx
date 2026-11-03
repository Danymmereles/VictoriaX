import { useLayoutEffect, useRef, useState } from "react";
import {
    Handle,
    Position,
    useReactFlow,
} from "@xyflow/react";

import { FlowShape } from "./shapes";
import { useHistory } from "./HistoryContext";
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

export default function CustomNode({ id, data, selected }) {
    const { setNodes } = useReactFlow();
    const { takeSnapshot } = useHistory();

    const nodeRef = useRef(null);
    const size = useNodeSize(nodeRef);

    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(data.label);

    const isDecision = data.type === "decision";

    const startEditing = () => {
        setText(data.label);
        setEditing(true);
    };

    const saveText = () => {
        setEditing(false);

        const newLabel = text.trim() || data.label;

        if (newLabel === data.label) {
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
            setEditing(false);
        }
    };

    return (
        <div
            ref={nodeRef}
            className={`flow-node flow-node--${data.type} ${selected ? "is-selected" : ""}`}
        >
            {size && (
                <FlowShape
                    type={data.type}
                    width={size.width}
                    height={size.height}
                    className="flow-node__shape"
                />
            )}

            <Handle
                type="target"
                position={Position.Top}
                id={isDecision ? "input" : undefined}
                className={isDecision ? "decision-handle" : undefined}
            />

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
        </div>
    );
}
