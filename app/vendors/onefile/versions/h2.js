/* globals document, window, exports */
/* eslint-env es6 */

/**
 * Happy2JS
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  14 May 2018
 *
 */

class HappyObj {

  constructor(happy2parent, options) {
    Object.assign(this, options || {});
    this.debug = 1;
    this.state = {};
    this.nextId = 1;
    this.console = this.getConsole();
    this.happy2parent = happy2parent || { nextId: 0, getOpt: function noOptions() {} };
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

}
// end: HappyObj


class HappyItem extends HappyObj {

  constructor(happy2parent, options) {
    super(happy2parent, options);
    // this.console.log('HappyItem.constructor(), happy2parent:', happy2parent, ', opt.elm:', options.elm, ', opt.sel:', options.selector);
    // this.console.log('HappyItem.constructor(), options:', options);

    this.type = this.constructor.name; // i.e. Class Name
    this.happy2 = happy2parent.happy2 || happy2parent;
    let customConfig = this.happy2.customConfig[this.type] || {};

    Object.assign(this, customConfig);

    if ( ! this.id  ) { this.id = this.getId(); }
    if ( ! this.elm ) { this.elm = this.findDOMElement(this.selector); }

    this.elm.happy2item = this;
    this.happy2.happyItemsIndex[this.id] = this;
  }

  getId() {
    return this.happy2parent.isHappy2 ? this.happy2.nextId : this.happy2.nextId++;
  }

  getName() {
    if (this.baseType === 'input' && this.elm.name) { return this.elm.name; }
    let name = this.baseType || 'obj';
    if (this.happy2parent.name) { name = this.happy2parent.name + '_' + name; }
    return name + this.happy2parent.nextId++;
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

}
// end: HappyItem


class HappyCanValidate extends HappyItem {

  constructor(happy2parent, options) {
    super(happy2parent, options);
    if ( ! this.messageAnchorsSelector) { this.messageAnchorsSelector = '.happy2messages'; }
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

  findItemMessages(parentElement) {
    if ( ! this.messageAnchorsSelector) { return []; }
    this.messageAnchorDOMElements = this.findDOMElements(this.messageAnchorsSelector, parentElement || this.elm);
    if (this.messageAnchorDOMElements) {
      this.messageAnchors = this._parseMessageAnchorElements();
    }
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
    this.console.log('check(), ', this.name, ', event.target:', event.target, ', isSubmit:', isSubmit);
    this.lastValue = this.value;
    this.value = this.parseValue(this.getValue());
    this.console.log('check(), this.value:', this.value, ', this.lastValue:', this.lastValue);
    let validateResult = this.validate(event, isSubmit);
    // if (validateResult) { happy2input.addMessage(validationMessage); }
    // this.update(validateResult);
    // this.updateDOM(validateResult);
    this.notifyHappy2Listeners(event, validateResult);
    if ( ! this.happy2parent.isHappy2) { // i.e. Only continue if below document level.
      this.happy2parent.check(event, isSubmit, validateResult);
    }
  }

  parseValue(val) {
    if (val) { return val.trim(); }
  }

  getValue() {
    if ( ! this.childItems) { return this.elm.value;  }
    let childItemValues = [];
    this.childItems.forEach(function pushItemValue(childItem) {
      childItem.getValue();
      if (childItem.value || childItem.value === 0) {
        childItemValues.push(childItem.value);
      }
    });
    return childItemValues.join(',');
  }

  validate(event, isSubmit) {
    let happy2input = this;
    let validateResult = {};
    let validators = this.happy2.validators;
    this.validations.forEach(function testValid(validation) {
      let validator = validators[validation.type];
      if (validator) {
        validation.args.push(isSubmit); // Add 'isSubmit' as last arg.
        if ( ! validator.apply(happy2input, validation.args)) {
          validateResult = validation;
          validation.failed = true;
          return false; // i.e. Break
        }
      }
    });
    this.state.happy = !validateResult.failed;
    this.state.unhappy = !this.state.happy;
    this.state.modified = this.lastValue !== this.value;
    this.console.log('validate(), state:', this.state, ', validateResult:', validateResult);
    return validateResult;
  }

  update() {
    this.console.log('HappyCanValidate.update()');
  }

  updateDOM() {
    this.console.log('HappyCanValidate.updateDOM()');
  }

  notifyHappy2Listeners(event, data) {
    this.console.log('HappyCanValidate.notifyHappy2Listeners()');
    return event && data;
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
    super(happy2anchor, options);
    if ( ! this.baseType) { this.baseType = 'msg'; }
    if ( ! this.name) { this.name = this.getName(); }
  }

}
// end: HappyMessage


class HappyMessageAnchor extends HappyItem {

