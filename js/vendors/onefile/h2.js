/* globals document, window, exports */
/* eslint-env es6 */

/**
 * Happy2JS
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  14 May 2018
 *
 */

class Happy2Obj {

  constructor(happy2type, happy2parent, options) {
    Object.assign(this, options || {});
    this.debug = 1;
    this.state = {};
    this.nextId = 1;
    this.console = this.getConsole();
    this.happy2type = happy2type || 'obj';
    this.happy2parent = happy2parent || { nextId: 1, getOpt: function noOptions() {} };
    if ( ! this.id)  { this.id = this.getId(); }
  }

  getConsole() {
    if (this.debug && window.console) { return window.console; }
    return {
      log: function noConsoleLog() {},
      dir: function noConsoleDir() {},
      error: function reportError(errMsg) { return new Error(errMsg); }
    };
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

}
// end: HappyObj


class Happy2 extends Happy2Obj {

  constructor(options) {
    options.HappyDocumentType        = options.HappyDocumentType || HappyDocument;
    options.docSelector              = options.docSelector || '.happy2doc';
    options.formSelector             = options.formSelector || 'form';
    options.fieldSelector            = options.fieldSelector || '.field';
    options.inputSelector            = options.inputSelector || 'input,textarea,select';
    options.inputContainerSelector   = options.inputContainerSelector || '.input-container';
    options.messageSelector          = options.messageSelector || '.message';
    options.customMessageAnchorTypes = options.customMessageAnchorTypes || [];
    options.customMessageTypes       = options.customMessageTypes || [];
    options.customInputTypes         = options.customInputTypes || [];
    options.customFieldTypes         = options.customFieldTypes || [];
    options.customFormTypes          = options.customFormTypes || [];
    options.validators               = options.validators || {};
    options.happy2doc                = options.happy2doc || {};
    super(null, null, options);
    this.console.log('Happy2:', this);
  }

  init(initialValues, savedValues) {
    this.console.log('Happy2Js.init(), initialValues:', initialValues, ', savedValues:', savedValues);
    this.happy2doc = new this.HappyDocumentType(this, { selector: this.docSelector });
  }

}
// end: Happy2


class HappyItem extends Happy2Obj {

  constructor(happy2type, happy2parent, options) {
    // console.log('HappyItem.constructor(), happy2type:', happy2type, ', opt.elm:', options.elm, ', opt.sel:', options.selector);
    // console.log('HappyItem.constructor(), happy2parent:', happy2parent, ', options:', options);
    let happy2 = happy2parent.happy2 || happy2parent;
    let defaultsKey = happy2type + 's';
    let happy2defaults = happy2.defaults[defaultsKey] || {};
    super(happy2type, happy2parent, Object.assign(happy2defaults, options || {}));
    if ( ! this.elm) { this.elm = this.findDOMElement(this.selector); }
    this.elm.happy2item = this;
    this.happy2 = happy2;
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
    this.console.log('HappyItem - Initialized using STORE:', this);
  }

  update(event, isSubmit) {
    this.console.log('HappyItem.update(), target:', event.target, ', isSubmit:', isSubmit);
    this.lastValue = this.value;
    this.value = this.clean(this.getValue());
    this.validate(event, isSubmit);
    this.updateDOM();
  }

  updateDOM() {
    this.console.log('HappyItem.updateDOM()');
  }

  check() {
    this.console.log('HappyItem.check()');
    this.update();
  }

}
// end: HappyItem


class HappyCanValidate extends HappyItem {

  constructor(happy2type, happy2parent, options) {
    super(happy2type, happy2parent, options);
    this.messageAnchorsSelector = this.messageAnchorsSelector || '.happy2messages';
    this.messageAnchorDOMElements = this.findMessageAnchors();
    if (this.messageAnchorDOMElements) {
      this.messageAnchors = this._parseMessageAnchorElements();
    }
    this.validations = this.getValidations();
  }

  getValidations() {
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
    return validation;
  }

  addMessageAnchor(messageAnchor) {
    return messageAnchor;
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
    this.messageAnchorDOMElements.forEach(function createMessageAnchor(anchorElement) {
      let anchorOptions = { elm: anchorElement };
      let HappyMessageAnchorType = happy2item.getHappyMessageAnchorType(anchorElement);
      let messageAnchor = new HappyMessageAnchorType(happy2item, anchorOptions);
      messageAnchors.push(messageAnchor);
    });
    return messageAnchors;
  }

  isUnhappy(isSubmit, data) {
    return isSubmit && data;
  }

  check(event, isSubmit) {
    this.console.log('HappyCanValidate.check(), event.target:', event.target, ', isSubmit:', isSubmit);
    this.lastValue = this.value;
    this.value = this.parseViewValue(this.getValue());
    this.console.log('HappyCanValidate.check(), this.value:', this.value, ', this.lastValue:', this.lastValue);
    let validateResult = this.validate(event, isSubmit);
    this.update(validateResult);
    this.updateDOM(validateResult);
    this.notifyHappy2Listeners(event, validateResult);
  }

  parseViewValue(val) {
    return val;
  }

  getValue() {
    let inputValues = [];
    switch(this.happy2type)
    {
      case 'input':
        return this.elm.value;

      case 'field':
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
        validation.args.push(isSubmit); // Add 'isSubmit' as last arg.
        validationMessage = validator.apply(happy2input, validation.args);
        if (validationMessage) { happy2input.addMessage(validationMessage); }
        return happy = false;
      }
    });
    this.state.happy = happy;
    this.state.unhappy = !this.state.happy;
    this.console.log('HappyCanValidate.validate(), happy:', happy, ', messages:', this.messages);
    return happy;
  }

  update() {
    this.console.log('HappyCanValidate.update()');
  }

  updateDOM() {
    this.console.log('HappyCanValidate.updateDOM()');
  }

  notifyHappy2Listeners(event, data) {
    this.console.log('HappyCanValidate.notifyHappy2Listeners(), event:', event, ', data:', data);
  }

}
// end: HappyCanValidate


