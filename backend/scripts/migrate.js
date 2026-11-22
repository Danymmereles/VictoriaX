// Aplica en orden los archivos de migrations/ que todavía no se ejecutaron.
import { readdir, readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL es obligatorio.");

const migrationsDir = new URL("../migrations/", import.meta.url);
const connection = await mysql.createConnection({
  uri: DATABASE_URL,
  multipleStatements: true,
});

try {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS MIGRACION (
      nombre VARCHAR(255) NOT NULL PRIMARY KEY,
      fecha_aplicacion DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  const [rows] = await connection.query("SELECT nombre FROM MIGRACION");
  const applied = new Set(rows.map((row) => row.nombre));
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(new URL(file, migrationsDir), "utf8");
    await connection.query(sql);
    await connection.query("INSERT INTO MIGRACION (nombre) VALUES (?)", [file]);
    console.log(`Migración aplicada: ${file}`);
  }
  console.log("Base de datos al día.");
} finally {
  await connection.end();
}
