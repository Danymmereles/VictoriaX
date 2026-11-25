import { createServer } from "node:http";
import { AuthenticationError } from "../auth/errors.js";
import { toPublicUser } from "../auth/service.js";

const BODY_LIMIT_BYTES = 1_048_576;
const USUARIO_PATH = /^\/api\/usuarios\/([0-9a-f-]{36})$/i;
// Ids importados de Base44 (24 hex) o UUID de los ejercicios nuevos.
const EJERCICIO_PATH = /^\/api\/ejercicios\/([A-Za-z0-9-]{1,36})$/;
const RESOLUCION_PATH = /^\/api\/resoluciones\/([0-9a-f-]{36})$/i;
// Ids importados de Base44 (24 hex) o UUID de los cursos nuevos.
const CURSO_ID = "([A-Za-z0-9-]{1,36})";
const CURSO_PATH = new RegExp(`^/api/cursos/${CURSO_ID}$`);
const CURSO_INTEGRANTES_PATH = new RegExp(`^/api/cursos/${CURSO_ID}/integrantes$`);
const CURSO_INTEGRANTE_PATH = new RegExp(`^/api/cursos/${CURSO_ID}/integrantes/([0-9a-f-]{36})$`, "i");
const CURSO_RESOLUCIONES_PATH = new RegExp(`^/api/cursos/${CURSO_ID}/resoluciones$`);

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

// Acepta un origen o varios separados por coma (ej. local + sitio publicado).
export function parseOrigins(value) {
  return new Set(
    (Array.isArray(value) ? value : String(value ?? "").split(","))
      .map((origin) => origin.trim().replace(/\/$/, ""))
      .filter(Boolean),
  );
}

export function createApiServer({
  authService,
  authMiddleware,
  ejercicioService,
  resolucionService,
  cursoService,
  institucionService,
  frontendOrigin,
}) {
  const allowedOrigins = parseOrigins(frontendOrigin);
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
    // ?institucion=<nombre> solo tiene efecto para el super admin (usuarios, ejercicios y cursos).
    ["GET", /^\/api\/usuarios$/, async (request, response, _params, url) => {
      const users = await authService.listUsers(request.user, {
        institucion: url.searchParams.get("institucion"),
      });
      sendJson(response, 200, { users });
    }],
    ["GET", /^\/api\/instituciones$/, async (request, response) => {
      sendJson(response, 200, { instituciones: await institucionService.list(request.user) });
    }],
    ["PATCH", USUARIO_PATH, async (request, response, [id]) => {
      const user = await authService.updateUser(request.user, id.toLowerCase(), await readJson(request));
      sendJson(response, 200, { user });
    }],
    ["GET", /^\/api\/ejercicios$/, async (request, response, _params, url) => {
      const ejercicios = await ejercicioService.list(request.user, {
        institucion: url.searchParams.get("institucion"),
      });
      sendJson(response, 200, { ejercicios });
    }],
    ["POST", /^\/api\/ejercicios$/, async (request, response) => {
      const ejercicio = await ejercicioService.create(request.user, await readJson(request));
      sendJson(response, 201, { ejercicio });
    }],
    ["GET", EJERCICIO_PATH, async (request, response, [id]) => {
      sendJson(response, 200, { ejercicio: await ejercicioService.get(request.user, id) });
    }],
    ["PATCH", EJERCICIO_PATH, async (request, response, [id]) => {
      const ejercicio = await ejercicioService.update(request.user, id, await readJson(request));
      sendJson(response, 200, { ejercicio });
    }],
    ["DELETE", EJERCICIO_PATH, async (request, response, [id]) => {
      await ejercicioService.remove(request.user, id);
      response.writeHead(204);
      response.end();
    }],
    // ?ejercicio=<id> para la del Modo Estudio, ?modo=libre para las del Modo Libre.
    ["GET", /^\/api\/resoluciones$/, async (request, response, _params, url) => {
      const resoluciones = await resolucionService.list(request.user, {
        id_ejercicio: url.searchParams.get("ejercicio"),
        libre: url.searchParams.get("modo") === "libre",
      });
      sendJson(response, 200, { resoluciones });
    }],
    ["POST", /^\/api\/resoluciones$/, async (request, response) => {
      const resolucion = await resolucionService.create(request.user, await readJson(request));
      sendJson(response, 201, { resolucion });
    }],
    ["GET", RESOLUCION_PATH, async (request, response, [id]) => {
      sendJson(response, 200, { resolucion: await resolucionService.get(request.user, id.toLowerCase()) });
    }],
    ["PATCH", RESOLUCION_PATH, async (request, response, [id]) => {
      const resolucion = await resolucionService.update(request.user, id.toLowerCase(), await readJson(request));
      sendJson(response, 200, { resolucion });
    }],
    ["GET", /^\/api\/cursos$/, async (request, response, _params, url) => {
      const cursos = await cursoService.list(request.user, {
        institucion: url.searchParams.get("institucion"),
      });
      sendJson(response, 200, { cursos });
    }],
    ["POST", /^\/api\/cursos$/, async (request, response) => {
      const curso = await cursoService.create(request.user, await readJson(request));
      sendJson(response, 201, { curso });
    }],
    ["GET", CURSO_PATH, async (request, response, [id]) => {
      sendJson(response, 200, await cursoService.get(request.user, id));
    }],
    ["PATCH", CURSO_PATH, async (request, response, [id]) => {
      const curso = await cursoService.update(request.user, id, await readJson(request));
      sendJson(response, 200, { curso });
    }],
    ["DELETE", CURSO_PATH, async (request, response, [id]) => {
      await cursoService.remove(request.user, id);
      response.writeHead(204);
      response.end();
    }],
    ["POST", CURSO_INTEGRANTES_PATH, async (request, response, [id]) => {
      // { ids_usuario: [...] } agrega varios juntos; { id_usuario } sigue aceptando uno.
      const { id_usuario, ids_usuario } = await readJson(request);
      const usuarios = await cursoService.agregarIntegrantes(
        request.user,
        id,
        ids_usuario !== undefined ? ids_usuario : [id_usuario],
      );
      sendJson(response, 201, { usuarios });
    }],
    ["DELETE", CURSO_INTEGRANTE_PATH, async (request, response, [id, idUsuario]) => {
      await cursoService.quitarIntegrante(request.user, id, idUsuario.toLowerCase());
      response.writeHead(204);
      response.end();
    }],
    ["GET", CURSO_RESOLUCIONES_PATH, async (request, response, [id]) => {
      sendJson(response, 200, { resoluciones: await cursoService.resoluciones(request.user, id) });
    }],
  ];

  return createServer(async (request, response) => {
    const origin = request.headers.origin;
    if (origin && !allowedOrigins.has(origin)) {
      sendJson(response, 403, { error: "Origen no permitido." });
      return;
    }
    if (origin) {
      response.setHeader("access-control-allow-origin", origin);
      response.setHeader("vary", "Origin");
      response.setHeader("access-control-allow-headers", "authorization, content-type");
      response.setHeader("access-control-allow-methods", "GET, POST, PATCH, DELETE, OPTIONS");
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
            handler(request, response, match.slice(1), url),
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
