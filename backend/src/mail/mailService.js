import nodemailer from "nodemailer";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function renderEmail({
  title,
  greeting,
  message,
  buttonText,
  buttonUrl,
  details,
  alertHtml,
  securityNotice,
}) {
  const action = buttonUrl && buttonText
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;width:100%">
        <tr>
          <td align="center">
            <a href="${escapeHtml(buttonUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#38bdf8;color:#0a0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.2px">${escapeHtml(buttonText)}</a>
          </td>
        </tr>
      </table>`
    : "";

  const detailsHtml = details
    ? `<div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-top:20px;padding:16px">${details}</div>`
    : "";

  const alertBox = alertHtml
    ? `<div style="background-color:#fff1f2;border:1px solid #fecdd3;border-radius:8px;margin-top:24px;padding:16px 18px;color:#9f1239;font-size:14px;line-height:1.6">${alertHtml}</div>`
    : "";

  const noticeHtml = securityNotice
    ? `<p style="color:#64748b;font-size:12px;line-height:1.6;margin:28px 0 0;border-top:1px solid #f1f5f9;padding-top:16px">${escapeHtml(securityNotice)}</p>`
    : "";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
</head>
<body style="margin:0;padding:0;background-color:#0f1219;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f1219;margin:0;padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;text-align:left">
          <tr>
            <td style="background-color:#131722;border:1px solid #1f293d;border-bottom:none;border-radius:12px 12px 0 0;padding:26px 32px">
              <div style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.3px;line-height:1">Victoria<span style="color:#a78bfa">X</span></div>
              <div style="color:#94a3b8;font-size:12px;margin-top:6px;letter-spacing:0.3px">Plataforma Educativa de Simulación</div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:32px">
              <h1 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 16px;line-height:1.3">${escapeHtml(title)}</h1>
              <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 14px">Hola ${escapeHtml(greeting)},</p>
              <p style="color:#334155;font-size:15px;line-height:1.7;margin:0">${message}</p>
              ${action}
              ${detailsHtml}
              ${alertBox}
              ${noticeHtml}
            </td>
          </tr>
          <tr>
            <td style="padding-top:20px;text-align:center">
              <p style="color:#64748b;font-size:11px;margin:0;letter-spacing:0.2px">VictoriaX · UTN · Plataforma Educativa de Simulación</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatChanges(changes) {
  const values = changes && typeof changes === "object" ? Object.entries(changes) : [];
  if (!values.length) return "";
  return `<ul style="color:#334155;font-size:14px;line-height:1.8;margin:0;padding-left:20px">${values
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
  frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  logger = console,
  transporter: customTransporter,
} = {}) {
  const sender = from || "VictoriaX <no-reply@localhost>";
  const origin = String(frontendOrigin).split(",")[0].trim().replace(/\/$/, "");

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
          message: "Para terminar de crear tu cuenta en VictoriaX, confirmá que esta dirección de correo te pertenece. Este enlace vence en 24 horas.",
          buttonText: "Verificar mi email",
          buttonUrl: verifyUrl,
          securityNotice: "Si no solicitaste esto, podés ignorar este mensaje de forma segura.",
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
          message: "Recibimos una solicitud para restablecer la contraseña de tu cuenta de VictoriaX. Hacé clic en el siguiente botón para crear una nueva. Este enlace vence en una hora.",
          buttonText: "Crear una nueva contraseña",
          buttonUrl: resetUrl,
          securityNotice: "Si no solicitaste esto, podés ignorar este mensaje de forma segura.",
        }),
      });
    },

    sendPasswordChangedEmail({ to, nombre, recoverUrl }) {
      const resetUrl = recoverUrl || `${origin}/forgot-password`;
      return send({
        to,
        subject: "Se cambió tu contraseña de VictoriaX",
        url: resetUrl,
        html: renderEmail({
          title: "Contraseña actualizada",
          greeting: nombre,
          message: "Te confirmamos que la contraseña de tu cuenta de VictoriaX se actualizó correctamente.",
          alertHtml: `<strong>Aviso de seguridad:</strong> Si no realizaste este cambio, tu cuenta podría estar comprometida. Restablecé tu contraseña de inmediato desde <a href="${escapeHtml(resetUrl)}" style="color:#be123c;font-weight:700;text-decoration:underline">este enlace</a> o escribinos a <a href="mailto:victoria.x.simulacion@gmail.com" style="color:#be123c;font-weight:700;text-decoration:underline">victoria.x.simulacion@gmail.com</a>.`,
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
          message: "Te informamos que se guardaron modificaciones en la información de tu cuenta:",
          details: formatChanges(cambios),
          securityNotice: "Si vos no realizaste estas modificaciones, escribinos a victoria.x.simulacion@gmail.com.",
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
            ? "Tu cuenta de VictoriaX fue suspendida y ya no permite iniciar sesión. Si considerás que se trata de un error, escribinos a victoria.x.simulacion@gmail.com."
            : "Tu cuenta de VictoriaX fue reactivada y ya podés volver a iniciar sesión cuando quieras.",
          buttonText: suspended ? null : "Iniciar sesión",
          buttonUrl: suspended ? null : `${origin}/login`,
          securityNotice: suspended
            ? "Para consultas sobre el estado de tu cuenta, podés comunicarte con nosotros por correo."
            : "Si tenés alguna duda sobre tu cuenta, podés escribirnos a victoria.x.simulacion@gmail.com.",
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
