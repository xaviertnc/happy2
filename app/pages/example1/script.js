/* eslint-env es6 */

window.F1 = window.F1 || { afterPageLoadScripts: [] };
F1.afterPageLoadScripts.push(function initPage1()
{

  class AgeInput extends HappyInput {
    hello(name, age) {
      return 'Hello ' + name + '! Your age is: ' + age;
    }
  }


  class MultiValueField extends HappyField {}


  class BirthdayField extends MultiValueField {}


  F1.happy2 = new Happy2({

    validators: {
      'required'    : function (inputElement) {
                        if (inputElement.value && inputElement.value.length) { return; }
                        return new HappyMessage('REQUIRED ERROR');
                      },

      'length'      : function (inputElement, min, max) {
                        if (val && val.length >= min && val.length <= max) { return; }
                        return 'LENGTH ERROR';
                      },

      'minLength'   : function (inputElement, min) {
                        if (val && val.length >= min) { return; }
                        return 'MIN LENGTH ERROR';
                      },

      'between'     : function (inputElement, min, max) {
                        if (val && val >= min && val <= max) { return; }
                        return 'RANGE ERROR';
                    }
    },

    customMessageTypes: {},

    customMessageAnchorTypes: {},

    customInputTypes: {
      'age': AgeInput
    },

    customFieldTypes: {
      'multi-value' : MultiValueField,
      'birthday'    : BirthdayField
    },

    customFormTypes: {},

    defaults: {
      messages: {
        required : 'Voltooi asb.',
        invalid  : 'Ongeldig'
      },
      inputs: {
        messageAnchorsSelector: '.input-messages'
      },
      fields: {
        errorClass: '.has-error'
      },
      forms: {},
      docs: {}
    }

  });


  F1.happy2.init(
    // Initial values
    // If NO initial values, inital values are
    // taken from the HTML document.
    {},
    // Saved values
    // Overrides initial values and affects the
    // document's state. e.g. modified etc.
    {
      'doc1': {
        'form1': {
          'field1': {
            'form_1[firstname]': 'Neels',
            'form_1[lastname]': ''
          },
          'field2': {
            'form_1[number]': ''
          }
        }
      }
    }
  );

  console.log('This is AFTER Page 1 loaded succesfully!');

});
