import GraficoUPlot from "./GraficoUPlot.jsx";

/*
 * =====================================================
 * ESPACIO DEL GRÁFICO en la vista de Ejecución
 * -----------------------------------------------------
 * Tarjeta con el gráfico uPlot de las variables marcadas
 * contra T (ver VistaDelPrograma.jsx):
 *   series:    [{ nombre, color }]
 *   datos:     { t, series: [{ nombre, valores }] }
 *   aviso:     texto en lugar del gráfico (sin ejecutar,
 *              sin variables marcadas…); se ven los ejes
 *   recortado: la ejecución pasó el tope de instantes
 * Formato: opcionesDelGrafico.js.
 * =====================================================
 */

export default function GraficoDeEjecucion({ series = [], datos, aviso = null, recortado = false }) {
    const vacio = Boolean(aviso) || series.length === 0;

    return (
        <section className="execution-chart" aria-label="Gráfico de la ejecución">
            <header className="execution-chart__header">
                <h2 className="execution-chart__title">Variables en el tiempo</h2>
                {!vacio && (
                    <p className="execution-chart__hint">
                        {recortado && "Se graficaron los primeros 2.000.000 de instantes · "}
                        Arrastrá para acercar · doble clic para volver
                    </p>
                )}
            </header>

            <div className="execution-chart__body">
                <GraficoUPlot series={series} datos={datos} ejeX="T" />

                {vacio && (
                    <div className="execution-chart__empty">
                        <div className="execution-chart__empty-card">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M4 19 H20" />
                                <path d="M6 15 L10 10 L13 13 L18 6" />
                            </svg>
                            <p>{aviso ?? "Acá se va a ver cómo cambia cada variable a lo largo de T."}</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
