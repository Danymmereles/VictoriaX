// Debe coincidir con src/lib/instituciones.js del frontend.
export const INSTITUCIONES = {
  "frba.utn.edu.ar": "UTN FRBA",
  "frre.utn.edu.ar": "UTN FRRE",
};

export const SIN_INSTITUCION = "Sin institución";

export function institucionDesdeEmail(email) {
  const dominio = String(email || "").split("@")[1]?.toLowerCase() || "";
  return INSTITUCIONES[dominio] || SIN_INSTITUCION;
}
