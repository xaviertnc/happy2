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

  let happy = new Happy({
    validators: {
      required: function(rule) {
        if ( ! this.value || ! this.value.length) {
          return rule.arg || 'required';
        }
      },
      minLength: function(rule) {
        if ( ! this.value || this.value.length < rule.arg) {
          return rule.arg[1] || ('minLength = ' + rule.arg);
        }
      }
    }
  });

  happy.customClasses.inputs.age = AgeInput;
  happy.customClasses.fields.birthday = BirthdayField;

  happy.mount({
    el: document.body.querySelector('form'),
    unhappyClass: 'has-error'
  });

  F1.console.log('Page 1 initialized - ok');

});
