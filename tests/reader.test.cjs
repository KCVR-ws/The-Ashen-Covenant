const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const base=path.join(__dirname,'..');
const tick=()=>new Promise(r=>setImmediate(r));
function element(){return {listeners:{},dataset:{},style:{setProperty(k,v){this[k]=v;}},classList:{toggle(){},remove(){},add(){}},addEventListener(k,f){this.listeners[k]=f;},removeEventListener(k){delete this.listeners[k];},querySelector(){return element();},querySelectorAll(){return [];},focus(){},append(){},getBoundingClientRect(){return {top:0,bottom:0};}};}
function setup(stored={}){
 const nodes={},root=element(),panel=element(),body=element(),events={};let count=60;
 const c={console,setTimeout,clearTimeout,Promise,innerHeight:700,scrollY:0,matchMedia:()=>({matches:true}),cancelAnimationFrame(){}};c.window=c;
 c.document={body,fonts:{ready:Promise.resolve()},documentElement:{scrollHeight:11000},visibilityState:'visible',getElementById:id=>nodes[id]??=element(),querySelector:s=>s==='.reader-page'?root:s==='.reading-settings'?panel:element(),querySelectorAll:s=>s==='[data-reading-line]'?Array.from({length:count},(_,i)=>({getBoundingClientRect:()=>({top:500+i*160-c.scrollY,bottom:640+i*160-c.scrollY})})):[],addEventListener(k,f){events[k]=f;},removeEventListener(k){delete events[k];}};
 for(let i=0;i<60;i++)nodes['reading-line-'+i]={getBoundingClientRect:()=>({top:500+i*160-c.scrollY})};
 c.localStorage={getItem:k=>stored[k]??null,setItem:(k,v)=>stored[k]=v};c.requestAnimationFrame=f=>f();c.scrollTo=(arg,y)=>{c.scrollY=typeof arg==='object'?arg.top:y;};c.scrollBy=arg=>c.scrollY+=arg.top;c.addEventListener=(k,f)=>events[k]=f;c.removeEventListener=k=>delete events[k];vm.createContext(c);
 for(const f of ['data/chapters.js','scripts/reader-settings.js','scripts/chapter-library.js','scripts/reader-notes.js','scripts/reader.js'])vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),c);
 return {c,stored,nodes,root,panel,events,r:c.AshenReader,setCount:n=>count=n};
}
(async()=>{
 const t=setup(),{c,r}=t;assert.equal(c.AshenChapters[1].lines.ar.length,60);assert.equal(c.AshenChapters[1].lines.en.length,60);
 const a=r.page(r.resolve('#chapter/test-01/ar')),b=r.page(r.resolve('#chapter/test-02/en'));
 assert(!a.includes('الفصل السابق'));assert(a.includes('الفصل التالي'));assert(b.includes('الفصل السابق'));assert(!b.includes('الفصل التالي'));assert.equal((b.match(/data-note-line=/g)||[]).length,4);assert.equal((b.match(/data-reading-line=/g)||[]).length,60);assert.equal((b.match(/id="reading-settings"/g)||[]).length,1);
 assert(b.includes('dir="ltr"'));assert.equal(r.resolve('#chapter/%broken/ar'),null);assert.equal(r.resolve('#chapter/missing/ar'),null);
 const search=c.AshenChapterLibrary.matches,second=c.AshenChapters[1];for(const q of ['2','٢','۲','02','الدفتر','blue notebook'])assert(search(second,q),q);assert(!search(second,'1'));assert(!search(second,'غائب'));
 assert(r.list().includes('data-folder="1" open'));c.AshenChapterLibrary.mount();t.nodes['chapter-search'].value='٢';t.nodes['chapter-search'].listeners.input();assert(t.nodes['chapter-folders'].innerHTML.includes('الدفتر الأزرق'));assert(!t.nodes['chapter-folders'].innerHTML.includes('الضوء خلف الباب'));t.nodes['chapter-search-clear'].listeners.click();
 r.mount(r.resolve('#chapter/test-01/ar'));await tick();c.scrollY=2036;t.events.pagehide();assert.equal(r.progress().line,10);r.unmount();c.scrollY=0;r.mount(r.resolve('#chapter/test-02/ar'));await tick();assert.equal(r.progress().line,0);r.unmount();c.scrollY=0;r.mount(r.resolve('#chapter/test-01/en'));await tick();assert.equal(c.scrollY,2036);assert.equal(r.progress().line,10);assert.equal(r.progress().language,'en');r.unmount();
 const resumed=setup(t.stored);resumed.r.mount(resumed.r.resolve('#chapter/test-01/en'));await tick();assert.equal(resumed.c.scrollY,2036);
 const settings=t.panel.listeners; c.AshenReadingSettings.mount();function change(key,value,checked){t.panel.listeners.input({target:{dataset:{readerSetting:key},value,checked}});}
 change('width','narrow');change('paragraph','1.7');change('notes',null,false);change('motion','instant');change('theme','paper');assert.equal(t.root.style['--reading-width'],'560px');assert.equal(t.root.dataset.notes,'false');assert.equal(t.root.dataset.theme,'paper');assert.equal(c.AshenReadingSettings.smooth(),false);
 const reload=setup(t.stored);reload.c.AshenReadingSettings.apply();assert.equal(reload.root.style['--reading-paragraph'],'1.7em');assert.equal(reload.root.dataset.theme,'paper');
 // Notes: input, safe rendering, reload, deletion, storage failure and jump.
 c.AshenReaderNotes.mount(r.resolve('#chapter/test-02/ar'));
 const box=element(),text={value:'<img src=x onerror=alert(1)> تذكّر الفتى'},category={value:'characters'},status={},summary={};box.dataset.noteLine='14';box.querySelector=s=>({'[data-note-text]':text,'[data-note-category]':category,'[data-note-status]':status,'.note-summary':summary}[s]);
 t.root.listeners.input({target:{closest:()=>box}});assert.equal(status.textContent,'تم الحفظ');assert(t.nodes['note-index'].innerHTML.includes('&lt;img'));assert(!t.nodes['note-index'].innerHTML.includes('<img'));assert.equal(t.nodes['note-count'].textContent,1);
 const notesReload=setup(t.stored);assert(notesReload.c.AshenReaderNotes.checkpoint('test-02',14).includes('&lt;img'));assert(!notesReload.c.AshenReaderNotes.checkpoint('test-01',14).includes('&lt;img'));
 const deletion={closest:()=>box};t.root.listeners.click({target:{closest:s=>s==='[data-note-delete]'?deletion:null}});assert.equal(t.nodes['note-count'].textContent,0);
 c.localStorage.setItem=()=>{throw Error('denied');};text.value='ملاحظة';t.root.listeners.input({target:{closest:()=>box}});assert(status.textContent.includes('تعذّر'));assert(c.AshenReaderNotes.checkpoint('test-02',14).includes('ملاحظة'));
 const broken=setup({'ashen.reader-settings.v1':'{bad','ashen.reading-progress.v1':'{"chapterId":"test-01","language":"__proto__","line":3}','ashen.reader-notes.v1':'null'});assert.equal(broken.r.progress(),null);assert(broken.c.AshenReadingSettings.markup().includes('Amiri'));assert(broken.c.AshenReaderNotes.checkpoint('test-02',14).includes('دوّن'));
 // Intermediate restore frames and cancelled navigation must not overwrite bookmarks.
 const moving=setup({'ashen.reading-progress.v1':JSON.stringify({chapterId:'test-02',language:'ar',line:20})});moving.c.matchMedia=()=>({matches:false});let queue=[];moving.c.requestAnimationFrame=f=>{queue.push(f);return queue.length;};moving.r.mount(moving.r.resolve('#chapter/test-02/ar'));await tick();queue.shift()(0);queue.shift()(0);queue.shift()(300);assert(moving.c.scrollY>0&&moving.c.scrollY<3636);assert.equal(moving.r.progress().line,20);moving.r.unmount();while(queue.length)queue.shift()(1500);assert.equal(moving.r.progress().line,20);
 console.log('PASS: chapter navigation, 60 bilingual paragraphs, checkpoints, numeric/name search, folder filtering, per-chapter progress, reload/language switch, settings persistence, notes save/delete/escaping/storage failure, invalid storage and cancelled smooth restoration.');
})().catch(e=>{console.error(e);process.exit(1);});
