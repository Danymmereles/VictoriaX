BEGIN;

CREATE TYPE rol_usuario AS ENUM ('ADMIN', 'DOCENTE', 'ALUMNO');
CREATE TYPE estado_resolucion AS ENUM ('PENDIENTE', 'ENTREGADO', 'REVISADO');
CREATE TYPE estado_feedback AS ENUM ('PENDIENTE', 'LEIDO');

-- Minimal key tables needed to declare the foreign keys in this schema.
-- Add application-specific columns to these tables when migrating existing data.
CREATE TABLE "CURSO" (
  id_curso SERIAL PRIMARY KEY
);

CREATE TABLE "EJERCICIO" (
  id_ejercicio SERIAL PRIMARY KEY
);

CREATE TABLE "USUARIO" (
  id_usuario UUID PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  nombre_completo VARCHAR(255) NOT NULL,
  rol rol_usuario NOT NULL DEFAULT 'ALUMNO'
);

CREATE TABLE "RESOLUCION" (
  id_resolucion SERIAL PRIMARY KEY,
  estado estado_resolucion NOT NULL DEFAULT 'PENDIENTE',
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_ultima_modificacion TIMESTAMPTZ NOT NULL,
  id_ejercicio INTEGER NOT NULL REFERENCES "EJERCICIO"(id_ejercicio),
  id_usuario_alumno UUID NOT NULL REFERENCES "USUARIO"(id_usuario)
);

CREATE TABLE "FEEDBACK" (
  id_feedback SERIAL PRIMARY KEY,
  estado estado_feedback NOT NULL DEFAULT 'PENDIENTE',
  comentario TEXT NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL,
  id_resolucion INTEGER NOT NULL REFERENCES "RESOLUCION"(id_resolucion),
  id_usuario_docente UUID NOT NULL REFERENCES "USUARIO"(id_usuario)
);

CREATE TABLE "CURSO_USUARIO" (
  id_curso INTEGER NOT NULL REFERENCES "CURSO"(id_curso),
  id_usuario UUID NOT NULL REFERENCES "USUARIO"(id_usuario),
  PRIMARY KEY (id_curso, id_usuario)
);

CREATE TABLE "VERSION_MODELO" (
  id_version SERIAL PRIMARY KEY,
  nombre_version VARCHAR(255) NOT NULL,
  nro_version INTEGER NOT NULL,
  nodos_diagrama JSON NOT NULL,
  condiciones_iniciales JSON NOT NULL,
  codigo_transpilado TEXT NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL,
  id_resolucion INTEGER NOT NULL REFERENCES "RESOLUCION"(id_resolucion)
);

COMMIT;
