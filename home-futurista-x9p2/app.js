/* Zenix AR · Home futurista — celular 3D protagonista (código propio, sin librerías) */
(function () {
  'use strict';

  var doc = document.documentElement, body = document.body;
  var mqMob = window.matchMedia('(max-width: 900px)');
  var fine = window.matchMedia('(pointer: fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vw = innerWidth, vh = innerHeight, mob = mqMob.matches;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ss(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* =========================================================
     Elementos
     ========================================================= */
  var exp = document.getElementById('exp');
  var rig = document.getElementById('rig');
  var phone = document.getElementById('phone');
  var shadow = document.getElementById('phoneShadow');
  var layers = Array.prototype.slice.call(phone.querySelectorAll('.ly'));
  var holos = Array.prototype.slice.call(document.querySelectorAll('.holo'));
  var screens = {};
  Array.prototype.forEach.call(phone.querySelectorAll('.scr'), function (s) { screens[s.dataset.s] = s; });
  var cps = Array.prototype.slice.call(document.querySelectorAll('.cp'));
  var chapterBtns = Array.prototype.slice.call(document.querySelectorAll('.chapters button'));
  var hudPhase = document.getElementById('hudPhase'), hudPct = document.getElementById('hudPct');
  var hint = document.getElementById('hint');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[data-go]'));

  /* =========================================================
     Código en pantalla y en la capa de código
     ========================================================= */
  var BOOT = [
    ['$ zenix build --app tu-negocio', ''],
    ['› diseñando interfaz ........', 'ok'],
    ['› programando funciones .....', 'ok'],
    ['› conectando WhatsApp .......', 'ok'],
    ['› automatizando tareas ......', 'ok'],
    ['› optimizando para Android ..', 'ok'],
    ['› publicando ................', 'ok'],
    ['', ''],
    ['✔ Listo. Tu app está en marcha.', '']
  ];
  var bootEl = document.getElementById('bootCode');
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  document.getElementById('layerCode').innerHTML = [
    '<span class="c">// Zenix AR · hecho a medida</span>',
    '<span class="k">const</span> negocio = escuchar(idea);',
    '',
    '<span class="k">const</span> app = crear({',
    '  ventas:   <span class="k">true</span>,',
    '  stock:    <span class="k">true</span>,',
    '  clientes: <span class="k">true</span>,',
    '  whatsapp: <span class="s">"directo"</span>,',
    '});',
    '',
    '<span class="k">await</span> app.probar(negocio);',
    '<span class="k">await</span> app.mejorar(usoReal);',
    '',
    '<span class="c">// automatizar lo repetitivo</span>',
    'tareas.<span class="k">forEach</span>(t =&gt; {',
    '  automatizar(t);',
    '});',
    '',
    'app.publicar();',
    '<span class="c">// ✔ en marcha</span>'
  ].join('\n');

  var bootState = 'idle'; // idle → typing → done
  function runBoot() {
    if (bootState !== 'idle') return;
    bootState = 'typing';
    if (reduce) { bootState = 'done'; return; }
    var full = BOOT.map(function (l) { return l[0] + (l[1] ? ' ' + l[1] : ''); }).join('\n');
    var t0 = performance.now(), dur = 1700;
    (function step(now) {
      var n = Math.floor(full.length * clamp((now - t0) / dur, 0, 1));
      var shown = esc(full.slice(0, n)).replace(/ ok/g, ' <span class="ok">ok</span>');
      bootEl.innerHTML = shown + (n < full.length ? '<span class="ok">▋</span>' : '');
      if (n < full.length) requestAnimationFrame(step);
      else setTimeout(function () { bootState = 'done'; }, 650);
    })(t0);
  }

  var curScreen = 'boot';
  function setScreen(name) {
    if (name === curScreen) return;
    if (screens[curScreen]) screens[curScreen].classList.remove('on');
    if (screens[name]) screens[name].classList.add('on');
    curScreen = name;
  }

  /* =========================================================
     Fondo: partículas en profundidad + armado del celular
     ========================================================= */
  var cv = document.getElementById('space');
  var ctx = cv.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  var stars = [], NSTARS = mob ? 170 : 380;
  var COLORS = ['167,139,250', '34,211,238', '196,181,253', '103,232,249', '255,255,255'];
  function sizeCanvas() {
    cv.width = Math.round(vw * DPR); cv.height = Math.round(vh * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function newStar(far) {
    return { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: far ? 1 : Math.random() * 0.95 + 0.05, c: COLORS[(Math.random() * COLORS.length) | 0] };
  }
  for (var i = 0; i < NSTARS; i++) stars.push(newStar(false));
  sizeCanvas();

  var assemble = null; // { t0, pts: [...] }
  function startAssembly() {
    if (reduce) { phone.classList.remove('ghost'); runBoot(); return; }
    var g = phone.querySelector('.ly-glass').getBoundingClientRect();
    var pts = [], N = mob ? 150 : 280, r = 46 * (g.width / 290);
    var w = g.width, h = g.height, per = 2 * (w + h);
    for (var k = 0; k < N; k++) {
      var tx, ty;
      if (k < N * 0.72) {
        // contorno
        var d = (k / (N * 0.72)) * per;
        if (d < w) { tx = g.left + d; ty = g.top; }
        else if (d < w + h) { tx = g.right; ty = g.top + (d - w); }
        else if (d < 2 * w + h) { tx = g.right - (d - w - h); ty = g.bottom; }
        else { tx = g.left; ty = g.bottom - (d - 2 * w - h); }
        // redondear esquinas
        tx = clamp(tx, g.left + (ty < g.top + r || ty > g.bottom - r ? r * 0.3 : 0), g.right - (ty < g.top + r || ty > g.bottom - r ? r * 0.3 : 0));
      } else {
        // líneas de código dentro de la pantalla
        var row = (k % 14), col = Math.random();
        tx = g.left + w * 0.14 + col * w * (0.3 + (row % 4) * 0.12);
        ty = g.top + h * 0.14 + row * h * 0.05;
      }
      var a = Math.random() * Math.PI * 2, R = Math.max(vw, vh) * (0.4 + Math.random() * 0.5);
      pts.push({ sx: vw / 2 + Math.cos(a) * R, sy: vh / 2 + Math.sin(a) * R, tx: tx, ty: ty, d: Math.random() * 0.35, c: COLORS[(Math.random() * 4) | 0] });
    }
    assemble = { t0: performance.now(), pts: pts, shown: false, boot: false };
  }

  var scrollVel = 0, lastScrollY = scrollY;
  function drawSpace(now, dt) {
    ctx.clearRect(0, 0, vw, vh);
    var cx = vw / 2 + smx * 30, cy = vh / 2 - smy * 20, f = Math.min(vw, vh) * 0.9;
    var speed = (reduce ? 0 : 0.025) + Math.min(1.6, Math.abs(scrollVel) * 0.0016);
    var streak = clamp(Math.abs(scrollVel) * 0.002, 0, 1);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var pz = s.z;
      s.z -= speed * dt / 1000;
      if (s.z <= 0.02) { stars[i] = newStar(true); continue; }
      var x = cx + (s.x / s.z) * f * 0.5, y = cy + (s.y / s.z) * f * 0.5;
      if (x < -20 || x > vw + 20 || y < -20 || y > vh + 20) { stars[i] = newStar(true); continue; }
      var a = clamp((1 - s.z) * 1.1, 0, 0.9), size = (1 - s.z) * 2.2 + 0.3;
      if (streak > 0.05) {
        var px = cx + (s.x / pz) * f * 0.5, py = cy + (s.y / pz) * f * 0.5;
        ctx.strokeStyle = 'rgba(' + s.c + ',' + a + ')';
        ctx.lineWidth = size;
        ctx.beginPath(); ctx.moveTo(px - (x - px) * streak * 6, py - (y - py) * streak * 6); ctx.lineTo(x, y); ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(' + s.c + ',' + a + ')';
        ctx.fillRect(x, y, size, size);
      }
    }

    if (assemble) {
      var t = (now - assemble.t0) / 1000;
      var fade = 1 - ss(1.5, 2.2, t);
      ctx.globalCompositeOperation = 'lighter';
      for (var k = 0; k < assemble.pts.length; k++) {
        var p = assemble.pts[k];
        var e = easeOut(clamp((t - p.d) / 1.05, 0, 1));
        var X = lerp(p.sx, p.tx, e), Y = lerp(p.sy, p.ty, e);
        var al = (0.25 + 0.75 * e) * fade;
        ctx.fillStyle = 'rgba(' + p.c + ',' + (al * 0.25) + ')';
        ctx.beginPath(); ctx.arc(X, Y, 4.5, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(' + p.c + ',' + al + ')';
        ctx.fillRect(X - 1, Y - 1, 2, 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      if (!assemble.shown && t > 1.15) { assemble.shown = true; phone.classList.remove('ghost'); }
      if (!assemble.boot && t > 1.5) { assemble.boot = true; runBoot(); }
      if (t > 2.3) assemble = null;
    }
  }

  /* =========================================================
     Línea de tiempo del celular
     ========================================================= */
  var P = 0, Ptarget = 0, expTop = 0, expH = 1;
  var pmx = 0, pmy = 0, smx = 0, smy = 0;
  var APP_CUTS = [0.36, 0.505, 0.59, 0.675, 0.79];
  var APP_SCR = ['caja', 'cotiza', 'club', 'escaner'];
  var GO = [0, 0.2, 0.42, 0.88];
  var PHASES = ['SYS.00 · INICIO', 'SYS.01 · CAPAS', 'SYS.02 · APPS', 'SYS.03 · PROYECTOS'];

  // posiciones de hologramas (escritorio, celular a escala 1)
  var HOLO_D = [
    { x: -290, y: -175, z: -150, ry: 24 },
    { x: 290, y: -190, z: -120, ry: -24 },
    { x: -300, y: 175, z: -170, ry: 26 },
    { x: 300, y: 185, z: -130, ry: -26 },
    { x: -250, y: 235, z: -230, ry: 20 }
  ];

  function measure() {
    vw = innerWidth; vh = innerHeight; mob = mqMob.matches;
    var r = exp.getBoundingClientRect();
    expTop = r.top + scrollY; expH = Math.max(1, exp.offsetHeight - vh);
  }

  function mix(o, t, k) { for (var key in t) o[key] = lerp(o[key], t[key], k); return o; }

  function phaseOf(p) { return p < 0.1 ? 0 : p < 0.36 ? 1 : p < 0.79 ? 2 : 3; }

  var lastPhase = -1, activeCp = null;
  function update(now) {
    var t = now / 1000;

    // -------- tramos --------
    var ex = ss(0.1, 0.19, P) * (1 - ss(0.3, 0.37, P));                  // desarmado
    var ap = ss(0.35, 0.42, P) * (1 - ss(0.79, 0.85, P));                // hologramas de apps
    var pr = ss(0.8, 0.88, P);                                           // proyectos
    var app = -1;
    for (var a = 0; a < 4; a++) if (P >= APP_CUTS[a] && P < APP_CUTS[a + 1]) app = a;

    // -------- ubicación general --------
    var s, rx0, ry0, k;
    if (mob) {
      s = clamp((vh * 0.4) / 600, 0.42, 0.66);
      rx0 = vw * 0.5; ry0 = vh * 0.31;
      k = Math.min(vw / 390, 1.2) * 0.62;
    } else {
      s = clamp((vh * 0.72) / 600, 0.66, 1.05);
      rx0 = vw * (0.5 + lerp(0.19, 0.2, ap)); ry0 = vh * 0.5 + 8;
      k = Math.min(1, vw / 1440) * s;
    }
    rig.style.transform = 'translate3d(' + rx0.toFixed(1) + 'px,' + ry0.toFixed(1) + 'px,0)';

    // -------- pose del celular --------
    var floatY = reduce ? 0 : Math.sin(t * 1.1) * 8;
    var pose = { x: 0, y: floatY, z: 0, rx: 6, ry: -16, rz: 2 };
    mix(pose, mob ? { x: 46, y: 64 + floatY * 0.4, z: -170, rx: 20, ry: -38, rz: -8 } : { x: -40, y: 85 + floatY * 0.4, z: -170, rx: 22, ry: -46, rz: -10 }, ex);
    var swing = app >= 0 ? (app - 1.5) * 7 : 0;
    mix(pose, { x: 0, y: floatY * 0.6, z: 0, rx: 4, ry: -6 + swing, rz: 0 }, ap);
    mix(pose, { x: mob ? 0 : 30, y: floatY, z: 0, rx: 6, ry: 18, rz: -3 }, pr);
    pose.ry += smx * 10; pose.rx += -smy * 6;

    phone.style.transform = 'translate3d(' + pose.x.toFixed(1) + 'px,' + pose.y.toFixed(1) + 'px,' + pose.z.toFixed(1) + 'px)' +
      ' rotateX(' + pose.rx.toFixed(2) + 'deg) rotateY(' + pose.ry.toFixed(2) + 'deg) rotateZ(' + pose.rz.toFixed(2) + 'deg) scale(' + s.toFixed(3) + ')';
    phone.style.setProperty('--ex', ss(0.35, 0.9, ex).toFixed(3));
    shadow.style.transform = 'translate3d(0,' + (300 * s + 40) + 'px,-60px) rotateX(80deg) scale(' + (s * (1 - ex * 0.3)).toFixed(3) + ')';
    shadow.style.opacity = (1 - ex * 0.5).toFixed(2);

    // -------- capas --------
    var gap = mob ? 64 : 92;
    for (var l = 0; l < layers.length; l++) {
      var lz = l * 2 + l * gap * ex, lx = l * ex * 12, ly = -l * ex * 10;
      layers[l].style.transform = 'translate3d(' + lx.toFixed(1) + 'px,' + ly.toFixed(1) + 'px,' + lz.toFixed(1) + 'px)';
    }

    // -------- hologramas --------
    for (var h = 0; h < holos.length; h++) {
      var el = holos[h], base = HOLO_D[h];
      var o, isOn = false;
      if (h < 4) {
        o = easeOut(clamp(ap * 1.45 - h * 0.11, 0, 1));
        isOn = (h === app) && ap > 0.6;
      } else {
        o = easeOut(clamp(pr * 1.2, 0, 1));
        isOn = o > 0.6;
      }
      if (o <= 0.001) { if (el._vis !== false) { el.style.opacity = '0'; el._vis = false; } continue; }
      el._vis = true;
      var hx, hy, hz, hs;
      if (mob) {
        var mx = [-0.37, 0.37, -0.37, 0.37, 0][h] * vw, my = [-0.12, -0.14, 0.08, 0.1, 0.15][h] * vh;
        hx = mx; hy = my; hz = h === 4 ? 60 : base.z * 0.5; hs = h === 4 ? 0.62 : 0.42;
      } else {
        hx = base.x * k * 1.05; hy = base.y * k; hz = base.z; hs = 0.92 * Math.min(1, k + 0.1);
      }
      var bob = reduce ? 0 : Math.sin(t * 1.3 + h * 1.7) * 6;
      var act = isOn ? 1 : 0;
      el._act = lerp(el._act || 0, act, 0.12);
      var A = el._act;
      var X = lerp(0, hx, o) + (mob ? -hx * 0.15 * A : -hx * 0.12 * A);
      var Y = lerp(0, hy + bob, o);
      var Z = lerp(-60, hz, o) + 110 * A;
      var S = lerp(0.2, hs, o) * (1 + 0.14 * A);
      var RY = base.ry * o * (1 - 0.5 * A) + smx * 6;
      el.style.transform = 'translate3d(' + X.toFixed(1) + 'px,' + Y.toFixed(1) + 'px,' + Z.toFixed(1) + 'px) rotateY(' + RY.toFixed(2) + 'deg) scale(' + S.toFixed(3) + ')';
      var dim = (h < 4 && app >= 0 && !isOn) ? 0.5 : 1;
      el.style.opacity = (o * dim).toFixed(3);
      el.classList.toggle('on', isOn);
    }

    // -------- pantalla --------
    if (pr > 0.5) setScreen('mili' + (1 + (Math.floor(t / 1.9) % 3)));
    else if (app >= 0 && ap > 0.3) setScreen(APP_SCR[app]);
    else if (bootState === 'done') setScreen('splash');

    // -------- textos --------
    var next = null;
    for (var c = 0; c < cps.length; c++) if (P >= +cps[c].dataset.a && P < +cps[c].dataset.b) { next = cps[c]; break; }
    if (next !== activeCp) { if (activeCp) activeCp.classList.remove('on'); if (next) next.classList.add('on'); activeCp = next; }

    // -------- HUD y capítulos --------
    var ph = phaseOf(P);
    if (ph !== lastPhase) {
      lastPhase = ph;
      hudPhase.textContent = PHASES[ph];
      chapterBtns.forEach(function (b, i) { b.classList.toggle('on', i === ph); });
      navLinks.forEach(function (a) { a.classList.toggle('on', +a.dataset.go === ph && ph > 0); });
    }
    var pct = Math.round(P * 100);
    hudPct.textContent = (pct < 10 ? '00' : pct < 100 ? '0' : '') + pct;
    hint.classList.toggle('hide', P > 0.015);
  }

  /* =========================================================
     Eventos
     ========================================================= */
  window.addEventListener('scroll', function () {
    Ptarget = clamp((scrollY - expTop) / expH, 0, 1);
  }, { passive: true });
  window.addEventListener('pointermove', function (e) {
    if (!fine) return;
    pmx = (e.clientX / vw - 0.5) * 2; pmy = -(e.clientY / vh - 0.5) * 2;
  }, { passive: true });
  var rT;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () { measure(); sizeCanvas(); Ptarget = clamp((scrollY - expTop) / expH, 0, 1); }, 100);
  });

  function goTo(i) {
    measure();
    window.scrollTo({ top: expTop + GO[i] * expH + 2, behavior: reduce ? 'auto' : 'smooth' });
  }
  document.querySelectorAll('[data-go]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); goTo(+b.dataset.go); });
  });

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* =========================================================
     Bucle
     ========================================================= */
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(80, now - last); last = now;
    var y = scrollY;
    scrollVel = lerp(scrollVel, (y - lastScrollY) / Math.max(dt, 1) * 16, 0.2);
    lastScrollY = y;
    var kk = reduce ? 1 : 1 - Math.pow(0.002, dt / 1000);
    P = lerp(P, Ptarget, kk);
    if (Math.abs(P - Ptarget) < 0.0001) P = Ptarget;
    smx = lerp(smx, pmx, 0.06); smy = lerp(smy, pmy, 0.06);
    // la escena solo se actualiza mientras está en pantalla
    if (y < expTop + expH + vh) update(now);
    drawSpace(now, dt);
    requestAnimationFrame(frame);
  }

  /* =========================================================
     Preloader
     ========================================================= */
  var loader = document.getElementById('loader');
  var ldNum = document.getElementById('ldNum'), ldBar = document.getElementById('ldBar');
  var tasks = 0, done = 0, shownPct = 0, t0 = performance.now(), started = false;
  function track(p) { tasks++; p.then(function () { done++; }, function () { done++; }); }
  ['../assets/logo-zx.webp', '../assets/preview-caja.webp', '../assets/preview-cotiza.webp', '../assets/preview-club.webp', '../assets/preview-escaner.webp']
    .forEach(function (src) { track(new Promise(function (res) { var im = new Image(); im.onload = im.onerror = res; im.src = src; })); });
  if (document.fonts && document.fonts.ready) track(Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 2500); })]));
  setTimeout(function () { done = tasks; }, 6000);

  phone.classList.add('ghost');
  measure();
  Ptarget = P = clamp((scrollY - expTop) / expH, 0, 1);
  update(performance.now());

  function tick(now) {
    var real = tasks ? done / tasks : 1;
    var goal = Math.min(real, clamp((now - t0) / 1200, 0, 1)) * 100;
    shownPct = lerp(shownPct, goal, 0.18);
    if (goal >= 100 && shownPct > 99.5) shownPct = 100;
    var v = Math.round(shownPct);
    ldNum.textContent = (v < 10 ? '00' : v < 100 ? '0' : '') + v;
    ldBar.style.width = v + '%';
    if (v >= 100) return start();
    requestAnimationFrame(tick);
  }
  function start() {
    if (started) return; started = true;
    loader.classList.add('done');
    body.classList.remove('is-loading');
    measure();
    Ptarget = P = clamp((scrollY - expTop) / expH, 0, 1);
    if (P > 0.02) { phone.classList.remove('ghost'); bootState = 'done'; }
    else setTimeout(startAssembly, 350);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(tick);
})();
