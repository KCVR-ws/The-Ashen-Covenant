// إعدادات القراءة مستقلة عن الفصول، ومحفوظة على المتصفح الحالي.
window.AshenReadingSettings = (() => {
  const KEY = 'ashen.reader-settings.v1';
  const fonts = {
    'Amiri': 'Amiri, Georgia, serif',
    'Tahoma': 'Tahoma, Arial, sans-serif',
    'Arial': 'Arial, Tahoma, sans-serif',
    'Georgia': 'Georgia, Amiri, serif',
    'Times New Roman': '"Times New Roman", Amiri, serif',
    'Cormorant Garamond': '"Cormorant Garamond", Amiri, serif'
  };
  const defaults = { font: 'Amiri', size: 24, spacing: 2, theme: 'dark' };
  let values = { ...defaults };
  let dispose = () => {};
  function normalize(value) {
    const v = value && typeof value === 'object' ? value : {};
    return {
      font: Object.hasOwn(fonts, v.font) ? v.font : defaults.font,
      size: Number.isFinite(v.size) ? Math.max(16, Math.min(34, Math.round(v.size))) : defaults.size,
      spacing: Number.isFinite(v.spacing) ? Math.max(1.4, Math.min(2.6, v.spacing)) : defaults.spacing,
      theme: ['dark','paper','light'].includes(v.theme) ? v.theme : defaults.theme
    };
  }
  try { values = normalize(JSON.parse(localStorage.getItem(KEY))); } catch (_) {}
  function markup() {
    return `<details class="reading-settings" id="reading-settings"><summary>إعدادات القراءة <span aria-hidden="true">Aa</span></summary>
      <div class="reading-settings-panel"><h2>راحة القراءة</h2>
      <label for="reader-font">نوع الخط <span lang="en">Font</span></label>
      <select id="reader-font" data-reader-setting="font" dir="ltr" lang="en">${Object.keys(fonts).map(name=>`<option value="${name}"${values.font===name?' selected':''}>${name}</option>`).join('')}</select>
      <label for="reader-size">حجم الخط <output id="reader-size-value">${values.size}</output></label>
      <input id="reader-size" data-reader-setting="size" type="range" min="16" max="34" step="1" value="${values.size}">
      <label for="reader-spacing">تباعد السطور <output id="reader-spacing-value">${values.spacing.toFixed(1)}</output></label>
      <input id="reader-spacing" data-reader-setting="spacing" type="range" min="1.4" max="2.6" step="0.1" value="${values.spacing}">
      <fieldset><legend>خلفية القراءة</legend><div class="reader-themes">${[['dark','داكنة'],['paper','ورقية'],['light','فاتحة']].map(([key,label])=>`<label><input type="radio" name="reading-theme" value="${key}" data-reader-setting="theme"${values.theme===key?' checked':''}><span>${label}</span></label>`).join('')}</div></fieldset>
      <button type="button" class="reader-reset" id="reader-reset">استعادة الافتراضي</button>
      <p id="reader-settings-note">تُحفظ اختياراتك تلقائيًا على هذا المتصفح.</p></div></details>`;
  }
  function apply() {
    const page = document.querySelector('.reader-page');
    if (!page) return;
    page.style.setProperty('--reading-font', fonts[values.font]);
    page.style.setProperty('--reading-size', values.size + 'px');
    page.style.setProperty('--reading-spacing', values.spacing);
    page.dataset.theme = values.theme;
  }
  function mount() {
    dispose(); apply();
    const panel = document.getElementById('reading-settings');
    if (!panel) return;
    function persist() {
      try { localStorage.setItem(KEY, JSON.stringify(values)); }
      catch (_) { document.getElementById('reader-settings-note').textContent = 'الحفظ الدائم غير متاح؛ ستبقى الإعدادات خلال هذه الجلسة فقط.'; }
    }
    function change(event) {
      const key = event.target.dataset.readerSetting;
      if (!key) return;
      const paragraphs = Array.from(document.querySelectorAll('[data-reading-line]'));
      const anchor = paragraphs.find(p=>p.getBoundingClientRect().bottom>64);
      const top = anchor?.getBoundingClientRect().top;
      values = normalize({ ...values, [key]: ['size','spacing'].includes(key) ? Number(event.target.value) : event.target.value });
      apply();
      if (anchor && top < window.innerHeight) window.scrollBy({top:anchor.getBoundingClientRect().top-top,behavior:'instant'});
      document.getElementById('reader-size-value').textContent = values.size;
      document.getElementById('reader-spacing-value').textContent = values.spacing.toFixed(1);
      persist();
    }
    function reset() {
      values = { ...defaults }; apply();
      panel.querySelector('[data-reader-setting="font"]').value = values.font;
      panel.querySelector('[data-reader-setting="size"]').value = values.size;
      panel.querySelector('[data-reader-setting="spacing"]').value = values.spacing;
      panel.querySelector('[value="dark"]').checked = true;
      document.getElementById('reader-size-value').textContent = values.size;
      document.getElementById('reader-spacing-value').textContent = values.spacing.toFixed(1);
      persist();
    }
    function close(event) {
      if (event.key === 'Escape') { panel.open = false; panel.querySelector('summary').focus(); }
      else if (event.type === 'pointerdown' && !panel.contains(event.target)) panel.open = false;
    }
    panel.addEventListener('input',change);
    const resetButton = document.getElementById('reader-reset');resetButton.addEventListener('click',reset);
    document.addEventListener('keydown',close);document.addEventListener('pointerdown',close);
    dispose=()=>{panel.removeEventListener('input',change);resetButton.removeEventListener('click',reset);document.removeEventListener('keydown',close);document.removeEventListener('pointerdown',close);};
  }
  function unmount() { dispose(); dispose = () => {}; }
  return { markup, apply, mount, unmount };
})();
