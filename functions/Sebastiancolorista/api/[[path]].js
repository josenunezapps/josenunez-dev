// API de turnos de Sebastián González (D1). Binding requerido en Cloudflare Pages: SG_DB
// Rutas: /Sebastiancolorista/api/...
//   GET  public                 -> turnos ocupados (sin datos personales), bloqueos y ajustes
//   POST bookings               -> crear turno (valida horario y superposición)
//   POST mine     {phone}       -> turnos de ese teléfono
//   POST cancel   {id, phone}   -> cancelar un turno propio
//   POST login    {password}    -> sesión de administración (cookie)
//   POST logout
//   GET  admin/state            -> todo (requiere sesión)
//   PUT  admin/bookings | admin/blocks | admin/settings  (requiere sesión)

const COOKIE = "sg_admin";
const SESSION_HOURS = 24 * 14;
const TZ_OFFSET_MIN = -180; // Argentina, UTC-3

// Catálogo base (los ajustes del panel pueden cambiar nombre, precio, duración y si está activo)
const SERVICES = {
  raices: [50000, 90], balayage: [140000, 180], iluminacion: [140000, 180], fantasia: [80000, 150], botox: [65000, 90],
  alisado: [90000, 150], alisadosf: [120000, 180], ondulacion: [70000, 120], cortedama: [30000, 60], tendencia: [30000, 60],
  caballero: [25000, 45], brushcorto: [18000, 30], brushlargo: [20000, 45], urbano: [50000, 60], gala: [50000, 90], lavado: [7000, 30],
};
const STAFF = ["sebastian"];

async function catalog(env) {
  const row = await env.SG_DB.prepare("SELECT value FROM kv WHERE key='settings'").first();
  let st = {};
  try { st = row ? JSON.parse(row.value) : {}; } catch {}
  const out = {};
  for (const [id, [price, duration]] of Object.entries(SERVICES)) {
    const o = (st.services || []).find((x) => x && x.id === id) || {};
    out[id] = {
      price: Number.isFinite(Number(o.price)) && Number(o.price) >= 0 ? Number(o.price) : price,
      duration: Number(o.duration) >= 15 && Number(o.duration) <= 300 ? Number(o.duration) : duration,
      active: o.active !== false,
    };
  }
  const staffOff = new Set((st.staff || []).filter((x) => x && x.active === false).map((x) => x.id));
  return { services: out, staff: STAFF.filter((x) => !staffOff.has(x)) };
}

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", ...extra },
  });

const digits = (s) => String(s || "").replace(/\D/g, "");
const mins = (t) => { const m = /^(\d{2}):(\d{2})$/.exec(String(t || "")); return m ? Number(m[1]) * 60 + Number(m[2]) : NaN; };
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ""));
const str = (v, max) => String(v ?? "").slice(0, max);

function nowLocal() {
  const d = new Date(Date.now() + TZ_OFFSET_MIN * 60000);
  const date = d.toISOString().slice(0, 10);
  return { date, minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

function closeFor(date) {
  const dow = new Date(date + "T12:00:00Z").getUTCDay(); // 0 dom … 6 sáb
  if (dow === 0 || dow === 1) return null; // domingo y lunes cerrado
  return dow === 6 ? 960 : 1080; // sáb 16:00, mar-vie 18:00
}

async function getCookie(request, name) {
  const c = request.headers.get("cookie") || "";
  const m = c.split(/;\s*/).find((x) => x.startsWith(name + "="));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : "";
}

async function isAdmin(env, request) {
  const token = await getCookie(request, COOKIE);
  if (!token) return false;
  const row = await env.SG_DB.prepare("SELECT expires FROM sessions WHERE token=?").bind(token).first();
  return !!row && row.expires > Date.now();
}

function b64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function unb64(s) { return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); }

async function checkPassword(env, password) {
  const row = await env.SG_DB.prepare("SELECT value FROM kv WHERE key='admin_hash'").first();
  if (!row) return false;
  const [, iter, salt, hash] = row.value.split("$");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(String(password || "")), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: unb64(salt), iterations: Number(iter) }, key, 256);
  const a = b64(bits), b = hash;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function loadAll(env) {
  const [bk, bl, st] = await Promise.all([
    env.SG_DB.prepare("SELECT data FROM bookings ORDER BY date, time").all(),
    env.SG_DB.prepare("SELECT id,date,start,end,barber_id,note FROM blocks ORDER BY date, start").all(),
    env.SG_DB.prepare("SELECT value FROM kv WHERE key='settings'").first(),
  ]);
  return {
    bookings: bk.results.map((r) => JSON.parse(r.data)),
    blocks: bl.results.map((r) => ({ id: r.id, date: r.date, start: r.start, end: r.end, barberId: r.barber_id, note: r.note })),
    settings: st ? JSON.parse(st.value) : {},
  };
}

