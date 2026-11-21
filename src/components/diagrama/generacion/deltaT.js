// ===========================================================================
// Main para la metodología Δt constante. Adapta el esqueleto de Victoria
// (2017), comparando T >= TEF en vez de T == TEF (corrige GV6):
//
//   Contexto
//   (1) → T = T + DT
//       → por cada comprometido anterior C:  T >= TPC ?  SÍ: C → TPC = HV
//       → por cada evento propio P:          P
//       → por cada comprometido posterior Q: ¿ocurre Q? SÍ: Q → programar C
//   → T > TF ?  SÍ: resultados → Fin   NO: (1)
//
// El análisis no tiene las condiciones de los posteriores ni qué hace cada
// evento: esos nodos quedan para completar. Cada posterior compromete al
// anterior de la misma posición (Emisión → Llegada).
// ===========================================================================

import { VALOR_HV, eventosDeltaT } from "./lectura.js";
import { completar, conLlegada, nodo, proceso, secuencia, si } from "./bloques.js";
import {
    ETIQUETA_CICLO,
    actualizarEstado,
    cierre,
    contexto,
    nuevaGenerada,
    nuevoTiempoDeEvento,
    programar,
} from "./comun.js";

export function construirDeltaT({ analisis, lectura }) {
    const { nombres, ocupado, reservar, tefDe, avisos } = lectura;
    const variables = [];

    const { propios, anteriores, posteriores } = eventosDeltaT(analisis);

    // Δt: si el análisis ya tiene una variable DT (p. ej. de control), se usa
    const DT = "DT";
    if (!ocupado(DT)) {
        reservar(DT);
        variables.push(nuevaGenerada(DT, "1", "Intervalo de tiempo constante (Δt)"));
    }

    const comprometidos = anteriores.map((nombre) => ({ nombre, tef: tefDe(nombre) }));

    const pasos = [proceso(`T = T + ${DT}`)];

    comprometidos.forEach((c) => {
        pasos.push(
            si(
                `T >= ${c.tef}`,
                secuencia(actualizarEstado(c.nombre, nombres.estado), proceso(`${c.tef} = HV`))
            )
        );
    });

    propios.forEach((p) => {
        pasos.push(
            completar(
                "process",
                `Evento ${p.nombre}`,
                `Completá qué pasa en cada Δt con el evento propio "${p.nombre}": por ejemplo, llamar a su variable de datos y actualizar el estado.`
            )
        );
    });

    posteriores.forEach((q, k) => {
        const comprometido = comprometidos[k];

        pasos.push(
            si(
                nodo("decision", "", {
                    hint: `¿${q}?`,
                    pending: `Escribí la condición para que ocurra "${q}". En Δt el Análisis Previo no tiene condiciones.`,
                }).spec,
                secuencia(
                    actualizarEstado(q, nombres.estado),
                    comprometido &&
                        programar({ evento: comprometido.nombre, tiempo: comprometido.tef })
                )
            )
        );
    });

    if (propios.some((p) => p.esVector)) {
        avisos.push("Δt: los eventos propios vector se generaron como un solo evento.");
    }

    if (posteriores.length && comprometidos.length) {
        avisos.push(
            `Δt: cada comprometido posterior programa al anterior de la misma posición (${posteriores
                .map((q, k) => `${q} → ${comprometidos[k]?.nombre ?? "?"}`)
                .join(", ")}).`
        );
    }

    const bloque = secuencia(
        contexto(),
        conLlegada(ETIQUETA_CICLO, secuencia(pasos)),
        cierre(nombres.resultado)
    );

    // Los comprometidos arrancan sin programar
    const tiempos = comprometidos.map((c) =>
        nuevoTiempoDeEvento(c.tef, VALOR_HV, c.nombre)
    );

    return { bloque, variables: [...tiempos, ...variables] };
}
