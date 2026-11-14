// Proxy same-origin hacia el servidor de TurnoFácil (Supabase Edge Function).
// Mantiene las cookies de sesión en el dominio propio.
const UPSTREAM = "https://rmmmrmoccviynghakpbe.supabase.co/functions/v1/tf/api/";

export async function onRequest({ request, params }) {
  const url = new URL(request.url);
  const path = Array.isArray(params.path) ? params.path.join("/") : String(params.path || "");
  const headers = new Headers();
  for (const h of ["content-type", "cookie", "accept"]) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  const init = { method: request.method, headers, redirect: "manual" };
  if (!["GET", "HEAD"].includes(request.method)) init.body = await request.text();
  const res = await fetch(UPSTREAM + path + url.search, init);
  const out = new Headers();
  out.set("Content-Type", res.headers.get("content-type") || "application/json; charset=utf-8");
  out.set("Cache-Control", "no-store");
  out.set("X-Robots-Tag", "noindex");
  const sc = res.headers.get("set-cookie");
  if (sc) out.append("Set-Cookie", sc);
  return new Response(res.body, { status: res.status, headers: out });
}
