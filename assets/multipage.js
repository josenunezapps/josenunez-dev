const toggle = document.getElementById('mobileMenuToggle');
const menu = document.getElementById('mobileMenu');

function closeMobileMenu() {
  menu?.classList.remove('mobile-open');
  toggle?.setAttribute('aria-expanded', 'false');
}

toggle?.addEventListener('click', () => {
  const open = menu?.classList.toggle('mobile-open');
  toggle.setAttribute('aria-expanded', String(Boolean(open)));
});

menu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMobileMenu);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMobileMenu();
});


/* En móvil, abrir las apps de contacto directamente.
   En computadora se conservan los enlaces web actuales. */
const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

if (isMobileDevice) {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href') || '';

    if (href.includes('mail.google.com/mail/')) {
      event.preventDefault();

      try {
        const url = new URL(href, window.location.href);
        const to = url.searchParams.get('to') || 'josene242@gmail.com';
        const subject = url.searchParams.get('su') || 'Consulta desde Zenix';
        const body = url.searchParams.get('body') || '';

        window.location.href =
          'mailto:' + encodeURIComponent(to) +
          '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body);
      } catch (_) {
        window.location.href =
          'mailto:josene242@gmail.com?subject=' +
          encodeURIComponent('Consulta desde Zenix');
      }

      return;
    }

    if (href.includes('wa.me/')) {
      event.preventDefault();

      try {
        const url = new URL(href, window.location.href);
        const match = url.pathname.match(/\/(\d+)/);
        const phone = match ? match[1] : '542901535229';
        const text = url.searchParams.get('text') || '';

        window.location.href =
          'whatsapp://send?phone=' + encodeURIComponent(phone) +
          '&text=' + encodeURIComponent(text);
      } catch (_) {
        window.location.href =
          'whatsapp://send?phone=542901535229';
      }
    }
  });
}
