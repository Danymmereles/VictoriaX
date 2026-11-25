import test from "node:test";
import assert from "node:assert/strict";
import { createResolucionService } from "../src/resoluciones/service.js";
import { ConflictError, NotFoundError, ValidationError } from "../src/auth/errors.js";

function createMemoryRepository() {
  const rows = new Map();
  let reloj = 0;
  return {
    rows,
    async findById(id) { return rows.get(id) ?? null; },
    async listByUsuario(id_usuario, { id_ejercicio, libre } = {}) {
      return [...rows.values()]
        .filter((r) => r.id_usuario === id_usuario)
        .filter((r) => !id_ejercicio || r.id_ejercicio === id_ejercicio)
        .filter((r) => !libre || r.id_ejercicio === null)
        .sort((a, b) => b.fecha_ultima_modificacion - a.fecha_ultima_modificacion);
    },
    async create({ resolucion, analisis }) {
      for (const r of rows.values()) {
        if (resolucion.id_ejercicio !== null && r.id_usuario === resolucion.id_usuario && r.id_ejercicio === resolucion.id_ejercicio) {
          throw Object.assign(new Error("dup"), { code: "ER_DUP_ENTRY" });
        }
      }
      const row = { ...analisis, ...resolucion, fecha_inicio: ++reloj, fecha_ultima_modificacion: reloj };
      rows.set(row.id_resolucion, row);
      return row;
    },
    async update(record, { analisis, estado }) {
      const row = { ...rows.get(record.id_resolucion), ...analisis, ...(estado ? { estado } : {}), fecha_ultima_modificacion: ++reloj };
      rows.set(row.id_resolucion, row);
      return row;
    },
  };
}

const FRBA = "UTN FRBA";
const alumno = { id_usuario: "u-alumno", rol: "ALUMNO", institucion: FRBA };
const otroAlumno = { id_usuario: "u-otro", rol: "ALUMNO", institucion: FRBA };
const alumnoFrre = { id_usuario: "u-frre", rol: "ALUMNO", institucion: "UTN FRRE" };
const ejercicios = new Map([["ej-1", { id_ejercicio: "ej-1", institucion: FRBA }]]);
const analisis = (tipo = null) => ({
  tipo_metodologia: tipo,
  variables: { datos: [], control: [], estado: [], resultado: [] },
  tabla_eventos: { filas: [] },
  tabla_eventos_futuros: [],
});

function setup() {
  const repo = createMemoryRepository();
  const service = createResolucionService({
    resolucionRepository: repo,
    ejercicioRepository: { findById: async (id) => ejercicios.get(id) ?? null },
  });
  return { repo, service };
}

test("creating an analysis creates its resolution as a draft of the author", async () => {
  const { service } = setup();
  const r = await service.create(alumno, { id_ejercicio: "ej-1", analisis_previo: analisis("EVENTO_A_EVENTO"), id_usuario: "u-otro" });
  assert.equal(r.estado, "BORRADOR");
  assert.equal(r.id_usuario, alumno.id_usuario);
  assert.equal(r.id_ejercicio, "ej-1");
  assert.equal(r.analisis_previo.tipo_metodologia, "EVENTO_A_EVENTO");
  assert.ok(r.analisis_previo.id_analisis_previo);
});

test("one resolution per user and exercise, unlimited in free mode", async () => {
  const { service } = setup();
  await service.create(alumno, { id_ejercicio: "ej-1", analisis_previo: analisis() });
  await service.create(otroAlumno, { id_ejercicio: "ej-1", analisis_previo: analisis() });
  await assert.rejects(service.create(alumno, { id_ejercicio: "ej-1", analisis_previo: analisis() }), ConflictError);

  await service.create(alumno, { analisis_previo: analisis() });
  await service.create(alumno, { analisis_previo: analisis() });
  assert.equal((await service.list(alumno, { libre: true })).length, 2);
  assert.equal((await service.list(alumno, { id_ejercicio: "ej-1" })).length, 1);
});

test("users only reach their own resolutions and their institution's exercises", async () => {
  const { service } = setup();
  const r = await service.create(alumno, { id_ejercicio: "ej-1", analisis_previo: analisis() });
  await assert.rejects(service.get(otroAlumno, r.id), NotFoundError);
  await assert.rejects(service.update(otroAlumno, r.id, { analisis_previo: analisis() }), NotFoundError);
  await assert.rejects(service.create(alumnoFrre, { id_ejercicio: "ej-1", analisis_previo: analisis() }), NotFoundError);
  assert.deepEqual(await service.list(otroAlumno, { id_ejercicio: "ej-1" }), []);
});

test("states move forward only and a finished resolution is locked", async () => {
  const { service } = setup();
  const r = await service.create(alumno, { id_ejercicio: "ej-1", analisis_previo: analisis() });
  await assert.rejects(service.update(alumno, r.id, { estado: "FINALIZADO" }), ValidationError);

  const entregada = await service.update(alumno, r.id, { estado: "ENTREGADO", analisis_previo: analisis("DELTA_T_CONSTANTE") });
  assert.equal(entregada.estado, "ENTREGADO");
  assert.ok(entregada.fecha_ultima_modificacion > r.fecha_ultima_modificacion);
  await assert.rejects(service.update(alumno, r.id, { estado: "BORRADOR" }), ValidationError);

  await service.update(alumno, r.id, { estado: "FINALIZADO" });
  await assert.rejects(service.update(alumno, r.id, { analisis_previo: analisis() }), ConflictError);

  const libre = await service.create(alumno, { analisis_previo: analisis() });
  await assert.rejects(service.update(alumno, libre.id, { estado: "ENTREGADO" }), ValidationError);
});

test("the analysis shape is validated", async () => {
  const { service } = setup();
  await assert.rejects(service.create(alumno, {}), ValidationError);
  await assert.rejects(service.create(alumno, { analisis_previo: { ...analisis(), tipo_metodologia: "OTRA" } }), ValidationError);
  await assert.rejects(service.create(alumno, { analisis_previo: { ...analisis(), variables: [] } }), ValidationError);
  await assert.rejects(service.create(alumno, { analisis_previo: { ...analisis(), tabla_eventos_futuros: {} } }), ValidationError);
  const r = await service.create(alumno, { analisis_previo: analisis() });
  await assert.rejects(service.update(alumno, r.id, {}), ValidationError);
});
