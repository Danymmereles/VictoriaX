import { randomUUID } from "node:crypto";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../auth/errors.js";
import { toPublicUser } from "../auth/service.js";
import { isDuplicateEntry } from "../db/userRepository.js";
import { PERIODOS_LECTIVOS } from "../db/schema.js";
import { toPublicResolucion } from "../resoluciones/service.js";
import { esAdmin, esSuperAdmin, institucionObjetivo, puedeVerInstitucion } from "../auth/roles.js";

const MAX_INTEGRANTES_POR_VEZ = 500;

// Quiénes pueden estar inscriptos en un curso.
const ROLES_INTEGRANTE = new Set(["DOCENTE", "ALUMNO"]);

// `id` se mantiene por compatibilidad con el frontend, que venía de Base44.
export function toPublicCurso(record) {
  return {
    id: record.id_curso,
    id_curso: record.id_curso,
    codigo: record.codigo,
    nombre: record.nombre ?? null,
    periodo_lectivo: record.periodo_lectivo,
    fecha_inicio: record.fecha_inicio,
    fecha_final: record.fecha_final,
    forzar_cierre: Boolean(record.forzar_cierre),
    institucion: record.institucion,
  };
}

function parseCodigo(value) {
  if (typeof value !== "string" || !value.trim()) throw new ValidationError("El código es obligatorio.");
  if (value.trim().length > 50) throw new ValidationError("El código admite hasta 50 caracteres.");
  return value.trim();
}

function parseNombre(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new ValidationError("El nombre debe ser un texto.");
  if (value.trim().length > 255) throw new ValidationError("El nombre admite hasta 255 caracteres.");
  return value.trim() || null;
}

function parsePeriodo(value) {
  if (!PERIODOS_LECTIVOS.includes(value)) throw new ValidationError("Seleccioná un período lectivo válido.");
  return value;
}

function parseFecha(value, campo) {
  const valida =
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
  if (!valida) throw new ValidationError(`La fecha ${campo} no es válida (AAAA-MM-DD).`);
  return value;
}

function assertFechas(inicio, final) {
  if (final < inicio) throw new ValidationError("La fecha final no puede ser anterior a la de inicio.");
}

function assertAdmin(actor) {
  if (!esAdmin(actor)) {
    throw new ForbiddenError("Solo un administrador puede crear, editar o eliminar cursos.");
  }
}

function codigoDuplicado(error) {
  return isDuplicateEntry(error) ? new ConflictError("Ya existe un curso con ese código en tu institución.") : error;
}

