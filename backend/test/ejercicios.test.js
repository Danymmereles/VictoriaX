import test from "node:test";
import assert from "node:assert/strict";
import { createEjercicioService } from "../src/ejercicios/service.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../src/auth/errors.js";

function createMemoryRepository(seed = []) {
  const rows = new Map(seed.map((row) => [row.id_ejercicio, { ...row }]));
  const assertUnique = (row) => {
    for (const other of rows.values()) {
      if (
        other.id_ejercicio !== row.id_ejercicio &&
        other.institucion === row.institucion &&
        other.numero === row.numero
      ) {
        throw Object.assign(new Error("dup"), { code: "ER_DUP_ENTRY" });
      }
    }
  };
  return {
    rows,
    async findById(id) { return rows.get(id) ?? null; },
    async listByInstitucion(institucion) {
      return [...rows.values()]
        .filter((row) => row.institucion === institucion)
        .sort((a, b) => a.numero - b.numero);
    },
    async insert(values) { assertUnique(values); rows.set(values.id_ejercicio, { ...values }); return rows.get(values.id_ejercicio); },
    async update(id, changes) {
      const next = { ...rows.get(id), ...changes };
      assertUnique(next);
      rows.set(id, next);
      return next;
    },
    async remove(id, institucion) {
      if (rows.get(id)?.institucion === institucion) rows.delete(id);
    },
  };
}

const FRBA = "UTN FRBA";
const docenteFrba = { id_usuario: "d-frba", rol: "DOCENTE", institucion: FRBA };
const adminFrre = { id_usuario: "a-frre", rol: "ADMIN", institucion: "UTN FRRE" };
const alumnoFrba = { id_usuario: "al-frba", rol: "ALUMNO", institucion: FRBA };
const importado = {
  id_ejercicio: "68a1f0c2e4b0a1b2c3d4e5f6",
  numero: 1,
  titulo: "Banco",
  consigna_html: "<p>Consigna</p>",
  institucion: FRBA,
  id_usuario_creador: null,
};

function setup() {
  const repo = createMemoryRepository([importado]);
  return { repo, service: createEjercicioService({ ejercicioRepository: repo }) };
}

test("the institution comes from the author, never from the request body", async () => {
  const { service } = setup();
  const creado = await service.create(docenteFrba, {
    numero: 2,
    titulo: " Supermercado ",
    consigna_html: "<p>Cajas</p>",
    institucion: "UTN FRRE",
  });
  assert.equal(creado.institucion, FRBA);
  assert.equal(creado.id_usuario_creador, docenteFrba.id_usuario);
  assert.equal(creado.titulo, "Supermercado");
  assert.equal(creado.id, creado.id_ejercicio);
});

test("users only see exercises of their own institution", async () => {
  const { service } = setup();
  await service.create(adminFrre, { numero: 1, titulo: "Puerto", consigna_html: "<p>x</p>" });

  assert.deepEqual((await service.list(alumnoFrba)).map((e) => e.titulo), ["Banco"]);
  assert.deepEqual((await service.list(adminFrre)).map((e) => e.titulo), ["Puerto"]);
  assert.equal((await service.get(alumnoFrba, importado.id_ejercicio)).id, importado.id_ejercicio);
  await assert.rejects(service.get(adminFrre, importado.id_ejercicio), NotFoundError);
});

test("only docentes and admins of the same institution manage exercises", async () => {
  const { repo, service } = setup();
  await assert.rejects(
    service.create(alumnoFrba, { numero: 5, titulo: "X", consigna_html: "<p>x</p>" }),
    ForbiddenError,
  );
  await assert.rejects(service.update(adminFrre, importado.id_ejercicio, { titulo: "Hackeado" }), NotFoundError);
  await assert.rejects(service.remove(adminFrre, importado.id_ejercicio), NotFoundError);

  const editado = await service.update(docenteFrba, importado.id_ejercicio, { titulo: "Banco central" });
  assert.equal(editado.titulo, "Banco central");
  await service.remove(docenteFrba, importado.id_ejercicio);
  assert.equal(repo.rows.size, 0);
});

test("numbers are unique per institution and inputs are validated", async () => {
  const { service } = setup();
  await assert.rejects(
    service.create(docenteFrba, { numero: 1, titulo: "Repetido", consigna_html: "<p>x</p>" }),
    ConflictError,
  );
  // El mismo número sí puede existir en otra institución.
  await service.create(adminFrre, { numero: 1, titulo: "Puerto", consigna_html: "<p>x</p>" });

  await assert.rejects(service.create(docenteFrba, { numero: 0, titulo: "X", consigna_html: "x" }), ValidationError);
  await assert.rejects(service.create(docenteFrba, { numero: 3, titulo: " ", consigna_html: "x" }), ValidationError);
  await assert.rejects(service.create(docenteFrba, { numero: 3, titulo: "X", consigna_html: "" }), ValidationError);
  await assert.rejects(service.update(docenteFrba, importado.id_ejercicio, {}), ValidationError);
});

test("support material is optional and validated", async () => {
  const { service } = setup();
  const creado = await service.create(docenteFrba, {
    numero: 7,
    titulo: "Con apoyo",
    consigna_html: "<p>x</p>",
    apoyo: { secuencia: ["Llegada"], variables: ["IA"], sugerencia: "Usá Δt" },
  });
  assert.deepEqual(creado.apoyo, { secuencia: ["Llegada"], variables: ["IA"], sugerencia: "Usá Δt" });
  assert.equal((await service.get(alumnoFrba, importado.id_ejercicio)).apoyo, null);
  await assert.rejects(
    service.update(docenteFrba, creado.id, { apoyo: { secuencia: "no es lista" } }),
    ValidationError,
  );
});

test("the super admin sees and manages exercises of any institution", async () => {
  const { service } = setup();
  const superAdmin = { id_usuario: "sa", rol: "SUPER_ADMIN", institucion: FRBA };
  await service.create(adminFrre, { numero: 1, titulo: "Puerto", consigna_html: "<p>x</p>" });

  assert.deepEqual((await service.list(superAdmin)).map((e) => e.titulo), ["Banco"]);
  assert.deepEqual((await service.list(superAdmin, { institucion: "UTN FRRE" })).map((e) => e.titulo), ["Puerto"]);
  // El filtro no tiene efecto para el resto.
  assert.deepEqual((await service.list(alumnoFrba, { institucion: "UTN FRRE" })).map((e) => e.titulo), ["Banco"]);

  const puerto = (await service.list(adminFrre))[0];
  assert.equal((await service.get(superAdmin, puerto.id)).titulo, "Puerto");
  const creado = await service.create(superAdmin, { numero: 2, titulo: "Nuevo", consigna_html: "<p>x</p>", institucion: "UTN FRRE" });
  assert.equal(creado.institucion, "UTN FRRE");
  await service.remove(superAdmin, puerto.id);
  assert.deepEqual((await service.list(adminFrre)).map((e) => e.titulo), ["Nuevo"]);
});
