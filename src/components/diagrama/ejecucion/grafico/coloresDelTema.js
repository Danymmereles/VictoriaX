// ===========================================================================
// Colores del gráfico, leídos del tema actual (DiagramaTheme.css).
//
// uPlot dibuja en un canvas, y el canvas no entiende var(--...): hay que
// pasarle colores ya resueltos. coloresDelTema(elemento) lee las variables
// --dg-chart-* desde ese elemento (así respeta el modo claro u oscuro) y
// las convierte a rgb() con una sonda invisible.
// ===========================================================================

// Una variable por serie; si hay más series, los colores se repiten
export const VARIABLES_DE_SERIE = [
    "--dg-chart-1",
    "--dg-chart-2",
    "--dg-chart-3",
    "--dg-chart-4",
    "--dg-chart-5",
    "--dg-chart-6",
];

// Por si el tema no define alguna variable
const RESPALDO = {
    texto: "#6b7280",
    grilla: "rgba(128, 128, 128, 0.18)",
    series: ["#9a83ea", "#4fa3e0", "#ea9a3a", "#4fb36a", "#2fb3a3", "#e2779f"],
};

export function coloresDelTema(elemento) {
    const estilo = getComputedStyle(elemento);

    // Un elemento invisible para que el navegador resuelva cada color
    const sonda = document.createElement("span");
    sonda.style.display = "none";
    elemento.appendChild(sonda);

    const leer = (variable, respaldo) => {
        sonda.style.color = "";
        sonda.style.color = estilo.getPropertyValue(variable).trim() || respaldo;
        return getComputedStyle(sonda).color || respaldo;
    };

    const colores = {
        texto: leer("--dg-chart-text", RESPALDO.texto),
        grilla: leer("--dg-chart-grid", RESPALDO.grilla),
        series: VARIABLES_DE_SERIE.map((variable, i) => leer(variable, RESPALDO.series[i])),
        fuente: estilo.fontFamily || "sans-serif",
    };

    sonda.remove();

    return colores;
}
