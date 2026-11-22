-- Usuarios y sesiones de VictoriaX (MySQL 8+).
-- Reemplaza a Supabase Auth y a la entidad Usuario de Base44.

CREATE TABLE IF NOT EXISTS USUARIO (
  id_usuario          CHAR(36)     NOT NULL,
  nombre_usuario      VARCHAR(50)  NULL,
  email               VARCHAR(320) NOT NULL,
  nombre_completo     VARCHAR(255) NOT NULL,
  institucion         VARCHAR(100) NOT NULL DEFAULT 'Sin institución',
  rol                 ENUM('ADMIN', 'DOCENTE', 'ALUMNO') NOT NULL DEFAULT 'ALUMNO',
  password_hash       VARCHAR(255) NOT NULL,
  fecha_creacion      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  fecha_actualizacion DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                   ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuario_email (email),
  UNIQUE KEY uq_usuario_nombre_usuario (nombre_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Se guarda el SHA-256 del token, nunca el token en claro.
CREATE TABLE IF NOT EXISTS SESION (
  id_sesion        CHAR(64)    NOT NULL,
  id_usuario       CHAR(36)    NOT NULL,
  fecha_creacion   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  fecha_expiracion DATETIME(3) NOT NULL,
  PRIMARY KEY (id_sesion),
  KEY ix_sesion_usuario (id_usuario),
  KEY ix_sesion_expiracion (fecha_expiracion),
  CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario)
    REFERENCES USUARIO (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
