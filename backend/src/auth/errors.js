export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

export class DomainRestrictionError extends ValidationError {
  constructor() {
    super(
      "Las funciones de la plataforma son exclusivas para la comunidad académica de UTN (dominio @frba.utn.edu.ar).",
    );
    this.name = "DomainRestrictionError";
    this.statusCode = 403;
  }
}

export class AuthenticationError extends Error {
  constructor(message = "Credenciales inválidas o sesión no válida.") {
    super(message);
    this.name = "AuthenticationError";
    this.statusCode = 401;
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
    this.statusCode = 409;
  }
}
