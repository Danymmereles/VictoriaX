import { useDnD } from "./DnDContext";
import { FlowShape } from "./shapes";
import "./Sidebar.css";

/*
 * Tipos de conector (edges de React Flow).
 * Se aplican a TODOS los conectores del diagrama y a los nuevos.
 */
export const EDGE_TYPES = [
    {
        type: "straight",
        label: "Derecha",
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 19 L18 6" />
                <path d="M11 6 H18 V13" />
            </svg>
        ),
    },
    {
        type: "smoothstep",
        label: "Angular",
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 20 H11 V7 H18" />
                <path d="M15 4 L18 7 L15 10" />
            </svg>
        ),
    },
    {
        type: "default",
        label: "Curva",
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 20 C 5 11, 10 7, 18 7" />
                <path d="M15 4 L18 7 L15 10" />
            </svg>
        ),
    },
];

function EdgeTypeSelector({ value, onChange }) {
    return (
        <div
            className="edge-type-selector"
            role="radiogroup"
            aria-label="Tipo de conector"
        >
            {EDGE_TYPES.map(({ type, label, icon }) => (
                <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={value === type}
                    aria-label={label}
                    title={label}
                    className={`edge-type-option ${value === type ? "is-active" : ""}`}
                    onClick={() => onChange(type)}
                >
                    {icon}
                </button>
            ))}
        </div>
    );
}

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

export default function Sidebar({ edgeType, onEdgeTypeChange }) {
    return (
        <aside className="sidebar">
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
        </aside>
    );
}
