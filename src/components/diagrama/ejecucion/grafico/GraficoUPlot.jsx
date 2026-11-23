import { useEffect, useRef, useState } from "react";
import uPlot from "uplot";

import "uplot/dist/uPlot.min.css";
import "./GraficoUPlot.css";

import { coloresDelTema } from "./coloresDelTema.js";
import { datosDelGrafico, opcionesDelGrafico } from "./opcionesDelGrafico.js";

/*
 * =====================================================
 * GRÁFICO uPlot (envoltorio para React)
 * -----------------------------------------------------
 * uPlot no es de React: se crea sobre un div y se maneja
 * a mano. Este componente:
 *   - lo crea al montarse y lo destruye al desmontarse;
 *   - lo vuelve a crear si cambian las series o el tema
 *     (claro / oscuro), porque cambian los colores;
 *   - si solo cambian los datos, usa setData (rápido);
 *   - ocupa todo su contenedor y sigue su tamaño
 *     (ResizeObserver), descontando la leyenda (que
 *     también se observa: cambia de alto al acomodarse).
 *
 * Props:
 *   series: [{ nombre }]            variables a graficar
 *   datos:  { t, series: [{ nombre, valores }] }
 *   ejeX:   nombre del eje horizontal ("T")
 * Ver opcionesDelGrafico.js para el formato.
 * =====================================================
 */

const SIN_DATOS = { t: [], series: [] };

export default function GraficoUPlot({ series = [], datos = SIN_DATOS, ejeX = "T" }) {
    const contenedor = useRef(null);
    const grafico = useRef(null);
    const tema = useTemaDelDocumento();

    // Los datos más recientes, para crear el gráfico ya con ellos
    const datosRef = useRef(datos);
    datosRef.current = datos;

    const nombres = series.map((s) => s.nombre).join("\u0000");

    // Crear (y volver a crear si cambian las series o el tema)
    useEffect(() => {
        const elemento = contenedor.current;
        if (!elemento) return undefined;

        const { width, height } = elemento.getBoundingClientRect();
        const opciones = opcionesDelGrafico({
            series,
            colores: coloresDelTema(elemento),
            ancho: width,
            alto: height,
            ejeX,
        });

        const u = new uPlot(opciones, datosDelGrafico(datosRef.current), elemento);
        grafico.current = u;
        ajustarTamaño(u, elemento);

        // Seguir el tamaño del contenedor y el de la leyenda
        let observador = null;
        if (typeof ResizeObserver !== "undefined") {
            observador = new ResizeObserver(() => ajustarTamaño(u, elemento));
            observador.observe(elemento);

            const leyenda = u.root.querySelector(".u-legend");
            if (leyenda) observador.observe(leyenda);
        }

        return () => {
            observador?.disconnect();
            u.destroy();
            grafico.current = null;
        };
        // series se compara por nombres (un array nuevo con los mismos
        // nombres no recrea el gráfico)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nombres, ejeX, tema]);

    // Datos nuevos: sin recrear
    useEffect(() => {
        grafico.current?.setData(datosDelGrafico(datos));
    }, [datos]);

    return <div ref={contenedor} className="grafico-uplot" />;
}


// El gráfico ocupa el contenedor; la leyenda (debajo) se descuenta del alto
function ajustarTamaño(u, elemento) {
    const { width, height } = elemento.getBoundingClientRect();
    const leyenda = u.root.querySelector(".u-legend");
    const alto = height - (leyenda?.offsetHeight ?? 0);

    const ancho = Math.floor(width);
    const nuevoAlto = Math.max(0, Math.floor(alto));

    if (u.width !== ancho || u.height !== nuevoAlto) {
        u.setSize({ width: ancho, height: nuevoAlto });
    }
}


// Cambia cada vez que se pasa de claro a oscuro (clase .dark en <html>)
function useTemaDelDocumento() {
    const [tema, setTema] = useState(() => temaActual());

    useEffect(() => {
        const observador = new MutationObserver(() => setTema(temaActual()));
        observador.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observador.disconnect();
    }, []);

    return tema;
}

const temaActual = () =>
    document.documentElement.classList.contains("dark") ? "oscuro" : "claro";
