/* Zenix AR · Inmersión 3D por scroll (demo privada). WebGL puro, sin librerías. */
(function () {
  'use strict';

  var root = document.documentElement;
  var canvas = document.getElementById('gl');
  var chapters = Array.prototype.slice.call(document.querySelectorAll('.ch'));
  var spacer = document.getElementById('spacer');
  var barEl = document.getElementById('bar');
  var dotsEl = document.getElementById('dots');
  var cnum = document.getElementById('cnum');
  var cname = document.getElementById('cname');
  var LAST = chapters.length - 1;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var small = function () { return window.innerWidth <= 760; };
  var MOTION = reduced ? 0.15 : 1;

  /* ---------- scroll → progreso ---------- */
  var seg = 1, vw = 0, target = 0, prog = 0;
  function layout(force) {
    if (!force && window.innerWidth === vw) return; // en celular la barra del navegador cambia el alto: no recalcular
    vw = window.innerWidth;
    seg = Math.round(window.innerHeight * 1.25);
    spacer.style.height = (seg * LAST + window.innerHeight) + 'px';
  }
  function readScroll() { target = Math.max(0, Math.min(LAST, window.scrollY / seg)); }
  function goTo(i) { window.scrollTo({ top: i * seg, behavior: reduced ? 'auto' : 'smooth' }); }

  chapters.forEach(function (ch, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Ir a ' + ch.dataset.name);
    b.addEventListener('click', function () { goTo(i); });
    dotsEl.appendChild(b);
  });
  var dots = Array.prototype.slice.call(dotsEl.children);
  document.querySelector('.logo').addEventListener('click', function (e) { e.preventDefault(); goTo(0); });

  root.classList.add('fly');
  layout(true);
  readScroll(); prog = target;
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', function () { layout(false); readScroll(); resize(); });
  window.addEventListener('orientationchange', function () { setTimeout(function () { layout(true); readScroll(); resize(); }, 250); });

  function smooth(a, b, x) { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }

  var shown = -1;
  function panels(p) {
    for (var i = 0; i <= LAST; i++) {
      var ch = chapters[i], d = p - i, ad = Math.abs(d);
      if (ad > 0.55) { if (ch.style.visibility !== 'hidden') { ch.style.visibility = 'hidden'; ch.style.opacity = 0; ch.classList.remove('live'); } continue; }
      var o = 1 - smooth(0.2, 0.46, ad);
      var s = reduced ? 1 : (d < 0 ? 1 + d * 0.9 : 1 + d * 2.4);
      ch.style.visibility = o > 0.001 ? 'visible' : 'hidden';
      ch.style.opacity = o.toFixed(3);
      ch.style.transform = 'translate3d(0,' + (reduced ? 0 : (-d * 40).toFixed(1)) + 'px,0) scale(' + s.toFixed(4) + ')';
      if (!coarse && !reduced) ch.style.filter = ad > 0.2 ? 'blur(' + ((ad - 0.2) * 22).toFixed(1) + 'px)' : 'none';
      ch.classList.toggle('live', ad < 0.3);
    }
    var cur = Math.max(0, Math.min(LAST, Math.round(p)));
    if (cur !== shown) {
      shown = cur;
      dots.forEach(function (b, i) { b.classList.toggle('on', i === cur); if (i === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      cnum.textContent = '0' + (cur + 1);
      cname.textContent = chapters[cur].dataset.name;
    }
    barEl.style.transform = 'scaleX(' + (p / LAST).toFixed(4) + ')';
  }

  /* ---------- formas (nubes de puntos) ---------- */
  var N = (coarse || small()) ? 14000 : 26000;
  var VIO = [0.56, 0.38, 1.0], CY = [0.13, 0.80, 0.95], WH = [0.95, 0.93, 1.0];
  function rnd() { return Math.random(); }
  function gauss() { return (rnd() + rnd() + rnd() + rnd() - 2) * 0.7; }
  function shape(fn, bright) {
    var pos = new Float32Array(N * 3), col = new Uint8Array(N * 3), o = [0, 0, 0, 0];
    for (var i = 0; i < N; i++) {
      o[0] = o[1] = o[2] = 0; o[3] = 0.5;
      var c = fn(i / N, o) || null;
      pos[i * 3] = o[0]; pos[i * 3 + 1] = o[1]; pos[i * 3 + 2] = o[2];
      if (!c) {
        var k = Math.max(0, Math.min(1, o[3]));
        c = rnd() < 0.07 ? WH : [VIO[0] + (CY[0] - VIO[0]) * k, VIO[1] + (CY[1] - VIO[1]) * k, VIO[2] + (CY[2] - VIO[2]) * k];
      }
      col[i * 3] = Math.min(255, c[0] * 255 * bright); col[i * 3 + 1] = Math.min(255, c[1] * 255 * bright); col[i * 3 + 2] = Math.min(255, c[2] * 255 * bright);
    }
    return { pos: pos, col: col };
  }
  function rotX(o, a) { var c = Math.cos(a), s = Math.sin(a), y = o[1], z = o[2]; o[1] = y * c - z * s; o[2] = y * s + z * c; }
  function onSphere(o, cx, cy, cz, r) {
    var u = rnd() * 2 - 1, th = rnd() * 6.2832, q = Math.sqrt(1 - u * u);
    o[0] = cx + r * q * Math.cos(th); o[1] = cy + r * u; o[2] = cz + r * q * Math.sin(th);
  }

  var gens = [
    // 0 · galaxia
    function (t, o) {
      var r = Math.pow(rnd(), 0.62) * 2.7, arm = Math.floor(rnd() * 3);
      var a = arm * 2.0944 + r * 1.75 + gauss() * 0.42;
      o[0] = Math.cos(a) * r; o[2] = Math.sin(a) * r; o[1] = gauss() * 0.1 * (3 - r);
      rotX(o, 1.05); o[3] = r / 2.7;
    },
    // 1 · relieve de datos (web)
    function (t, o) {
      var side = Math.floor(Math.sqrt(N)), i = Math.floor(t * N), gx = (i % side) / side - 0.5, gz = Math.floor(i / side) / side - 0.5;
      o[0] = gx * 4.3; o[2] = gz * 4.3;
      o[1] = 0.36 * Math.sin(o[0] * 1.9) * Math.cos(o[2] * 1.6) + 0.13 * Math.sin(o[0] * 4.2 + o[2] * 2.7) - 0.1;
      o[3] = 0.5 + o[1] * 1.1; rotX(o, 0.5);
    },
    // 2 · esfera
    function (t, o) {
      var inner = rnd() < 0.22;
      onSphere(o, 0, 0, 0, inner ? 0.85 + gauss() * 0.04 : 1.55 + gauss() * 0.015);
      o[3] = inner ? 0.95 : 0.5 + o[1] * 0.3;
    },
    // 3 · teléfono con interfaz
    function (t, o) {
      var W = 0.86, H = 1.72, R = 0.2;
      if (rnd() < 0.36) { // marco redondeado
        var per = 4 * (W + H - 2 * R) + 6.2832 * R, s = rnd() * per, x, y;
        var a = 2 * (W - R), b = 2 * (H - R), q = 1.5708 * R;
        if (s < a) { x = -W + R + s; y = H; }
        else if ((s -= a) < q) { var an = s / R; x = W - R + R * Math.sin(an); y = H - R + R * Math.cos(an); }
        else if ((s -= q) < b) { x = W; y = H - R - s; }
        else if ((s -= b) < q) { an = s / R; x = W - R + R * Math.cos(an); y = -H + R - R * Math.sin(an); }
        else if ((s -= q) < a) { x = W - R - s; y = -H; }
        else if ((s -= a) < q) { an = s / R; x = -W + R - R * Math.sin(an); y = -H + R - R * Math.cos(an); }
        else if ((s -= q) < b) { x = -W; y = -H + R + s; }
        else { an = (s - b) / R; x = -W + R - R * Math.cos(an); y = H - R + R * Math.sin(an); }
        o[0] = x; o[1] = y; o[2] = (rnd() < 0.5 ? -0.07 : 0.07); o[3] = 0.15;
      } else { // bloques de interfaz en la pantalla
        var rects = [[-0.66, 1.2, 1.32, 0.24], [-0.66, 0.42, 0.6, 0.6], [0.06, 0.42, 0.6, 0.6], [-0.66, -0.32, 0.6, 0.6], [0.06, -0.32, 0.6, 0.6], [-0.66, -0.62, 1.32, 0.09], [-0.66, -0.86, 0.9, 0.09], [-0.36, -1.44, 0.72, 0.26]];
        var w = [3, 3.6, 3.6, 3.6, 3.6, 1.4, 1, 2.2], tot = 22, pick = rnd() * tot, k = 0;
        while (pick > w[k]) { pick -= w[k]; k++; }
        var r = rects[k];
        o[0] = r[0] + rnd() * r[2]; o[1] = r[1] + rnd() * r[3]; o[2] = 0.08; o[3] = k === 7 ? 1 : 0.35 + k * 0.08;
      }
    },
    // 4 · retícula de producto
    function (t, o) {
      var g = 4, s = 2.5 / (g - 1), ix = Math.floor(rnd() * g), iy = Math.floor(rnd() * g), iz = Math.floor(rnd() * g);
      o[0] = ix * s - 1.25; o[1] = iy * s - 1.25; o[2] = iz * s - 1.25;
      if (rnd() < 0.5) { var j = 0.07; o[0] += gauss() * j; o[1] += gauss() * j; o[2] += gauss() * j; o[3] = 0.9; }
      else { var ax = Math.floor(rnd() * 3), idx = [ix, iy, iz][ax]; if (idx === g - 1) o[ax] -= rnd() * s; else o[ax] += rnd() * s; o[3] = 0.25; }
    },
    // 5 · tres pasos conectados
    function (t, o) {
      var C = [[-1.3, -0.5, 0.3], [-0.1, 0, 0.42], [1.25, 0.5, 0.56]];
      if (rnd() < 0.78) { var k = rnd() < 0.24 ? 0 : (rnd() < 0.45 ? 1 : 2), c = C[k]; onSphere(o, c[0], c[1], 0, c[2]); o[3] = k / 2; }
      else { var u = rnd(), x = -1.3 + u * 2.55; o[0] = x; o[1] = x * 0.39 + Math.sin(u * 6.2832) * 0.16 + gauss() * 0.02; o[2] = Math.cos(u * 6.2832 * 2) * 0.12; o[3] = u; }
    },
    // 6 · provisoria hasta muestrear el logo
    function (t, o) { onSphere(o, 0, 0, 0, 1.3); }
  ];
  var BRIGHT = [0.8, 0.85, 0.75, 0.8, 0.8, 0.7, 0.62];

  /* ---------- WebGL ---------- */
  var gl = null, prog1, prog2, loc1 = {}, loc2 = {}, shapes = [], seedBuf, dustBuf, DUST = coarse ? 700 : 1300, lost = false;

  var VS = [
    'attribute vec3 aFrom,aTo,aCF,aCT; attribute vec4 aSeed;',
    'uniform float uT,uTime,uAsp,uF,uDist,uPx,uRY,uRX,uMo; uniform vec2 uOff;',
    'varying vec3 vC; varying float vA;',
    'void main(){',
    ' float t=clamp(uT*1.5-aSeed.x*.5,0.,1.); t=t*t*(3.-2.*t);',
    ' vec3 p=mix(aFrom,aTo,t); float mid=sin(3.14159*t);',
    ' p+=vec3(sin(aSeed.y*43.+uTime*.3),cos(aSeed.z*37.+uTime*.2),sin(aSeed.w*29.))*mid*1.5*uMo;',
    ' p.z+=mid*aSeed.w*3.2*uMo;',
    ' p+=.03*vec3(sin(uTime*.9+aSeed.y*60.),cos(uTime*.7+aSeed.z*60.),sin(uTime*.8+aSeed.w*60.));',
    ' float c=cos(uRY),s=sin(uRY); p=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);',
    ' c=cos(uRX); s=sin(uRX); p=vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);',
    ' p.xy+=uOff; p.z-=uDist; float d=-p.z;',
    ' gl_Position=vec4(p.x*uF/uAsp,p.y*uF,d*1.0017-.1001,d);',
    ' gl_PointSize=min(uPx*(.8+aSeed.x*1.3)/max(d,.25),48.);',
    ' vA=smoothstep(16.,4.,d)*smoothstep(.15,1.2,d);',
    ' vC=mix(aCF,aCT,t)*(1.+mid*.5);',
    '}'].join('\n');
  var FS = [
    'precision mediump float; varying vec3 vC; varying float vA;',
    'void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.05,d); gl_FragColor=vec4(vC*a*vA*.62,1.); }'].join('\n');
  var VS2 = [
    'attribute vec3 aP; uniform float uZ,uAsp,uF,uPx; varying float vA;',
    'void main(){ float d=(1.-fract(aP.z+uZ))*26.+.2;',
    ' gl_Position=vec4(aP.x*uF/uAsp,aP.y*uF,d*1.0017-.1001,d);',
    ' gl_PointSize=min(uPx*1.1/d,22.); vA=smoothstep(26.,12.,d)*smoothstep(.2,2.5,d); }'].join('\n');
  var FS2 = [
    'precision mediump float; varying float vA;',
    'void main(){ float d=length(gl_PointCoord-.5); gl_FragColor=vec4(vec3(.62,.6,.95)*smoothstep(.5,0.,d)*vA*.55,1.); }'].join('\n');

  function compile(vs, fs) {
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  function buf(data) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b; }
  function upload(i, data) { shapes[i] = { pos: buf(data.pos), col: buf(data.col) }; }

  var logoData = null;
  function sampleLogo(done) {
    var img = new Image();
    img.onload = function () {
      try {
        var S = 200, cv = document.createElement('canvas'); cv.width = cv.height = S;
        var cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, S, S);
        var px = cx.getImageData(0, 0, S, S).data, list = [];
        for (var i = 0; i < S * S; i++) if (px[i * 4 + 3] > 150) list.push(i);
        if (list.length < 200) return;
        logoData = shape(function (t, o) {
          var id = list[Math.floor(rnd() * list.length)], x = id % S, y = Math.floor(id / S);
          o[0] = ((x + rnd()) / S - 0.5) * 2.6; o[1] = -((y + rnd()) / S - 0.5) * 2.6; o[2] = (rnd() - 0.5) * 0.1;
          var r = px[id * 4] / 255, g = px[id * 4 + 1] / 255, b = px[id * 4 + 2] / 255;
          return [0.25 + r * 0.9, 0.22 + g * 0.9, 0.3 + b * 0.9];
        }, BRIGHT[6]);
        done();
      } catch (e) { /* queda la forma provisoria */ }
    };
    img.src = '../assets/logo-zx.webp';
  }

  var shapeData = null;
  function init() {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' }) || canvas.getContext('experimental-webgl');
    if (!gl) return false;
    try { prog1 = compile(VS, FS); prog2 = compile(VS2, FS2); } catch (e) { gl = null; return false; }
    ['aFrom', 'aTo', 'aCF', 'aCT', 'aSeed'].forEach(function (n) { loc1[n] = gl.getAttribLocation(prog1, n); });
    ['uT', 'uTime', 'uAsp', 'uF', 'uDist', 'uPx', 'uRY', 'uRX', 'uMo', 'uOff'].forEach(function (n) { loc1[n] = gl.getUniformLocation(prog1, n); });
    loc2.aP = gl.getAttribLocation(prog2, 'aP');
    ['uZ', 'uAsp', 'uF', 'uPx'].forEach(function (n) { loc2[n] = gl.getUniformLocation(prog2, n); });
    if (!shapeData) {
      shapeData = gens.map(function (g, i) { return shape(g, BRIGHT[i]); });
      var seeds = new Float32Array(N * 4); for (var i = 0; i < N * 4; i++) seeds[i] = rnd();
      var dust = new Float32Array(DUST * 3);
      for (i = 0; i < DUST; i++) { var a = rnd() * 6.2832, r = 1.3 + Math.pow(rnd(), 0.7) * 7; dust[i * 3] = Math.cos(a) * r; dust[i * 3 + 1] = Math.sin(a) * r; dust[i * 3 + 2] = rnd(); }
      shapeData.seeds = seeds; shapeData.dust = dust;
    }
    if (logoData) shapeData[6] = logoData;
    shapeData.forEach(function (d, i) { upload(i, d); });
    seedBuf = buf(shapeData.seeds); dustBuf = buf(shapeData.dust);
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.clearColor(0.027, 0.024, 0.051, 1);
    resize();
    return true;
  }

  var W = 1, H = 1;
  function resize() {
    if (!gl) return;
    var dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.75 : 2);
    var w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (w === W && h === H) return;
    W = canvas.width = w; H = canvas.height = h; gl.viewport(0, 0, W, H);
  }

  var px = 0, py = 0, tx = 0, ty = 0;
  if (!coarse) window.addEventListener('pointermove', function (e) { tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5; }, { passive: true });

  var FOV = 1.7320508; // 1/tan(30°)
  function attr(loc, b, size, type, norm) { gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, type, norm, 0, 0); }

  function draw(p, time) {
    var asp = W / H, mobile = small();
    var base = Math.max(4.7, 3.5 / asp);
    var s = Math.min(LAST - 1, Math.floor(p)), f = p - s, t = smooth(0.28, 0.72, f);
    var dist = base - 1.35 * Math.sin(Math.PI * t) * MOTION;
    var halfH = base / FOV, halfW = halfH * asp;
    function off(i) {
      if (i === 0) return [0, mobile ? halfH * 0.1 : 0];
      if (i === LAST) return [0, halfH * (mobile ? 0.36 : 0.45)];
      return mobile ? [0, halfH * 0.44] : [halfW * 0.42, 0];
    }
    var a = off(s), b = off(s + 1);
    px += (tx - px) * 0.06; py += (ty - py) * 0.06;
    function wgt(i) { return s === i ? 1 - t : (s + 1 === i ? t : 0); }
    var calm = wgt(LAST) * 0.65 + wgt(3) * 0.35; // logo y teléfono giran menos
    var ry = Math.sin(time * 0.22) * 0.55 * (1 - calm) * (reduced ? 0.3 : 1) + px * 0.5;
    var rx = Math.sin(time * 0.17) * 0.1 + py * 0.3;

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(prog2);
    attr(loc2.aP, dustBuf, 3, gl.FLOAT, false);
    gl.uniform1f(loc2.uZ, p * 0.42 * (reduced ? 0.2 : 1) + time * 0.006);
    gl.uniform1f(loc2.uAsp, asp); gl.uniform1f(loc2.uF, FOV); gl.uniform1f(loc2.uPx, H * 0.012);
    gl.drawArrays(gl.POINTS, 0, DUST);

    gl.useProgram(prog1);
    attr(loc1.aFrom, shapes[s].pos, 3, gl.FLOAT, false);
    attr(loc1.aTo, shapes[s + 1].pos, 3, gl.FLOAT, false);
    attr(loc1.aCF, shapes[s].col, 3, gl.UNSIGNED_BYTE, true);
    attr(loc1.aCT, shapes[s + 1].col, 3, gl.UNSIGNED_BYTE, true);
    attr(loc1.aSeed, seedBuf, 4, gl.FLOAT, false);
    gl.uniform1f(loc1.uT, t); gl.uniform1f(loc1.uTime, time); gl.uniform1f(loc1.uAsp, asp); gl.uniform1f(loc1.uF, FOV);
    gl.uniform1f(loc1.uDist, dist); gl.uniform1f(loc1.uPx, H * 0.0105); gl.uniform1f(loc1.uRY, ry); gl.uniform1f(loc1.uRX, rx);
    gl.uniform1f(loc1.uMo, MOTION);
    gl.uniform2f(loc1.uOff, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
    gl.drawArrays(gl.POINTS, 0, N);
  }

  var hasGL = init();
  sampleLogo(function () { if (gl && !lost) { shapeData[6] = logoData; upload(6, logoData); } });
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; });
  canvas.addEventListener('webglcontextrestored', function () { lost = false; W = H = 1; hasGL = init(); });

  var last = performance.now(), clock = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (document.hidden) return;
    clock += dt;
    prog += (target - prog) * (1 - Math.exp(-dt * (reduced ? 30 : 7)));
    if (Math.abs(target - prog) < 0.0004) prog = target;
    panels(prog);
    if (hasGL && !lost) draw(prog, clock);
  }
  requestAnimationFrame(frame);

  window.__zx = { get p() { return prog; }, gl: function () { return !!hasGL; }, n: N };
})();
