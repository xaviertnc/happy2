/* eslint-env es6 */


/**
 * Happy2JS
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  14 May 2018
 *
 */

class HappyValidation {

  constructor(validationDef) {
    let args = validationDef.split(':');
    this.type = args.shift();
    this.args = args;
  }

}
// end: HappyValidation



class HappyItem {

  constructor(happy2type, happy2parent, options) {
    options = options || {};
    // console.log('HappyItem.constructor(), happy2type:', happy2type, ', opt.elm:', options.elm, ', opt.sel:', options.selector);
    // console.log('HappyItem.constructor(), happy2parent:', happy2parent, ', options:', options);
    this.happy2type = happy2type || 'doc';
    this.happy2parent = happy2parent || { nextId: 1, getOpt: function(){} };
    this.happy2doc = this.happy2parent.happy2doc || this;
    Object.assign(this, options);
    if ( ! this.elm) { this.elm = this.findDOMElement(this.selector); }
    if ( ! this.id)  { this.id = this.getId(); }
    this.elm.happy2item = this;
    this.nextId = 1;
    this.state = {};
  }

  getStoredState() {

  }

  storeState() {

  }

  resolve(source, args) {
    // console.log('HappyItem.resolve(), source:', source, ', args:', args);
    if (typeof source !== 'function') { return source; }
    // Assign RESOLVED as a STATIC value on the resolve function!
    source.RESOLVED = source.apply(this, args);
    return source.RESOLVED;
  }

  resolveOnce(source, args) {
    if (typeof source !== 'function') { return source; }
    if ( ! source.RESOLVED) { source.RESOLVED = source.apply(this, args); }
    return source.RESOLVED;
  }

  resolveOpt(optName) {
    return this.resolve(this.getOpt(optName));
  }

  getOpt(optName) {
    return typeof this[optName] === 'undefined' ? this.happy2parent.getOpt(optName) : this[optName];
  }

  getId() {
    let id = this.happy2type + this.happy2parent.nextId++;
    if (this.happy2parent.id) { id = this.happy2parent.id + '_' + id; }
    return id;
  }

  findDOMElement(selector, parentElm) {
    let elm = (parentElm || document).querySelector(selector);
    // console.log('HappyItem.findDOMElement(), elm:', elm);
    return elm;
  }

  findDOMElements(selector, parentElm) {
    return (parentElm || document).querySelectorAll(selector);
  }

  getElementTypeAttribute(itemDOMElement) {
    return itemDOMElement.getAttribute('data-type');
  }

  initUsingStore() {
    this.state = this.getStoredState();
    if (!this.state) {
      return;
    }
    console.log('HappyItem - Initialized using STORE:', this);
  }

  update(event, isSubmit) {
    console.log('HappyItem.update(), target:', event.target, ', isSubmit:', isSubmit);
    this.lastValue = this.value;
    this.value = this.clean(this.getValue());
    this.validate(event, isSubmit);
    this.updateDOM();
  }

  updateDOM() {
    console.log('HappyItem.updateDOM()');
  }

  check() {
    console.log('HappyItem.check()');
    this.update();
  }

}
// end: HappyItem



class HappyCanValidate extends HappyItem {

  constructor(happy2type, happy2parent, options) {
    super(happy2type, happy2parent, options);
    this.messageAnchorDOMElements = this.findMessageAnchors();
    if (this.messageAnchorDOMElements) {
      this.messageAnchors = this._parseMessageAnchorElements();
    }
    this.validations = this.getValidations();
  }

  getValidations() {
    let self = this;
    let validations = [];
    let validationsString = this.elm.getAttribute('data-validate');
    if ( ! validationsString) { return validations; }
    let validationDefs = validationsString.split('|');
    validationDefs.forEach(function createValidation(validationDef) {
      let validation = new HappyValidation(validationDef);
      validations.push(validation);
    });
    return validations;
  }

  addValidation(validation) {

  }

  addMessageAnchor(messageAnchor) {

  }

  findMessageAnchors() {
    if ( ! this.messageAnchorsSelector) { return []; }
    return this.findDOMElements(this.messageAnchorsSelector, this.elm);
  }

  getAnchorElementTypeAttribute(anchorElement) {
    return this.getElementTypeAttribute(anchorElement);
  }

  getHappyMessageAnchorType(anchorElement) {
    let anchorType = this.getAnchorElementTypeAttribute(anchorElement);
    if ( ! anchorType) { return HappyMessageAnchor; }
    return this.happy2doc.customMessageAnchorTypes[anchorType] || HappyMessageAnchor;
  }

  _parseMessageAnchorElements() {
    let messageAnchors = [], happy2item = this;
    if ( ! this.messageAnchorDOMElements.length) { return messageAnchors; }
    this.messageAnchorDOMElements.forEach(function createMessageAnchor(anchorElement, index) {
      let anchorOptions = { elm: anchorElement };
      let HappyMessageAnchorType = happy2item.getHappyMessageAnchorType(anchorElement);
      let messageAnchor = new HappyMessageAnchorType(happy2item, anchorOptions);
      messageAnchors.push(messageAnchor);
    });
    return messageAnchors;
  }

