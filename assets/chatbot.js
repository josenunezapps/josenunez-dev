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
      <div class="zenix-chat-foot">Orientación inicial · Para cerrar un proyecto, seguís con José.</div>
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
  const history = [];
  let busy = false;
  let greeted = false;

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

  async function ask(text){
    const clean = String(text || '').trim();
    if (!clean || busy) return;

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
    } catch (error) {
      typing.remove();
      const msg = error && error.name === 'AbortError'
        ? 'Estoy tardando más de lo normal. Podés intentar otra vez o escribir directamente desde la sección Contacto.'
        : 'No pude responder ahora. Podés usar el formulario de Contacto o WhatsApp y José te responde directamente.';
      addMessage('assistant', msg);
    } finally {
      clearTimeout(timer);
      setBusy(false);
      input.focus();
    }
  }

  launcher.addEventListener('click', () => setOpen(!root.classList.contains('is-open')));
  close.addEventListener('click', () => setOpen(false));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    ask(input.value);
  });
  quick.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-message]');
    if (button) ask(button.dataset.message);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('is-open')) setOpen(false);
  });
})();