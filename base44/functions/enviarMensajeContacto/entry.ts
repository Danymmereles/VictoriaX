import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const DESTINO = 'victoria.x.simulacion@gmail.com';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { nombre, email, motivo, mensaje } = await req.json().catch(() => ({}));

    if (!nombre || !email || !motivo || !mensaje) {
      return Response.json({ error: 'Faltan datos del mensaje' }, { status: 400 });
    }

    // Guardamos el mensaje aunque el correo no pueda entregarse.
    await base44.asServiceRole.entities.MensajeContacto.create({ nombre, email, motivo, mensaje });

    let enviado = false;
    let aviso = null;
    try {
      const res = await base44.asServiceRole.integrations.Core.SendEmail({
        to: DESTINO,
        template_name: 'NotificacionContacto',
        category: 'transactional',
        variables: { nombre, email, motivo, mensaje },
      });
      enviado = !!(res && res.success !== false);
      if (!enviado && res && res.reason) aviso = res.reason;
    } catch (e) {
      aviso = e.message;
    }

    return Response.json({ ok: true, enviado, aviso });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}