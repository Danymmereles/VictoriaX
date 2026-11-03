import "./ExecutionView.css";

/*
 * =====================================================
 * VISTA DE EJECUCIÓN
 * -----------------------------------------------------
 * Por ahora es un estado vacío. Acá se van a mostrar los
 * gráficos del comportamiento del algoritmo cuando se
 * defina la tecnología de visualización.
 *
 * El editor sigue montado debajo (oculto), así que el
 * diagrama y las variables no se pierden al venir acá.
 * =====================================================
 */

export default function ExecutionView({ onBack }) {
    return (
        <section className="execution-view">
            <div className="execution-empty">
                <div className="execution-empty-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                        <path d="M4 19 H20" />
                        <path d="M6 15 L10 10 L13 13 L18 6" />
                        <circle cx="18" cy="6" r="1.2" />
                    </svg>
                </div>

                <h2 className="execution-empty-title">
                    Ejecución del algoritmo
                </h2>

                <p className="execution-empty-text">
                    Acá vas a poder ver cómo se comporta tu algoritmo
                    al ejecutarse. Esta sección está en construcción.
                </p>

                <button
                    type="button"
                    className="execution-back"
                    onClick={onBack}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M15 6 L9 12 L15 18" />
                    </svg>
                    Volver al diagrama
                </button>
            </div>
        </section>
    );
}
