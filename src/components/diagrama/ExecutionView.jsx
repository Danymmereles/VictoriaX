import BotonVolver from "./ejecucion/BotonVolver.jsx";
import PanelDeEjecucion from "./ejecucion/PanelDeEjecucion.jsx";
import GraficoDeEjecucion from "./ejecucion/grafico/GraficoDeEjecucion.jsx";

import "./ExecutionView.css";

/*
 * =====================================================
 * VISTA DE EJECUCIÓN
 * -----------------------------------------------------
 * Con el diagrama listo: a la izquierda, el gráfico de
 * las variables contra T (uPlot, ver ejecucion/grafico/);
 * a la derecha, el panel para ejecutar y el Resultado.
 *
 * El editor sigue montado debajo (oculto), así que el
 * diagrama y las variables no se pierden al venir acá.
 *
 * Antes de interpretar se revisa el diagrama (ver
 * ejecucion/revision.js). Si hay `errores`, se listan acá
 * y no se ejecuta; si no, `programa` está listo para el
 * motor (ver ejecucion/PanelDeEjecucion.jsx).
 * =====================================================
 */

export default function ExecutionView({ errores = [], programa = null, onBack }) {
    if (errores.length > 0) {
        return <ErroresDeRevision errores={errores} onBack={onBack} />;
    }

    if (programa) {
        return (
            <section className="execution-view execution-view--layout">
                <div className="execution-layout">
                    <GraficoDeEjecucion />
                    <PanelDeEjecucion programa={programa} onBack={onBack} />
                </div>
            </section>
        );
    }

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

                <BotonVolver onBack={onBack} />
            </div>
        </section>
    );
}


// El diagrama no se puede interpretar: qué corregir y dónde
function ErroresDeRevision({ errores, onBack }) {
    return (
        <section className="execution-view">
            <div className="execution-errors" role="alert">
                <div className="execution-empty-icon execution-errors-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 8 V13" />
                        <circle cx="12" cy="16.5" r="0.6" />
                        <path d="M10.3 3.9 L2.4 18 A2 2 0 0 0 4.1 21 H19.9 A2 2 0 0 0 21.6 18 L13.7 3.9 A2 2 0 0 0 10.3 3.9 Z" />
                    </svg>
                </div>

                <h2 className="execution-empty-title">
                    No se puede ejecutar
                </h2>

                <p className="execution-empty-text">
                    El diagrama no cumple con un algoritmo convencional.
                    Corregí {errores.length === 1 ? "este problema" : `estos ${errores.length} problemas`}
                    {" "}(los nodos están marcados en rojo en el diagrama):
                </p>

                <ul className="execution-errors-list">
                    {errores.map((error) => (
                        <li key={`${error.paginaId}-${error.nodoId}-${error.mensaje}`}>
                            <span className="execution-errors-page">{error.pagina}</span>
                            <span>{error.mensaje}</span>
                        </li>
                    ))}
                </ul>

                <BotonVolver onBack={onBack} />
            </div>
        </section>
    );
}
