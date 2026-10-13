import { useState } from "react";
import {
    Handle,
    Position,
    useReactFlow,
} from "@xyflow/react";

import "./CustomNode.css";

export default function CustomNode({ id, data }) {
    const { setNodes } = useReactFlow();

    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(data.label);

    const startEditing = () => {
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

    const editableContent = (
        <>
            {editing ? (
                <input
                    autoFocus
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    onBlur={saveText}
                    onKeyDown={handleKeyDown}
                    className="node-edit-input"
                />
            ) : (
                <span onDoubleClick={startEditing}>
          {data.label}
        </span>
            )}
        </>
    );

    /*
     * =========================
     * DECISIÓN
     * =========================
     */

    if (data.type === "decision") {
        return (
            <div className="decision-node">

                <Handle
                    type="target"
                    position={Position.Top}
                    id="input"
                    className="decision-handle decision-handle-top"
                />

                <div className="decision-shape">
                    <div className="decision-content">
                        {editableContent}
                    </div>
                </div>

                <Handle
                    type="source"
                    position={Position.Right}
                    id="yes"
                    className="decision-handle decision-handle-right"
                />

                <Handle
                    type="source"
                    position={Position.Left}
                    id="no"
                    className="decision-handle decision-handle-left"
                />

                <span className="decision-label decision-label-yes">
          SI
        </span>

                <span className="decision-label decision-label-no">
          NO
        </span>

            </div>
        );
    }

    /*
     * =========================
     * DOCUMENTO
     * =========================
     */

    if (data.type === "document") {
        return (
            <div className="special-node document-node">

                <Handle
                    type="target"
                    position={Position.Top}
                />

                <svg
                    className="document-shape"
                    viewBox="0 0 160 90"
                    preserveAspectRatio="none"
                >
                    <path
                        d="
              M 4 4
              H 156
              V 65
              C 140 78, 125 78, 110 68
              C 95 58, 80 58, 65 68
              C 45 82, 25 76, 4 62
              Z
            "
                    />
                </svg>

                <div className="document-content">
                    {editableContent}
                </div>

                <Handle
                    type="source"
                    position={Position.Bottom}
                />

            </div>
        );
    }

    /*
     * =========================
     * INPUT / OUTPUT
     * =========================
     */

    if (data.type === "io") {
        return (
            <div className="special-node io-node">

                <Handle
                    type="target"
                    position={Position.Top}
                />

                <svg
                    className="io-shape"
                    viewBox="0 0 160 80"
                    preserveAspectRatio="none"
                >
                    <polygon points="25,3 157,3 135,77 3,77" />
                </svg>

                <div className="io-content">
                    {editableContent}
                </div>

                <Handle
                    type="source"
                    position={Position.Bottom}
                />

            </div>
        );
    }

    /*
     * =========================
     * PREPARACIÓN
     * =========================
     */

    if (data.type === "preparation") {
        return (
            <div className="special-node preparation-node">

                <Handle
                    type="target"
                    position={Position.Top}
                />

                <svg
                    className="preparation-shape"
                    viewBox="0 0 160 80"
                    preserveAspectRatio="none"
                >
                    <polygon points="25,3 135,3 157,40 135,77 25,77 3,40" />
                </svg>

                <div className="preparation-content">
                    {editableContent}
                </div>

                <Handle
                    type="source"
                    position={Position.Bottom}
                />

            </div>
        );
    }

    /*
     * =========================
     * CONECTOR
     * =========================
     */

    if (data.type === "connector") {
        return (
            <div className="special-node connector-node">

                <Handle
                    type="target"
                    position={Position.Top}
                />

                <div className="connector-shape">
                    {editableContent}
                </div>

                <Handle
                    type="source"
                    position={Position.Bottom}
                />

            </div>
        );
    }

    /*
     * =========================
     * NODOS EXISTENTES
     * =========================
     */

    return (
        <div className={`custom-node node-${data.type}`}>

            <Handle
                type="target"
                position={Position.Top}
            />

            <div className="node-content">
                {editableContent}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
            />

        </div>
    );
}