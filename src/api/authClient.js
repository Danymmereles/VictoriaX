import { localAuth } from "@/api/localAuth";
import { getSupabaseClient } from "@/utils/supabase";

const USE_LOCAL_AUTH =
  import.meta.env.DEV && import.meta.env.VITE_LOCAL_AUTH !== "false";
const SUPABASE_ROLES = new Set(["ADMIN", "DOCENTE", "ALUMNO"]);
const AUTH_SOURCE_KEY = "victoriax-auth-source";
export let isLocalAuthEnabled = USE_LOCAL_AUTH;

function setAuthSource(source) {
  localStorage.setItem(AUTH_SOURCE_KEY, source);
  isLocalAuthEnabled = USE_LOCAL_AUTH || source === "local";
}

async function useLocalAccount(email) {
  return (
    USE_LOCAL_AUTH ||
    (import.meta.env.DEV && (await localAuth.hasAccount(email)))
  );
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
    if (await useLocalAccount(email)) {
      const user = await localAuth.register({ email, password, nombreCompleto });
      setAuthSource("local");
      return { user, accessToken: "local-session" };
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
    setAuthSource(data.session ? "supabase" : "signed-out");

    return {
      user: toAppUser(data.user),
      accessToken: data.session?.access_token ?? null,
    };
  },

  async login({ email, password }) {
    if (await useLocalAccount(email)) {
      const user = await localAuth.login({ email, password });
      setAuthSource("local");
      return user;
    }

    localAuth.logout();
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error("Supabase no devolvió el usuario autenticado.");
    setAuthSource("supabase");
    return toAppUser(data.user);
  },

  async me() {
    if (USE_LOCAL_AUTH) return localAuth.me();
    const authSource = localStorage.getItem(AUTH_SOURCE_KEY);
    if (authSource === "signed-out") return null;
    if (authSource === "local") {
      isLocalAuthEnabled = true;
      return localAuth.me();
    }
    if (!authSource && import.meta.env.DEV) {
      const localUser = await localAuth.me();
      if (localUser) {
        setAuthSource("local");
        return localUser;
      }
    }
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) throw error;
    if (data.session && !authSource) setAuthSource("supabase");
    return data.session ? toAppUser(data.session.user) : null;
  },

  async logout() {
    if (USE_LOCAL_AUTH) {
      localAuth.logout();
      setAuthSource("signed-out");
      return;
    }
    const authSource = localStorage.getItem(AUTH_SOURCE_KEY);
    localAuth.logout();
    if (authSource !== "supabase") {
      setAuthSource("signed-out");
      return;
    }
    const { error } = await getSupabaseClient().auth.signOut();
    setAuthSource("signed-out");
    if (error) throw error;
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
