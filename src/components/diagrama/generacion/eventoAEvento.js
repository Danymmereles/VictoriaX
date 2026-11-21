// ===========================================================================
// Main para la metodología Evento a Evento. Adapta las reglas del generador
// de Victoria (2017), con estas correcciones (ver generacion-ap-diagrama.md):
//   - un evento que no se reprograma deja su tiempo en HV (GV2);
//   - el tiempo inicial se decide por la estructura, no por el nombre (GV4);
//   - con 4 eventos o más, búsqueda lineal del menor en vez del árbol
//     exponencial (GV5);
//   - lo que el análisis no tiene queda en nodos para completar (GV3).
//
//   Contexto
//   (1) → [búsqueda del menor de cada evento vector]
//       → selección del próximo evento → rama de cada evento
//   → T > TF ?  SÍ: resultados → Fin   NO: (1)
// ===========================================================================

import { VALOR_HV } from "./lectura.js";
import {
    conLlegada,
    nodo,
    proceso,
    salto,
    secuencia,
    seleccion3,
    si,
} from "./bloques.js";
import {
    ETIQUETA_CICLO,
    actualizarEstado,
    cierre,
    contexto,
    nuevaGenerada,
    nuevoTiempoDeEvento,
    programar,
} from "./comun.js";

const clave = (texto) => String(texto ?? "").trim().toUpperCase();

const decision = (condicion, extra) => nodo("decision", condicion, extra).spec;

/*
 *   eventos:  ver eventosEaE (lectura.js)
 *   lectura:  ver leerAnalisis
 * Devuelve { bloque, variables }
 */
