import { useMemo, useState } from "react";

import { prepararEjecucion } from "@/lib/motor";

import PanelDeEjecucion from "./PanelDeEjecucion.jsx";
import GraficoDeEjecucion from "./grafico/GraficoDeEjecucion.jsx";

/*
 * =====================================================
 * EJECUCIÓN DE UN PROGRAMA LISTO
 * -----------------------------------------------------
 * A la izquierda, el gráfico de las variables marcadas
 * contra T; a la derecha, el panel (Ejecutar, variables
 * para graficar y Resultado).
 *
 * Al ejecutar, el motor registra TODAS las variables que
 * se pueden graficar (lib/motor/registro.js), así que
 * marcar o desmarcar cambia el gráfico sin volver a
 * ejecutar.
 *
 * Props:
 *   programa:    JSON del programa (ver armarPrograma.js)
 *   graficables: { tiempo, variables } (variablesParaGraficar.js)
 * =====================================================
 */

const SIN_VARIABLES = { tiempo: null, variables: [] };

export default function VistaDelPrograma({ programa, graficables = SIN_VARIABLES, onBack }) {
    const [resultado, setResultado] = useState(null);

    // Las de estado vienen marcadas
    const [marcadas, setMarcadas] = useState(
        () => new Set(graficables.variables.filter((v) => v.grupo === "estado").map((v) => v.nombre))
    );

    const ejecutar = () => {
        const registro = graficables.tiempo
            ? { tiempo: graficables.tiempo, variables: graficables.variables.map((v) => v.nombre) }
            : null;

        setResultado(prepararEjecucion(programa, { registro }).correr());
    };

    const marcar = (nombre) =>
        setMarcadas((actuales) => {
            const nuevas = new Set(actuales);
            if (nuevas.has(nombre)) nuevas.delete(nombre);
            else nuevas.add(nombre);
            return nuevas;
        });

    // Series marcadas, en el orden de la lista y con su color fijo
    const series = useMemo(
        () => graficables.variables
            .filter((v) => marcadas.has(v.nombre))
            .map(({ nombre, color }) => ({ nombre, color })),
        [graficables, marcadas]
    );

    const serie = resultado?.serie ?? null;

    const datos = useMemo(() => {
        if (!serie) return undefined;
        const nombres = new Set(series.map((s) => s.nombre));
        return { t: serie.t, series: serie.series.filter((s) => nombres.has(s.nombre)) };
    }, [serie, series]);

    const aviso = !graficables.tiempo
        ? "La tabla no tiene la variable T: no hay eje de tiempo para graficar."
        : !resultado
            ? "Marcá las variables a la derecha y tocá Ejecutar para ver cómo cambian a lo largo de T."
            : series.length === 0
                ? "Marcá al menos una variable para verla en el gráfico."
                : serie && serie.t.length === 0
                    ? "T no cambió en esta ejecución: no hay nada para graficar."
                    : null;

    return (
        <div className="execution-layout">
            <GraficoDeEjecucion
                series={aviso ? [] : series}
                datos={aviso ? undefined : datos}
                aviso={aviso}
                recortado={serie?.recortado}
            />
            <PanelDeEjecucion
                programa={programa}
                resultado={resultado}
                onEjecutar={ejecutar}
                graficables={graficables}
                marcadas={marcadas}
                onMarcar={marcar}
                onBack={onBack}
            />
        </div>
    );
}
