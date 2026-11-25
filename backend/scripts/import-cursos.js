// Importa a MySQL los cursos exportados de Base44 (sin inscripciones: los usuarios de
// Base44 no son los de MySQL, así que los integrantes se vuelven a cargar desde la app).
// Uso: npm run import:cursos -- <archivo.json> [institucion]
// El JSON es un arreglo de registros de Base44
// ({ id, codigo, nombre, periodo_lectivo, fecha_inicio, fecha_final, forzar_cierre }).
// Conserva el id de Base44 y es idempotente: si el curso ya existe, lo actualiza.
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const PERIODOS = new Set(["ANUAL", "CUAT1", "CUAT2"]);
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const [file, institucion = "UTN FRBA"] = process.argv.slice(2);
if (!file) throw new Error("Uso: npm run import:cursos -- <archivo.json> [institucion]");
const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL es obligatorio.");

const parsed = JSON.parse(await readFile(file, "utf8"));
const registros = Array.isArray(parsed) ? parsed : parsed.items;
if (!Array.isArray(registros)) throw new Error("El archivo debe contener un arreglo de cursos.");

const filas = registros.map((r, i) => {
  if (typeof r.id !== "string" || !/^[A-Za-z0-9-]{1,36}$/.test(r.id)) throw new Error(`Registro ${i}: id inválido.`);
  if (typeof r.codigo !== "string" || !r.codigo.trim()) throw new Error(`Registro ${i}: falta el código.`);
  if (!PERIODOS.has(r.periodo_lectivo)) throw new Error(`Registro ${i}: período inválido.`);
  const inicio = String(r.fecha_inicio ?? "").slice(0, 10);
  const final = String(r.fecha_final ?? "").slice(0, 10);
  if (!FECHA.test(inicio) || !FECHA.test(final) || final < inicio) {
    throw new Error(`Registro ${i}: fechas inválidas.`);
  }
  const nombre = typeof r.nombre === "string" && r.nombre.trim() ? r.nombre.trim() : null;
  return [r.id, r.codigo.trim(), nombre, r.periodo_lectivo, inicio, final, Boolean(r.forzar_cierre), institucion];
});

const connection = await mysql.createConnection({ uri: DATABASE_URL });
try {
  await connection.beginTransaction();
  for (const fila of filas) {
    await connection.query(
      `INSERT INTO CURSO (id_curso, codigo, nombre, periodo_lectivo, fecha_inicio, fecha_final, forzar_cierre, institucion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE codigo = VALUES(codigo), nombre = VALUES(nombre),
         periodo_lectivo = VALUES(periodo_lectivo), fecha_inicio = VALUES(fecha_inicio),
         fecha_final = VALUES(fecha_final), forzar_cierre = VALUES(forzar_cierre),
         institucion = VALUES(institucion)`,
      fila,
    );
  }
  await connection.commit();
  console.log(`Cursos importados para ${institucion}: ${filas.length}`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
