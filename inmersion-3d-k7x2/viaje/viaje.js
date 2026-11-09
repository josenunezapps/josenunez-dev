/* Zenix AR · Opción 2: viaje de cámara por un mundo 3D (WebGL puro). Cada capítulo es una estación del recorrido. */
(function () {
  'use strict';
  var F = window.Fly, LAST = F.LAST, MO = F.reduced ? 0 : 1;
  var canvas = document.getElementById('gl');
  var STEP = 46;                                   // unidades de mundo entre estaciones
  function pathX(z) { return Math.sin(z * 0.045) * 2.4; }

  /* ---------- azar determinista: el mundo es siempre el mismo ---------- */
  var seed = 20261109;
  function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }

  /* ---------- geometría: cajas con normal, color y emisión ---------- */
  var verts = [];
  var FACES = [[0, 0, 1, [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [0, 0, -1, [1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]],
    [1, 0, 0, [1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], [-1, 0, 0, [-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]],
    [0, 1, 0, [-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], [0, -1, 0, [-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]];
  function box(cx, y0, cz, sx, sy, sz, col, em, r) {
    var c = Math.cos(r || 0), s = Math.sin(r || 0);
    for (var f = 0; f < 6; f++) {
      var F6 = FACES[f], nx = F6[0] * c + F6[2] * s, nz = -F6[0] * s + F6[2] * c, q = [3, 4, 5, 3, 5, 6];
      for (var k = 0; k < 6; k++) {
        var v = F6[q[k]], lx = v[0] * sx / 2, lz = v[2] * sz / 2;
        verts.push(cx + lx * c + lz * s, y0 + (v[1] + 1) * sy / 2, cz - lx * s + lz * c, nx, F6[1], nz, col[0], col[1], col[2], em || 0);
      }
    }
  }
  function graphite() { var g = 0.2 + rnd() * 0.14; return [g * 0.94, g * 0.92, g * 1.16]; }
  var WHITE = [0.95, 0.92, 1.0], VIO = [0.62, 0.42, 1.0], CY = [0.25, 0.82, 0.98], BLUE = [0.38, 0.55, 1.0];
  function gate(z, w, h, th, col, em) {            // marco: dos postes y un dintel
    var x = pathX(z);
    box(x - w / 2, 0, z, th, h, th, col, em); box(x + w / 2, 0, z, th, h, th, col, em); box(x, h, z, w + th, th, th, col, em);
  }

  var END_Z = 6 - LAST * STEP;                     // posición final de la cámara
  var MONO_Z = END_Z - 19;                         // monolito del logo
  (function build() {
    // piso y línea guía
    box(0, -1, END_Z / 2, 240, 1, -END_Z + 260, [0.085, 0.078, 0.13], 0);
    for (var z = 4; z > MONO_Z + 3; z -= 2.2) box(pathX(z - 0.8), 0, z - 0.8, 0.035, 0.02, 2.2, [0.42, 0.3, 0.78], 0.85, Math.atan(0.045 * 2.4 * Math.cos((z - 0.8) * 0.045)));

    // monolitos laterales a lo largo de todo el recorrido
    for (z = 14; z > MONO_Z - 70; z -= 5.5) {
      for (var side = -1; side <= 1; side += 2) {
        var st = Math.round((6 - z) / STEP), wide = (st === 0 || st >= LAST) ? 12 : 8.5;
        var lat = wide + rnd() * 9, h = 5 + Math.pow(rnd(), 1.6) * 20, w = 2 + rnd() * 3.4, d = 2 + rnd() * 3.4;
        var zz = z + rnd() * 3, x = pathX(zz) + side * (lat + w / 2), col = graphite();
        if (zz < MONO_Z + 6 && Math.abs(x - pathX(MONO_Z)) < 12) continue;
        box(x, 0, zz, w, h, d, col, 0);
        if (rnd() < 0.42) {
          var ec = rnd() < 0.5 ? WHITE : (rnd() < 0.5 ? VIO : CY), hh = h * (0.35 + rnd() * 0.5);
          box(x - side * (w / 2 + 0.03), h * 0.08, zz + (rnd() - 0.5) * d * 0.5, 0.05, hh, 0.07, ec, 0.9);
          if (rnd() < 0.5) box(x + (rnd() - 0.5) * w * 0.5, h * 0.08, zz + d / 2 + 0.03, 0.07, hh * 0.8, 0.05, ec, 0.9);
        }
        if (rnd() < 0.4) box(x + side * (4 + rnd() * 8), 0, zz - 2, 3 + rnd() * 4, 12 + rnd() * 26, 3 + rnd() * 4, graphite(), 0); // segunda fila, más alta
      }
    }
    // 0 · Inicio: gran portal de entrada
    gate(-27, 6.4, 9.5, 0.3, WHITE, 1);
    // 1 · Soluciones: columnata
    for (z = -52; z >= -86; z -= 4.2) for (side = -1; side <= 1; side += 2) {
      box(pathX(z) + side * 3.9, 0, z, 0.75, 9.5, 0.75, graphite(), 0);
      box(pathX(z) + side * 3.9, 9.5, z, 1.15, 0.22, 1.15, side < 0 ? VIO : CY, 0.9);
    }
    // 2 · Nosotros: costillas que ondulan
    var n = 0;
    for (z = -98; z >= -130; z -= 3.3, n++) { var hi = 6.2 + Math.sin(n * 0.7) * 1.3; gate(z, 8.6 + Math.cos(n * 0.7) * 1.1, hi, 0.34, n % 3 === 1 ? CY : graphite(), n % 3 === 1 ? 0.85 : 0); }
    // 4 · Proyectos: terrazas de bloques
    for (var i = 0; i < 6; i++) for (side = -1; side <= 1; side += 2) {
      z = -188 - i * 4.6; var s = 2.6 + rnd() * 0.8;
      for (var k = 0; k <= i % 4; k++) box(pathX(z) + side * (4.6 + k * 0.7), k * s, z, s, s - 0.08, s, graphite(), 0, k * 0.12 * side);
      box(pathX(z) + side * (4.6 + (i % 4) * 0.7), (i % 4 + 1) * s + 0.02, z, s * 0.5, 0.1, s * 0.5, i % 2 ? VIO : WHITE, 1);
    }
    // 5 · Cómo trabajamos: tres portales, uno por paso
    gate(-237, 5.2, 6.2, 0.26, VIO, 1); gate(-247, 6.6, 7.6, 0.28, BLUE, 1); gate(-257, 8.2, 9.2, 0.3, CY, 1);
    // 6 · Cierre: monolito del logo
    box(pathX(MONO_Z), 0, MONO_Z, 9, 13, 1.2, [0.2, 0.18, 0.3], 0);
    box(pathX(MONO_Z), 0, MONO_Z + 0.62, 9.2, 0.08, 0.08, VIO, 1); box(pathX(MONO_Z) - 4.6, 0, MONO_Z + 0.62, 0.08, 13, 0.08, VIO, 1); box(pathX(MONO_Z) + 4.6, 0, MONO_Z + 0.62, 0.08, 13, 0.08, CY, 1); box(pathX(MONO_Z), 13, MONO_Z + 0.62, 9.2, 0.08, 0.08, CY, 1);
  })();

  // 3 · Apps: cuatro pantallas flotantes con capturas reales
  var quads = [];
  function quad(cx, cy, cz, w, h, r, src, alpha) {
    var c = Math.cos(r), s = Math.sin(r), hx = w / 2 * c, hz = -w / 2 * s;
    var d = [cx - hx, cy - h / 2, cz - hz, 0, 1, cx + hx, cy - h / 2, cz + hz, 1, 1, cx + hx, cy + h / 2, cz + hz, 1, 0,
      cx - hx, cy - h / 2, cz - hz, 0, 1, cx + hx, cy + h / 2, cz + hz, 1, 0, cx - hx, cy + h / 2, cz - hz, 0, 0];
    quads.push({ data: new Float32Array(d), src: src, alpha: alpha, tex: null, buf: null });
  }
  ['caja', 'cotiza', 'club', 'escaner'].forEach(function (name, i) {
    var z = -143 - i * 6.2, side = i % 2 ? 1 : -1, r = -side * 0.5, x = pathX(z) + side * 2.7, w = 1.95, h = w * 1194 / 585;
    box(x, 1.1, z, w + 0.14, h + 0.14, 0.16, [0.12, 0.11, 0.2], 0, r);
    box(x, 0, z, 0.05, 1.1, 0.05, VIO, 1);
    quad(x + Math.sin(r) * 0.1, 1.17 + h / 2, z + Math.cos(r) * 0.1, w, h, r, '../../assets/preview-' + name + '.webp', false);
  });
  quad(pathX(MONO_Z), 7.4, MONO_Z + 0.7, 6.4, 6.4, 0, '../../assets/logo-zx.webp', true);

  /* ---------- matrices ---------- */
  function persp(fovy, asp, n, f) { var t = 1 / Math.tan(fovy / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]; }
  function lookAt(e, c) {
    var zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    var xx = zz, xz = -zx, xl = Math.hypot(xx, xz); xx /= xl; xz /= xl;               // x = up × z, con up = (0,1,0)
    var yx = zy * xz, yy = zz * xx - zx * xz, yz = -zy * xx;
    return [xx, yx, zx, 0, 0, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1];
  }
  function mul(a, b) { var o = new Float32Array(16); for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; }

  /* ---------- WebGL ---------- */
  var gl = null, pBox, pQuad, pSky, pDust, L = {}, bBox, bSky, bDust, nBox = 0, DUST = F.coarse ? 500 : 1000, W = 1, H = 1, lost = false;
  var SKY = 'uniform float uH,uHor; vec3 sky(float y){ float g=exp(-pow((y-uHor)/.24,2.)); return mix(vec3(.022,.02,.045),vec3(.15,.1,.3),g)+vec3(.03,.08,.12)*exp(-pow((y-uHor)/.06,2.)); }';
  function compile(vs, fs) {
    function sh(t, src) { var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  function locs(p, names) { var o = {}; names.forEach(function (n) { o[n] = n.charAt(0) === 'a' ? gl.getAttribLocation(p, n) : gl.getUniformLocation(p, n); }); return o; }
  function loadTex(q) {
    var img = new Image();
    img.onload = function () {
      if (!gl || lost) return;
      q.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, q.tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    img.src = q.src;
  }
  function init() {
    gl = canvas.getContext('webgl', { antialias: true, alpha: false }) || canvas.getContext('experimental-webgl');
    if (!gl) return false;
    try {
      pBox = compile('attribute vec3 aP,aN,aC; attribute float aE; uniform mat4 uVP; uniform vec2 uShift; varying vec3 vN,vC,vW; varying float vE;' +
        'void main(){ vW=aP; vN=aN; vC=aC; vE=aE; gl_Position=uVP*vec4(aP,1.); gl_Position.xy+=uShift*gl_Position.w; }',
        'precision mediump float; varying vec3 vN,vC,vW; varying float vE; uniform vec3 uEye;' + SKY +
        'void main(){ vec3 n=normalize(vN); vec3 V=uEye-vW; float d=length(V); V/=d;' +
        ' float key=max(dot(n,normalize(vec3(-.5,.8,.45))),0.); float head=max(dot(n,V),0.)/(1.+.01*d*d);' +
        ' vec3 c=vC*(.2+.62*key+1.1*head)*(.55+.45*smoothstep(-1.,7.,vW.y)); c=mix(c,vC*1.55,vE);' +
        ' float f=1.-exp(-pow(d*.021,2.)); f*=mix(1.,.5,vE);' +
        ' gl_FragColor=vec4(mix(c,sky(gl_FragCoord.y/uH),f),1.); }');
      pQuad = compile('attribute vec3 aP; attribute vec2 aUV; uniform mat4 uVP; uniform vec2 uShift; varying vec2 vUV; varying vec3 vW;' +
        'void main(){ vW=aP; vUV=aUV; gl_Position=uVP*vec4(aP,1.); gl_Position.xy+=uShift*gl_Position.w; }',
        'precision mediump float; varying vec2 vUV; varying vec3 vW; uniform sampler2D uTex; uniform vec3 uEye; uniform float uGain;' + SKY +
        'void main(){ vec4 t=texture2D(uTex,vUV); float d=length(uEye-vW); float f=(1.-exp(-pow(d*.021,2.)))*.55;' +
        ' gl_FragColor=vec4(mix(t.rgb*uGain,sky(gl_FragCoord.y/uH)*t.a,f),t.a); }');
      pSky = compile('attribute vec2 aP; varying float vY; void main(){ vY=aP.y*.5+.5; gl_Position=vec4(aP,.9999,1.); }',
        'precision mediump float; varying float vY;' + SKY + 'void main(){ gl_FragColor=vec4(sky(vY),1.); }');
      pDust = compile('attribute vec3 aP; uniform float uZ,uAsp,uF,uPx; uniform vec2 uShift; varying float vA;' +
        'void main(){ float d=(1.-fract(aP.z+uZ))*30.+.3; gl_Position=vec4(aP.x*uF/uAsp,aP.y*uF,d*1.0007-.2001,d); gl_Position.xy+=uShift*d;' +
        ' gl_PointSize=min(uPx/d,14.); vA=smoothstep(30.,14.,d)*smoothstep(.3,3.,d); }',
        'precision mediump float; varying float vA; void main(){ float d=length(gl_PointCoord-.5); gl_FragColor=vec4(vec3(.7,.66,1.)*smoothstep(.5,0.,d)*vA*.4,1.); }');
    } catch (e) { if (window.console) console.error(e); gl = null; return false; }
    L.box = locs(pBox, ['aP', 'aN', 'aC', 'aE', 'uVP', 'uShift', 'uEye', 'uH', 'uHor']);
    L.quad = locs(pQuad, ['aP', 'aUV', 'uVP', 'uShift', 'uEye', 'uH', 'uHor', 'uTex', 'uGain']);
    L.sky = locs(pSky, ['aP', 'uH', 'uHor']);
    L.dust = locs(pDust, ['aP', 'uZ', 'uAsp', 'uF', 'uPx', 'uShift']);
    var data = new Float32Array(verts); nBox = data.length / 10;
    bBox = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bBox); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    bSky = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bSky); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var d = new Float32Array(DUST * 3);
    for (var i = 0; i < DUST; i++) { var a = rnd() * 6.2832, r = 1 + Math.pow(rnd(), 0.7) * 9; d[i * 3] = Math.cos(a) * r; d[i * 3 + 1] = Math.sin(a) * r * 0.7 + 1; d[i * 3 + 2] = rnd(); }
    bDust = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bDust); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
    quads.forEach(function (q) { q.tex = null; q.buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, q.buf); gl.bufferData(gl.ARRAY_BUFFER, q.data, gl.STATIC_DRAW); loadTex(q); });
    gl.clearColor(0.022, 0.02, 0.045, 1); gl.depthFunc(gl.LEQUAL);
    W = H = 1; resize();
    return true;
  }
  function resize() {
    if (!gl) return;
    var dpr = Math.min(window.devicePixelRatio || 1, F.coarse ? 1.5 : 2);
    var w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (w === W && h === H) return;
    W = canvas.width = w; H = canvas.height = h; gl.viewport(0, 0, W, H);
  }
  var hasGL = init();
  F.onResize(resize);
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; });
  canvas.addEventListener('webglcontextrestored', function () { lost = false; hasGL = init(); });

  function lerp(a, b, t) { return a + (b - a) * t; }
  function attr(loc, size, stride, off) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, off); }
  function off() { for (var i = 0; i < 4; i++) gl.disableVertexAttribArray(i); }

  function draw(p, time) {
    var asp = W / H, mobile = F.small();
    var s = Math.min(LAST - 1, Math.floor(p)), t = F.smooth(0.2, 0.8, p - s);
    function shift(i) { return i === 0 ? [0, mobile ? 0.12 : 0] : i === LAST ? [0, mobile ? 0.4 : 0.5] : mobile ? [0, 0.4] : [0.34, 0.04]; }
    var a = shift(s), b = shift(s + 1), sx = lerp(a[0], b[0], t), sy = lerp(a[1], b[1], t);
    var endW = s + 1 === LAST ? t : 0;

    var z = 6 - p * STEP, ex = pathX(z), ey = 1.75 + Math.sin(time * 0.8) * 0.05 * MO;
    var az = z - 12, tx = lerp(pathX(az), pathX(MONO_Z), endW) + F.ptr.x * 3.5, ty = lerp(2.3, 5.4, endW) - F.ptr.y * 2.2;
    var eye = [ex, ey, z];
    var fov = asp < 1 ? 1.25 : 1.02, f0 = 1 / Math.tan(fov / 2);
    var VP = mul(persp(fov, asp, 0.1, 400), lookAt(eye, [tx, ty, az]));
    var hor = 0.5 + sy / 2 - (ty - ey) / 12 * f0 * 0.5;   // el resplandor del horizonte acompaña la mirada

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST); off();
    gl.useProgram(pSky); gl.bindBuffer(gl.ARRAY_BUFFER, bSky); attr(L.sky.aP, 2, 0, 0);
    gl.uniform1f(L.sky.uH, H); gl.uniform1f(L.sky.uHor, hor); gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.DEPTH_TEST); gl.depthMask(true); off();
    gl.useProgram(pBox); gl.bindBuffer(gl.ARRAY_BUFFER, bBox);
    attr(L.box.aP, 3, 40, 0); attr(L.box.aN, 3, 40, 12); attr(L.box.aC, 3, 40, 24); attr(L.box.aE, 1, 40, 36);
    gl.uniformMatrix4fv(L.box.uVP, false, VP); gl.uniform2f(L.box.uShift, sx, sy); gl.uniform3f(L.box.uEye, ex, ey, z);
    gl.uniform1f(L.box.uH, H); gl.uniform1f(L.box.uHor, hor);
    gl.drawArrays(gl.TRIANGLES, 0, nBox);

    off(); gl.useProgram(pQuad); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniformMatrix4fv(L.quad.uVP, false, VP); gl.uniform2f(L.quad.uShift, sx, sy); gl.uniform3f(L.quad.uEye, ex, ey, z);
    gl.uniform1f(L.quad.uH, H); gl.uniform1f(L.quad.uHor, hor); gl.uniform1i(L.quad.uTex, 0); gl.activeTexture(gl.TEXTURE0);
    for (var i = 0; i < quads.length; i++) {
      var q = quads[i]; if (!q.tex) continue;
      gl.bindBuffer(gl.ARRAY_BUFFER, q.buf); attr(L.quad.aP, 3, 20, 0); attr(L.quad.aUV, 2, 20, 12);
      gl.bindTexture(gl.TEXTURE_2D, q.tex); gl.uniform1f(L.quad.uGain, q.alpha ? 1.25 : 0.92);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    off(); gl.useProgram(pDust); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false); gl.disable(gl.DEPTH_TEST);
    gl.bindBuffer(gl.ARRAY_BUFFER, bDust); attr(L.dust.aP, 3, 0, 0);
    gl.uniform1f(L.dust.uZ, -z / 30 + time * 0.004 * MO); gl.uniform1f(L.dust.uAsp, asp); gl.uniform1f(L.dust.uF, f0); gl.uniform1f(L.dust.uPx, H * 0.011);
    gl.uniform2f(L.dust.uShift, sx, sy);
    gl.drawArrays(gl.POINTS, 0, DUST);
    gl.depthMask(true);
  }

  F.start(function (p, time) { if (hasGL && !lost) draw(p, time); });
})();
