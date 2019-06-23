/* globals document, F1, HAPPY */
/* eslint-env es7 */

/**
 * Happy-7 JS
 * Simplify the concepts in Happy4 even further!
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  13 Jun 2019
 *
 */

class HP7 {

  constructor()
  {
    this.docs          = [];
    this.forms         = [];
    this.fields        = [];
    this.inputs        = [];
    this.messagegroups = [];
    this.items         = [];
    this.topLevelItems = [];
    this.cleaners      = {};
    this.validators    = {};
    this.typeClassMap  = {
      doc           : {},
      form          : {},
      field         : {},
      input         : {},
      message       : {},
      messagegroup  : {},
    };
  }

  addItem(happyType, options = {})
  {
    if ( ! options.el) { return; }
    let TypeClass, group = happyType.toLowerCase() + 's';
    if (options.TypeClass)
    {
      TypeClass = options.TypeClass;
      delete options.TypeClass;
    }
    else {
      TypeClass = HP7[happyType];
    }
    let happyItem = new TypeClass(options), happyGroup = this[group];
    if (happyItem.isTopLevel) { this.topLevelItems.push(happyItem); }
    if (happyGroup) { happyGroup.push(happyItem); }
    this.items.push(happyItem);
    // F1.console.log('HP7::addItem()');
    return happyItem;
  }

  findItem(itemId, list = this.items)
  {
    let found, itemIndex = 0;
    let itemCount = list.length; if (!itemCount) { return; }
    while (!found && itemIndex < itemCount) {
      let item = list[itemIndex];
      if (item.id === itemId || item.name === itemId) { found = item; }
      itemIndex++;
    }
    return found;
  }

  addDoc     (options) { return this.addItem('Doc'     , options); }
  addForm    (options) { return this.addItem('Form'    , options); }
  addField   (options) { return this.addItem('Field'   , options); }
  addInput   (options) { return this.addItem('Input'   , options); }

  getDoc     (name) { return this.findItem(name, this.docs    ); }
  getForm    (name) { return this.findItem(name, this.forms   ); }
  getField   (name) { return this.findItem(name, this.fields  ); }
  getInput   (name) { return this.findItem(name, this.inputs  ); }

  addMessageGroup(options) { return this.addItem('MessageGroup', options); }
  getMessageGroup(name) { return this.findItem(name, this.messagegroups);  }

