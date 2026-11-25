import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useDnD } from "./DnDContext";
import { FlowShape } from "./shapes";

import "./FuncionGeneradaMenu.css";

/*
 * =====================================================
 * FUNCIÓN GENERADA (barra lateral)
 * -----------------------------------------------------
 * El hexágono de la barra no se arrastra: un clic abre
 * un menú con sus tres tipos (fdp, Subrutina, Random),
 * igual que el botón Exportar. Lo que se arrastra al
 * lienzo es una opción del menú.
 *
 * El menú se dibuja encima de las figuras de abajo. Al
 * arrastrar, la imagen que acompaña al mouse es solo el
 * hexágono de esa opción (setDragImage), así nunca se
 * arrastran varias figuras.
 *
 *   item: elemento de sidebarItems.js con `opciones`
 *   previewSize: [ancho, alto] del hexágono de la barra
 * =====================================================
 */

const TAMANO_OPCION = [38, 28];

export default function FuncionGeneradaMenu({ item, previewSize }) {
    const [abierto, setAbierto] = useState(false);
    const [top, setTop] = useState(0);
    const [, setDragItemId] = useDnD();

    const botonRef = useRef(null);
    const menuRef = useRef(null);
    const previews = useRef({});

    // El menú se ubica justo debajo del botón, a lo ancho de la
    // grilla de figuras (ver .sidebar-items en Sidebar.css)
    useLayoutEffect(() => {
        if (abierto && botonRef.current) {
            const boton = botonRef.current;
            setTop(boton.offsetTop + boton.offsetHeight + 6);
        }
    }, [abierto]);

    // Cerrar con un clic afuera o con Escape
    useEffect(() => {
        if (!abierto) return undefined;

        const dentro = (target) =>
            botonRef.current?.contains(target) || menuRef.current?.contains(target);

        const alClic = (event) => {
            if (!dentro(event.target)) setAbierto(false);
        };
        const alTeclado = (event) => {
            if (event.key === "Escape") {
                setAbierto(false);
                botonRef.current?.focus();
            }
        };

        document.addEventListener("pointerdown", alClic);
        document.addEventListener("keydown", alTeclado);

        return () => {
            document.removeEventListener("pointerdown", alClic);
            document.removeEventListener("keydown", alTeclado);
        };
    }, [abierto]);

    const alEmpezarArrastre = (event, opcion) => {
        // Solo esta opción: no las figuras que quedan debajo del menú
        event.stopPropagation();

        setDragItemId(opcion.id);
        event.dataTransfer.effectAllowed = "move";
        // Firefox no empieza el arrastre sin datos
        event.dataTransfer.setData("text/plain", opcion.id);

        const preview = previews.current[opcion.id];
        if (preview && event.dataTransfer.setDragImage) {
            event.dataTransfer.setDragImage(
                preview,
                preview.offsetWidth / 2,
                preview.offsetHeight / 2
            );
        }
    };

    // Al soltar (o cancelar), el menú se cierra
    const alTerminarArrastre = () => setAbierto(false);

    const [ancho, alto] = previewSize;

    return (
        <>
            <button
                ref={botonRef}
                type="button"
                className={`sidebar-item sidebar-${item.id} fg-trigger`}
                onClick={() => setAbierto((valor) => !valor)}
                aria-haspopup="menu"
                aria-expanded={abierto}
                aria-label={`${item.label}: elegí fdp, Subrutina o Random`}
                title={`${item.label}: hacé clic para elegir fdp, Subrutina o Random`}
            >
                <span className="sidebar-preview">
                    <FlowShape type={item.type} width={ancho} height={alto} />
                </span>

                {/* Indica que abre un menú */}
                <svg className="fg-trigger__caret" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M3 4.5 L6 7.5 L9 4.5" />
                </svg>
            </button>

            {abierto && (
                <div
                    ref={menuRef}
                    className="fg-menu"
                    style={{ top }}
                    role="menu"
                    aria-label={item.label}
                >
                    <p className="fg-menu__title">{item.label}</p>

                    {item.opciones.map((opcion) => (
                        <div
                            key={opcion.id}
                            role="menuitem"
                            className={`fg-menu__option fg-${opcion.id}`}
                            draggable
                            onDragStart={(event) => alEmpezarArrastre(event, opcion)}
                            onDragEnd={alTerminarArrastre}
                            title={`${opcion.ayuda}\nArrastrala al lienzo.`}
                        >
                            <span
                                className="fg-menu__preview"
                                ref={(el) => {
                                    previews.current[opcion.id] = el;
                                }}
                            >
                                <FlowShape
                                    type={opcion.type}
                                    width={TAMANO_OPCION[0]}
                                    height={TAMANO_OPCION[1]}
                                />
                            </span>

                            <span className="fg-menu__text">
                                <span className="fg-menu__name">{opcion.label}</span>
                                <span className="fg-menu__detail">{opcion.detalle}</span>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
