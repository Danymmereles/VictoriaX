import { MAIN_PAGE_ID, mensajeDuplicada } from "./pages";

import "./PageBar.css";

/*
 * =====================================================
 * BARRA DE PÁGINAS (parte inferior del lienzo)
 * -----------------------------------------------------
 * Main + una página por cada variable de datos del
 * Análisis Previo (funciones de probabilidad), donde se
 * define su algoritmo, y una por cada subrutina (22/11).
 * Ver pages.js.
 *
 * Una subrutina que ya ningún nodo llama queda "sin uso"
 * (atenuada) con una × para borrar su pestaña: onDelete.
 * =====================================================
 */

// Hexágono con el color de su tipo (fdp naranja, Subrutina celeste)
function FunctionIcon({ tipo }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={`page-tab-icon--${tipo}`}>
            <polygon points="6,5 18,5 22,12 18,19 6,19 2,12" />
        </svg>
    );
}

function tituloDe(pagina) {
    if (pagina.tipo === "main") {
        return "Algoritmo principal";
    }

    if (pagina.tipo === "subrutina") {
        return pagina.sinUso
            ? `Subrutina ${pagina.firma}: ningún nodo la llama. Podés borrar la pestaña con la ×.`
            : `Subrutina ${pagina.firma}`;
    }

    return `Variable de datos (función de probabilidad)${pagina.descripcion ? `: ${pagina.descripcion}` : ""}`;
}

function MainIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="9" height="6" rx="1.5" />
            <rect x="12" y="15" width="9" height="6" rx="1.5" />
            <path d="M7.5 9 V18 H12" />
        </svg>
    );
}

export default function PageBar({ pages, activePage, onSelect, onDelete }) {
    return (
        <nav className="page-bar" aria-label="Páginas del algoritmo">
            <div className="page-bar-tabs" role="tablist">
                {pages.map((pagina) => {
                    const active = pagina.id === activePage;
                    const esMain = pagina.id === MAIN_PAGE_ID;

                    const borrable = pagina.sinUso && Boolean(onDelete);

                    const title = [
                        tituloDe(pagina),
                        pagina.duplicada && mensajeDuplicada(pagina),
                    ]
                        .filter(Boolean)
                        .join("\n");

                    return (
                        <div
                            key={pagina.id}
                            className={[
                                "page-tab-group",
                                pagina.sinUso && "is-unused",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={active}
                                aria-invalid={pagina.duplicada || undefined}
                                title={title}
                                className={[
                                    "page-tab",
                                    active && "is-active",
                                    pagina.duplicada && "is-duplicated",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                onClick={() => onSelect(pagina.id)}
                            >
                                {esMain ? <MainIcon /> : <FunctionIcon tipo={pagina.tipo} />}

                                <span className="page-tab-name">{pagina.firma ?? pagina.nombre}</span>

                                {pagina.duplicada && (
                                    <span className="page-tab-warning" aria-hidden="true">
                                        !
                                    </span>
                                )}
                            </button>

                            {borrable && (
                                <button
                                    type="button"
                                    className="page-tab-delete"
                                    onClick={() => onDelete(pagina.id)}
                                    aria-label={`Borrar la pestaña ${pagina.firma}`}
                                    title={`Borrar la pestaña ${pagina.firma} (sin uso)`}
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M7 7 L17 17" />
                                        <path d="M17 7 L7 17" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {pages.length === 1 && (
                <span className="page-bar-hint">
                    Las variables de datos del Análisis Previo y las subrutinas aparecen acá, cada una con su página
                </span>
            )}
        </nav>
    );
}
