-- Resolución de un usuario y su análisis previo.
--
-- ANALISIS_PREVIO guarda solo el contenido del análisis. Las reglas de cada campo
-- (siglas, vectores, eventos, etc.) se validan en el frontend (src/lib/analisisPrevio.js).
--
-- RESOLUCION liga el análisis con el usuario y, en el Modo Estudio, con el ejercicio.
-- Modo Libre: id_ejercicio es NULL, así que un usuario puede tener todas las que quiera.
-- Modo Estudio: cada usuario tiene a lo sumo una resolución por ejercicio, y un
-- ejercicio tiene una por cada usuario que lo resolvió.
-- (En MySQL un UNIQUE admite varios NULL, por eso la restricción no limita al Modo Libre.)
-- Cada análisis previo pertenece a una sola resolución.

CREATE TABLE IF NOT EXISTS ANALISIS_PREVIO (
  id_analisis_previo    CHAR(36) NOT NULL,
  tipo_metodologia      ENUM('EVENTO_A_EVENTO', 'DELTA_T_CONSTANTE') NULL,
  variables             JSON     NOT NULL,
  tabla_eventos         JSON     NOT NULL,
  tabla_eventos_futuros JSON     NOT NULL,
  PRIMARY KEY (id_analisis_previo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS RESOLUCION (
  id_resolucion             CHAR(36)    NOT NULL,
  id_usuario                CHAR(36)    NOT NULL,
  id_analisis_previo        CHAR(36)    NOT NULL,
  id_ejercicio              VARCHAR(36) NULL,
  estado                    ENUM('BORRADOR', 'ENTREGADO', 'FINALIZADO') NOT NULL DEFAULT 'BORRADOR',
  fecha_inicio              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  fecha_ultima_modificacion DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                        ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id_resolucion),
  UNIQUE KEY uq_resolucion_analisis (id_analisis_previo),
  UNIQUE KEY uq_resolucion_usuario_ejercicio (id_usuario, id_ejercicio),
  KEY ix_resolucion_ejercicio (id_ejercicio),
  CONSTRAINT fk_resolucion_usuario FOREIGN KEY (id_usuario)
    REFERENCES USUARIO (id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_resolucion_analisis FOREIGN KEY (id_analisis_previo)
    REFERENCES ANALISIS_PREVIO (id_analisis_previo) ON DELETE CASCADE,
  CONSTRAINT fk_resolucion_ejercicio FOREIGN KEY (id_ejercicio)
    REFERENCES EJERCICIO (id_ejercicio) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
