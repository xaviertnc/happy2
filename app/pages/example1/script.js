window.F1 = window.F1 || { afterPageLoadScripts: [] };
F1.afterPageLoadScripts.push(function initPage1() {
  console.log('This is AFTER Page 1 loaded succesfully!');
  // F1.h2e = new F1.H2.Entity(1, 'field', '.form-field input');
  F1.happy2doc = new HappyDocument();
});
