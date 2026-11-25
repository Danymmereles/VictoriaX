import { sql } from "drizzle-orm";
import { INSTITUCIONES, SIN_INSTITUCION } from "../auth/instituciones.js";
import { esSuperAdmin } from "../auth/roles.js";

// Instituciones con algún dato cargado (usuarios, ejercicios o cursos) más las conocidas por dominio.
export function createInstitucionRepository(db) {
  return {
    async listConDatos() {
      const [rows] = await db.execute(sql`
        SELECT institucion FROM USUARIO
        UNION SELECT institucion FROM EJERCICIO
        UNION SELECT institucion FROM CURSO`);
      return rows.map((row) => row.institucion);
    },
  };
}

export function createInstitucionService({ institucionRepository }) {
  return {
    // El super admin elige entre todas; el resto solo conoce la propia.
    async list(actor) {
      if (!esSuperAdmin(actor)) return [actor.institucion];
      const todas = new Set([...Object.values(INSTITUCIONES), ...(await institucionRepository.listConDatos())]);
      // "Sin institución" no es elegible: no tiene ejercicios ni cursos propios.
      return [...todas]
        .filter((nombre) => nombre && nombre !== SIN_INSTITUCION)
        .sort((a, b) => a.localeCompare(b, "es"));
    },
  };
}
