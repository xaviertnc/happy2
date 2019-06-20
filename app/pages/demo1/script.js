/* globals window, F1, HappyDoc, HappyField, HappyInput */
/* eslint-env es6 */

window.F1 = window.F1 || { afterPageLoadScripts: [] };


F1.afterPageLoadScripts.push(function initPage1() {


  class MultiValueField extends HappyField {

  }


  class BirthdayField extends MultiValueField {

  }


  class AgeInput extends HappyInput {

    hello(name, age)
    {
      return 'Hello ' + name + '! Your age is: ' + age;
    }

  }


  HappyJS.configure({

    customDocOptions: {
      formSelector : '.form',
      summarySelector: '.docsummary',
      requiredText: 'Value is required.',
      invalidText: 'Value is invalid.',
      messagePlacement: 'append',
    },

    customFormOptions: {
      fieldSelector : '.field',
      summarySelector: '.formsummary',
      model :  {
        getFieldType: function(item) { return item.el.type; } // NB!
      }
    },

    customFieldOptions: {
      inputSelector : '.input',
      model :  {
        getInputType: function(item) { return item.el.type; }, // NB!
        getValidators: function(item) {}
      }
    },

    customInputOptions: {
      model :  {
        validate: function() {},
        addMessage: function() {},
        removeMessages: function() {},
        getValidators: function(item) {
          // Check attrs: data-validate, required, min, max, type, pattern...
          // Also check field element for more validators...
          return item.el.getAttribute('data-validate');
        }
      }
    },

    customFieldTypeClassMap: {
      birthday: BirthdayField
    },

    // Map input element types to their HappyInput classes
    customInputTypeClassMap: {
      age: AgeInput
    },

    customValidators: {
      fullname: function() { return false; },
      birthday: function() { return false; }
    },

    customCleaners: {
      name   : function() {},
      date   : function() {},
      number : function() {}
    }

  });

  HappyJS.mount('doc', '#happydoc');


  F1.console.log('Page 1 initialized - ok');

});
