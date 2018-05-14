/* eslint-env es6 */


/**
 * Happy2JS
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  14 May 2018
 *
 */

class HappyItem {

  constructor(happy2type, happy2parent, options) {
    options = options || {};
    console.log('HappyItem.constructor(), happy2type:', happy2type, ', opt.elm:', options.elm, ', opt.sel:', options.selector);
    // console.log('HappyItem.constructor(), happy2parent:', happy2parent, ', options:', options);

    this.happy2type = happy2type || 'doc';
    this.happy2parent = happy2parent || { nextId: 1, getOpt: function(){} };
    this.happy2doc = this.happy2parent.happy2doc || this;

    Object.assign(this, options);

    if ( ! this.elm) { this.elm = this.findDOMElement(this.selector); }
    if ( ! this.id)  { this.id = this.getId(); }

    this.elm.happy2item = this;
    this.nextId = 1;
  }


  getId() {
    let id = this.happy2type + this.happy2parent.nextId++;
    if (this.happy2parent.id) { id = this.happy2parent.id + '_' + id; }
    return id;
  }


  getOpt(optName) {
    return typeof this[optName] === 'undefined' ? this.happy2parent.getOpt(optName) : this[optName];
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


  storeState() {

  }


  getStoredState() {

  }


  findDOMElement(selector, parentElm) {
    // console.log('HappyItem.findDOMElement(), selector:', selector, ', parentElement:', parentElm);
    let elm = (parentElm || document).querySelector(selector);
    console.log('HappyItem.findDOMElement(), elm:', elm);
    return elm;
  }


  findDOMElements(selector, parentElm) { return (parentElm || document).querySelectorAll(selector); }


  findDOMValidations() {

  }


  findDOMMessageZones() {

  }


  findDOMMessages() {

  }


  initUsingStore() {
    this.state = this.getStoredState();
    if (!this.state) {
      return;
    }
    console.log('HappyItem - Initialized using STORE:', this);
  }


  initUsingDOM() {
    this.validations = this.findDOMValidations() || [];
    this.messageAnchors = this.findDOMMessageZones() || [];
    this.messages = this.findDOMMessages() || [];
    console.log('HappyItem - Initialized using DOM:', this);
  }


  getDOMState() {

  }


  updateDOM() {

  }


  addValidation(validation) {

  }


  validate(isSubmit, data) {

  }


  isUnhappy(isSubmit, data) {

  }


  addMessageZone(zone) {

  }


  addMessage(message) {

  }


  removeMessage(message) {

  }


  removeAllMessages() {

  }


  bindUpdateTriggers() {

  };


  update(forSubmit) {
    var state = this.state;
    this.lastValue = this.value;
    this.value = this.parse(this.getDOMValue());
    state.happy = this.validate(forSubmit);
    state.unhappy = !state.happy;
    this.updateDOM();
  }

}
// end: HappyItem



class HappyValidation {

}
// end: HappyValidation



class HappyMessage {

  constructor(options) {
    Object.assign(this, options || {});
  }

}
// end: HappyMessage



class HappyMessageAnchor {

  constructor(options) {
    Object.assign(this, options || {});
  }

}
// end: HappyMessageAnchor



class HappyInput extends HappyItem {

  constructor(happy2parent, options) {
    options = options || {};
    super('input', happy2parent, options);
    this.messageAnchorDOMElements = this.findMessageAnchors();
    if (this.messageAnchorDOMElements) {
      this.messageAnchors = this._parseMessageAnchorElements();
      this.messageDOMElements = this.findMessages();
      if (this.messageDOMElements) { this.messages = this._parseMessageElements(); }
    }
    console.log('HappyInput - Initialized', this);
  }

  update(event, isSubmit) {
    console.log('HappyInput.update(), target:', event.target, ', isSubmit:', isSubmit);
  }

  findMessageAnchors() {
    let parentDOMElement = this.elm.parentElement;
    // Only look for anchors that are specifically for this input.
    // i.e. This input must have a container and any anchors must be INSIDE THE CONTAINER!
    if (parentDOMElement && parentDOMElement.matches(this.happy2doc.inputContainerSelector)) {
      return this.findDOMElements(this.happy2doc.messageAnchorSelector, parentDOMElement);
    }
  }

  findMessages() {
    let messageDOMElements = [],
        happy2doc = this.happy2doc,
        happy2input = this;
    this.messageAnchorDOMElements.forEach(function addMessageElements(anchorDOMElement) {
      let messageNodes = happy2input.findDOMElements(happy2doc.messageSelector, anchorDOMElement);
      messageNodes.forEach(function addMessageElement(messageDOMElement) {
        messageDOMElements.push(messageDOMElement);
      });
    });
    return messageDOMElements;
  }

