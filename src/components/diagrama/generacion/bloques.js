// ===========================================================================
// Bloques del diagrama generado: la estructura del algoritmo, sin
// coordenadas. Los arma eventoAEvento.js / deltaT.js y los ubica ubicar.js.
//
//   nodo        un nodo suelto (Proceso, Preparación, Fin, Conector...)
//   secuencia   bloques uno debajo del otro
//   si          Decisión con rama SÍ (derecha) y rama NO (izquierda); las
//               dos ramas se vuelven a unir en el bloque siguiente
//   conLlegada  agrega un Conector de llegada que entra al primer nodo
//               del bloque (el destino de un salto con la misma etiqueta)
//   seleccion3  selección del próximo evento entre 3 (ver eventoAEvento.js)
//
// Un nodo `spec` lleva lo que termina en `data` del nodo de React Flow
// (type, label, hint, pending, handleSide, anchorOf) y, opcionalmente,
// `id` y `deletable` para los nodos fijos (Contexto y anclas).
// ===========================================================================

export const nodo = (type, label = "", extra = {}) => ({
    kind: "nodo",
    spec: { type, label, ...extra },
});

// Proceso: una sentencia por línea
export const proceso = (lineas, extra) =>
    nodo("process", [].concat(lineas).join("\n"), extra);

/*
 * Nodo que el usuario tiene que completar porque el Análisis Previo no
 * alcanza: vacío, con un texto de ayuda atenuado (hint) y marcado en rojo
 * con la explicación (pending) hasta que lo edite.
 */
export const completar = (type, hint, pending) =>
    nodo(type, "", { hint, pending });

export const fin = () => nodo("end", "");

// Conector de salto: recibe flechas y no tiene salidas
export const salto = (etiqueta, handleSide = "right") =>
    nodo("connector", etiqueta, { handleSide, salto: true });

export const secuencia = (...items) => ({
    kind: "seq",
    items: items.flat().filter(Boolean),
});

// decision: spec de la Decisión (o el texto de la condición)
export const si = (decision, ramaSi = null, ramaNo = null) => ({
    kind: "si",
    decision:
        typeof decision === "string"
            ? nodo("decision", decision).spec
            : decision,
    si: ramaSi,
    no: ramaNo,
});

export const conLlegada = (etiqueta, bloque) => ({
    kind: "llegada",
    etiqueta,
    bloque,
});

/*
 * Selección entre 3 eventos (ver eventoAEvento.js):
 *   d1 SÍ → d2, NO → d3;  d2 SÍ → e1, NO → e3;  d3 SÍ → e3, NO → e2
 * La rama del evento 3 es compartida: queda en el medio.
 */
export const seleccion3 = ({ d1, d2, d3, e1, e2, e3 }) => ({
    kind: "sel3",
    d1,
    d2,
    d3,
    e1,
    e2,
    e3,
});

// Nodos que terminan el camino (no tienen salida)
export const esTerminal = (spec) => spec.type === "end" || Boolean(spec.salto);