export function construirEventoAEvento({ eventos, lectura }) {
    const { nombres, libre, tefDe, avisos } = lectura;
    const variables = [];

    // ---- Modelo: tiempo de cada evento e índice si es vector ----
    const modelo = eventos.map((e) => ({ ...e, tef: tefDe(e.nombre) }));
    const porNombre = new Map(modelo.map((e) => [clave(e.nombre), e]));
    const buscar = (nombre) => porNombre.get(clave(nombre));

    const vectores = modelo.filter((e) => e.esVector);
    const contador = vectores.length ? libre(["H"]) : null;

    vectores.forEach((e) => {
        e.indice = libre(["I", "J", "K", "L", "M"]);
    });

    modelo.forEach((e) => {
        e.ref = e.esVector ? `${e.tef}[${e.indice}]` : e.tef;
        e.seProgramaSolo = Boolean(e.efnc) && buscar(e.efnc) === e;
        e.seReprograma = [e.efnc, e.efc].some((n) => n && buscar(n) === e);
    });


    // ---- Rama de un evento ----
    const programarEvento = (nombre, origen) => {
        const destino = buscar(nombre);
        const mismo = destino === origen;

        return programar({
            evento: destino.nombre,
            tiempo: destino.esVector
                ? mismo
                    ? destino.ref
                    : `${destino.tef}[?]`
                : destino.tef,
            indicePendiente: destino.esVector && !mismo,
        });
    };

    const rama = (e) => {
        // Avanzar el tiempo. Si el evento no se vuelve a programar,
        // su tiempo pasa a HV para que no se repita (corrige GV2).
        const pasos = [
            proceso(e.seReprograma ? `T = ${e.ref}` : [`T = ${e.ref}`, `${e.ref} = HV`]),
        ];

        if (e.efnc) {
            pasos.push(...programarEvento(e.efnc, e));
        }

        pasos.push(actualizarEstado(e.nombre, nombres.estado));

        if (e.efc) {
            const condicion = e.condicion
                ? decision(e.condicion)
                : decision("", {
                    hint: `¿${buscar(e.efc).nombre}?`,
                    pending: `Escribí la condición para programar "${e.efc}".`,
                });

            pasos.push(
                si(
                    condicion,
                    secuencia(programarEvento(e.efc, e)),
                    // Si se condiciona a sí mismo y no se cumple: HV (GV2)
                    buscar(e.efc) === e ? proceso(`${e.ref} = HV`) : null
                )
            );
        }

        return secuencia(pasos);
    };

    const ramas = modelo.map(rama);


    // ---- Búsqueda del menor tiempo de un evento vector ----
    //   I = 1, H = 2
    //   (k) → H <= N ?  SÍ: TPS[H] < TPS[I] ? SÍ: I = H  → H++ → (k)
    //                   NO: sigue
    const busquedaDelMenor = (e, etiqueta) => {
        const I = e.indice;
        const H = contador;
        const dimension = e.dimension || "?";

        return secuencia(
            proceso([`${I} = 1`, `${H} = 2`]),
            conLlegada(
                etiqueta,
                si(
                    decision(
                        `${H} <= ${dimension}`,
                        e.dimension
                            ? {}
                            : { pending: `Falta la dimensión del evento "${e.nombre}".` }
                    ),
                    secuencia(
                        si(`${e.tef}[${H}] < ${e.tef}[${I}]`, proceso(`${I} = ${H}`)),
                        proceso(`${H}++`),
                        salto(etiqueta)
                    )
                )
            )
        );
    };

    const busquedas = vectores.map((e, k) =>
        busquedaDelMenor(e, String(k + 2))
    );


    // ---- Selección del próximo evento (el de menor tiempo) ----
    // Empates: gana el que está antes en la tabla.
    const seleccion = () => {
        const r = modelo.map((e) => e.ref);
        const n = modelo.length;

        if (n === 1) {
            return ramas[0];
        }

        if (n === 2) {
            return si(`${r[0]} <= ${r[1]}`, ramas[0], ramas[1]);
        }

        if (n === 3) {
            return seleccion3({
                d1: decision(`${r[0]} <= ${r[1]}`),
                d2: decision(`${r[0]} <= ${r[2]}`),
                d3: decision(`${r[2]} < ${r[1]}`),
                e1: ramas[0],
                e2: ramas[1],
                e3: ramas[2],
            });
        }

        // 4 o más: búsqueda lineal y despacho por número de evento
        const MEN = libre(["MEN"]);
        const EV = libre(["EV"]);

        variables.push(
            nuevaGenerada(MEN, "0", "Menor tiempo de los próximos eventos"),
            nuevaGenerada(EV, "0", "Número del próximo evento (orden de la tabla)")
        );

        const busqueda = [
            proceso([`${MEN} = ${r[0]}`, `${EV} = 1`]),
            ...r.slice(1).map((ref, k) =>
                si(`${ref} < ${MEN}`, proceso([`${MEN} = ${ref}`, `${EV} = ${k + 2}`]))
            ),
        ];

        let despacho = ramas[n - 1];
        for (let k = n - 2; k >= 0; k--) {
            despacho = si(`${EV} == ${k + 1}`, ramas[k], despacho);
        }

        return secuencia(busqueda, despacho);
    };

    const bloque = secuencia(
        contexto(),
        conLlegada(ETIQUETA_CICLO, secuencia(busquedas, seleccion())),
        cierre(nombres.resultado)
    );


    // ---- Variables: tiempos de los eventos e índices ----
    // Tiempo inicial: 0 si el evento se programa solo sin condición
    // (p. ej. la llegada); si no, HV (corrige GV4).
    const tiempos = modelo.map((e) =>
        nuevoTiempoDeEvento(
            e.tef,
            e.seProgramaSolo ? "0" : VALOR_HV,
            e.nombre,
            e.esVector ? { esVector: true, dimension: e.dimensionAP } : {}
        )
    );

    const indices = vectores.map((e) =>
        nuevaGenerada(e.indice, "1", `Posición del menor ${e.tef}`)
    );

    if (contador) {
        indices.push(nuevaGenerada(contador, "0", "Contador de la búsqueda del menor"));
    }


    // ---- Avisos sobre el análisis ----
    const programados = new Set(
        modelo.flatMap((e) => [e.efnc, e.efc]).filter(Boolean).map(clave)
    );

    modelo
        .filter((e) => !programados.has(clave(e.nombre)))
        .forEach((e) => {
            avisos.push(
                `Ningún evento programa a "${e.nombre}": su tiempo queda en HV y nunca ocurre.`
            );
        });

    if (!modelo.some((e) => e.seProgramaSolo)) {
        avisos.push(
            "Ningún evento se programa solo sin condición: todos los tiempos arrancan en HV. Revisá los valores iniciales."
        );
    }

    if (vectores.length) {
        avisos.push(
            "Eventos vector: se usó la notación provisoria TPS[I], con índice desde 1 (pregunta G8)."
        );
    }

    return { bloque, variables: [...tiempos, ...indices, ...variables] };
}
