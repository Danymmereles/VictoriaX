import "./DiagramaTabs.css";

/*
 * Pestañas de la página del diagrama.
 * Agregar una vista nueva = sumar una entrada a VISTAS.
 */
export const VISTAS = {
    editor: "editor",
    ejecucion: "ejecucion",
};

const TABS = [
    {
        id: VISTAS.editor,
        label: "Diagrama",
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="3" width="9" height="6" rx="1.5" />
                <rect x="12" y="15" width="9" height="6" rx="1.5" />
                <path d="M7.5 9 V18 H12" />
            </svg>
        ),
    },
    {
        id: VISTAS.ejecucion,
        label: "Ejecución",
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5.5 V18.5 L18.5 12 Z" />
            </svg>
        ),
    },
];

export const tabId = (vista) => `diagrama-tab-${vista}`;
export const panelId = (vista) => `diagrama-panel-${vista}`;

export default function DiagramaTabs({ value, onChange }) {
    return (
        <div className="diagram-tabs" role="tablist" aria-label="Vistas del diagrama">
            {TABS.map((tab) => {
                const active = value === tab.id;

                return (
                    <button
                        key={tab.id}
                        id={tabId(tab.id)}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-controls={panelId(tab.id)}
                        tabIndex={active ? 0 : -1}
                        className={`diagram-tab ${active ? "is-active" : ""}`}
                        onClick={() => onChange(tab.id)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
