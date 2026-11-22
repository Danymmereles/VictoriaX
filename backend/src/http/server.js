import { createServer } from "node:http";
import { AuthenticationError } from "../auth/errors.js";
import { toPublicUser } from "../auth/service.js";

const BODY_LIMIT_BYTES = 1_048_576;
const USUARIO_PATH = /^\/api\/usuarios\/([0-9a-f-]{36})$/i;

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > BODY_LIMIT_BYTES) {
      const error = new Error("El cuerpo de la solicitud excede el tamaño permitido.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("El cuerpo debe ser JSON válido.");
    error.statusCode = 400;
    throw error;
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const error = new Error("El cuerpo debe ser un objeto JSON.");
    error.statusCode = 400;
    throw error;
  }
  return body;
}

export function createApiServer({ authService, authMiddleware, frontendOrigin }) {
  // Rutas protegidas: [método, patrón, handler(request, response, params)].
  const protectedRoutes = [
    ["GET", /^\/api\/auth\/me$/, async (request, response) => {
      sendJson(response, 200, { user: toPublicUser(request.user) });
    }],
    ["POST", /^\/api\/auth\/logout$/, async (request, response) => {
      await authService.logout(request.sessionId);
      response.writeHead(204);
      response.end();
    }],
    ["POST", /^\/api\/auth\/password$/, async (request, response) => {
      await authService.changePassword(request.user, request.sessionId, await readJson(request));
      response.writeHead(204);
      response.end();
    }],
    ["GET", /^\/api\/usuarios$/, async (request, response) => {
      sendJson(response, 200, { users: await authService.listUsers(request.user) });
    }],
    ["PATCH", USUARIO_PATH, async (request, response, [id]) => {
      const user = await authService.updateUser(request.user, id.toLowerCase(), await readJson(request));
      sendJson(response, 200, { user });
    }],
  ];

  return createServer(async (request, response) => {
    const origin = request.headers.origin;
    if (origin && origin !== frontendOrigin) {
      sendJson(response, 403, { error: "Origen no permitido." });
      return;
    }
    if (origin) {
      response.setHeader("access-control-allow-origin", frontendOrigin);
      response.setHeader("vary", "Origin");
      response.setHeader("access-control-allow-headers", "authorization, content-type");
      response.setHeader("access-control-allow-methods", "GET, POST, PATCH, OPTIONS");
    }
    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    try {
      const url = new URL(request.url, "http://localhost");
      if (request.method === "POST" && url.pathname === "/api/auth/register") {
        const result = await authService.register(await readJson(request));
        sendJson(response, 201, result);
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/auth/login") {
        const result = await authService.login(await readJson(request));
        sendJson(response, 200, result);
        return;
      }
      for (const [method, pattern, handler] of protectedRoutes) {
        const match = request.method === method && url.pathname.match(pattern);
        if (match) {
          await authMiddleware(request, response, () =>
            handler(request, response, match.slice(1)),
          );
          return;
        }
      }
      sendJson(response, 404, { error: "Ruta no encontrada." });
    } catch (error) {
      if (response.headersSent) {
        response.destroy(error);
        return;
      }
      const statusCode =
        Number.isInteger(error.statusCode) && error.statusCode >= 400
          ? error.statusCode
          : error instanceof AuthenticationError
            ? 401
            : 500;
      if (statusCode === 500) {
        console.error("VictoriaX API request failed:", error);
      }
      sendJson(response, statusCode, {
        error:
          statusCode === 500
            ? "Error interno del servidor."
            : error.message,
      });
    }
  });
}
