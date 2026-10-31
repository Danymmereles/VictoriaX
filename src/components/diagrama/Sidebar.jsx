import { useDnD } from "./DnDContext";
import "./Sidebar.css";

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
                {type === "decision" && "?"}
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

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <h2>Elementos</h2>

            <p className="sidebar-description">
                Arrastrá un elemento al área de trabajo
            </p>

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