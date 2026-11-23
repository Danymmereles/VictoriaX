import { and, eq, gt, isNull, lt, ne } from "drizzle-orm";
import { sesion, tokenAuth, usuario } from "./schema.js";

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

    async deleteUser(id_usuario) {
      await db.delete(usuario).where(eq(usuario.id_usuario, id_usuario));
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

    async createAuthToken(record, now = new Date()) {
      await db.transaction(async (tx) => {
        await tx
          .update(tokenAuth)
          .set({ usado_en: now })
          .where(and(
            eq(tokenAuth.id_usuario, record.id_usuario),
            eq(tokenAuth.tipo, record.tipo),
            isNull(tokenAuth.usado_en),
          ));
        await tx.insert(tokenAuth).values(record);
      });
    },

    async verifyEmailToken(token_hash, now = new Date()) {
      return db.transaction(async (tx) => {
        const [record] = await tx
          .select()
          .from(tokenAuth)
          .where(and(
            eq(tokenAuth.token_hash, token_hash),
            eq(tokenAuth.tipo, "VERIFICACION_EMAIL"),
            isNull(tokenAuth.usado_en),
            gt(tokenAuth.expira_en, now),
          ))
          .limit(1)
          .for("update");
        if (!record) return null;

        await tx
          .update(usuario)
          .set({ email_verificado: true })
          .where(eq(usuario.id_usuario, record.id_usuario));
        await tx
          .update(tokenAuth)
          .set({ usado_en: now })
          .where(eq(tokenAuth.id_token, record.id_token));
        return record.id_usuario;
      });
    },

    async resetPasswordWithToken(token_hash, password_hash, now = new Date()) {
      return db.transaction(async (tx) => {
        const [record] = await tx
          .select()
          .from(tokenAuth)
          .where(and(
            eq(tokenAuth.token_hash, token_hash),
            eq(tokenAuth.tipo, "RESET_PASSWORD"),
            isNull(tokenAuth.usado_en),
            gt(tokenAuth.expira_en, now),
          ))
          .limit(1)
          .for("update");
        if (!record) return null;

        await tx
          .update(usuario)
          .set({ password_hash })
          .where(eq(usuario.id_usuario, record.id_usuario));
        await tx
          .delete(sesion)
          .where(eq(sesion.id_usuario, record.id_usuario));
        await tx
          .update(tokenAuth)
          .set({ usado_en: now })
          .where(eq(tokenAuth.id_token, record.id_token));
        const [user] = await tx
          .select()
          .from(usuario)
          .where(eq(usuario.id_usuario, record.id_usuario))
          .limit(1);
        return user ?? null;
      });
    },

    async deleteSessions(id_usuario) {
      await db.delete(sesion).where(eq(sesion.id_usuario, id_usuario));
    },

    async findUserBySession(id_sesion, now = new Date()) {
      const [row] = await db
        .select({ user: usuario })
        .from(sesion)
        .innerJoin(usuario, eq(sesion.id_usuario, usuario.id_usuario))
        .where(and(
          eq(sesion.id_sesion, id_sesion),
          gt(sesion.fecha_expiracion, now),
          eq(usuario.email_verificado, true),
          eq(usuario.estado, "ACTIVO"),
        ))
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
