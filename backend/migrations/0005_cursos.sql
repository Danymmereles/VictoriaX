-- Cursos e inscripciones (antes entidades Curso e Inscripcion de Base44).
-- id_curso conserva el id de Base44 en los cursos importados; los nuevos usan un UUID.
-- La institución se toma del administrador que crea el curso.
-- Como en Base44, el código del curso no se repite (acá, dentro de cada institución).

CREATE TABLE IF NOT EXISTS CURSO (
  id_curso            VARCHAR(36)  NOT NULL,
  codigo              VARCHAR(50)  NOT NULL,
  nombre              VARCHAR(255) NULL,
  periodo_lectivo     ENUM('ANUAL', 'CUAT1', 'CUAT2') NOT NULL,
  fecha_inicio        DATE         NOT NULL,
  fecha_final         DATE         NOT NULL,
  forzar_cierre       BOOLEAN      NOT NULL DEFAULT FALSE,
  institucion         VARCHAR(100) NOT NULL,
  id_usuario_creador  CHAR(36)     NULL,
  fecha_creacion      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  fecha_actualizacion DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                   ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_curso),
  UNIQUE KEY uq_curso_institucion_codigo (institucion, codigo),
  KEY ix_curso_creador (id_usuario_creador),
  CONSTRAINT ck_curso_fechas CHECK (fecha_final >= fecha_inicio),
  CONSTRAINT fk_curso_creador FOREIGN KEY (id_usuario_creador)
    REFERENCES USUARIO (id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Un usuario se inscribe una sola vez por curso. El rol (docente/alumno) es el del usuario.
CREATE TABLE IF NOT EXISTS INSCRIPCION (
  id_curso          VARCHAR(36) NOT NULL,
  id_usuario        CHAR(36)    NOT NULL,
  fecha_inscripcion DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_curso, id_usuario),
  KEY ix_inscripcion_usuario (id_usuario),
  CONSTRAINT fk_inscripcion_curso FOREIGN KEY (id_curso)
    REFERENCES CURSO (id_curso) ON DELETE CASCADE,
  CONSTRAINT fk_inscripcion_usuario FOREIGN KEY (id_usuario)
    REFERENCES USUARIO (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
