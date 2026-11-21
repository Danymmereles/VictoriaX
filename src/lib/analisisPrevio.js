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
  [...a.variables.estado, ...a.variables.resultado].forEach((v, i) => {
    if (v.esVector && !dimensionValida(v.dimension)) {
      error(claveVariable(v, i), `La variable "${v.sigla || "(sin sigla)"}" es vector sin dimensión configurada.`);
    }
  });

  if (a.metodologia === METODOLOGIAS.EVENTO_A_EVENTO) {
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
    const totalAnt = a.eventos.filas.reduce((n, f) => n + (f.anteriores || []).filter((x) => x.trim()).length, 0);
    const totalPost = a.eventos.filas.reduce((n, f) => n + (f.posteriores || []).filter((x) => x.trim()).length, 0);
    if (totalAnt !== totalPost) {
      error("eventos", `La cantidad de eventos comprometidos anteriores (${totalAnt}) y posteriores (${totalPost}) debe ser igual.`);
    }
    a.eventos.filas.forEach((f, i) => {
      if (f.propios?.esVector && !dimensionValida(f.propios.dimension)) {
        error(claveFila(f, i), `El evento propio "${f.propios.nombre || "(sin nombre)"}" es vector sin dimensión.`);
      }
    });
  }

  return { errores, detalles, advertencias, esValido: errores.length === 0 };
}

// Bloques (metodología, grupos de variables, variables o filas) con error bloqueante.
export function camposConError(validacion) {
  return new Set((validacion?.detalles || []).map((d) => d.campo));
}