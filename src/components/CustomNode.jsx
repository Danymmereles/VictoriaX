import {
    Handle,
    Position,
} from "@xyflow/react";

import "../css/CustomNode.css";

export default function CustomNode({ data }) {
    return (
        <div
            className={`custom-node node-${data.type}`}
        >

            {/* Entrada de conexiones */}
            <Handle
                type="target"
                position={Position.Top}
            />

            <div className="node-content">
                {data.type === "decision" && (
                    <span className="decision-symbol">
            ?
          </span>
                )}

                <span>
          {data.label}
        </span>
            </div>

            {/* Salida de conexiones */}


            <Handle
                type="source"
                position={Position.Bottom}
            />

        </div>
    );
}