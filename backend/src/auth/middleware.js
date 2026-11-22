import { isAcademicEmail } from "./service.js";

function respond(response, statusCode, error) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify({ error }));
}

export function createAuthMiddleware(authService) {
  return async function authenticateRequest(request, response, next) {
    const authorization = request.headers.authorization;
    const match =
      typeof authorization === "string" &&
      authorization.match(/^Bearer\s+([^\s]+)$/i);
    const session = match ? await authService.authenticate(match[1]) : null;
    if (!session) {
      respond(response, 401, "Se requiere un Bearer Token válido.");
      return;
    }
    if (!isAcademicEmail(session.user.email.trim().toLowerCase())) {
      respond(
        response,
        403,
        "El Modo Estudio es exclusivo para la comunidad académica de UTN (dominio @frba.utn.edu.ar).",
      );
      return;
    }

    request.user = session.user;
    request.sessionId = session.sessionId;
    await next();
  };
}
