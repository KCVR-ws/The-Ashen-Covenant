// عرض الفصل وحفظ موضع الفقرة على هذا المتصفح. لا يتطلب حسابًا أو خادمًا.
window.AshenReader = (() => {
  const STORAGE_KEY = 'ashen.reading-progress.v1';
  let memory = null;
  let chapterHistory = {};
  let disposeControls = () => {};
  try { const parsed=JSON.parse(localStorage.getItem('ashen.chapter-progress.v1')); if(parsed && typeof parsed==='object') chapterHistory=parsed; } catch(_) {}
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
    if (memory) return memory;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (valid(JSON.parse(raw)) || memory) : memory;
    } catch (_) { return memory; }
  }
  function history() {
    const result={};Object.values(chapterHistory).forEach(value=>{const checked=valid(value);if(checked)result[checked.chapterId]=checked;});
    const last=progress();if(last)result[last.chapterId]=last;return result;
  }
  function write(value) {
    memory = value;
    chapterHistory[value.chapterId]=value;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); localStorage.setItem('ashen.chapter-progress.v1',JSON.stringify(chapterHistory)); }
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
  function chapterLink(chapter, label, language, kind) {
    return chapter ? `<a class="reader-nav-link ${kind}" href="${href(chapter, chapter.lines[language] ? language : 'ar')}"><span>${label}</span><strong>${escape(chapter.title[language] || chapter.title.ar)}</strong></a>` : '';
  }
  function page(route) {
    const { chapter, language } = route;
    const index = window.AshenChapters.indexOf(chapter);
    const navigation = `<nav class="chapter-navigation" aria-label="التنقل بين الفصول">${chapterLink(window.AshenChapters[index - 1], 'الفصل السابق', language, 'previous')}<a class="reader-nav-index" href="#chapters">قائمة الفصول</a>${chapterLink(window.AshenChapters[index + 1], 'الفصل التالي', language, 'next')}</nav>`;
    return `<section class="reader-page" aria-labelledby="reader-title">
      <button type="button" class="focus-exit" id="focus-exit">إنهاء وضع التركيز</button><div class="reader-toolbar"><a href="#chapters" class="reader-back">قائمة الفصول</a>
      <div class="reader-languages" aria-label="لغة الفصل">${['ar','en'].map(lang => chapter.lines[lang] ? `<a href="${href(chapter,lang)}" lang="${lang}"${language===lang?' aria-current="true"':''}>${lang==='ar'?'العربية':'English'}</a>` : '').join('')}</div><button type="button" class="reader-settings-trigger" data-open-settings="top" aria-controls="reading-settings">إعدادات القراءة</button></div>
      <div id="settings-top">${window.AshenReadingSettings.markup()}</div>${window.AshenReaderNotes.notebook()}
      ${chapter.demo ? '<p class="demo-notice">فصل تجريبي للاختبار فقط — ليس جزءًا من أحداث الرواية.</p>' : ''}
      <header class="reader-heading"><p class="eyebrow">الفصل ${chapter.number}</p><h1 id="reader-title" lang="${language}" dir="${language==='ar'?'rtl':'ltr'}">${escape(chapter.title[language])}</h1><p id="reading-storage-note" class="reader-note"></p></header>
      <article class="chapter-text" lang="${language}" dir="${language==='ar'?'rtl':'ltr'}">${chapter.lines[language].map((line,i)=>`<p id="reading-line-${i}" data-reading-line="${i}">${escape(line)}</p>${(i+1)%15===0?window.AshenReaderNotes.checkpoint(chapter.id,i):''}`).join('\n')}</article>
      <p class="chapter-end">${chapter.demo ? 'نهاية الفصل التجريبي' : 'نهاية الفصل'}</p>${navigation}<div class="reader-bottom-settings"><button type="button" class="reader-settings-trigger" data-open-settings="bottom" aria-controls="reading-settings">إعدادات القراءة</button></div><div id="settings-bottom"></div></section>`;
  }
  function list() { return window.AshenChapterLibrary.markup(); }
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
    window.AshenReaderNotes.unmount();
    disposeControls();
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
    const reduced = !window.AshenReadingSettings.smooth();
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
    const saved = history()[route.chapter.id];
    active = { ...route, ready: false };
    window.AshenReadingSettings.mount();
    window.AshenReaderNotes.mount(route);
    const root=document.querySelector('.reader-page');
    function controls(event) {
      const button=event.target.closest('[data-open-settings]');
      if(button){const panel=document.getElementById('reading-settings');document.getElementById('settings-'+button.dataset.openSettings).append(panel);panel.open=true;panel.querySelector('summary').focus({preventScroll:true});}
      if(event.target.closest('#focus-exit'))window.AshenReadingSettings.exitFocus();
    }
    root.addEventListener('click',controls);disposeControls=()=>root.removeEventListener('click',controls);
    Promise.resolve(document.fonts?.ready).catch(()=>{}).then(() => requestAnimationFrame(() => {
      if (generation !== ticket || !active) return;
      const line = saved?.chapterId === route.chapter.id ? Math.min(saved.line,route.chapter.lines[route.language].length-1) : 0;
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
  return { resolve, page, list, mount, unmount, decorateHome, progress, history };
})();
