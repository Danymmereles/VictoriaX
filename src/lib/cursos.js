// Helpers de cursos: nombre para mostrar, vigencia, períodos.

export const PERIODOS = [
  { value: "ANUAL", label: "Anual", abrev: "Anual" },
  { value: "CUAT1", label: "1° Cuatrimestre", abrev: "1Cuat" },
  { value: "CUAT2", label: "2° Cuatrimestre", abrev: "2Cuat" },
];

const PERIODO_MAP = Object.fromEntries(PERIODOS.map((p) => [p.value, p]));

export const periodoLabel = (v) => PERIODO_MAP[v]?.label || v || "";
export const periodoAbrev = (v) => PERIODO_MAP[v]?.abrev || v || "";

export function anioLectivo(curso) {
  if (!curso?.fecha_inicio) return "";
  const d = new Date(curso.fecha_inicio);
  if (isNaN(d.getTime())) return "";
  return String(d.getFullYear());
}

export function nombreCurso(curso) {
  if (!curso) return "";
  if (curso.nombre && curso.nombre.trim()) return curso.nombre.trim();
  return [curso.codigo, periodoAbrev(curso.periodo_lectivo), anioLectivo(curso)]
    .filter(Boolean)
    .join(" - ");
}

export function esVigente(curso) {
  if (!curso) return false;
  if (curso.forzar_cierre) return false;
  if (!curso.fecha_inicio || !curso.fecha_final) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const ini = new Date(curso.fecha_inicio);
  ini.setHours(0, 0, 0, 0);
  const fin = new Date(curso.fecha_final);
  fin.setHours(23, 59, 59, 999);
  return hoy >= ini && hoy <= fin;
}