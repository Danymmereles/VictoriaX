// Reglas de rol compartidas por los servicios.
// SUPER_ADMIN ve y administra todas las instituciones; ADMIN, solo la suya.

export const esSuperAdmin = (actor) => actor?.rol === "SUPER_ADMIN";

// Permisos de administración (dentro de las instituciones que puede ver).
export const esAdmin = (actor) => actor?.rol === "ADMIN" || esSuperAdmin(actor);

export const puedeVerInstitucion = (actor, institucion) =>
  esSuperAdmin(actor) || actor?.institucion === institucion;

// Institución sobre la que trabaja una consulta: el super admin puede elegir otra;
// para el resto siempre es la propia (lo que pidan se ignora).
export function institucionObjetivo(actor, pedida) {
  if (esSuperAdmin(actor) && typeof pedida === "string" && pedida.trim()) {
    return pedida.trim().slice(0, 100);
  }
  return actor.institucion;
}
