import { and, eq, gt, lt, ne } from "drizzle-orm";
import { sesion, usuario } from "./schema.js";

const DUPLICATE_ENTRY = "ER_DUP_ENTRY";

export function isDuplicateEntry(error) {
  return error?.code === DUPLICATE_ENTRY || error?.cause?.code === DUPLICATE_ENTRY;
}

export function createUserRepository(db) {
  async function findById(id_usuario) {
    const [record] = await db
      .select()
      .from(usuario)
      .where(eq(usuario.id_usuario, id_usuario))
      .limit(1);
    return record ?? null;
  }

  return {
    findById,

    async findByEmail(email) {
      const [record] = await db
        .select()
        .from(usuario)
        .where(eq(usuario.email, email))
        .limit(1);
      return record ?? null;
    },

    async insertUser(values) {
      await db.insert(usuario).values(values);
      return findById(values.id_usuario);
    },

    async updateUser(id_usuario, changes) {
      await db.update(usuario).set(changes).where(eq(usuario.id_usuario, id_usuario));
      return findById(id_usuario);
    },

    async listByInstitucion(institucion) {
      return db
        .select()
        .from(usuario)
        .where(eq(usuario.institucion, institucion))
        .orderBy(usuario.nombre_completo);
    },

    async createSession({ id_sesion, id_usuario, fecha_expiracion }) {
      await db.insert(sesion).values({ id_sesion, id_usuario, fecha_expiracion });
    },

    async findUserBySession(id_sesion, now = new Date()) {
      const [row] = await db
        .select({ user: usuario })
        .from(sesion)
        .innerJoin(usuario, eq(sesion.id_usuario, usuario.id_usuario))
        .where(and(eq(sesion.id_sesion, id_sesion), gt(sesion.fecha_expiracion, now)))
        .limit(1);
      return row?.user ?? null;
    },

    async deleteSession(id_sesion) {
      await db.delete(sesion).where(eq(sesion.id_sesion, id_sesion));
    },

    async deleteOtherSessions(id_usuario, keepSessionId) {
      await db
        .delete(sesion)
        .where(and(eq(sesion.id_usuario, id_usuario), ne(sesion.id_sesion, keepSessionId)));
    },

    async deleteExpiredSessions(now = new Date()) {
      await db.delete(sesion).where(lt(sesion.fecha_expiracion, now));
    },
  };
}
