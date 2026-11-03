import { Link } from "react-router-dom";

/*
 * Vuelve al Análisis Previo para rearmar el diagrama con
 * un análisis nuevo.
 *
 * El diagrama todavía no se guarda, así que si ya hay algo
 * dibujado se pide confirmación antes de salir.
 */
const ANALISIS_PREVIO_PATH = "/modo-libre";

export default function BackToAnalysisLink({ hasDiagram = false }) {
    const confirmLeave = (event) => {
        if (
            hasDiagram &&
            !window.confirm(
                "¿Volver al Análisis Previo? Se va a perder el diagrama actual."
            )
        ) {
            event.preventDefault();
        }
    };

    return (
        <Link
            to={ANALISIS_PREVIO_PATH}
            className="sidebar-back"
            onClick={confirmLeave}
            title="Volver al Análisis Previo"
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 12 H5" />
                <path d="M11 6 L5 12 L11 18" />
            </svg>

            <span>Análisis previo</span>
        </Link>
    );
}
