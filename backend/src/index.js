import { createClient } from "@supabase/supabase-js";
import { createBusinessDatabase } from "./db/client.js";
import { createUserRepository } from "./db/userRepository.js";
import { createAuthService } from "./auth/service.js";
import { createAuthMiddleware } from "./auth/middleware.js";
import { createApiServer } from "./http/server.js";

const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL,
  FRONTEND_ORIGIN = "http://localhost:5173",
  PORT = "3001",
} = process.env;

for (const [name, value] of Object.entries({
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL,
})) {
  if (!value) {
    throw new Error(`${name} es obligatorio.`);
  }
}

const supabaseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};
const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, supabaseOptions);
const adminClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  supabaseOptions,
);
const { db, close } = createBusinessDatabase(DATABASE_URL);
const userRepository = createUserRepository(db);
const authService = createAuthService({ authClient, adminClient, userRepository });
const server = createApiServer({
  authService,
  authMiddleware: createAuthMiddleware(authClient),
  userRepository,
  frontendOrigin: FRONTEND_ORIGIN,
});

server.listen(Number(PORT), () => {
  console.log(`VictoriaX API disponible en http://localhost:${PORT}`);
});

async function shutdown() {
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
