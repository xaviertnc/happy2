/* globals window, F1, Happy2, HappyInput, HappyField */
/* eslint-env es6 */

window.F1 = window.F1 || { afterPageLoadScripts: [] };


F1.afterPageLoadScripts.push(function initPage1()
{

  F1.happyForm = new HappyForm({ el: document.body.querySelector('#form_1'), debug: true });

  F1.console.log('F1 HappyForm Initialized:', F1.happyForm);
  F1.console.log('This is AFTER Page 1 loaded succesfully!');

});