function cleanBooking(b) {
  return {
    id: str(b.id, 60), name: str(b.name, 80), phone: str(b.phone, 30), email: str(b.email, 120), notes: str(b.notes, 500),
    serviceId: str(b.serviceId, 40), barberId: str(b.barberId, 40), date: str(b.date, 10), time: str(b.time, 5),
    duration: Math.max(15, Math.min(300, Number(b.duration) || 30)), price: Math.max(0, Number(b.price) || 0),
    status: ["confirmed", "pending", "cancelled", "done", "completed", "noshow"].includes(b.status) ? b.status : "confirmed",
    createdAt: str(b.createdAt || new Date().toISOString(), 40),
  };
}

async function slotFree(env, b, exceptId = "") {
  const close = closeFor(b.date);
  const a = mins(b.time), end = a + b.duration;
  if (!isDate(b.date) || close === null || !Number.isFinite(a) || a < 600 || end > close || a % 30) return "Horario fuera de atención";
  const now = nowLocal();
  if (b.date < now.date || (b.date === now.date && a <= now.minutes)) return "Ese horario ya pasó";
  const blocks = await env.SG_DB.prepare("SELECT start,end,barber_id FROM blocks WHERE date=?").bind(b.date).all();
  if (blocks.results.some((x) => (x.barber_id === b.barberId || x.barber_id === "all") && a < mins(x.end) && end > mins(x.start))) return "Horario bloqueado";
  const taken = await env.SG_DB.prepare("SELECT id,time,duration FROM bookings WHERE date=? AND barber_id=? AND status!='cancelled' AND id!=?").bind(b.date, b.barberId, exceptId).all();
  if (taken.results.some((x) => a < mins(x.time) + x.duration && end > mins(x.time))) return "Ese horario ya está ocupado";
  return "";
}

