import test from "node:test";
import assert from "node:assert/strict";
import { createAuthService } from "../src/auth/service.js";
import { createAuthMiddleware } from "../src/auth/middleware.js";
import {
  DomainRestrictionError,
  ValidationError,
} from "../src/auth/errors.js";

const validEmail = "alumna@frba.utn.edu.ar";
const validUser = {
  id_usuario: "aa9e4183-8008-47c1-ae9b-2f84a16a1a23",
  email: validEmail,
  nombre_completo: "Ada Lovelace",
  rol: "ALUMNO",
};

function setup(overrides = {}) {
  const calls = { signUp: 0, signIn: 0, insert: 0, inserted: null, find: 0, delete: 0 };
  const authClient = {
    auth: {
      signUp: async () => {
        calls.signUp += 1;
        return {
          data: {
            user: { id: validUser.id_usuario, identities: [{ id: "identity" }] },
            session: { access_token: "session-token" },
          },
          error: null,
        };
      },
      signInWithPassword: async () => {
        calls.signIn += 1;
        return {
          data: {
            user: { id: validUser.id_usuario },
            session: { access_token: "session-token" },
          },
          error: null,
        };
      },
      getUser: async (token) => {
        calls.token = token;
        return {
          data: { user: { id: validUser.id_usuario, email: validEmail } },
          error: null,
        };
      },
    },
  };
  const adminClient = {
    auth: {
      admin: {
        deleteUser: async () => {
          calls.delete += 1;
          return { error: null };
        },
      },
    },
  };
  const userRepository = {
    insertShadowUser: async (record) => {
      calls.insert += 1;
      calls.inserted = record;
      return validUser;
    },
    findById: async () => {
      calls.find += 1;
      return validUser;
    },
  };
  Object.assign(authClient.auth, overrides.auth);
  Object.assign(adminClient.auth.admin, overrides.admin);
  Object.assign(userRepository, overrides.repository);
  return {
    calls,
    service: createAuthService({ authClient, adminClient, userRepository }),
    authClient,
  };
}

test("registration rejects malformed email before calling Supabase", async () => {
  const { calls, service } = setup();
  await assert.rejects(
    service.register({
      email: "not-an-email",
      password: "long-password",
      nombreCompleto: "Ada Lovelace",
    }),
    ValidationError,
  );
  assert.equal(calls.signUp, 0);
  assert.equal(calls.insert, 0);
});

test("registration allows a valid non-UTN address and gives it the student role", async () => {
  const { calls, service } = setup({
    auth: {
      signUp: async ({ email }) => {
        calls.signUp += 1;
        calls.registeredEmail = email;
        return {
          data: {
            user: { id: validUser.id_usuario, identities: [{ id: "identity" }] },
            session: { access_token: "session-token" },
          },
          error: null,
        };
      },
    },
  });
  const result = await service.register({
    email: " learner@gmail.com ",
    password: "long-password",
    nombreCompleto: "Ada Lovelace",
  });
  assert.equal(calls.registeredEmail, "learner@gmail.com");
  assert.equal(calls.inserted.email, "learner@gmail.com");
  assert.equal(result.user.rol, "ALUMNO");
});

test("registration creates the Supabase identity and ALUMNO shadow record", async () => {
  const { calls, service } = setup();
  const result = await service.register({
    email: " Alumna@FRBA.UTN.EDU.AR ",
    password: "long-password",
    nombreCompleto: " Ada Lovelace ",
  });
  assert.equal(calls.signUp, 1);
  assert.equal(calls.insert, 1);
  assert.deepEqual(calls.inserted, {
    id_usuario: validUser.id_usuario,
    email: validEmail,
    nombre_completo: "Ada Lovelace",
  });
  assert.equal(result.user.id_usuario, validUser.id_usuario);
  assert.equal(result.user.rol, "ALUMNO");
  assert.equal(result.accessToken, "session-token");
});

