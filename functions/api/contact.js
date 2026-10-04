const ALLOWED_TYPES = new Set([
  "Aplicación Android",
  "Extensión para navegador",
  "Página o aplicación web",
  "Mejora de un proyecto existente",
  "Otro"
]);

const ALLOWED_RESPONSE_CHANNELS = new Set(["Email", "WhatsApp"]);

function securityHeaders(extra = {}) {
  return {
    "Content-Type": "application/json; charset=UTF-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    ...extra
  };
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: securityHeaders(extraHeaders)
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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  if (!value) return true;
  return /^[0-9+() .-]{6,40}$/.test(value);
}

function isSameOrigin(request) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  const fetchSite = request.headers.get("Sec-Fetch-Site");

  if (origin && origin !== url.origin) return false;
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) return false;
  return true;
}

async function hash(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function rateLimit(request, limit = 5, windowSeconds = 300) {
  try {
    if (typeof caches === "undefined" || !caches.default) return { allowed: true };

    const ip = request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
      "unknown";
    const keyHash = await hash(`contact:${ip}`);
    const base = new URL(request.url);
    const key = new Request(`${base.origin}/__security/rate/contact/${keyHash}`, { method: "GET" });
    const cache = caches.default;
    const existing = await cache.match(key);
    let count = 0;

    if (existing) {
      const parsed = Number(await existing.text());
      count = Number.isFinite(parsed) ? parsed : 0;
    }

    if (count >= limit) return { allowed: false, retryAfter: windowSeconds };

    await cache.put(key, new Response(String(count + 1), {
      headers: { "Cache-Control": `max-age=${windowSeconds}` }
    }));

    return { allowed: true };
  } catch (error) {
    console.error("Contact rate-limit error", error);
    return { allowed: true };
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!isSameOrigin(request)) {
    return json({ success: false, message: "Solicitud no permitida." }, 403);
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json({ success: false, message: "Formato de solicitud no permitido." }, 415);
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 12000) {
    return json({ success: false, message: "Solicitud demasiado grande." }, 413);
  }

  const limited = await rateLimit(request, 5, 300);
  if (!limited.allowed) {
    return json(
      { success: false, message: "Demasiados intentos. Probá nuevamente en unos minutos." },
      429,
      { "Retry-After": String(limited.retryAfter || 300) }
    );
  }

  if (!env.RESEND_API_KEY) {
    return json({ success: false, message: "El servicio de contacto no está disponible." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, message: "Solicitud inválida." }, 400);
  }

  // Honeypot: los visitantes reales nunca completan este campo.
  if (clean(body.website, 200)) {
    return json({ success: true, message: "Consulta recibida." });
  }

  const startedAt = Number(body._startedAt || 0);
  const elapsed = Date.now() - startedAt;
  if (!Number.isFinite(startedAt) || startedAt <= 0 || elapsed < 1200 || elapsed > 7200000) {
    return json({ success: false, message: "La sesión del formulario venció. Recargá la página e intentá nuevamente." }, 400);
  }

  const nombre = clean(body.Nombre, 120);
  const email = clean(body.email, 254);
  const whatsapp = clean(body.WhatsApp, 40);
  const tipo = clean(body["Tipo de proyecto"], 80);
  const medio = clean(body["Medio de respuesta"], 20);
  const mensaje = clean(body.Mensaje, 5000);

  if (!nombre || !email || !tipo || !medio || !mensaje) {
    return json({ success: false, message: "Faltan campos obligatorios." }, 400);
  }

  if (nombre.length < 2 || !isValidEmail(email) || !isValidPhone(whatsapp)) {
    return json({ success: false, message: "Revisá los datos ingresados." }, 400);
  }

  if (!ALLOWED_TYPES.has(tipo) || !ALLOWED_RESPONSE_CHANNELS.has(medio)) {
    return json({ success: false, message: "Hay un valor no permitido en el formulario." }, 400);
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
  const timeoutId = setTimeout(() => controller.abort(), 12000);

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
    console.error("Contact provider error", error && error.name);
    return json({ success: false, message: "No se pudo enviar la consulta. Intentá nuevamente en unos minutos." }, 502);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    console.error("Contact provider HTTP error", response.status, result && result.name);
    return json({ success: false, message: "No se pudo enviar la consulta. Intentá nuevamente en unos minutos." }, 502);
  }

  return json({ success: true, message: "Consulta enviada." });
}

export function onRequestGet() {
  return json(
    { success: false, message: "Método no permitido." },
    405,
    { "Allow": "POST" }
  );
}
