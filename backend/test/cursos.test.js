import test from "node:test";
import assert from "node:assert/strict";
import { createCursoService } from "../src/cursos/service.js";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../src/auth/errors.js";

const FRBA = "UTN FRBA";
const u = (id_usuario, rol, institucion = FRBA) => ({
  id_usuario, rol, institucion, email: `${id_usuario}@x`, nombre_completo: id_usuario, nombre_usuario: null,
});
const usuarios = new Map(
  [
    u("admin", "ADMIN"), u("doc1", "DOCENTE"), u("doc2", "DOCENTE"), u("alu1", "ALUMNO"), u("alu2", "ALUMNO"),
    u("admin-frre", "ADMIN", "UTN FRRE"), u("doc-frre", "DOCENTE", "UTN FRRE"), u("alu-frre", "ALUMNO", "UTN FRRE"),
    u("super", "SUPER_ADMIN"),
  ].map((x) => [x.id_usuario, x]),
);
const U = (id) => usuarios.get(id);

function createMemoryRepository() {
  const cursos = new Map();
  const inscripciones = new Set();
  const key = (c, id) => `${c}|${id}`;
  const dup = () => Object.assign(new Error("dup"), { code: "ER_DUP_ENTRY" });
  return {
    cursos,
    inscripciones,
    async findById(id) { return cursos.get(id) ?? null; },
    async listByInstitucion(inst) { return [...cursos.values()].filter((c) => c.institucion === inst); },
    async listAll() { return [...cursos.values()]; },
    async listByIntegrante(id) { return [...cursos.values()].filter((c) => inscripciones.has(key(c.id_curso, id))); },
    async insert(values, ids) {
      if ([...cursos.values()].some((c) => c.institucion === values.institucion && c.codigo === values.codigo)) throw dup();
      cursos.set(values.id_curso, { ...values });
      ids.forEach((id) => inscripciones.add(key(values.id_curso, id)));
      return cursos.get(values.id_curso);
    },
    async update(id, changes) { cursos.set(id, { ...cursos.get(id), ...changes }); return cursos.get(id); },
    async remove(id) { cursos.delete(id); },
    async listIntegrantes(id) { return [...usuarios.values()].filter((x) => inscripciones.has(key(id, x.id_usuario))); },
    async isIntegrante(c, id) { return inscripciones.has(key(c, id)); },
    async addIntegrantes(c, ids) {
      if (ids.some((id) => inscripciones.has(key(c, id)))) throw dup();
      ids.forEach((id) => inscripciones.add(key(c, id)));
    },
    async removeIntegrante(c, id) { inscripciones.delete(key(c, id)); },
  };
}

const datos = {
  codigo: "K4561",
  periodo_lectivo: "CUAT1",
  fecha_inicio: "2026-03-03",
  fecha_final: "2026-12-01",
  docentes: ["doc1"],
};

function setup() {
  const repo = createMemoryRepository();
  const service = createCursoService({
    cursoRepository: repo,
    userRepository: { findById: async (id) => usuarios.get(id) ?? null },
    resolucionRepository: { listByCurso: async () => [] },
  });
  return { repo, service };
}

test("only admins create courses, in their own institution and with a teacher", async () => {
  const { service } = setup();
  await assert.rejects(service.create(U("doc1"), datos), ForbiddenError);
  await assert.rejects(service.create(U("admin"), { ...datos, docentes: [] }), ValidationError);
  await assert.rejects(service.create(U("admin"), { ...datos, docentes: ["alu1"] }), ValidationError);
  await assert.rejects(service.create(U("admin"), { ...datos, docentes: ["doc-frre"] }), NotFoundError);
  await assert.rejects(service.create(U("admin"), { ...datos, fecha_final: "2026-01-01" }), ValidationError);
  await assert.rejects(service.create(U("admin"), { ...datos, fecha_inicio: "2026-02-30" }), ValidationError);

  const c = await service.create(U("admin"), { ...datos, institucion: "UTN FRRE" });
  assert.equal(c.institucion, FRBA);
  assert.equal(c.nombre, null);
  await assert.rejects(service.create(U("admin"), datos), ConflictError);
  await service.create(U("admin-frre"), { ...datos, docentes: ["doc-frre"] });
});

test("admins see every course of their institution, others only their own", async () => {
  const { service } = setup();
  const c = await service.create(U("admin"), datos);
  await service.create(U("admin"), { ...datos, codigo: "K9999", docentes: ["doc2"] });

  assert.equal((await service.list(U("admin"))).length, 2);
  assert.deepEqual((await service.list(U("doc1"))).map((x) => x.codigo), ["K4561"]);
  assert.deepEqual(await service.list(U("alu1")), []);
  assert.deepEqual(await service.list(U("admin-frre")), []);

  await assert.rejects(service.get(U("alu1"), c.id), NotFoundError);
  await assert.rejects(service.get(U("admin-frre"), c.id), NotFoundError);
  const detalle = await service.get(U("doc1"), c.id);
  assert.deepEqual(detalle.integrantes.map((x) => x.id_usuario), ["doc1"]);
});

