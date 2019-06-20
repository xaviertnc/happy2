/* globals HAPPY */
HAPPY.customFieldFinder = function() {
  let form = this, fieldInfoArray = [];
  let fieldElements = form.el.querySelector('.field');
  fieldElements.forEach(function(el) {
    let fieldType = el.getAttribute('data-type') || 'text'; // Optional
    fieldInfoArray.push({ el: el, type: fieldType });
  });
  return fieldInfoArray;
};

let myHappyForm = HAPPY.addForm({ el: document.querySelector('#myform') });

myHappyForm.addFieldFinder(HAPPY.customFieldFinder);

myHappyForm.addFieldSelector('#myfilefield');
myHappyForm.addFieldSelector('.myfield');

myHappyForm.addField({
  el: document.querySelector('#birthday-field'),
  type: 'birthday'
});

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
    let field = this, fieldValue = field.getValue(), happyMessages = [];
    do {
      if ( ! isSubmit) { break; }
      if (field.isRequired && ! fieldValue) {
        let happyMessage = new HAPPY.Message('error', 'This field is required.');
        happyMessages.push(happyMessage);
        field.isHappy = false;
        break;
      }
    }
    while (0);
    return happyMessages;
  },
  tabOrder: 2
});

// Run!
myHappyForm.init({
  'myform_field2': {
    minVal: 50,
    maxVal: 100,
    requiredText: 'Is Required',
    invalidText: 'Please enter a valid number.'
  }
});