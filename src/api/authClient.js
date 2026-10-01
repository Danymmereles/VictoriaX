import { localAuth } from "@/api/localAuth";
import { getSupabaseClient } from "@/utils/supabase";

const USE_LOCAL_AUTH =
  import.meta.env.DEV && import.meta.env.VITE_LOCAL_AUTH !== "false";
const SUPABASE_ROLES = new Set(["ADMIN", "DOCENTE", "ALUMNO"]);
export const isLocalAuthEnabled = USE_LOCAL_AUTH;

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
    if (USE_LOCAL_AUTH) {
      const user = await localAuth.register({ email, password, nombreCompleto });
      return { user, accessToken: "local-session" };
    }

    const { data, error } = await getSupabaseClient().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: nombreCompleto.trim() },
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error("Supabase no devolvió el usuario creado.");

    return {
      user: toAppUser(data.user),
      accessToken: data.session?.access_token ?? null,
    };
  },

  async login({ email, password }) {
    if (USE_LOCAL_AUTH) {
      return localAuth.login({ email, password });
    }

    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error("Supabase no devolvió el usuario autenticado.");
    return toAppUser(data.user);
  },

  async me() {
    if (USE_LOCAL_AUTH) return localAuth.me();
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) throw error;
    return data.session ? toAppUser(data.session.user) : null;
  },

  async logout() {
    if (USE_LOCAL_AUTH) {
      localAuth.logout();
      return;
    }
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw error;
  },

  async listUsers() {
    if (!USE_LOCAL_AUTH) {
      throw new Error("La administración local solo está disponible en modo desarrollo.");
    }
    return localAuth.listUsers();
  },

  async updateUser(id, changes) {
    if (!USE_LOCAL_AUTH) {
      throw new Error("La administración local solo está disponible en modo desarrollo.");
    }
    return localAuth.updateUser(id, changes);
  },
};
