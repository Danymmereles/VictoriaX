// Cursos e integrantes (API propia + MySQL).
// Admin: todos los cursos de su institución. Docente y alumno: solo donde están inscriptos.
import { request } from "@/api/apiClient";
import { deColumnas, ESTADOS } from "@/api/resolucionesClient";
import { rolDesdeApi } from "@/lib/permisos";

const aUsuarioApp = (user) => ({ ...user, id: user.id_usuario, rol: rolDesdeApi(user.rol) });

// Formato que esperan las vistas de avance (antes, la entidad Entrega de Base44).
function aEntrega(resolucion) {
  return {
    ...resolucion,
    usuario_id: resolucion.id_usuario,
    ejercicio_id: resolucion.id_ejercicio,
    entregado: resolucion.estado !== ESTADOS.BORRADOR,
    resolucion_vista: resolucion.estado === ESTADOS.FINALIZADO,
    analisis_previo: deColumnas(resolucion.analisis_previo),
  };
}

const ruta = (id, resto = "") => `/api/cursos/${encodeURIComponent(id)}${resto}`;

export const cursosClient = {
  async list() {
    const { cursos } = await request("/api/cursos");
    return cursos;
  },

  // { curso, integrantes } con los roles en el formato de la app.
  async get(id) {
    const { curso, integrantes } = await request(ruta(id));
    return { curso, integrantes: integrantes.map(aUsuarioApp) };
  },

  // docentes: ids de los docentes iniciales (al menos uno).
  async create(datos, docentes) {
    const { curso } = await request("/api/cursos", { method: "POST", body: { ...datos, docentes } });
    return curso;
  },

  async update(id, cambios) {
    const { curso } = await request(ruta(id), { method: "PATCH", body: cambios });
    return curso;
  },

  async remove(id) {
    await request(ruta(id), { method: "DELETE" });
  },

  // Agrega varios integrantes juntos: o entran todos o ninguno.
  async agregarIntegrantes(id, idsUsuario) {
    const { usuarios } = await request(ruta(id, "/integrantes"), {
      method: "POST",
      body: { ids_usuario: idsUsuario },
    });
    return usuarios;
  },

  async quitarIntegrante(id, idUsuario) {
    await request(ruta(id, `/integrantes/${encodeURIComponent(idUsuario)}`), { method: "DELETE" });
  },

  // Resoluciones del Modo Estudio de los alumnos del curso, como "entregas".
  async entregas(id) {
    const { resoluciones } = await request(ruta(id, "/resoluciones"));
    return resoluciones.map(aEntrega);
  },
};
