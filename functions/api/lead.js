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

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 18;
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-12)
    .map(item => ({
      role: item && item.role === "assistant" ? "assistant" : "user",
      content: clean(item && item.content, 1200)
    }))
    .filter(item => item.content);
}

function transcriptText(history) {
  return history
    .map(item => `${item.role === "assistant" ? "Asistente" : "Cliente"}: ${item.content}`)
    .join("\n");
}

async function makeSummary(ai, history) {
  const userMessages = history
    .filter(item => item.role === "user")
    .map(item => item.content);

  const fallback = userMessages.length
    ? userMessages.slice(-4).join(" / ").slice(0, 1200)
    : "El visitante pidió que el equipo de Zenix AR se ponga en contacto.";

  if (!ai || !history.length) return fallback;

  try {
    const result = await ai.run(
      "@cf/meta/llama-3.1-8b-instruct-fp8",
      {
        messages: [
          {
            role: "system",
            content: "Resumí para el equipo de Zenix AR, en español y en máximo 5 líneas, qué quiere el potencial cliente. Incluí objetivo, tipo de proyecto y contexto útil si están presentes. No inventes datos ni precios."
          },
          {
            role: "user",
            content: transcriptText(history)
          }
        ],
        max_tokens: 180,
        temperature: 0.2
      }
    );

    return clean(result && result.response, 1800) || fallback;
  } catch (error) {
    console.error("Lead summary AI error", error);
    return fallback;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RESEND_API_KEY) {
    return json({ success: false, message: "El servicio de contacto no está disponible." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: "Solicitud inválida." }, 400);
  }

  const name = clean(body.name, 120);
  const contact = clean(body.contact, 254);
  const history = normalizeHistory(body.history);

  if (name.length < 2) {
    return json({ success: false, message: "Falta el nombre." }, 400);
  }

  const emailContact = isEmail(contact);
  const phoneContact = isPhone(contact);

  if (!emailContact && !phoneContact) {
    return json({ success: false, message: "El contacto debe ser un email o WhatsApp válido." }, 400);
  }

  const ai = env.AI || env.IA;
  const summary = await makeSummary(ai, history);
  const transcript = transcriptText(history) || "Sin conversación previa disponible.";
  const contactType = emailContact ? "Email" : "WhatsApp";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#111">
      <h2 style="margin:0 0 18px">Nuevo contacto desde el Asistente Zenix AR</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Contacto:</strong> ${escapeHtml(contact)}</p>
      <p><strong>Medio:</strong> ${contactType}</p>
      <hr style="border:0;border-top:1px solid #ddd;margin:22px 0">
      <p><strong>Resumen automático:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(summary)}</p>
      <hr style="border:0;border-top:1px solid #ddd;margin:22px 0">
      <p><strong>Conversación:</strong></p>
      <p style="white-space:pre-wrap;color:#444">${escapeHtml(transcript)}</p>
    </div>
  `;

  const text = [
    "Nuevo contacto desde el Asistente Zenix AR",
    "",
    `Nombre: ${name}`,
    `Contacto: ${contact}`,
    `Medio: ${contactType}`,
    "",
    "Resumen automático:",
    summary,
    "",
    "Conversación:",
    transcript
  ].join("\n");

  const emailPayload = {
    from: env.CONTACT_FROM || "Zenix AR <contacto@zenix.com.ar>",
    to: [env.CONTACT_TO || "josene242@gmail.com"],
    subject: `Nuevo contacto desde Asistente Zenix AR — ${name}`,
    html,
    text
  };

  if (emailContact) {
    emailPayload.reply_to = contact;
  }

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
      body: JSON.stringify(emailPayload),
      signal: controller.signal
    });

    result = await response.json().catch(() => ({}));
  } catch (error) {
    const message = error && error.name === "AbortError"
      ? "El envío tardó demasiado."
      : "No se pudo conectar con el servicio de correo.";
    return json({ success: false, message }, 502);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    console.error("Resend lead error", response.status, result);
    return json({ success: false, message: "No se pudo enviar el contacto." }, 502);
  }

  return json({
    success: true,
    id: result.id || null,
    provider: "resend"
  });
}

export function onRequestGet() {
  return json({ success: true, service: "zenix-lead" });
}