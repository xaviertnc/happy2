/* globals document, window */
/* eslint-env es7 */

/**
 * Happy-7 JS
 * Simplify the concepts in Happy4 even further!
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  13 Jun 2019
 *
 */

class HappyItem {

  constructor(type, options)
  {
    this.happyType = type;
    this.parent = options.parent;
    this.el = options.el;
    delete options.parent;
    delete options.el;

    this.options = options || {};

    this.id = this.getId();

    this.initialValue = null;
    this.value = null;

    this.required = false;
    this.modified = false;
    this.happy = true;

    this.updateHandlers = [];
    this.children = [];

    this.prev = null;
    this.next = null;
  }


  getOpt(key, def)
  {
    if (this.options[key]) { return this.options[key]; }
    if (this.parent) { return this.parent.getOpt(key); }
    return def;
  }


  setOpt(key, value, def)
  {
    if (typeof this.options[key] !== 'undefined') { return; }
    if (typeof value !== 'undefined') { this.options[key] = value; }
    else { this.options[key] = def; }
  }


  getId()
  {
    if (this.parent && this.parent.nextId) {
      return this.parent.id + '_' + this.happyType + this.parent.nextId++;
    }
    return this.happyType + HappyItem.nextId++;
  }


  getDomElement()
  {
    if (this.el) { return this.el; }
    if (this.options.selector) {
      let parentElement = this.parent ? this.parent.el : document.body;
      return parentElement.querySelector(this.options.selector);
    }
  }


  getContainerElement()
  {
    if (this.options.containerElement) {
      return this.options.containerElement;
    }
    let containerSelector = this.getOpt('containerSelector');
    if (containerSelector) {
      let parentElement = this.parent ? this.parent.el : document.body;
      return parentElement.querySelector(containerSelector);
    }
  }


  onUpdateEvent(event) {
    let happyItem = event.target.HAPPY;
    if ( ! happyItem || happyItem.happyType !== 'input') { return; }
    if (event.type === 'focus') {
      if (happyItem.parent === HappyItem.currentField) { return; }
      HappyItem.currentField = happyItem.parent;
      if (happyItem.onFocus) { happyItem.onFocus(event); }
      console.log('HappyItem::onUpdateEvent() focus', happyItem);
      return;
    }
    if (event.type === 'blur' && ! event.relatedTarget) {
      console.log('HappyItem::onUpdateEvent() blur - Ignore!');
      return;
    }
    let date = new Date();
    let now = date.getTime();
    if ((now - (happyItem.parent.lastUpdated || 0)) > 300) {
      happyItem.parent.lastUpdated = now;
      console.log('HappyItem::onUpdateEvent()', now,
        happyItem.parent.lastUpdated, event.type, happyItem);
    }
    happyItem.update(event);
    return happyItem;
  }


  bindEvents()
  {
    if (this.parent) { return; }
    this.updateHandlers = [];
    this.updateHandlers.push(this.el.addEventListener('focus'  , this.onUpdateEvent, true));
    this.updateHandlers.push(this.el.addEventListener('blur'  , this.onUpdateEvent, true));
    this.updateHandlers.push(this.el.addEventListener('change', this.onUpdateEvent, true));
    // this.updateHandlers.push(this.el.addEventListener('input', this.onUpdateEvent, true));
  }


  unbindEvents()
  {
    if (this.parent) { return; }
    this.updateHandlers.forEach(handler => this.el.removeEventListener(handler));
  }


  mount(options = {})
  {
    // console.log('HappyItem::mount()');
    let parent = this.parent || {};
    let appendTo = options.appendTo;
    this.containerElement = this.getContainerElement();
    this.el = (this.el || this.getDomElement()) || options.el;
    if ( ! this.el)
    { // No existing element... Mount as rendered element
      if ( ! appendTo)
      { // Pick what to append the rendered element to (if not specified)
        appendTo = this.containerElement || parent.el || document.body;
      }
      this.el = this.render();
      appendTo.append(this.el);
      this.isRenderedElement = true;
    }
    this.el.HAPPY = this;
    this.bindEvents();
    if ( ! this.parent) {
      console.log('HappyItem[', this.happyType, ']::mount() - ok', this);
    }
  }


  dismount()
  {
    if (this.isRenderedElement) {
      this.el.parentElement.removeChild(this.el);
    } else {
      if (this.unbindEvents) {
        this.unbindEvents();
      }
      delete this.el.HAPPY;
    }
  }


