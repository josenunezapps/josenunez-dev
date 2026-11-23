// Conecta la página y el panel con la API (Cloudflare D1).
// Reemplaza al localStorage solo para turnos, bloqueos y ajustes.
(function () {
  'use strict';
  var API = '/Sebastiancolorista/api/';
  var KEYS = { 'sg-demo-bookings-v1': 'bookings', 'sg-demo-blocks-v1': 'blocks', 'sg-demo-settings-v1': 'settings' };
  var ADMIN = /\/admin(\/|$)/.test(location.pathname);
  var cache = { bookings: [], blocks: [], settings: {} };
  var locked = false, online = false;

  function req(method, path, body) {
    var x = new XMLHttpRequest();
    try {
      x.open(method, API + path, false);
      x.setRequestHeader('Content-Type', 'application/json');
      x.send(body === undefined ? null : JSON.stringify(body));
    } catch (e) { return { status: 0, data: { error: 'Sin conexión. Probá de nuevo.' } }; }
    var d = {};
    try { d = JSON.parse(x.responseText || '{}'); } catch (e) {}
    return { status: x.status, data: d };
  }

  function load() {
    var r = req('GET', ADMIN ? 'admin/state' : 'public');
    if (r.status === 200) {
      cache.bookings = r.data.bookings || [];
      cache.blocks = r.data.blocks || [];
      cache.settings = r.data.settings || {};
      online = true;
    } else if (r.status === 401) {
      locked = true;
    }
  }
  load();

  var SGS = {
    lastError: '',
    getItem: function (k) {
      var n = KEYS[k];
      if (!n) { try { return localStorage.getItem(k); } catch (e) { return null; } }
      return JSON.stringify(cache[n]);
    },
    setItem: function (k, v) {
      var n = KEYS[k];
      if (!n) { try { localStorage.setItem(k, v); } catch (e) {} return; }
      var next = JSON.parse(v), r;
      SGS.lastError = '';
      if (ADMIN) {
        var payload = next;
        if (n === 'bookings') {
          // enviar solo los turnos que cambiaron
          var before = {};
          cache.bookings.forEach(function (b) { before[b.id] = JSON.stringify(b); });
          payload = next.filter(function (b) { return before[b.id] !== JSON.stringify(b); });
          if (!payload.length) { cache[n] = next; return; }
        }
        r = req('PUT', 'admin/' + n, payload);
        if (r.status !== 200) { SGS.lastError = r.data.error || 'No se pudo guardar'; throw new Error(SGS.lastError); }
        cache[n] = next;
        return;
      }
      if (n !== 'bookings') throw new Error('No permitido');
      var prev = {};
      cache.bookings.forEach(function (b) { prev[b.id] = b; });
      next.forEach(function (b) {
        var old = prev[b.id];
        if (!old) {
          r = req('POST', 'bookings', b);
          if (r.status !== 200) { SGS.lastError = r.data.error || 'No se pudo guardar el turno'; throw new Error(SGS.lastError); }
        } else if (old.status !== 'cancelled' && b.status === 'cancelled') {
          r = req('POST', 'cancel', { id: b.id, phone: b.phone });
          if (r.status !== 200) { SGS.lastError = r.data.error || 'No se pudo cancelar'; throw new Error(SGS.lastError); }
        }
      });
      cache.bookings = next;
    },
    removeItem: function (k) {
      var n = KEYS[k];
      if (!n) { try { localStorage.removeItem(k); } catch (e) {} return; }
      SGS.setItem(k, n === 'settings' ? '{}' : '[]');
    },
    loadMine: function (phone) {
      var r = req('POST', 'mine', { phone: phone });
      if (r.status !== 200) return;
      var map = {};
      cache.bookings.forEach(function (b) { map[b.id] = b; });
      (r.data.bookings || []).forEach(function (b) { map[b.id] = b; });
      cache.bookings = Object.keys(map).map(function (id) { return map[id]; });
    },
    isOnline: function () { return online; }
  };
  window.SGS = SGS;

  if (!ADMIN) return;

  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.querySelector('.topin');
    if (locked) {
      var o = document.createElement('div');
      o.id = 'sg-login';
      o.innerHTML = '<form><p>PANEL DE TURNOS</p><h1>Sebastián González</h1><label for="sg-pass">Contraseña</label>' +
        '<input id="sg-pass" type="password" autocomplete="current-password" required autofocus>' +
        '<button type="submit">INGRESAR</button><small id="sg-err"></small></form>';
      document.body.appendChild(o);
      document.body.style.overflow = 'hidden';
      o.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        var r = req('POST', 'login', { password: document.getElementById('sg-pass').value });
        if (r.status === 200) location.reload();
        else document.getElementById('sg-err').textContent = r.data.error || 'No se pudo ingresar';
      });
    } else if (bar) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'back'; b.textContent = 'Cerrar sesión';
      b.style.cssText = 'margin-left:10px;cursor:pointer;background:none;font:inherit';
      b.addEventListener('click', function () { req('POST', 'logout', {}); location.reload(); });
      bar.appendChild(b);
    }
  });
})();
