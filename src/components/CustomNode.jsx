import {
    Handle,
    Position,
} from "@xyflow/react";

import "../css/CustomNode.css";

export default function CustomNode({ data }) {

    // ==========================================
    // NODO DECISIÓN
    // ==========================================

    if (data.type === "decision") {

        return (
            <div className="decision-node">

                {/* Conexión de entrada */}
                <Handle
                    type="target"
                    position={Position.Top}
                    id="input"
                    className="decision-handle decision-handle-top"
                />


                {/* Figura del rombo */}
                <div className="decision-shape">

                    <div className="decision-content">
                        ?
                    </div>

                </div>


                {/* Conexión SI */}
                <Handle
                    type="source"
                    position={Position.Right}
                    id="yes"
                    className="decision-handle decision-handle-right"
                />


                {/* Conexión NO */}
                <Handle
                    type="source"
                    position={Position.Left}
                    id="no"
                    className="decision-handle decision-handle-left"
                />


                {/* Etiqueta SI */}
                <span className="decision-label decision-label-yes">
          SI
        </span>


                {/* Etiqueta NO */}
                <span className="decision-label decision-label-no">
          NO
        </span>

            </div>
        );
    }


    // ==========================================
    // RESTO DE NODOS
    // ==========================================

    return (
        <div
            className={`custom-node node-${data.type}`}
        >

            {/* Entrada */}
            <Handle
                type="target"
                position={Position.Top}
            />

            <div className="node-content">

        <span>
          {data.label}
        </span>

            </div>

            {/* Salida */}
            <Handle
                type="source"
                position={Position.Bottom}
            />

        </div>
    );
}