/* Zenix AR · Opción 1: teléfono 3D con las apps reales, guiado por scroll. */
(function () {
  'use strict';
  var F = window.Fly, LAST = F.LAST, MO = F.reduced ? 0 : 1;
  var phone = document.getElementById('phone'), aura = document.getElementById('aura'), glare = document.getElementById('glare');
  var screens = Array.prototype.slice.call(document.querySelectorAll('#screen .scr'));

  // cuerpo con espesor: capas apiladas en Z
  var SLABS = 11;
  for (var i = 0; i < SLABS; i++) {
    var s = document.createElement('div'); s.className = 'slab';
    s.style.transform = 'translateZ(calc(var(--th) * ' + (i / (SLABS - 1) - 0.5).toFixed(3) + '))';
    phone.insertBefore(s, phone.firstChild);
  }

  var vw, vh, pw, ph, keys;
  function measure() {
    vw = window.innerWidth; vh = window.innerHeight;
    var mobile = F.small();
    ph = mobile ? vh * 0.38 : Math.min(vh * 0.68, vw * 0.36 * 1.975);
    pw = ph / 1.975;
    phone.style.setProperty('--pw', pw.toFixed(1) + 'px');
    var X = mobile ? 0 : vw * 0.22, Y = mobile ? -vh * 0.15 : vh * 0.02, tilt = mobile ? 8 : 12;
    keys = [{ x: X, y: Y, s: mobile ? 1 : 1.05, rx: 10, ry: -tilt - 10, rz: -5 }];
    for (var i = 1; i < LAST; i++) {
      var tall = mobile && (i === 1 || i === LAST - 1);          // capítulos con mucho texto: en celular el teléfono se achica y sube
      keys.push({ x: X, y: tall ? Y - ph * 0.11 : Y, s: tall ? 0.8 : 1, rx: 4, ry: (F.reduced ? 0 : 360 * i) + (i % 2 ? -tilt : tilt * 0.85), rz: 0 });
    }
    keys.push({ x: 0, y: 0, s: Math.max(vw / (pw * 0.936), vh / (pw * 1.91)) * 1.1, rx: 0, ry: F.reduced ? 0 : 360 * LAST, rz: 0 });
    aura.style.width = aura.style.height = (ph * 1.7).toFixed(0) + 'px';
    aura.style.margin = (-ph * 0.85).toFixed(0) + 'px 0 0 ' + (-ph * 0.85).toFixed(0) + 'px';
  }
  measure(); F.onResize(function () { measure(); resizeGL(); });

  var HUES = [0, 20, 320, 0, 150, 60, 200, 300, 30, 0], hueNow = -1, scrNow = -1;

  /* ---------- pantallas vivas: pequeñas secuencias animadas sobre las capturas reales ---------- */
  function money(n) { return '$ ' + Math.round(n).toLocaleString('es-AR'); }
  function count(el, from, to, ms) {
    var t0 = performance.now();
    (function step(now) { var k = Math.min(1, (now - t0) / ms); el.textContent = money(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1 && el.isConnected) requestAnimationFrame(step); })(t0);
  }
  function tapAt(el, x, y) {
    el.style.left = x + '%'; el.style.top = y + '%';
    if (el.animate) el.animate([{ transform: 'scale(.3)', opacity: .7 }, { transform: 'scale(1.5)', opacity: 0 }], { duration: 520, easing: 'ease-out' });
  }
  function flyTo(el, x0, y0, x1, y1) {
    el.style.left = x0 + '%'; el.style.top = y0 + '%';
    var W0 = el.parentNode.clientWidth, H0 = el.parentNode.clientHeight;
    if (el.animate) el.animate([{ transform: 'translate(0,0) scale(1.4)', opacity: 1 }, { transform: 'translate(' + ((x1 - x0) / 100 * W0) + 'px,' + ((y1 - y0) / 100 * H0) + 'px) scale(.5)', opacity: .2 }], { duration: 420, easing: 'cubic-bezier(.5,0,.8,.6)' });
  }
  var LOGO = '<img src="../assets/logo-zx.webp" alt="">';
  function all(q, sel) { return Array.prototype.slice.call(q('.ui').querySelectorAll(sel)); }
  var LIVE = {
    sol: { html: '<div class="ui"><div class="ui-h">' + LOGO + '<span>Soluciones</span></div>' +
        '<div class="card"><img src="../assets/icon-web.svg" alt=""><div><b>Desarrollo web</b><small>Páginas y apps web</small></div></div>' +
        '<div class="card"><img src="../assets/icon-android.svg" alt=""><div><b>Apps y sistemas</b><small>Herramientas a medida</small></div></div>' +
        '<div class="card"><img src="../assets/icon-extension.svg" alt=""><div><b>Automatización</b><small>Menos tareas repetitivas</small></div></div>' +
        '<div class="pill">Hablemos →</div></div>',
      dur: 7600, reset: function (q) { all(q, '.card').forEach(function (c) { c.classList.remove('on'); }); },
      steps: function (q) {
        var c = all(q, '.card');
        function only(i) { return function () { c.forEach(function (el, k) { el.classList.toggle('on', i < 0 || k === i); }); }; }
        return [[800, only(0)], [2200, only(1)], [3600, only(2)], [5000, only(-1)]];
      } },
    nos: { html: '<div class="ui mid">' + LOGO + '<p class="q">Primero entendemos <em>qué necesitás resolver.</em></p>' +
        '<div class="chips"><span>Web</span><span>App</span><span>Automatización</span><span>Mejora</span></div><small>Después elegimos la herramienta adecuada.</small></div>',
      dur: 7200, reset: function (q) { all(q, '.chips span').forEach(function (c) { c.className = ''; }); },
      steps: function (q) {
        var c = all(q, '.chips span');
        function only(i, cls) { return function () { c.forEach(function (el, k) { el.className = k === i ? cls : ''; }); }; }
        return [[900, only(0, 'on')], [1500, only(1, 'on')], [2100, only(2, 'on')], [2700, only(3, 'on')], [3400, only(1, 'pick')]];
      } },
    como: { html: '<div class="ui"><div class="ui-h">' + LOGO + '<span>Tu proyecto</span></div><div class="stepper"><i class="line"><b></b></i>' +
        '<div class="st"><span>01</span><div><b>Te escuchamos</b><small>Definimos el alcance</small></div></div>' +
        '<div class="st"><span>02</span><div><b>Te mostramos una demo</b><small>Para probar antes de avanzar</small></div></div>' +
        '<div class="st"><span>03</span><div><b>La usás y la mejoramos</b><small>Ajustes con el uso real</small></div></div></div>' +
        '<div class="pill ok">✓ Primera versión lista</div></div>',
      dur: 8000, reset: function (q) { all(q, '.st').forEach(function (c) { c.classList.remove('done'); }); q('.line b').style.height = '0%'; q('.pill').classList.remove('show'); },
      steps: function (q) {
        var c = all(q, '.st');
        function done(i, h) { return function () { c[i].classList.add('done'); q('.line b').style.height = h + '%'; }; }
        return [[800, done(0, 12)], [2300, done(1, 50)], [3800, done(2, 100)], [4700, function () { q('.pill').classList.add('show'); }]];
      } },
    caja: { html: '<i class="tap"></i><i class="fly"></i><div class="cart"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2.5l2.2 10.5h10.2L20 7.5H7"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/></svg><span>Carrito vacío</span><b>$ 0</b></div>',
      dur: 9200, reset: function (q) { q('.cart').className = 'cart'; q('span').textContent = 'Carrito vacío'; q('b').textContent = '$ 0'; },
      steps: function (q) {
        function add(t, x, y, label, a, b) {
          return [[t, function () { tapAt(q('.tap'), x, y); flyTo(q('.fly'), x, y, 12, 87); }],
            [t + 400, function () { q('span').textContent = label; count(q('b'), a, b, 450); q('.cart').classList.add('bump'); }],
            [t + 620, function () { q('.cart').classList.remove('bump'); }]];
        }
        return add(900, 26, 30, '1 producto', 0, 3200).concat(add(2700, 26, 74, '2 productos', 3200, 8800), add(4500, 74, 30, '3 productos', 8800, 11700),
          [[6100, function () { q('.cart').classList.add('pay'); q('span').textContent = 'Cobrar'; }]]);
      } },
    cotiza: { html: '<div class="num">$ 1.890.020</div><i class="bar"></i><div class="toast" style="top:9%"><b>✓</b>Tu cliente aceptó el presupuesto</div>',
      dur: 8000, reset: function (q) { q('.num').className = 'num'; q('.num').textContent = '$ 1.890.020'; q('.bar').className = 'bar'; q('.toast').classList.remove('show'); },
      steps: function (q) {
        return [[1000, function () { q('.toast').classList.add('show'); }],
          [1900, function () { q('.num').classList.add('up'); count(q('.num'), 1890020, 2376220, 1000); q('.bar').classList.add('up'); }],
          [4600, function () { q('.toast').classList.remove('show'); }]];
      } },
    club: { html: '<i class="tap"></i><b class="cnt c1">5/8</b><b class="cnt c2">5/8</b><span class="stamp">+1 sello</span><div class="toast bot" style="bottom:9.5%"><b>✓</b>Sello sumado · le llega por WhatsApp</div>',
      dur: 8000, reset: function (q) { q('.c1').className = 'cnt c1'; q('.c2').className = 'cnt c2'; q('.c1').textContent = q('.c2').textContent = '5/8'; q('.stamp').classList.remove('show'); q('.toast').classList.remove('show'); },
      steps: function (q) {
        function stamp(t, y, c) {
          return [[t, function () { tapAt(q('.tap'), 50, y); }],
            [t + 300, function () { q(c).textContent = '6/8'; q(c).classList.add('pop'); q('.stamp').style.top = (y - 1.4) + '%'; q('.stamp').classList.add('show'); }],
            [t + 1300, function () { q('.stamp').classList.remove('show'); q(c).style.transform = 'none'; }]];
        }
        return stamp(900, 28.5, '.c1').concat(stamp(2900, 37.7, '.c2'), [[4400, function () { q('.toast').classList.add('show'); }], [6600, function () { q('.toast').classList.remove('show'); }]]);
      } },
    escaner: { html: '<i class="tap limey"></i><i class="scan"></i><div class="toast lime">PDF listo · 3 páginas</div>',
      dur: 7600, reset: function (q) { q('.scan').classList.remove('go'); q('.toast').classList.remove('show'); },
      steps: function (q) {
        return [[800, function () { tapAt(q('.tap'), 68, 93.2); }], [1150, function () { q('.scan').classList.add('go'); }],
          [3500, function () { q('.toast').classList.add('show'); }], [6000, function () { q('.toast').classList.remove('show'); }]];
      } },
    mili: { html: '<div class="toast bot eq"><span><i></i><i></i><i></i><i></i></span>Leyendo en voz alta</div>',
      dur: 600000, reset: function (q) { q('.toast').classList.remove('show'); },
      steps: function (q) { return [[700, function () { q('.toast').classList.add('show'); }]]; } }
  };
  var lives = screens.map(function (scr) {
    var lv = scr.querySelector && scr.querySelector('.lv'); if (!lv) return null;
    var def = LIVE[lv.dataset.app]; lv.innerHTML = def.html;
    var q = function (sel) { return lv.querySelector(sel); }, timers = [], loop = 0;
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function run() { clear(); def.reset(q); Array.prototype.forEach.call(lv.querySelectorAll('.cnt'), function (c) { c.style.transform = ''; }); def.steps(q).forEach(function (st) { timers.push(setTimeout(st[1], st[0])); }); }
    return { start: function () { run(); clearInterval(loop); loop = setInterval(run, def.dur); }, stop: function () { clear(); clearInterval(loop); def.reset(q); } };
  });
  var liveNow = null;
  function setLive(idx) { if (liveNow) liveNow.stop(); liveNow = lives[idx]; if (liveNow) liveNow.start(); }
  document.addEventListener('visibilitychange', function () { if (liveNow) { if (document.hidden) liveNow.stop(); else liveNow.start(); } });

  /* ---------- teléfono tocable: arrastrar para girar ---------- */
  var TIP = [0, 0, 0, 1, 1, 1, 1, 1, 0, 0];   // capítulos donde se muestra la ayuda
  var tip = document.getElementById('tip');
  var drag = { on: false, id: -1, x0: 0, y0: 0, t0: 0, ry: 0, rx: 0, by: 0, bx: 0, moved: 0 };
  phone.addEventListener('pointerdown', function (e) {
    if (e.button) return;
    drag.on = true; drag.id = e.pointerId; drag.x0 = e.clientX; drag.y0 = e.clientY; drag.t0 = performance.now(); drag.by = drag.ry; drag.bx = drag.rx; drag.moved = 0;
    try { phone.setPointerCapture(e.pointerId); } catch (err) {}
    phone.classList.add('drag');
  });
  phone.addEventListener('pointermove', function (e) {
    if (!drag.on || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    drag.moved = Math.max(drag.moved, Math.abs(dx), Math.abs(dy));
    drag.ry = drag.by + dx * 0.55;
    if (e.pointerType === 'mouse') drag.rx = Math.max(-40, Math.min(40, drag.bx - dy * 0.3));
  });
  function release(e, cancelled) {
    if (!drag.on || e.pointerId !== drag.id) return;
    drag.on = false; phone.classList.remove('drag');
  }
  phone.addEventListener('pointerup', function (e) { release(e, false); });
  phone.addEventListener('pointercancel', function (e) { release(e, true); });
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------- fondo WebGL: polvo en profundidad + anillo de partículas detrás del teléfono ---------- */
  var canvas = document.getElementById('gl'), gl = null, pDust, pRing, lD = {}, lR = {}, bDust, bRing;
  var DUST = F.coarse ? 600 : 1200, RING = F.coarse ? 2600 : 5200, W = 1, H = 1, FOV = 1.7320508, lost = false;
  var COLS = [[.56, .38, 1], [.4, .55, 1], [.72, .45, 1], [.3, .85, .6], [.35, .6, 1], [.9, .45, .8], [.13, .8, .95], [.62, .45, 1], [.3, .75, .95], [.56, .38, 1]];
  function compile(vs, fs) {
    function sh(t, src) { var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  function initGL() {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false }) || canvas.getContext('experimental-webgl');
    if (!gl) return false;
    try {
      pDust = compile('attribute vec3 aP; uniform float uZ,uAsp,uF,uPx; varying float vA;' +
        'void main(){ float d=(1.-fract(aP.z+uZ))*26.+.2; gl_Position=vec4(aP.x*uF/uAsp,aP.y*uF,d*1.0017-.1001,d);' +
        ' gl_PointSize=min(uPx*1.1/d,22.); vA=smoothstep(26.,12.,d)*smoothstep(.2,2.5,d); }',
        'precision mediump float; varying float vA; void main(){ float d=length(gl_PointCoord-.5); gl_FragColor=vec4(vec3(.62,.6,.95)*smoothstep(.5,0.,d)*vA*.55,1.); }');
      pRing = compile('attribute vec4 aP; uniform float uT,uAsp,uF,uPx,uR,uA; uniform vec2 uC; uniform vec3 uCol; varying vec3 vC;' +
        'void main(){ float a=aP.x+uT*(.1+aP.w*.12); float r=uR*(1.+aP.y*.5);' +
        ' vec3 p=vec3(cos(a)*r,aP.z*uR*.22+sin(a*3.+uT)*.04,sin(a)*r);' +
        ' float c=cos(1.18),s=sin(1.18); p=vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);' +
        ' c=cos(.35); s=sin(.35); p=vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z);' +
        ' p.xy+=uC; float d=6.-p.z; gl_Position=vec4(p.x*uF/uAsp,p.y*uF,d*1.0017-.1001,d);' +
        ' gl_PointSize=min(uPx*(.7+aP.w*1.4)/d,30.); vC=mix(uCol,vec3(1.),aP.w*aP.w*.5)*uA*(.35+.65*smoothstep(8.5,4.5,d)); }',
        'precision mediump float; varying vec3 vC; void main(){ float d=length(gl_PointCoord-.5); gl_FragColor=vec4(vC*smoothstep(.5,.05,d)*.6,1.); }');
    } catch (e) { gl = null; return false; }
    lD.aP = gl.getAttribLocation(pDust, 'aP'); ['uZ', 'uAsp', 'uF', 'uPx'].forEach(function (n) { lD[n] = gl.getUniformLocation(pDust, n); });
    lR.aP = gl.getAttribLocation(pRing, 'aP'); ['uT', 'uAsp', 'uF', 'uPx', 'uR', 'uA', 'uC', 'uCol'].forEach(function (n) { lR[n] = gl.getUniformLocation(pRing, n); });
    var d = new Float32Array(DUST * 3), i;
    for (i = 0; i < DUST; i++) { var a = Math.random() * 6.2832, r = 1.3 + Math.pow(Math.random(), 0.7) * 7; d[i * 3] = Math.cos(a) * r; d[i * 3 + 1] = Math.sin(a) * r; d[i * 3 + 2] = Math.random(); }
    var g = new Float32Array(RING * 4);
    for (i = 0; i < RING; i++) { g[i * 4] = Math.random() * 6.2832; g[i * 4 + 1] = (Math.random() + Math.random() - 1) * 0.5; g[i * 4 + 2] = (Math.random() + Math.random() - 1); g[i * 4 + 3] = Math.random(); }
    bDust = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bDust); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
    bRing = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bRing); gl.bufferData(gl.ARRAY_BUFFER, g, gl.STATIC_DRAW);
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.clearColor(0.027, 0.024, 0.051, 1);
    W = H = 1; resizeGL();
    return true;
  }
  function resizeGL() {
    if (!gl) return;
    var dpr = Math.min(window.devicePixelRatio || 1, F.coarse ? 1.75 : 2);
    var w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (w === W && h === H) return;
    W = canvas.width = w; H = canvas.height = h; gl.viewport(0, 0, W, H);
  }
  var hasGL = initGL();
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; });
  canvas.addEventListener('webglcontextrestored', function () { lost = false; hasGL = initGL(); });

  function drawGL(p, time, x, y, dive, col) {
    var asp = W / H, halfH = 6 / FOV, k = halfH / (vh / 2);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(pDust);
    gl.bindBuffer(gl.ARRAY_BUFFER, bDust); gl.enableVertexAttribArray(lD.aP); gl.vertexAttribPointer(lD.aP, 3, gl.FLOAT, false, 0, 0);
    gl.uniform1f(lD.uZ, p * 0.4 * MO + time * 0.006); gl.uniform1f(lD.uAsp, asp); gl.uniform1f(lD.uF, FOV); gl.uniform1f(lD.uPx, H * 0.012);
    gl.drawArrays(gl.POINTS, 0, DUST);
    if (dive > 0.98) return;
    gl.useProgram(pRing);
    gl.bindBuffer(gl.ARRAY_BUFFER, bRing); gl.enableVertexAttribArray(lR.aP); gl.vertexAttribPointer(lR.aP, 4, gl.FLOAT, false, 0, 0);
    gl.uniform1f(lR.uT, time + p * 2.2 * MO); gl.uniform1f(lR.uAsp, asp); gl.uniform1f(lR.uF, FOV); gl.uniform1f(lR.uPx, H * 0.011);
    gl.uniform1f(lR.uR, ph * 0.6 * k * (1 + dive * 2.5)); gl.uniform1f(lR.uA, 1 - dive);
    gl.uniform2f(lR.uC, x * k, -y * k); gl.uniform3f(lR.uCol, col[0], col[1], col[2]);
    gl.drawArrays(gl.POINTS, 0, RING);
  }

  var offNow = false;
  F.start(function (p, time, dt) {
    var s = Math.min(LAST - 1, Math.floor(p)), f = p - s, t = F.smooth(0.08, 0.92, f);
    var a = keys[s], b = keys[s + 1], dive = s + 1 === LAST ? t : 0;
    var tr = dive ? F.smooth(0, 0.58, t) : t, tz = dive ? F.smooth(0.42, 1, t) : t; // en el cierre: primero gira, después entra a la pantalla
    var sc = Math.exp(lerp(Math.log(a.s), Math.log(b.s), tz));
    var x = lerp(a.x, b.x, t), y = lerp(a.y, b.y, t) + Math.sin(time * 0.65) * 3 * MO * (1 - dive);
    var lift = Math.sin(Math.PI * t) * (1 - dive);               // en cada giro el teléfono se acerca un poco
    var ry = lerp(a.ry, b.ry, tr) + (Math.sin(time * 0.45) * 1.6 * MO + F.ptr.x * 10 * MO) * (1 - dive);
    var rx = lerp(a.rx, b.rx, t) + (Math.cos(time * 0.4) * 1 * MO - F.ptr.y * 6 * MO) * (1 - dive) + lift * 3 * MO;
    var rz = lerp(a.rz, b.rz, t);
    if (!drag.on) { var k = Math.exp(-dt * 3.2); drag.ry *= k; drag.rx *= k; }   // al soltar vuelve solo a su lugar
    ry += drag.ry * (1 - dive); rx += drag.rx * (1 - dive);
    if ((dive > 0.25) !== offNow) { offNow = dive > 0.25; phone.classList.toggle('off', offNow); }
    var near = Math.abs(p - Math.round(p)), ti = Math.round(p);
    tip.style.opacity = (TIP[ti] ? (1 - F.smooth(0.08, 0.24, near)) * 0.9 : 0).toFixed(3);
    tip.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + (y + ph / 2 + 16).toFixed(1) + 'px,0)';
    phone.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + (lift * 45 * MO).toFixed(1) + 'px) rotateZ(' + rz.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
    glare.style.backgroundPosition = (((ry % 360) + 360) % 360 / 360 * 140 - 20).toFixed(1) + '% 0';

    var idx = tr < 0.5 ? s : s + 1;
    if (idx !== scrNow) { scrNow = idx; screens.forEach(function (el, i) { el.classList.toggle('on', i === idx); }); setLive(idx); }
    var hueDelta = ((HUES[s + 1] - HUES[s] + 540) % 360) - 180;
    var nextHue = HUES[s] + hueDelta * t;
    if (Math.abs(nextHue - hueNow) > 0.1) { hueNow = nextHue; aura.style.filter = 'hue-rotate(' + hueNow.toFixed(2) + 'deg)'; }
    aura.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    aura.style.opacity = (0.75 * (1 - dive)).toFixed(3);

    if (hasGL && !lost) {
      var ca = COLS[s], cb = COLS[s + 1];
      drawGL(p, time, x, y, dive, [lerp(ca[0], cb[0], t), lerp(ca[1], cb[1], t), lerp(ca[2], cb[2], t)]);
    }
  });
})();
