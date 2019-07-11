/* globals window, F1, Happy, HappyField, HappyInput */
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

  F1.console.log('Start Page 1...');

  let happy = new Happy();
  happy.customClasses.inputs.age = AgeInput;
  happy.customClasses.fields.birthday = BirthdayField;
  happy.mount(document.body.querySelector('form'));

  F1.console.log('Page 1 initialized - ok');

});
