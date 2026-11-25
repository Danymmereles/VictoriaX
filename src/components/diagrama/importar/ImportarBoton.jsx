import { useEffect, useRef, useState } from "react";

import "./ImportarBoton.css";

// Cuánto queda visible el mensaje de resultado
const DURACION_MENSAJE = 5000;

/*
 * Botón "Importar" de la barra lateral: elige un .json exportado
 * con Exportar → JSON y carga ese diagrama.
 *   onImport(texto, nombreDelArchivo) → { importado, error, avisos }
 *     importado: false si el usuario no confirmó (no se muestra nada)
 * Ver importar/leerDiagrama.js y Diagrama.jsx.
 */
export default function ImportarBoton({ onImport }) {
    const entrada = useRef(null);
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        if (!mensaje) return undefined;
        const reloj = setTimeout(() => setMensaje(null), DURACION_MENSAJE);
        return () => clearTimeout(reloj);
    }, [mensaje]);

    const alElegir = async (event) => {
        const archivo = event.target.files?.[0];
        // Permite volver a elegir el mismo archivo
        event.target.value = "";

        if (!archivo) return;

        setMensaje(null);

        try {
            const resultado = await onImport(await archivo.text(), archivo.name);

            if (resultado.error) {
                setMensaje({ tipo: "error", texto: resultado.error });
            } else if (resultado.importado) {
                const avisos = resultado.avisos ?? [];
                setMensaje({
                    tipo: avisos.length ? "aviso" : "ok",
                    texto: `Importado: ${archivo.name}`,
                    avisos,
                });
            }
        } catch {
            setMensaje({ tipo: "error", texto: "No se pudo leer el archivo." });
        }
    };

    return (
        <>
            <button
                type="button"
                className="importar__button"
                onClick={() => entrada.current?.click()}
                title="Importar: abrí un diagrama guardado (.json, de Exportar → JSON)"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 15 V4" />
                    <path d="M7 9 L12 4 L17 9" />
                    <path d="M5 19 H19" />
                </svg>
                <span>Importar</span>
            </button>

            <input
                ref={entrada}
                type="file"
                accept=".json,application/json"
                className="importar__input"
                onChange={alElegir}
                tabIndex={-1}
                aria-hidden="true"
            />

            {mensaje && (
                <div className={`importar__message is-${mensaje.tipo}`} role="status">
                    <p>{mensaje.texto}</p>
                    {mensaje.avisos?.map((a) => (
                        <p key={a} className="importar__aviso">{a}</p>
                    ))}
                </div>
            )}
        </>
    );
}
