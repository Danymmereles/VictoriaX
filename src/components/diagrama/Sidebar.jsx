import "./Sidebar.css";
import { useDnD } from "./DnDContext.jsx";

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
        >
            <div className={`sidebar-preview preview-${type}`}>
                {type === "decision" && "?"}
            </div>

            <span>{label}</span>
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

                <SidebarItem
                    type="input"
                    label="Entrada"
                />

                <SidebarItem
                    type="process"
                    label="Proceso"
                />

                <SidebarItem
                    type="decision"
                    label="Decisión"
                />

                <SidebarItem
                    type="output"
                    label="Salida"
                />

            </div>

        </aside>
    );
}