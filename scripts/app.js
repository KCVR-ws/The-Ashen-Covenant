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
  const route = window.AshenReader.resolve(location.hash);
  const key = location.hash.slice(1);
  const page = route ? 'chapters' : (Object.hasOwn(window.AshenPages, key) ? key : 'home');
  const section = window.AshenPages[page];
  content.innerHTML = route ? window.AshenReader.page(route) : (section.render ? section.render() : section.html);
  content.dataset.page = page;
  document.getElementById('page-label').textContent = route ? 'قراءة الفصل' : section.title;
  if (page === 'home') window.AshenReader.decorateHome();
  if (!route && page === 'chapters') window.AshenChapterLibrary.mount();
  document.querySelectorAll('[data-page]').forEach(a => {
    if (a.dataset.page === page) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  closeMenu();
  window.scrollTo(0, 0);
  if (route) window.AshenReadingSettings.apply();
}
let entering = false;
let entered = false;
function enterSite(event) {
  if (entering || event.source !== intro.contentWindow || event.data !== 'ashen:enter') return;
  entering = true;
  window.removeEventListener('message', enterSite);
  if (!location.hash) history.replaceState(null, '', '#home');
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
    const route = window.AshenReader.resolve(location.hash);
    if (route) window.AshenReader.mount(route);
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
let navigationId = 0;
let transition = null;
window.addEventListener('hashchange', async () => {
  const ticket = ++navigationId;
  // Save the outgoing text before changing its DOM or scroll position.
  window.AshenReader.unmount();
  window.AshenChapterLibrary.unmount();
  if (transition) transition.cancel();
  const animate = entered && !matchMedia('(prefers-reduced-motion: reduce)').matches && typeof content.animate === 'function';
  if (animate) {
    transition = content.animate([{opacity:1},{opacity:0}], {duration:120,easing:'ease-out',fill:'forwards'});
    try { await transition.finished; } catch (_) {}
  }
  if (ticket !== navigationId) return;
  render();
  if (entered) content.focus({preventScroll:true});
  if (animate) {
    transition.cancel();
    transition = content.animate([{opacity:0},{opacity:1}], {duration:220,easing:'ease-out',fill:'forwards'});
    try { await transition.finished; } catch (_) {}
  }
  if (ticket !== navigationId) return;
  if (transition) { transition.cancel(); transition = null; }
  const route = window.AshenReader.resolve(location.hash);
  if (entered && route) window.AshenReader.mount(route);
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
