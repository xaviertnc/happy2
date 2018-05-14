/* eslint-env es6 */


/**
 * Happy2JS
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  14 May 2018
 *
 */

class HappyItem {

  constructor(type, selector, happy2doc, parent, options) {
    // console.log('HappyItem.constructor type:', type, ' selector:', selector, ', h2doc:', happy2doc, ', parent:', parent);
    this.nextId = 1;
    this.type = type;
    this.happy2doc = happy2doc || this;
    this.parent = parent || { nextId: 1 };

    Object.assign(this, options || {});

    if (!this.elm) { this.elm = this.findDOMElement(selector); }
    if (!this.id)  { this.id = this.getId ? this.getId() : this.type + this.parent.nextId++; }

    this.elm.happy2item = this;
  }


  storeState() {

  }


  getStoredState() {

  }


  findDOMElement(selector, parentElm) {
    var parentElm = parentElm || document;
    return parentElm.querySelector(selector);
  }


  findDOMElements(selector, parentElm) {
    var parentElm = parentElm || document;
    return parentElm.querySelectorAll(selector);
  }


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
    this.messageZones = this.findDOMMessageZones() || [];
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



class HappyMessageZone {

}
// end: HappyMessageZone



class HappyMessage {

}
// end: HappyMessage



class HappyInput extends HappyItem {

  constructor(selector, happy2doc, parent, options) {
    options = options || {};
    super('input', selector, happy2doc, parent, options);
    this.msgZoneDOMElements = this.findMsgZoneDOMElements();
    this.messageZones = this.parseMsgZoneDOMElements();
    console.log('HappyInput - Initialized', this);
  }

  findMsgZoneDOMElements() {
    return this.findDOMElements(this.happy2doc.messageZoneSelector, this.elm);
  }

  parseMsgZoneDOMElements() {
    let messageZones = [],
        happy2input = this,
        happy2doc = this.happy2doc;
    if (!this.msgZoneDOMElements.length) {
      return messageZones;
    }
    this.msgZoneDOMElements.forEach(function createMessageZone(msgZoneElement, index) {
      messageZones.push(new HappyMessageZone(null, happy2doc, happy2input, {
        elm: msgZoneElement
      }));
    });
    return messageZones;
  }

}
// end: HappyInput



class HappyField extends HappyItem {

  constructor(selector, happy2doc, parent, options) {
    options = options || {};
    super('field', selector, happy2doc, parent, options);
    this.inputDOMElements = this.findInputDOMElements();
    this.happyInputs = this.parseInputDOMElements();
    console.log('HappyField - Initialized', this);
  }

  findInputDOMElements() {
    return this.findDOMElements(this.happy2doc.inputSelector, this.elm);
  }

  parseInputDOMElements() {
    let happyInputs = [],
        happy2field = this,
        happy2doc = this.happy2doc;
    if (!this.inputDOMElements.length) {
      return happyInputs;
    }
    this.inputDOMElements.forEach(function createHappyInput(inputElement, index) {
      happyInputs.push(new HappyInput(null, happy2doc, happy2field, {
        elm: inputElement
      }));
    });
    return happyInputs;
  }

}
// end: HappyField



class HappyForm extends HappyItem {

  constructor(selector, happy2doc, options) {
    options = options || {};
    super('form', selector, happy2doc, happy2doc, options);
    this.fieldDOMElements = this.findFieldDOMElements();
    this.happyFields = this.parseFieldDOMElements();
    console.log('HappyForm - Initialized', this);
  }

  findFieldDOMElements() {
    return this.findDOMElements(this.happy2doc.fieldSelector, this.elm);
  }

  parseFieldDOMElements() {
    let happyFields = [],
        happy2form = this,
        happy2doc = this.happy2doc;
    if (!this.fieldDOMElements.length) {
      return happyFields;
    }
    this.fieldDOMElements.forEach(function createHappyField(fieldElement, index) {
      happyFields.push(new HappyField(null, happy2doc, happy2form, {
        elm: fieldElement
      }));
    });
    return happyFields;
  }

}
// end: HappyForm


class HappyDocument extends HappyItem {

  constructor(selector, options) {
    options = options || {};
    options.formSelector = options.formSelector || 'form';
    options.fieldSelector = options.fieldSelector || '.form-field';
    options.inputSelector = options.inputSelector || 'input,textarea,select';
    options.messageSelector = options.messageSelector || '.happy2-message';
    options.messageZoneSelector = options.messageZoneSelector || '.happy2-messages';
    super('doc', selector || '.happy2-document', null, null, options);
    this.formDOMElements = this.findFormDOMElements();
    this.happyForms = this.parseFormDOMElements();
    console.log('HappyDocument - Initialized', this);
  }

  findFormDOMElements() {
    return this.findDOMElements(this.formSelector, this.elm);
  }

  parseFormDOMElements() {
    let happyForms = [],
        happy2doc = this;
    if (!this.formDOMElements.length) {
      return happyForms;
    }
    this.formDOMElements.forEach(function createHappyForm(formElement, index) {
      happyForms.push(new HappyForm(null, happy2doc, {
        elm: formElement
      }));
    });
    return happyForms;
  }

}
// end: HappyDocument