  constructor(happy2parent, options) {
    super(happy2parent, options || {});
    if ( ! this.baseType) { this.baseType = 'anchor'; }
    if ( ! this.name) { this.name = this.getName(); }
    this.childDOMElements = this.findMessages();
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
    return this.happy2.customMessageTypes[messageType] || HappyMessage;
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
    if ( ! this.childDOMElements.length) { return messages; }
    // console.log('HappyInput._parseMessageElements(), messageDOMElements:', this.messageDOMElements);
    this.childDOMElements.forEach(function createMessage(messageElement) {
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
    super(happy2parent, options || {});
    if ( ! this.baseType) { this.baseType = 'input'; }
    if ( ! this.inputContainerSelector) { this.inputContainerSelector = '.input-container'; }
    if ( ! this.name) { this.name = this.getName(); }
    this.happy2.happyInputsIndex[this.id] = this;
    this.happy2.happyInputsByName[this.name] = this;
    this.findItemMessages();
    this.console.log('HappyInput - Initialized', this);
  }

  findInputContainer() {
    if ( ! this.elm) { return; }
    let parentDOMElement = this.elm.parentElement;
    if (parentDOMElement.matches(this.inputContainerSelector)) { return parentDOMElement; }
  }

  // Only look for message anchors that are specifically related to this input.
  // i.e. Message anchors that are within the CONTAINER of this input!
  findItemMessages() {
    let inputContainerDOMElement = this.findInputContainer();
    if ( ! inputContainerDOMElement) { return []; }
    return super.findItemMessages(inputContainerDOMElement);
  }

}
// end: HappyInput


class HappyField extends HappyCanValidate {

  constructor(happy2parent, options) {
    super(happy2parent, options || {});
    if ( ! this.baseType) { this.baseType = 'field'; }
    if ( ! this.name) { this.name = this.getName(); }
    this.happy2.happyFieldsIndex[this.id] = this;
    this.happy2.happyFieldsByName[this.name] = this;
    this.childDOMElements = this.findInputElements();
    this.childItems = this._parseInputElements();
    this.findItemMessages();
    this.bindUpdateTriggers();
    this.initalValue = this.getValue();
    this.value = this.initalValue; // or get from state if available...
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
    return this.happy2.customInputTypes[inputType] || HappyInput;
  }

  _parseInputElements() {
    let happyInputs = [],
        happy2field = this;
    if (!this.childDOMElements.length) { return happyInputs; }
    this.childDOMElements.forEach(function createHappyInput(inputElement) {
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

}
// end: HappyField


class HappyForm extends HappyCanValidate {

  constructor(happy2doc, options) {
    super(happy2doc, options || {});
    if ( ! this.baseType) { this.baseType = 'form'; }
    if ( ! this.name) { this.name = this.getName(); }
    this.happy2.happyFormsIndex[this.id] = this;
    this.fieldDOMElements = this.findFieldElements();
    this.childItems = this._parseFieldElements();
    this.findItemMessages();
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
    let customFieldTypes = this.happy2.customFieldTypes || {};
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
    super(happy2, options || {});
    if ( ! this.baseType) { this.baseType = 'doc'; }
    if ( ! this.name) { this.name = this.getName(); }
    this.childDOMElements = this.findFormElements();
    this.childItems = this._parseFormElements();
    this.findItemMessages();
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
    return this.happy2.customFormTypes[formType] || HappyForm;
  }

  _parseFormElements() {
    let happyForms = [],
        happy2doc = this;
    if (!this.childDOMElements.length) { return happyForms; }
    this.childDOMElements.forEach(function createHappyForm(formElement) {
      let formOptions = { elm: formElement };
      let HappyFormType = happy2doc.getHappyFormType(formElement);
      let happyForm = new HappyFormType(happy2doc, formOptions);
      happyForms.push(happyForm);
    });
    return happyForms;
  }

}
// end: HappyDocument


class Happy2 extends HappyObj {

  constructor(options) {
    options.HappyDocumentType        = options.HappyDocumentType || HappyDocument;
    options.docSelector              = options.docSelector || '.happy2doc';
    options.formSelector             = options.formSelector || 'form';
    options.fieldSelector            = options.fieldSelector || '.field';
    options.inputSelector            = options.inputSelector || 'input,textarea,select';
    options.messageSelector          = options.messageSelector || '.message';
    options.customMessageAnchorTypes = options.customMessageAnchorTypes || [];
    options.customMessageTypes       = options.customMessageTypes || [];
    options.customInputTypes         = options.customInputTypes || [];
    options.customFieldTypes         = options.customFieldTypes || [];
    options.customFormTypes          = options.customFormTypes || [];
    options.validators               = options.validators || {};
    super(null, options);
    this.happyDocumentsIndex = {};
    this.happyFormsIndex = {};
    this.happyFieldsIndex = {};
    this.happyFieldsByName = {};
    this.happyInputsIndex = {};
    this.happyInputsByName = {};
    this.happyItemsIndex = {};
    this.isHappy2 = true;
    this.console.log('Happy2:', this);
  }

  init(initialValues, savedValues, documentSelector) {
    this.console.log('Happy2.mountDocument(), docInitialValues:', initialValues, ', docSavedValues:', savedValues);
    let happy2doc = new this.HappyDocumentType(this, { selector: documentSelector || this.docSelector });
    this.happyDocumentsIndex[happy2doc.id] = happy2doc;
  }

}
// end: Happy2


var exports = exports || {};
exports.Happy2 = Happy2;
