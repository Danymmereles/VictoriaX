// ===========================================================================
// Generación del diagrama a partir del Análisis Previo (20/11).
// Lógica pura: no toca el análisis ni React.
//
//   leerAnalisis → construir (Evento a Evento o Δt) → ubicar
//
// Genera:
//   - Main: Contexto, ciclo de la simulación y Fin;
//   - una página por variable de datos: ancla → generar el valor → Fin;
//   - las variables que faltan en la tabla de Main (T, TF, HV, tiempos de
//     los eventos...).
// Lo que el Análisis Previo todavía no tiene (encadenadores, cambios de
// estado, resultados, fdp) queda en nodos marcados para completar.
// ===========================================================================

import { METODOLOGIAS, validarAnalisis } from "@/lib/analisisPrevio";
import { MAIN_PAGE_ID, anchorIdDe } from "../pages.js";
import { fin, nodo, asignacion, secuencia } from "./bloques.js";
import { nuevaGenerada } from "./comun.js";
import { ORIGEN_GENERADA } from "../variables.js";
import { construirDeltaT } from "./deltaT.js";
import { construirEventoAEvento } from "./eventoAEvento.js";
import { VALOR_HV, VALOR_TF, eventosEaE, leerAnalisis } from "./lectura.js";
import { ubicar } from "./ubicar.js";

const sinGenerar = (motivo = null) => ({ generado: false, motivo });

// Página de una variable de datos: ancla → generar el valor → Fin
function paginaDeDato(pagina) {
    return secuencia(
        nodo("preparation", pagina.nombre, {
            id: anchorIdDe(pagina.id),
            anchorOf: pagina.id,
            deletable: false,
        }),
        asignacion(`${pagina.nombre} = RND()`, {
            pending: `Escribí cómo se genera ${pagina.nombre}. RND() da un valor al azar entre 0 y 1: reemplazalo por el algoritmo de su distribución (el Análisis Previo todavía no tiene la fdp).`,
        }),
        fin()
    );
}

// T, TF y HV, salvo que el análisis ya las tenga (pregunta PV4)
function variablesDeTiempo({ ocupado, reservar }) {
    return [
        ["T", "0", "Reloj de la simulación"],
        ["TF", VALOR_TF, "Tiempo final de la simulación"],
        ["HV", VALOR_HV, "Valor alto: tiempo de un evento que no está programado"],
    ]
        .filter(([nombre]) => !ocupado(nombre))
        .map(([nombre, valor, descripcion]) => {
            reservar(nombre);
            return nuevaGenerada(nombre, valor, descripcion);
        });
}

const contarPendientes = (paginas) =>
    paginas.reduce(
        (total, { nodes }) => total + nodes.filter((n) => n.data.pending).length,
        0
    );

/*
 *   analisis: el Análisis Previo guardado (puede ser null)
 *   paginas:  páginas del editor (derivarPaginas): Main + variables de datos
 *   edgeType: tipo de conector elegido
 *
 * Devuelve { generado: false, motivo } o
 *   { generado: true, main: { nodes, edges },
 *     paginas: { [pageId]: { nodes, edges, viewport: null } },
 *     variables: [...], pendientes, avisos: [...] }
 */
export function generarDiagrama(analisis, { paginas = [], edgeType = "default" } = {}) {
    if (!analisis?.metodologia) {
        return sinGenerar();
    }

    if (validarAnalisis(analisis).errores.length > 0) {
        return sinGenerar(
            "el Análisis Previo tiene errores. Corregilos y volvé a pasar a diagramar."
        );
    }

    const lectura = leerAnalisis(analisis);
    const tiempo = variablesDeTiempo(lectura);

    let construido;

    if (analisis.metodologia === METODOLOGIAS.EVENTO_A_EVENTO) {
        const eventos = eventosEaE(analisis, lectura.avisos);

        if (eventos.length === 0) {
            return sinGenerar("la tabla de eventos está vacía.");
        }

        construido = construirEventoAEvento({ eventos, lectura });
    } else if (analisis.metodologia === METODOLOGIAS.DELTA_T_CONSTANTE) {
        construido = construirDeltaT({ analisis, lectura });
    } else {
        return sinGenerar();
    }

    const main = ubicar(construido.bloque, { prefijo: MAIN_PAGE_ID, edgeType });

    const paginasDeDatos = {};
    paginas
        .filter((pagina) => pagina.id !== MAIN_PAGE_ID)
        .forEach((pagina) => {
            paginasDeDatos[pagina.id] = {
                ...ubicar(paginaDeDato(pagina), { prefijo: pagina.id, edgeType }),
                viewport: null,
            };
        });

    // Primero los tiempos de los eventos, después T, TF, HV y el resto
    const variables = [
        ...construido.variables.filter((v) => v.origen !== ORIGEN_GENERADA),
        ...tiempo,
        ...construido.variables.filter((v) => v.origen === ORIGEN_GENERADA),
    ];

    return {
        generado: true,
        main,
        paginas: paginasDeDatos,
        variables,
        pendientes: contarPendientes([main, ...Object.values(paginasDeDatos)]),
        avisos: lectura.avisos,
    };
}
