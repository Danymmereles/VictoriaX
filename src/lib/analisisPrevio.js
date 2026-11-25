// ===========================================================================
// Modelo y validación del Análisis Previo (Modo Libre)
// Lógica pura. Usada por la página y los componentes.
// Las siglas siguen la misma regla de nombres que el diagrama
// (lib/lenguaje, BNF v0.15), para que el diagrama generado sea válido.
// ===========================================================================

import { motivoNombreDeVariable } from "./lenguaje/nombres.js";

export const METODOLOGIAS = {
  EVENTO_A_EVENTO: "EVENTO_A_EVENTO",
  DELTA_T_CONSTANTE: "DELTA_T_CONSTANTE",
};

let _id = 0;
export const uid = () => `id_${Date.now()}_${_id++}`;

export function nuevaVariable() {
  return { id: uid(), sigla: "", descripcion: "", esVector: false, dimension: null };
}
export function nuevoEventoEaE() {
  return {
    id: uid(),
    evento: { nombre: "", esVector: false, dimension: null },
    futuroNoCond: "",
    futuroCond: "",
    condicion: "",
  };
}
export function nuevoEventoPropio() {
  return { id: uid(), nombre: "", esVector: false, dimension: null };
}
export function nuevoComprometido() {
  return { id: uid(), nombre: "" };
}
export function eventosVacio() {
  return { filas: [], propios: [], anteriores: [], posteriores: [] };
}
export function nuevoEventoFuturo() {
  return { id: uid(), sigla: "", eventoRef: "", eventoAnterior: "", eventoPosterior: "" };
}

export function analisisVacio() {
  return {
    metodologia: null,
    variables: { datos: [], control: [], estado: [], resultado: [] },
    eventos: eventosVacio(),
    eventosFuturos: [],
  };
}

// dimension: { tipo: "fijo", valor } | { tipo: "variable", variableControl } | null
export function dimensionValida(dim) {
  if (!dim) return false;
  if (dim.tipo === "fijo") return dim.valor !== undefined && dim.valor !== "" && Number(dim.valor) > 0;
  if (dim.tipo === "variable") return Boolean(dim.variableControl);
  return false;
}

// Δt constante: tres listas (eventos propios y comprometidos anteriores /
// posteriores). Los análisis guardados con una fila por evento propio se leen
// como listas para no perder lo ya cargado.
export function deltaTDe(eventos) {
  const ev = eventos || {};
  const filas = ev.filas || [];
  if (filas.length > 0) {
    return {
      propios: filas.map((f) => ({
        id: f.id,
        nombre: f.propios?.nombre || "",
        esVector: Boolean(f.propios?.esVector),
        dimension: f.propios?.dimension ?? null,
      })),
      anteriores: filas.flatMap((f) => (f.anteriores || []).map((nombre, i) => ({ id: `${f.id}-a${i}`, nombre }))),
      posteriores: filas.flatMap((f) => (f.posteriores || []).map((nombre, i) => ({ id: `${f.id}-p${i}`, nombre }))),
    };
  }
  return {
    propios: ev.propios || [],
    anteriores: ev.anteriores || [],
    posteriores: ev.posteriores || [],
  };
}

export function eventosDeclarados(a) {
  if (!a.metodologia) return [];
  if (a.metodologia === METODOLOGIAS.EVENTO_A_EVENTO) {
    return a.eventos.filas.map((f) => f.evento?.nombre).filter((n) => n && n.trim());
  }
  const { propios, anteriores, posteriores } = deltaTDe(a.eventos);
  return [
    ...propios.map((p) => p.nombre),
    ...anteriores.map((x) => x.nombre),
    ...posteriores.map((x) => x.nombre),
  ].filter((n) => n && n.trim());
}

