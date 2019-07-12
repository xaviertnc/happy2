/* globals window, F1, Happy, HappyField, HappyInput */
/* eslint-env es6 */

window.F1 = window.F1 || { afterPageLoadScripts: [] };


F1.afterPageLoadScripts.push(function initPage1() {

  class AgeInput extends HappyInput {
    hello(name, age) { return 'Hello ' + name + '! Your age is: ' + age; }
  }

  class MultiValueField extends HappyField {
    constructor(options, happy$) { super(options, happy$); this.subValidateInputs = true; }
  }

  class FullNameField extends MultiValueField {}
  class BirthdayField extends MultiValueField {}

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
  happy.customClasses.fields.fullname = FullNameField;
  happy.customClasses.fields.birthday = BirthdayField;

  happy.mount({
    el: document.body.querySelector('#happydoc'),
    unhappyClass: 'has-error'
  });

  happy.focusUnhappy('.has-error > input, .has-error > .input');

  F1.console.log('Page 1 initialized - ok');

});
