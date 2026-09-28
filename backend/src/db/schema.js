import {
  integer,
  json,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const rolUsuario = pgEnum("rol_usuario", ["ADMIN", "DOCENTE", "ALUMNO"]);
export const estadoResolucion = pgEnum("estado_resolucion", [
  "PENDIENTE",
  "ENTREGADO",
  "REVISADO",
]);
export const estadoFeedback = pgEnum("estado_feedback", ["PENDIENTE", "LEIDO"]);

// These key-only definitions let the requested foreign keys be represented
// without inventing columns for the existing course and exercise tables.
export const curso = pgTable("CURSO", {
  id_curso: serial("id_curso").primaryKey(),
});

export const ejercicio = pgTable("EJERCICIO", {
  id_ejercicio: serial("id_ejercicio").primaryKey(),
});

export const usuario = pgTable("USUARIO", {
  id_usuario: uuid("id_usuario").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  nombre_completo: varchar("nombre_completo", { length: 255 }).notNull(),
  rol: rolUsuario("rol").notNull().default("ALUMNO"),
});

export const resolucion = pgTable("RESOLUCION", {
  id_resolucion: serial("id_resolucion").primaryKey(),
  estado: estadoResolucion("estado").notNull().default("PENDIENTE"),
  fecha_inicio: timestamp("fecha_inicio", { withTimezone: true }).notNull(),
  fecha_ultima_modificacion: timestamp("fecha_ultima_modificacion", {
    withTimezone: true,
  }).notNull(),
  id_ejercicio: integer("id_ejercicio")
    .notNull()
    .references(() => ejercicio.id_ejercicio),
  id_usuario_alumno: uuid("id_usuario_alumno")
    .notNull()
    .references(() => usuario.id_usuario),
});

export const feedback = pgTable("FEEDBACK", {
  id_feedback: serial("id_feedback").primaryKey(),
  estado: estadoFeedback("estado").notNull().default("PENDIENTE"),
  comentario: text("comentario").notNull(),
  fecha_creacion: timestamp("fecha_creacion", { withTimezone: true }).notNull(),
  id_resolucion: integer("id_resolucion")
    .notNull()
    .references(() => resolucion.id_resolucion),
  id_usuario_docente: uuid("id_usuario_docente")
    .notNull()
    .references(() => usuario.id_usuario),
});

export const cursoUsuario = pgTable("CURSO_USUARIO", {
  id_curso: integer("id_curso")
    .notNull()
    .references(() => curso.id_curso),
  id_usuario: uuid("id_usuario")
    .notNull()
    .references(() => usuario.id_usuario),
}, (table) => [primaryKey({ columns: [table.id_curso, table.id_usuario] })]);

export const versionModelo = pgTable("VERSION_MODELO", {
  id_version: serial("id_version").primaryKey(),
  nombre_version: varchar("nombre_version", { length: 255 }).notNull(),
  nro_version: integer("nro_version").notNull(),
  nodos_diagrama: json("nodos_diagrama").notNull(),
  condiciones_iniciales: json("condiciones_iniciales").notNull(),
  codigo_transpilado: text("codigo_transpilado").notNull(),
  fecha_creacion: timestamp("fecha_creacion", { withTimezone: true }).notNull(),
  id_resolucion: integer("id_resolucion")
    .notNull()
    .references(() => resolucion.id_resolucion),
});
