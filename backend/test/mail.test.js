import test from "node:test";
import assert from "node:assert/strict";
import { createMailService } from "../src/mail/mailService.js";

test("local mail fallback logs recipient, subject and token URL without throwing", async () => {
  const messages = [];
  const mailService = createMailService({
    host: "",
    logger: { info: (message) => messages.push(message) },
  });

  await mailService.sendVerificationEmail({
    to: "ana@example.com",
    nombre: "Ana",
    verifyUrl: "https://victoriax.example/verify-email?token=opaque",
  });
  await mailService.sendPasswordResetEmail({
    to: "ana@example.com",
    nombre: "Ana",
    resetUrl: "https://victoriax.example/reset-password?token=opaque",
  });
  await mailService.sendPasswordChangedEmail({ to: "ana@example.com", nombre: "Ana" });
  await mailService.sendAccountUpdatedEmail({
    to: "ana@example.com",
    nombre: "Ana",
    cambios: { "Nombre completo": "<script>alert(1)</script>" },
  });
  await mailService.sendAccountStatusEmail({
    to: "ana@example.com",
    nombre: "Ana",
    estado: "SUSPENDIDO",
  });

  assert.equal(messages.length, 5);
  assert.match(messages[0], /ana@example\.com/);
  assert.match(messages[0], /Verificá tu email/);
  assert.match(messages[0], /token=opaque/);
  assert.match(messages[3], /&lt;script&gt;/);
  assert.doesNotMatch(messages[3], /<script>/);
});

test("nodemailer transporter sends email with formatted HTML and recipient", async () => {
  const sent = [];
  const mockTransporter = {
    sendMail: async (options) => {
      sent.push(options);
      return { messageId: "123" };
    },
  };

  const mailService = createMailService({
    from: "VictoriaX <no-reply@victoriax-simulate.com>",
    transporter: mockTransporter,
  });

  await mailService.sendVerificationEmail({
    to: "estudiante@frba.utn.edu.ar",
    nombre: "Estudiante",
    verifyUrl: "https://victoriax.example/verify-email?token=abc123xyz",
  });

  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "estudiante@frba.utn.edu.ar");
  assert.equal(sent[0].from, "VictoriaX <no-reply@victoriax-simulate.com>");
  assert.equal(sent[0].subject, "Verificá tu email de VictoriaX");
  assert.match(sent[0].html, /Confirmá tu correo electrónico/);
  assert.match(sent[0].html, /token=abc123xyz/);
});

test("nodemailer transporter error throws descriptive exception", async () => {
  const mockTransporter = {
    sendMail: async () => {
      throw new Error("Conexión SMTP rechazada");
    },
  };

  const mailService = createMailService({
    transporter: mockTransporter,
  });

  await assert.rejects(
    () =>
      mailService.sendVerificationEmail({
        to: "estudiante@frba.utn.edu.ar",
        nombre: "Estudiante",
        verifyUrl: "https://victoriax.example/verify-email?token=abc",
      }),
    /No se pudo enviar el correo "Verificá tu email de VictoriaX": Conexión SMTP rechazada/,
  );
});
