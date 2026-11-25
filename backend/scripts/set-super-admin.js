// Otorga (o quita) el rol SUPER_ADMIN a una cuenta existente.
// Sirve para crear el primer super admin: después se puede gestionar desde Participantes.
// Uso: npm run set:super-admin -- <email> [--quitar]
// Al quitarlo, la cuenta pasa a ADMIN.
import mysql from "mysql2/promise";

const [email, flag] = process.argv.slice(2);
if (!email) throw new Error("Uso: npm run set:super-admin -- <email> [--quitar]");
const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL es obligatorio.");

const rol = flag === "--quitar" ? "ADMIN" : "SUPER_ADMIN";
const connection = await mysql.createConnection({ uri: DATABASE_URL });
try {
  const [result] = await connection.query("UPDATE USUARIO SET rol = ? WHERE email = ?", [
    rol,
    email.trim().toLowerCase(),
  ]);
  if (result.affectedRows === 0) throw new Error(`No existe una cuenta con el email ${email}.`);
  console.log(`${email}: rol ${rol}. Tiene que volver a iniciar sesión para verlo.`);
} finally {
  await connection.end();
}
