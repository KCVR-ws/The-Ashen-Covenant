// قائمة الفصول؛ النصوص منفصلة في data/chapters.js ومنطق القراءة في scripts/reader.js.
window.AshenPages = window.AshenPages || {};
window.AshenPages.chapters = {
  title: 'الفصول',
  render: () => window.AshenReader.list()
};
