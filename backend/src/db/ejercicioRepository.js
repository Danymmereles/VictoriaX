import { and, asc, eq } from "drizzle-orm";
import { ejercicio } from "./schema.js";

export function createEjercicioRepository(db) {
  async function findById(id_ejercicio) {
    const [record] = await db
      .select()
      .from(ejercicio)
      .where(eq(ejercicio.id_ejercicio, id_ejercicio))
      .limit(1);
    return record ?? null;
  }

  return {
    findById,

    async listByInstitucion(institucion) {
      return db
        .select()
        .from(ejercicio)
        .where(eq(ejercicio.institucion, institucion))
        .orderBy(asc(ejercicio.numero));
    },

    async insert(values) {
      await db.insert(ejercicio).values(values);
      return findById(values.id_ejercicio);
    },

    async update(id_ejercicio, changes) {
      await db.update(ejercicio).set(changes).where(eq(ejercicio.id_ejercicio, id_ejercicio));
      return findById(id_ejercicio);
    },

    async remove(id_ejercicio, institucion) {
      await db
        .delete(ejercicio)
        .where(and(eq(ejercicio.id_ejercicio, id_ejercicio), eq(ejercicio.institucion, institucion)));
    },
  };
}
