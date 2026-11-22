import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApiServer } from "../src/http/server.js";
import { ForbiddenError } from "../src/auth/errors.js";

const ORIGIN = "http://localhost:5173";
const USER = {
  id_usuario: "11111111-1111-4111-8111-111111111111",
  email: "alumna@frba.utn.edu.ar",
  nombre_completo: "Ada Lovelace",
  institucion: "UTN FRBA",
  rol: "ALUMNO",
  password_hash: "secreto",
};

async function start(t, authService) {
  const server = createApiServer({
    authService,
    authMiddleware: async (request, response, next) => {
      if (request.headers.authorization !== "Bearer ok") {
        response.writeHead(401);
        response.end();
        return;
      }
      request.user = USER;
      request.sessionId = "session-hash";
      await next();
    },
    frontendOrigin: ORIGIN,
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test("register route returns the created user and token", async (t) => {
  const baseUrl = await start(t, {
    register: async (input) => ({
      user: { id_usuario: "user-uuid", email: input.email, rol: "ALUMNO" },
      accessToken: "token",
    }),
  });
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "alumna@frba.utn.edu.ar" }),
  });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    user: { id_usuario: "user-uuid", email: "alumna@frba.utn.edu.ar", rol: "ALUMNO" },
    accessToken: "token",
  });
});

test("me requires a token and never exposes the password hash", async (t) => {
  const baseUrl = await start(t, {});
  assert.equal((await fetch(`${baseUrl}/api/auth/me`)).status, 401);

  const response = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { authorization: "Bearer ok" },
  });
  assert.equal(response.status, 200);
  const { user } = await response.json();
  assert.equal(user.email, USER.email);
  assert.equal("password_hash" in user, false);
});

test("logout closes the current session", async (t) => {
  let closed;
  const baseUrl = await start(t, { logout: async (id) => { closed = id; } });
  const response = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { authorization: "Bearer ok" },
  });
  assert.equal(response.status, 204);
  assert.equal(closed, "session-hash");
});

test("user update passes the actor and maps domain errors to status codes", async (t) => {
  const baseUrl = await start(t, {
    updateUser: async (actor, id, changes) => {
      if (changes.rol) throw new ForbiddenError("Solo admins.");
      return { id_usuario: id, nombre_completo: changes.nombre_completo, actor: actor.id_usuario };
    },
  });
  const target = "22222222-2222-4222-8222-222222222222";
  const ok = await fetch(`${baseUrl}/api/usuarios/${target}`, {
    method: "PATCH",
    headers: { authorization: "Bearer ok", "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({ nombre_completo: "Nuevo" }),
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("access-control-allow-origin"), ORIGIN);
  assert.deepEqual((await ok.json()).user, {
    id_usuario: target,
    nombre_completo: "Nuevo",
    actor: USER.id_usuario,
  });

  const forbidden = await fetch(`${baseUrl}/api/usuarios/${target}`, {
    method: "PATCH",
    headers: { authorization: "Bearer ok", "content-type": "application/json" },
    body: JSON.stringify({ rol: "ADMIN" }),
  });
  assert.equal(forbidden.status, 403);
  assert.equal((await forbidden.json()).error, "Solo admins.");
});

test("foreign origins are rejected", async (t) => {
  const baseUrl = await start(t, {});
  const response = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { origin: "https://evil.example" },
  });
  assert.equal(response.status, 403);
});
