// Crea (o restablece) las cuentas demo en la base MySQL local.
import { randomUUID } from "node:crypto";
import { createBusinessDatabase } from "../src/db/client.js";
import { createUserRepository } from "../src/db/userRepository.js";
import { hashPassword } from "../src/auth/password.js";

const PASSWORD = "VictoriaX123";
const DEMO_USERS = [
  { email: "alumno@frba.utn.edu.ar", nombre_completo: "Alumno de prueba", rol: "ALUMNO", institucion: "UTN FRBA" },
  { email: "docente@frba.utn.edu.ar", nombre_completo: "Docente de prueba", rol: "DOCENTE", institucion: "UTN FRBA" },
  { email: "admin@frba.utn.edu.ar", nombre_completo: "Administrador de prueba", rol: "ADMIN", institucion: "UTN FRBA" },
  { email: "superadmin@frba.utn.edu.ar", nombre_completo: "Super administrador de prueba", rol: "SUPER_ADMIN", institucion: "UTN FRBA" },
];

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL es obligatorio.");
let host;
try {
  host = new URL(DATABASE_URL).hostname;
} catch {
  throw new Error("DATABASE_URL no tiene un formato válido.");
}
if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
  throw new Error("Por seguridad, las cuentas demo solo se crean en una base local.");
}

const { db, close } = createBusinessDatabase(DATABASE_URL);
const repository = createUserRepository(db);

try {
  for (const demo of DEMO_USERS) {
    const password_hash = await hashPassword(PASSWORD);
    const existing = await repository.findByEmail(demo.email);
    if (existing) {
      await repository.updateUser(existing.id_usuario, { ...demo, password_hash });
    } else {
      await repository.insertUser({ id_usuario: randomUUID(), ...demo, password_hash });
    }
    console.log(`Listo: ${demo.email} (${demo.rol})`);
  }
  console.log(`Contraseña de todas las cuentas demo: ${PASSWORD}`);
} finally {
  await close();
}
