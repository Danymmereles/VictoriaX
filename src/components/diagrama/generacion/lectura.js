// ===========================================================================
// Lectura del Análisis Previo para el generador. Lógica pura.
//
// Junta lo que el generador necesita (eventos, siglas de tiempo y nombres
// ocupados) y elige los nombres de las variables auxiliares. No modifica el
// análisis: lo que falta queda como aviso o como nodo para completar.
// ===========================================================================

import { textoDimension } from "../variables.js";

// Valores por defecto de Victoria (2017). Ver la pregunta PV4.
export const VALOR_HV = "99999999";
export const VALOR_TF = "50000";

const limpiar = (texto) => String(texto ?? "").trim();
const clave = (texto) => limpiar(texto).toUpperCase();

// "Llegada" → "LLEGADA" (sin tildes ni espacios, para un nombre válido)
const nombreSeguro = (texto) =>
    limpiar(texto)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase();

const siglas = (lista) => (lista || []).map((v) => limpiar(v.sigla)).filter(Boolean);

/*
 * Devuelve:
 *   nombres:  { datos, control, estado, resultado } (siglas del análisis)
 *   ocupado(nombre) / reservar(nombre) / libre(candidatos)
 *   tefDe(evento):  sigla del tiempo del próximo evento (TPLL)
 *   avisos:   lo que el análisis no tiene y se resolvió de otra forma
 */
export function leerAnalisis(analisis) {
    const avisos = [];

    const nombres = {
        datos: siglas(analisis.variables?.datos),
        control: siglas(analisis.variables?.control),
        estado: siglas(analisis.variables?.estado),
        resultado: siglas(analisis.variables?.resultado),
    };

    const ocupados = new Set(
        Object.values(nombres)
            .flat()
            .map(clave)
    );

    const ocupado = (nombre) => ocupados.has(clave(nombre));
    const reservar = (nombre) => ocupados.add(clave(nombre));

    // Primer nombre libre de la lista; si ninguno, el primero con un número
    const libre = (candidatos) => {
        const elegido =
            candidatos.find((c) => !ocupado(c)) ??
            (() => {
                let n = 2;
                while (ocupado(`${candidatos[0]}${n}`)) n++;
                return `${candidatos[0]}${n}`;
            })();

        reservar(elegido);
        return elegido;
    };

    // Siglas de tiempo de la tabla de Eventos Futuros (TPLL → Llegada)
    const siglaPorEvento = new Map();

    (analisis.eventosFuturos || []).forEach((ef) => {
        const sigla = limpiar(ef.sigla);
        const evento = limpiar(ef.eventoRef);

        if (!sigla || !evento) {
            return;
        }

        if (siglaPorEvento.has(clave(evento))) {
            avisos.push(
                `"${evento}" tiene más de una sigla en Eventos Futuros: se usó ${siglaPorEvento.get(clave(evento))}.`
            );
            return;
        }

        siglaPorEvento.set(clave(evento), sigla);
        reservar(sigla);
    });

    // Un evento sin sigla en Eventos Futuros recibe una ("TP" + nombre)
    const tefDe = (evento) => {
        const k = clave(evento);

        if (!siglaPorEvento.has(k)) {
            const sigla = libre([`TP${nombreSeguro(evento) || "EV"}`]);
            siglaPorEvento.set(k, sigla);
            avisos.push(
                `"${limpiar(evento)}" no tiene sigla en Eventos Futuros: se usó ${sigla}.`
            );
        }

        return siglaPorEvento.get(k);
    };

    return { nombres, ocupado, reservar, libre, tefDe, avisos };
}


/*
 * Eventos de la tabla Evento a Evento, sin filas vacías ni repetidas:
 *   [{ nombre, esVector, dimension (texto), dimensionAP, efnc, efc, condicion }]
 */
export function eventosEaE(analisis, avisos) {
    const vistos = new Set();
    const eventos = [];

    (analisis.eventos?.filas || []).forEach((fila) => {
        const nombre = limpiar(fila.evento?.nombre);

        if (!nombre) {
            return;
        }

        if (vistos.has(clave(nombre))) {
            avisos.push(`El evento "${nombre}" está repetido en la tabla: se usó la primera fila.`);
            return;
        }

        vistos.add(clave(nombre));

        eventos.push({
            nombre,
            esVector: Boolean(fila.evento?.esVector),
            dimension: textoDimension(fila.evento?.dimension),
            dimensionAP: fila.evento?.esVector ? fila.evento?.dimension ?? null : null,
            efnc: limpiar(fila.futuroNoCond) || null,
            efc: limpiar(fila.futuroCond) || null,
            condicion: limpiar(fila.condicion),
        });
    });

    return eventos;
}


/*
 * Eventos de la tabla Δt constante, en orden:
 *   propios:     [{ nombre, esVector }]
 *   anteriores:  [nombre] (comprometidos en un Δt anterior: llegan ahora)
 *   posteriores: [nombre] (ocurren ahora y comprometen uno futuro)
 */
export function eventosDeltaT(analisis) {
    const filas = analisis.eventos?.filas || [];

    return {
        propios: filas
            .map((f) => ({
                nombre: limpiar(f.propios?.nombre),
                esVector: Boolean(f.propios?.esVector),
            }))
            .filter((p) => p.nombre),
        anteriores: filas.flatMap((f) => f.anteriores || []).map(limpiar).filter(Boolean),
        posteriores: filas.flatMap((f) => f.posteriores || []).map(limpiar).filter(Boolean),
    };
}
