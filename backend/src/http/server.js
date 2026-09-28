import { createServer } from "node:http";
import { AuthenticationError } from "../auth/errors.js";

const BODY_LIMIT_BYTES = 1_048_576;

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

export function createApiServer({
  authService,
  authMiddleware,
  userRepository,
  frontendOrigin,
}) {
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
      response.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
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
      if (request.method === "GET" && url.pathname === "/api/auth/me") {
        await authMiddleware(request, response, async () => {
          const user = await userRepository.findById(request.user.id);
          if (!user) {
            sendJson(response, 404, { error: "No existe el usuario en la base de negocio." });
            return;
          }
          sendJson(response, 200, {
            user: {
              id_usuario: user.id_usuario,
              email: user.email,
              nombre_completo: user.nombre_completo,
              rol: user.rol,
            },
          });
        });
        return;
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
