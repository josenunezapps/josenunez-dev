/* Zenix AR · núcleo de las demos de inmersión: scroll → progreso → capítulos que entran y salen en profundidad. */
(function () {
  'use strict';
  var root = document.documentElement;
  var chapters = Array.prototype.slice.call(document.querySelectorAll('.ch'));
  var spacer = document.getElementById('spacer');
  var barEl = document.getElementById('bar');
  var dotsEl = document.getElementById('dots');
  var cnum = document.getElementById('cnum');
  var cname = document.getElementById('cname');
  var LAST = chapters.length - 1;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;

  var seg = 1, vw = 0, target = 0, prog = 0, resizers = [];
  function layout(force) {
    if (!force && window.innerWidth === vw) return; // en celular la barra del navegador cambia el alto: no recalcular
    vw = window.innerWidth;
    seg = Math.round(window.innerHeight * 1.25);
    spacer.style.height = (seg * LAST + window.innerHeight) + 'px';
  }
  function readScroll() { target = Math.max(0, Math.min(LAST, window.scrollY / seg)); }
  function goTo(i) { target = prog = Math.max(0, Math.min(LAST, i)); window.scrollTo({ top: target * seg, behavior: 'instant' }); panels(prog); }
  function smooth(a, b, x) { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }

  chapters.forEach(function (ch, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Ir a ' + ch.dataset.name); b.dataset.label = ch.dataset.name; b.title = ch.dataset.name;
    b.addEventListener('click', function () { goTo(i); });
    dotsEl.appendChild(b);
  });
  var dots = Array.prototype.slice.call(dotsEl.children);
  document.querySelector('.logo').addEventListener('click', function (e) { e.preventDefault(); goTo(0); });

  root.classList.add('fly');
  layout(true); readScroll(); prog = target;
  function onResize(force) { layout(force); readScroll(); resizers.forEach(function (f) { f(); }); }
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', function () { onResize(false); });
  window.addEventListener('orientationchange', function () { setTimeout(function () { onResize(true); }, 250); });

  var shown = -1;
  function panels(p) {
    for (var i = 0; i <= LAST; i++) {
      var ch = chapters[i], d = p - i, ad = Math.abs(d);
      if (ad > 0.55) { if (ch.style.visibility !== 'hidden') { ch.style.visibility = 'hidden'; ch.style.opacity = 0; ch.inert = true; ch.classList.remove('live'); } continue; }
      var o = 1 - smooth(0.2, 0.46, ad);
      var s = 1;
      ch.style.visibility = o > 0.001 ? 'visible' : 'hidden';
      ch.style.opacity = o.toFixed(3);
      ch.style.transform = 'translate3d(0,' + (reduced ? 0 : (-d * 20).toFixed(1)) + 'px,0) scale(' + s.toFixed(4) + ')';
      ch.style.filter = 'none'; ch.inert = ad >= 0.3;
      ch.classList.toggle('live', ad < 0.3);
    }
    var cur = Math.max(0, Math.min(LAST, Math.round(p)));
    if (cur !== shown) {
      shown = cur;
      dots.forEach(function (b, i) { b.classList.toggle('on', i === cur); if (i === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      cnum.textContent = (cur < 9 ? '0' : '') + (cur + 1);
      cname.textContent = chapters[cur].dataset.name;
    }
    barEl.style.transform = 'scaleX(' + (p / LAST).toFixed(4) + ')';
  }

  var ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!coarse) window.addEventListener('pointermove', function (e) { ptr.tx = e.clientX / window.innerWidth - 0.5; ptr.ty = e.clientY / window.innerHeight - 0.5; }, { passive: true });

  window.Fly = {
    goTo: goTo, LAST: LAST, reduced: reduced, coarse: coarse, smooth: smooth, ptr: ptr,
    small: function () { return window.innerWidth <= 760; },
    onResize: function (f) { resizers.push(f); },
    get p() { return prog; },
    start: function (onFrame) {
      var last = performance.now(), clock = 0;
      function frame(now) {
        requestAnimationFrame(frame);
        var dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (document.hidden) return;
        clock += dt;
        prog += (target - prog) * (1 - Math.exp(-dt * (reduced ? 30 : 7)));
        if (Math.abs(target - prog) < 0.0004) prog = target;
        ptr.x += (ptr.tx - ptr.x) * 0.06; ptr.y += (ptr.ty - ptr.y) * 0.06;
        panels(prog);
        onFrame(prog, clock, dt);
      }
      requestAnimationFrame(frame);
    }
  };
})();
