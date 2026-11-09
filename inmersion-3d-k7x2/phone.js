/* Zenix AR · Opción 1: teléfono 3D con las apps reales, guiado por scroll. */
(function () {
  'use strict';
  var F = window.Fly, LAST = F.LAST, MO = F.reduced ? 0.2 : 1;
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
    ph = mobile ? vh * 0.4 : Math.min(vh * 0.68, vw * 0.36 * 1.975);
    pw = ph / 1.975;
    phone.style.setProperty('--pw', pw.toFixed(1) + 'px');
    var X = mobile ? 0 : vw * 0.22, Y = mobile ? -vh * 0.165 : vh * 0.02, tilt = mobile ? 15 : 22;
    keys = [{ x: X, y: Y, s: mobile ? 1 : 1.05, rx: 10, ry: -tilt - 10, rz: -5 }];
    for (var i = 1; i < LAST; i++) keys.push({ x: X, y: Y, s: 1, rx: 4, ry: 360 * i + (i % 2 ? -tilt : tilt * 0.85), rz: 0 });
    keys.push({ x: 0, y: 0, s: Math.max(vw / (pw * 0.936), vh / (pw * 1.91)) * 1.1, rx: 0, ry: 360 * LAST, rz: 0 });
    aura.style.width = aura.style.height = (ph * 1.7).toFixed(0) + 'px';
    aura.style.margin = (-ph * 0.85).toFixed(0) + 'px 0 0 ' + (-ph * 0.85).toFixed(0) + 'px';
  }
  measure(); F.onResize(function () { measure(); resizeGL(); });

  var HUES = [0, 0, 150, 60, 200, 300, 0], hueNow = -1, scrNow = -1;
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------- fondo WebGL: polvo en profundidad + anillo de partículas detrás del teléfono ---------- */
  var canvas = document.getElementById('gl'), gl = null, pDust, pRing, lD = {}, lR = {}, bDust, bRing;
  var DUST = F.coarse ? 600 : 1200, RING = F.coarse ? 2600 : 5200, W = 1, H = 1, FOV = 1.7320508, lost = false;
  var COLS = [[.56, .38, 1], [.3, .85, .6], [.35, .6, 1], [.9, .45, .8], [.13, .8, .95], [.62, .45, 1], [.56, .38, 1]];
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

  F.start(function (p, time) {
    var s = Math.min(LAST - 1, Math.floor(p)), f = p - s, t = F.smooth(0.24, 0.76, f);
    var a = keys[s], b = keys[s + 1], dive = s + 1 === LAST ? t : 0;
    var tr = dive ? F.smooth(0, 0.58, t) : t, tz = dive ? F.smooth(0.42, 1, t) : t; // en el cierre: primero gira, después entra a la pantalla
    var sc = Math.exp(lerp(Math.log(a.s), Math.log(b.s), tz));
    var x = lerp(a.x, b.x, t), y = lerp(a.y, b.y, t) + Math.sin(time * 0.9) * 6 * MO * (1 - dive);
    var lift = Math.sin(Math.PI * t) * (1 - dive);               // en cada giro el teléfono se acerca un poco
    var ry = lerp(a.ry, b.ry, tr) + (Math.sin(time * 0.6) * 4 * MO + F.ptr.x * 22) * (1 - dive);
    var rx = lerp(a.rx, b.rx, t) + (Math.cos(time * 0.5) * 2 * MO - F.ptr.y * 14) * (1 - dive) + lift * 6;
    var rz = lerp(a.rz, b.rz, t);
    phone.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + (lift * 90 * MO).toFixed(1) + 'px) rotateZ(' + rz.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
    glare.style.backgroundPosition = (((ry % 360) + 360) % 360 / 360 * 140 - 20).toFixed(1) + '% 0';

    var idx = tr < 0.5 ? s : s + 1;
    if (idx !== scrNow) { scrNow = idx; screens.forEach(function (el, i) { el.classList.toggle('on', i === idx); }); }
    if (HUES[idx] !== hueNow) { hueNow = HUES[idx]; aura.style.filter = 'hue-rotate(' + hueNow + 'deg)'; }
    aura.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    aura.style.opacity = (0.75 * (1 - dive)).toFixed(3);

    if (hasGL && !lost) {
      var ca = COLS[s], cb = COLS[s + 1];
      drawGL(p, time, x, y, dive, [lerp(ca[0], cb[0], t), lerp(ca[1], cb[1], t), lerp(ca[2], cb[2], t)]);
    }
  });
})();
