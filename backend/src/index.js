import { createBusinessDatabase } from "./db/client.js";
import { createUserRepository } from "./db/userRepository.js";
import { createAuthService } from "./auth/service.js";
import { createAuthMiddleware } from "./auth/middleware.js";
import { createApiServer } from "./http/server.js";
import { createMailService } from "./mail/mailService.js";
import { createEjercicioRepository } from "./db/ejercicioRepository.js";
import { createEjercicioService } from "./ejercicios/service.js";
import { createResolucionRepository } from "./db/resolucionRepository.js";
import { createResolucionService } from "./resoluciones/service.js";
import { createCursoRepository } from "./db/cursoRepository.js";
import { createCursoService } from "./cursos/service.js";
import { createInstitucionRepository, createInstitucionService } from "./instituciones/service.js";

const {
  DATABASE_URL,
  FRONTEND_ORIGIN = "http://localhost:5173",
  PORT = "3001",
} = process.env;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL es obligatorio.");
}

const { db, close } = createBusinessDatabase(DATABASE_URL);
const userRepository = createUserRepository(db);
const mailService = createMailService();
const authService = createAuthService({ userRepository, mailService, frontendOrigin: FRONTEND_ORIGIN });
const ejercicioRepository = createEjercicioRepository(db);
const ejercicioService = createEjercicioService({ ejercicioRepository });
const resolucionRepository = createResolucionRepository(db);
const resolucionService = createResolucionService({ resolucionRepository, ejercicioRepository });
const cursoService = createCursoService({
  cursoRepository: createCursoRepository(db),
  userRepository,
  resolucionRepository,
});
const server = createApiServer({
  authService,
  authMiddleware: createAuthMiddleware(authService),
  ejercicioService,
  resolucionService,
  cursoService,
  institucionService: createInstitucionService({
    institucionRepository: createInstitucionRepository(db),
  }),
  frontendOrigin: FRONTEND_ORIGIN,
});

// Limpieza periódica de sesiones vencidas.
const cleanup = setInterval(() => {
  userRepository.deleteExpiredSessions().catch((error) => {
    console.error("No se pudieron borrar las sesiones vencidas:", error);
  });
}, 60 * 60 * 1000);
cleanup.unref();

server.listen(Number(PORT), () => {
  console.log(`VictoriaX API disponible en http://localhost:${PORT}`);
});

async function shutdown() {
  clearInterval(cleanup);
  server.close(async (error) => {
    await close();
    if (error) {
      console.error("Error al cerrar VictoriaX API:", error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
