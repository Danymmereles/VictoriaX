import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApiServer } from "../src/http/server.js";

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

test("register route returns the created identity", async (t) => {
  const server = createApiServer({
    authService: {
      register: async (input) => ({
        user: { id_usuario: "user-uuid", email: input.email, rol: "ALUMNO" },
        accessToken: null,
      }),
      login: async () => {
        throw new Error("unexpected login");
      },
    },
    authMiddleware: async () => {
      throw new Error("unexpected protected request");
    },
    userRepository: {},
    frontendOrigin: "http://localhost:5173",
  });
  const baseUrl = await listen(server);
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "alumna@frba.utn.edu.ar" }),
  });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).user.id_usuario, "user-uuid");
});

test("current-user route runs token middleware before reading the shadow row", async (t) => {
  let attachedId;
  const server = createApiServer({
    authService: {},
    authMiddleware: async (request, response, next) => {
      request.user = { id: "user-uuid", email: "alumna@frba.utn.edu.ar" };
      await next();
    },
    userRepository: {
      findById: async (id) => {
        attachedId = id;
        return {
          id_usuario: id,
          email: "alumna@frba.utn.edu.ar",
          nombre_completo: "Ada Lovelace",
          rol: "ALUMNO",
        };
      },
    },
    frontendOrigin: "http://localhost:5173",
  });
  const baseUrl = await listen(server);
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const response = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { authorization: "Bearer valid-token" },
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(attachedId, "user-uuid");
  assert.equal(body.user.id_usuario, "user-uuid");
});
