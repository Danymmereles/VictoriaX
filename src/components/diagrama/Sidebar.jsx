import { useDnD } from "./DnDContext";
import { FlowShape } from "./shapes";
import EdgeTypeSelector from "./EdgeTypeSelector";
import HistoryControls from "./HistoryControls";
import { NODE_NAMES } from "./nodeNames";
import BackToAnalysisLink from "./BackToAnalysisLink";
import "./Sidebar.css";

// Figuras que se pueden arrastrar, en orden (el Contexto no:
// es fijo en Main)
const SIDEBAR_TYPES = [
    "input",
    "process",
    "decision",
    "output",
    "document",
    "io",
    "preparation",
    "connector",
];

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
                {SIDEBAR_TYPES.map((type) => (
                    <SidebarItem key={type} type={type} label={NODE_NAMES[type]} />
                ))}
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
