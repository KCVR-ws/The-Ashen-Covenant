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
  const defaults = { font: 'Amiri', size: 24, spacing: 2, theme: 'dark', width: 'medium', paragraph: 1.1, notes: true, motion: 'smooth', focus: false };
  let values = { ...defaults };
  let dispose = () => {};
  function normalize(value) {
    const v = value && typeof value === 'object' ? value : {};
    return {
      font: Object.hasOwn(fonts, v.font) ? v.font : defaults.font,
      size: Number.isFinite(v.size) ? Math.max(16, Math.min(34, Math.round(v.size))) : defaults.size,
      spacing: Number.isFinite(v.spacing) ? Math.max(1.4, Math.min(2.6, v.spacing)) : defaults.spacing,
      theme: ['dark','paper','light'].includes(v.theme) ? v.theme : defaults.theme,
      width: ['narrow','medium','wide'].includes(v.width) ? v.width : 'medium',
      paragraph: Number.isFinite(v.paragraph) ? Math.max(.5,Math.min(2,v.paragraph)) : 1.1,
      notes: v.notes !== false, motion: v.motion === 'instant' ? 'instant' : 'smooth', focus: v.focus === true
    };
  }
  try { values = normalize(JSON.parse(localStorage.getItem(KEY))); } catch (_) {}
  function select(key,label,options) {
    return `<label for="reader-${key}">${label}</label><select id="reader-${key}" data-reader-setting="${key}">${options.map(([value,text])=>`<option value="${value}"${values[key]===value?' selected':''}>${text}</option>`).join('')}</select>`;
  }
  function markup(id = 'reading-settings') {
    return `<details class="reading-settings" id="${id}"><summary>إعدادات القراءة <span aria-hidden="true">Aa</span></summary>
      <div class="reading-settings-panel"><h2>راحة القراءة</h2><h3>الخط والمسافات</h3>
      <label for="reader-font">نوع الخط <span lang="en">Font</span></label>
      <select id="reader-font" data-reader-setting="font" dir="ltr" lang="en">${Object.keys(fonts).map(name=>`<option value="${name}"${values.font===name?' selected':''}>${name}</option>`).join('')}</select>
      <label for="reader-size">حجم الخط <output id="reader-size-value">${values.size}</output></label>
      <input id="reader-size" data-reader-setting="size" type="range" min="16" max="34" step="1" value="${values.size}">
      <label for="reader-spacing">تباعد السطور <output id="reader-spacing-value">${values.spacing.toFixed(1)}</output></label>
      <input id="reader-spacing" data-reader-setting="spacing" type="range" min="1.4" max="2.6" step="0.1" value="${values.spacing}">
      <label for="reader-paragraph">المسافة بين الفقرات <output id="reader-paragraph-value">${values.paragraph.toFixed(1)}</output></label>
      <input id="reader-paragraph" data-reader-setting="paragraph" type="range" min="0.5" max="2" step="0.1" value="${values.paragraph}">
      ${select('width','عرض النص',[['narrow','ضيّق'],['medium','متوسط'],['wide','واسع']])}
      <h3>المظهر</h3><fieldset><legend>خلفية القراءة</legend><div class="reader-themes">${[['dark','داكنة'],['paper','ورقية'],['light','فاتحة']].map(([key,label])=>`<label><input type="radio" name="reading-theme" value="${key}" data-reader-setting="theme"${values.theme===key?' checked':''}><span>${label}</span></label>`).join('')}</div></fieldset>
      <label class="reader-check"><input type="checkbox" data-reader-setting="focus"${values.focus?' checked':''}> وضع التركيز</label>
      <h3>سلوك القراءة</h3>
      <label class="reader-check"><input type="checkbox" data-reader-setting="notes"${values.notes?' checked':''}> إظهار نقاط الملاحظات</label>
      ${select('motion','الرجوع لموضع القراءة',[['smooth','نزول سلس'],['instant','مباشر']])}
      <div class="reading-preview"><small>معاينة مباشرة</small><p>كان الضوء خلف الباب بداية حكاية لم تُروَ بعد.</p><p lang="en" dir="ltr">Every page holds a new beginning.</p></div>
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
    page.dataset.notes = String(values.notes);
    page.style.setProperty('--reading-width', {narrow:'560px',medium:'760px',wide:'100%'}[values.width]);
    page.style.setProperty('--reading-paragraph', values.paragraph+'em');
    document.body.classList.toggle('reader-focus',values.focus);
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.inert = values.focus;
  }
  function mount() {
    dispose(); apply();
    const panel = document.querySelector('.reading-settings');
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
      values = normalize({ ...values, [key]: ['size','spacing','paragraph'].includes(key) ? Number(event.target.value) : ['focus','notes'].includes(key) ? event.target.checked : event.target.value });
      apply();
      if (anchor && top < window.innerHeight) window.scrollBy({top:anchor.getBoundingClientRect().top-top,behavior:'instant'});
      document.getElementById('reader-size-value').textContent = values.size;
      document.getElementById('reader-spacing-value').textContent = values.spacing.toFixed(1);
      document.getElementById('reader-paragraph-value').textContent = values.paragraph.toFixed(1);
      persist();
    }
    function reset() {
      values = { ...defaults }; apply();
      panel.querySelectorAll('[data-reader-setting]').forEach(control=>{
        const key=control.dataset.readerSetting;
        if(control.type==='radio') control.checked=control.value===values[key];
        else if(control.type==='checkbox') control.checked=values[key];
        else control.value=values[key];
      });
      ['size','spacing','paragraph'].forEach(key=>document.getElementById('reader-'+key+'-value').textContent=values[key]);
      persist();
    }
    function close(event) {
      if (event.key === 'Escape' && panel.open) { panel.open = false; document.querySelector('[data-open-settings="'+(panel.parentElement.id==='settings-bottom'?'bottom':'top')+'"]').focus({preventScroll:true}); }
      
    }
    panel.addEventListener('input',change);
    const resetButton = document.getElementById('reader-reset');resetButton.addEventListener('click',reset);
    document.addEventListener('keydown',close);
    dispose=()=>{panel.removeEventListener('input',change);resetButton.removeEventListener('click',reset);document.removeEventListener('keydown',close);};
  }
  function unmount() { dispose(); dispose = () => {}; document.body.classList.remove('reader-focus'); const sidebar=document.getElementById('sidebar'); if(sidebar) sidebar.inert=false; }
  function exitFocus() { values.focus=false; apply(); const input=document.querySelector('[data-reader-setting="focus"]'); if(input) input.checked=false; try {localStorage.setItem(KEY,JSON.stringify(values));} catch(_){} }
  function smooth() { return values.motion==='smooth' && !matchMedia('(prefers-reduced-motion: reduce)').matches; }
  return { markup, apply, mount, unmount, exitFocus, smooth };
})();
