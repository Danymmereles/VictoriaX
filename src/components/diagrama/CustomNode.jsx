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
                        {editing ? (
                            <input
                                autoFocus
                                value={text}
                                onChange={(event) =>
                                    setText(event.target.value)
                                }
                                onBlur={saveText}
                                onKeyDown={handleKeyDown}
                                className="node-edit-input"
                            />
                        ) : (
                            <span onDoubleClick={startEditing}>
                {data.label}
              </span>
                        )}
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

    return (
        <div className={`custom-node node-${data.type}`}>

            <Handle
                type="target"
                position={Position.Top}
            />

            <div className="node-content">

                {editing ? (
                    <input
                        autoFocus
                        value={text}
                        onChange={(event) =>
                            setText(event.target.value)
                        }
                        onBlur={saveText}
                        onKeyDown={handleKeyDown}
                        className="node-edit-input"
                    />
                ) : (
                    <span onDoubleClick={startEditing}>
            {data.label}
          </span>
                )}

            </div>

            <Handle
                type="source"
                position={Position.Bottom}
            />

        </div>
    );
}