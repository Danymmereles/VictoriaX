import { useState } from "react";

import { formatear, prepararEjecucion } from "@/lib/motor";

import BotonVolver from "./BotonVolver.jsx";
import { elegirDestino, guardarEn, nombreDeArchivo } from "../exportar/guardarArchivo.js";
import { jsonComoBlob } from "../exportar/json.js";

/*
 * =====================================================
 * PANEL DE EJECUCIÓN (provisorio)
 * -----------------------------------------------------
 * El diagrama pasó la revisión y ya es un programa
 * (ver ejecucion/armarPrograma.js y lib/motor). Por
 * ahora se puede:
 *   - ejecutarlo completo y ver lo que mostró cada
 *     Resultado, o el error con su página, nodo y línea;
 *   - descargar el programa (JSON) para revisarlo.
 * Los gráficos se suman cuando se defina cómo mostrar
 * la ejecución.
 * =====================================================
 */

// Máximo de líneas de Resultado que se muestran (las últimas)
const MAX_SALIDAS = 30;

// Para leer: hasta 4 decimales (el valor real no cambia)
const mostrar = (valor) =>
    typeof valor === "number" ? formatear(Number(valor.toFixed(4))) : formatear(valor);

export default function PanelDeEjecucion({ programa, onBack }) {
    const [resultado, setResultado] = useState(null);
    const [aviso, setAviso] = useState("");

    const paginas = programa.paginas.length;
    const nodos = programa.paginas.reduce((total, p) => total + p.nodos.length, 0);

    const ejecutar = () => {
        setResultado(prepararEjecucion(programa).correr());
    };

    const descargar = async () => {
        const destino = await elegirDestino(nombreDeArchivo("programa", "json"), "json");
        if (!destino) return;
        await guardarEn(destino, jsonComoBlob(programa));
        setAviso(`Guardado: ${destino.nombre}`);
    };

    return (
        <div className="execution-panel">
            <h2 className="execution-empty-title">Listo para ejecutar</h2>

            <p className="execution-empty-text">
                El diagrama pasó la revisión: {paginas} {paginas === 1 ? "página" : "páginas"},
                {" "}{nodos} {nodos === 1 ? "nodo" : "nodos"}.
            </p>

            <div className="execution-actions">
                <button type="button" className="execution-run" onClick={ejecutar}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8 5.5 V18.5 L18.5 12 Z" />
                    </svg>
                    {resultado ? "Ejecutar de nuevo" : "Ejecutar"}
                </button>

                <button type="button" className="execution-back" onClick={descargar}>
                    Descargar programa (JSON)
                </button>
            </div>

            {aviso && <p className="execution-note">{aviso}</p>}

            {resultado && <Resultado resultado={resultado} />}

            <BotonVolver onBack={onBack} />
        </div>
    );
}


function Resultado({ resultado }) {
    const { estado, pasos, semilla, salidas, error } = resultado;
    const ultimas = salidas.slice(-MAX_SALIDAS);

    const titulo = {
        terminada: `Terminó en ${pasos.toLocaleString("es-AR")} pasos`,
        error: "Se detuvo por un error",
        limite: "Se detuvo: límite de pasos",
    }[estado];

    return (
        <div className="execution-result" aria-live="polite">
            <p className={`execution-result-title is-${estado}`}>
                {titulo}
                <span className="execution-seed" title="Con la misma semilla, los Random dan los mismos números">
                    Semilla {semilla}
                </span>
            </p>

            {error && (
                <div className="execution-error">
                    <span className="execution-errors-page">
                        {error.pagina}
                        {error.linea ? ` · línea ${error.linea}` : ""}
                        {error.texto ? ` · ${error.texto.split("\n")[(error.linea ?? 1) - 1] ?? error.texto}` : ""}
                    </span>
                    <span>{error.mensaje}</span>
                </div>
            )}

            {salidas.length > 0 ? (
                <>
                    <p className="execution-result-subtitle">
                        Resultado
                        {salidas.length > MAX_SALIDAS && ` (últimas ${MAX_SALIDAS} de ${salidas.length})`}
                    </p>
                    <ol className="execution-outputs">
                        {ultimas.map((salida, i) => (
                            <li key={`${salida.paso}-${i}`}>
                                {salida.valores.map(({ nombre, valor }) => (
                                    <span key={nombre}>
                                        {nombre} = <strong>{mostrar(valor)}</strong>
                                    </span>
                                ))}
                            </li>
                        ))}
                    </ol>
                </>
            ) : (
                !error && <p className="execution-note">Ningún nodo Resultado mostró valores.</p>
            )}
        </div>
    );
}
