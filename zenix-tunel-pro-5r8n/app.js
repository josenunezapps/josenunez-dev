/* Zenix AR · Túnel Pro — código y recursos propios */
(function () {
  'use strict';

  var doc = document.documentElement, body = document.body;
  var mqMobile = window.matchMedia('(max-width: 980px)');
  var isMobile = mqMobile.matches || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  var fine = window.matchMedia('(pointer: fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vh = innerHeight, vw = innerWidth;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }

  /* =========================================================
     1. Texto: palabras, scramble, manifiesto
     ========================================================= */
  document.querySelectorAll('.split').forEach(function (el) {
    var i = 0, frag = document.createDocumentFragment();
    function addWords(text, wrapTag) {
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span');
        w.className = 'w'; w.style.setProperty('--i', i++);
        if (wrapTag) { var inner = document.createElement(wrapTag); inner.textContent = part; w.appendChild(inner); }
        else w.textContent = part;
        frag.appendChild(w);
      });
    }
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) addWords(n.textContent);
      else addWords(n.textContent, n.tagName.toLowerCase());
    });
    el.textContent = ''; el.appendChild(frag);
  });

  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·<>_';
  function scramble(el) {
    if (el._done) return; el._done = true;
    var final = el.dataset.text || el.textContent, start = performance.now(), dur = 900;
    if (reduce) { el.textContent = final; return; }
    (function step(now) {
      var k = clamp((now - start) / dur, 0, 1), out = '';
      for (var i = 0; i < final.length; i++) {
        var ch = final[i];
        if (ch === ' ' || i / final.length < k) out += ch;
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (k < 1) requestAnimationFrame(step); else el.textContent = final;
    })(start);
  }

  var mf = document.getElementById('manifesto');
  var ACCENT = /^(resolver|herramienta|adecuada)/i;
  (function () {
    var words = mf.textContent.trim().split(/\s+/);
    mf.textContent = '';
    words.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'mw' + (ACCENT.test(w) ? ' acc' : '');
      s.textContent = w;
      mf.appendChild(s);
      if (i < words.length - 1) mf.appendChild(document.createTextNode(' '));
    });
  })();
  var mfWords = mf.querySelectorAll('.mw');

  /* Revelado al entrar en pantalla */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      if (el.classList.contains('scramble')) scramble(el);
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  /* =========================================================
     2. Fondo: túnel 3D con raymarching (WebGL)
     ========================================================= */
  var canvas = document.getElementById('gl');
  var gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  } catch (e) { gl = null; }

  var STEPS = isMobile ? 44 : 72;

  var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 uRes;uniform float uT;uniform float uZ;uniform float uP;uniform vec2 uM;',
    '#define PI 3.14159265',
    'float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}',
    'float n3(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.-2.*f);',
    ' return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),',
    '  mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}',
    'vec2 path(float z){return vec2(sin(z*.19)*1.6+sin(z*.071)*1.3,cos(z*.15)*1.1+sin(z*.053)*.6);}',
    // Superficie: paneles de grafito con juntas talladas
    'float grooveAt(vec3 p,out float seg){',
    ' vec2 c=p.xy-path(p.z);float a=atan(c.y,c.x);',
    ' seg=a*(7./PI);',
    ' float gx=abs(fract(seg)-.5);float gz=abs(fract(p.z*.32)-.5);',
    ' return smoothstep(.43,.5,max(gx,gz));}',
    'float map(vec3 p){',
    ' vec2 c=p.xy-path(p.z);float r=length(c);float seg;',
    ' float g=grooveAt(p,seg);',
    ' float R=2.15+g*.09+(n3(p*1.6)-.5)*.14;',
    ' return (R-r)*.72;}',
    'vec3 nrm(vec3 p){vec2 e=vec2(.012,-.012);',
    ' return normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx));}',
    'void main(){',
    ' vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
    ' float z=uZ;',
    ' vec3 ro=vec3(path(z),z);',
    ' vec3 ta=vec3(path(z+3.2),z+3.2);',
    ' ta.xy+=uM*vec2(.9,.55);',
    ' vec3 fw=normalize(ta-ro);',
    ' float roll=sin(z*.11)*.28-uM.x*.08;',
    ' vec3 up=vec3(sin(roll),cos(roll),0.);',
    ' vec3 cu=normalize(cross(fw,up));vec3 cv=cross(cu,fw);',
    ' vec3 rd=normalize(uv.x*cu+uv.y*cv+1.5*fw);',
    ' float t=.05;',
    ' for(int i=0;i<' + STEPS + ';i++){float d=map(ro+rd*t);if(d<.0015*t+.001||t>38.)break;t+=d;}',
    ' vec3 p=ro+rd*t;vec3 n=nrm(p);',
    ' float seg;float g=grooveAt(p,seg);',
    ' float pid=hash(vec3(floor(seg),floor(p.z*.32),3.));',
    ' vec3 base=vec3(.075,.068,.095)*(.75+.5*pid);',
    // Luz principal que acompaña a la cámara
    ' vec3 lp=ro+fw*1.2+cv*.4;vec3 L=lp-p;float ld=length(L);L/=ld;',
    ' float att=1./(1.+ld*ld*.05);',
    ' float dif=max(dot(n,L),0.);',
    ' float spe=pow(max(dot(n,normalize(L-rd)),0.),48.);',
    ' vec3 col=base*(.06+dif*1.25)*att*vec3(.9,.86,1.)+spe*att*vec3(.75,.65,1.)*(.35+.65*(1.-g));',
    // Juntas emisivas: pulsos de datos que viajan por el túnel
    ' float flow=pow(.5+.5*sin(p.z*.85-uT*2.2+floor(seg)*1.7),8.);',
    ' float pulse=pow(.5+.5*sin(p.z*.12-uT*.9),3.);',
    ' col+=g*vec3(.5,.32,1.)*(.12+1.5*flow*(.35+.65*pulse));',
    // Borde violeta (fresnel)
    ' col+=pow(1.-max(dot(n,-rd),0.),5.)*vec3(.35,.22,.75)*.35;',
    // Niebla: oscuridad al fondo que se vuelve luz en la salida
    ' float ex=smoothstep(.8,1.,uP);',
    ' vec3 fogc=mix(vec3(.018,.013,.04),vec3(.62,.48,1.)*1.15,ex);',
    ' col=mix(col,fogc,1.-exp(-t*mix(.075,.16,ex)));',
    ' col+=vec3(.5,.35,1.)*.10*exp(-dot(uv,uv)*6.)*(1.-ex);',
    // Tono y grano
    ' col=col/(1.+col*.9);col=pow(col,vec3(.9));',
    ' col+=(hash(vec3(gl_FragCoord.xy,floor(uT*24.)))-.5)*.02;',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  var U = {};
  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  if (gl) {
    try {
      var prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ['uRes', 'uT', 'uZ', 'uP', 'uM'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    } catch (e) {
      console.warn('[zenix] Túnel 3D desactivado, uso la versión liviana:', e.message);
      gl = null;
    }
  }
  if (!gl) doc.classList.add('no-gl');

  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); gl = null; doc.classList.add('no-gl'); });

  /* Resolución adaptativa: arranca prudente y se ajusta según los FPS reales */
  var quality = isMobile ? 0.5 : 0.62;
  var QMIN = 0.3, QMAX = isMobile ? 0.7 : 0.85;
  function resize() {
    vw = innerWidth; vh = innerHeight;
    if (!gl) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.max(2, Math.round(vw * dpr * quality));
    canvas.height = Math.max(2, Math.round(vh * dpr * quality));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  var rT;
  window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(function () { resize(); measure(); }, 120); });
  resize();

  /* =========================================================
     3. Scroll, puntero y elementos ligados al scroll
     ========================================================= */
  var target = 0, prog01 = 0, maxScroll = 1;
  var pmx = 0, pmy = 0, smx = 0, smy = 0;
  var lastY = 0;
  var nav = document.getElementById('nav');
  var railNum = document.getElementById('railNum'), railBar = document.getElementById('railBar');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));

  var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
  var shots = document.querySelectorAll('.ph-screen img');
  var dots = document.querySelectorAll('.ph-dots i');
  var phone = document.getElementById('phone');
  var shopsSec = document.getElementById('comercios');
  var procEl = document.getElementById('proc'), procLine = document.getElementById('procLine');
  var exitSec = document.querySelector('.exit'), exitLogo = document.getElementById('exitLogo');
  var linkSecs = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });

  var R = {};
  function measure() {
    maxScroll = Math.max(1, doc.scrollHeight - vh);
    function box(el) { var r = el.getBoundingClientRect(); return { top: r.top + scrollY, h: r.height }; }
    R.mf = box(mf.parentNode); R.shops = box(shopsSec); R.proc = box(procEl); R.exit = box(exitSec);
    R.steps = steps.map(box); R.links = linkSecs.map(box);
    R.tags = steps.map(function (s) { return box(s.querySelector('.st-tag')).top; });
    var st = document.querySelector('.phone-stick');
    R.stickH = st.offsetHeight + 58;
  }
  measure();
  window.addEventListener('load', measure);

  window.addEventListener('scroll', function () { target = clamp(scrollY / maxScroll, 0, 1); }, { passive: true });
  window.addEventListener('pointermove', function (e) {
    pmx = (e.clientX / vw - 0.5) * 2; pmy = -(e.clientY / vh - 0.5) * 2;
  }, { passive: true });

  var activeStep = -1;
  function setStep(i) {
    if (i === activeStep) return;
    activeStep = i;
    steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
    Array.prototype.forEach.call(shots, function (s, k) { s.classList.toggle('on', k === i); });
    Array.prototype.forEach.call(dots, function (d, k) { d.classList.toggle('on', k === i); });
  }

  function scrollLinked(y) {
    var mid = y + vh * 0.5;

    // Manifiesto: se ilumina palabra por palabra
    var mp = clamp((y + vh * 0.75 - R.mf.top) / (R.mf.h * 0.75), 0, 1);
    var lit = Math.round(mp * mfWords.length);
    for (var i = 0; i < mfWords.length; i++) mfWords[i].classList.toggle('lit', i < lit);

    // Comercios: paso activo + giro del teléfono
    var best = 0, bd = 1e9;
    if (mqMobile.matches) {
      // el paso activo es el primero cuyo texto ya se ve completo debajo del teléfono
      var line = y + R.stickH - 8; best = R.tags.length - 1;
      for (var q = 0; q < R.tags.length; q++) { if (R.tags[q] >= line) { best = q; break; } }
      if (best > 0 && R.tags[best] > y + vh * 0.8) best--;
    } else {
      R.steps.forEach(function (b, k) { var d = Math.abs(b.top + b.h * 0.45 - mid); if (d < bd) { bd = d; best = k; } });
    }
    setStep(best);
    var sp = clamp((y + vh - R.shops.top) / (R.shops.h + vh), 0, 1);
    phone.style.setProperty('--ry', (lerp(-18, 18, sp) + smx * 6).toFixed(2) + 'deg');
    phone.style.setProperty('--rx', (lerp(8, -6, sp) + smy * 4).toFixed(2) + 'deg');

    // Proceso: la línea se dibuja con el scroll
    var pp = clamp((y + vh * 0.8 - R.proc.top) / (R.proc.h * 0.9), 0, 1);
    if (mqMobile.matches) { procLine.style.height = (pp * 100) + '%'; procLine.style.width = '100%'; }
    else { procLine.style.width = (pp * 100) + '%'; procLine.style.height = '100%'; }

    // Salida: el logo aparece al final del túnel
    var ep = clamp((y + vh - R.exit.top) / (R.exit.h * 0.8), 0, 1);
    var e2 = smooth(0.25, 1, ep);
    exitLogo.style.setProperty('--ls', (0.45 + 0.55 * e2).toFixed(3));
    exitLogo.style.setProperty('--lo', e2.toFixed(3));
    exitLogo.style.setProperty('--ly', (smx * 18 + (1 - e2) * 40).toFixed(2) + 'deg');
    exitLogo.style.setProperty('--lx', (smy * -12).toFixed(2) + 'deg');

    // Nav: activa la sección, se esconde al bajar
    var on = -1;
    R.links.forEach(function (b, k) { if (mid >= b.top && mid < b.top + b.h) on = k; });
    navLinks.forEach(function (a, k) { a.classList.toggle('on', k === on); });
    nav.classList.toggle('scrolled', y > 40);
    if (Math.abs(y - lastY) > 6) { nav.classList.toggle('hide', y > lastY && y > vh * 0.6); lastY = y; }
  }

  /* =========================================================
     4. Cursor, botones magnéticos, tarjetas con luz y giro
     ========================================================= */
  var cursor = document.getElementById('cursor'), cLabel = document.getElementById('cursorLabel');
  var cx = -100, cy = -100, ccx = -100, ccy = -100;
  if (fine && !reduce) {
    window.addEventListener('pointermove', function (e) { cx = e.clientX; cy = e.clientY; }, { passive: true });
    document.querySelectorAll('[data-cursor]').forEach(function (el) {
      el.addEventListener('pointerenter', function () { cLabel.textContent = el.dataset.cursor; cursor.classList.add('big'); });
      el.addEventListener('pointerleave', function () { cursor.classList.remove('big'); });
    });
    document.querySelectorAll('a:not([data-cursor]),button:not([data-cursor])').forEach(function (el) {
      el.addEventListener('pointerenter', function () { cursor.classList.add('link'); });
      el.addEventListener('pointerleave', function () { cursor.classList.remove('link'); });
    });
    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (x * 0.28).toFixed(1) + 'px,' + (y * 0.36).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform .6s cubic-bezier(.2,.7,.15,1)';
        el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 600);
      });
    });
    document.querySelectorAll('.glass').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', (x * 100) + '%'); el.style.setProperty('--my', (y * 100) + '%');
        if (el.classList.contains('tilt') && el.classList.contains('in'))
          el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * 7).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * 9).toFixed(2) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  document.getElementById('toTop').addEventListener('click', function (e) {
    e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* =========================================================
     5. Bucle principal
     ========================================================= */
  var tStart = performance.now(), last = tStart;
  var fpsAcc = 0, fpsN = 0, fpsT = tStart;
  var running = false;

  function draw(now) {
    if (!gl) return;
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uT, (now - tStart) / 1000);
    gl.uniform1f(U.uZ, 3 + prog01 * 62 + (reduce ? 0 : (now - tStart) / 1000 * 0.12));
    gl.uniform1f(U.uP, prog01);
    gl.uniform2f(U.uM, smx, smy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    var dt = Math.min(80, now - last); last = now;
    var k = reduce ? 1 : 1 - Math.pow(0.0015, dt / 1000);   // suavizado independiente de los FPS
    prog01 = lerp(prog01, target, k);
    smx = lerp(smx, fine ? pmx : 0, 0.05); smy = lerp(smy, fine ? pmy : 0, 0.05);

    scrollLinked(scrollY);
    var pct = Math.round(prog01 * 100);
    railNum.textContent = (pct < 10 ? '0' : '') + pct;
    railBar.style.height = (prog01 * 100) + '%';

    if (fine) { ccx = lerp(ccx, cx, 0.22); ccy = lerp(ccy, cy, 0.22); cursor.style.transform = 'translate3d(' + ccx.toFixed(1) + 'px,' + ccy.toFixed(1) + 'px,0)'; }

    if (gl) {
      draw(now);
      // Calidad automática: si cuesta llegar a ~45 FPS baja la resolución; si sobra, la sube
      fpsAcc += dt; fpsN++;
      if (now - fpsT > 1200 && fpsN > 20) {
        var avg = fpsAcc / fpsN;
        if (avg > 22 && quality > QMIN) { quality = Math.max(QMIN, quality * 0.82); resize(); }
        else if (avg < 14 && quality < QMAX) { quality = Math.min(QMAX, quality * 1.08); resize(); }
        fpsAcc = 0; fpsN = 0; fpsT = now;
      }
    } else {
      doc.style.setProperty('--p', prog01.toFixed(4));
    }
    requestAnimationFrame(frame);
  }

  /* =========================================================
     6. Preloader 000 → 100 (espera recursos reales)
     ========================================================= */
  var loader = document.getElementById('loader');
  var lNum = document.getElementById('loaderNum'), lBar = document.getElementById('loaderBar');
  var tasks = 0, doneTasks = 0, shown = 0, t0 = performance.now();

  function track(promise) { tasks++; promise.then(function () { doneTasks++; }, function () { doneTasks++; }); }
  ['../assets/logo-zx.webp', '../assets/preview-caja.webp', '../assets/icon-web.svg'].forEach(function (src) {
    track(new Promise(function (res) { var im = new Image(); im.onload = im.onerror = res; im.src = src; }));
  });
  if (document.fonts && document.fonts.ready) track(document.fonts.ready);
  if (gl) track(new Promise(function (res) { draw(performance.now()); gl.finish(); res(); }));
  setTimeout(function () { doneTasks = tasks; }, 5000);

  function loaderTick(now) {
    var real = tasks ? doneTasks / tasks : 1;
    var timeCap = clamp((now - t0) / 1300, 0, 1);
    var goal = Math.min(real, timeCap) * 100;
    shown = lerp(shown, goal, 0.16);
    if (goal >= 100 && shown > 99.5) shown = 100;
    var v = Math.round(shown);
    lNum.textContent = (v < 10 ? '00' : v < 100 ? '0' : '') + v;
    lBar.style.width = v + '%';
    if (v >= 100) return start();
    requestAnimationFrame(loaderTick);
  }

  function start() {
    if (running) return; running = true;
    loader.classList.add('done');
    body.classList.remove('is-loading');
    measure();
    target = clamp(scrollY / maxScroll, 0, 1); prog01 = target;
    document.querySelectorAll('.split, .reveal, .scramble').forEach(function (el) { io.observe(el); });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(loaderTick);
})();
