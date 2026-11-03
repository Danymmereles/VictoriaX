import { useDnD } from "./DnDContext";
import { FlowShape } from "./shapes";
import EdgeTypeSelector from "./EdgeTypeSelector";
import HistoryControls from "./HistoryControls";
import BackToAnalysisLink from "./BackToAnalysisLink";
import "./Sidebar.css";

// Tamaño (px) de cada figura en la barra lateral
const PREVIEW_SIZES = {
    input: [35, 35],
    process: [35, 35],
    decision: [38, 38],
    output: [40, 35],
    document: [46, 34],
    io: [46, 34],
    preparation: [46, 34],
    connector: [34, 34],
};

function SidebarItem({ type, label }) {
    const [, setType] = useDnD();
    const [width, height] = PREVIEW_SIZES[type];

    const onDragStart = (event) => {
        setType(type);
        event.dataTransfer.effectAllowed = "move";
    };

    return (
        <div
            className={`sidebar-item sidebar-${type}`}
            draggable
            onDragStart={onDragStart}
            title={label}
            aria-label={label}
        >
            <div className="sidebar-preview">
                <FlowShape type={type} width={width} height={height} />

                {type === "connector" && (
                    <span className="sidebar-preview-letter">A</span>
                )}
            </div>
        </div>
    );
}

export default function Sidebar({ edgeType, onEdgeTypeChange, onRun, hasDiagram }) {
    return (
        <aside className="sidebar">
            <BackToAnalysisLink hasDiagram={hasDiagram} />

            <HistoryControls />

            <EdgeTypeSelector
                value={edgeType}
                onChange={onEdgeTypeChange}
            />

            <div className="sidebar-items">
                <SidebarItem type="input" label="Entrada" />
                <SidebarItem type="process" label="Proceso" />
                <SidebarItem type="decision" label="Decisión" />
                <SidebarItem type="output" label="Salida" />

                <SidebarItem type="document" label="Documento" />
                <SidebarItem type="io" label="Entrada / Salida" />
                <SidebarItem type="preparation" label="Preparación" />
                <SidebarItem type="connector" label="Conector" />
            </div>

            {/* Ejecutar: abre la vista de ejecución */}
            <div className="sidebar-footer">
                <button
                    type="button"
                    className="run-button"
                    onClick={onRun}
                    aria-label="Ejecutar diagrama"
                    title="Ejecutar"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8 5.5 V18.5 L18.5 12 Z" />
                    </svg>
                </button>
            </div>
        </aside>
    );
}
