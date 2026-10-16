// عرض الفصل وحفظ موضع الفقرة على هذا المتصفح. لا يتطلب حسابًا أو خادمًا.
window.AshenReader = (() => {
  const STORAGE_KEY = 'ashen.reading-progress.v1';
  let memory = null;
  let storageAvailable = true;
  let active = null;
  let generation = 0;
  let timer = null;
  let cancelRestore = () => {};
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
      <div class="reader-toolbar"><a href="#chapters" class="reader-back">قائمة الفصول</a>
      <div class="reader-languages" aria-label="لغة الفصل">${['ar','en'].map(lang => chapter.lines[lang] ? `<a href="${href(chapter,lang)}" lang="${lang}"${language===lang?' aria-current="true"':''}>${lang==='ar'?'العربية':'English'}</a>` : '').join('')}</div></div>
      ${chapter.demo ? '<p class="demo-notice">فصل تجريبي للاختبار فقط — ليس جزءًا من أحداث الرواية.</p>' : ''}
      <header class="reader-heading"><p class="eyebrow">الفصل ${chapter.number}</p><h1 id="reader-title" lang="${language}" dir="${language==='ar'?'rtl':'ltr'}">${escape(chapter.title[language])}</h1><p id="reading-storage-note" class="reader-note"></p></header>
      <article class="chapter-text" lang="${language}" dir="${language==='ar'?'rtl':'ltr'}">${chapter.lines[language].map((line,i)=>`<p id="reading-line-${i}" data-reading-line="${i}">${escape(line)}</p>`).join('\n')}</article>
      ${window.AshenReadingSettings.markup()}
      <p class="chapter-end">${chapter.demo ? 'نهاية الفصل التجريبي' : 'نهاية الفصل'}</p>${navigation}</section>`;
  }
  function list() {
    const saved = progress();
    return `<section id="chapters" class="chapters-page"><p class="eyebrow">بين صفحات العهد</p><h1>الفصول</h1><p class="chapters-description">الفصول مرتّبة من البداية. اختر فصلًا لتبدأ القراءة.</p>
      <ol class="chapter-list">${window.AshenChapters.map(chapter=>`<li><a class="chapter-list-link" href="${href(chapter,saved?.chapterId===chapter.id?saved.language:'ar')}"><span class="chapter-number">${String(chapter.number).padStart(2,'0')}</span><span class="chapter-list-copy"><strong>${escape(chapter.title.ar)}</strong><span>${chapter.demo?'فصل تجريبي · للاختبار فقط':'الفصل '+chapter.number}</span></span><span class="chapter-open">قراءة الفصل<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/></svg></span></a></li>`).join('')}</ol></section>`;
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
    cancelRestore();
    window.AshenReadingSettings.unmount();
    clearTimeout(timer);
    generation++;
    active = null;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('pagehide', save);
    document.removeEventListener('visibilitychange', onVisibility);
  }
  // A bounded eased scroll; intermediate animation frames never overwrite saved progress.
  function restoreTo(paragraph, complete) {
    let frame;
    let done = false;
    const startY = window.scrollY;
    const destination = Math.max(0, Math.min(window.scrollY + paragraph.getBoundingClientRect().top - 64,
      document.documentElement.scrollHeight - window.innerHeight));
    const distance = destination - startY;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = Math.min(1150, Math.max(450, Math.abs(distance) * .22));
    let startTime;
    function clear() {
      cancelAnimationFrame(frame);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      window.removeEventListener('pointerdown', interrupt);
      window.removeEventListener('keydown', onKey);
    }
    function finish(interrupted) {
      if (done) return;
      done = true; clear(); cancelRestore = () => {}; complete(interrupted);
    }
    function interrupt() { finish(true); }
    function onKey(event) {
      if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) interrupt();
    }
    cancelRestore = () => { done = true; clear(); cancelRestore = () => {}; };
    if (reduced || Math.abs(distance) < 2) {
      window.scrollTo({top:destination,behavior:'instant'});finish(false);return;
    }
    window.addEventListener('wheel', interrupt, {passive:true});
    window.addEventListener('touchstart', interrupt, {passive:true});
    window.addEventListener('pointerdown', interrupt, {passive:true});
    window.addEventListener('keydown', onKey);
    function step(time) {
      if (done) return;
      if (startTime === undefined) startTime = time;
      const t = Math.min(1, (time - startTime) / duration);
      const eased = t < .5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
      window.scrollTo({top:startY+distance*eased,behavior:'instant'});
      if (t < 1) frame = requestAnimationFrame(step); else finish(false);
    }
    frame = requestAnimationFrame(step);
  }
  function mount(route) {
    cancelRestore();
    const ticket = ++generation;
    const saved = progress();
    active = { ...route, ready: false };
    window.AshenReadingSettings.mount();
    Promise.resolve(document.fonts?.ready).catch(()=>{}).then(() => requestAnimationFrame(() => {
      if (generation !== ticket || !active) return;
      const line = saved?.chapterId === route.chapter.id ? saved.line : 0;
      const paragraph = document.getElementById('reading-line-' + line);
      function ready(interrupted) {
        if (generation !== ticket || !active) return;
        active.ready = true;
        if (interrupted) save();
        else write({ chapterId: route.chapter.id, language: route.language, line });
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('pagehide', save);
        document.addEventListener('visibilitychange', onVisibility);
      }
      if (paragraph && line > 0) {
        const note = document.getElementById('reading-storage-note');
        if (note) note.textContent = 'نعود إلى موضع قراءتك…';
        restoreTo(paragraph, ready);
      } else ready(false);
    }));
  }
  return { resolve, page, list, mount, unmount, decorateHome, progress };
})();
