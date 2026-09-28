import { eq } from "drizzle-orm";
import { usuario } from "./schema.js";

export function createUserRepository(db) {
  return {
    async insertShadowUser({ id_usuario, email, nombre_completo }) {
      const [record] = await db
        .insert(usuario)
        .values({ id_usuario, email, nombre_completo, rol: "ALUMNO" })
        .returning();
      return record;
    },

    async findById(id_usuario) {
      const [record] = await db
        .select()
        .from(usuario)
        .where(eq(usuario.id_usuario, id_usuario))
        .limit(1);
      return record ?? null;
    },
  };
}
