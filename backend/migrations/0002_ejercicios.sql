-- Ejercicios de la guía de trabajos prácticos (antes entidad Ejercicio de Base44).
-- id_ejercicio conserva el id de Base44 en los ejercicios importados, para que las
-- entregas que todavía viven en Base44 sigan apuntando al mismo ejercicio.
-- Los ejercicios nuevos usan un UUID.
-- La institución se toma del docente o administrador que crea el ejercicio.

CREATE TABLE IF NOT EXISTS EJERCICIO (
  id_ejercicio        VARCHAR(36)  NOT NULL,
  numero              INT UNSIGNED NOT NULL,
  titulo              VARCHAR(255) NOT NULL,
  consigna_html       MEDIUMTEXT   NOT NULL,
  institucion         VARCHAR(100) NOT NULL,
  id_usuario_creador  CHAR(36)     NULL,
  fecha_creacion      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  fecha_actualizacion DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                   ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_ejercicio),
  UNIQUE KEY uq_ejercicio_institucion_numero (institucion, numero),
  KEY ix_ejercicio_creador (id_usuario_creador),
  CONSTRAINT fk_ejercicio_creador FOREIGN KEY (id_usuario_creador)
    REFERENCES USUARIO (id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
