import {
  char,
  datetime,
  mysqlEnum,
  mysqlTable,
  varchar,
} from "drizzle-orm/mysql-core";

export const ROLES = ["ADMIN", "DOCENTE", "ALUMNO"];

export const usuario = mysqlTable("USUARIO", {
  id_usuario: char("id_usuario", { length: 36 }).primaryKey(),
  nombre_usuario: varchar("nombre_usuario", { length: 50 }).unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  nombre_completo: varchar("nombre_completo", { length: 255 }).notNull(),
  institucion: varchar("institucion", { length: 100 }).notNull(),
  rol: mysqlEnum("rol", ROLES).notNull().default("ALUMNO"),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  fecha_creacion: datetime("fecha_creacion", { fsp: 3 }),
  fecha_actualizacion: datetime("fecha_actualizacion", { fsp: 3 }),
});

export const sesion = mysqlTable("SESION", {
  id_sesion: char("id_sesion", { length: 64 }).primaryKey(),
  id_usuario: char("id_usuario", { length: 36 })
    .notNull()
    .references(() => usuario.id_usuario, { onDelete: "cascade" }),
  fecha_creacion: datetime("fecha_creacion", { fsp: 3 }),
  fecha_expiracion: datetime("fecha_expiracion", { fsp: 3 }).notNull(),
});
