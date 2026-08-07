// ===========================================================================
// Permisos por rol — Patron Strategy (Diagrama de Seguridad)
// ---------------------------------------------------------------------------
// Interfaz Rol con sus estrategias concretas: Administrador, Docente, Estudiante.
// Modulo desacoplado, sin dependencias: sobrevive al reemplazo del autenticador.
//
// Metodos de la interfaz Rol (segun diagrama):
//   puedoCambiarRol, puedoEditarCurso, puedoCrearCurso, puedoEditarPerfil,
//   puedoCrearFeedback, puedoVisualizarEstadisticas, puedoVisualizarOtrosPerfiles
// + puedoEditarOtrosPerfiles: regla de negocio ("solo admin edita perfiles ajenos")
//
// Valores marcados [diag] provienen literalmente del diagrama de seguridad.
// Valores marcados [inferido] no figuran explicitamente para esa estrategia y se
// infieren por jerarquia de rol (Admin = total, Docente = intermedio, Estudiante = minimo).
// Revisar los [inferido] contra el diagrama original antes de habilitar esas features.
// ===========================================================================

export const ROLES = {
  ADMINISTRADOR: "ADMINISTRADOR",
  DOCENTE: "DOCENTE",
  ESTUDIANTE: "ESTUDIANTE",
};

const estrategias = {
  ADMINISTRADOR: {
    puedoCambiarRol: true,                // [diag]
    puedoEditarCurso: true,              // [diag]
    puedoCrearCurso: true,               // [diag]
    puedoEditarPerfil: true,            // [diag] perfil propio
    puedoCrearFeedback: true,           // [inferido] admin = acceso total
    puedoVisualizarEstadisticas: true,  // [inferido] admin = acceso total
    puedoVisualizarOtrosPerfiles: true, // [diag]
    puedoEditarOtrosPerfiles: true,     // regla de negocio: solo admin
  },
  DOCENTE: {
    puedoCambiarRol: false,             // [diag]
    puedoEditarCurso: false,            // [inferido] no listado
    puedoCrearCurso: false,            // [diag]
    puedoEditarPerfil: true,           // [diag] perfil propio
    puedoCrearFeedback: true,          // [inferido] docente revisa entregas
    puedoVisualizarEstadisticas: true, // [inferido] docente ve stats de su curso
    puedoVisualizarOtrosPerfiles: true, // [diag]
    puedoEditarOtrosPerfiles: false,    // regla de negocio: solo admin
  },
  ESTUDIANTE: {
    puedoCambiarRol: false,              // [diag]
    puedoEditarCurso: false,             // [diag]
    puedoCrearCurso: false,             // [diag]
    puedoEditarPerfil: true,           // [diag] perfil propio
    puedoCrearFeedback: false,         // [inferido]
    puedoVisualizarEstadisticas: false,// [inferido]
    // [diag] Nota del diagrama: "El estudiante solo puede ver los perfiles docentes
    // de su curso, nunca llegaran al listado". Hoy no hay cursado, => false.
    puedoVisualizarOtrosPerfiles: false,
    puedoEditarOtrosPerfiles: false,    // regla de negocio: solo admin
  },
};

const POR_DEFECTO = estrategias.ESTUDIANTE;

export function getPermisos(rol) {
  return estrategias[rol] || POR_DEFECTO;
}

export function puede(rol, permiso) {
  return Boolean(getPermisos(rol)[permiso]);
}