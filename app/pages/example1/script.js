/* eslint-env es6 */

window.F1 = window.F1 || { afterPageLoadScripts: [] };
F1.afterPageLoadScripts.push(function initPage1()
{

  class AgeInput extends HappyInput {
    hello(name, age) {
      return 'Hello ' + name + '! Your age is: ' + age;
    }
  }

  class BirthdayField extends HappyField {
    getInputModel(inputDOMElement) {
      let inputModelType = fieldDOMElement.className;
      let model = this.happy2doc.inputModels[inputModelType];
      return model || this.happy2doc.customInputModels[inputModelType];
    }
  }

  class MultiInputField extends HappyField {

  }


  F1.happy2doc = new HappyDocument({

    customInputModels: {
      'age': AgeInput
    },

    customFieldModels: {
      'birthday'    : BirthdayField,
      'multi-input' : MultiInputField
    }

  });

  console.log('This is AFTER Page 1 loaded succesfully!');

});
