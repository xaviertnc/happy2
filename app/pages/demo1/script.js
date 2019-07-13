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
          return rule.arg ? rule.arg : (this.label ? this.label + ' is required' : 'required');
        }
      },
      ishappy: function(rule) {
        // F1.console.log('Validate::ishappy(),', rule, reason, this.happy);
        if ( ! this.happy) {
          return rule.arg ? rule.arg : (this.label ? this.label + ' is unhappy' : 'unhappy');
        }
      },
      minLength: function(rule) {
        if (this.value.length > 0 && this.value.length < rule.arg) {
          return rule.args[1] ? rule.args[1] : ('minLength = ' + rule.arg);
        }
      },
      zaEmail: function(rule) { // function(rule, reason)
        let re = new RegExp('\\.coza$', 'i');
        if (re.test(this.value)) { return rule.arg || 'Invalid TLD ".coza". Try ".co.za"'; }
        re = new RegExp('^([\\w-]+(?:\\.[\\w-]+)*)@((?:[\\w-]+\\.)*\\w[\\w-]{0,66})\\.([a-z]{2,6}(?:\\.[a-z]{2})?)$', 'i');
        if ( ! re.test(this.value)) {
          return rule.arg ? rule.arg : 'Email must be valid! e.g. john.doe@demo.com';
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
