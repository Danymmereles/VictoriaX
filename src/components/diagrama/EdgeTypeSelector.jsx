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

export default function EdgeTypeSelector({ value, onChange }) {
    return (
        <div
            className="sidebar-toolbar sidebar-toolbar--3"
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
                    className={`sidebar-tool ${value === type ? "is-active" : ""}`}
                    onClick={() => onChange(type)}
                >
                    {icon}
                </button>
            ))}
        </div>
    );
}
