-- Rol SUPER_ADMIN: ve y administra todas las instituciones.
-- Solo otro SUPER_ADMIN puede otorgarlo o quitarlo (ver scripts/set-super-admin.js para el primero).
ALTER TABLE USUARIO
  MODIFY rol ENUM('SUPER_ADMIN', 'ADMIN', 'DOCENTE', 'ALUMNO') NOT NULL DEFAULT 'ALUMNO';
