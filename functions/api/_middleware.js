const buckets = new Map();

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...extraHeaders
    }
  });
}

function sameOrigin(request) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if (origin && origin !== url.origin) return false;
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) return false;
  return true;
}

function keyFor(request, route) {
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || "unknown";
  return `${route}:${ip}`;
}

function limited(request, route, max, windowMs) {
  const now = Date.now();
  const key = keyFor(request, route);
  const current = (buckets.get(key) || []).filter(ts => now - ts < windowMs);
  if (current.length >= max) {
    buckets.set(key, current);
    return true;
  }
  current.push(now);
  buckets.set(key, current);

  if (buckets.size > 5000) {
    for (const [k, values] of buckets) {
      const fresh = values.filter(ts => now - ts < Math.max(windowMs, 600000));
      if (fresh.length) buckets.set(k, fresh); else buckets.delete(k);
    }
  }
  return false;
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const route = url.pathname;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Allow": "POST" } });
  }

  if (request.method !== "POST") {
    return json({ success: false, message: "Método no permitido." }, 405, { "Allow": "POST" });
  }

  if (!sameOrigin(request)) {
    return json({ success: false, message: "Solicitud no permitida." }, 403);
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json({ success: false, message: "Formato no permitido." }, 415);
  }

  const length = Number(request.headers.get("Content-Length") || 0);
  const maxBytes = route.endsWith("/chat") ? 24000 : route.endsWith("/lead") ? 42000 : 14000;
  if (length > maxBytes) {
    return json({ success: false, message: "Solicitud demasiado grande." }, 413);
  }

  const max = route.endsWith("/chat") ? 24 : route.endsWith("/lead") ? 5 : 8;
  const windowMs = route.endsWith("/chat") ? 60000 : route.endsWith("/lead") ? 600000 : 300000;
  if (limited(request, route, max, windowMs)) {
    return json(
      { success: false, message: "Demasiados intentos. Probá nuevamente más tarde." },
      429,
      { "Retry-After": String(Math.ceil(windowMs / 1000)) }
    );
  }

  return context.next();
}