test("a Supabase failure never attempts the RDS insert", async () => {
  const { calls, service } = setup({
    auth: { signUp: async () => ({ data: { user: null }, error: new Error("auth down") }) },
  });
  await assert.rejects(
    service.register({
      email: validEmail,
      password: "long-password",
      nombreCompleto: "Ada Lovelace",
    }),
    (error) => error.cause?.message === "auth down",
  );
  assert.equal(calls.insert, 0);
  assert.equal(calls.delete, 0);
});

test("an RDS failure compensates by deleting the new Supabase identity", async () => {
  const { calls, service } = setup({
    repository: { insertShadowUser: async () => { throw new Error("RDS down"); } },
  });
  await assert.rejects(
    service.register({
      email: validEmail,
      password: "long-password",
      nombreCompleto: "Ada Lovelace",
    }),
    /se revirtió el alta de Supabase/,
  );
  assert.equal(calls.delete, 1);
});

test("a failed Supabase compensation reports both persistence failures", async () => {
  const { service } = setup({
    repository: { insertShadowUser: async () => { throw new Error("RDS down"); } },
    admin: { deleteUser: async () => ({ error: new Error("cleanup down") }) },
  });
  await assert.rejects(
    service.register({
      email: validEmail,
      password: "long-password",
      nombreCompleto: "Ada Lovelace",
    }),
    (error) =>
      error instanceof AggregateError &&
      error.errors.length === 2 &&
      /compensación/.test(error.message),
  );
});

test("login rejects non-UTN addresses before calling Supabase", async () => {
  const { calls, service } = setup();
  await assert.rejects(
    service.login({ email: "student@gmail.com", password: "password" }),
    DomainRestrictionError,
  );
  assert.equal(calls.signIn, 0);
});

test("login returns the matching shadow user and Supabase access token", async () => {
  const { calls, service } = setup();
  const result = await service.login({ email: validEmail, password: "password" });
  assert.equal(calls.signIn, 1);
  assert.equal(calls.find, 1);
  assert.equal(result.user.id_usuario, validUser.id_usuario);
  assert.equal(result.accessToken, "session-token");
});

test("Bearer middleware validates the token and attaches its UUID", async () => {
  const { authClient, calls } = setup();
  const middleware = createAuthMiddleware(authClient);
  const request = { headers: { authorization: "Bearer valid-token" } };
  const response = {
    writeHead(statusCode) { this.statusCode = statusCode; },
    end(body) { this.body = body; },
  };
  let continued = false;
  await middleware(request, response, async () => { continued = true; });
  assert.equal(continued, true);
  assert.equal(calls.token, "valid-token");
  assert.deepEqual(request.user, { id: validUser.id_usuario, email: validEmail });
});

test("Bearer middleware rejects a missing token without continuing", async () => {
  const { authClient } = setup();
  const middleware = createAuthMiddleware(authClient);
  const request = { headers: {} };
  const response = {
    writeHead(statusCode) { this.statusCode = statusCode; },
    end(body) { this.body = body; },
  };
  let continued = false;
  await middleware(request, response, async () => { continued = true; });
  assert.equal(response.statusCode, 401);
  assert.equal(continued, false);
});

test("Bearer middleware denies non-UTN accounts access to study endpoints", async () => {
  const { authClient, calls } = setup({
    auth: {
      getUser: async (token) => {
        calls.token = token;
        return {
          data: { user: { id: validUser.id_usuario, email: "learner@gmail.com" } },
          error: null,
        };
      },
    },
  });
  const middleware = createAuthMiddleware(authClient);
  const request = { headers: { authorization: "Bearer valid-token" } };
  const response = {
    writeHead(statusCode) { this.statusCode = statusCode; },
    end(body) { this.body = body; },
  };
  let continued = false;
  await middleware(request, response, async () => { continued = true; });
  assert.equal(response.statusCode, 403);
  assert.match(response.body, /exclusivo para la comunidad académica de UTN/);
  assert.equal(continued, false);
});
