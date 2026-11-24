import test from "node:test";
import assert from "node:assert/strict";
import { createAuthService, SESSION_TTL_MS } from "../src/auth/service.js";
import { createAuthMiddleware } from "../src/auth/middleware.js";
import { hashPassword, verifyPassword } from "../src/auth/password.js";
import {
  AuthenticationError,
  ConflictError,
  DomainRestrictionError,
  ForbiddenError,
  ValidationError,
} from "../src/auth/errors.js";

// Repositorio en memoria con la misma interfaz que src/db/userRepository.js.
function createMemoryRepository() {
  const users = new Map();
  const sessions = new Map();
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
    async listByInstitucion(institucion) {
      return [...users.values()].filter((user) => user.institucion === institucion);
    },
    async createSession(row) { sessions.set(row.id_sesion, row); },
    async findUserBySession(id, now) {
      const row = sessions.get(id);
      return row && row.fecha_expiracion > now ? users.get(row.id_usuario) : null;
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
  const service = createAuthService({ userRepository: repo, now: () => clock });
  return { repo, service, advance: (ms) => { clock += ms; } };
}

async function registerAdmin(service, repo, email = "admin@frba.utn.edu.ar") {
  const { user } = await service.register({ email, password: "Secreta123", nombreCompleto: "Admin" });
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

test("registration validates input and stores a hashed ALUMNO", async () => {
  const { repo, service } = setup();
  await assert.rejects(
    service.register({ email: "no-es-email", password: "Secreta123", nombreCompleto: "A" }),
    ValidationError,
  );
  await assert.rejects(
    service.register({ email: "a@frba.utn.edu.ar", password: "corta", nombreCompleto: "A" }),
    ValidationError,
  );

  const result = await service.register({
    email: " Ada@FRBA.utn.edu.ar ",
    password: "Secreta123",
    nombreCompleto: " Ada Lovelace ",
  });
  assert.equal(result.user.email, "ada@frba.utn.edu.ar");
  assert.equal(result.user.rol, "ALUMNO");
  assert.equal(result.user.institucion, "UTN FRBA");
  assert.equal(result.user.nombre_completo, "Ada Lovelace");
  assert.equal("password_hash" in result.user, false);
  assert.equal(typeof result.accessToken, "string");
  assert.notEqual(repo.users.get(result.user.id_usuario).password_hash, "Secreta123");
  // El token se guarda hasheado, no en claro.
  assert.equal(repo.sessions.has(result.accessToken), false);

  await assert.rejects(
    service.register({ email: "ada@frba.utn.edu.ar", password: "Secreta123", nombreCompleto: "Otra" }),
    ConflictError,
  );
});

test("login requires the academic domain and correct credentials", async () => {
  const { service } = setup();
  await service.register({ email: "ada@frba.utn.edu.ar", password: "Secreta123", nombreCompleto: "Ada" });

  await assert.rejects(
    service.login({ email: "ada@gmail.com", password: "Secreta123" }),
    DomainRestrictionError,
  );
  await assert.rejects(
    service.login({ email: "ada@frba.utn.edu.ar", password: "Incorrecta1" }),
    AuthenticationError,
  );
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
});

test("sessions expire after the TTL and end on logout", async () => {
  const { service, advance } = setup();
  const { accessToken } = await service.register({
    email: "ada@frba.utn.edu.ar", password: "Secreta123", nombreCompleto: "Ada",
  });
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
  const { service } = setup();
  const { accessToken } = await service.register({
    email: "ada@frba.utn.edu.ar", password: "Secreta123", nombreCompleto: "Ada",
  });
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

  assert.notEqual(await service.authenticate(accessToken), null);
  assert.equal(await service.authenticate(other), null);
  await assert.rejects(
    service.login({ email: "ada@frba.utn.edu.ar", password: "Secreta123" }),
    AuthenticationError,
  );
  await service.login({ email: "ada@frba.utn.edu.ar", password: "Nueva12345" });
});

test("only admins edit others, roles and institutions", async () => {
  const { repo, service } = setup();
  const admin = await registerAdmin(service, repo);
  const alumno = (await service.register({
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
});

test("listing returns only users of the actor's institution", async () => {
  const { repo, service } = setup();
  const admin = await registerAdmin(service, repo);
  await service.register({ email: "otro@frre.utn.edu.ar", password: "Secreta123", nombreCompleto: "Otro" });
  const users = await service.listUsers(admin);
  assert.deepEqual(users.map((user) => user.email), ["admin@frba.utn.edu.ar"]);
  assert.equal("password_hash" in users[0], false);
});

test("middleware rejects missing tokens and non-academic accounts", async () => {
  const { service } = setup();
  const { accessToken } = await service.register({
    email: "ada@gmail.com", password: "Secreta123", nombreCompleto: "Ada",
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
  assert.deepEqual(await run(`Bearer ${accessToken}`), { status: 403, called: false });
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