export function validarAnalisis(a) {
  const errores = [];
  const detalles = [];
  const advertencias = [];

  // Cada error queda asociado al bloque que lo origina (metodología, grupo de
  // variables, variable o fila de eventos) para poder resaltarlo en pantalla.
  const error = (campo, mensaje) => {
    errores.push(mensaje);
    detalles.push({ campo, mensaje });
  };
  const claveVariable = (v, i) => `variable:${v.id || `idx-${i}`}`;
  const claveFila = (f, i) => `evento:${f.id || `idx-${i}`}`;

  if (!a.metodologia) error("metodologia", "Seleccioná una metodología.");
  if (a.variables.datos.length === 0) error("variables.datos", "Debe haber al menos una variable de Datos.");
  if (a.variables.estado.length === 0) error("variables.estado", "Debe haber al menos una variable de Estado.");
  if (a.variables.resultado.length === 0) error("variables.resultado", "Debe haber al menos una variable de Resultado.");

  const grupos = [a.variables.datos, a.variables.control, a.variables.estado, a.variables.resultado];
  grupos.forEach((lista) => {
    lista.forEach((v, i) => {
      if (!v.sigla?.trim()) error(claveVariable(v, i), "Todas las variables deben tener siglas.");
    });
  });

  validarSiglas(a, { claveVariable, error, detalles, errores });

  // Variables sin descripción: una sola advertencia agrupada.
  const sinDescripcion = grupos
    .flatMap((lista) => lista)
    .filter((v) => !v.descripcion?.trim())
    .map((v) => v.sigla?.trim() || "(sin sigla)");
  if (sinDescripcion.length > 0) {
    advertencias.push(
      `Las siguientes variables no tienen descripción / nombre: ${sinDescripcion.join(", ")}.`
    );
  }
  [...a.variables.estado, ...a.variables.resultado].forEach((v, i) => {
    if (v.esVector && !dimensionValida(v.dimension)) {
      error(claveVariable(v, i), `La variable "${v.sigla || "(sin sigla)"}" es vector sin dimensión configurada.`);
    }
  });

  if (a.metodologia === METODOLOGIAS.EVENTO_A_EVENTO) {
    const eventosCargados = a.eventos.filas.filter((f) => f.evento?.nombre?.trim());
    if (eventosCargados.length === 0) {
      error("eventos", "Debe haber al menos un evento en la Tabla de Eventos.");
    }
    const futurosCargados = (a.eventosFuturos || []).filter((e) => e.sigla?.trim());
    if (futurosCargados.length === 0) {
      error("eventosFuturos", "Debe haber al menos un evento en la Tabla de Eventos Futuros.");
    }
    // Cada evento futuro debe indicar a qué evento corresponde.
    (a.eventosFuturos || []).forEach((e, i) => {
      if (!e.eventoRef?.trim()) {
        error(claveEventoFuturo(e, i), "Cada evento futuro debe indicar el evento al que corresponde.");
      }
    });

    const declarados = a.eventos.filas.map((f) => f.evento?.nombre).filter((n) => n && n.trim());
    a.eventos.filas.forEach((f, i) => {
      const campo = claveFila(f, i);
      const nombre = f.evento?.nombre || "";
      if (f.evento?.esVector && !dimensionValida(f.evento.dimension)) {
        error(campo, `El evento "${nombre || "(sin nombre)"}" es vector sin dimensión.`);
      }
      if (f.futuroNoCond && !declarados.includes(f.futuroNoCond)) {
        error(campo, `El evento futuro no condicionado "${f.futuroNoCond}" no está declarado en la columna Evento.`);
      }
      if (f.futuroCond && !declarados.includes(f.futuroCond)) {
        error(campo, `El evento futuro condicionado "${f.futuroCond}" no está declarado en la columna Evento.`);
      }
      if (f.futuroCond && !f.condicion?.trim()) {
        error(campo, `El evento futuro condicionado "${f.futuroCond}" requiere una condición.`);
      }
    });
    const siglasEstado = a.variables.estado.map((v) => v.sigla).filter((s) => s && s.trim());
    a.eventos.filas.forEach((f) => {
      if (f.condicion?.trim()) {
        const usaEstado = siglasEstado.some((s) => f.condicion.includes(s));
        if (!usaEstado) {
          advertencias.push(`La condición del evento "${f.evento?.nombre}" no contiene ninguna variable de estado.`);
        }
      }
    });
    siglasEstado.forEach((s) => {
      const usada = a.eventos.filas.some((f) => f.condicion?.includes(s));
      if (!usada) advertencias.push(`La variable de estado "${s}" no aparece en ninguna condición.`);
    });
  } else if (a.metodologia === METODOLOGIAS.DELTA_T_CONSTANTE) {
    const { propios, anteriores, posteriores } = deltaTDe(a.eventos);
    if (!propios.some((p) => p.nombre?.trim())) {
      error("eventos", "Debe haber al menos un evento propio en la Tabla de Eventos.");
    }
    const totalAnt = anteriores.filter((x) => x.nombre?.trim()).length;
    const totalPost = posteriores.filter((x) => x.nombre?.trim()).length;
    if (totalAnt !== totalPost) {
      error("eventos", `La cantidad de eventos comprometidos anteriores (${totalAnt}) y posteriores (${totalPost}) debe ser igual.`);
    }
    // En Δt constante cada evento futuro liga un comprometido anterior con uno posterior.
    (a.eventosFuturos || []).forEach((e, i) => {
      const campo = claveEventoFuturo(e, i);
      if (!e.eventoAnterior?.trim()) {
        error(campo, "Cada evento futuro debe indicar un evento comprometido anterior.");
      }
      if (!e.eventoPosterior?.trim()) {
        error(campo, "Cada evento futuro debe indicar un evento comprometido posterior.");
      }
    });
  }

  return { errores, detalles, advertencias, esValido: errores.length === 0 };
}

