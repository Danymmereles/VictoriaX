import { isAcademicEmail } from "./service.js";

function respondUnauthorized(response) {
  response.writeHead(401, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify({ error: "Se requiere un Bearer Token válido." }));
}

function respondDomainRestricted(response) {
  response.writeHead(403, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(
    JSON.stringify({
      error:
        "El Modo Estudio es exclusivo para la comunidad académica de UTN (dominio @frba.utn.edu.ar).",
    }),
  );
}

export function createAuthMiddleware(authClient) {
  return async function authenticateRequest(request, response, next) {
    const authorization = request.headers.authorization;
    const match =
      typeof authorization === "string" &&
      authorization.match(/^Bearer\s+([^\s]+)$/i);
    if (!match) {
      respondUnauthorized(response);
      return;
    }

    const { data, error } = await authClient.auth.getUser(match[1]);
    if (error || !data.user?.id) {
      respondUnauthorized(response);
      return;
    }
    if (!isAcademicEmail(data.user.email?.trim().toLowerCase() ?? "")) {
      respondDomainRestricted(response);
      return;
    }

    request.user = {
      id: data.user.id,
      email: data.user.email ?? null,
    };
    await next();
  };
}
