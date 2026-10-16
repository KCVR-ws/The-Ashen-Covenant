// عرض الفصل وحفظ موضع الفقرة على هذا المتصفح. لا يتطلب حسابًا أو خادمًا.
window.AshenReader = (() => {
  const STORAGE_KEY = 'ashen.reading-progress.v1';
  let memory = null;
  let storageAvailable = true;
  let active = null;
  let generation = 0;
  let timer = null;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const find = id => window.AshenChapters.find(chapter => chapter.id === id);
  function valid(value) {
    const chapter = value && find(value.chapterId);
    if (!chapter || !['ar', 'en'].includes(value.language) || !chapter.lines[value.language] || !Number.isInteger(value.line)) return null;
    return { chapterId: chapter.id, language: value.language,
      line: Math.min(Math.max(value.line, 0), chapter.lines[value.language].length - 1) };
  }
  function progress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (valid(JSON.parse(raw)) || memory) : memory;
    } catch (_) { return memory; }
  }
  function write(value) {
    memory = value;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); }
    catch (_) { storageAvailable = false; }
    const note = document.getElementById('reading-storage-note');
    if (note) note.textContent = storageAvailable
      ? 'يُحفظ مكانك تلقائيًا على هذا المتصفح.'
      : 'الحفظ الدائم غير متاح في هذا المتصفح؛ سنحتفظ بمكانك أثناء هذه الجلسة فقط.';
  }
  function href(chapter, language = 'ar') {
    return '#chapter/' + encodeURIComponent(chapter.id) + '/' + language;
  }
  function resolve(hash) {
    const match = /^#chapter\/([^/]+)(?:\/(ar|en))?$/.exec(hash);
    if (!match) return null;
    let chapter;
    try { chapter = find(decodeURIComponent(match[1])); } catch (_) { return null; }
    if (!chapter) return null;
    const language = match[2] || 'ar';
    if (!chapter.lines[language]) return null;
    return { chapter, language };
  }
  function chapterLink(chapter, label, language) {
    return chapter
      ? `<a class="reader-nav-link" href="${href(chapter, chapter.lines[language] ? language : 'ar')}">${label}</a>`
      : `<span class="reader-nav-link unavailable" aria-disabled="true">${label}</span>`;
  }
  function page(route) {
    const { chapter, language } = route;
    const index = window.AshenChapters.indexOf(chapter);
    const navigation = `<nav class="chapter-navigation" aria-label="التنقل بين الفصول">${chapterLink(window.AshenChapters[index - 1], 'الفصل السابق', language)}<a href="#chapters">قائمة الفصول</a>${chapterLink(window.AshenChapters[index + 1], 'الفصل التالي', language)}</nav>`;
    return `<section class="reader-page" aria-labelledby="reader-title">
      <div class="reader-toolbar"><a href="#chapters" class="reader-back">← قائمة الفصول</a>
      <div class="reader-languages" aria-label="لغة الفصل">${['ar','en'].map(lang => chapter.lines[lang] ? `<a href="${href(chapter,lang)}" lang="${lang}"${language===lang?' aria-current="true"':''}>${lang==='ar'?'العربية':'English'}</a>` : '').join('')}</div></div>
      ${chapter.demo ? '<p class="demo-notice">فصل تجريبي للاختبار فقط — ليس جزءًا من أحداث الرواية.</p>' : ''}
      <header class="reader-heading"><p class="eyebrow">الفصل ${chapter.number}</p><h1 id="reader-title" lang="${language}" dir="${language==='ar'?'rtl':'ltr'}">${escape(chapter.title[language])}</h1><p id="reading-storage-note" class="reader-note"></p></header>
      <article class="chapter-text" lang="${language}" dir="${language==='ar'?'rtl':'ltr'}">${chapter.lines[language].map((line,i)=>`<p id="reading-line-${i}" data-reading-line="${i}">${escape(line)}</p>`).join('\n')}</article>
      <p class="chapter-end">${chapter.demo ? 'نهاية الفصل التجريبي' : 'نهاية الفصل'}</p>${navigation}</section>`;
  }
  function list() {
    const saved = progress();
    return `<section id="chapters" class="chapters-page"><p class="eyebrow">بين صفحات العهد</p><h1>الفصول</h1><p class="chapters-description">الفصول مرتّبة من البداية. اختر فصلًا لتبدأ القراءة.</p>
      <ol class="chapter-list">${window.AshenChapters.map(chapter=>`<li><a class="chapter-list-link" href="${href(chapter,saved?.chapterId===chapter.id?saved.language:'ar')}"><span class="chapter-number">${String(chapter.number).padStart(2,'0')}</span><span class="chapter-list-copy"><strong>${escape(chapter.title.ar)}</strong><span>${chapter.demo?'فصل تجريبي · للاختبار فقط':'الفصل '+chapter.number}</span></span><span class="chapter-list-arrow" aria-hidden="true">←</span></a></li>`).join('')}</ol></section>`;
  }
  function decorateHome() {
    const saved = progress();
    const button = document.querySelector('#home .actions .primary');
    const first = window.AshenChapters[0];
    if (!button || !first) return;
    const chapter = saved ? find(saved.chapterId) : first;
    button.href = href(chapter, saved?.language || 'ar');
    button.innerHTML = `${saved?'أكمل القراءة':'ابدأ القراءة'} <span aria-hidden="true">←</span>`;
    const details = document.getElementById('home-reading-details');
    if (details) details.textContent = saved
      ? `${chapter.demo?'الفصل التجريبي':'الفصل '+chapter.number} · ${chapter.title.ar} · السطر ${saved.line+1} من ${chapter.lines[saved.language].length}`
      : (first.demo ? 'الفصل المتاح حاليًا تجريبي للاختبار فقط.' : '');
  }
  function save() {
    if (!active?.ready) return;
    const paragraphs = Array.from(document.querySelectorAll('[data-reading-line]'));
    if (!paragraphs.length) return;
    let line = paragraphs.findIndex(paragraph => paragraph.getBoundingClientRect().bottom > 64);
    if (line < 0) line = paragraphs.length - 1;
    // At the page bottom, remember the final paragraph instead of the first visible one.
    if (window.scrollY > 100 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8) line = paragraphs.length - 1;
    write({ chapterId: active.chapter.id, language: active.language, line });
  }
  function onScroll() { clearTimeout(timer); timer = setTimeout(save, 150); }
  function onVisibility() { if (document.visibilityState === 'hidden') save(); }
  function unmount() {
    save();
    clearTimeout(timer);
    generation++;
    active = null;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('pagehide', save);
    document.removeEventListener('visibilitychange', onVisibility);
  }
  function mount(route) {
    const ticket = ++generation;
    const saved = progress();
    active = { ...route, ready: false };
    // Wait for local fonts so restored positions do not shift after navigation.
    Promise.resolve(document.fonts?.ready).catch(()=>{}).then(() => requestAnimationFrame(() => {
      if (generation !== ticket || !active) return;
      const line = saved?.chapterId === route.chapter.id ? saved.line : 0;
      const paragraph = document.getElementById('reading-line-' + line);
      if (paragraph && line > 0) window.scrollTo({ top: window.scrollY + paragraph.getBoundingClientRect().top - 64, behavior: 'instant' });
      active.ready = true;
      write({ chapterId: route.chapter.id, language: route.language, line });
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('pagehide', save);
      document.addEventListener('visibilitychange', onVisibility);
    }));
  }
  return { resolve, page, list, mount, unmount, decorateHome, progress };
})();
