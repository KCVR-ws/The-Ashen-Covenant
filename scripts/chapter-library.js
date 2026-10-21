// Compact chapter folders, search and per-chapter reading status.
window.AshenChapterLibrary = (() => {
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value).toLowerCase().replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[\u064B-\u065F\u0670ـ]/g,'').replace(/[أإآ]/g,'ا').trim();
  let query = '';
  const opened = new Set();
  let initialized = false;
  let dispose = () => {};
  function matches(chapter,term) {
    const q=normalize(term);
    return !q || (/^\d+$/.test(q) ? chapter.number===Number(q) : normalize(chapter.title.ar+' '+chapter.title.en).includes(q));
  }
  function groups() {
    const result = new Map();
    window.AshenChapters.forEach(chapter=>{const start=Math.floor((chapter.number-1)/20)*20+1; if(!result.has(start))result.set(start,[]);result.get(start).push(chapter);});
    return result;
  }
  function rows() {
    const reader=window.AshenReader, saved=reader.progress(), history=reader.history();
    let count=0;
    const markup=Array.from(groups(),([start,chapters])=>{
      const visible=chapters.filter(ch=>matches(ch,query)); count+=visible.length;if(!visible.length)return '';
      return `<details class="chapter-folder" data-folder="${start}"${query || opened.has(start)?' open':''}><summary><span class="folder-symbol" aria-hidden="true">▱</span><span>الفصول ${start}–${start+19}<small>${chapters.length} ${chapters.length===1?'فصل متاح':'فصول متاحة'}</small></span><span class="folder-toggle" aria-hidden="true">+</span></summary><ol class="chapter-list">${visible.map(ch=>{
        const progress=history[ch.id] || (saved?.chapterId===ch.id?saved:null);
        const complete=progress && progress.line>=ch.lines[progress.language].length-1;
        return `<li><a class="chapter-list-link" href="#chapter/${encodeURIComponent(ch.id)}/${progress?.language||'ar'}"><span class="chapter-number">${String(ch.number).padStart(2,'0')}</span><span class="chapter-list-copy"><strong>${escape(ch.title.ar)}</strong><span>${ch.demo?'فصل تجريبي':'الفصل '+ch.number}</span></span><span class="chapter-state ${complete?'completed':''}">${complete?'مكتمل':progress?'قيد القراءة':'لم يبدأ'}</span></a></li>`;
      }).join('')}</ol></details>`;
    }).join('');
    return {markup:markup||'<p class="chapter-empty">ما لقينا فصلًا بهذا الاسم أو الرقم. جرّب بحثًا آخر.</p>',count};
  }
  function markup() {
    const saved=window.AshenReader.progress();
    if(!initialized){opened.add(saved?Math.floor((window.AshenChapters.find(c=>c.id===saved.chapterId).number-1)/20)*20+1:1);initialized=true;}
    if(saved) opened.add(Math.floor((window.AshenChapters.find(c=>c.id===saved.chapterId).number-1)/20)*20+1);
    const chapter=saved&&window.AshenChapters.find(c=>c.id===saved.chapterId),result=rows();
    return `<section id="chapters" class="chapters-page"><p class="eyebrow">بين صفحات العهد</p><h1>الفصول</h1><p class="chapters-description">كل حكاية تبدأ بصفحة. اختر فصلًا، أو عُد إلى حيث توقفت.</p>
    ${chapter?`<a class="resume-card" href="#chapter/${encodeURIComponent(chapter.id)}/${saved.language}"><span>متابعة القراءة<strong>${escape(chapter.title.ar)}</strong></span><small>الفصل ${chapter.number} · الفقرة ${saved.line+1}</small></a>`:''}
    <div class="chapter-search"><label for="chapter-search">ابحث عن فصل</label><div><input type="search" id="chapter-search" value="${escape(query)}" placeholder="رقم الفصل أو اسمه" autocomplete="off"><button type="button" id="chapter-search-clear" aria-label="مسح البحث">مسح</button></div></div>
    <p id="chapter-results-count" class="chapter-count" role="status">${result.count} فصل متاح</p><div id="chapter-folders">${result.markup}</div></section>`;
  }
  function mount(){
    dispose(); const input=document.getElementById('chapter-search');if(!input)return;
    const container=document.getElementById('chapter-folders'),clear=document.getElementById('chapter-search-clear');
    function search(){query=input.value;const result=rows();container.innerHTML=result.markup;document.getElementById('chapter-results-count').textContent=query?`${result.count} نتيجة بحث`:`${result.count} فصل متاح`;}
    function reset(){input.value='';search();input.focus();}
    function toggle(event){const folder=event.target.closest('[data-folder]');if(!folder||query)return;const start=Number(folder.dataset.folder);if(folder.open)opened.add(start);else opened.delete(start);}
    input.addEventListener('input',search);clear.addEventListener('click',reset);container.addEventListener('toggle',toggle,true);
    dispose=()=>{input.removeEventListener('input',search);clear.removeEventListener('click',reset);container.removeEventListener('toggle',toggle,true);};
  }
  function unmount(){dispose();dispose=()=>{};}
  return {markup,mount,unmount,matches};
})();
