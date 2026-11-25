ALTER TABLE USUARIO
  ADD COLUMN email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN estado ENUM('ACTIVO', 'SUSPENDIDO') NOT NULL DEFAULT 'ACTIVO';

CREATE TABLE TOKEN_AUTH (
  id_token      CHAR(36)     NOT NULL,
  id_usuario    CHAR(36)     NOT NULL,
  token_hash    CHAR(64)     NOT NULL,
  tipo          ENUM('VERIFICACION_EMAIL', 'RESET_PASSWORD') NOT NULL,
  expira_en     DATETIME(3)  NOT NULL,
  usado_en      DATETIME(3)  NULL,
  fecha_creacion DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_token),
  UNIQUE KEY uq_token_auth_hash (token_hash),
  KEY ix_token_auth_usuario_tipo (id_usuario, tipo),
  KEY ix_token_auth_expiracion (expira_en),
  CONSTRAINT fk_token_auth_usuario FOREIGN KEY (id_usuario)
    REFERENCES USUARIO (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
