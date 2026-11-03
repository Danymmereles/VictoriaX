import { useHistory } from "./HistoryContext";

/*
 * Botones Deshacer / Rehacer de la barra lateral.
 */
export default function HistoryControls() {
    const { undo, redo, canUndo, canRedo } = useHistory();

    return (
        <div
            className="sidebar-toolbar sidebar-toolbar--2"
            role="group"
            aria-label="Historial"
        >
            <button
                type="button"
                className="sidebar-tool"
                onClick={undo}
                disabled={!canUndo}
                aria-label="Deshacer"
                title="Deshacer (Ctrl+Z)"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 14 L4 9 L9 4" />
                    <path d="M4 9 H14.5 A5.5 5.5 0 0 1 14.5 20 H11" />
                </svg>
            </button>

            <button
                type="button"
                className="sidebar-tool"
                onClick={redo}
                disabled={!canRedo}
                aria-label="Rehacer"
                title="Rehacer (Ctrl+Y)"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 14 L20 9 L15 4" />
                    <path d="M20 9 H9.5 A5.5 5.5 0 0 0 9.5 20 H13" />
                </svg>
            </button>
        </div>
    );
}
