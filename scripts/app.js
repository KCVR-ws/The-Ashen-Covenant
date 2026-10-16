// تشغيل الافتتاحية والتنقل. محتوى الأقسام موجود داخل pages/.
const intro = document.getElementById('intro');
const site = document.getElementById('site');
document.body.classList.add('intro-active');
site.classList.add('awaiting-entry');
site.setAttribute('aria-hidden', 'true');
site.hidden = false;
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
  content.dataset.page = page;
  document.getElementById('page-label').textContent = section.title;
  document.querySelectorAll('[data-page]').forEach(a => {
    if (a.dataset.page === page) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  closeMenu();
  window.scrollTo(0, 0);
}
let entering = false;
let entered = false;
function enterSite(event) {
  if (entering || event.source !== intro.contentWindow || event.data !== 'ashen:enter') return;
  entering = true;
  window.removeEventListener('message', enterSite);
  history.replaceState(null, '', '#home');
  if (content.dataset.page !== 'home') render();
  site.classList.add('entering');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let finished = false;
  let fallback;
  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(fallback);
    site.removeEventListener('transitionend', onTransitionEnd);
    intro.remove();
    site.inert = false;
    site.removeAttribute('aria-hidden');
    site.classList.remove('entering');
    document.body.classList.remove('intro-active');
    entered = true;
    content.focus({ preventScroll: true });
  }
  function onTransitionEnd(event) {
    if (event.target === site && event.propertyName === 'opacity') finish();
  }
  site.addEventListener('transitionend', onTransitionEnd);
  requestAnimationFrame(() => {
    intro.classList.add('is-leaving');
    site.classList.remove('awaiting-entry');
    if (reducedMotion) finish();
    else fallback = setTimeout(finish, 1000);
  });
}
window.addEventListener('message', enterSite);
window.addEventListener('hashchange', () => {
  render();
  if (entered) content.focus();
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
    if (entered && matchMedia('(max-width:720px)').matches) toggle.focus();
  }
});
render();
