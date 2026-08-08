// ===========================================================================
// Modelo y validación del Análisis Previo (Modo Libre)
// Lógica pura, sin dependencias. Usada por la página y los componentes.
// ===========================================================================

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
export function nuevoEventoDeltaT() {
  return {
    id: uid(),
    propios: { nombre: "", esVector: false, dimension: null },
    anteriores: [],
    posteriores: [],
  };
}
export function nuevoEventoFuturo() {
  return { id: uid(), sigla: "", eventoRef: "" };
}

export function analisisVacio() {
  return {
    metodologia: null,
    variables: { datos: [], control: [], estado: [], resultado: [] },
    eventos: { filas: [] },
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

export function eventosDeclarados(a) {
  if (!a.metodologia) return [];
  if (a.metodologia === METODOLOGIAS.EVENTO_A_EVENTO) {
    return a.eventos.filas.map((f) => f.evento?.nombre).filter((n) => n && n.trim());
  }
  const propios = a.eventos.filas.map((f) => f.propios?.nombre).filter(Boolean);
  const ant = a.eventos.filas.flatMap((f) => f.anteriores || []);
  const post = a.eventos.filas.flatMap((f) => f.posteriores || []);
  return [...propios, ...ant, ...post].filter((n) => n && n.trim());
}

export function validarAnalisis(a) {
  const errores = [];
  const advertencias = [];

  if (!a.metodologia) errores.push("Seleccioná una metodología.");
  if (a.variables.datos.length === 0) errores.push("Debe haber al menos una variable de Datos.");
  if (a.variables.estado.length === 0) errores.push("Debe haber al menos una variable de Estado.");
  if (a.variables.resultado.length === 0) errores.push("Debe haber al menos una variable de Resultado.");

  const todas = [...a.variables.datos, ...a.variables.control, ...a.variables.estado, ...a.variables.resultado];
  todas.forEach((v) => {
    if (!v.sigla?.trim()) errores.push("Todas las variables deben tener siglas.");
  });
  [...a.variables.estado, ...a.variables.resultado].forEach((v) => {
    if (v.esVector && !dimensionValida(v.dimension)) {
      errores.push(`La variable "${v.sigla || "(sin sigla)"}" es vector sin dimensión configurada.`);
    }
  });

  if (a.metodologia === METODOLOGIAS.EVENTO_A_EVENTO) {
    const declarados = a.eventos.filas.map((f) => f.evento?.nombre).filter((n) => n && n.trim());
    a.eventos.filas.forEach((f) => {
      const nombre = f.evento?.nombre || "";
      if (f.evento?.esVector && !dimensionValida(f.evento.dimension)) {
        errores.push(`El evento "${nombre || "(sin nombre)"}" es vector sin dimensión.`);
      }
      if (f.futuroNoCond && !declarados.includes(f.futuroNoCond)) {
        errores.push(`El evento futuro no condicionado "${f.futuroNoCond}" no está declarado en la columna Evento.`);
      }
      if (f.futuroCond && !declarados.includes(f.futuroCond)) {
        errores.push(`El evento futuro condicionado "${f.futuroCond}" no está declarado en la columna Evento.`);
      }
      if (f.futuroCond && !f.condicion?.trim()) {
        errores.push(`El evento futuro condicionado "${f.futuroCond}" requiere una condición.`);
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
    const totalAnt = a.eventos.filas.reduce((n, f) => n + (f.anteriores || []).filter((x) => x.trim()).length, 0);
    const totalPost = a.eventos.filas.reduce((n, f) => n + (f.posteriores || []).filter((x) => x.trim()).length, 0);
    if (totalAnt !== totalPost) {
      errores.push(`La cantidad de eventos comprometidos anteriores (${totalAnt}) y posteriores (${totalPost}) debe ser igual.`);
    }
    a.eventos.filas.forEach((f) => {
      if (f.propios?.esVector && !dimensionValida(f.propios.dimension)) {
        errores.push(`El evento propio "${f.propios.nombre || "(sin nombre)"}" es vector sin dimensión.`);
      }
    });
  }

  return { errores, advertencias, esValido: errores.length === 0 };
}