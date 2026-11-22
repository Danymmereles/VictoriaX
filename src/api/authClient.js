// Cliente de autenticación contra la API propia (backend/ + MySQL).
import {
  clearSessionExpiry,
  ensureSessionExpiry,
  getSessionExpiresAt,
  startSessionExpiry,
} from "@/api/sessionExpiry";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
const TOKEN_KEY = "victoriax-access-token";

const ROL_APP = { ADMIN: "ADMINISTRADOR", DOCENTE: "DOCENTE", ALUMNO: "ESTUDIANTE" };

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    startSessionExpiry();
  } else {
    localStorage.removeItem(TOKEN_KEY);
    clearSessionExpiry();
  }
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  const token = auth ? getToken() : null;
  if (token) headers.authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor de VictoriaX.");
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Ocurrió un error inesperado.");
    error.status = response.status;
    throw error;
  }
  return data;
}

// Formato que usan las pantallas de perfil y participantes.
function toParticipante(user) {
  return { ...user, id: user.id_usuario, rol: ROL_APP[user.rol] || "ESTUDIANTE" };
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
