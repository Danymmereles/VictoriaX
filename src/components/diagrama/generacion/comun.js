// ===========================================================================
// Piezas que comparten Evento a Evento y Δt: inicio y cierre de Main,
// programación de un evento futuro y variables generadas.
// ===========================================================================

import { CONTEXT_NODE_ID } from "../pages.js";
import { nuevaVariable, ORIGEN_FUTURO, ORIGEN_GENERADA } from "../variables.js";
import { completar, fin, nodo, asignacion, salto, secuencia, si } from "./bloques.js";

// Etiquetas de los Conectores generados. Son identificadores (BNF v0.14):
// C1 vuelve al principio del ciclo de Main; C2, C3... son los ciclos de
// búsqueda del menor de cada evento vector.
export const etiquetaConector = (n) => `C${n}`;
export const ETIQUETA_CICLO = etiquetaConector(1);

export const contexto = () =>
    nodo("context", "", { id: CONTEXT_NODE_ID, deletable: false, draggable: false });

const lista = (nombres) => (nombres.length ? ` (${nombres.join(", ")})` : "");

/*
 * Programar el evento futuro con tiempo `tiempo` (TPLL, TPS[I]...).
 * El Análisis Previo no dice qué variable da el intervalo (encadenador),
 * así que la llamada y el intervalo quedan para completar.
 *   indicePendiente: el evento es vector y no se sabe en qué posición
 */
export function programar({ evento, tiempo, indicePendiente = false }) {
    return [
        completar(
            "preparation",
            `Intervalo de ${evento}`,
            `Elegí la variable de datos que da el intervalo hasta el próximo evento "${evento}". El Análisis Previo todavía no indica qué variable usa cada evento (encadenador).`
        ),
        asignacion(`${tiempo} = T + ?`, {
            pending: indicePendiente
                ? `Reemplazá los ? por el intervalo de "${evento}" (la variable que se llama arriba) y por la posición a programar (p. ej., un puesto libre).`
                : `Reemplazá ? por el intervalo de "${evento}": la variable que se llama arriba.`,
        }),
    ];
}

export const actualizarEstado = (evento, estado) =>
    completar(
        "process",
        "Actualizar estado",
        `Actualizá las variables de estado${lista(estado)} por el evento "${evento}", y las sumatorias que hagan falta para los resultados. El Análisis Previo no dice cómo cambian.`
    );

/*
 * Cierre del ciclo de Main: si terminó el tiempo, calcular los resultados
 * (Asignación), mostrarlos (Resultado) y terminar; si no, volver al
 * principio con el Conector del ciclo.
 * El Resultado queda vacío, con su nombre como ayuda: falta definir su
 * sintaxis (BNF, D21).
 */
export const cierre = (resultado) =>
    si(
        "T > TF",
        secuencia(
            completar(
                "process",
                "Calcular resultados",
                `Calculá las variables de resultado${lista(resultado)} antes de terminar. El Análisis Previo no dice cómo se calculan.`
            ),
            // Resultado: muestra las variables de resultado (A, B, C)
            nodo("document", resultado.join(", ")),
            fin()
        ),
        salto(ETIQUETA_CICLO)
    );


// ---------------------------------------------------------------------------
// Variables nuevas para la tabla de Main. Las que el análisis ya tiene no
// se repiten (se usan con su nombre).
// ---------------------------------------------------------------------------

export function nuevaGenerada(nombre, valorInicial, descripcion, extra = {}) {
    return nuevaVariable(`generada_${nombre}`, {
        nombre,
        valorInicial,
        origen: ORIGEN_GENERADA,
        descripcion,
        ...extra,
    });
}

export function nuevoTiempoDeEvento(nombre, valorInicial, evento, extra = {}) {
    return nuevaVariable(`futuro_${nombre}`, {
        nombre,
        valorInicial,
        origen: ORIGEN_FUTURO,
        descripcion: `Tiempo del próximo evento "${evento}"`,
        esVector: false,
        dimension: null,
        ...extra,
    });
}