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
    .slice(-16)
    .map(item => ({
      role: item && item.role === "assistant" ? "assistant" : "user",
      content: clean(item && item.content, 1200)
    }))
    .filter(item => item.content);
}

function sanitizeProfile(value) {
  const result = {
    business: "",
    industry: "",
    city: "",
    projectType: "",
    need: "",
    features: [],
    budget: "",
    timeline: "",
    urgency: "",
    classification: "",
    interest: "",
    summary: "",
    nextAction: ""
  };

  if (!value || typeof value !== "object") return result;

  for (const key of ["business","industry","city","projectType","need","budget","timeline","urgency","classification","interest","summary","nextAction"]) {
    result[key] = clean(value[key], key === "summary" ? 1400 : 260);
  }

  if (Array.isArray(value.features)) {
    result.features = [...new Set(value.features.map(item => clean(item, 120)).filter(Boolean))].slice(0, 10);
  }

  return result;
}

function transcriptText(history) {
  return history
    .map(item => `${item.role === "assistant" ? "Agente" : "Cliente"}: ${item.content}`)
    .join("\n");
}

function profileLines(profile) {
  const rows = [
    ["Negocio / empresa", profile.business],
    ["Rubro", profile.industry],
    ["Ciudad", profile.city],
    ["Tipo de proyecto", profile.projectType],
    ["Necesidad", profile.need],
    ["Funciones", profile.features.join(", ")],
    ["Presupuesto", profile.budget],
    ["Plazo", profile.timeline],
    ["Urgencia", profile.urgency],
    ["Estado", profile.classification],
    ["Interés", profile.interest],
    ["Próxima acción", profile.nextAction]
  ];
  return rows.filter(([,value]) => value);
}

async function makeSummary(ai, history, profile) {
  if (profile.summary) return profile.summary;

  const fallback = profile.need
    ? [profile.projectType, profile.need, profile.features.join(", ")].filter(Boolean).join(" — ").slice(0, 1400)
    : history.filter(item => item.role === "user").map(item => item.content).slice(-5).join(" / ").slice(0, 1400)
      || "El visitante pidió que el equipo de Zenix AR se ponga en contacto.";

  if (!ai || !history.length) return fallback;

  try {
    const result = await ai.run(
      "@cf/meta/llama-3.1-8b-instruct-fp8",
      {
        messages: [
          {
            role: "system",
            content: "Resumí para el equipo de Zenix AR, en español y en máximo 5 líneas, qué quiere el potencial cliente. Usá solamente datos explícitos. Incluí objetivo, negocio/rubro, tipo de proyecto y funciones si se conocen. No inventes precios ni plazos."
          },
          {
            role: "user",
            content: "Datos estructurados: " + JSON.stringify(profile) + "\n\nConversación:\n" + transcriptText(history)
          }
        ],
        max_tokens: 220,
        temperature: 0.15
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
  const profile = sanitizeProfile(body.profile);

  if (name.length < 2) return json({ success: false, message: "Falta el nombre." }, 400);

  const emailContact = isEmail(contact);
  const phoneContact = isPhone(contact);
  if (!emailContact && !phoneContact) {
    return json({ success: false, message: "El contacto debe ser un email o WhatsApp válido." }, 400);
  }

  const ai = env.AI || env.IA;
  const summary = await makeSummary(ai, history, profile);
  const transcript = transcriptText(history) || "Sin conversación previa disponible.";
  const contactType = emailContact ? "Email" : "WhatsApp";
  const structured = profileLines(profile);

  const structuredHtml = structured.length
    ? structured.map(([label,value]) => `<p style="margin:7px 0"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join("")
    : '<p style="color:#666">Sin datos estructurados adicionales.</p>';

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#111;max-width:720px">
      <h2 style="margin:0 0 8px">Nuevo lead desde Zenix Agent</h2>
      <p style="margin:0 0 20px;color:#555">Contacto captado automáticamente desde zenix.com.ar</p>
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Contacto:</strong> ${escapeHtml(contact)}</p>
      <p><strong>Medio:</strong> ${contactType}</p>

      <hr style="border:0;border-top:1px solid #ddd;margin:22px 0">
      <h3 style="margin:0 0 12px">Ficha del lead</h3>
      ${structuredHtml}

      <hr style="border:0;border-top:1px solid #ddd;margin:22px 0">
      <h3 style="margin:0 0 10px">Resumen IA</h3>
      <p style="white-space:pre-wrap">${escapeHtml(summary)}</p>

      <hr style="border:0;border-top:1px solid #ddd;margin:22px 0">
      <h3 style="margin:0 0 10px">Conversación</h3>
      <p style="white-space:pre-wrap;color:#444">${escapeHtml(transcript)}</p>
    </div>
  `;

  const structuredText = structured.map(([label,value]) => `${label}: ${value}`).join("\n");
  const text = [
    "Nuevo lead desde Zenix Agent",
    "",
    `Nombre: ${name}`,
    `Contacto: ${contact}`,
    `Medio: ${contactType}`,
    "",
    "FICHA DEL LEAD",
    structuredText || "Sin datos estructurados adicionales.",
    "",
    "RESUMEN IA",
    summary,
    "",
    "CONVERSACIÓN",
    transcript
  ].join("\n");

  const emailPayload = {
    from: env.CONTACT_FROM || "Zenix AR <contacto@zenix.com.ar>",
    to: [env.CONTACT_TO || "josene242@gmail.com"],
    subject: `Nuevo lead Zenix Agent — ${name}${profile.projectType ? " — " + profile.projectType : ""}`,
    html,
    text
  };

  if (emailContact) emailPayload.reply_to = contact;

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
    provider: "resend",
    action: "Equipo notificado",
    summary
  });
}

export function onRequestGet() {
  return json({ success: true, service: "zenix-agent-lead", version: "1.1" });
}