class HappyValidation {

  constructor(validationDef) {
    let args = validationDef.split(':');
    this.type = args.shift();
    this.args = args;
  }

}
// end: HappyValidation


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
    return this.findDOMElements(this.getOpt('messageSelector'), this.elm);
  }

  getMessageElementTypeAtrribute(messageElement) {
    return this.getElementTypeAttribute(messageElement);
  }

  getHappyMessageType(messageElement) {
    let messageType = this.getMessageElementTypeAtrribute(messageElement);
    if ( ! messageType) { return HappyMessage; }
    return this.getOpt('customMessageTypes')[messageType] || HappyMessage;
  }

  addMessage(messageInfo) {
    let message = new HappyMessage(messageInfo || {});
    this.messages.push(message);
  }

  removeMessage(message) {
    return message;
  }

  removeAllMessages() {

  }

  _parseMessageElements() {
    let messages = [],
        happy2anchor = this;
    if ( ! this.messageDOMElements.length) { return messages; }
    // console.log('HappyInput._parseMessageElements(), messageDOMElements:', this.messageDOMElements);
    this.messageDOMElements.forEach(function createMessage(messageElement) {
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
    super('input', happy2parent, options || {});
    this.console.log('HappyInput - Initialized', this);
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
    return this.findDOMElements(this.getOpt('messageAnchorsSelector'), inputContainerDOMElement);
  }

  check(event, isSubmit) {
    this.console.log('HappyInput.check(), target:', event.target, ', isSubmit:', isSubmit);
  }

}
// end: HappyInput


class HappyField extends HappyCanValidate {

  constructor(happy2parent, options) {
    super('field', happy2parent, options || {});
    this.inputDOMElements = this.findInputElements();
    this.happyInputs = this._parseInputElements();
    this.bindUpdateTriggers();
    this.console.log('HappyField - Initialized', this);
  }


  findInputElements() {
    return this.findDOMElements(this.getOpt('inputSelector'), this.elm);
  }

  getInputElementTypeAttribute(inputElement) {
    return this.getElementTypeAttribute(inputElement);
  }

  getHappyInputType(inputElement) {
    let inputType = this.getInputElementTypeAttribute(inputElement);
    if ( ! inputType) { return HappyInput; }
    return this.getOpt('customInputTypes')[inputType] || HappyInput;
  }

  _parseInputElements() {
    let happyInputs = [],
        happy2field = this;
    if (!this.inputDOMElements.length) { return happyInputs; }
    this.inputDOMElements.forEach(function createHappyInput(inputElement) {
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
    this.elm.addEventListener('change', function fieldChangeHandler(event) {
      let happy2input = event.target.happy2item;
      if (happy2input && happy2input.validations.length) {
        happy2input.check(event)
      } else {
        happy2field.check(event);
      }
    }, true);
  }

  check(event, isSubmit) {
    this.console.log('HappyField.check(), target:', event.target, ', isSubmit:', isSubmit);
  }

}
// end: HappyField


class HappyForm extends HappyCanValidate {

  constructor(happy2doc, options) {
    super('form', happy2doc, options || {});
    this.fieldDOMElements = this.findFieldElements();
    this.happyFields = this._parseFieldElements();
    this.console.log('HappyForm - Initialized', this);
  }

  findFieldElements() {
    return this.findDOMElements(this.getOpt('fieldSelector'), this.elm);
  }

  getFieldElementTypeAttribute(fieldElement) {
    return this.getElementTypeAttribute(fieldElement);
  }

  getHappyFieldType(fieldElement) {
    let fieldType = this.getFieldElementTypeAttribute(fieldElement);
    if ( ! fieldType) { return HappyField; }
    let customFieldTypes = this.getOpt('customFieldTypes') || {};
    return customFieldTypes[fieldType] || HappyField;
  }

  _parseFieldElements() {
    let happyFields = [],
        happy2form = this;
    if (!this.fieldDOMElements.length) { return happyFields; }
    this.fieldDOMElements.forEach(function createHappyField(fieldElement) {
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

  constructor(happy2, options) {
    super('doc', happy2, options || {});
    this.formDOMElements = this.findFormElements();
    this.happyForms = this._parseFormElements();
    this.console.log('HappyDocument - Initialized', this);
  }

  findFormElements() {
    return this.findDOMElements(this.getOpt('formSelector'), this.elm);
  }

  getFormElementTypeAttribute(formElement) {
    return this.getElementTypeAttribute(formElement);
  }

  getHappyFormType(formElement) {
    let formType = this.getFormElementTypeAttribute(formElement);
    if ( ! formType) { return HappyForm; }
    return this.getOpt('customFormTypes')[formType] || HappyForm;
  }

  _parseFormElements() {
    let happyForms = [],
        happy2doc = this;
    if (!this.formDOMElements.length) { return happyForms; }
    this.formDOMElements.forEach(function createHappyForm(formElement) {
      let formOptions = { elm: formElement };
      let HappyFormType = happy2doc.getHappyFormType(formElement);
      let happyForm = new HappyFormType(happy2doc, formOptions);
      happyForms.push(happyForm);
    });
    return happyForms;
  }

}
// end: HappyDocument

var exports = exports || {};
exports.Happy2 = Happy2;