  isUnhappy(isSubmit, data) {

  }

  check(event, isSubmit) {
    console.log('HappyCanValidate.check(), event.target:', event.target, ', isSubmit:', isSubmit);
    this.lastValue = this.value;
    this.value = this.parseViewValue(this.getValue());
    console.log('HappyCanValidate.check(), this.value:', this.value, ', this.lastValue:', this.lastValue);
    let validateResult = this.validate(event, isSubmit);
    this.update(validateResult);
    this.updateDOM(validateResult);
    this.trigger(event, validateResult);
  }

  parseViewValue(val) {
    return val;
  }

  getValue() {
    switch(this.happy2type)
    {
      case 'input':
        return this.elm.value;

      case 'field':
        let inputValues = [];
        this.inputDOMElements.forEach(function pushInputValue(inputElm) {
          inputValues.push(inputElm.value);
        });
        return inputValues.join(',');

      default:
        return;
    }
  }

  validate(event, isSubmit) {
    let happy = true;
    let happy2input = this;
    let validationMessage = null;
    let validators = this.happy2doc.validators;
    if ( ! this.validations) { return happy; }
    this.validations.forEach(function testValid(validation) {
      let validator = validators[validation.type];
      if (validator) {
        validationMessage = validator.apply(happy2input, validation.args);
        if (validationMessage) { happy2input.addMessage(validationMessage); }
        return happy = false;
      }
    });
    this.state.happy = happy;
    this.state.unhappy = !this.state.happy;
    console.log('HappyCanValidate.validate(), happy:', happy, ', messages:', this.messages);
    return happy;
  }

  update() {
    console.log('HappyCanValidate.update(), target:', event.target, ', isSubmit:', isSubmit);
  }

  updateDOM() {
    console.log('HappyCanValidate.updateDOM()');
  }

  trigger(event, data) {
    console.log('HappyCanValidate.trigger(), event:', event, ', data:', data);
  }

}
// end: HappyCanValidate



class HappyMessage extends HappyItem {

  //  ID
  //  TYPE
  //  STATE
  //  ZONE
  //  DATA
  //  TEMPLATE
  //  TEXT
  //  $ELM
  constructor(happy2anchor, options) {
    super('message', happy2anchor, options);
  }

}
// end: HappyMessage



class HappyMessageAnchor extends HappyItem {

  constructor(happy2parent, options) {
    super('anchor', happy2parent, options);
    this.messageDOMElements = this.findMessages();
    this.messages = this._parseMessageElements();
  }

  findMessages() {
    return this.findDOMElements(this.happy2doc.messageSelector, this.elm);
  }

  getMessageElementTypeAtrribute(messageElement) {
    return this.getElementTypeAttribute(messageElement);
  }

  getHappyMessageType(messageElement) {
    let messageType = this.getMessageElementTypeAtrribute(messageElement);
    if ( ! messageType) { return HappyMessage; }
    return this.happy2doc.customMessageTypes[messageType] || HappyMessage;
  }

  addMessage(messageInfo) {
    let message = new HappyMessage(messageInfo || {});
    this.messages.push(message);
  }

  removeMessage(message) {

  }

  removeAllMessages() {

  }

  _parseMessageElements() {
    let messages = [],
        happy2doc = this.happy2doc,
        happy2anchor = this;
    if ( ! this.messageDOMElements.length) { return messages; }
    // console.log('HappyInput._parseMessageElements(), messageDOMElements:', this.messageDOMElements);
    this.messageDOMElements.forEach(function createMessage(messageElement, index) {
      let messageOptions = { elm: messageElement };
      let HappyMessageType = happy2anchor.getHappyMessageType(messageElement);
      let message = new HappyMessageType(happy2anchor, messageOptions);
      messages.push(message);
    });
    return messages;
  }

}
// end: HappyMessageAnchor



class HappyInput extends HappyCanValidate {

  constructor(happy2parent, options) {
    options = options || {};
    options.messageAnchorsSelector = options.messageAnchorsSelector || '.messages';
    super('input', happy2parent, options);
    console.log('HappyInput - Initialized', this);
  }

  findInputContainer() {
    if ( ! this.elm) { return; }
    let parentDOMElement = this.elm.parentElement;
    if (parentDOMElement.matches(this.getOpt('inputContainerSelector'))) { return parentDOMElement; }
  }

  // Only look for message anchors that are specifically related to this input.
  // i.e. Message anchors that are within the CONTAINER of this input!
  findMessageAnchors() {
    let inputContainerDOMElement = this.findInputContainer();
    if ( ! inputContainerDOMElement) { return []; }
    return this.findDOMElements(this.messageAnchorsSelector, inputContainerDOMElement);
  }

  check(event, isSubmit) {
    console.log('HappyInput.check(), target:', event.target, ', isSubmit:', isSubmit);
  }

}
// end: HappyInput



