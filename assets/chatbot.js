(function(){
  if (window.__zenixChatLoaded) return;
  window.__zenixChatLoaded = true;

  const root = document.createElement('div');
  root.className = 'zenix-chat';
  root.innerHTML = `
    <button class="zenix-chat-launcher" type="button" aria-label="Abrir asistente de Zenix AR" aria-expanded="false">
      <span class="zenix-chat-launcher-dot" aria-hidden="true"></span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v6a3.5 3.5 0 0 1-3.5 3.5H11l-4.7 3.4.9-3.7A3.5 3.5 0 0 1 5 12.5v-6Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8.5 9.5h7M8.5 12.5h4.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      <span>Asistente</span>
    </button>
    <section class="zenix-chat-panel" aria-label="Asistente Zenix AR" aria-hidden="true">
      <header class="zenix-chat-head">
        <div class="zenix-chat-brand">
          <img src="assets/zenix-icon-home-cropped.png" alt="">
          <div><strong>Asistente Zenix</strong><span><i></i> En línea</span></div>
        </div>
        <button class="zenix-chat-close" type="button" aria-label="Cerrar chat">×</button>
      </header>
      <div class="zenix-chat-messages" role="log" aria-live="polite"></div>
      <div class="zenix-chat-quick" aria-label="Opciones rápidas">
        <button type="button" data-message="Quiero hacer una app Android">App Android</button>
        <button type="button" data-message="Quiero una página web">Página web</button>
        <button type="button" data-message="Quiero una extensión para navegador">Extensión</button>
        <button type="button" data-message="Quiero pedir un presupuesto">Presupuesto</button>
      </div>
      <form class="zenix-chat-form">
        <input class="zenix-chat-input" type="text" maxlength="800" autocomplete="off" placeholder="Escribí tu consulta…" aria-label="Mensaje">
        <button class="zenix-chat-send" type="submit" aria-label="Enviar mensaje">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 5 16 7-16 7 2.7-7L4 5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6.7 12H20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </form>
      <div class="zenix-chat-foot">Orientación inicial · Para avanzar con un proyecto, seguís con nuestro equipo.</div>
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
  const defaultQuickHtml = quick.innerHTML;
  const history = [];

  let busy = false;
  let greeted = false;
  let leadState = null;

  function setOpen(open){
    root.classList.toggle('is-open', open);
    launcher.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    if (open) {
      if (!greeted) {
        addMessage('assistant', 'Hola 👋 Soy el asistente de Zenix AR. Puedo orientarte sobre apps Android, páginas web, extensiones, mejoras de proyectos y presupuestos. ¿Qué querés construir?');
        greeted = true;
      }
      setTimeout(() => input.focus(), 120);
    }
  }

  function addMessage(role, text){
    const item = document.createElement('div');
    item.className = 'zenix-chat-message ' + (role === 'user' ? 'is-user' : 'is-assistant');
    const bubble = document.createElement('div');
    bubble.className = 'zenix-chat-bubble';
    bubble.textContent = text;
    item.appendChild(bubble);
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }

  function addTyping(){
    const item = document.createElement('div');
    item.className = 'zenix-chat-message is-assistant zenix-chat-typing-row';
    item.innerHTML = '<div class="zenix-chat-bubble zenix-chat-typing"><span></span><span></span><span></span></div>';
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
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

  function showConsentButtons(){
    quick.innerHTML = '<button type="button" data-consent="yes">Confirmar envío</button><button type="button" data-consent="no">Cancelar</button>';
  }

  function isEmail(value){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isPhone(value){
    const digits = value.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 18;
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
      history: history.slice(-12)
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
      typing.remove();

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || 'No pude enviar tus datos.');
      }

      addMessage('assistant', 'Listo. Ya envié tus datos de contacto y un resumen de esta conversación al equipo de Zenix AR. Se van a poner en contacto con vos por el medio que me pasaste.');
      history.push({ role: 'assistant', content: 'Los datos de contacto fueron enviados al equipo de Zenix AR.' });
      if (history.length > 12) history.splice(0, history.length - 12);
      resetLeadCapture();
    } catch (error) {
      typing.remove();
      addMessage('assistant', error && error.name === 'AbortError'
        ? 'El envío tardó demasiado. Podés intentar otra vez o usar la sección Contacto.'
        : 'No pude enviar tus datos en este momento. Podés reintentar o usar la sección Contacto.');
      setBusy(false);
      leadState.step = 'confirm';
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
        'Voy a enviar al equipo de Zenix AR tu nombre, el contacto que me pasaste y un resumen de esta conversación únicamente para que puedan responder tu consulta. ¿Confirmás el envío?'
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
    if (history.length > 10) history.splice(0, history.length - 10);
    input.value = '';
    setBusy(true);
    const typing = addTyping();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 22000);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ message: clean, history: history.slice(0, -1) }),
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.reply) throw new Error(data.message || 'No pude responder en este momento.');

      typing.remove();
      addMessage('assistant', data.reply);
      history.push({ role: 'assistant', content: data.reply });
      if (history.length > 10) history.splice(0, history.length - 10);

      if (data.handoff === true) {
        startLeadCapture();
      }
    } catch (error) {
      typing.remove();
      const msg = error && error.name === 'AbortError'
        ? 'Estoy tardando más de lo normal. Podés intentar otra vez o escribir directamente desde la sección Contacto.'
        : 'No pude responder ahora. Podés usar el formulario de Contacto o WhatsApp y el equipo te responde directamente.';
      addMessage('assistant', msg);
    } finally {
      clearTimeout(timer);
      if (!leadState || leadState.step !== 'confirm') {
        setBusy(false);
      }
      if (leadState && leadState.step === 'confirm') {
        input.disabled = true;
        send.disabled = true;
      } else {
        input.focus();
      }
    }
  }

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

    const button = event.target.closest('button[data-message]');
    if (button) ask(button.dataset.message);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('is-open')) setOpen(false);
  });
})();