import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  AuthenticationError,
  ConflictError,
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
import { createMailService } from "../mail/mailService.js";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const ROLES = new Set(["ADMIN", "DOCENTE", "ALUMNO"]);
// El frontend usa los nombres del diagrama de seguridad.
const ROLES_APP = { ADMINISTRADOR: "ADMIN", DOCENTE: "DOCENTE", ESTUDIANTE: "ALUMNO" };
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
  return /^[^\s@]+@(frba|frre)\.utn\.edu\.ar$/i.test(String(email ?? "").trim());
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

function hashOpaqueToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function toPublicUser(record) {
  return {
    id_usuario: record.id_usuario,
    nombre_usuario: record.nombre_usuario ?? null,
    email: record.email,
    nombre_completo: record.nombre_completo,
    institucion: record.institucion,
    rol: record.rol,
    email_verificado: record.email_verificado,
    estado: record.estado,
    puedeUsarModoEstudio: isAcademicEmail(record.email),
  };
}

export function createAuthService({
  userRepository,
  mailService = createMailService(),
  frontendOrigin = "http://localhost:5173",
  now = () => Date.now(),
}) {
  const appOrigin = String(frontendOrigin).split(",")[0].trim().replace(/\/$/, "");

  async function openSession(user) {
    const token = createSessionToken();
    await userRepository.createSession({
      id_sesion: hashSessionToken(token),
      id_usuario: user.id_usuario,
      fecha_expiracion: new Date(now() + SESSION_TTL_MS),
    });
    return token;
  }

  async function createAuthToken(user, tipo, ttl, path, queryName) {
    const token = randomBytes(32).toString("base64url");
    const currentTime = new Date(now());
    await userRepository.createAuthToken({
      id_token: randomUUID(),
      id_usuario: user.id_usuario,
      token_hash: hashOpaqueToken(token),
      tipo,
      expira_en: new Date(currentTime.getTime() + ttl),
      usado_en: null,
      fecha_creacion: currentTime,
    }, currentTime);
    const url = new URL(path, appOrigin);
    url.searchParams.set(queryName, token);
    return url.toString();
  }

  return {
    async register({ email: emailInput, confirmPassword, password, nombreCompleto }) {
      const email = normalizeEmail(emailInput);
      if (typeof confirmPassword !== "string" || confirmPassword !== password) {
        throw new ValidationError("Las contraseñas no coinciden.");
      }
      assertNewPassword(password);
      const nombre_completo = requiredText(
        nombreCompleto,
        "El nombre completo es obligatorio.",
        255,
      );

      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        if (!existingUser.email_verificado) {
          const createdAt = existingUser.fecha_creacion ? new Date(existingUser.fecha_creacion).getTime() : 0;
          const isExpiredByTime = (now() - createdAt) >= VERIFICATION_TTL_MS;
          const hasActiveToken = userRepository.hasActiveVerificationToken
            ? await userRepository.hasActiveVerificationToken(existingUser.id_usuario, new Date(now()))
            : !isExpiredByTime;

          if (isExpiredByTime || !hasActiveToken) {
            await userRepository.deleteUser(existingUser.id_usuario);
          } else {
            throw new ConflictError("Ya existe una cuenta con ese email.");
          }
        } else {
          throw new ConflictError("Ya existe una cuenta con ese email.");
        }
      }

      const currentTime = new Date(now());
      let user;
      try {
        user = await userRepository.insertUser({
          id_usuario: randomUUID(),
          email,
          nombre_completo,
          institucion: institucionDesdeEmail(email),
          rol: "ALUMNO",
          password_hash: await hashPassword(password),
          email_verificado: false,
          estado: "ACTIVO",
          fecha_creacion: currentTime,
          fecha_actualizacion: currentTime,
        });
      } catch (error) {
        if (isDuplicateEntry(error)) {
          throw new ConflictError("Ya existe una cuenta con ese email.");
        }
        throw error;
      }

      try {
        const verifyUrl = await createAuthToken(
          user,
          "VERIFICACION_EMAIL",
          VERIFICATION_TTL_MS,
          "/verify-email",
          "token",
        );
        await mailService.sendVerificationEmail({
          to: user.email,
          nombre: user.nombre_completo,
          verifyUrl,
        });
      } catch (error) {
        try {
          await userRepository.deleteUser(user.id_usuario);
        } catch (cleanupError) {
          throw new AggregateError(
            [error, cleanupError],
            "No se pudo completar el registro ni revertir la cuenta creada.",
            { cause: error },
          );
        }
        throw error;
      }
      return { user: toPublicUser(user), accessToken: null };
    },

    async verifyEmail({ token }) {
      if (typeof token !== "string" || !token) {
        throw new ValidationError("El enlace de verificación no es válido.");
      }
      const userId = await userRepository.verifyEmailToken(
        hashOpaqueToken(token),
        new Date(now()),
      );
      if (!userId) {
        throw new ValidationError("El enlace de verificación venció o ya fue utilizado.");
      }
    },

    async resendVerification({ email: emailInput }) {
      const genericMessage =
        "Si existe una cuenta pendiente de verificación con ese email, se envió un nuevo enlace.";
      if (typeof emailInput !== "string" || !emailInput.trim()) {
        return { message: genericMessage };
      }
      let email;
      try {
        email = normalizeEmail(emailInput);
      } catch (error) {
        if (error instanceof ValidationError) {
          return { message: genericMessage };
        }
        throw error;
      }

      const user = await userRepository.findByEmail(email);
      if (!user || user.email_verificado || user.estado !== "ACTIVO") {
        return { message: genericMessage };
      }

      const verifyUrl = await createAuthToken(
        user,
        "VERIFICACION_EMAIL",
        VERIFICATION_TTL_MS,
        "/verify-email",
        "token",
      );
      await mailService.sendVerificationEmail({
        to: user.email,
        nombre: user.nombre_completo,
        verifyUrl,
      });

      return { message: genericMessage };
    },

    async forgotPassword({ email: emailInput }) {
      if (typeof emailInput !== "string" || !emailInput.trim()) return;
      let email;
      try {
        email = normalizeEmail(emailInput);
      } catch (error) {
        if (error instanceof ValidationError) return;
        throw error;
      }
      const user = await userRepository.findByEmail(email);
      if (!user || user.estado !== "ACTIVO") return;

      const resetUrl = await createAuthToken(
        user,
        "RESET_PASSWORD",
        PASSWORD_RESET_TTL_MS,
        "/reset-password",
        "token",
      );
      await mailService.sendPasswordResetEmail({
        to: user.email,
        nombre: user.nombre_completo,
        resetUrl,
      });
    },

    async resetPassword({ token, newPassword }) {
      if (typeof token !== "string" || !token) {
        throw new ValidationError("El enlace para cambiar la contraseña no es válido.");
      }
      assertNewPassword(newPassword);
      const user = await userRepository.resetPasswordWithToken(
        hashOpaqueToken(token),
        await hashPassword(newPassword),
        new Date(now()),
      );
      if (!user) {
        throw new ValidationError("El enlace para cambiar la contraseña venció o ya fue utilizado.");
      }
      await mailService.sendPasswordChangedEmail({
        to: user.email,
        nombre: user.nombre_completo,
      });
    },

    async login({ email: emailInput, password }) {
      const email = normalizeEmail(emailInput);
      if (typeof password !== "string" || !password) {
        throw new ValidationError("La contraseña es obligatoria.");
      }

      const user = await userRepository.findByEmail(email);
      const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_PASSWORD_HASH);
      if (!user || !valid) throw new AuthenticationError("Email o contraseña incorrectos.");
      if (!user.email_verificado) {
        throw new ForbiddenError("Verificá tu email antes de iniciar sesión.");
      }
      if (user.estado === "SUSPENDIDO") {
        throw new ForbiddenError("Tu cuenta está suspendida. Contactá al equipo de VictoriaX.");
      }

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
      await mailService.sendPasswordChangedEmail({
        to: actor.email,
        nombre: actor.nombre_completo,
      });
    },

    async deleteAccount(actor, { password }) {
      if (typeof password !== "string" || !password) {
        throw new ValidationError("La contraseña es obligatoria.");
      }
      if (!(await verifyPassword(password, actor.password_hash))) {
        throw new ValidationError("La contraseña actual es incorrecta.");
      }
      await userRepository.deleteSessions(actor.id_usuario);
      await userRepository.deleteUser(actor.id_usuario);
    },

    async listUsers(actor) {
      if (toPublicUser(actor).puedeUsarModoEstudio !== true) {
        throw new ForbiddenError("El listado de participantes requiere una cuenta académica FRBA o FRRE.");
      }
      const users = await userRepository.listByInstitucion(actor.institucion);
      return users.map(toPublicUser);
    },

    async updateUser(actor, id, changes) {
      if (!changes || typeof changes !== "object") {
        throw new ValidationError("No hay cambios para guardar.");
      }
      const isAdmin = actor.rol === "ADMIN";
      if (!isAdmin && actor.id_usuario !== id) {
        throw new ForbiddenError("Solo un administrador puede editar a otros participantes.");
      }
      const current = await userRepository.findById(id);
      if (!current) throw new NotFoundError("No se encontró el participante.");

      const update = {};
      let emailChanged = false;
      const notificationChanges = {};
      if (changes.email !== undefined) {
        const email = normalizeEmail(changes.email);
        if (email !== current.email) {
          update.email = email;
          update.email_verificado = false;
          emailChanged = true;
        }
      }
      if (changes.nombre_completo !== undefined) {
        const nombre = requiredText(
          changes.nombre_completo,
          "El nombre completo es obligatorio.",
          255,
        );
        if (nombre !== current.nombre_completo) {
          update.nombre_completo = nombre;
          notificationChanges["Nombre completo"] = nombre;
        }
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
        const nombreUsuario = nombre || null;
        if (nombreUsuario !== current.nombre_usuario) {
          update.nombre_usuario = nombreUsuario;
          notificationChanges["Nombre de usuario"] = nombreUsuario || "Sin definir";
        }
      }
      if (changes.rol !== undefined) {
        const rol = ROLES_APP[changes.rol] || changes.rol;
        if (!ROLES.has(rol)) throw new ValidationError("El rol seleccionado no es válido.");
        if (rol !== current.rol) {
          if (!isAdmin) throw new ForbiddenError("Solo un administrador puede cambiar roles.");
          if (current.id_usuario === actor.id_usuario) {
            throw new ForbiddenError("El administrador no puede cambiar su propio rol.");
          }
          update.rol = rol;
          notificationChanges.Rol = rol;
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
          notificationChanges.Institución = institucion;
        }
      }

      if (changes.estado !== undefined) {
        if (!["ACTIVO", "SUSPENDIDO"].includes(changes.estado)) {
          throw new ValidationError("El estado seleccionado no es válido.");
        }
        if (changes.estado !== current.estado) {
          if (!isAdmin) {
            throw new ForbiddenError("Solo un administrador puede cambiar el estado de una cuenta.");
          }
          update.estado = changes.estado;
        }
      }

      if (Object.keys(update).length === 0) return toPublicUser(current);
      try {
        const updated = await userRepository.updateUser(id, update);
        if (emailChanged) {
          await userRepository.deleteSessions(id);
          const verifyUrl = await createAuthToken(
            updated,
            "VERIFICACION_EMAIL",
            VERIFICATION_TTL_MS,
            "/verify-email",
            "token",
          );
          await mailService.sendVerificationEmail({
            to: updated.email,
            nombre: updated.nombre_completo,
            verifyUrl,
          });
        }
        if (update.estado === "SUSPENDIDO") {
          await userRepository.deleteSessions(id);
          await mailService.sendAccountStatusEmail({
            to: updated.email,
            nombre: updated.nombre_completo,
            estado: updated.estado,
          });
        }
        if (Object.keys(notificationChanges).length) {
          await mailService.sendAccountUpdatedEmail({
            to: updated.email,
            nombre: updated.nombre_completo,
            cambios: notificationChanges,
          });
        }
        return toPublicUser(updated);
      } catch (error) {
        if (isDuplicateEntry(error)) {
          throw new ConflictError("Ya existe una cuenta con ese email o nombre de usuario.");
        }
        throw error;
      }
    },
  };
}
