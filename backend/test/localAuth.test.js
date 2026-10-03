import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { localAuth } from "../../src/api/localAuth.js";

test("local test users persist, register as students, and allow admin role changes", async (t) => {
  const storage = new Map();
  const originalCrypto = globalThis.crypto;
  globalThis.crypto = webcrypto;
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  t.after(() => {
    delete globalThis.localStorage;
    if (originalCrypto) globalThis.crypto = originalCrypto;
    else delete globalThis.crypto;
  });

  for (const [email, role] of [
    ["alumno@frba.utn.edu.ar", "ALUMNO"],
    ["docente@frba.utn.edu.ar", "DOCENTE"],
    ["admin@frba.utn.edu.ar", "ADMIN"],
  ]) {
    const user = await localAuth.login({ email, password: "VictoriaX123" });
    assert.equal(user.rol, role);
    assert.equal((await localAuth.me()).id_usuario, user.id_usuario);
  }
  assert.equal(await localAuth.hasAccount("ALUMNO@FRBA.UTN.EDU.AR"), true);
  assert.equal(await localAuth.hasAccount("otra@frba.utn.edu.ar"), false);

  const registered = await localAuth.register({
    email: "nueva@ejemplo.com",
    password: "UnaClaveSegura123",
    nombreCompleto: "Nueva Participante",
  });
  assert.equal(registered.rol, "ALUMNO");
  assert.equal(
    (await localAuth.listUsers()).find((user) => user.id === registered.id_usuario).rol,
    "ESTUDIANTE",
  );
  assert.equal(
    JSON.stringify([...storage.values()]).includes("UnaClaveSegura123"),
    false,
  );

  await localAuth.login({
    email: "admin@frba.utn.edu.ar",
    password: "VictoriaX123",
  });
  await assert.rejects(
    () =>
      localAuth.updateUser("33333333-3333-4333-8333-333333333333", {
        rol: "ESTUDIANTE",
      }),
    /no puede cambiar su propio rol/,
  );
  await localAuth.updateUser(registered.id_usuario, { rol: "DOCENTE" });
  assert.equal(
    (await localAuth.listUsers()).find((user) => user.id === registered.id_usuario).rol,
    "DOCENTE",
  );
  assert.equal(
    (await localAuth.login({
      email: "nueva@ejemplo.com",
      password: "UnaClaveSegura123",
    })).rol,
    "DOCENTE",
  );

  await localAuth.login({
    email: "docente@frba.utn.edu.ar",
    password: "VictoriaX123",
  });
  await assert.rejects(
    () => localAuth.updateUser(registered.id_usuario, { rol: "ADMIN" }),
    /Solo el administrador local/,
  );
  await assert.rejects(
    localAuth.login({ email: "admin@frba.utn.edu.ar", password: "incorrecta" }),
    /Email o contraseña incorrectos/,
  );
  localAuth.logout();
  assert.equal(await localAuth.me(), null);
});
