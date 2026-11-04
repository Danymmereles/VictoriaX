import { MAIN_PAGE_ID, mensajeDuplicada } from "./pages";

import "./PageBar.css";

/*
 * =====================================================
 * BARRA DE PÁGINAS (parte inferior del lienzo)
 * -----------------------------------------------------
 * Main + una página por cada nodo "Preparación" de Main.
 * Las páginas no se crean a mano: aparecen y se
 * renombran junto con sus nodos de Main (ver pages.js).
 * =====================================================
 */

function SubprocessIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <polygon points="6,5 18,5 22,12 18,19 6,19 2,12" />
        </svg>
    );
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

export default function PageBar({ pages, activePage, onSelect }) {
    return (
        <nav className="page-bar" aria-label="Páginas del algoritmo">
            <div className="page-bar-tabs" role="tablist">
                {pages.map((pagina) => {
                    const active = pagina.id === activePage;
                    const esMain = pagina.id === MAIN_PAGE_ID;

                    const title = [
                        esMain
                            ? "Algoritmo principal"
                            : "Subproceso definido por un nodo Preparación de Main",
                        pagina.duplicada && mensajeDuplicada(pagina),
                    ]
                        .filter(Boolean)
                        .join("\n");

                    return (
                        <button
                            key={pagina.id}
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
                            {esMain ? <MainIcon /> : <SubprocessIcon />}

                            <span className="page-tab-name">{pagina.nombre}</span>

                            {pagina.duplicada && (
                                <span className="page-tab-warning" aria-hidden="true">
                                    !
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {pages.length === 1 && (
                <span className="page-bar-hint">
                    Cada nodo Preparación de Main crea su propia página
                </span>
            )}
        </nav>
    );
}
