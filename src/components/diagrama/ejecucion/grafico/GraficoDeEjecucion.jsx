import GraficoUPlot from "./GraficoUPlot.jsx";

/*
 * =====================================================
 * ESPACIO DEL GRÁFICO en la vista de Ejecución
 * -----------------------------------------------------
 * Tarjeta con el gráfico uPlot de las variables contra T.
 * Por ahora el motor no registra la evolución de las
 * variables, así que el gráfico se muestra vacío (con sus
 * ejes) y un aviso. Cuando la registre, alcanza con pasar:
 *   series: [{ nombre }]
 *   datos:  { t, series: [{ nombre, valores }] }
 * (ver opcionesDelGrafico.js).
 * =====================================================
 */

export default function GraficoDeEjecucion({ series = [], datos }) {
    const vacio = series.length === 0;

    return (
        <section className="execution-chart" aria-label="Gráfico de la ejecución">
            <header className="execution-chart__header">
                <h2 className="execution-chart__title">Variables en el tiempo</h2>
                {!vacio && (
                    <p className="execution-chart__hint">
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
                            <p>Acá se va a ver cómo cambia cada variable a lo largo de T.</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
