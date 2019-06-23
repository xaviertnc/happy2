/* globals HAPPY, HappyField, HappyInput */

class MultiValueField extends HappyField {}
class BirthdayField extends MultiValueField {}
class AgeInput extends HappyInput {
  hello(name, age) {
    return 'Hello ' + name + '! Your age is: ' + age;
  }
}

HAPPY.typeClassMap.field.birthday = BirthdayField;
HAPPY.typeClassMap.input.age = AgeInput;

HAPPY.customFieldFinder = function() {
  let form = this;
  let fieldElements = form.el.querySelectorAll('.field');
  fieldElements.forEach(function(el) {
    let fieldType = el.getAttribute('data-type') || 'text'; // Optional
    HAPPY.addField({ el: el, TypeClass: HAPPY.typeClassMap.field[fieldType] });
  });
};

HAPPY.validators = {
  fullname: function() { return false; },
  birthday: function() { return false; }
};

HAPPY.cleaners = {
  name   : function() {},
  date   : function() {},
  number : function() {}
};

let myHappyForm = HAPPY.addForm({ el: document.querySelector('#myform') });

// myHappyForm.setOpt('fieldSelector', '.field');
// -- AND/OR --
// myHappyForm.setOpt('fieldSelector', '#field1,#field2,#field3');
// -- AND/OR --
myHappyForm.extend({ getFields: HAPPY.customFieldFinder });

myHappyForm.addField({ el: document.querySelector('#birthday'), TypeClass: BirthdayField });

/**
 * If we provide no "type" property, we rely on the default HappyField
 * class getter methods to extract any required field information!
 * If a field's HTML contains info on tab-order, we can override or
 * use HappyField::getTabOrder() to get the field's tab order.
 * The same applies to getters for ID, Name, Label etc.
 */
myHappyForm.addField({
  el: document.querySelector('#fullname'),
  getValue: function() {
    return this.inputs[0].getValue() + ',' + this.inputs[1].value();
  },
  validate: function(event, isSubmit) {
    let field = this, fieldValue = field.getValue();
    let happyMessages = [], happyMessage;
    switch (true) {
    case (!isSubmit): break;
    case (field.isRequired && !fieldValue):
      happyMessage = new HAPPY.classes.Message('error', 'This field is required.');
      happyMessages.push(happyMessage);
      field.isHappy = false;
      break;
    }
    return happyMessages;
  },
  tabOrder: 2
});

myHappyForm.getField('birthday').setOpt('minYear', 2000);

let myNumberField = HAPPY.getField('mynumber');
if (myNumberField) {
  myNumberField.extend({
    minVal: 50,
    maxVal: 100,
    requiredText: 'Is Required',
    invalidText: 'Please enter a valid number.'
  });
}

myHappyForm.mount();

// - OR -
// HAPPY.mount();