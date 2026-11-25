// Ejercicios de la guía de trabajos prácticos (API propia + MySQL).
// La API devuelve solo los ejercicios de la institución del usuario logueado.
import { request } from "@/api/apiClient";

export const ejerciciosClient = {
  // Ordenados por número; con descendente: true, del último al primero.
  // institucion solo tiene efecto para el super admin (el resto ve siempre la suya).
  async list({ descendente = false, institucion } = {}) {
    const query = institucion ? `?institucion=${encodeURIComponent(institucion)}` : "";
    const { ejercicios } = await request(`/api/ejercicios${query}`);
    return descendente ? ejercicios.slice().reverse() : ejercicios;
  },

  async get(id) {
    const { ejercicio } = await request(`/api/ejercicios/${encodeURIComponent(id)}`);
    return ejercicio;
  },

  async create(datos) {
    const { ejercicio } = await request("/api/ejercicios", { method: "POST", body: datos });
    return ejercicio;
  },

  async update(id, cambios) {
    const { ejercicio } = await request(`/api/ejercicios/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: cambios,
    });
    return ejercicio;
  },

  async remove(id) {
    await request(`/api/ejercicios/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};
