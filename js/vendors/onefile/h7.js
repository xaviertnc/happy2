/* globals document, window, F1, HappyMessage, HappyInput, HappyForm, HappyDoc */
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

    if ( ! this.parent) {
      // Top level item only (i.e. do only once per view!)
      HappyItem.nextId = 1;
      HappyItem.currentField = undefined;
      this.isTopLevel = true;
    }

    this.id = this.getId();

    this.initialValue = null;
    this.value = null;

    this.required = false;
    this.modified = false;
    this.happy = true;

    this.children = [];
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


  getNext(stepOver)
  {
    if (this.isTopLevel) { return; }
    // console.log('HappyItem::getNext()', this.id);
    let parent = this.parent;
    let childCount = parent.children.length;
    if (childCount < 2) {
      if (parent.isTopLevel) { return; }
      let nextParentParent = parent.parent.getNext();
      // console.log('HappyItem::getNext(), nextParentParent:', nextParentParent);
      if (nextParentParent && nextParentParent.children.length) {
        return nextParentParent.children[0].children[0];
      }
    }
    let index = parent.children.indexOf(this) + 1;
    if (index >= childCount) {
      if (stepOver) {
        let nextParent = parent.getNext();
        if (nextParent && nextParent.children.length) {
          return nextParent.children[0];
        }
      }
      return parent.children[0];
    }
    return parent.children[index];
  }


  getPrev(stepOver)
  {
    if (this.isTopLevel) { return; }
    let childCount = this.parent.children.length;
    if (childCount < 2) { return; }
    let index = this.parent.children.indexOf(this);
    if ( ! index) {
      if (stepOver) {
        let prevParent = this.parent.getPrev();
        if (prevParent && prevParent.children.length) {
          return prevParent.children[prevParent.children.length - 1];
        }
      }
      return this.parent.children[childCount - 1];
    }
    return this.parent.children[index - 1];
  }


  // Here be dragons... You've been WARNED!
  onUpdateHandler(event) {
    let happyItem = event.target.HAPPY;
    // console.log('HappyItem::onUpdateHandler() event', event);
    if ( ! happyItem || happyItem.happyType !== 'input') { return; }
    let happyField = happyItem.parent;
    if (event.type === 'focus') {
      // Checklists, Radiolists and Selects should ignore blur events between OWN inputs.
      if (happyField === HappyItem.currentField && happyField.ignoreBlur()) {
        return clearTimeout(happyField.delayBlurEventTimer);
      }
      HappyItem.currentField = happyField;
      if (happyField.onFocus) { happyField.onFocus(event); }
      // console.log('HappyItem::onUpdateHandler() field focus', happyField.id);
      return;
    }
    if (event.type === 'blur') {
      // Delay the field-blur event to check if we actually left this field.
      // The next input-focus event will clear the timer if we are still on the same field.
      happyField.delayBlurEventTimer = setTimeout(function () {
        let date = new Date(), now = date.getTime();
        if ((now - (happyField.lastUpdated || 0)) > 250) {
          // console.log('HappyItem::onUpdateHandler() blur', happyItem.id);
          happyField.lastUpdated = now;
          happyField.update();
        }
      }, 150);
      return;
    }
    if (event.type === 'keydown') {
      if (event.key === 'Enter' || event.when == 13 || event.keyCode == 13) {
        event.stopImmediatePropagation();
        event.preventDefault();
        let nextHappyInput;
        if (happyField.is(['checkbox','checklist','radiolist'])) {
          happyItem.el.click();
        }
        if (happyField.fieldType === 'radiolist') {
          let nextHappyField = happyField.getNext(true);
          if (nextHappyField) {
            nextHappyInput = nextHappyField.inputs[0];
          }
        } else {
          nextHappyInput = happyItem.getNext(true);
        }
        if (nextHappyInput) { nextHappyInput.el.focus(); }
      }
      else if (event.key === 'ArrowUp' && happyField.is('checklist')) {
        let prevHappyInput = happyItem.getPrev();
        if (prevHappyInput) { prevHappyInput.el.focus(); }
      }
      else if (event.key === 'ArrowDown' && happyField.is('checklist')) {
        let nextHappyInput = happyItem.getNext();
        if (nextHappyInput) { nextHappyInput.el.focus(); }
      }
      return;
    }
    let date = new Date(), now = date.getTime();
    if ((now - (happyField.lastUpdated || 0)) > 250) {
      // console.log('HappyItem::onUpdateHandler()', event.type, happyItem.id);
      happyField.lastUpdated = now;
      happyField.update();
    }
  }


  bindEvents()
  {
    if (this.isTopLevel) {
      this.el.addEventListener('blur'     , this.onUpdateHandler, true);
      this.el.addEventListener('focus'    , this.onUpdateHandler, true);
      this.el.addEventListener('change'   , this.onUpdateHandler, true);
    }
    if (this.happyType === 'form') {
      this.el.addEventListener('keydown' , this.onUpdateHandler, true);
    }
  }


  unbindEvents()
  {
    if (this.happyType === 'form') {
      this.el.removeEventListener('keydown' , this.onUpdateHandler, true);
    }
    if (this.isTopLevel) {
      this.el.removeEventListener('change'   , this.onUpdateHandler, true);
      this.el.removeEventListener('focus'    , this.onUpdateHandler, true);
      this.el.removeEventListener('blur'     , this.onUpdateHandler, true);
    }
  }


  mount(options = {})
  {
    // console.log('HappyItem::mount()');
    let parent = this.parent || {};
    let appendTo = options.appendTo;
    this.containerElement = this.getContainerElement();
    this.el = (this.el || this.getDomElement()) || options.el;
    if ( ! this.el) {
      // No existing element... Mount as rendered element
      if ( ! appendTo) {
        // Pick what to append the rendered element to (if not specified)
        appendTo = this.containerElement || parent.el || document.body;
      }
      this.el = this.render();
      appendTo.append(this.el);
      this.isRenderedElement = true;
    }
    this.el.HAPPY = this;
    this.bindEvents();
    if (this.isTopLevel) { F1.console.log('Happy[', this.happyType, ']::mount() - ok', this); }
    this.mounted = true;
  }


  dismount()
  {
    if (this.el && this.isRenderedElement) {
      this.el.parentElement.removeChild(this.el);
      this.el = undefined;
    } else {
      this.unbindEvents();
      if (this.el) { delete this.el.HAPPY; }
    }
    if (this.children) {
      this.children.forEach(child => child.dismount());
      this.children = undefined;
    }
    this.mounted = false;
    this.nextId = 1;
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


class HappyMessage {

  constructor(options)
  {
    F1.console.log('HappyMessage::construct()', options);
  }

}



class HappyInput extends HappyItem  {

  constructor(options)
  {
    super('input', options);
    this.nextId = 1;
    F1.console.log('HappyInput::construct()');
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
    if (this.mounted) { return; }
    super.mount(options);
    this.inputType = this.getType();
  }

}



class HappyField extends HappyItem  {

  constructor(options)
  {
    super('field', options);
    let defaultSelector = 'input:not(hidden):not([type="submit"]), textarea, select';
    this.setOpt('inputSelector', this.getOpt('inputSelector'), defaultSelector);
    this.nextId = 1;
    F1.console.log('HappyField::construct()');
  }


  getInputs()
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


  is(fieldType)
  {
    let fieldTypes = (typeof fieldType === 'string') ?  [fieldType] : fieldType;
    return fieldTypes.includes(this.fieldType);
  }


  ignoreBlur()
  {
    return this.is(['checkbox', 'checklist', 'radiolist', 'select', 'file']);
  }


  validate()
  {

  }


  mount(options)
  {
    if (this.mounted) { return; }
    super.mount(options);
    this.fieldType = this.getType();
    this.inputs = this.getInputs();
    this.children = this.inputs;
    this.inputs.forEach(input => input.mount());
  }


  dismount()
  {
    super.dismount();
    this.inputs = undefined;
  }
}



class HappyForm extends HappyItem {

  constructor(options)
  {
    super('form', options);
    this.setOpt('fieldSelector', this.getOpt('fieldSelector'), '.field');
    this.nextId = 1;
    F1.console.log('HappyForm::construct()');
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
    if (this.mounted) { return; }
    super.mount(options);
    this.fields = this.getFields();
    this.children = this.fields;
    this.fields.forEach(field => field.mount());
  }


  dismount()
  {
    super.dismount();
    this.fields = undefined;
  }
}



class HappyDoc extends HappyItem {

  constructor(options)
  {
    super('doc', options);
    this.setOpt('formSelector', this.getOpt('formSelector'), 'form');
    this.nextId = 1;
    F1.console.log('HappyDoc::construct()');
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
    if (this.mounted) { return; }
    super.mount(options);
    this.forms = this.getForms();
    this.children = this.forms;
    this.forms.forEach(form => form.mount());
  }


  dismount()
  {
    super.dismount();
    this.forms = undefined;
  }

}