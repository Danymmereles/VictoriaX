import { and, asc, desc, eq } from "drizzle-orm";
import { curso, inscripcion, usuario } from "./schema.js";

export function createCursoRepository(db) {
  async function findById(id_curso, executor = db) {
    const [record] = await executor.select().from(curso).where(eq(curso.id_curso, id_curso)).limit(1);
    return record ?? null;
  }

  return {
    findById,

    async listAll() {
      return db.select().from(curso).orderBy(asc(curso.institucion), desc(curso.fecha_inicio), asc(curso.codigo));
    },

    async listByInstitucion(institucion) {
      return db
        .select()
        .from(curso)
        .where(eq(curso.institucion, institucion))
        .orderBy(desc(curso.fecha_inicio), asc(curso.codigo));
    },

    // Cursos en los que está inscripto el usuario.
    async listByIntegrante(id_usuario) {
      const rows = await db
        .select({ curso })
        .from(curso)
        .innerJoin(inscripcion, eq(inscripcion.id_curso, curso.id_curso))
        .where(eq(inscripcion.id_usuario, id_usuario))
        .orderBy(desc(curso.fecha_inicio), asc(curso.codigo));
      return rows.map((row) => row.curso);
    },

    // El curso y sus docentes iniciales se crean juntos.
    async insert(values, idsIntegrantes = []) {
      return db.transaction(async (tx) => {
        await tx.insert(curso).values(values);
        if (idsIntegrantes.length) {
          await tx
            .insert(inscripcion)
            .values(idsIntegrantes.map((id_usuario) => ({ id_curso: values.id_curso, id_usuario })));
        }
        return findById(values.id_curso, tx);
      });
    },

    async update(id_curso, changes) {
      await db.update(curso).set(changes).where(eq(curso.id_curso, id_curso));
      return findById(id_curso);
    },

    // Las inscripciones se borran en cascada.
    async remove(id_curso) {
      await db.delete(curso).where(eq(curso.id_curso, id_curso));
    },

    async listIntegrantes(id_curso) {
      const rows = await db
        .select({ usuario })
        .from(inscripcion)
        .innerJoin(usuario, eq(usuario.id_usuario, inscripcion.id_usuario))
        .where(eq(inscripcion.id_curso, id_curso))
        .orderBy(asc(usuario.nombre_completo));
      return rows.map((row) => row.usuario);
    },

    async isIntegrante(id_curso, id_usuario) {
      const [row] = await db
        .select({ id_usuario: inscripcion.id_usuario })
        .from(inscripcion)
        .where(and(eq(inscripcion.id_curso, id_curso), eq(inscripcion.id_usuario, id_usuario)))
        .limit(1);
      return Boolean(row);
    },

    // Un solo INSERT de varias filas: si alguna falla, no entra ninguna.
    async addIntegrantes(id_curso, ids) {
      await db.insert(inscripcion).values(ids.map((id_usuario) => ({ id_curso, id_usuario })));
    },

    async removeIntegrante(id_curso, id_usuario) {
      await db
        .delete(inscripcion)
        .where(and(eq(inscripcion.id_curso, id_curso), eq(inscripcion.id_usuario, id_usuario)));
    },
  };
}
