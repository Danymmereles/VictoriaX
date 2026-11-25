import { randomUUID } from "node:crypto";
import {
  AuthenticationError,
  ConflictError,
  DomainRestrictionError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "./errors.js";
import {
  DUMMY_PASSWORD_HASH,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from "./password.js";
import { institucionDesdeEmail } from "./instituciones.js";
import { isDuplicateEntry } from "../db/userRepository.js";
import { esAdmin, esSuperAdmin } from "./roles.js";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ROLES = new Set(["SUPER_ADMIN", "ADMIN", "DOCENTE", "ALUMNO"]);
// El frontend usa los nombres del diagrama de seguridad.
const ROLES_APP = {
  SUPER_ADMINISTRADOR: "SUPER_ADMIN",
  ADMINISTRADOR: "ADMIN",
  DOCENTE: "DOCENTE",
  ESTUDIANTE: "ALUMNO",
};
const NOMBRE_USUARIO = /^[A-Za-z0-9._-]{3,50}$/;

export function normalizeEmail(input) {
  if (typeof input !== "string") {
    throw new ValidationError("El email es obligatorio.");
  }

  const email = input.trim().toLowerCase();
  if (
    email.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new ValidationError("Ingresá un email válido.");
  }
  return email;
}

export function isAcademicEmail(email) {
  return /^[^\s@]+@frba\.utn\.edu\.ar$/.test(email);
}

export function assertAcademicEmail(email) {
  if (!isAcademicEmail(email)) throw new DomainRestrictionError();
}

function assertNewPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new ValidationError("La contraseña debe tener al menos 8 caracteres.");
  }
  if (Buffer.byteLength(password) > 1024) {
    throw new ValidationError("La contraseña es demasiado larga.");
  }
}

function requiredText(value, message, maxLength) {
  if (typeof value !== "string" || !value.trim()) throw new ValidationError(message);
  const text = value.trim();
  if (text.length > maxLength) throw new ValidationError(`${message} (máximo ${maxLength} caracteres).`);
  return text;
}

export function toPublicUser(record) {
  return {
    id_usuario: record.id_usuario,
    nombre_usuario: record.nombre_usuario ?? null,
    email: record.email,
    nombre_completo: record.nombre_completo,
    institucion: record.institucion,
    rol: record.rol,
  };
}

