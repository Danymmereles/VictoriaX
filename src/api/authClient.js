import { localAuth } from "@/api/localAuth";
import { getSupabaseClient, isSupabaseConfigured } from "@/utils/supabase";
import {
  clearSessionExpiry,
  ensureSessionExpiry,
  getSessionExpiresAt,
  startSessionExpiry,
} from "@/api/sessionExpiry";

const SUPABASE_ROLES = new Set(["ADMIN", "DOCENTE", "ALUMNO"]);
const AUTH_SOURCE_KEY = "victoriax-auth-source";
export let isLocalAuthEnabled = false;

function setAuthSource(source) {
  localStorage.setItem(AUTH_SOURCE_KEY, source);
  isLocalAuthEnabled = import.meta.env.DEV && source === "local";
}

function isLocalDemoEmail(email) {
  return import.meta.env.DEV && localAuth.isDemoEmail(email);
}

function toAppUser(user) {
  const role = user.app_metadata?.rol;
  const fullName =
    user.user_metadata?.full_name ?? user.user_metadata?.nombre_completo ?? "";

  return {
    id_usuario: user.id,
    email: user.email ?? "",
    nombre_completo: typeof fullName === "string" ? fullName : "",
    rol: SUPABASE_ROLES.has(role) ? role : "ALUMNO",
  };
}

export const authClient = {
  async register({ email, password, nombreCompleto }) {
    if (isLocalDemoEmail(email)) {
      throw new Error(
        "Ese email está reservado para una cuenta demo local. Iniciá sesión con la cuenta demo.",
      );
    }

    const { data, error } = await getSupabaseClient().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: nombreCompleto.trim() },
      },
    });
    if (error) {
      if (
        error.code === "user_already_exists" ||
        /already (?:registered|exists)/i.test(error.message)
      ) {
        throw new Error("Ya existe una cuenta con ese email. Iniciá sesión.");
      }
      throw error;
    }
    if (!data.user) throw new Error("Supabase no devolvió el usuario creado.");
    if (data.user.identities?.length === 0) {
      throw new Error("Ya existe una cuenta con ese email. Iniciá sesión.");
    }
    localAuth.logout();
    if (data.session) startSessionExpiry();
    else clearSessionExpiry();
    setAuthSource("supabase");

    return {
      user: toAppUser(data.user),
      accessToken: data.session?.access_token ?? null,
    };
  },

  async login({ email, password }) {
    if (isLocalDemoEmail(email)) {
      const user = await localAuth.login({ email, password });
      startSessionExpiry();
      setAuthSource("local");
      return user;
    }

    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error("Supabase no devolvió el usuario autenticado.");
    localAuth.logout();
    startSessionExpiry();
    setAuthSource("supabase");
    return toAppUser(data.user);
  },

  async me() {
    const authSource = localStorage.getItem(AUTH_SOURCE_KEY);
    if (authSource === "signed-out") {
      clearSessionExpiry();
      isLocalAuthEnabled = false;
      return null;
    }
    if (import.meta.env.DEV && authSource === "local") {
      const demoUser = await localAuth.me();
      if (demoUser) {
        setAuthSource("local");
        if (ensureSessionExpiry() <= Date.now()) {
          await this.logout();
          return null;
        }
        isLocalAuthEnabled = true;
        return demoUser;
      }
      localAuth.logout();
      clearSessionExpiry();
      setAuthSource("supabase");
    }

    if (!authSource && import.meta.env.DEV) {
      const demoUser = await localAuth.me();
      if (demoUser) {
        setAuthSource("local");
        if (ensureSessionExpiry() <= Date.now()) {
          await this.logout();
          return null;
        }
        return demoUser;
      }
    }
    if (!isSupabaseConfigured()) {
      isLocalAuthEnabled = false;
      return null;
    }
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) throw error;
    if (data.session) {
      setAuthSource("supabase");
      if (ensureSessionExpiry() <= Date.now()) {
        await this.logout();
        return null;
      }
    } else {
      clearSessionExpiry();
      isLocalAuthEnabled = false;
    }
    return data.session ? toAppUser(data.session.user) : null;
  },

  async logout() {
    const authSource = localStorage.getItem(AUTH_SOURCE_KEY);
    localAuth.logout();
    clearSessionExpiry();
    setAuthSource("signed-out");
    if (authSource !== "supabase") {
      return;
    }
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw error;
  },

  getSessionExpiresAt() {
    return getSessionExpiresAt();
  },

  async listUsers() {
    if (!isLocalAuthEnabled) {
      throw new Error("La administración local solo está disponible en modo desarrollo.");
    }
    return localAuth.listUsers();
  },

  async updateUser(id, changes) {
    if (!isLocalAuthEnabled) {
      throw new Error("La administración local solo está disponible en modo desarrollo.");
    }
    return localAuth.updateUser(id, changes);
  },
};
