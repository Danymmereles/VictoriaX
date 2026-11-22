import { institucionDesdeEmail, normalizarInstitucion } from "@/lib/instituciones";

const SESSION_KEY = "victoriax-local-user";
const USERS_KEY = "victoriax-local-users";
const LOCAL_PASSWORD = "VictoriaX123";
const PASSWORD_HASH_ITERATIONS = 120_000;

const SEED_USERS = [
  {
    id_usuario: "11111111-1111-4111-8111-111111111111",
    email: "alumno@frba.utn.edu.ar",
    nombre_completo: "Alumno de prueba",
    rol: "ALUMNO",
    institucion: "UTN FRBA",
  },
  {
    id_usuario: "22222222-2222-4222-8222-222222222222",
    email: "docente@frba.utn.edu.ar",
    nombre_completo: "Docente de prueba",
    rol: "DOCENTE",
    institucion: "UTN FRBA",
  },
  {
    id_usuario: "33333333-3333-4333-8333-333333333333",
    email: "admin@frba.utn.edu.ar",
    nombre_completo: "Administrador de prueba",
    rol: "ADMIN",
    institucion: "UTN FRBA",
  },
  {
    id_usuario: "44444444-4444-4444-8444-444444444444",
    email: "docente@frre.utn.edu.ar",
    nombre_completo: "Docente de prueba (Resistencia)",
    rol: "DOCENTE",
    institucion: "UTN FRRE",
  },
  {
    id_usuario: "55555555-5555-4555-8555-555555555555",
    email: "admin@frre.utn.edu.ar",
    nombre_completo: "Administrador de prueba (Resistencia)",
    rol: "ADMIN",
    institucion: "UTN FRRE",
  },
];
const SEED_USER_IDS = new Set(SEED_USERS.map((user) => user.id_usuario));

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_ROLES = new Set(["ADMIN", "DOCENTE", "ALUMNO"]);
const APP_ROLES = {
  ADMINISTRADOR: "ADMIN",
  DOCENTE: "DOCENTE",
  ESTUDIANTE: "ALUMNO",
};

function getCrypto() {
  if (!globalThis.crypto?.subtle || !globalThis.crypto.getRandomValues) {
    throw new Error("El navegador debe permitir Web Crypto para usar el modo local.");
  }
  return globalThis.crypto;
}

function toHex(bytes) {
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function derivePassword(password, salt) {
  const crypto = getCrypto();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new TextEncoder().encode(salt),
      iterations: PASSWORD_HASH_ITERATIONS,
    },
    key,
    256,
  );
  return toHex(bits);
}

async function hashPassword(password) {
  const salt = toHex(getCrypto().getRandomValues(new Uint8Array(16)));
  return {
    password_salt: salt,
    password_hash: await derivePassword(password, salt),
  };
}

function publicUser(user) {
  const { password_hash, password_salt, ...safeUser } = user;
  return safeUser;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isSeedUser(user) {
  return SEED_USER_IDS.has(user.id_usuario);
}

function isDemoEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (SEED_USERS.some((user) => user.email === normalizedEmail)) return true;

  const saved = localStorage.getItem(USERS_KEY);
  if (!saved) return false;
  const users = JSON.parse(saved);
  if (!Array.isArray(users)) {
    throw new Error("El registro de usuarios locales no tiene un formato válido.");
  }
  return users.some(
    (user) =>
      isSeedUser(user) &&
      typeof user.email === "string" &&
      normalizeEmail(user.email) === normalizedEmail,
  );
}

async function readUsers() {
  const saved = localStorage.getItem(USERS_KEY);
  if (saved) {
    const users = JSON.parse(saved);
    if (
      !Array.isArray(users) ||
      users.some(
        (user) =>
          typeof user.id_usuario !== "string" ||
          typeof user.email !== "string" ||
          !USER_ROLES.has(user.rol) ||
          typeof user.password_hash !== "string" ||
          typeof user.password_salt !== "string",
      )
    ) {
      throw new Error("El registro de usuarios locales no tiene un formato válido.");
    }
    return sincronizarUsuarios(users);
  }

  const users = await Promise.all(
    SEED_USERS.map(async (user) => ({
      ...user,
      ...(await hashPassword(LOCAL_PASSWORD)),
    })),
  );
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return users;
}

// Agrega la institución a los usuarios guardados y suma las cuentas demo nuevas,
// para que los navegadores que ya tenían cuentas locales las reciban igual.
async function sincronizarUsuarios(users) {
  const normalizados = users.map((user) => ({
    ...user,
    institucion: normalizarInstitucion(
      user.institucion || institucionDesdeEmail(user.email),
    ),
  }));

  for (const seed of SEED_USERS) {
    if (!normalizados.some((user) => user.id_usuario === seed.id_usuario)) {
      normalizados.push({ ...seed, ...(await hashPassword(LOCAL_PASSWORD)) });
    }
  }

  const serializado = JSON.stringify(normalizados);
  if (serializado !== localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, serializado);
  }
  return normalizados;
}

