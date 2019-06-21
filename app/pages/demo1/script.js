/* globals window, F1, HAPPY, HappyField, HappyInput */
/* eslint-env es6 */

window.F1 = window.F1 || { afterPageLoadScripts: [] };


F1.afterPageLoadScripts.push(function initPage1() {

  class MultiValueField extends HappyField {}
  class BirthdayField extends MultiValueField {}
  class AgeInput extends HappyInput {
    hello(name, age) {
      return 'Hello ' + name + '! Your age is: ' + age;
    }
  }

  HAPPY.typeClassMap.field.birthday = BirthdayField;
  HAPPY.typeClassMap.input.age = AgeInput;
  HAPPY.addDoc({ el: document.body.querySelector('#happydoc') });
  HAPPY.mount();

  F1.console.log('Page 1 initialized - ok');

});
