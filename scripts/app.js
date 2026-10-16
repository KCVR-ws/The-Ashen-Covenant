// تشغيل الافتتاحية والتنقل. محتوى الأقسام موجود داخل pages/.
const intro = document.getElementById('intro');
const site = document.getElementById('site');
intro.src = 'pages/intro.html';
const sidebar = document.getElementById('sidebar');
const toggle = document.querySelector('.menu-toggle');
const scrim = document.querySelector('.scrim');
const content = document.getElementById('content');
function closeMenu() {
  sidebar.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  scrim.hidden = true;
}
function render() {
  const key = location.hash.slice(1);
  const page = Object.hasOwn(window.AshenPages, key) ? key : 'home';
  const section = window.AshenPages[page];
  content.innerHTML = section.html;
  document.getElementById('page-label').textContent = section.title;
  document.querySelectorAll('[data-page]').forEach(a => {
    if (a.dataset.page === page) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  closeMenu();
  window.scrollTo(0, 0);
}
function enterSite(event) {
  if (event.source !== intro.contentWindow || event.data !== 'ashen:enter') return;
  site.hidden = false;
  site.inert = false;
  intro.remove();
  window.removeEventListener('message', enterSite);
  history.replaceState(null, '', '#home');
  render();
  content.focus();
}
window.addEventListener('message', enterSite);
window.addEventListener('hashchange', () => {
  render();
  if (!site.hidden) content.focus();
});
toggle.addEventListener('click', () => {
  const open = sidebar.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
  scrim.hidden = !open;
});
scrim.addEventListener('click', closeMenu);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeMenu();
    if (!site.hidden && matchMedia('(max-width:720px)').matches) toggle.focus();
  }
});
render();
