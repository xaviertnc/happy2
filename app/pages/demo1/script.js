/* globals window, F1, HappyDoc, HappyField, HappyInput */
/* eslint-env es6 */

window.F1 = window.F1 || { afterPageLoadScripts: [] };


F1.afterPageLoadScripts.push(function initPage1() {

  class AgeInput extends HappyInput {

    hello(name, age)
    {
      return 'Hello ' + name + '! Your age is: ' + age;
    }

  }


  class MultiValueField extends HappyField {

  }


  class BirthdayField extends MultiValueField {

  }


  F1.happyDoc = new HappyDoc({

    debug: true,

    customMessageTypes: {},

    customMessageGroupTypes: {},

    customInputTypes: {
      age: AgeInput
    },

    customFieldTypes: {
      multiValue : MultiValueField,
      birthday   : BirthdayField
    },

    customFormTypes: {},

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


  let elHappyDoc = document.querySelector('#happy2doc');

  F1.console.log('elHappyDoc:', elHappyDoc);

  F1.happyDoc.mount({ el: elHappyDoc });

  F1.console.log('This is AFTER Page 1 loaded succesfully!');

});
