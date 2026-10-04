import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { localAuth } from "../../src/api/localAuth.js";

test("only the seeded demo identities authenticate locally and allow demo role changes", async (t) => {
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
  assert.equal(localAuth.isDemoEmail("ALUMNO@FRBA.UTN.EDU.AR"), true);
  assert.equal(localAuth.isDemoEmail("otra@frba.utn.edu.ar"), false);
  assert.equal((await localAuth.listUsers()).length, 3);

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
  const docente = "22222222-2222-4222-8222-222222222222";
  await localAuth.updateUser(docente, { rol: "ESTUDIANTE" });
  assert.equal(
    (await localAuth.listUsers()).find((user) => user.id === docente).rol,
    "ESTUDIANTE",
  );
  assert.equal((await localAuth.login({
    email: "docente@frba.utn.edu.ar",
    password: "VictoriaX123",
  })).rol, "ALUMNO");

  const storedUsers = JSON.parse(storage.get("victoriax-local-users"));
  storedUsers.push({
    id_usuario: "legacy-local-user",
    email: "legacy@frba.utn.edu.ar",
    nombre_completo: "Usuario local antiguo",
    rol: "ALUMNO",
    password_hash: "not-a-valid-hash",
    password_salt: "legacy",
  });
  storage.set("victoriax-local-users", JSON.stringify(storedUsers));
  assert.equal(localAuth.isDemoEmail("legacy@frba.utn.edu.ar"), false);
  assert.equal(
    (await localAuth.listUsers()).some((user) => user.email === "legacy@frba.utn.edu.ar"),
    false,
  );
  await assert.rejects(
    () => localAuth.login({ email: "legacy@frba.utn.edu.ar", password: "cualquiera" }),
    /deben autenticarse con Supabase/,
  );
  await assert.rejects(
    () => localAuth.updateUser("legacy-local-user", { rol: "ADMIN" }),
    /No se encontró el participante demo/,
  );
  storage.set("victoriax-local-user", "legacy-local-user");
  assert.equal(await localAuth.me(), null);
  assert.equal(storage.has("victoriax-local-user"), false);
  await localAuth.login({
    email: "admin@frba.utn.edu.ar",
    password: "VictoriaX123",
  });
  await assert.rejects(
    localAuth.login({ email: "admin@frba.utn.edu.ar", password: "incorrecta" }),
    /Email o contraseña incorrectos/,
  );
  localAuth.logout();
  assert.equal(await localAuth.me(), null);
});
