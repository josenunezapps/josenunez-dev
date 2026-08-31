(() => {
  const header = document.querySelector('.site-header');
  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, {passive:true});

  const anchorNavLinks = [...document.querySelectorAll('.site-header .nav a[href^="#"]')];
  const anchorTargets = anchorNavLinks
    .map(link => ({link, target: document.querySelector(link.getAttribute('href'))}))
    .filter(item => item.target);

  const setActiveNav = () => {
    if (!anchorTargets.length) return;
    const headerHeight = header?.getBoundingClientRect().height || 0;
    const probe = window.scrollY + headerHeight + 90;
    let current = anchorTargets[0];
    anchorTargets.forEach(item => {
      if (item.target.offsetTop <= probe) current = item;
    });
    anchorNavLinks.forEach(link => {
      const active = link === current.link;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  let navTicking = false;
  const requestNavUpdate = () => {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(() => {
      setActiveNav();
      navTicking = false;
    });
  };
  setActiveNav();
  window.addEventListener('scroll', requestNavUpdate, {passive:true});
  window.addEventListener('hashchange', setActiveNav);

  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  menu?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
  }));
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  document.querySelectorAll('[data-copy-email]').forEach(button => {
    button.addEventListener('click', async () => {
      const email = button.dataset.copyEmail;
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(email);
      } catch (_) {
        const input = document.createElement('textarea');
        input.value = email;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
      }
      button.textContent = 'Correo copiado ✓';
      setTimeout(() => button.textContent = original, 1800);
    });
  });
  const obs = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
  }), {threshold:.08});
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();
