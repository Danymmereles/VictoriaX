import { localAuth } from "@/api/localAuth";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "");
const TOKEN_KEY = "victoriax-access-token";
const USE_LOCAL_AUTH =
  import.meta.env.DEV && import.meta.env.VITE_LOCAL_AUTH !== "false";
export const isLocalAuthEnabled = USE_LOCAL_AUTH;

function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setAccessToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  if (!API_URL) {
    throw new Error("Falta configurar VITE_API_BASE_URL para conectar con VictoriaX API.");
  }
  const token = getAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error || "No se pudo completar la solicitud.");
    error.status = response.status;
    throw error;
  }
  return body;
}

function acceptSession(result) {
  if (result.accessToken) setAccessToken(result.accessToken);
  return result.user;
}

export const authClient = {
  async register({ email, password, nombreCompleto }) {
    if (USE_LOCAL_AUTH) {
      setAccessToken(null);
      const user = await localAuth.register({ email, password, nombreCompleto });
      return { user, accessToken: "local-session" };
    }
    localAuth.logout();
    const result = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, nombreCompleto }),
    });
    if (result.accessToken) acceptSession(result);
    else setAccessToken(null);
    return result;
  },

  async login({ email, password }) {
    if (USE_LOCAL_AUTH) {
      setAccessToken(null);
      return await localAuth.login({ email, password });
    }
    localAuth.logout();
    return acceptSession(
      await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    );
  },

  async me() {
    if (USE_LOCAL_AUTH) return localAuth.me();
    if (!getAccessToken()) return null;
    try {
      const result = await request("/api/auth/me");
      return result.user;
    } catch (error) {
      if (error.status === 401) setAccessToken(null);
      throw error;
    }
  },

  logout() {
    localAuth.logout();
    setAccessToken(null);
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
