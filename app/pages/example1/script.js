/* eslint-env es6 */

window.F1 = window.F1 || { afterPageLoadScripts: [] };
F1.afterPageLoadScripts.push(function initPage1()
{



  class AgeInput extends HappyInput {
    hello(name, age) {
      return 'Hello ' + name + '! Your age is: ' + age;
    }
  }


  class MultiTextField extends HappyField {

  }


  class BirthdayField extends MultiTextField {

  }


  F1.happy2doc = new HappyDocument({

    customInputTypes: {
      'age': AgeInput
    },

    customFieldTypes: {
      'multi-text'  : MultiTextField,
      'birthday'    : BirthdayField
    },

    validators: {
      'required'    : function (inputElement) {
                        if (inputElement.value && inputElement.value.length) { return; }
                        return new HappyMessage('REQUIRED ERROR');
                      },

      'length'      : function (inputElement, min, max) {
                        if (val && val.length >= min) { return; }
                        return 'LENGTH ERROR';
                      },

      'between'     : function (inputElement, min, max) {
                        if (val && val >= min && val <= max) { return; }
                        return 'RANGE ERROR';
                    }
    }

  });

  console.log('This is AFTER Page 1 loaded succesfully!');

});
