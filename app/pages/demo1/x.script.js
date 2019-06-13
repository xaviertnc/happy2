/* globals window, F1, Happy2, HappyInput, HappyField */
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
    
    debug: true,

    validators: {
      'required'    : function (isSubmit) {
                        let happy2item = this;
                        let ok = happy2item.value && !!happy2item.value.length;
                        F1.console.log('Validate.required(), isSubmit:', isSubmit, ', ok:', ok);
                        return ok;
                      },

      'length'      : function (min, max, isSubmit) {
                        let happy2item = this;
                        let ok = happy2item.value && happy2item.value.length >= min && happy2item.value.length <= max;
                        F1.console.log('Validate.length(), value:', happy2item.value, ', min:', min, ', max:', max, ', isSubmit:', isSubmit, ', ok:', ok);
                        return ok;
                      },

      'minLength'   : function (min, isSubmit) {
                        let happy2item = this;
                        let ok = happy2item.value && happy2item.value.length >= min;
                        F1.console.log('Validate.minLength(), value:', happy2item.value, ', min:', min, ', isSubmit:', isSubmit, ', ok:', ok);
                        return ok;
                      },

      'between'     : function (min, max, isSubmit) {
                        let happy2item = this;
                        let ok = happy2item.value && happy2item.value >= min && happy2item.value <= max;
                        F1.console.log('Validate.between(), value:', happy2item.value, ', min:', min, ', max:', max, ', isSubmit:', isSubmit, ', ok:', ok);
                        return ok;
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

    customConfig: {
      HappyMessage: {
        requiredText : 'Voltooi asb.',
        invalidText  : 'Ongeldig'
      },

      HappyMessageAnchor: {

      },

      HappyInput: {
        messageAnchorsSelector: '.input-messages'
        //inputContainerSelector: '.input-wrapper'
      },

      HappyField: {
        errorClass: '.has-error'
      },

      MultiValueField: {
        gomtor: 'Ek is BAKGAT!'
      },

      Happyform: {

      },

      HappyDocument: {

      }
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


  F1.console.log('This is AFTER Page 1 loaded succesfully!');

});
