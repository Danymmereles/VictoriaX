// ===========================================================================
// Opciones y datos de uPlot para la vista de Ejecución. Lógica pura.
//
// Formato de los datos (pensado para el motor, columnas en lugar de
// filas, así millones de puntos no ocupan millones de objetos):
//   {
//     t:      Float64Array | number[]   valores de T (eje horizontal)
//     series: [{ nombre, valores }]     una por variable, mismo largo que t
//   }
// datosDelGrafico() lo pasa al formato de uPlot: [t, valores1, valores2…].
//
// uPlot ya está pensado para muchos puntos: dibuja en canvas y, en cada
// píxel, solo el mínimo y el máximo de lo que cae ahí.
// ===========================================================================

// Números como en la BNF: coma decimal
const NUMERO = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 4 });

export const formatearNumero = (valor) =>
    valor == null || Number.isNaN(valor) ? "–" : NUMERO.format(valor);

// Sin datos todavía, los ejes muestran este rango (así se ve el gráfico vacío)
const RANGO_VACIO = [0, 1];

const rango = (_u, minimo, maximo) =>
    minimo == null || maximo == null ? RANGO_VACIO : [minimo, maximo];

export function datosDelGrafico({ t = [], series = [] } = {}) {
    return [t, ...series.map((serie) => serie.valores)];
}

function eje(colores, etiqueta) {
    return {
        label: etiqueta,
        stroke: colores.texto,
        font: `11px ${colores.fuente}`,
        labelFont: `600 11px ${colores.fuente}`,
        grid: { stroke: colores.grilla, width: 1 },
        ticks: { stroke: colores.grilla, width: 1, size: 4 },
        values: (_u, valores) => valores.map(formatearNumero),
    };
}

/*
 * opcionesDelGrafico({ series, colores, ancho, alto, ejeX, trazo })
 *   series:  [{ nombre, color? }]  las variables que se grafican (sin T);
 *            color: índice fijo en la paleta (si no, el orden)
 *   colores: de coloresDelTema()
 *   ejeX:    nombre del eje horizontal (por defecto "T")
 *   trazo:   cómo se unen los puntos (p. ej. uPlot.paths.stepped:
 *            escalones, cada valor se mantiene hasta el siguiente T)
 * Zoom: arrastrar sobre el gráfico (solo en horizontal); doble clic vuelve.
 */
export function opcionesDelGrafico({ series = [], colores, ancho, alto, ejeX = "T", trazo }) {
    return {
        width: Math.max(0, Math.floor(ancho)),
        height: Math.max(0, Math.floor(alto)),

        scales: {
            x: { time: false, range: rango },
            y: { range: rango },
        },

        // El eje horizontal, más compacto (números + nombre del eje)
        axes: [{ ...eje(colores, ejeX), size: 34, labelSize: 18, labelGap: 0 }, eje(colores)],

        series: [
            { label: ejeX, value: (_u, valor) => formatearNumero(valor) },
            ...series.map((serie, i) => ({
                label: serie.nombre,
                stroke: colores.series[(serie.color ?? i) % colores.series.length],
                width: 1.5,
                ...(trazo && { paths: trazo }),
                points: { show: false },
                value: (_u, valor) => formatearNumero(valor),
            })),
        ],

        legend: { show: series.length > 0 },

        cursor: {
            drag: { x: true, y: false },
            points: { size: 7 },
        },
    };
}
