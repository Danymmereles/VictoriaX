/*
 * =====================================================
 * VARIABLES PARA GRAFICAR (panel de ejecución)
 * -----------------------------------------------------
 * Dos grupos: Estado y Auxiliares (ver
 * variablesParaGraficar.js). Cada variable con su color
 * en el gráfico. Marcar o desmarcar no vuelve a ejecutar:
 * la ejecución registra todas.
 * =====================================================
 */

const GRUPOS = [
    { id: "estado", titulo: "Estado", vacio: "El Análisis Previo no tiene variables de estado." },
    { id: "auxiliar", titulo: "Auxiliares", vacio: "No hay variables creadas en el diagrama." },
];

const colorDe = (indice) => `var(--dg-chart-${(indice % 6) + 1})`;

export default function SelectorDeVariables({ graficables, marcadas, onMarcar }) {
    if (!graficables.tiempo) {
        return (
            <section className="execution-vars" aria-label="Variables para graficar">
                <h3 className="execution-vars__title">Variables para graficar</h3>
                <p className="execution-vars__empty">
                    La tabla no tiene la variable T: sin ella no hay eje de tiempo para graficar.
                </p>
            </section>
        );
    }

    return (
        <section className="execution-vars" aria-label="Variables para graficar">
            <h3 className="execution-vars__title">Variables para graficar</h3>

            {GRUPOS.map((grupo) => {
                const lista = graficables.variables.filter((v) => v.grupo === grupo.id);

                return (
                    <div key={grupo.id} className="execution-vars__group">
                        <p className="execution-vars__group-title">{grupo.titulo}</p>

                        {lista.length === 0 ? (
                            <p className="execution-vars__empty">{grupo.vacio}</p>
                        ) : (
                            <ul className="execution-vars__list">
                                {lista.map((variable) => (
                                    <li key={variable.nombre}>
                                        <label
                                            className="execution-vars__item"
                                            title={variable.dePara ? "Variable de un Para de Main" : undefined}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={marcadas.has(variable.nombre)}
                                                onChange={() => onMarcar(variable.nombre)}
                                            />
                                            <span
                                                className="execution-vars__color"
                                                style={{ background: colorDe(variable.color) }}
                                                aria-hidden="true"
                                            />
                                            <span className="execution-vars__name">{variable.nombre}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                );
            })}
        </section>
    );
}
