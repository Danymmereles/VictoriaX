import { createClient } from "@supabase/supabase-js";
import { createBusinessDatabase } from "../src/db/client.js";
import { createUserRepository } from "../src/db/userRepository.js";

const TEST_USER = {
  email: "alumno@frba.utn.edu.ar",
  password: "VictoriaX123",
  nombreCompleto: "Alumno de prueba",
};

function assertLocalEnvironment() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const databaseUrl = process.env.DATABASE_URL;
  if (!supabaseUrl || !databaseUrl) {
    throw new Error("SUPABASE_URL y DATABASE_URL son obligatorios.");
  }

  let supabaseHost;
  let databaseHost;
  try {
    supabaseHost = new URL(supabaseUrl).hostname;
    databaseHost = new URL(databaseUrl).hostname;
  } catch {
    throw new Error("SUPABASE_URL o DATABASE_URL no tiene un formato válido.");
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (!localHosts.has(supabaseHost) || !localHosts.has(databaseHost)) {
    throw new Error(
      "Por seguridad, el usuario de prueba solo se puede crear con Supabase y PostgreSQL locales.",
    );
  }
}

assertLocalEnvironment();

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL,
} = process.env;
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY es obligatorio.");
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { db, close } = createBusinessDatabase(DATABASE_URL);
const repository = createUserRepository(db);
let createdIdentity = false;
let userId;

try {
  const { data: users, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw listError;
  let user = users.users.find(
    (candidate) => candidate.email?.toLowerCase() === TEST_USER.email,
  );

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true,
      user_metadata: { full_name: TEST_USER.nombreCompleto },
    });
    if (error) throw error;
    user = data.user;
    createdIdentity = true;
  }
  if (!user?.id) {
    throw new Error("Supabase no devolvió el UUID del usuario de prueba.");
  }
  userId = user.id;
  if (!createdIdentity) {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: TEST_USER.password,
      email_confirm: true,
    });
    if (error) throw error;
  }

  const existingShadow = await repository.findById(user.id);
  if (!existingShadow) {
    await repository.insertShadowUser({
      id_usuario: user.id,
      email: TEST_USER.email,
      nombre_completo: TEST_USER.nombreCompleto,
    });
  }

  console.log(`Usuario local listo: ${TEST_USER.email}`);
  console.log("Rol: ALUMNO");
  console.log("Contraseña: VictoriaX123");
} catch (error) {
  if (createdIdentity && userId) {
    const { error: rollbackError } = await admin.auth.admin.deleteUser(userId);
    if (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        "Falló el seed local y no se pudo eliminar el usuario recién creado.",
      );
    }
  }
  throw error;
} finally {
  await close();
}
