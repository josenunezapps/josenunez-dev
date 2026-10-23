// Nexa (antes Zenix Agent) — mismo asistente de zenix.com.ar (misma API /api/chat y /api/lead, misma sesión),
// adaptado al diseño nuevo y con salida directa a WhatsApp.
(function(){
  if (window.__zenixChatLoaded) return;
  window.__zenixChatLoaded = true;

  const STORAGE_KEY = 'zenix-agent-session-v2';
  const SITE = 'zenix-next';
  const WA = 'https://wa.me/5492901471353';
  const CONTACT_FORM = '/contacto.html';
  // avatar de Nexa: esfera abstracta hecha con HTML/CSS (sin imágenes ni librerías)
  const ORB = '<span class="nexa-orb" aria-hidden="true"><span class="nexa-halo"></span><span class="nexa-core"><span class="nexa-flow"></span><span class="nexa-glint"></span></span><span class="nexa-wave"></span></span>';
  const QUICK_DEFAULT = '<button type="button" data-message="Necesito una página web">Web</button><button type="button" data-message="Quiero una app o un sistema">App o sistema</button><button type="button" data-message="Quiero automatizar una tarea de mi negocio">Automatizar</button><button type="button" data-message="¿Cuánto cuesta un proyecto?">Precios</button>';

  const emptyProfile = () => ({
    business: '',
    industry: '',
    city: '',
    projectType: '',
    need: '',
    features: [],
    budget: '',
    timeline: '',
    urgency: '',
    classification: 'Consulta',
    interest: 'Bajo',
    summary: '',
    nextAction: '',
    teamNotified: false
  });

  const root = document.createElement('div');
  root.className = 'zenix-chat';
  root.innerHTML = `
    <button class="zenix-chat-launcher" type="button" aria-label="Abrir Nexa, asistente digital de Zenix AR" aria-expanded="false">
      <span class="zenix-chat-launcher-ic" aria-hidden="true">
        ${ORB}
        <svg class="ic-chat" viewBox="0 0 24 24"><path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v6a3.5 3.5 0 0 1-3.5 3.5H11l-4.7 3.4.9-3.7A3.5 3.5 0 0 1 5 12.5v-6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8.5 9.5h7M8.5 12.5h4.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        <svg class="ic-close" viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>
      </span>
      <span class="zenix-chat-launcher-txt">Nexa</span>
      <span class="zenix-chat-launcher-dot" aria-hidden="true"></span>
    </button>

    <section class="zenix-chat-panel" aria-label="Nexa, asistente digital de Zenix AR" aria-hidden="true">
      <header class="zenix-chat-head">
        <div class="zenix-chat-brand">
          ${ORB}
          <div><strong>Nexa</strong><span class="nexa-status"><i></i><em class="nexa-st-idle">Asistente digital de Zenix AR</em><em class="nexa-st-active">Respondiendo…</em></span></div>
        </div>
        <div class="zenix-chat-head-actions">
          <a class="zenix-chat-wa" href="${WA}?text=${encodeURIComponent('Hola Zenix! Vengo de la web y quiero hacer una consulta.')}" target="_blank" rel="noopener" aria-label="Seguir por WhatsApp" title="Seguir por WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5l1.2-4.3A8.5 8.5 0 1 1 8 19.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1.2-1 .9c-1-.4-2.2-1.6-2.6-2.6l.9-1-1.2-2z" fill="currentColor"/></svg></a>
          <button class="zenix-chat-close" type="button" aria-label="Cerrar chat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg></button>
        </div>
      </header>

      <div class="zenix-chat-messages" role="log" aria-live="polite"></div>

      <button class="zenix-agent-card" type="button" aria-expanded="false" hidden>
        <div class="zenix-agent-card-top">
          <span class="zenix-agent-card-label">Actividad del agente</span>
          <span class="zenix-agent-card-status">Consulta</span>
        </div>
        <div class="zenix-agent-card-brief">Analizando la conversación…</div>
        <div class="zenix-agent-card-detail">
          <div class="zenix-agent-steps"></div>
          <div class="zenix-agent-summary" hidden></div>
        </div>
      </button>

      <div class="zenix-chat-quick" aria-label="Opciones rápidas">${QUICK_DEFAULT}</div>

      <form class="zenix-chat-form">
        <input class="zenix-chat-input" type="text" maxlength="1000" autocomplete="off" placeholder="Escribí tu consulta…" aria-label="Mensaje">
        <button class="zenix-chat-send" type="submit" aria-label="Enviar mensaje">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 5 16 7-16 7 2.7-7L4 5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6.7 12H20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </form>

      <div class="zenix-chat-foot">Asistente con IA. Para avanzar, te deriva al equipo de Zenix AR.</div>
    </section>`;

  document.body.appendChild(root);

  const launcher = root.querySelector('.zenix-chat-launcher');
  const panel = root.querySelector('.zenix-chat-panel');
  const close = root.querySelector('.zenix-chat-close');
  const messages = root.querySelector('.zenix-chat-messages');
  const form = root.querySelector('.zenix-chat-form');
  const input = root.querySelector('.zenix-chat-input');
  const send = root.querySelector('.zenix-chat-send');
  const quick = root.querySelector('.zenix-chat-quick');
  const agentCard = root.querySelector('.zenix-agent-card');
  const agentStatus = root.querySelector('.zenix-agent-card-status');
  const agentBrief = root.querySelector('.zenix-agent-card-brief');
  const agentSteps = root.querySelector('.zenix-agent-steps');
  const agentSummary = root.querySelector('.zenix-agent-summary');

  const defaultQuickHtml = QUICK_DEFAULT;

  let history = [];
  let profile = emptyProfile();
  let actions = [];
  let busy = false;
  let greeted = false;
  let renderedStoredHistory = false;
  let leadState = null;

  function loadSession(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.history)) {
        history = saved.history
          .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
          .slice(-18);
      }
      if (saved.profile && typeof saved.profile === 'object') {
        profile = { ...emptyProfile(), ...saved.profile, teamNotified: Boolean(saved.profile.teamNotified) };
        if (!Array.isArray(profile.features)) profile.features = [];
      }
      if (Array.isArray(saved.actions)) actions = saved.actions.slice(-10);
    } catch (_) {}
  }

  function saveSession(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        history: history.slice(-18),
        profile: {
          business: profile.business,
          industry: profile.industry,
          city: profile.city,
          projectType: profile.projectType,
          need: profile.need,
          features: profile.features,
          budget: profile.budget,
          timeline: profile.timeline,
          urgency: profile.urgency,
          classification: profile.classification,
          interest: profile.interest,
          summary: profile.summary,
          nextAction: profile.nextAction,
          teamNotified: profile.teamNotified
        },
        actions: actions.slice(-10)
      }));
    } catch (_) {}
  }

  function setOpen(open){
    root.classList.toggle('is-open', open);
    launcher.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));

    if (open) {
      if (!renderedStoredHistory && history.length) {
        history.forEach(item => addMessage(item.role, item.content, false));
        renderedStoredHistory = true;
        greeted = true;
      }

      if (!greeted) {
        addMessage('assistant', 'Hola, soy Nexa, la asistente digital de Zenix AR. Te ayudo con webs, apps, automatizaciones o extensiones. ¿Qué querés resolver?');
        greeted = true;
      }

      renderAgentCard();
      setTimeout(() => input.focus(), 120);
    }
  }

  function addMessage(role, text, scroll = true){
    const item = document.createElement('div');
    item.className = 'zenix-chat-message ' + (role === 'user' ? 'is-user' : 'is-assistant');

    const bubble = document.createElement('div');
    bubble.className = 'zenix-chat-bubble';
    bubble.textContent = text;

    item.appendChild(bubble);
    messages.appendChild(item);

    if (scroll) messages.scrollTop = messages.scrollHeight;
    if (role !== 'user' && scroll) speak(text);
  }

  // ---------- estado de Nexa ----------
  // ACTIVE mientras hay un indicador de escritura en pantalla (pedido a /api/chat o /api/lead en curso)
  // y un instante más mientras aparece su respuesta; IDLE el resto del tiempo.
  // se mira el indicador de escritura que ya usa el chat, así no hay contadores que se desincronicen
  let speakTimer = 0;
  function syncNexa(){ root.classList.toggle('nexa-active', !!messages.querySelector('.zenix-chat-typing-row') || speakTimer > 0); }
  function stopTyping(row){ if (row) row.remove(); syncNexa(); }
  function speak(text){
    clearTimeout(speakTimer);
    speakTimer = setTimeout(() => { speakTimer = 0; syncNexa(); }, Math.min(2600, 700 + String(text || '').length * 14));
    syncNexa();
  }

  function addTyping(){
    const item = document.createElement('div');
    item.className = 'zenix-chat-message is-assistant zenix-chat-typing-row';
    item.innerHTML = '<div class="zenix-chat-bubble zenix-chat-typing"><span></span><span></span><span></span></div>';
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    syncNexa();
    return item;
  }

  function setBusy(value){
    busy = value;
    input.disabled = value;
    send.disabled = value;
  }

  function restoreQuick(){
    quick.innerHTML = defaultQuickHtml;
  }

  // enlace a WhatsApp con un resumen corto de lo que se habló
  function waLink(){
    const bits = [profile.projectType, profile.need].filter(Boolean).join(': ');
    const text = 'Hola Zenix! Vengo del asistente de la web' + (bits ? '. Quiero consultar por ' + bits.slice(0, 220) : ' y quiero hacer una consulta') + '.';
    return WA + '?text=' + encodeURIComponent(text);
  }

  // cuando el visitante quiere avanzar: WhatsApp, dejar sus datos o el formulario
  function showHandoffOptions(){
    quick.innerHTML = '';
    const wa = document.createElement('a');
    wa.className = 'zenix-chat-opt is-wa'; wa.href = waLink(); wa.target = '_blank'; wa.rel = 'noopener'; wa.textContent = 'Seguir por WhatsApp';
    const lead = document.createElement('button');
    lead.type = 'button'; lead.className = 'zenix-chat-opt'; lead.dataset.action = 'lead'; lead.textContent = 'Dejar mis datos';
    const formLink = document.createElement('a');
    formLink.className = 'zenix-chat-opt'; formLink.href = CONTACT_FORM; formLink.textContent = 'Formulario';
    quick.append(wa, lead, formLink);
  }

  function showConsentButtons(){
    quick.innerHTML = '<button type="button" data-consent="yes">Confirmar envío</button><button type="button" data-consent="no">Cancelar</button>';
    if (leadState && leadState.failed) { const wa = document.createElement('a'); wa.className = 'zenix-chat-opt is-wa'; wa.href = waLink(); wa.target = '_blank'; wa.rel = 'noopener'; wa.textContent = 'WhatsApp'; quick.appendChild(wa); }
  }

  function isEmail(value){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isPhone(value){
    const digits = value.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 18;
  }

  function mergeProfile(value){
    if (!value || typeof value !== 'object') return;

    const next = { ...profile };
    const dataKeys = ['business','industry','city','projectType','need','budget','timeline','urgency','summary','nextAction'];
    dataKeys.forEach(key => {
      if (typeof value[key] === 'string' && value[key].trim()) next[key] = value[key].trim();
    });

    if (typeof value.classification === 'string' && value.classification.trim()) {
      const rank = { 'Consulta': 0, 'Lead': 1, 'Lead calificado': 2, 'Lead caliente': 3 };
      const current = rank[next.classification] ?? 0;
      const incoming = rank[value.classification.trim()] ?? 0;
      if (incoming >= current) next.classification = value.classification.trim();
    }

    if (typeof value.interest === 'string' && value.interest.trim()) {
      const rank = { 'Bajo': 0, 'Medio': 1, 'Alto': 2 };
      const current = rank[next.interest] ?? 0;
      const incoming = rank[value.interest.trim()] ?? 0;
      if (incoming >= current) next.interest = value.interest.trim();
    }

    if (Array.isArray(value.features) && value.features.length) {
      next.features = [...new Set([...(next.features || []), ...value.features.map(item => String(item || '').trim()).filter(Boolean)])].slice(0, 10);
    }

    profile = next;
  }

  function uniqueActions(list){
    return [...new Set((list || []).filter(Boolean))];
  }

  function buildVisibleActions(){
    const list = [...actions];
    if (profile.need || profile.projectType) list.push('Necesidad detectada');
    if (profile.industry) list.push('Rubro identificado');
    if (profile.city) list.push('Ciudad detectada');
    if (profile.features && profile.features.length) list.push('Funciones detectadas');
    if (profile.classification === 'Lead calificado' || profile.classification === 'Lead caliente') list.push('Lead calificado');
    if (profile.summary) list.push('Resumen generado');
    if (profile.teamNotified) list.push('Equipo notificado');
    return uniqueActions(list);
  }

  function renderAgentCard(){
    const visibleActions = buildVisibleActions();
    const hasData = visibleActions.length || profile.projectType || profile.need || profile.summary || profile.classification !== 'Consulta';

    agentCard.hidden = !hasData;
    if (!hasData) return;

    agentStatus.textContent = profile.classification || 'Consulta';

    const mainBits = [];
    if (profile.projectType) mainBits.push(profile.projectType);
    if (profile.industry) mainBits.push(profile.industry);
    if (profile.city) mainBits.push(profile.city);

    agentBrief.textContent = mainBits.length
      ? mainBits.join(' · ')
      : (profile.need || profile.nextAction || 'Ordenando la información del proyecto');

    agentSteps.innerHTML = '';
    visibleActions.forEach(action => {
      const chip = document.createElement('span');
      chip.textContent = '✓ ' + action;
      agentSteps.appendChild(chip);
    });

    if (profile.summary) {
      agentSummary.hidden = false;
      agentSummary.textContent = profile.summary;
    } else {
      agentSummary.hidden = true;
      agentSummary.textContent = '';
    }
  }

  function resetLeadCapture(){
    leadState = null;
    input.placeholder = 'Escribí tu consulta…';
    input.disabled = false;
    send.disabled = false;
    restoreQuick();
    input.focus();
  }

  function startLeadCapture(){
    if (leadState) return;
    leadState = { step: 'name', name: '', contact: '' };
    quick.innerHTML = '';
    input.placeholder = 'Tu nombre';
    addMessage('assistant', 'Perfecto. Para que nuestro equipo pueda ponerse en contacto con vos, primero decime tu nombre.');
    input.focus();
  }

  function cancelLead(){
    addMessage('assistant', 'Perfecto, no envié ningún dato. Podemos seguir hablando por acá.');
    resetLeadCapture();
  }

  async function submitLead(){
    if (!leadState || leadState.step !== 'confirm' || busy) return;

    const payload = {
      name: leadState.name,
      contact: leadState.contact,
      history: history.slice(-16),
      profile
    };

    setBusy(true);
    quick.innerHTML = '';
    const typing = addTyping();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 22000);

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));
      stopTyping(typing);

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || 'No pude enviar tus datos.');
      }

      profile.teamNotified = true;
      profile.classification = 'Lead caliente';
      profile.interest = 'Alto';
      profile.nextAction = 'Equipo notificado';
      if (data.summary && !profile.summary) profile.summary = data.summary;
      actions = uniqueActions([...actions, 'Contacto solicitado', 'Equipo notificado']);

      addMessage('assistant', 'Listo. Ya envié tus datos y la ficha del proyecto al equipo de Zenix AR. Van a recibir también el resumen de esta conversación para poder continuar desde ahí. Si preferís, también podés escribir directo por WhatsApp.');
      history.push({ role: 'assistant', content: 'Los datos y la ficha del proyecto fueron enviados al equipo de Zenix AR.' });
      if (history.length > 18) history.splice(0, history.length - 18);

      saveSession();
      renderAgentCard();
      resetLeadCapture();
      showHandoffOptions();
    } catch (error) {
      stopTyping(typing);
      addMessage('assistant', error && error.name === 'AbortError'
        ? 'El envío tardó demasiado. Podés intentar otra vez o escribirnos por WhatsApp.'
        : 'No pude enviar tus datos en este momento. Podés reintentar o escribirnos por WhatsApp.');
      setBusy(false);
      leadState.step = 'confirm';
      leadState.failed = true;
      input.disabled = true;
      send.disabled = true;
      showConsentButtons();
    } finally {
      clearTimeout(timer);
    }
  }

  async function handleLeadInput(text){
    const clean = String(text || '').trim();
    if (!clean || !leadState || busy) return;

    if (leadState.step === 'name') {
      addMessage('user', clean);

      if (clean.length < 2) {
        addMessage('assistant', 'Decime tu nombre para poder identificar la consulta.');
        return;
      }

      leadState.name = clean.slice(0, 120);
      leadState.step = 'contact';
      input.value = '';
      input.placeholder = 'Email o WhatsApp';
      addMessage('assistant', 'Gracias. Ahora pasame un email o número de WhatsApp donde el equipo pueda contactarte.');
      return;
    }

    if (leadState.step === 'contact') {
      addMessage('user', clean);

      if (!isEmail(clean) && !isPhone(clean)) {
        addMessage('assistant', 'Necesito un email válido o un número de WhatsApp con código de área/país.');
        return;
      }

      leadState.contact = clean.slice(0, 254);
      leadState.step = 'confirm';
      input.value = '';
      input.placeholder = 'Confirmá el envío';
      input.disabled = true;
      send.disabled = true;

      addMessage(
        'assistant',
        'Voy a enviar al equipo de Zenix AR tu nombre, el contacto que me pasaste, la ficha del proyecto y un resumen de esta conversación únicamente para responder tu consulta. ¿Confirmás el envío?'
      );

      showConsentButtons();
    }
  }

  async function ask(text){
    const clean = String(text || '').trim();
    if (!clean || busy) return;

    if (leadState) {
      await handleLeadInput(clean);
      return;
    }

    addMessage('user', clean);
    history.push({ role: 'user', content: clean });
    if (history.length > 18) history.splice(0, history.length - 18);

    input.value = '';
    setBusy(true);
    saveSession();

    const typing = addTyping();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 24000);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          message: clean,
          history: history.slice(0, -1),
          profile,
          site: SITE
        }),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.reply) throw new Error(data.message || 'No pude responder en este momento.');

      stopTyping(typing);
      addMessage('assistant', data.reply);

      history.push({ role: 'assistant', content: data.reply });
      if (history.length > 18) history.splice(0, history.length - 18);

      mergeProfile(data.lead);
      if (Array.isArray(data.actions)) actions = uniqueActions([...actions, ...data.actions]);

      saveSession();
      renderAgentCard();

      if (data.handoff === true) {
        actions = uniqueActions([...actions, 'Contacto solicitado']);
        saveSession();
        renderAgentCard();
        addMessage('assistant', 'Podés seguir ahora mismo por WhatsApp, dejarme tus datos para que el equipo te escriba o usar el formulario de contacto.');
        showHandoffOptions();
      }
    } catch (error) {
      stopTyping(typing);
      addMessage('assistant', error && error.name === 'AbortError'
        ? 'Estoy tardando más de lo normal. Podés intentar otra vez o escribirnos por WhatsApp.'
        : 'No pude responder ahora. Escribinos por WhatsApp o desde el formulario y el equipo te responde directamente.');
      showHandoffOptions();
    } finally {
      clearTimeout(timer);

      if (!leadState || leadState.step !== 'confirm') setBusy(false);

      if (leadState && leadState.step === 'confirm') {
        input.disabled = true;
        send.disabled = true;
      } else {
        input.focus();
      }
    }
  }

  agentCard.addEventListener('click', () => {
    const expanded = agentCard.classList.toggle('is-expanded');
    agentCard.setAttribute('aria-expanded', String(expanded));
  });

  launcher.addEventListener('click', () => setOpen(!root.classList.contains('is-open')));
  close.addEventListener('click', () => setOpen(false));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    ask(input.value);
  });

  quick.addEventListener('click', (event) => {
    const consent = event.target.closest('button[data-consent]');
    if (consent) {
      if (consent.dataset.consent === 'yes') submitLead();
      else cancelLead();
      return;
    }

    if (event.target.closest('button[data-action="lead"]')) { startLeadCapture(); return; }

    const button = event.target.closest('button[data-message]');
    if (button) ask(button.dataset.message);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('is-open')) setOpen(false);
  });

  // el temporizador de inactividad (chat-expiry.js) vuelve a poner las opciones de este diseño
  window.__zenixChatQuickHtml = QUICK_DEFAULT;

  // el botón se aparta cuando debajo de él hay un teléfono con una demo o el CTA final de WhatsApp,
  // para no tapar botones de las apps ni el contacto
  if ('IntersectionObserver' in window) {
    const targets = [...document.querySelectorAll('.m-phone .phone, .final .btn.wa')];
    const under = new Set();
    let watcher;
    const watch = () => {
      if (watcher) watcher.disconnect();
      under.clear(); root.classList.remove('is-shy');
      // zona del botón calculada desde su posición fija (sin la animación de apartarse)
      const cs = getComputedStyle(root), pad = 12, vw = document.documentElement.clientWidth, vh = innerHeight;
      const rightGap = parseFloat(cs.right) || 0, bottomGap = parseFloat(cs.bottom) || 0;
      const right = Math.max(0, rightGap - pad), bottom = Math.max(0, bottomGap - pad);
      const left = Math.max(0, vw - rightGap - launcher.offsetWidth - pad), top = Math.max(0, vh - bottomGap - launcher.offsetHeight - pad);
      watcher = new IntersectionObserver(entries => {
        entries.forEach(e => e.isIntersecting ? under.add(e.target) : under.delete(e.target));
        root.classList.toggle('is-shy', under.size > 0);
      }, { rootMargin: `${-top}px ${-right}px ${-bottom}px ${-left}px` });
      targets.forEach(t => watcher.observe(t));
    };
    let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(watch, 200); });
    watch();
  }

  loadSession();
})();