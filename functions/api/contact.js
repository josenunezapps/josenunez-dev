function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store"
    }
  });
}

function clean(value, max = 2000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RESEND_API_KEY) {
    return json({ success: false, message: "Servicio de correo no configurado." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: "Solicitud inválida." }, 400);
  }

  const nombre = clean(body.Nombre, 120);
  const email = clean(body.email, 254);
  const whatsapp = clean(body.WhatsApp, 80);
  const tipo = clean(body["Tipo de proyecto"], 160);
  const medio = clean(body["Medio de respuesta"], 80);
  const mensaje = clean(body.Mensaje, 6000);

  if (!nombre || !email || !tipo || !medio || !mensaje) {
    return json({ success: false, message: "Faltan campos obligatorios." }, 400);
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return json({ success: false, message: "El email no es válido." }, 400);
  }

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#111">
      <h2 style="margin:0 0 18px">Nueva consulta desde Zenix AR</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>WhatsApp:</strong> ${escapeHtml(whatsapp || "No informado")}</p>
      <p><strong>Tipo de proyecto:</strong> ${escapeHtml(tipo)}</p>
      <p><strong>Prefiere respuesta por:</strong> ${escapeHtml(medio)}</p>
      <hr style="border:0;border-top:1px solid #ddd;margin:22px 0">
      <p><strong>Mensaje:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(mensaje)}</p>
    </div>
  `;

  const text = [
    "Nueva consulta desde Zenix AR",
    "",
    `Nombre: ${nombre}`,
    `Email: ${email}`,
    `WhatsApp: ${whatsapp || "No informado"}`,
    `Tipo de proyecto: ${tipo}`,
    `Prefiere respuesta por: ${medio}`,
    "",
    "Mensaje:",
    mensaje
  ].join("\n");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let response;
  let result = {};

  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM || "Zenix AR <contacto@zenix.com.ar>",
        to: [env.CONTACT_TO || "josene242@gmail.com"],
        reply_to: email,
        subject: `Nueva consulta Zenix AR — ${nombre}`,
        html,
        text
      }),
      signal: controller.signal
    });

    result = await response.json().catch(() => ({}));
  } catch (error) {
    const message = error && error.name === "AbortError"
      ? "Resend no respondió dentro de 15 segundos."
      : "No se pudo conectar con Resend.";
    return json({ success: false, message }, 502);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    console.error("Resend error", response.status, result);
    const detail = result && (result.message || result.name || result.error);
    return json({
      success: false,
      message: detail ? `Resend: ${detail}` : `Resend devolvió HTTP ${response.status}.`
    }, 502);
  }

  return json({
    success: true,
    id: result.id || null,
    provider: "resend"
  });
}

export function onRequestGet(context) {
  const { env } = context;
  return json({
    success: true,
    service: "zenix-contact",
    resendConfigured: Boolean(env.RESEND_API_KEY),
    fromConfigured: env.CONTACT_FROM || "Zenix AR <contacto@zenix.com.ar>",
    toConfigured: env.CONTACT_TO || "josene242@gmail.com"
  });
}
