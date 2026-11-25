import test from "node:test";
import assert from "node:assert/strict";
import { createAuthService, SESSION_TTL_MS } from "../src/auth/service.js";
import { createAuthMiddleware } from "../src/auth/middleware.js";
import { hashPassword, hashSessionToken, verifyPassword } from "../src/auth/password.js";
import {
  AuthenticationError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from "../src/auth/errors.js";

// Repositorio en memoria con la misma interfaz que src/db/userRepository.js.
function createMemoryRepository() {
  const users = new Map();
  const sessions = new Map();
  const tokens = new Map();
  const duplicate = () => Object.assign(new Error("dup"), { code: "ER_DUP_ENTRY" });
  const assertUnique = (record, id) => {
    for (const other of users.values()) {
      if (other.id_usuario === id) continue;
      if (other.email === record.email) throw duplicate();
      if (record.nombre_usuario && other.nombre_usuario === record.nombre_usuario) throw duplicate();
    }
  };
  return {
    users,
    sessions,
    tokens,
    async findById(id) { return users.get(id) ?? null; },
    async findByEmail(email) {
      return [...users.values()].find((user) => user.email === email) ?? null;
    },
    async insertUser(values) {
      assertUnique(values, values.id_usuario);
      users.set(values.id_usuario, { nombre_usuario: null, ...values });
      return users.get(values.id_usuario);
    },
    async updateUser(id, changes) {
      const next = { ...users.get(id), ...changes };
      assertUnique(next, id);
      users.set(id, next);
      return next;
    },
    async deleteUser(id) {
      users.delete(id);
      for (const [key, sess] of sessions) {
        if (sess.id_usuario === id) sessions.delete(key);
      }
      for (const [key, tok] of tokens) {
        if (tok.id_usuario === id) tokens.delete(key);
      }
    },
    async hasActiveVerificationToken(userId, now) {
      for (const token of tokens.values()) {
        if (token.id_usuario === userId && token.tipo === "VERIFICACION_EMAIL" && !token.usado_en && token.expira_en > now) {
          return true;
        }
      }
      return false;
    },
    async listByInstitucion(institucion) {
      return [...users.values()].filter((user) => user.institucion === institucion);
    },
    async createSession(row) { sessions.set(row.id_sesion, row); },
    async createAuthToken(record, now) {
      for (const token of tokens.values()) {
        if (token.id_usuario === record.id_usuario && token.tipo === record.tipo && !token.usado_en) {
          token.usado_en = now;
        }
      }
      tokens.set(record.token_hash, { ...record });
    },
    async verifyEmailToken(hash, now) {
      const token = tokens.get(hash);
      if (!token || token.tipo !== "VERIFICACION_EMAIL" || token.usado_en || token.expira_en <= now) return null;
      token.usado_en = now;
      users.get(token.id_usuario).email_verificado = true;
      return token.id_usuario;
    },
    async resetPasswordWithToken(hash, password_hash, now) {
      const token = tokens.get(hash);
      if (!token || token.tipo !== "RESET_PASSWORD" || token.usado_en || token.expira_en <= now) return null;
      token.usado_en = now;
      const user = users.get(token.id_usuario);
      user.password_hash = password_hash;
      for (const [id, session] of sessions) {
        if (session.id_usuario === user.id_usuario) sessions.delete(id);
      }
      return user;
    },
    async deleteSessions(userId) {
      for (const [id, session] of sessions) {
        if (session.id_usuario === userId) sessions.delete(id);
      }
    },
    async findUserBySession(id, now) {
      const row = sessions.get(id);
      const user = row && users.get(row.id_usuario);
      return row && row.fecha_expiracion > now && user.email_verificado && user.estado === "ACTIVO"
        ? user
        : null;
    },
    async deleteSession(id) { sessions.delete(id); },
    async deleteOtherSessions(userId, keep) {
      for (const [id, row] of sessions) {
        if (row.id_usuario === userId && id !== keep) sessions.delete(id);
      }
    },
  };
}

function setup() {
  let clock = Date.parse("2026-01-01T00:00:00Z");
  const repo = createMemoryRepository();
  const mailService = {
    verification: [],
    reset: [],
    changed: [],
    updated: [],
    status: [],
    async sendVerificationEmail(input) { this.verification.push(input); },
    async sendPasswordResetEmail(input) { this.reset.push(input); },
    async sendPasswordChangedEmail(input) { this.changed.push(input); },
    async sendAccountUpdatedEmail(input) { this.updated.push(input); },
    async sendAccountStatusEmail(input) { this.status.push(input); },
  };
  const service = createAuthService({
    userRepository: repo,
    mailService,
    frontendOrigin: "https://victoriax.example",
    now: () => clock,
  });
  return { repo, service, mailService, advance: (ms) => { clock += ms; } };
}

async function verifyLatest(service, mailService) {
  const { verifyUrl } = mailService.verification.at(-1);
  const token = new URL(verifyUrl).searchParams.get("token");
  await service.verifyEmail({ token });
  return token;
}

async function registerVerified(service, mailService, details) {
  const result = await service.register({
    ...details,
    confirmPassword: details.password,
  });
  await verifyLatest(service, mailService);
  return result;
}

async function registerAdmin(service, repo, mailService, email = "admin@frba.utn.edu.ar") {
  const { user } = await registerVerified(service, mailService, {
    email, password: "Secreta123", nombreCompleto: "Admin",
  });
  await repo.updateUser(user.id_usuario, { rol: "ADMIN" });
  return repo.findById(user.id_usuario);
}

test("password hashes verify only the original password", async () => {
  const hash = await hashPassword("VictoriaX123");
  assert.match(hash, /^scrypt\$/);
  assert.equal(await verifyPassword("VictoriaX123", hash), true);
  assert.equal(await verifyPassword("otra", hash), false);
  assert.equal(await verifyPassword("VictoriaX123", "basura"), false);
});

test("registration validates exact password confirmation and requires one-time email verification", async () => {
  const { repo, service, mailService } = setup();
  await assert.rejects(
    service.register({ email: "no-es-email", confirmPassword: "Secreta123", password: "Secreta123", nombreCompleto: "A" }),
    ValidationError,
  );
  await assert.rejects(
    service.register({ email: "a@frba.utn.edu.ar", confirmPassword: "corta", password: "corta", nombreCompleto: "A" }),
    ValidationError,
  );
  await assert.rejects(
    service.register({ email: "a@frba.utn.edu.ar", confirmPassword: " Secreta123", password: "Secreta123", nombreCompleto: "A" }),
    /Las contraseñas no coinciden/,
  );

  const result = await service.register({
    email: " Ada@FRBA.utn.edu.ar ",
    password: "Secreta123",
    confirmPassword: "Secreta123",
    nombreCompleto: " Ada Lovelace ",
  });
  assert.equal(result.user.email, "ada@frba.utn.edu.ar");
  assert.equal(result.user.rol, "ALUMNO");
  assert.equal(result.user.institucion, "UTN FRBA");
  assert.equal(result.user.nombre_completo, "Ada Lovelace");
  assert.equal(result.user.email_verificado, false);
  assert.equal(result.user.estado, "ACTIVO");
  assert.equal(result.user.puedeUsarModoEstudio, true);
  assert.equal("password_hash" in result.user, false);
  assert.equal(result.accessToken, null);
  assert.notEqual(repo.users.get(result.user.id_usuario).password_hash, "Secreta123");
  assert.equal(repo.sessions.size, 0);
  assert.equal(mailService.verification.length, 1);
  assert.match(mailService.verification[0].verifyUrl, /^https:\/\/victoriax\.example\/verify-email\?token=/);
  const rawToken = await verifyLatest(service, mailService);
  assert.equal(repo.users.get(result.user.id_usuario).email_verificado, true);
  assert.equal([...repo.tokens.keys()].includes(rawToken), false);
  await assert.rejects(service.verifyEmail({ token: rawToken }), ValidationError);

  await assert.rejects(
    service.register({ email: "ada@frba.utn.edu.ar", confirmPassword: "Secreta123", password: "Secreta123", nombreCompleto: "Otra" }),
    ConflictError,
  );
});

test("login allows any valid email, while email verification and credentials remain required", async () => {
  const { service, mailService } = setup();
  await service.register({
    email: "ada@frba.utn.edu.ar", confirmPassword: "Secreta123", password: "Secreta123", nombreCompleto: "Ada",
  });
  await assert.rejects(
    service.login({ email: "ada@frba.utn.edu.ar", password: "Secreta123" }),
    /Verificá tu email/,
  );

  await assert.rejects(
    service.login({ email: "ada@frba.utn.edu.ar", password: "Incorrecta1" }),
    AuthenticationError,
  );
  await verifyLatest(service, mailService);
  await assert.rejects(
    service.login({ email: "nadie@frba.utn.edu.ar", password: "Secreta123" }),
    AuthenticationError,
  );

  const { user, accessToken } = await service.login({
    email: "ada@frba.utn.edu.ar",
    password: "Secreta123",
  });
  const session = await service.authenticate(accessToken);
  assert.equal(session.user.id_usuario, user.id_usuario);
  assert.equal(user.puedeUsarModoEstudio, true);
});

test("external accounts register as Externa and log in with Modo Libre only; FRRE is academic", async () => {
  const { service, mailService } = setup();
  const external = (await registerVerified(service, mailService, {
    email: "persona@gmail.com",
    password: "Secreta123",
    nombreCompleto: "Persona",
  })).user;
  assert.equal(external.institucion, "Externa");
  assert.equal(external.puedeUsarModoEstudio, false);

  const externalLogin = await service.login({ email: "persona@gmail.com", password: "Secreta123" });
  assert.equal(externalLogin.user.puedeUsarModoEstudio, false);
  assert.equal(typeof externalLogin.accessToken, "string");
  await assert.rejects(service.listUsers(external), ForbiddenError);

  const frre = (await registerVerified(service, mailService, {
    email: "estudiante@frre.utn.edu.ar",
    password: "Secreta123",
    nombreCompleto: "Estudiante",
  })).user;
  assert.equal(frre.institucion, "UTN FRRE");
  assert.equal(frre.puedeUsarModoEstudio, true);
  assert.equal(
    (await service.login({ email: frre.email, password: "Secreta123" })).user.puedeUsarModoEstudio,
    true,
  );
});

test("sessions expire after the TTL and end on logout", async () => {
  const { service, mailService, advance } = setup();
  await registerVerified(service, mailService, {
    email: "ada@frba.utn.edu.ar", password: "Secreta123", nombreCompleto: "Ada",
  });
  const accessToken = (await service.login({ email: "ada@frba.utn.edu.ar", password: "Secreta123" })).accessToken;
  const second = (await service.login({ email: "ada@frba.utn.edu.ar", password: "Secreta123" })).accessToken;

  const { sessionId } = await service.authenticate(accessToken);
  await service.logout(sessionId);
  assert.equal(await service.authenticate(accessToken), null);
  assert.notEqual(await service.authenticate(second), null);

  advance(SESSION_TTL_MS + 1);
  assert.equal(await service.authenticate(second), null);
  assert.equal(await service.authenticate("token-inventado"), null);
});

test("changing the password checks the current one and closes other sessions", async () => {
  const { service, mailService } = setup();
  await registerVerified(service, mailService, {
    email: "ada@frba.utn.edu.ar", password: "Secreta123", nombreCompleto: "Ada",
  });
  const accessToken = (await service.login({ email: "ada@frba.utn.edu.ar", password: "Secreta123" })).accessToken;
  const other = (await service.login({ email: "ada@frba.utn.edu.ar", password: "Secreta123" })).accessToken;
  const { user, sessionId } = await service.authenticate(accessToken);

  await assert.rejects(
    service.changePassword(user, sessionId, { currentPassword: "mal", newPassword: "Nueva12345" }),
    /actual es incorrecta/,
  );
  await service.changePassword(user, sessionId, {
    currentPassword: "Secreta123",
    newPassword: "Nueva12345",
  });
  assert.equal(mailService.changed.length, 1);

  assert.notEqual(await service.authenticate(accessToken), null);
  assert.equal(await service.authenticate(other), null);
  await assert.rejects(
    service.login({ email: "ada@frba.utn.edu.ar", password: "Secreta123" }),
    AuthenticationError,
  );
  await service.login({ email: "ada@frba.utn.edu.ar", password: "Nueva12345" });
});

test("password recovery uses a one-hour, one-time token and revokes sessions", async () => {
  const { repo, service, mailService, advance } = setup();
  await registerVerified(service, mailService, {
    email: "ada@frba.utn.edu.ar", password: "Secreta123", nombreCompleto: "Ada",
  });
  const session = (await service.login({ email: "ada@frba.utn.edu.ar", password: "Secreta123" })).accessToken;

  await service.forgotPassword({ email: " ADA@FRBA.UTN.EDU.AR " });
  const { resetUrl } = mailService.reset[0];
  const token = new URL(resetUrl).searchParams.get("token");
  const tokenHash = [...repo.tokens.keys()].find((hash) =>
    repo.tokens.get(hash).tipo === "RESET_PASSWORD");
  assert.ok(tokenHash);
  assert.notEqual(tokenHash, token);
  assert.equal(repo.tokens.get(tokenHash).expira_en.getTime(), Date.parse("2026-01-01T01:00:00Z"));
  assert.notEqual(await service.authenticate(session), null);

  await service.resetPassword({ token, newPassword: "NuevaClave123" });
  assert.equal(repo.sessions.size, 0);
  assert.equal(mailService.changed.length, 1);
  assert.equal(await service.authenticate(session), null);
  await assert.rejects(service.resetPassword({ token, newPassword: "OtraClave123" }), ValidationError);
  await service.login({ email: "ada@frba.utn.edu.ar", password: "NuevaClave123" });

  await service.forgotPassword({ email: "ada@frba.utn.edu.ar" });
  const expiredToken = new URL(mailService.reset.at(-1).resetUrl).searchParams.get("token");
  advance(60 * 60 * 1000 + 1);
  await assert.rejects(service.resetPassword({ token: expiredToken, newPassword: "NuevaClave123" }), ValidationError);
});

test("only admins edit others, roles and institutions", async () => {
  const { repo, service, mailService } = setup();
  const admin = await registerAdmin(service, repo, mailService);
  const alumno = (await registerVerified(service, mailService, {
    email: "alumno@frba.utn.edu.ar", password: "Secreta123", nombreCompleto: "Alumno",
  })).user;
  const alumnoRecord = await repo.findById(alumno.id_usuario);

  const own = await service.updateUser(alumnoRecord, alumno.id_usuario, {
    nombre_completo: "Alumno Editado",
    nombre_usuario: "alumno.1",
    rol: "ESTUDIANTE",
    institucion: "UTN FRBA",
  });
  assert.equal(own.nombre_completo, "Alumno Editado");
  assert.equal(own.nombre_usuario, "alumno.1");

  await assert.rejects(service.updateUser(alumnoRecord, admin.id_usuario, { nombre_completo: "X" }), ForbiddenError);
  await assert.rejects(service.updateUser(alumnoRecord, alumno.id_usuario, { rol: "ADMINISTRADOR" }), ForbiddenError);
  await assert.rejects(service.updateUser(alumnoRecord, alumno.id_usuario, { institucion: "UTN FRRE" }), ForbiddenError);
  await assert.rejects(service.updateUser(admin, admin.id_usuario, { rol: "DOCENTE" }), ForbiddenError);
  await assert.rejects(service.updateUser(admin, alumno.id_usuario, { email: "admin@frba.utn.edu.ar" }), ConflictError);

  const promoted = await service.updateUser(admin, alumno.id_usuario, { rol: "DOCENTE" });
  assert.equal(promoted.rol, "DOCENTE");
  assert.equal(mailService.updated.at(-1).cambios.Rol, "DOCENTE");
});

test("email changes require reverification and suspension revokes sessions", async () => {
  const { repo, service, mailService } = setup();
  const admin = await registerAdmin(service, repo, mailService);
  const { user } = await registerVerified(service, mailService, {
    email: "alumno@frba.utn.edu.ar", password: "Secreta123", nombreCompleto: "Alumno",
  });
  const session = (await service.login({
    email: user.email,
    password: "Secreta123",
  })).accessToken;

  const changedEmail = await service.updateUser(user, user.id_usuario, {
    email: "alumno.nuevo@frba.utn.edu.ar",
  });
  assert.equal(changedEmail.email_verificado, false);
  assert.equal(repo.sessions.size, 0);
  assert.equal(mailService.verification.at(-1).to, "alumno.nuevo@frba.utn.edu.ar");
  await assert.rejects(
    service.login({ email: "alumno.nuevo@frba.utn.edu.ar", password: "Secreta123" }),
    /Verificá tu email/,
  );
  await verifyLatest(service, mailService);

  const newSession = (await service.login({
    email: "alumno.nuevo@frba.utn.edu.ar",
    password: "Secreta123",
  })).accessToken;
  const currentUser = await repo.findById(user.id_usuario);
  await service.updateUser(admin, user.id_usuario, { estado: "SUSPENDIDO" });
  assert.equal(repo.sessions.size, 0);
  assert.equal(mailService.status.at(-1).estado, "SUSPENDIDO");
  assert.equal(await service.authenticate(newSession), null);
  await assert.rejects(
    service.login({ email: "alumno.nuevo@frba.utn.edu.ar", password: "Secreta123" }),
    /suspendida/,
  );
  await assert.rejects(
    service.updateUser(currentUser, user.id_usuario, { estado: "ACTIVO" }),
    ForbiddenError,
  );
});

test("listing returns only users of the actor's institution", async () => {
  const { repo, service, mailService } = setup();
  const admin = await registerAdmin(service, repo, mailService);
  await registerVerified(service, mailService, {
    email: "otro@frre.utn.edu.ar", password: "Secreta123", nombreCompleto: "Otro",
  });
  const users = await service.listUsers(admin);
  assert.deepEqual(users.map((user) => user.email), ["admin@frba.utn.edu.ar"]);
  assert.equal("password_hash" in users[0], false);
});

test("middleware rejects missing tokens and permits authenticated external users", async () => {
  const { repo, service, mailService } = setup();
  const { user } = await registerVerified(service, mailService, {
    email: "ada@gmail.com", password: "Secreta123", nombreCompleto: "Ada",
  });
  const accessToken = "non-academic-session";
  await repo.createSession({
    id_sesion: hashSessionToken(accessToken),
    id_usuario: user.id_usuario,
    fecha_expiracion: new Date("2026-01-02T00:00:00Z"),
  });
  const middleware = createAuthMiddleware(service);
  const run = async (authorization) => {
    const response = {
      writeHead(status) { this.status = status; },
      end() {},
    };
    let called = false;
    await middleware({ headers: { authorization } }, response, () => { called = true; });
    return { status: response.status, called };
  };

  assert.deepEqual(await run(undefined), { status: 401, called: false });
  assert.deepEqual(await run("Bearer invalido"), { status: 401, called: false });
  assert.deepEqual(await run(`Bearer ${accessToken}`), { status: undefined, called: true });
});

test("passwords must meet security criteria (min length, uppercase, lowercase, number/special)", async () => {
  const { service } = setup();

  // Débiles: longitud menor a 8
  await assert.rejects(
    service.register({ email: "test1@frba.utn.edu.ar", password: "123456", nombreCompleto: "Test" }),
    (err) => err instanceof ValidationError && /al menos 8 caracteres/i.test(err.message),
  );
  await assert.rejects(
    service.register({ email: "test2@frba.utn.edu.ar", password: "Abc1!", nombreCompleto: "Test" }),
    (err) => err instanceof ValidationError && /al menos 8 caracteres/i.test(err.message),
  );

  // Débiles: sin mayúsculas
  await assert.rejects(
    service.register({ email: "test3@frba.utn.edu.ar", password: "secreta123", nombreCompleto: "Test" }),
    (err) => err instanceof ValidationError && /mayúsculas/i.test(err.message),
  );

  // Débiles: sin minúsculas
  await assert.rejects(
    service.register({ email: "test4@frba.utn.edu.ar", password: "SECRETA123", nombreCompleto: "Test" }),
    (err) => err instanceof ValidationError && /minúsculas/i.test(err.message),
  );

  // Débiles: sin números ni caracteres especiales
  await assert.rejects(
    service.register({ email: "test5@frba.utn.edu.ar", password: "SecretaPassword", nombreCompleto: "Test" }),
    (err) => err instanceof ValidationError && /número o carácter especial/i.test(err.message),
  );

  // Seguras: con número o con símbolo especial
  const ok1 = await service.register({
    email: "ok1@frba.utn.edu.ar",
    password: "Secreta123",
    nombreCompleto: "Ok Uno",
  });
  assert.ok(ok1.accessToken);

  const ok2 = await service.register({
    email: "ok2@frba.utn.edu.ar",
    password: "Password!Segura",
    nombreCompleto: "Ok Dos",
  });
  assert.ok(ok2.accessToken);

  // Al cambiar contraseña también se rechaza una débil
  const session = await service.authenticate(ok1.accessToken);
  await assert.rejects(
    service.changePassword(session.user, session.sessionId, {
      currentPassword: "Secreta123",
      newPassword: "debil",
    }),
    (err) => err instanceof ValidationError && /al menos 8 caracteres/i.test(err.message),
  );

  // Y se acepta una segura
  await service.changePassword(session.user, session.sessionId, {
    currentPassword: "Secreta123",
    newPassword: "NuevaPassword2024!",
  });
});