function toAppRole(role) {
  return {
    ADMIN: "ADMINISTRADOR",
    DOCENTE: "DOCENTE",
    ALUMNO: "ESTUDIANTE",
  }[role];
}

export const localAuth = {
  isDemoEmail,

  async login({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    if (!isDemoEmail(normalizedEmail)) {
      throw new Error("Las cuentas nuevas deben autenticarse con Supabase.");
    }
    const users = await readUsers();
    const user = users.find(
      (candidate) =>
        isSeedUser(candidate) &&
        normalizeEmail(candidate.email) === normalizedEmail,
    );
    if (
      !user ||
      typeof password !== "string" ||
      (await derivePassword(password, user.password_salt)) !== user.password_hash
    ) {
      throw new Error("Email o contraseña incorrectos.");
    }

    localStorage.setItem(SESSION_KEY, user.id_usuario);
    return publicUser(user);
  },

  async me() {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    const users = await readUsers();
    const user = users.find(
      (candidate) => candidate.id_usuario === id && isSeedUser(candidate),
    );
    if (!user) localStorage.removeItem(SESSION_KEY);
    return user ? publicUser(user) : null;
  },

  async updatePassword({ currentPassword, newPassword }) {
    if (typeof currentPassword !== "string" || !currentPassword) {
      throw new Error("Ingresá tu contraseña actual.");
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
    }

    const users = await readUsers();
    const id = localStorage.getItem(SESSION_KEY);
    const targetIndex = users.findIndex(
      (user) => user.id_usuario === id && isSeedUser(user),
    );
    if (targetIndex < 0) {
      throw new Error("Iniciá sesión para cambiar tu contraseña demo.");
    }

    const current = users[targetIndex];
    if (
      typeof currentPassword !== "string" ||
      (await derivePassword(currentPassword, current.password_salt)) !== current.password_hash
    ) {
      throw new Error("La contraseña actual es incorrecta.");
    }

    const updated = {
      ...current,
      ...(await hashPassword(newPassword)),
    };
    const result = users.slice();
    result[targetIndex] = updated;
    localStorage.setItem(USERS_KEY, JSON.stringify(result));
  },

  async listUsers() {
    const users = await readUsers();
    return users.filter(isSeedUser).map((user) => ({
      ...publicUser(user),
      id: user.id_usuario,
      rol: toAppRole(user.rol),
    }));
  },

  async updateUser(id, changes) {
    const users = await readUsers();
    const actor = users.find(
      (user) => user.id_usuario === localStorage.getItem(SESSION_KEY),
    );
    if (!actor || !isSeedUser(actor)) {
      throw new Error("Iniciá sesión para administrar usuarios locales.");
    }

    const targetIndex = users.findIndex((user) => user.id_usuario === id);
    if (targetIndex < 0 || !isSeedUser(users[targetIndex])) {
      throw new Error("No se encontró el participante demo.");
    }
    if (actor.rol !== "ADMIN" && actor.id_usuario !== id) {
      throw new Error("Solo el administrador local puede cambiar participantes y roles.");
    }

    const current = users[targetIndex];
    const updated = { ...current };
    if (changes.email !== undefined) {
      const email = changes.email.trim().toLowerCase();
      if (email.length > 320 || !EMAIL_PATTERN.test(email)) {
        throw new Error("Ingresá un email válido.");
      }
      if (users.some((user, index) => index !== targetIndex && user.email === email)) {
        throw new Error("Ya existe una cuenta con ese email.");
      }
      updated.email = email;
    }
    if (changes.nombre_completo !== undefined) {
      if (!changes.nombre_completo.trim()) {
        throw new Error("El nombre completo es obligatorio.");
      }
      updated.nombre_completo = changes.nombre_completo.trim();
    }
    if (changes.rol !== undefined) {
      if (actor.rol !== "ADMIN") {
        throw new Error("Solo el administrador local puede cambiar roles.");
      }
      const role = APP_ROLES[changes.rol] || changes.rol;
      if (!USER_ROLES.has(role)) throw new Error("El rol seleccionado no es válido.");
      if (current.id_usuario === actor.id_usuario && role !== current.rol) {
        throw new Error("El administrador no puede cambiar su propio rol local.");
      }
      updated.rol = role;
    }
    if (changes.institucion !== undefined) {
      const institucion = String(changes.institucion).trim();
      if (!institucion) throw new Error("La institución es obligatoria.");
      if (institucion !== current.institucion && actor.rol !== "ADMIN") {
        throw new Error("Solo el administrador local puede cambiar la institución de un usuario.");
      }
      updated.institucion = institucion;
    }

    const result = users.slice();
    result[targetIndex] = updated;
    localStorage.setItem(USERS_KEY, JSON.stringify(result));
    return {
      ...publicUser(updated),
      id: updated.id_usuario,
      rol: toAppRole(updated.rol),
    };
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },
};