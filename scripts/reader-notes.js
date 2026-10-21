// Private notes: stored on this browser and shared between chapter translations.
window.AshenReaderNotes = (() => {
  const KEY='ashen.reader-notes.v1',categories={events:'الأحداث',characters:'الشخصيات',theories:'توقّعاتي'};
  let data={},dispose=()=>{};
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  try {const parsed=JSON.parse(localStorage.getItem(KEY));if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))data=parsed;} catch(_){}
  function read(id,line){const note=data[id]?.[line];return note&&typeof note.text==='string'?{text:note.text.slice(0,3000),category:Object.hasOwn(categories,note.category)?note.category:'events'}:{text:'',category:'events'};}
  function checkpoint(id,line){const note=read(id,line);return `<details class="note-checkpoint" id="note-${line}" data-note-line="${line}" dir="rtl"><summary><span aria-hidden="true">✎</span> <span class="note-summary">${note.text?'ملاحظتك':'دوّن ملاحظة'}</span><small>بعد الفقرة ${line+1}</small></summary><div class="note-paper"><label for="note-category-${line}">عن ماذا تكتب؟</label><select id="note-category-${line}" data-note-category>${Object.entries(categories).map(([value,label])=>`<option value="${value}"${value===note.category?' selected':''}>${label}</option>`).join('')}</select><label for="note-text-${line}">ما الذي لفت انتباهك؟</label><textarea id="note-text-${line}" data-note-text rows="4" maxlength="3000" placeholder="حدث تريد تذكّره، شخصية، أو توقّع للأحداث القادمة…">${escape(note.text)}</textarea><div class="note-footer"><span data-note-status role="status">${note.text?'محفوظة على هذا المتصفح':'ملاحظتك خاصة على هذا المتصفح'}</span><button type="button" data-note-delete>حذف الملاحظة</button></div></div></details>`;}
  function notebook(){return '<details class="reader-notebook" id="reader-notebook"><summary>ملاحظاتي <span id="note-count">0</span></summary><p class="notes-privacy">ملاحظات هذا الفصل محفوظة على هذا المتصفح فقط.</p><div id="note-index"></div></details>';}
  function mount(route){
    dispose();const root=document.querySelector('.reader-page');if(!root)return;const id=route.chapter.id;
    function index(){const notes=[];for(let line=14;line<route.chapter.lines[route.language].length;line+=15){const note=read(id,line);if(note.text.trim())notes.push({line,...note});}
      document.getElementById('note-count').textContent=notes.length;
      document.getElementById('note-index').innerHTML=notes.length?notes.map(note=>`<button type="button" data-note-jump="${note.line}"><span>${categories[note.category]} · بعد الفقرة ${note.line+1}</span><strong>${escape(note.text.slice(0,100))}</strong></button>`).join(''):'<p class="notes-empty">ما عندك ملاحظات بعد. دوّن أول ملاحظة أثناء القراءة.</p>';
    }
    function save(box){const line=Number(box.dataset.noteLine),text=box.querySelector('[data-note-text]').value.slice(0,3000),category=box.querySelector('[data-note-category]').value;
      if(!Object.hasOwn(data,id)||typeof data[id]!=='object'||!data[id])data[id]={};
      if(text.trim())data[id][line]={text,category};else delete data[id][line];
      let message=text.trim()?'تم الحفظ':'تم حذف الملاحظة';try{localStorage.setItem(KEY,JSON.stringify(data));}catch(_){message='تعذّر الحفظ الدائم؛ الملاحظة متاحة خلال هذه الجلسة فقط.';}
      box.querySelector('[data-note-status]').textContent=message;box.querySelector('.note-summary').textContent=text.trim()?'ملاحظتك':'دوّن ملاحظة';index();
    }
    function input(event){const box=event.target.closest('[data-note-line]');if(box)save(box);}
    function click(event){const deletion=event.target.closest('[data-note-delete]');if(deletion){const box=deletion.closest('[data-note-line]');box.querySelector('[data-note-text]').value='';save(box);return;}
      const jump=event.target.closest('[data-note-jump]');if(jump){const box=document.getElementById('note-'+jump.dataset.noteJump);if(!box)return;box.classList.add('note-revealed');box.open=true;box.scrollIntoView({behavior:window.AshenReadingSettings.smooth()?'smooth':'instant',block:'center'});box.querySelector('textarea').focus({preventScroll:true});}
    }
    root.addEventListener('input',input);root.addEventListener('click',click);index();dispose=()=>{root.removeEventListener('input',input);root.removeEventListener('click',click);};
  }
  function unmount(){dispose();dispose=()=>{};}
  return {checkpoint,notebook,mount,unmount};
})();
