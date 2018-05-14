/* eslint-env es6 */


/**
 * Happy2JS
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  14 May 2018
 *
 */

class HappyItem {

  constructor(type, selector, happy2doc, happy2parent, options) {

    console.log('HappyItem.constructor(), type:', type, ' selector:', selector, ', opt.elm:', options?options.elm:'');
    // console.log('HappyItem.constructor(), h2doc:', happy2doc, ', happy2parent:', happy2parent);
    // console.log('HappyItem.constructor(), options:', options);

    this.nextId = 1;
    this.type = type;
    this.happy2doc = happy2doc;
    this.happy2parent = happy2parent;

    Object.assign(this, options || {});

    if ( ! this.happy2doc && type == 'doc') { this.happy2doc = this; }
    if ( ! this.happy2parent) { this.happy2parent = { nextId: 1, getOpt: function(){} }; }
    if ( ! this.elm) { this.elm = this.findDOMElement(selector); }
    if ( ! this.id)  { this.id = this.getId(); }

    this.elm.happy2item = this;
  }


  getId() {
    let id = this.type + this.happy2parent.nextId++;
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



class HappyMessageAnchor {

}
// end: HappyMessageAnchor



class HappyMessage {

}
// end: HappyMessage



class HappyInput extends HappyItem {

  constructor(selector, happy2doc, happy2parent, options) {
    options = options || {};
    super('input', selector, happy2doc, happy2parent, options);
    this.messageAnchorDOMElements = this.findMessageAnchors();
    if (this.messageAnchorDOMElements) {
      this.messageAnchors = this._parseMessageAnchorElements();
      this.messageDOMElements = this.findMessages();
      if (this.messageDOMElements) { this.messages = this._parseMessageElements(); }
    }
    console.log('HappyInput - Initialized', this);
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
      let anchorOptions = { elm: msgAnchorElement };
      let messageAnchor = new HappyMessageAnchor(happy2input, anchorOptions);
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
      let messageOptions = { elm: messageElement };
      let message = new HappyMessage(happy2input, messageOptions);
      messages.push(message);
    });
    return messages;
  }

}
// end: HappyInput



class HappyField extends HappyItem {

  constructor(selector, happy2doc, happy2parent, options) {
    options = options || {};
    super('field', selector, happy2doc, happy2parent, options);
    this.inputDOMElements = this.findInputElements();
    this.happyInputs = this._parseInputElements();
    console.log('HappyField - Initialized', this);
  }

  findInputElements() {
    return this.findDOMElements(this.happy2doc.inputSelector, this.elm);
  }

  _parseInputElements() {
    let happyInputs = [],
        happy2field = this,
        happy2doc = this.happy2doc;
    if (!this.inputDOMElements.length) { return happyInputs; }
    this.inputDOMElements.forEach(function createHappyInput(inputElement, index) {
      let inputOptions = { elm: inputElement };
      happyInputs.push(new HappyInput(null, happy2doc, happy2field, inputOptions));
    });
    return happyInputs;
  }

}
// end: HappyField



class HappyForm extends HappyItem {

  constructor(selector, happy2doc, options) {
    options = options || {};
    super('form', selector, happy2doc, happy2doc, options);
    this.fieldDOMElements = this.findFieldElements();
    this.happyFields = this._parseFieldElements();
    console.log('HappyForm - Initialized', this);
  }

  findFieldElements() { return this.findDOMElements(this.happy2doc.fieldSelector, this.elm); }

  _parseFieldElements() {
    let happyFields = [],
        happy2form = this,
        happy2doc = this.happy2doc;
    if (!this.fieldDOMElements.length) { return happyFields; }
    this.fieldDOMElements.forEach(function createHappyField(fieldElement, index) {
      let fieldOptions = { elm: fieldElement };
      happyFields.push(new HappyField(null, happy2doc, happy2form, fieldOptions));
    });
    return happyFields;
  }

}
// end: HappyForm



class HappyDocument extends HappyItem {

  constructor(options) {
    options = options || {};
    options.formSelector = options.formSelector || 'form';
    options.fieldSelector = options.fieldSelector || '.field';
    options.inputSelector = options.inputSelector || 'input,textarea,select';
    options.inputContainerSelector = options.inputContainerSelector || '.input-container';
    options.messageAnchorSelector = options.messageAnchorSelector || '.messages';
    options.messageSelector = options.messageSelector || '.message';
    options.customInputModels = options.customInputModels || [];
    options.customFieldModels = options.customFieldModels || [];
    super('doc', options.selector || '.happy2doc', null, null, options);
    this.formDOMElements = this.findFormDOMElements();
    this.happyForms = this.parseFormDOMElements();
    this.inputModels = { 'text': HappyInput };
    this.fieldModels = { 'text': HappyField };
    console.log('HappyDocument - Initialized', this);
  }

  findFormDOMElements() { return this.findDOMElements(this.formSelector, this.elm); }

  parseFormDOMElements() {
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
