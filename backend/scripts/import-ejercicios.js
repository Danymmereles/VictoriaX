// Importa a MySQL los ejercicios exportados de Base44.
// Uso: npm run import:ejercicios -- <archivo.json> [institucion]
// El JSON es un arreglo de registros de Base44 ({ id, numero, titulo, consigna_html, apoyo }).
// Conserva el id de Base44 y es idempotente: si el ejercicio ya existe, lo actualiza.
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const [file, institucion = "UTN FRBA"] = process.argv.slice(2);
if (!file) {
  throw new Error("Uso: npm run import:ejercicios -- <archivo.json> [institucion]");
}
const { DATABASE_URL } = process.env;
if (!DATABASE_URL) throw new Error("DATABASE_URL es obligatorio.");

const parsed = JSON.parse(await readFile(file, "utf8"));
const registros = Array.isArray(parsed) ? parsed : parsed.items;
if (!Array.isArray(registros)) throw new Error("El archivo debe contener un arreglo de ejercicios.");

const filas = registros.map((r, i) => {
  const numero = Number(r.numero);
  if (typeof r.id !== "string" || !/^[A-Za-z0-9-]{1,36}$/.test(r.id)) {
    throw new Error(`Registro ${i}: id inválido.`);
  }
  if (!Number.isInteger(numero) || numero < 1) throw new Error(`Registro ${i}: número inválido.`);
  if (typeof r.titulo !== "string" || !r.titulo.trim()) throw new Error(`Registro ${i}: falta el título.`);
  if (typeof r.consigna_html !== "string") throw new Error(`Registro ${i}: falta la consigna.`);
  const apoyo = r.apoyo && typeof r.apoyo === "object" ? JSON.stringify(r.apoyo) : null;
  return [r.id, numero, r.titulo.trim(), r.consigna_html, apoyo, institucion];
});

const connection = await mysql.createConnection({ uri: DATABASE_URL });
try {
  await connection.beginTransaction();
  for (const fila of filas) {
    await connection.query(
      `INSERT INTO EJERCICIO (id_ejercicio, numero, titulo, consigna_html, apoyo, institucion)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE numero = VALUES(numero), titulo = VALUES(titulo),
         consigna_html = VALUES(consigna_html), apoyo = VALUES(apoyo), institucion = VALUES(institucion)`,
      fila,
    );
  }
  await connection.commit();
  console.log(`Ejercicios importados para ${institucion}: ${filas.length}`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
