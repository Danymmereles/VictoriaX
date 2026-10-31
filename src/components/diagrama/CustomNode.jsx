import { useLayoutEffect, useRef, useState } from "react";
import {
    Handle,
    Position,
    useReactFlow,
} from "@xyflow/react";

import { FlowShape } from "./shapes";
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

export default function CustomNode({ id, data }) {
    const { setNodes } = useReactFlow();

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

        setNodes((nodes) =>
            nodes.map((node) =>
                node.id === id
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            label: text.trim() || data.label,
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
            className={`flow-node flow-node--${data.type}`}
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

            <div className="flow-node__label">
                {editing ? (
                    <input
                        autoFocus
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        onBlur={saveText}
                        onKeyDown={handleKeyDown}
                        className="node-edit-input nodrag"
                        style={{ width: `${Math.max(text.length, 3) + 1}ch` }}
                    />
                ) : (
                    <span onDoubleClick={startEditing}>
                        {data.label}
                    </span>
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
