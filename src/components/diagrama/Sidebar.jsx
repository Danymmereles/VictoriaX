import { useDnD } from "./DnDContext";
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

function SidebarItem({ type, label }) {
    const [, setType] = useDnD();

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
            <div className={`sidebar-preview preview-${type}`}>
                {type === "connector" && "A"}

                {type === "document" && (
                    <svg viewBox="0 0 60 40">
                        <path d="
              M 2 2
              H 58
              V 28
              C 52 35, 46 35, 40 29
              C 34 23, 28 23, 22 29
              C 15 36, 9 34, 2 27
              Z
            " />
                    </svg>
                )}

                {type === "io" && (
                    <svg viewBox="0 0 60 40">
                        <polygon points="10,2 58,2 50,38 2,38" />
                    </svg>
                )}

                {type === "preparation" && (
                    <svg viewBox="0 0 60 40">
                        <polygon points="10,2 50,2 58,20 50,38 10,38 2,20" />
                    </svg>
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