  render()
  {
    return document.createElement('div');
  }


  beforeUpdate()
  {

  }


  update()
  {

  }


  afterUpdate()
  {

  }

}

// *** Hi - Don't forget about me! :) ***
HappyItem.nextId = 1;
HappyItem.currentField = undefined;



class HappyMessage {

  constructor(options)
  {
    console.log('HappyMessage::construct()');
  }

}



class HappyMessageGroup {

  constructor(options)
  {
    console.log('HappyMessageGroup::construct()');
  }

}



class HappyInput extends HappyItem  {

  constructor(options)
  {
    super('input', options);
    this.nextId = 1;
    console.log('HappyInput::construct()');
  }


  getType()
  {
    return this.el.type || this.el.getAttribute('data-type');
  }


  getLabel()
  {

  }


  getMessages()
  {

  }


  getMessageGroups()
  {

  }


  getInitialValue()
  {

  }


  getValue()
  {

  }


  getHappyState()
  {

  }


  getModifiedState()
  {

  }


  validate()
  {

  }


  mount(options)
  {
    super.mount(options);
    this.inputType = this.getType();
  }

}



class HappyField extends HappyItem  {

  constructor(options)
  {
    super('field', options);
    let defaultSelector = 'input:not([type="submit"]):not([type="hidden"]),textarea,select';
    this.setOpt('inputSelector', this.getOpt('inputSelector'), defaultSelector);
    this.nextId = 1;
    console.log('HappyField::construct()');
  }


  getInputs(inputDefs)
  {
    let field = this, inputs = [];
    if (field.options.inputSelector) {
      let inputElements = field.el.querySelectorAll(field.options.inputSelector);
      inputElements.forEach(inputElement => {
        let input = new HappyInput({ el: inputElement, parent: field });
        inputs.push(input);
      });
    }
    return inputs;
  }


  getType()
  {
    return this.el.getAttribute('data-type');
  }


  getLabel()
  {

  }


  getMessages()
  {

  }


  getMessageGroups()
  {

  }


  getModifiedState()
  {

  }


  getHappyState()
  {

  }


  getInitialValue()
  {

  }


  getValue()
  {

  }


  validate()
  {

  }


  mount(options)
  {
    super.mount(options);
    this.fieldType = this.getType();
    this.inputs = this.getInputs();
    this.children = this.inputs;
    this.inputs.forEach(input => input.mount());
  }

}



class HappyForm extends HappyItem {

  constructor(options)
  {
    super('form', options);
    this.setOpt('fieldSelector', this.getOpt('fieldSelector'), '.field');
    this.nextId = 1;
    console.log('HappyForm::construct()');
  }


  getFields()
  {
    let form = this, formFields = [];
    if (form.options.fieldSelector) {
      let fieldElements = form.el.querySelectorAll(form.options.fieldSelector);
      fieldElements.forEach(fieldElement => {
        let field = new HappyField({ parent: form, el: fieldElement });
        formFields.push(field);
      });
    }
    return formFields;
  }


  getMessages()
  {

  }


  getMessageGroups()
  {

  }


  getModifiedState()
  {

  }


  getHappyState()
  {

  }


  getValue()
  {

  }


  validate()
  {

  }


  mount(options)
  {
    super.mount(options);
    this.fields = this.getFields();
    this.children = this.fields;
    this.fields.forEach(field => field.mount());
  }

}



class HappyDoc extends HappyItem {

  constructor(options)
  {
    super('doc', options);
    this.setOpt('formSelector', this.getOpt('formSelector'), 'form');
    this.nextId = 1;
    console.log('HappyDoc::construct()');
  }


  getForms()
  {
    let doc = this, docForms = [];
    if (doc.options.formSelector) {
      let formElements = doc.el.querySelectorAll(doc.options.formSelector);
      formElements.forEach(formElement => {
        let form = new HappyForm({ parent: doc, el: formElement });
        docForms.push(form);
      });
    }
    return docForms;
  }


  getMessages()
  {

  }


  getMessageGroups()
  {

  }


  getModifiedState()
  {

  }


  getHappyState()
  {

  }


  getValue()
  {

  }


  validate()
  {

  }


  mount(options)
  {
    super.mount(options);
    this.forms = this.getForms();
    this.children = this.forms;
    this.forms.forEach(form => form.mount());
  }

}