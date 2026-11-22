// Vínculo entre el dominio del correo institucional y la institución del usuario.
export const INSTITUCIONES = {
  "frba.utn.edu.ar": "UTN Facultad Buenos Aires",
  "frre.utn.edu.ar": "UTN Facultad Resistencia",
};

export const LISTA_INSTITUCIONES = Object.values(INSTITUCIONES);

export const SIN_INSTITUCION = "Sin institución";

export function institucionDesdeEmail(email) {
  const dominio = String(email || "").split("@")[1]?.toLowerCase() || "";
  return INSTITUCIONES[dominio] || SIN_INSTITUCION;
}

export function institucionDeUsuario(usuario) {
  return usuario?.institucion || institucionDesdeEmail(usuario?.email);
}

export function esEmailUtn(email) {
  return /^[^\s@]+@([a-z0-9-]+\.)+utn\.edu\.ar$/i.test(String(email || "").trim());
}