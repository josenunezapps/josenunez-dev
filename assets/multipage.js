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
