import { randomUUID } from "node:crypto";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../auth/errors.js";
import { isDuplicateEntry } from "../db/userRepository.js";
import { institucionObjetivo, puedeVerInstitucion } from "../auth/roles.js";

const AUTORES = new Set(["DOCENTE", "ADMIN", "SUPER_ADMIN"]);
const MAX_CONSIGNA_BYTES = 4 * 1024 * 1024;

// `id` se mantiene por compatibilidad con el frontend, que venía de Base44.
export function toPublicEjercicio(record) {
  return {
    id: record.id_ejercicio,
    id_ejercicio: record.id_ejercicio,
    numero: record.numero,
    titulo: record.titulo,
    consigna_html: record.consigna_html,
    apoyo: record.apoyo ?? null,
    institucion: record.institucion,
    id_usuario_creador: record.id_usuario_creador ?? null,
  };
}

function parseNumero(value) {
  const numero = Number(value);
  if (!Number.isInteger(numero) || numero < 1 || numero > 100000) {
    throw new ValidationError("El número de ejercicio debe ser un entero positivo.");
  }
  return numero;
}

function parseTitulo(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError("El título es obligatorio.");
  }
  if (value.trim().length > 255) {
    throw new ValidationError("El título admite hasta 255 caracteres.");
  }
  return value.trim();
}

function parseConsigna(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError("La consigna es obligatoria.");
  }
  if (Buffer.byteLength(value) > MAX_CONSIGNA_BYTES) {
    throw new ValidationError("La consigna es demasiado grande.");
  }
  return value;
}

// Apoyo opcional: { secuencia: string[], variables: string[], sugerencia: string }.
function parseApoyo(value) {
  if (value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("El material de apoyo debe ser un objeto.");
  }
  const lista = (campo) => {
    const items = value[campo] ?? [];
    if (!Array.isArray(items) || items.some((item) => typeof item !== "string")) {
      throw new ValidationError(`El apoyo.${campo} debe ser una lista de textos.`);
    }
    return items;
  };
  if (value.sugerencia !== undefined && typeof value.sugerencia !== "string") {
    throw new ValidationError("La sugerencia de apoyo debe ser un texto.");
  }
  const apoyo = {
    secuencia: lista("secuencia"),
    variables: lista("variables"),
    sugerencia: value.sugerencia ?? "",
  };
  if (JSON.stringify(apoyo).length > 64 * 1024) {
    throw new ValidationError("El material de apoyo es demasiado grande.");
  }
  return apoyo;
}

function assertAutor(actor) {
  if (!AUTORES.has(actor.rol)) {
    throw new ForbiddenError("Solo docentes y administradores pueden gestionar ejercicios.");
  }
}

function duplicateNumero(error) {
  if (isDuplicateEntry(error)) {
    return new ConflictError("Ya existe un ejercicio con ese número en tu institución.");
  }
  return error;
}

export function createEjercicioService({ ejercicioRepository }) {
  // Un ejercicio de otra institución se trata como inexistente (salvo para el super admin).
  async function findVisible(actor, id) {
    const record = await ejercicioRepository.findById(id);
    if (!record || !puedeVerInstitucion(actor, record.institucion)) {
      throw new NotFoundError("No se encontró el ejercicio.");
    }
    return record;
  }

  return {
    // El super admin puede pedir los de otra institución; el resto ve los de la suya.
    async list(actor, { institucion } = {}) {
      const records = await ejercicioRepository.listByInstitucion(institucionObjetivo(actor, institucion));
      return records.map(toPublicEjercicio);
    },

    async get(actor, id) {
      return toPublicEjercicio(await findVisible(actor, id));
    },

    async create(actor, input) {
      assertAutor(actor);
      const values = {
        id_ejercicio: randomUUID(),
        numero: parseNumero(input.numero),
        titulo: parseTitulo(input.titulo),
        consigna_html: parseConsigna(input.consigna_html),
        apoyo: input.apoyo === undefined ? null : parseApoyo(input.apoyo),
        // La institución sale del autor; solo el super admin puede indicar otra.
        institucion: institucionObjetivo(actor, input.institucion),
        id_usuario_creador: actor.id_usuario,
      };
      try {
        return toPublicEjercicio(await ejercicioRepository.insert(values));
      } catch (error) {
        throw duplicateNumero(error);
      }
    },

    async update(actor, id, input) {
      assertAutor(actor);
      await findVisible(actor, id);
      const changes = {};
      if (input.numero !== undefined) changes.numero = parseNumero(input.numero);
      if (input.titulo !== undefined) changes.titulo = parseTitulo(input.titulo);
      if (input.consigna_html !== undefined) changes.consigna_html = parseConsigna(input.consigna_html);
      if (input.apoyo !== undefined) changes.apoyo = parseApoyo(input.apoyo);
      if (Object.keys(changes).length === 0) {
        throw new ValidationError("No hay cambios para guardar.");
      }
      try {
        return toPublicEjercicio(await ejercicioRepository.update(id, changes));
      } catch (error) {
        throw duplicateNumero(error);
      }
    },

    async remove(actor, id) {
      assertAutor(actor);
      const record = await findVisible(actor, id);
      await ejercicioRepository.remove(id, record.institucion);
    },
  };
}