  mount() { this.topLevelItems.forEach(item => item.mount()); }
  dismount() { this.topLevelItems.forEach(item => item.dismount()); }

}



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
    this.name = undefined;

    this.initialValue = null;
    this.value = null;

    this.required = false;
    this.modified = false;
    this.happy = true;

    this.children = [];

    this.nextId = 1;
    this.nextMessagesId = 1;
  }


  extend(extendWithObj = {})
  {
    return Object.assign(this, extendWithObj);
  }


  getOpt(key, def)
  {
    if (this.options[key]) { return this.options[key]; }
    if (this.parent) { return this.parent.getOpt(key, def); }
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


  getName()
  {
    return this.el.name;
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
    let containerSelector, elContainer;
    containerSelector = this.getOpt('containerSelector');
    if (containerSelector) {
      elContainer = this.el.parentElement.querySelector(containerSelector);
    }
    return elContainer ? elContainer : this.el.parentElement;
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
  onUpdateHandler(event)
  {
    let happyItem = event.target.HAPPY;
    if ( ! happyItem || happyItem.happyType !== 'input') { return; }
    let happyField = happyItem.parent;

    if (event.type === 'focus') {
      // Checklists, Radiolists and Selects should ignore blur events between OWN inputs.
      if (happyField === HappyItem.currentField && happyField.ignoreBlur()) {
        return clearTimeout(happyField.delayBlurEventTimer);
      }
      HappyItem.currentField = happyField;
      if (happyField.options.onFocus && happyField.options.onFocus(event)) { return; }
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
      if (happyField.options.onKeyDown && happyField.options.onKeyDown(event)) { return; }
      // Focus on the NEXT FIELD or INPUT when we press ENTER
      if (event.key === 'Enter' || event.when == 13 || event.keyCode == 13) {
        if (happyField.is(['memo'])) { return; }
        event.stopImmediatePropagation();
        event.preventDefault();
        let nextHappyInput;
        if (happyField.is(['checkbox','checklist','radiolist'])) {
          // Also "Check/Select" the FIELD INPUT if it's in the list above.
          happyItem.el.click();
        }
        if (happyField.options.onEnter && !happyField.options.onEnter(event)) { return; }
        if (happyField.fieldType === 'radiolist') {
          // Jump to the NEXT FIELD's first input.
          let nextHappyField = happyField.getNext(true);
          if (nextHappyField) {
            nextHappyInput = nextHappyField.inputs[0];
          }
        } else {
          // Jump to the NEXT INPUT
          nextHappyInput = happyItem.getNext(true);
        }
        if (nextHappyInput) { nextHappyInput.el.focus(); }
      }

      else if (event.key === 'ArrowDown' && happyField.is('checklist')) {
        // Focus on the NEXT INPUT if we press Arrow Down on a checklist field
        let nextHappyInput = happyItem.getNext();
        if (nextHappyInput) { nextHappyInput.el.focus(); }
      }

      else if (event.key === 'ArrowUp' && happyField.is('checklist')) {
        // Focus on the PREV INPUT if we press Arrow Up on a checklist field
        let prevHappyInput = happyItem.getPrev();
        if (prevHappyInput) { prevHappyInput.el.focus(); }
      }

      return;
    }

    // event.type = change, event.type = input
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
    this.name = this.getName();
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


  beforeUpdate(event, isSubmit)
  {
    this.validate(event, isSubmit);
  }


  update()
  {
    // Update DOM
  }


  afterUpdate()
  {
    // Trigger parent update...
  }

}


class HappyMessage {

  constructor(options)
  {
    this.happyType = 'message';
    this.parent = options.parent;
    this.el = options.el;
    delete options.parent;
    delete options.el;

    this.options = options || {};

    this.id = this.getId();

    // F1.console.log('HappyMessage::construct()');
  }


  getId()
  {
    return this.parent.id + '_msg' + this.parent.nextId++;
  }

}


class HappyMessageGroup {

  constructor(options)
  {
    this.happyType = 'messagegroup';
    this.parent = options.parent;
    this.el = options.el;
    delete options.parent;
    delete options.el;

    this.options = options || {};

    this.id = this.getId();

    this.nextId = 1;

    // F1.console.log('HappyMessages::construct()');
  }


  getId()
  {
    return this.parent.id + '_mgrp' + this.parent.nextMessagesId++;
  }

}



class HappyInput extends HappyItem {

  constructor(options)
  {
    super('input', options);
    F1.console.log('HappyInput::construct()');
  }


  getType()
  {
    return this.el.type || this.el.getAttribute('data-type');
  }


  getLabel()
  {
    let el = this.el.previousElementSibling;
    if (el.nodeName === 'LABEL') { return el.innerText; }
  }


  /**
   * For removal of all server-side messages before update?
   */
  getMessages()
  {
    // F1.console.log('HappyInput::getMessages()');
    let containerElement = this.getContainerElement();
    let messagesSelector = this.getOpt('messagesSelector', '.input-messages');
    let messagesElement = containerElement.querySelector(messagesSelector);
    let happyMsgGrp = HAPPY.addMessageGroup({ el: messagesElement, parent: this });
    return happyMsgGrp;
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
    this.messages = this.getMessages();
  }

}



class HappyField extends HappyItem {

  constructor(options)
  {
    super('field', options);
    F1.console.log('HappyField::construct()');
  }


  addInputSelector(selector)
  {
    this.addChildSelector(selector);
  }


  getInputs()
  {
    let happyField = this, happyInputs = [];
    let inputSelector = happyField.getOpt('inputSelector',
      'input:not(hidden):not([type="submit"]), textarea, select');
    let inputElements = happyField.el.querySelectorAll(inputSelector);
    for (let i = 0, n = inputElements.length; i < n; i++) {
      let happyInput = HAPPY.addInput({ el: inputElements[i], parent: happyField });
      happyInputs.push(happyInput);
    }
    return happyInputs;
  }


  getType()
  {
    return this.el.getAttribute('data-type');
  }


  getName()
  {
    return this.el.name || this.el.getAttribute('data-name');
  }


  getLabel()
  {
    return this.el.getAttribute('data-label');
  }


  getMessages()
  {
    // F1.console.log('HappyField::getMessages()');
    let messagesSelector = this.getOpt('messagesSelector', '.field-messages');
    let messagesElement = this.el.querySelector(messagesSelector);
    let happyMsgGrp = HAPPY.addMessageGroup({ el: messagesElement, parent: this });
    return happyMsgGrp;
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
    this.messages = this.getMessages();
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
    F1.console.log('HappyForm::construct()');
  }


  addFieldSelector(selector)
  {
    this.addChildSelector(selector);
  }


  getFields()
  {
    let happyForm = this, formFields = [];
    let fieldSelector = happyForm.getOpt('fieldSelector', '.field');
    let fieldElements = happyForm.el.querySelectorAll(fieldSelector);
    for (let i = 0, n = fieldElements.length; i < n; i++) {
      let happyField = HAPPY.addField({ el: fieldElements[i], parent: happyForm });
      formFields.push(happyField);
    }
    return formFields;
  }


  getMessages()
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
    F1.console.log('HappyDoc::construct()');
  }


  addFormSelector(selector)
  {
    this.addChildSelector(selector);
  }


  getForms()
  {
    F1.console.log('HappyDoc::getForms()');
    let happyDoc = this, docForms = [];
    let formSelector = happyDoc.getOpt('formSelector', 'form');
    let formElements = happyDoc.el.querySelectorAll(formSelector);
    for (let i = 0, n = formElements.length; i < n; i++) {
      let happyForm = HAPPY.addForm({ el: formElements[i], parent: happyDoc });
      docForms.push(happyForm);
    }
    return docForms;
  }


  getMessages()
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

HP7.Item     = HappyItem;
HP7.Doc      = HappyDoc;
HP7.Form     = HappyForm;
HP7.Field    = HappyField;
HP7.Input    = HappyInput;
HP7.Message  = HappyMessage;
HP7.MessageGroup = HappyMessageGroup;

let HAPPY = new HP7();