test("teachers of the course manage members; a course keeps at least one teacher", async () => {
  const { service } = setup();
  const c = await service.create(U("admin"), datos);
  await assert.rejects(service.agregarIntegrante(U("doc2"), c.id, "alu1"), NotFoundError);

  await service.agregarIntegrante(U("doc1"), c.id, "alu1");
  await assert.rejects(service.agregarIntegrante(U("doc1"), c.id, "alu1"), ConflictError);
  await assert.rejects(service.agregarIntegrante(U("doc1"), c.id, "admin"), ValidationError);
  await assert.rejects(service.agregarIntegrante(U("doc1"), c.id, "doc-frre"), NotFoundError);
  assert.equal((await service.list(U("alu1"))).length, 1);

  await assert.rejects(service.agregarIntegrante(U("alu1"), c.id, "alu2"), ForbiddenError);
  await assert.rejects(service.resoluciones(U("alu1"), c.id), ForbiddenError);
  await assert.rejects(service.quitarIntegrante(U("doc1"), c.id, "doc1"), ConflictError);

  await service.agregarIntegrante(U("admin"), c.id, "doc2");
  await service.quitarIntegrante(U("doc2"), c.id, "doc1");
  await service.quitarIntegrante(U("doc2"), c.id, "alu1");
  assert.deepEqual(await service.list(U("alu1")), []);
});

test("only admins edit and delete courses", async () => {
  const { repo, service } = setup();
  const c = await service.create(U("admin"), datos);
  await assert.rejects(service.update(U("doc1"), c.id, { nombre: "X" }), ForbiddenError);
  await assert.rejects(service.update(U("admin"), c.id, { fecha_final: "2026-01-01" }), ValidationError);
  const editado = await service.update(U("admin"), c.id, { nombre: " Simulación ", forzar_cierre: true });
  assert.equal(editado.nombre, "Simulación");
  assert.equal(editado.forzar_cierre, true);

  await assert.rejects(service.remove(U("doc1"), c.id), ForbiddenError);
  await assert.rejects(service.remove(U("admin-frre"), c.id), NotFoundError);
  await service.remove(U("admin"), c.id);
  assert.equal(repo.cursos.size, 0);
});

test("the super admin sees, filters and manages courses of any institution", async () => {
  const { service } = setup();
  await service.create(U("admin"), datos);
  const frre = await service.create(U("admin-frre"), { ...datos, docentes: ["doc-frre"] });

  assert.equal((await service.list(U("super"))).length, 2);
  assert.deepEqual((await service.list(U("super"), { institucion: "UTN FRRE" })).map((c) => c.id), [frre.id]);
  assert.equal((await service.list(U("admin"), { institucion: "UTN FRRE" })).length, 1);

  assert.equal((await service.get(U("super"), frre.id)).curso.institucion, "UTN FRRE");
  // Los integrantes tienen que ser de la institución del curso, no de la del super admin.
  await service.agregarIntegrante(U("super"), frre.id, "alu-frre");
  await assert.rejects(service.agregarIntegrante(U("super"), frre.id, "alu1"), NotFoundError);

  const creado = await service.create(U("super"), { ...datos, codigo: "R1", institucion: "UTN FRRE", docentes: ["doc-frre"] });
  assert.equal(creado.institucion, "UTN FRRE");
  await assert.rejects(
    service.create(U("super"), { ...datos, codigo: "R2", institucion: "UTN FRRE", docentes: ["doc1"] }),
    NotFoundError,
  );
  await service.update(U("super"), frre.id, { nombre: "Puerto" });
  await service.remove(U("super"), frre.id);
});

test("several members are added together, all or none", async () => {
  const { repo, service } = setup();
  const c = await service.create(U("admin"), datos);
  const agregados = await service.agregarIntegrantes(U("doc1"), c.id, ["alu1", "alu2", "alu1", "doc2"]);
  assert.deepEqual(agregados.map((x) => x.id_usuario), ["alu1", "alu2", "doc2"]);

  const antes = repo.inscripciones.size;
  await assert.rejects(service.agregarIntegrantes(U("doc1"), c.id, ["alu-frre"]), NotFoundError);
  await assert.rejects(service.agregarIntegrantes(U("doc1"), c.id, []), ValidationError);
  await assert.rejects(service.agregarIntegrantes(U("alu1"), c.id, ["alu2"]), ForbiddenError);
  // Uno inválido (de otra institución) frena a todos.
  await assert.rejects(service.agregarIntegrantes(U("admin"), c.id, ["alu-frre", "admin"]), NotFoundError);
  await assert.rejects(service.agregarIntegrantes(U("admin"), c.id, ["alu1"]), ConflictError);
  assert.equal(repo.inscripciones.size, antes);
});
