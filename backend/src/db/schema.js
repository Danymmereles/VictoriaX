import {
  boolean,
  char,
  date,
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  uniqueIndex,
  primaryKey,
  int,
  json,
  mediumtext,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

export const ROLES = ["SUPER_ADMIN", "ADMIN", "DOCENTE", "ALUMNO"];

export const usuario = mysqlTable("USUARIO", {
  id_usuario: char("id_usuario", { length: 36 }).primaryKey(),
  nombre_usuario: varchar("nombre_usuario", { length: 50 }).unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  nombre_completo: varchar("nombre_completo", { length: 255 }).notNull(),
  institucion: varchar("institucion", { length: 100 }).notNull(),
  rol: mysqlEnum("rol", ROLES).notNull().default("ALUMNO"),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  email_verificado: boolean("email_verificado").notNull().default(false),
  estado: mysqlEnum("estado", ["ACTIVO", "SUSPENDIDO"]).notNull().default("ACTIVO"),
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

export const tokenAuth = mysqlTable(
  "TOKEN_AUTH",
  {
    id_token: char("id_token", { length: 36 }).primaryKey(),
    id_usuario: char("id_usuario", { length: 36 })
      .notNull()
      .references(() => usuario.id_usuario, { onDelete: "cascade" }),
    token_hash: char("token_hash", { length: 64 }).notNull(),
    tipo: mysqlEnum("tipo", ["VERIFICACION_EMAIL", "RESET_PASSWORD"]).notNull(),
    expira_en: datetime("expira_en", { fsp: 3 }).notNull(),
    usado_en: datetime("usado_en", { fsp: 3 }),
    fecha_creacion: datetime("fecha_creacion", { fsp: 3 }).notNull(),
  },
  (table) => [
    uniqueIndex("uq_token_auth_hash").on(table.token_hash),
    index("ix_token_auth_usuario_tipo").on(table.id_usuario, table.tipo),
    index("ix_token_auth_expiracion").on(table.expira_en),
  ],
);
export const ejercicio = mysqlTable("EJERCICIO", {
  id_ejercicio: varchar("id_ejercicio", { length: 36 }).primaryKey(),
  numero: int("numero", { unsigned: true }).notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  consigna_html: mediumtext("consigna_html").notNull(),
  apoyo: json("apoyo"),
  institucion: varchar("institucion", { length: 100 }).notNull(),
  id_usuario_creador: char("id_usuario_creador", { length: 36 })
    .references(() => usuario.id_usuario, { onDelete: "set null" }),
  fecha_creacion: datetime("fecha_creacion", { fsp: 3 }),
  fecha_actualizacion: datetime("fecha_actualizacion", { fsp: 3 }),
}, (table) => [
  unique("uq_ejercicio_institucion_numero").on(table.institucion, table.numero),
]);

export const METODOLOGIAS = ["EVENTO_A_EVENTO", "DELTA_T_CONSTANTE"];
export const ESTADOS_RESOLUCION = ["BORRADOR", "ENTREGADO", "FINALIZADO"];

// Solo el contenido; las reglas de cada campo se validan en el frontend.
export const analisisPrevio = mysqlTable("ANALISIS_PREVIO", {
  id_analisis_previo: char("id_analisis_previo", { length: 36 }).primaryKey(),
  tipo_metodologia: mysqlEnum("tipo_metodologia", METODOLOGIAS),
  variables: json("variables").notNull(),
  tabla_eventos: json("tabla_eventos").notNull(),
  tabla_eventos_futuros: json("tabla_eventos_futuros").notNull(),
});

// id_ejercicio NULL = Modo Libre; con ejercicio, una resolución por usuario.
export const resolucion = mysqlTable("RESOLUCION", {
  id_resolucion: char("id_resolucion", { length: 36 }).primaryKey(),
  id_usuario: char("id_usuario", { length: 36 })
    .notNull()
    .references(() => usuario.id_usuario, { onDelete: "cascade" }),
  id_analisis_previo: char("id_analisis_previo", { length: 36 })
    .notNull()
    .references(() => analisisPrevio.id_analisis_previo, { onDelete: "cascade" }),
  id_ejercicio: varchar("id_ejercicio", { length: 36 })
    .references(() => ejercicio.id_ejercicio, { onDelete: "cascade" }),
  estado: mysqlEnum("estado", ESTADOS_RESOLUCION).notNull().default("BORRADOR"),
  fecha_inicio: datetime("fecha_inicio", { fsp: 3 }),
  fecha_ultima_modificacion: datetime("fecha_ultima_modificacion", { fsp: 3 }),
}, (table) => [
  unique("uq_resolucion_analisis").on(table.id_analisis_previo),
  unique("uq_resolucion_usuario_ejercicio").on(table.id_usuario, table.id_ejercicio),
]);

export const PERIODOS_LECTIVOS = ["ANUAL", "CUAT1", "CUAT2"];

// Las fechas viajan como "AAAA-MM-DD", igual que en Base44.
export const curso = mysqlTable("CURSO", {
  id_curso: varchar("id_curso", { length: 36 }).primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull(),
  nombre: varchar("nombre", { length: 255 }),
  periodo_lectivo: mysqlEnum("periodo_lectivo", PERIODOS_LECTIVOS).notNull(),
  fecha_inicio: date("fecha_inicio", { mode: "string" }).notNull(),
  fecha_final: date("fecha_final", { mode: "string" }).notNull(),
  forzar_cierre: boolean("forzar_cierre").notNull().default(false),
  institucion: varchar("institucion", { length: 100 }).notNull(),
  id_usuario_creador: char("id_usuario_creador", { length: 36 })
    .references(() => usuario.id_usuario, { onDelete: "set null" }),
  fecha_creacion: datetime("fecha_creacion", { fsp: 3 }),
  fecha_actualizacion: datetime("fecha_actualizacion", { fsp: 3 }),
}, (table) => [
  unique("uq_curso_institucion_codigo").on(table.institucion, table.codigo),
]);

export const inscripcion = mysqlTable("INSCRIPCION", {
  id_curso: varchar("id_curso", { length: 36 })
    .notNull()
    .references(() => curso.id_curso, { onDelete: "cascade" }),
  id_usuario: char("id_usuario", { length: 36 })
    .notNull()
    .references(() => usuario.id_usuario, { onDelete: "cascade" }),
  fecha_inscripcion: datetime("fecha_inscripcion", { fsp: 3 }),
}, (table) => [
  primaryKey({ columns: [table.id_curso, table.id_usuario] }),
]);