// Clave de una fila de la tabla de Eventos Futuros
export const claveEventoFuturo = (e, i) => `eventoFuturo:${e.id || `idx-${i}`}`;

/*
 * Las siglas de las variables y de los Eventos Futuros son los nombres
 * que se usan en el diagrama, así que siguen la regla de nombres de la BNF:
 *   - válidas: letras, números y _, sin empezar con número, sin tildes,
 *     espacios ni palabras reservadas (AND, OR, NOT, TRUE, FALSE, NULL) ni R1, R2… (Random);
 *   - únicas entre todas las secciones. Como en JavaScript, distinguen
 *     mayúsculas: Ic e IC son dos siglas distintas.
 * Los detalles de estos errores llevan tipo "sigla" (para resaltar el campo).
 */
function validarSiglas(a, { claveVariable, error, detalles, errores }) {
  const errorDeSigla = (campo, mensaje) => {
    error(campo, mensaje);
    detalles[detalles.length - 1].tipo = "sigla";
  };

  const entradas = [
    ...[a.variables.datos, a.variables.control, a.variables.estado, a.variables.resultado].flatMap((lista) =>
      lista.map((v, i) => ({ campo: claveVariable(v, i), sigla: v.sigla?.trim() || "", que: "La sigla" }))
    ),
    ...(a.eventosFuturos || []).map((e, i) => ({
      campo: claveEventoFuturo(e, i),
      sigla: e.sigla?.trim() || "",
      que: "La sigla del evento futuro",
    })),
  ].filter((x) => x.sigla);

  const validas = [];
  entradas.forEach((x) => {
    const motivo = motivoNombreDeVariable(x.sigla);
    if (motivo) {
      const detalle = motivo.charAt(0).toLowerCase() + motivo.slice(1);
      errorDeSigla(x.campo, `${x.que} "${x.sigla}" no es válida: ${detalle}`);
    }
    else validas.push(x);
  });

  // Repetidas: un solo mensaje en la lista, y se marcan todas las filas
  const porSigla = new Map();
  validas.forEach((x) => porSigla.set(x.sigla, [...(porSigla.get(x.sigla) || []), x]));
  porSigla.forEach((lista, sigla) => {
    if (lista.length < 2) return;
    const mensaje = `La sigla "${sigla}" está repetida: cada variable y cada evento futuro necesita una sigla distinta.`;
    errores.push(mensaje);
    lista.forEach((x) => detalles.push({ campo: x.campo, mensaje, tipo: "sigla" }));
  });
}

// Bloques (metodología, grupos de variables, variables o filas) con error bloqueante.
export function camposConError(validacion) {
  return new Set((validacion?.detalles || []).map((d) => d.campo));
}

/*
 * Errores de cada bloque, para mostrarlos al lado del campo:
 *   Map campo → { mensajes: [texto], sigla: boolean }
 * sigla es true si el problema está en la sigla (para resaltar ese input).
 */
export function erroresPorCampo(validacion) {
  const mapa = new Map();
  (validacion?.detalles || []).forEach((d) => {
    const actual = mapa.get(d.campo) || { mensajes: [], sigla: false };
    if (!actual.mensajes.includes(d.mensaje)) actual.mensajes.push(d.mensaje);
    if (d.tipo === "sigla") actual.sigla = true;
    mapa.set(d.campo, actual);
  });
  return mapa;
}