class HappyField extends HappyCanValidate {

  constructor(happy2parent, options) {
    options = options || {};
    super('field', happy2parent, options);
    this.inputDOMElements = this.findInputElements();
    this.happyInputs = this._parseInputElements();
    this.bindUpdateTriggers();
    console.log('HappyField - Initialized', this);
  }


  findInputElements() {
    return this.findDOMElements(this.happy2doc.inputSelector, this.elm);
  }

  getInputElementTypeAttribute(inputElement) {
    return this.getElementTypeAttribute(inputElement);
  }

  getHappyInputType(inputElement) {
    let inputType = this.getInputElementTypeAttribute(inputElement);
    if ( ! inputType) { return HappyInput; }
    return this.happy2doc.customInputTypes[inputType] || HappyInput;
  }

  _parseInputElements() {
    let happyInputs = [],
        happy2field = this;
    if (!this.inputDOMElements.length) { return happyInputs; }
    this.inputDOMElements.forEach(function createHappyInput(inputElement, index) {
      let inputOptions = { elm: inputElement };
      let HappyInputType = happy2field.getHappyInputType(inputElement);
      let happyInput = new HappyInputType(happy2field, inputOptions);
      happyInputs.push(happyInput);
    });
    return happyInputs;
  }

  // Bind a global handler to the fieldElement, which should be
  // the parent of all field inputs!
  bindUpdateTriggers() {
    let happy2field = this;
    this.elm.addEventListener('change', function inputChangeHandler(event) {
      let happy2input = event.target.happy2item;
      if (happy2input && happy2input.validations.length) {
        happy2input.check(event)
      } else {
        happy2field.check(event);
      }
    }, true);
  }

  check(event, isSubmit) {
    console.log('HappyField.check(), target:', event.target, ', isSubmit:', isSubmit);
  }

}
// end: HappyField



class HappyForm extends HappyCanValidate {

  constructor(happy2doc, options) {
    options = options || {};
    super('form', happy2doc, options);
    this.fieldDOMElements = this.findFieldElements();
    this.happyFields = this._parseFieldElements();
    console.log('HappyForm - Initialized', this);
  }

  findFieldElements() {
    return this.findDOMElements(this.happy2doc.fieldSelector, this.elm);
  }

  getFieldElementTypeAttribute(fieldElement) {
    return this.getElementTypeAttribute(fieldElement);
  }

  getHappyFieldType(fieldElement) {
    let fieldType = this.getFieldElementTypeAttribute(fieldElement);
    if ( ! fieldType) { return HappyField; }
    return this.happy2doc.customFieldTypes[fieldType] || HappyField;
  }

  _parseFieldElements() {
    let happyFields = [],
        happy2form = this;
    if (!this.fieldDOMElements.length) { return happyFields; }
    this.fieldDOMElements.forEach(function createHappyField(fieldElement, index) {
      let fieldOptions = { elm: fieldElement };
      let HappyFieldType = happy2form.getHappyFieldType(fieldElement);
      let happyField = new HappyFieldType(happy2form, fieldOptions);
      happyFields.push(happyField);
    });
    return happyFields;
  }

}
// end: HappyForm



class HappyDocument extends HappyCanValidate {

  constructor(options) {
    options = options || {};
    options.selector = options.selector || '.happy2doc';
    options.formSelector = options.formSelector || 'form';
    options.fieldSelector = options.fieldSelector || '.field';
    options.inputSelector = options.inputSelector || 'input,textarea,select';
    options.inputContainerSelector = options.inputContainerSelector || '.input-container';
    options.messageSelector = options.messageSelector || '.message';
    options.customMessageTypes = options.customMessageTypes || [];
    options.customMessageAnchorTypes = options.customMessageAnchorTypes || [];
    options.customInputTypes = options.customInputTypes || [];
    options.customFieldTypes = options.customFieldTypes || [];
    options.customFormTypes = options.customFormTypes || [];
    options.validators = options.validators || {};
    super('doc', null, options);
    this.formDOMElements = this.findFormElements();
    this.happyForms = this._parseFormElements();
    console.log('HappyDocument - Initialized', this);
  }

  findFormElements() { return this.findDOMElements(this.formSelector, this.elm); }

  getFormElementTypeAttribute(formElement) {
    return this.getElementTypeAttribute(formElement);
  }

  getHappyFormType(formElement) {
    let formType = this.getFormElementTypeAttribute(formElement);
    if ( ! formType) { return HappyForm; }
    return this.customFormTypes[formType] || HappyForm;
  }

  _parseFormElements() {
    let happyForms = [],
        happy2doc = this;
    if (!this.formDOMElements.length) { return happyForms; }
    this.formDOMElements.forEach(function createHappyForm(formElement, index) {
      let formOptions = { elm: formElement };
      let HappyFormType = happy2doc.getHappyFormType(formElement);
      let happyForm = new HappyFormType(happy2doc, formOptions);
      happyForms.push(happyForm);
    });
    return happyForms;
  }

}
// end: HappyDocument