  _parseMessageAnchorElements() {
    let messageAnchors = [], happy2input = this;
    if ( ! this.messageAnchorDOMElements.length) { return messageAnchors; }
    this.messageAnchorDOMElements.forEach(function createMessageAnchor(msgAnchorElement, index) {
      let anchorOptions = { happy2parent: happy2input, elm: msgAnchorElement };
      let messageAnchor = new HappyMessageAnchor(anchorOptions);
      messageAnchors.push(messageAnchor);
    });
    return messageAnchors;
  }

  _parseMessageElements() {
    let messages = [],
        happy2doc = this.happy2doc,
        happy2input = this;
    if ( ! this.messageDOMElements.length) { return messages; }
    console.log('HappyInput._parseMessageElements(), messageDOMElements:', this.messageDOMElements);
    this.messageDOMElements.forEach(function createMessage(messageElement, index) {
      let messageOptions = { happy2parent: happy2input, elm: messageElement };
      let message = new HappyMessage(messageOptions);
      messages.push(message);
    });
    return messages;
  }

}
// end: HappyInput



class HappyField extends HappyItem {

  constructor(happy2parent, options) {
    options = options || {};
    super('field', happy2parent, options);
    this.inputDOMElements = this.findInputElements();
    this.happyInputs = this._parseInputElements();
    this.bindUpdateTriggers();
    console.log('HappyField - Initialized', this);
  }

  update(event, isSubmit) {
    console.log('HappyField.validate(), target:', event.target, ', isSubmit:', isSubmit);
  }

  bindUpdateTriggers() {
    let happy2field = this;
    this.elm.addEventListener('change', function(event) {
      let happy2input = event.target.happy2item;
      if (happy2input && happy2input.validations) {
        happy2input.update(event, false)
      } else {
        happy2field.update(event, false);
      }
    }, true);
  }

  findInputElements() {
    return this.findDOMElements(this.happy2doc.inputSelector, this.elm);
  }

  _parseInputElements() {
    let happyInputs = [],
        happy2field = this;
    if (!this.inputDOMElements.length) { return happyInputs; }
    this.inputDOMElements.forEach(function createHappyInput(inputElement, index) {
      let inputOptions = { elm: inputElement };
      let happyInput = new HappyInput(happy2field, inputOptions);
      happyInputs.push(happyInput);
    });
    return happyInputs;
  }

}
// end: HappyField



class HappyForm extends HappyItem {

  constructor(happy2doc, options) {
    options = options || {};
    super('form', happy2doc, options);
    this.fieldDOMElements = this.findFieldElements();
    this.happyFields = this._parseFieldElements();
    console.log('HappyForm - Initialized', this);
  }

  findFieldElements() { return this.findDOMElements(this.happy2doc.fieldSelector, this.elm); }

  _parseFieldElements() {
    let happyFields = [],
        happy2form = this;
    if (!this.fieldDOMElements.length) { return happyFields; }
    this.fieldDOMElements.forEach(function createHappyField(fieldElement, index) {
      let fieldOptions = { elm: fieldElement };
      happyFields.push(new HappyField(happy2form, fieldOptions));
    });
    return happyFields;
  }

}
// end: HappyForm



class HappyDocument extends HappyItem {

  constructor(options) {
    options = options || {};
    options.selector = options.selector || '.happy2doc';
    options.formSelector = options.formSelector || 'form';
    options.fieldSelector = options.fieldSelector || '.field';
    options.inputSelector = options.inputSelector || 'input,textarea,select';
    options.inputContainerSelector = options.inputContainerSelector || '.input-container';
    options.messageAnchorSelector = options.messageAnchorSelector || '.messages';
    options.messageSelector = options.messageSelector || '.message';
    options.customInputModels = options.customInputModels || [];
    options.customFieldModels = options.customFieldModels || [];
    super('doc', null, options);
    this.formDOMElements = this.findFormElements();
    this.happyForms = this._parseFormElements();
    this.inputModels = { 'text': HappyInput };
    this.fieldModels = { 'text': HappyField };
    console.log('HappyDocument - Initialized', this);
  }

  findFormElements() { return this.findDOMElements(this.formSelector, this.elm); }

  _parseFormElements() {
    let happyForms = [],
        happy2doc = this;
    if (!this.formDOMElements.length) { return happyForms; }
    this.formDOMElements.forEach(function createHappyForm(formElement, index) {
      let formOptions = { elm: formElement };
      happyForms.push(new HappyForm(null, happy2doc, formOptions));
    });
    return happyForms;
  }

}
// end: HappyDocument
