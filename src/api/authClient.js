// Cliente de autenticación contra la API propia (backend/ + MySQL).
import {
  clearSessionExpiry,
  ensureSessionExpiry,
  getSessionExpiresAt,
} from "@/api/sessionExpiry";
import { getToken, request, setToken } from "@/api/apiClient";
import { rolDesdeApi } from "@/lib/permisos";



// Formato que usan las pantallas de perfil y participantes.
function toParticipante(user) {
  return { ...user, id: user.id_usuario, rol: rolDesdeApi(user.rol) };
}

export const authClient = {
  async register({ email, password, nombreCompleto }) {
    const result = await request("/api/auth/register", {
      method: "POST",
      auth: false,
      body: { email, password, nombreCompleto },
    });
    setToken(result.accessToken);
    return result;
  },

  async login({ email, password }) {
    const result = await request("/api/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    setToken(result.accessToken);
    return result.user;
  },

  async me() {
    if (!getToken()) {
      clearSessionExpiry();
      return null;
    }
    if (ensureSessionExpiry() <= Date.now()) {
      await this.logout();
      return null;
    }
    try {
      const { user } = await request("/api/auth/me");
      return user;
    } catch (error) {
      if (error.status === 401) {
        setToken(null);
        return null;
      }
      throw error;
    }
  },

  async logout() {
    if (!getToken()) return;
    try {
      await request("/api/auth/logout", { method: "POST" });
    } catch {
      // La sesión local se borra igual aunque el servidor no responda.
    } finally {
      setToken(null);
    }
  },

  async changePassword({ currentPassword, newPassword }) {
    await request("/api/auth/password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
  },

  getSessionExpiresAt() {
    return getSessionExpiresAt();
  },

  async listUsers() {
    const { users } = await request("/api/usuarios");
    return users.map(toParticipante);
  },

  async updateUser(id, changes) {
    const { user } = await request(`/api/usuarios/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: changes,
    });
    return toParticipante(user);
  },
};