export function createCursoService({ cursoRepository, userRepository, resolucionRepository }) {
  // Un curso de otra institución se trata como inexistente (salvo para el super admin).
  async function findDeInstitucion(actor, id) {
    const record = await cursoRepository.findById(id);
    if (!record || !puedeVerInstitucion(actor, record.institucion)) {
      throw new NotFoundError("No se encontró el curso.");
    }
    return record;
  }

  // Admin: todos los cursos de su institución. Docente y alumno: solo donde están inscriptos.
  async function findVisible(actor, id) {
    const record = await findDeInstitucion(actor, id);
    if (!esAdmin(actor) && !(await cursoRepository.isIntegrante(id, actor.id_usuario))) {
      throw new NotFoundError("No se encontró el curso.");
    }
    return record;
  }

  // Gestionan integrantes y ven el avance: el admin y los docentes del curso.
  async function findGestionable(actor, id) {
    const record = await findVisible(actor, id);
    if (!esAdmin(actor) && actor.rol !== "DOCENTE") {
      throw new ForbiddenError("Solo docentes y administradores gestionan el curso.");
    }
    return record;
  }

  // Los integrantes tienen que ser de la misma institución que el curso.
  async function findIntegranteValido(institucion, id_usuario, rolesPermitidos = ROLES_INTEGRANTE) {
    const user = typeof id_usuario === "string" ? await userRepository.findById(id_usuario) : null;
    if (!user || user.institucion !== institucion) {
      throw new NotFoundError("No se encontró el usuario.");
    }
    if (!rolesPermitidos.has(user.rol)) {
      throw new ValidationError("Solo se pueden inscribir docentes y alumnos.");
    }
    return user;
  }

  return {
    // Super admin: todos (o los de la institución pedida). Admin: los de su institución.
    async list(actor, { institucion } = {}) {
      const records = esSuperAdmin(actor)
        ? typeof institucion === "string" && institucion.trim()
          ? await cursoRepository.listByInstitucion(institucion.trim())
          : await cursoRepository.listAll()
        : esAdmin(actor)
          ? await cursoRepository.listByInstitucion(actor.institucion)
          : (await cursoRepository.listByIntegrante(actor.id_usuario)).filter(
              (c) => c.institucion === actor.institucion,
            );
      return records.map(toPublicCurso);
    },

    async get(actor, id) {
      const record = await findVisible(actor, id);
      const integrantes = await cursoRepository.listIntegrantes(id);
      return { curso: toPublicCurso(record), integrantes: integrantes.map(toPublicUser) };
    },

    async create(actor, input) {
      assertAdmin(actor);
      const values = {
        id_curso: randomUUID(),
        codigo: parseCodigo(input.codigo),
        nombre: parseNombre(input.nombre),
        periodo_lectivo: parsePeriodo(input.periodo_lectivo),
        fecha_inicio: parseFecha(input.fecha_inicio, "de inicio"),
        fecha_final: parseFecha(input.fecha_final, "final"),
        forzar_cierre: Boolean(input.forzar_cierre),
        // La institución sale del administrador; solo el super admin puede indicar otra.
        institucion: institucionObjetivo(actor, input.institucion),
        id_usuario_creador: actor.id_usuario,
      };
      assertFechas(values.fecha_inicio, values.fecha_final);
      const docentes = [...new Set(Array.isArray(input.docentes) ? input.docentes : [])];
      if (docentes.length === 0) {
        throw new ValidationError("El curso debe tener al menos un docente integrante.");
      }
      for (const id of docentes) await findIntegranteValido(values.institucion, id, new Set(["DOCENTE"]));
      try {
        return toPublicCurso(await cursoRepository.insert(values, docentes));
      } catch (error) {
        throw codigoDuplicado(error);
      }
    },

    async update(actor, id, input) {
      assertAdmin(actor);
      const current = await findDeInstitucion(actor, id);
      const changes = {};
      if (input.codigo !== undefined) changes.codigo = parseCodigo(input.codigo);
      if (input.nombre !== undefined) changes.nombre = parseNombre(input.nombre);
      if (input.periodo_lectivo !== undefined) changes.periodo_lectivo = parsePeriodo(input.periodo_lectivo);
      if (input.fecha_inicio !== undefined) changes.fecha_inicio = parseFecha(input.fecha_inicio, "de inicio");
      if (input.fecha_final !== undefined) changes.fecha_final = parseFecha(input.fecha_final, "final");
      if (input.forzar_cierre !== undefined) changes.forzar_cierre = Boolean(input.forzar_cierre);
      if (Object.keys(changes).length === 0) throw new ValidationError("No hay cambios para guardar.");
      assertFechas(changes.fecha_inicio ?? current.fecha_inicio, changes.fecha_final ?? current.fecha_final);
      try {
        return toPublicCurso(await cursoRepository.update(id, changes));
      } catch (error) {
        throw codigoDuplicado(error);
      }
    },

    async remove(actor, id) {
      assertAdmin(actor);
      await findDeInstitucion(actor, id);
      await cursoRepository.remove(id);
    },

    async agregarIntegrante(actor, id, id_usuario) {
      const [user] = await this.agregarIntegrantes(actor, id, [id_usuario]);
      return user;
    },

    // Agrega varios a la vez: o entran todos o ninguno.
    async agregarIntegrantes(actor, id, ids) {
      const record = await findGestionable(actor, id);
      const unicos = [...new Set(Array.isArray(ids) ? ids : [])];
      if (unicos.length === 0) throw new ValidationError("Elegí al menos un usuario para agregar.");
      if (unicos.length > MAX_INTEGRANTES_POR_VEZ) {
        throw new ValidationError(`Se pueden agregar hasta ${MAX_INTEGRANTES_POR_VEZ} usuarios por vez.`);
      }
      const users = [];
      for (const idUsuario of unicos) users.push(await findIntegranteValido(record.institucion, idUsuario));
      try {
        await cursoRepository.addIntegrantes(id, users.map((u) => u.id_usuario));
      } catch (error) {
        if (isDuplicateEntry(error)) {
          throw new ConflictError(
            unicos.length === 1
              ? "El usuario ya es integrante del curso."
              : "Alguno de los usuarios ya es integrante del curso.",
          );
        }
        throw error;
      }
      return users.map(toPublicUser);
    },

    async quitarIntegrante(actor, id, id_usuario) {
      await findGestionable(actor, id);
      const integrantes = await cursoRepository.listIntegrantes(id);
      const user = integrantes.find((u) => u.id_usuario === id_usuario);
      if (!user) throw new NotFoundError("El usuario no es integrante del curso.");
      const docentes = integrantes.filter((u) => u.rol === "DOCENTE");
      if (user.rol === "DOCENTE" && docentes.length <= 1) {
        throw new ConflictError("El curso debe tener al menos un docente.");
      }
      await cursoRepository.removeIntegrante(id, id_usuario);
    },

    // Avance de los alumnos del curso (resoluciones del Modo Estudio).
    async resoluciones(actor, id) {
      await findGestionable(actor, id);
      const records = await resolucionRepository.listByCurso(id);
      return records.map(toPublicResolucion);
    },
  };
}
