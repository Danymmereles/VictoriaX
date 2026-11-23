import nodemailer from "nodemailer";

const COLORS = {
  navy: "#102a43",
  blue: "#1769aa",
  gold: "#f2b544",
  background: "#f3f6fa",
  text: "#243b53",
  muted: "#627d98",
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function renderEmail({ title, greeting, message, buttonText, buttonUrl, details }) {
  const action = buttonUrl
    ? `<p style="margin:28px 0;text-align:center"><a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:${COLORS.blue};border-radius:8px;color:#fff;font-weight:700;padding:14px 24px;text-decoration:none">${escapeHtml(buttonText)}</a></p>`
    : "";
  const detailsHtml = details
    ? `<div style="background:${COLORS.background};border-radius:8px;margin-top:20px;padding:16px">${details}</div>`
    : "";

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:${COLORS.background};color:${COLORS.text};font-family:Arial,Helvetica,sans-serif">
  <div style="margin:0 auto;max-width:600px;padding:32px 16px">
    <div style="background:${COLORS.navy};border-radius:12px 12px 0 0;padding:24px 32px">
      <div style="color:#fff;font-size:23px;font-weight:700;letter-spacing:.3px">Victoria<span style="color:${COLORS.gold}">X</span></div>
      <div style="color:#d9e2ec;font-size:12px;margin-top:5px">UTN · Herramientas para aprender</div>
    </div>
    <div style="background:#fff;border-radius:0 0 12px 12px;padding:32px">
      <h1 style="color:${COLORS.navy};font-size:22px;margin:0 0 20px">${escapeHtml(title)}</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 14px">Hola ${escapeHtml(greeting)},</p>
      <p style="font-size:15px;line-height:1.7;margin:0">${message}</p>
      ${action}${detailsHtml}
      <p style="color:${COLORS.muted};font-size:12px;line-height:1.6;margin:28px 0 0">Si no realizaste esta solicitud, podés ignorar este mensaje.</p>
    </div>
    <p style="color:${COLORS.muted};font-size:11px;text-align:center">VictoriaX · UTN</p>
  </div>
</body>
</html>`;
}

function formatChanges(changes) {
  const values = changes && typeof changes === "object" ? Object.entries(changes) : [];
  if (!values.length) return "";
  return `<ul style="color:${COLORS.text};font-size:14px;line-height:1.8;margin:0;padding-left:20px">${values
    .map(([key, value]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</li>`)
    .join("")}</ul>`;
}

export function createMailService({
  host = process.env.SMTP_HOST,
  port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure = process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
  user = process.env.SMTP_USER,
  pass = process.env.SMTP_PASS,
  from = process.env.EMAIL_FROM,
  logger = console,
  transporter: customTransporter,
} = {}) {
  const sender = from || "VictoriaX <no-reply@localhost>";

  const transporter = customTransporter !== undefined
    ? customTransporter
    : host
      ? nodemailer.createTransport({
          host,
          port,
          secure: Boolean(secure),
          ...(user || pass ? { auth: { user, pass } } : {}),
        })
      : null;

  async function send({ to, subject, html, url }) {
    if (!transporter) {
      logger.info(`[VictoriaX mail local] Para: ${to}\nAsunto: ${subject}\n${url || html}`);
      return;
    }

    try {
      await transporter.sendMail({
        from: sender,
        to,
        subject,
        html,
      });
    } catch (error) {
      throw new Error(`No se pudo enviar el correo "${subject}": ${error.message}`);
    }
  }

  return {
    sendVerificationEmail({ to, nombre, verifyUrl }) {
      return send({
        to,
        subject: "Verificá tu email de VictoriaX",
        url: verifyUrl,
        html: renderEmail({
          title: "Confirmá tu correo electrónico",
          greeting: nombre,
          message: "Para terminar de crear tu cuenta, confirmá que esta dirección de email te pertenece.",
          buttonText: "Verificar mi email",
          buttonUrl: verifyUrl,
        }),
      });
    },

    sendPasswordResetEmail({ to, nombre, resetUrl }) {
      return send({
        to,
        subject: "Recuperá tu contraseña de VictoriaX",
        url: resetUrl,
        html: renderEmail({
          title: "Restablecé tu contraseña",
          greeting: nombre,
          message: "Recibimos una solicitud para cambiar la contraseña de tu cuenta. El enlace vence en una hora.",
          buttonText: "Crear una nueva contraseña",
          buttonUrl: resetUrl,
        }),
      });
    },

    sendPasswordChangedEmail({ to, nombre }) {
      return send({
        to,
        subject: "Se cambió tu contraseña de VictoriaX",
        html: renderEmail({
          title: "Contraseña actualizada",
          greeting: nombre,
          message: "La contraseña de tu cuenta de VictoriaX se cambió correctamente.",
        }),
      });
    },

    sendAccountUpdatedEmail({ to, nombre, cambios }) {
      return send({
        to,
        subject: "Se actualizaron los datos de tu cuenta de VictoriaX",
        html: renderEmail({
          title: "Datos de cuenta actualizados",
          greeting: nombre,
          message: "Se realizaron cambios en la información de tu cuenta.",
          details: formatChanges(cambios),
        }),
      });
    },

    sendAccountStatusEmail({ to, nombre, estado }) {
      const suspended = estado === "SUSPENDIDO";
      return send({
        to,
        subject: suspended ? "Tu cuenta de VictoriaX fue suspendida" : "Tu cuenta de VictoriaX está activa",
        html: renderEmail({
          title: suspended ? "Cuenta suspendida" : "Cuenta reactivada",
          greeting: nombre,
          message: suspended
            ? "Tu cuenta fue suspendida y ya no permite iniciar sesión."
            : "Tu cuenta fue reactivada y ya podés iniciar sesión nuevamente.",
        }),
      });
    },
  };
}

const defaultMailService = createMailService();

export const sendVerificationEmail = (params) => defaultMailService.sendVerificationEmail(params);
export const sendPasswordResetEmail = (params) => defaultMailService.sendPasswordResetEmail(params);
export const sendPasswordChangedEmail = (params) => defaultMailService.sendPasswordChangedEmail(params);
export const sendAccountUpdatedEmail = (params) => defaultMailService.sendAccountUpdatedEmail(params);
export const sendAccountStatusEmail = (params) => defaultMailService.sendAccountStatusEmail(params);
