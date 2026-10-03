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
  },
  {
    id_usuario: "22222222-2222-4222-8222-222222222222",
    email: "docente@frba.utn.edu.ar",
    nombre_completo: "Docente de prueba",
    rol: "DOCENTE",
  },
  {
    id_usuario: "33333333-3333-4333-8333-333333333333",
    email: "admin@frba.utn.edu.ar",
    nombre_completo: "Administrador de prueba",
    rol: "ADMIN",
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_ROLES = new Set(["ADMIN", "DOCENTE", "ALUMNO"]);
const APP_ROLES = {
  ADMINISTRADOR: "ADMIN",
  DOCENTE: "DOCENTE",
  ESTUDIANTE: "ALUMNO",
};

function getCrypto() {
  if (!globalThis.crypto?.subtle || !globalThis.crypto.randomUUID) {
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
    return users;
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

function toAppRole(role) {
  return {
    ADMIN: "ADMINISTRADOR",
    DOCENTE: "DOCENTE",
    ALUMNO: "ESTUDIANTE",
  }[role];
}

export const localAuth = {
  async hasAccount(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = await readUsers();
    return users.some((user) => user.email === normalizedEmail);
  },

  async register({ email, password, nombreCompleto }) {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.length > 320 || !EMAIL_PATTERN.test(normalizedEmail)) {
      throw new Error("Ingresá un email válido.");
    }
    if (typeof password !== "string" || password.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres.");
    }
    if (typeof nombreCompleto !== "string" || !nombreCompleto.trim()) {
      throw new Error("El nombre completo es obligatorio.");
    }

    const users = await readUsers();
    if (users.some((user) => user.email === normalizedEmail)) {
      throw new Error("Ya existe una cuenta con ese email.");
    }

    const user = {
      id_usuario: getCrypto().randomUUID(),
      email: normalizedEmail,
      nombre_completo: nombreCompleto.trim(),
      rol: "ALUMNO",
      ...(await hashPassword(password)),
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
    localStorage.setItem(SESSION_KEY, user.id_usuario);
    return publicUser(user);
  },

  async login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = await readUsers();
    const user = users.find((candidate) => candidate.email === normalizedEmail);
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
    const user = users.find((candidate) => candidate.id_usuario === id);
    return user ? publicUser(user) : null;
  },

  async listUsers() {
    const users = await readUsers();
    return users.map((user) => ({
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
    if (!actor) {
      throw new Error("Iniciá sesión para administrar usuarios locales.");
    }

    const targetIndex = users.findIndex((user) => user.id_usuario === id);
    if (targetIndex < 0) throw new Error("No se encontró el participante.");
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
