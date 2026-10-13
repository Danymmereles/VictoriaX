import {
  AuthenticationError,
  ConflictError,
  DomainRestrictionError,
  ValidationError,
} from "./errors.js";

export function normalizeEmail(input) {
  if (typeof input !== "string") {
    throw new ValidationError("El email es obligatorio.");
  }

  const email = input.trim().toLowerCase();
  if (
    email.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new ValidationError("Ingresá un email válido.");
  }
  return email;
}

export function isAcademicEmail(email) {
  return /^[^\s@]+@frba\.utn\.edu\.ar$/.test(email);
}

export function assertAcademicEmail(email) {
  if (!isAcademicEmail(email)) throw new DomainRestrictionError();
}

function toPublicUser(record) {
  return {
    id_usuario: record.id_usuario,
    email: record.email,
    nombre_completo: record.nombre_completo,
    rol: record.rol,
  };
}

export function createAuthService({ authClient, adminClient, userRepository }) {
  return {
    async register({ email: emailInput, password, nombreCompleto }) {
      const email = normalizeEmail(emailInput);
      if (typeof password !== "string" || password.length < 8) {
        throw new ValidationError("La contraseña debe tener al menos 8 caracteres.");
      }
      if (typeof nombreCompleto !== "string" || !nombreCompleto.trim()) {
        throw new ValidationError("El nombre completo es obligatorio.");
      }

      const { data, error } = await authClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: nombreCompleto.trim() } },
      });
      if (error) {
        if (error.status === 409) {
          throw new ConflictError("Ya existe una cuenta con ese email.");
        }
        if (error.status === 400 || error.status === 422) {
          throw new ValidationError("Supabase rechazó los datos de registro.");
        }
        throw new Error("No se pudo crear la identidad en Supabase.", { cause: error });
      }
      if (!data.user?.id) {
        throw new AuthenticationError("Supabase no devolvió el usuario creado.");
      }
      if (data.user.identities?.length === 0) {
        throw new ConflictError("Ya existe una cuenta con ese email.");
      }

      let shadowUser;
      try {
        shadowUser = await userRepository.insertShadowUser({
          id_usuario: data.user.id,
          email,
          nombre_completo: nombreCompleto.trim(),
        });
      } catch (databaseError) {
        let rollbackError;
        try {
          ({ error: rollbackError } = await adminClient.auth.admin.deleteUser(
            data.user.id,
          ));
        } catch (error) {
          rollbackError = error;
        }
        if (rollbackError) {
          throw new AggregateError(
            [databaseError, rollbackError],
            "Falló el alta en RDS y también la compensación del usuario en Supabase.",
          );
        }
        throw new Error("No se pudo guardar el usuario en RDS; se revirtió el alta de Supabase.", {
          cause: databaseError,
        });
      }

      return {
        user: toPublicUser(shadowUser),
        accessToken: data.session?.access_token ?? null,
      };
    },

    async login({ email: emailInput, password }) {
      const email = normalizeEmail(emailInput);
      assertAcademicEmail(email);
      if (typeof password !== "string" || !password) {
        throw new ValidationError("La contraseña es obligatoria.");
      }

      const { data, error } = await authClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user?.id || !data.session?.access_token) {
        throw new AuthenticationError();
      }

      const shadowUser = await userRepository.findById(data.user.id);
      if (!shadowUser) {
        throw new ConflictError(
          "La cuenta no tiene un usuario sincronizado en la base de negocio.",
        );
      }

      return {
        user: toPublicUser(shadowUser),
        accessToken: data.session.access_token,
      };
    },
  };
}
