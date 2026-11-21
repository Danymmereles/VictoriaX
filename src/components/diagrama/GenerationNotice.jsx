import { useState } from "react";

import "./GenerationNotice.css";

/*
 * Aviso al entrar al diagrama: qué se generó desde el Análisis
 * Previo y qué quedó para completar. Se cierra con la ×.
 *   generacion: resultado de generarDiagrama (ver generacion/)
 */
export default function GenerationNotice({ generacion, onClose }) {
    const [verAvisos, setVerAvisos] = useState(false);

    if (!generacion?.generado && !generacion?.motivo) {
        return null;
    }

    const avisos = generacion.avisos ?? [];
    const pendientes = generacion.pendientes ?? 0;

    return (
        <div className="generation-notice" role="status">
            <div className="generation-notice__row">
                <p className="generation-notice__text">
                    {generacion.generado ? (
                        <>
                            Diagrama generado desde el Análisis Previo.
                            {pendientes > 0 && (
                                <>
                                    {" "}
                                    <span className="generation-notice__pending">
                                        {pendientes === 1
                                            ? "1 nodo para completar"
                                            : `${pendientes} nodos para completar`}
                                    </span>
                                    , marcados en rojo: pasá el mouse para ver qué falta.
                                </>
                            )}
                        </>
                    ) : (
                        <>No se generó el diagrama: {generacion.motivo}</>
                    )}
                </p>

                {avisos.length > 0 && (
                    <button
                        type="button"
                        className="generation-notice__toggle"
                        onClick={() => setVerAvisos((v) => !v)}
                        aria-expanded={verAvisos}
                    >
                        {verAvisos ? "Ocultar avisos" : `Avisos (${avisos.length})`}
                    </button>
                )}

                <button
                    type="button"
                    className="generation-notice__close"
                    onClick={onClose}
                    aria-label="Cerrar aviso"
                    title="Cerrar"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M7 7 L17 17" />
                        <path d="M17 7 L7 17" />
                    </svg>
                </button>
            </div>

            {verAvisos && (
                <ul className="generation-notice__list">
                    {avisos.map((aviso) => (
                        <li key={aviso}>{aviso}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