export function createAuthService({ userRepository, now = () => Date.now() }) {
  async function openSession(user) {
    const token = createSessionToken();
    await userRepository.createSession({
      id_sesion: hashSessionToken(token),
      id_usuario: user.id_usuario,
      fecha_expiracion: new Date(now() + SESSION_TTL_MS),
    });
    return token;
  }

  return {
    async register({ email: emailInput, password, nombreCompleto }) {
      const email = normalizeEmail(emailInput);
      assertNewPassword(password);
      const nombre_completo = requiredText(
        nombreCompleto,
        "El nombre completo es obligatorio.",
        255,
      );

      let user;
      try {
        user = await userRepository.insertUser({
          id_usuario: randomUUID(),
          email,
          nombre_completo,
          institucion: institucionDesdeEmail(email),
          rol: "ALUMNO",
          password_hash: await hashPassword(password),
        });
      } catch (error) {
        if (isDuplicateEntry(error)) {
          throw new ConflictError("Ya existe una cuenta con ese email.");
        }
        throw error;
      }

      return { user: toPublicUser(user), accessToken: await openSession(user) };
    },

    async login({ email: emailInput, password }) {
      const email = normalizeEmail(emailInput);
      assertAcademicEmail(email);
      if (typeof password !== "string" || !password) {
        throw new ValidationError("La contraseña es obligatoria.");
      }

      const user = await userRepository.findByEmail(email);
      const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_PASSWORD_HASH);
      if (!user || !valid) throw new AuthenticationError("Email o contraseña incorrectos.");

      return { user: toPublicUser(user), accessToken: await openSession(user) };
    },

    async authenticate(token) {
      if (typeof token !== "string" || !token) return null;
      const sessionId = hashSessionToken(token);
      const user = await userRepository.findUserBySession(sessionId, new Date(now()));
      return user ? { user, sessionId } : null;
    },

    async logout(sessionId) {
      await userRepository.deleteSession(sessionId);
    },

    async changePassword(actor, sessionId, { currentPassword, newPassword }) {
      if (typeof currentPassword !== "string" || !currentPassword) {
        throw new ValidationError("Ingresá tu contraseña actual.");
      }
      assertNewPassword(newPassword);
      if (!(await verifyPassword(currentPassword, actor.password_hash))) {
        throw new ValidationError("La contraseña actual es incorrecta.");
      }
      await userRepository.updateUser(actor.id_usuario, {
        password_hash: await hashPassword(newPassword),
      });
      // Cierra las demás sesiones abiertas con la contraseña anterior.
      await userRepository.deleteOtherSessions(actor.id_usuario, sessionId);
    },

    // El super admin ve todos (o los de la institución pedida); el resto, solo los de la suya.
    async listUsers(actor, { institucion } = {}) {
      const users = !esSuperAdmin(actor)
        ? await userRepository.listByInstitucion(actor.institucion)
        : typeof institucion === "string" && institucion.trim()
          ? await userRepository.listByInstitucion(institucion.trim())
          : await userRepository.listAll();
      return users.map(toPublicUser);
    },

    async updateUser(actor, id, changes) {
      if (!changes || typeof changes !== "object") {
        throw new ValidationError("No hay cambios para guardar.");
      }
      const isAdmin = esAdmin(actor);
      if (!isAdmin && actor.id_usuario !== id) {
        throw new ForbiddenError("Solo un administrador puede editar a otros participantes.");
      }
      const current = await userRepository.findById(id);
      // Un administrador solo gestiona usuarios de su institución; el super admin, de todas.
      if (!current || (!esSuperAdmin(actor) && current.institucion !== actor.institucion)) {
        throw new NotFoundError("No se encontró el participante.");
      }
      if (current.rol === "SUPER_ADMIN" && !esSuperAdmin(actor)) {
        throw new ForbiddenError("Solo un super administrador puede editar a otro super administrador.");
      }

      const update = {};
      if (changes.email !== undefined) {
        const email = normalizeEmail(changes.email);
        if (email !== current.email) update.email = email;
      }
      if (changes.nombre_completo !== undefined) {
        update.nombre_completo = requiredText(
          changes.nombre_completo,
          "El nombre completo es obligatorio.",
          255,
        );
      }
      if (changes.nombre_usuario !== undefined) {
        const nombre = typeof changes.nombre_usuario === "string"
          ? changes.nombre_usuario.trim()
          : "";
        if (nombre && !NOMBRE_USUARIO.test(nombre)) {
          throw new ValidationError(
            "El nombre de usuario debe tener entre 3 y 50 letras, números, puntos, guiones o guiones bajos.",
          );
        }
        update.nombre_usuario = nombre || null;
      }
      if (changes.rol !== undefined) {
        const rol = ROLES_APP[changes.rol] || changes.rol;
        if (!ROLES.has(rol)) throw new ValidationError("El rol seleccionado no es válido.");
        if (rol !== current.rol) {
          if (!isAdmin) throw new ForbiddenError("Solo un administrador puede cambiar roles.");
          if (current.id_usuario === actor.id_usuario) {
            throw new ForbiddenError("El administrador no puede cambiar su propio rol.");
          }
          if (rol === "SUPER_ADMIN" && !esSuperAdmin(actor)) {
            throw new ForbiddenError("Solo un super administrador puede otorgar ese rol.");
          }
          update.rol = rol;
        }
      }
      if (changes.institucion !== undefined) {
        const institucion = requiredText(
          String(changes.institucion ?? ""),
          "La institución es obligatoria.",
          100,
        );
        if (institucion !== current.institucion) {
          if (!isAdmin) {
            throw new ForbiddenError(
              "Solo un administrador puede cambiar la institución de un usuario.",
            );
          }
          update.institucion = institucion;
        }
      }

      if (Object.keys(update).length === 0) return toPublicUser(current);
      try {
        return toPublicUser(await userRepository.updateUser(id, update));
      } catch (error) {
        if (isDuplicateEntry(error)) {
          throw new ConflictError("Ya existe una cuenta con ese email o nombre de usuario.");
        }
        throw error;
      }
    },
  };
}
