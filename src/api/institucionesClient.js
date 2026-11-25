// Instituciones disponibles: el super admin recibe todas; el resto, solo la propia.
import { request } from "@/api/apiClient";

export const institucionesClient = {
  async list() {
    const { instituciones } = await request("/api/instituciones");
    return instituciones;
  },
};
