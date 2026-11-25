import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError, ValidationError } from "../auth/errors.js";
import { isDuplicateEntry } from "../db/userRepository.js";
import { METODOLOGIAS } from "../db/schema.js";
import { puedeVerInstitucion } from "../auth/roles.js";

const MAX_ANALISIS_BYTES = 512 * 1024;

// Estados a los que se puede pasar desde cada estado.
// ENTREGADO -> ENTREGADO permite actualizar la entrega; FINALIZADO ya no se modifica.
const TRANSICIONES = {
  BORRADOR: new Set(["BORRADOR", "ENTREGADO"]),
  ENTREGADO: new Set(["ENTREGADO", "FINALIZADO"]),
  FINALIZADO: new Set(),
};

export function toPublicResolucion(record) {
  return {
    id: record.id_resolucion,
    id_resolucion: record.id_resolucion,
    id_usuario: record.id_usuario,
    id_ejercicio: record.id_ejercicio ?? null,
    estado: record.estado,
    fecha_inicio: record.fecha_inicio,
    fecha_ultima_modificacion: record.fecha_ultima_modificacion,
    analisis_previo: {
      id_analisis_previo: record.id_analisis_previo,
      tipo_metodologia: record.tipo_metodologia ?? null,
      variables: record.variables,
      tabla_eventos: record.tabla_eventos,
      tabla_eventos_futuros: record.tabla_eventos_futuros,
    },
  };
}

const esObjeto = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

// Solo se valida la forma de cada campo: las reglas del contenido viven en el frontend.
function parseAnalisis(value) {
  if (!esObjeto(value)) {
    throw new ValidationError("El análisis previo es obligatorio.");
  }
  const tipo = value.tipo_metodologia ?? null;
  if (tipo !== null && !METODOLOGIAS.includes(tipo)) {
    throw new ValidationError("La metodología no es válida.");
  }
  if (!esObjeto(value.variables)) {
    throw new ValidationError("Las variables deben ser un objeto.");
  }
  if (!esObjeto(value.tabla_eventos)) {
    throw new ValidationError("La tabla de eventos debe ser un objeto.");
  }
  if (!Array.isArray(value.tabla_eventos_futuros)) {
    throw new ValidationError("La tabla de eventos futuros debe ser una lista.");
  }
  const analisis = {
    tipo_metodologia: tipo,
    variables: value.variables,
    tabla_eventos: value.tabla_eventos,
    tabla_eventos_futuros: value.tabla_eventos_futuros,
  };
  if (Buffer.byteLength(JSON.stringify(analisis)) > MAX_ANALISIS_BYTES) {
    throw new ValidationError("El análisis previo es demasiado grande.");
  }
  return analisis;
}

export function createResolucionService({ resolucionRepository, ejercicioRepository }) {
  // Cada usuario solo ve sus propias resoluciones; las ajenas se tratan como inexistentes.
  async function findPropia(actor, id) {
    const record = await resolucionRepository.findById(id);
    if (!record || record.id_usuario !== actor.id_usuario) {
      throw new NotFoundError("No se encontró la resolución.");
    }
    return record;
  }

  return {
    async list(actor, { id_ejercicio, libre } = {}) {
      const records = await resolucionRepository.listByUsuario(actor.id_usuario, {
        id_ejercicio: id_ejercicio || undefined,
        libre: Boolean(libre) && !id_ejercicio,
      });
      return records.map(toPublicResolucion);
    },

    async get(actor, id) {
      return toPublicResolucion(await findPropia(actor, id));
    },

    // Sin id_ejercicio es una resolución del Modo Libre.
    async create(actor, input) {
      const analisis = parseAnalisis(input.analisis_previo);
      const id_ejercicio = input.id_ejercicio ?? null;
      if (id_ejercicio !== null) {
        const ejercicio =
          typeof id_ejercicio === "string" ? await ejercicioRepository.findById(id_ejercicio) : null;
        if (!ejercicio || !puedeVerInstitucion(actor, ejercicio.institucion)) {
          throw new NotFoundError("No se encontró el ejercicio.");
        }
      }
      const id_analisis_previo = randomUUID();
      try {
        const record = await resolucionRepository.create({
          analisis: { id_analisis_previo, ...analisis },
          resolucion: {
            id_resolucion: randomUUID(),
            id_usuario: actor.id_usuario,
            id_analisis_previo,
            id_ejercicio,
            estado: "BORRADOR",
          },
        });
        return toPublicResolucion(record);
      } catch (error) {
        if (isDuplicateEntry(error)) {
          throw new ConflictError("Ya tenés una resolución para este ejercicio.");
        }
        throw error;
      }
    },

    async update(actor, id, input) {
      const record = await findPropia(actor, id);
      if (record.estado === "FINALIZADO") {
        throw new ConflictError("La resolución está finalizada y ya no se puede modificar.");
      }
      const cambios = {};
      if (input.analisis_previo !== undefined) cambios.analisis = parseAnalisis(input.analisis_previo);
      if (input.estado !== undefined) {
        if (!TRANSICIONES[record.estado].has(input.estado)) {
          throw new ValidationError(`No se puede pasar de ${record.estado} a ${input.estado}.`);
        }
        if (input.estado !== "BORRADOR" && !record.id_ejercicio) {
          throw new ValidationError("Solo se entregan resoluciones de ejercicios del Modo Estudio.");
        }
        cambios.estado = input.estado;
      }
      if (Object.keys(cambios).length === 0) {
        throw new ValidationError("No hay cambios para guardar.");
      }
      return toPublicResolucion(await resolucionRepository.update(record, cambios));
    },
  };
}
