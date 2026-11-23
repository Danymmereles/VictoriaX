import { useEffect, useRef, useState } from "react";

import { puedeElegirCarpeta } from "./guardarArchivo.js";

import "./ExportMenu.css";

const OPCIONES = [
    { formato: "png", nombre: "PNG", detalle: "Imagen", ayuda: "Imagen de la página que estás viendo" },
    { formato: "jpg", nombre: "JPG", detalle: "Imagen", ayuda: "Imagen de la página que estás viendo (más liviana)" },
    { formato: "json", nombre: "JSON", detalle: "Todo el diagrama", ayuda: "Todas las páginas, las variables y el tipo de flecha" },
];

// Cuánto queda visible el mensaje de resultado
const DURACION_MENSAJE = 3500;

/*
 * Botón "Exportar" de la barra lateral: abre un menú con PNG, JPG y
 * JSON. Cada opción pide dónde guardar el archivo.
 *   onExport(formato): hace la exportación (ver Diagrama.jsx). Devuelve
 *   el nombre del archivo guardado, o null si el usuario canceló.
 */
export default function ExportMenu({ onExport }) {
    const [abierto, setAbierto] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [trabajando, setTrabajando] = useState(false);
    const raiz = useRef(null);

    // Cerrar con un clic afuera o con Escape
    useEffect(() => {
        if (!abierto) return undefined;

        const alClic = (event) => {
            if (!raiz.current?.contains(event.target)) setAbierto(false);
        };
        const alTeclado = (event) => {
            if (event.key === "Escape") setAbierto(false);
        };

        document.addEventListener("pointerdown", alClic);
        document.addEventListener("keydown", alTeclado);

        return () => {
            document.removeEventListener("pointerdown", alClic);
            document.removeEventListener("keydown", alTeclado);
        };
    }, [abierto]);

    useEffect(() => {
        if (!mensaje) return undefined;
        const reloj = setTimeout(() => setMensaje(null), DURACION_MENSAJE);
        return () => clearTimeout(reloj);
    }, [mensaje]);

    // Se llama directo desde el clic: el diálogo "Guardar como" solo se
    // puede abrir durante un gesto del usuario
    const exportar = async (formato) => {
        setAbierto(false);
        setMensaje(null);
        setTrabajando(true);

        try {
            const archivo = await onExport(formato);
            if (archivo) {
                setMensaje({ tipo: "ok", texto: `Guardado: ${archivo}` });
            }
        } catch (error) {
            setMensaje({ tipo: "error", texto: error?.message || "No se pudo exportar." });
        } finally {
            setTrabajando(false);
        }
    };

    return (
        <div className="export-menu" ref={raiz}>
            {abierto && (
                <div className="export-menu__options" role="menu" aria-label="Formato">
                    {OPCIONES.map(({ formato, nombre, detalle, ayuda }) => (
                        <button
                            key={formato}
                            type="button"
                            role="menuitem"
                            className={`export-menu__option export-${formato}`}
                            title={ayuda}
                            onClick={() => exportar(formato)}
                        >
                            <span className="export-menu__format">{nombre}</span>
                            <span className="export-menu__detail">{detalle}</span>
                        </button>
                    ))}
                </div>
            )}

            <button
                type="button"
                className="export-menu__button"
                onClick={() => setAbierto((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={abierto}
                disabled={trabajando}
                aria-busy={trabajando}
                title={
                    puedeElegirCarpeta()
                        ? "Exportar: elegís el formato y dónde guardarlo"
                        : "Exportar: elegís el formato (se descarga)"
                }
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 4 V15" />
                    <path d="M7 10 L12 15 L17 10" />
                    <path d="M5 19 H19" />
                </svg>
                {/* Mientras exporta, el botón queda desactivado */}
                <span>Exportar</span>
            </button>

            {mensaje && (
                <p className={`export-menu__message is-${mensaje.tipo}`} role="status">
                    {mensaje.texto}
                </p>
            )}
        </div>
    );
}
