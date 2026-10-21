# قائمة الفصول والقارئ

- `data/chapters.js`: بيانات الفصول. الفصل المؤقت `test-01` يحتوي 30 فقرة عربية و30 فقرة إنجليزية مقابلة، وموسوم `demo: true`.
- `pages/chapters.js`: مدخل عرض القائمة الواحدة المرتبة حسب ترتيب البيانات.
- `scripts/reader.js`: عرض النص، لغة الفصل، السابق والتالي، حفظ موضع الفقرة، وزر إكمال القراءة في الرئيسية.
- `styles/reader.css`: التنسيق الخاص بالقائمة والقارئ وتفصيل الموضع أسفل زر الرئيسية.
- `scripts/app.js`: يربط المسار `#chapter/test-01/ar` بالقارئ ويحافظ على الدخولية والتلاشي.

كل عنصر داخل `lines.ar` أو `lines.en` فقرة منطقية؛ التفافها إلى عدة أسطر يعتمد على الشاشة. عند تبديل اللغة، يُستعاد رقم الفقرة المناظر. عند إضافة ترجمات حقيقية، حافظ على توافق ترتيب الفقرات.

الحفظ في localStorage بمفتاح `ashen.reading-progress.v1` على المتصفح والجهاز الحالي فقط. عند تعذر الحفظ، تُستخدم ذاكرة الجلسة ويظهر توضيح للقارئ. لا توجد مزامنة حسابات. تُحفظ أول فقرة ظاهرة أثناء التمرير، وعند الخروج أو تبديل القسم، وتُستعاد بعد تحميل الخطوط. الوصول لنهاية الصفحة يحفظ الفقرة الأخيرة.

الرابط المباشر للفصل يُحفظ خلال الدخولية. القارئ لا يبدأ تسجيل التقدم قبل الدخول. القسم والقائمة بالعربية؛ زر اللغة يغيّر عنوان الفصل ونصّه واتجاههما فقط.

بعد استبدال الفصل التجريبي بفصل حقيقي، استخدم معرفًا جديدًا ثابتًا كي لا يرث النص الجديد تقدم الاختبار. النص التجريبي لا يُعتمد ضمن عالم الرواية.

التحقق: فحص JavaScript والمسارات المحلية، ومحاكاة حفظ واسترجاع الموضع وتبديل اللغة والبيانات التالفة وتعذر التخزين وإلغاء التحميل والتعامل الآمن مع النصوص. لم تتوفر معاينة متصفح في جلسة التنفيذ.

## Reading appearance and motion

` scripts/reader-settings.js ` owns the reading controls and persists font, size,
line spacing and dark/paper/light theme in `ashen.reader-settings.v1`.
Six font names appear in English. Amiri and Cormorant Garamond are bundled;
other choices use installed system fonts, with fallbacks for unavailable fonts
or unsupported Arabic glyphs. Appearance applies to the reader only.

Section and chapter navigation fades the content without moving the fixed sidebar.
Saved positions restore after fonts are ready with a bounded eased scroll.
Progress is not overwritten during restoration; user scrolling interrupts it.
Reduced-motion preferences skip both effects.

## Chapter library, annotations and expanded controls

- `scripts/chapter-library.js` groups chapter numbers in folders of 20, remembers
  folder expansion for the current visit, and searches all folders by title or
  exact chapter number. Arabic and Persian digits are normalized. The most recent
  chapter's folder opens automatically, and a resume card links to it.
- `scripts/reader-notes.js` inserts a collapsed annotation after every 15 logical
  paragraphs. Notes have an event/character/theory category and a 3,000-character
  limit. They autosave locally, support editing/deletion, and appear in the
  chapter's notebook with a jump back to each annotation. Notes share paragraph
  anchors between translations. Reordering published paragraphs requires a
  migration of stored notes and progress.
- `scripts/reader-settings.js` now also controls text width, paragraph spacing,
  focus mode, annotation visibility and smooth/direct position restoration.
  A single inline panel moves between the top and bottom settings buttons.
  Focus mode has an explicit exit button and is removed on navigation away.
- `ashen.chapter-progress.v1` stores progress per chapter; the original
  `ashen.reading-progress.v1` still identifies the most recently read chapter.
  Existing progress and appearance settings remain compatible.
- `ashen.reader-notes.v1` stores annotations on this browser only. No account or
  cross-device synchronization is implied. Failed storage writes show a warning
  and retain edits in memory for the current visit.
- Demo `test-02`, “الدفتر الأزرق / The Blue Notebook”, contains 60 corresponding
  paragraphs per language and four annotation points. It is not novel canon.
- Previous/next links appear only when their destination exists and show its title.

Run `node tests/reader.test.cjs` for storage, search, navigation, annotation and
restoration regression checks. These are DOM-mock tests, not visual browser QA.
