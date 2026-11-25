import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { analisisPrevio, inscripcion, resolucion, usuario } from "./schema.js";

// Cada resolución se devuelve junto con su análisis previo, en un solo registro plano.
const columnas = {
  id_resolucion: resolucion.id_resolucion,
  id_usuario: resolucion.id_usuario,
  id_ejercicio: resolucion.id_ejercicio,
  estado: resolucion.estado,
  fecha_inicio: resolucion.fecha_inicio,
  fecha_ultima_modificacion: resolucion.fecha_ultima_modificacion,
  id_analisis_previo: analisisPrevio.id_analisis_previo,
  tipo_metodologia: analisisPrevio.tipo_metodologia,
  variables: analisisPrevio.variables,
  tabla_eventos: analisisPrevio.tabla_eventos,
  tabla_eventos_futuros: analisisPrevio.tabla_eventos_futuros,
};

export function createResolucionRepository(db) {
  const seleccion = (executor = db) =>
    executor
      .select(columnas)
      .from(resolucion)
      .innerJoin(analisisPrevio, eq(resolucion.id_analisis_previo, analisisPrevio.id_analisis_previo));

  async function findById(id_resolucion, executor = db) {
    const [record] = await seleccion(executor)
      .where(eq(resolucion.id_resolucion, id_resolucion))
      .limit(1);
    return record ?? null;
  }

  return {
    findById,

    // filtro: { id_ejercicio } para una resolución del Modo Estudio, { libre: true } para el Modo Libre.
    async listByUsuario(id_usuario, filtro = {}) {
      const condiciones = [eq(resolucion.id_usuario, id_usuario)];
      if (filtro.id_ejercicio) condiciones.push(eq(resolucion.id_ejercicio, filtro.id_ejercicio));
      if (filtro.libre) condiciones.push(isNull(resolucion.id_ejercicio));
      return seleccion()
        .where(and(...condiciones))
        .orderBy(desc(resolucion.fecha_ultima_modificacion));
    },

    // Resoluciones del Modo Estudio de los alumnos inscriptos en un curso (vista docente).
    async listByCurso(id_curso) {
      return seleccion()
        .innerJoin(
          inscripcion,
          and(eq(inscripcion.id_usuario, resolucion.id_usuario), eq(inscripcion.id_curso, id_curso)),
        )
        .innerJoin(usuario, eq(usuario.id_usuario, resolucion.id_usuario))
        .where(and(eq(usuario.rol, "ALUMNO"), isNotNull(resolucion.id_ejercicio)))
        .orderBy(desc(resolucion.fecha_ultima_modificacion));
    },

    // El análisis previo y su resolución se crean juntos o no se crea ninguno.
    async create({ resolucion: valoresResolucion, analisis }) {
      return db.transaction(async (tx) => {
        await tx.insert(analisisPrevio).values(analisis);
        await tx.insert(resolucion).values(valoresResolucion);
        return findById(valoresResolucion.id_resolucion, tx);
      });
    },

    async update(record, { analisis, estado }) {
      return db.transaction(async (tx) => {
        if (analisis) {
          await tx
            .update(analisisPrevio)
            .set(analisis)
            .where(eq(analisisPrevio.id_analisis_previo, record.id_analisis_previo));
        }
        // La fecha se marca a mano: ON UPDATE no corre si solo cambió el análisis.
        await tx
          .update(resolucion)
          .set({
            ...(estado ? { estado } : {}),
            fecha_ultima_modificacion: sql`CURRENT_TIMESTAMP(3)`,
          })
          .where(eq(resolucion.id_resolucion, record.id_resolucion));
        return findById(record.id_resolucion, tx);
      });
    },
  };
}
