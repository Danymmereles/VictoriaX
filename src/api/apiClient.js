// Cliente HTTP de la API propia de VictoriaX (backend/ + MySQL).
import { clearSessionExpiry, startSessionExpiry } from "@/api/sessionExpiry";

// En desarrollo local se usa la API de la PC; publicado, la del dominio (vía Cloudflare Tunnel).
// VITE_API_URL permite forzar otra URL.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const DEFAULT_API_URL = LOCAL_HOSTS.has(globalThis.location?.hostname)
  ? "http://localhost:3001"
  : "https://api.victoriax-simulate.com";
const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
const TOKEN_KEY = "victoriax-access-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    startSessionExpiry();
  } else {
    localStorage.removeItem(TOKEN_KEY);
    clearSessionExpiry();
  }
}

export async function request(path, { method = "GET", body, auth = true } = {}) {
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