const insertStmt = (env, b) =>
  env.SG_DB.prepare("INSERT OR REPLACE INTO bookings (id,date,time,duration,barber_id,service_id,status,phone,data,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .bind(b.id, b.date, b.time, b.duration, b.barberId, b.serviceId, b.status, digits(b.phone), JSON.stringify(b), b.createdAt);

export async function onRequest({ request, env, params }) {
  if (!env.SG_DB) return json({ error: "Falta configurar la base de datos (binding SG_DB)" }, 500);
  const path = (Array.isArray(params.path) ? params.path.join("/") : String(params.path || "")).replace(/\/+$/, "");
  const method = request.method;
  let body = {};
  if (method === "POST" || method === "PUT") {
    try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  }

  try {
    if (path === "public" && method === "GET") {
      const all = await loadAll(env);
      const bookings = all.bookings.filter((b) => b.status !== "cancelled").map((b) => ({ id: b.id, date: b.date, time: b.time, duration: b.duration, barberId: b.barberId, serviceId: b.serviceId, status: b.status, price: b.price, phone: "", name: "" }));
      return json({ bookings, blocks: all.blocks, settings: all.settings });
    }

    if (path === "bookings" && method === "POST") {
      const b = cleanBooking(body);
      b.status = "confirmed";
      const cat = await catalog(env);
      const svc = cat.services[b.serviceId];
      if (!svc || !svc.active || !cat.staff.includes(b.barberId)) return json({ error: "Servicio no disponible" }, 400);
      b.duration = svc.duration;
      b.price = svc.price;
      if (!b.id || str(b.name, 80).trim().length < 2 || digits(b.phone).length < 6) return json({ error: "Faltan datos del turno" }, 400);
      const exists = await env.SG_DB.prepare("SELECT 1 FROM bookings WHERE id=?").bind(b.id).first();
      if (exists) return json({ error: "Turno duplicado" }, 409);
      const problem = await slotFree(env, b);
      if (problem) return json({ error: problem }, 409);
      await insertStmt(env, b).run();
      return json({ ok: true, booking: b });
    }

    if (path === "mine" && method === "POST") {
      const phone = digits(body.phone);
      if (phone.length < 6) return json({ bookings: [] });
      const r = await env.SG_DB.prepare("SELECT data FROM bookings WHERE phone=? ORDER BY date DESC, time DESC LIMIT 50").bind(phone).all();
      return json({ bookings: r.results.map((x) => JSON.parse(x.data)) });
    }

    if (path === "cancel" && method === "POST") {
      const row = await env.SG_DB.prepare("SELECT data FROM bookings WHERE id=? AND phone=?").bind(str(body.id, 60), digits(body.phone)).first();
      if (!row) return json({ error: "Turno no encontrado" }, 404);
      const b = JSON.parse(row.data);
      b.status = "cancelled";
      await insertStmt(env, b).run();
      return json({ ok: true });
    }

    if (path === "login" && method === "POST") {
      if (!(await checkPassword(env, body.password))) return json({ error: "Contraseña incorrecta" }, 401);
      const token = b64(crypto.getRandomValues(new Uint8Array(32))).replace(/[^a-zA-Z0-9]/g, "");
      const expires = Date.now() + SESSION_HOURS * 3600000;
      await env.SG_DB.batch([
        env.SG_DB.prepare("DELETE FROM sessions WHERE expires < ?").bind(Date.now()),
        env.SG_DB.prepare("INSERT INTO sessions (token,expires) VALUES (?,?)").bind(token, expires),
      ]);
      return json({ ok: true }, 200, { "Set-Cookie": `${COOKIE}=${token}; Path=/Sebastiancolorista; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}` });
    }

    if (path === "logout" && method === "POST") {
      const token = await getCookie(request, COOKIE);
      if (token) await env.SG_DB.prepare("DELETE FROM sessions WHERE token=?").bind(token).run();
      return json({ ok: true }, 200, { "Set-Cookie": `${COOKIE}=; Path=/Sebastiancolorista; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
    }

    if (path.startsWith("admin/")) {
      if (!(await isAdmin(env, request))) return json({ error: "No autorizado" }, 401);
      if (path === "admin/state" && method === "GET") return json(await loadAll(env));
      if (path === "admin/bookings" && method === "PUT") {
        // Solo actualiza los turnos enviados (nunca borra): evita pisar reservas nuevas hechas mientras el panel estaba abierto
        const list = (Array.isArray(body) ? body : []).map(cleanBooking).filter((b) => b.id && isDate(b.date));
        if (list.length) await env.SG_DB.batch(list.map((b) => insertStmt(env, b)));
        return json({ ok: true });
      }
      if (path === "admin/blocks" && method === "PUT") {
        const list = (Array.isArray(body) ? body : []).filter((x) => x && x.id && isDate(x.date));
        await env.SG_DB.batch([
          env.SG_DB.prepare("DELETE FROM blocks"),
          ...list.map((x) => env.SG_DB.prepare("INSERT INTO blocks (id,date,start,end,barber_id,note) VALUES (?,?,?,?,?,?)").bind(str(x.id, 60), x.date, str(x.start, 5), str(x.end, 5), str(x.barberId || "all", 40), str(x.note, 200))),
        ]);
        return json({ ok: true });
      }
      if (path === "admin/settings" && method === "PUT") {
        const value = JSON.stringify(body && typeof body === "object" ? body : {});
        if (value.length > 50000) return json({ error: "Ajustes demasiado grandes" }, 400);
        await env.SG_DB.prepare("INSERT OR REPLACE INTO kv (key,value) VALUES ('settings',?)").bind(value).run();
        return json({ ok: true });
      }
    }

    return json({ error: "Ruta no encontrada" }, 404);
  } catch (err) {
    return json({ error: "Error del servidor" }, 500);
  }
}
