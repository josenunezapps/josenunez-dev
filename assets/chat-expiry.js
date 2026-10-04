(function(){
  const SESSION_KEY='zenix-agent-session-v2';
  const ACTIVITY_KEY='zenix-agent-last-activity-v1';
  const REOPEN_KEY='zenix-agent-reopen-after-expiry-v1';
  const INACTIVITY_MS=10*60*1000;
  let timer=null;
  let expiredThisPage=false;

  function lastActivity(){
    const value=Number(localStorage.getItem(ACTIVITY_KEY)||0);
    return Number.isFinite(value)?value:0;
  }

  function clearTimer(){
    if(timer){clearTimeout(timer);timer=null;}
  }

  function resetVisualState(){
    const root=document.querySelector('.zenix-chat');
    if(!root)return;
    root.classList.remove('is-open');
    const launcher=root.querySelector('.zenix-chat-launcher');
    const panel=root.querySelector('.zenix-chat-panel');
    const messages=root.querySelector('.zenix-chat-messages');
    const input=root.querySelector('.zenix-chat-input');
    const send=root.querySelector('.zenix-chat-send');
    const quick=root.querySelector('.zenix-chat-quick');
    const card=root.querySelector('.zenix-agent-card');
    if(launcher)launcher.setAttribute('aria-expanded','false');
    if(panel)panel.setAttribute('aria-hidden','true');
    if(messages)messages.innerHTML='';
    if(input){input.value='';input.disabled=false;input.placeholder='Escribí tu consulta…';}
    if(send)send.disabled=false;
    if(card){card.hidden=true;card.classList.remove('is-expanded');card.setAttribute('aria-expanded','false');}
    if(quick)quick.innerHTML='<button type="button" data-message="Necesito una página web">Web</button><button type="button" data-message="Necesito una app Android">App</button><button type="button" data-message="Quiero automatizar mi negocio">Automatizar</button><button type="button" data-message="Quiero pedir un presupuesto">Presupuesto</button>';
  }

  function expire(){
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ACTIVITY_KEY);
    clearTimer();
    expiredThisPage=true;
    resetVisualState();
  }

  function schedule(){
    clearTimer();
    const last=lastActivity();
    if(!last)return;
    const remaining=INACTIVITY_MS-(Date.now()-last);
    if(remaining<=0){expire();return;}
    timer=setTimeout(expire,remaining+100);
  }

  function markActivity(){
    if(expiredThisPage)return;
    try{localStorage.setItem(ACTIVITY_KEY,String(Date.now()));}catch(_){}
    schedule();
  }

  const storedLast=lastActivity();
  if(storedLast&&Date.now()-storedLast>=INACTIVITY_MS){
    expire();
  }else if(storedLast){
    schedule();
  }else if(localStorage.getItem(SESSION_KEY)){
    // Sesiones creadas antes de incorporar el temporizador no tienen fecha
    // de actividad confiable: se eliminan en vez de regalarles otros 10 minutos.
    expire();
  }

  document.addEventListener('click',function(event){
    const launcher=event.target.closest&&event.target.closest('.zenix-chat-launcher');
    if(launcher&&expiredThisPage){
      event.preventDefault();
      event.stopImmediatePropagation();
      try{sessionStorage.setItem(REOPEN_KEY,'1');}catch(_){}
      location.reload();
      return;
    }
    if(event.target.closest&&event.target.closest('.zenix-chat'))markActivity();
  },true);

  document.addEventListener('input',function(event){
    if(event.target.closest&&event.target.closest('.zenix-chat'))markActivity();
  },true);

  document.addEventListener('keydown',function(event){
    if(event.target.closest&&event.target.closest('.zenix-chat'))markActivity();
  },true);

  try{
    if(sessionStorage.getItem(REOPEN_KEY)==='1'){
      sessionStorage.removeItem(REOPEN_KEY);
      setTimeout(function(){
        const launcher=document.querySelector('.zenix-chat-launcher');
        if(launcher){launcher.click();markActivity();}
      },120);
    }
  }catch(_){}
})();
