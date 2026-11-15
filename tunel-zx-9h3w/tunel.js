/* Zenix AR · Túnel ZX — recorrido por scroll (código y recursos propios) */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  body.classList.add('loading');

  var isMobile = window.matchMedia('(max-width: 820px)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Titulares palabra por palabra ---------- */
  document.querySelectorAll('.split').forEach(function (el) {
    var i = 0, out = document.createDocumentFragment();
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { out.appendChild(document.createTextNode(' ')); return; }
          var s = document.createElement('span');
          s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = part;
          out.appendChild(s);
        });
      } else {
        var w = document.createElement('span');
        w.className = 'w'; w.style.setProperty('--i', i++);
        w.appendChild(node.cloneNode(true));
        out.appendChild(w);
      }
    });
    el.textContent = '';
    el.appendChild(out);
  });

  /* ---------- WebGL ---------- */
  var canvas = document.getElementById('gl');
  var gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' }) ||
         canvas.getContext('experimental-webgl');
  } catch (e) { gl = null; }

  var OCT = isMobile ? 3 : 4;

  var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FRAG = [
    'precision mediump float;',
    'uniform vec2 uRes;uniform float uT;uniform float uZ;uniform vec2 uM;uniform float uP;',
    'float h(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}',
    'float n3(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.-2.*f);',
    ' return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),',
    '            mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}',
    'float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<' + OCT + ';i++){v+=a*n3(p);p*=2.03;a*=.5;}return v;}',
    'void main(){',
    ' vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
    ' uv-=uM*.07*(1.-uP*.6);',
    // leve curva del túnel que cambia con la profundidad
    ' uv+=vec2(sin(uZ*.35),cos(uZ*.27))*.04*(1.-uP);',
    ' float r=max(length(uv),.0015);float a=atan(uv.y,uv.x);',
    ' float d=.32/r;float zz=d+uZ;',
    ' vec3 q=vec3(cos(a)*1.7,sin(a)*1.7,zz*1.15);',
    ' float n=fbm(q*1.3);',
    ' vec3 col=mix(vec3(.035,.03,.055),vec3(.19,.17,.25),smoothstep(.25,.85,n));',
    // vetas violetas
    ' float v=1.-abs(n3(q*2.4+vec3(0.,0.,uT*.04))*2.-1.);v=pow(v,22.);',
    ' col+=vec3(.55,.36,.98)*v*(.4+.35*sin(zz*.8+uT*.6));',
    // juntas tipo anillo (sutiles)
    ' float ring=pow(.5+.5*cos(zz*3.14159),60.);col+=vec3(.42,.32,.75)*ring*.35;',
    // luz por cercanía a la pared y niebla al fondo
    ' col*=.35+.9*smoothstep(.02,.9,r);',
    ' col*=exp(-d*.075);',
    // luz de salida en el centro (crece al final del recorrido)
    ' float exitL=mix(.18,1.05,smoothstep(.62,1.,uP));',
    ' col+=vec3(.55,.38,1.)*exitL*exp(-r*r*mix(70.,5.,smoothstep(.62,1.,uP)));',
    ' col+=vec3(.9,.85,1.)*exitL*.18*exp(-r*r*mix(400.,40.,smoothstep(.62,1.,uP)));',
    // grano
    ' col+=(h(vec3(gl_FragCoord.xy,uT*60.))-.5)*.025;',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { throw new Error(gl.getShaderInfoLog(s)); }
    return s;
  }

  var prog, uRes, uT, uZ, uM, uP;
  if (gl) {
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      uRes = gl.getUniformLocation(prog, 'uRes'); uT = gl.getUniformLocation(prog, 'uT');
      uZ = gl.getUniformLocation(prog, 'uZ'); uM = gl.getUniformLocation(prog, 'uM'); uP = gl.getUniformLocation(prog, 'uP');
    } catch (e) {
      console.warn('[tunel] WebGL no disponible, uso alternativa:', e.message);
      gl = null;
    }
  }
  if (!gl) root.classList.add('no-gl');

  /* Resolución adaptativa: baja si el equipo no llega */
  var scale = isMobile ? 0.55 : 0.8;
  function resize() {
    if (!gl) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5) * scale;
    canvas.width = Math.max(2, Math.round(innerWidth * dpr));
    canvas.height = Math.max(2, Math.round(innerHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------- Scroll y puntero ---------- */
  var chapters = Array.prototype.slice.call(document.querySelectorAll('.ch'));
  var bar = document.getElementById('progress');
  var target = 0, prog01 = 0;
  var mx = 0, my = 0, smx = 0, smy = 0;

  function readScroll() {
    var max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    target = Math.min(1, Math.max(0, scrollY / max));
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  window.addEventListener('pointermove', function (e) {
    mx = (e.clientX / innerWidth - 0.5) * 2;
    my = -(e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  function scrollToP(p) {
    var max = document.documentElement.scrollHeight - innerHeight;
    window.scrollTo({ top: p * max, behavior: reduce ? 'auto' : 'smooth' });
  }
  document.getElementById('enter').addEventListener('click', function () { scrollToP(0.27); });

  var current = null;
  function updateChapters(p) {
    var next = null;
    for (var i = 0; i < chapters.length; i++) {
      var c = chapters[i];
      if (p >= +c.dataset.from && p < +c.dataset.to) { next = c; break; }
    }
    if (next !== current) {
      if (current) current.classList.remove('on');
      if (next) next.classList.add('on');
      current = next;
    }
  }

  /* ---------- Cursor anillo (solo escritorio) ---------- */
  var cursor = document.getElementById('cursor');
  var cursorLabel = document.getElementById('cursorLabel');
  var cx = -100, cy = -100, ccx = -100, ccy = -100;
  if (window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', function (e) { cx = e.clientX; cy = e.clientY; }, { passive: true });
    document.querySelectorAll('[data-cursor]').forEach(function (el) {
      el.addEventListener('pointerenter', function () { cursorLabel.textContent = el.dataset.cursor; cursor.classList.add('big'); });
      el.addEventListener('pointerleave', function () { cursor.classList.remove('big'); });
    });
  }

  /* ---------- Bucle ---------- */
  var t0 = performance.now(), last = t0, slowFrames = 0, sampled = 0;
  function frame(now) {
    var dt = Math.min(64, now - last); last = now;

    prog01 += (target - prog01) * (reduce ? 1 : Math.min(1, dt * 0.006));
    smx += (mx - smx) * 0.05; smy += (my - smy) * 0.05;

    updateChapters(prog01);
    bar.style.height = (prog01 * 100).toFixed(2) + '%';
    ccx += (cx - ccx) * 0.25; ccy += (cy - ccy) * 0.25;
    cursor.style.transform = 'translate3d(' + ccx + 'px,' + ccy + 'px,0)';

    if (gl) {
      // ajuste automático de calidad en los primeros segundos
      if (sampled < 90 && now - t0 > 1500) {
        sampled++;
        if (dt > 24) slowFrames++;
        if (sampled === 90 && slowFrames > 35 && scale > 0.4) { scale *= 0.72; resize(); sampled = 0; slowFrames = 0; t0 = now; }
      }
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uT, (now - t0) / 1000 + 10);
      gl.uniform1f(uZ, prog01 * 24 + (reduce ? 0 : (now / 1000) * 0.08));
      gl.uniform2f(uM, smx, smy);
      gl.uniform1f(uP, prog01);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      root.style.setProperty('--p', prog01.toFixed(4));
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Preloader 0 → 100 ---------- */
  var loader = document.getElementById('loader');
  var num = document.getElementById('loaderNum');
  var lbar = document.getElementById('loaderBar');
  var ready = false, shown = 0, started = performance.now();
  var logo = new Image();
  logo.onload = logo.onerror = function () { ready = true; };
  logo.src = '../assets/logo-zx.webp';
  setTimeout(function () { ready = true; }, 4000);

  function tickLoader(now) {
    var cap = ready ? 100 : 88;
    var goal = Math.min(cap, ((now - started) / 1400) * 100);
    shown += (goal - shown) * 0.18;
    if (ready && goal >= 100 && shown > 99.4) shown = 100;
    var v = Math.round(shown);
    num.textContent = v;
    lbar.style.width = v + '%';
    if (v >= 100) {
      loader.classList.add('done');
      body.classList.remove('loading');
      readScroll();
      requestAnimationFrame(frame);
      return;
    }
    requestAnimationFrame(tickLoader);
  }
  if (reduce) { ready = true; shown = 99.9; }
  requestAnimationFrame(tickLoader);
})();
