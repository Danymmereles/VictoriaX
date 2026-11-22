// Vínculo entre el dominio del correo institucional y la institución del usuario.
export const INSTITUCIONES = {
  "frba.utn.edu.ar": "UTN FRBA",
  "frre.utn.edu.ar": "UTN FRRE",
};

export const LISTA_INSTITUCIONES = Object.values(INSTITUCIONES);

export const SIN_INSTITUCION = "Sin institución";

// Nombres anteriores, para normalizar datos ya guardados.
const ALIAS = {
  "UTN Facultad Buenos Aires": "UTN FRBA",
  "UTN Facultad Resistencia": "UTN FRRE",
};

export function normalizarInstitucion(institucion) {
  return ALIAS[institucion] || institucion;
}

export function institucionDesdeEmail(email) {
  const dominio = String(email || "").split("@")[1]?.toLowerCase() || "";
  return INSTITUCIONES[dominio] || SIN_INSTITUCION;
}

export function institucionDeUsuario(usuario) {
  return normalizarInstitucion(
    usuario?.institucion || institucionDesdeEmail(usuario?.email),
  );
}

export function esEmailUtn(email) {
  return /^[^\s@]+@([a-z0-9-]+\.)+utn\.edu\.ar$/i.test(String(email || "").trim());
}