/* globals document, F1, Happy */
/* eslint-env es7 */

/**
 * Happy-7 JS
 * Simplify the concepts in Happy4 even further!
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  13 Jun 2019
 *
 */

class Happy {

  constructor()
  {
    this.nextId        = 1;
    this.docs          = [];
    this.forms         = [];
    this.fields        = [];
    this.inputs        = [];
    this.messageGroups = [];
    this.items         = [];
    this.topLevelItems = [];
    this.cleaners      = {}; // and|or formatters
    this.validators    = {};
    this.baseClasses = {
      item        : HappyItem,
      doc         : HappyDoc,
      form        : HappyForm,
      field       : HappyField,
      input       : HappyInput,
      message     : HappyMessage,
      messageGroup: HappyMessageGroup
    };
    this.customClasses = {
      docs         : {},
      forms        : {},
      fields       : {},
      inputs       : {},
      messages     : {},
      messageGroups: {},
    };
    this.currentField = undefined;
    window.Happy.instance = this;
  }

  addItem(baseType, options = {})
  {
    // F1.console.log('Happy::addItem()');
    let baseGroup = baseType + 's';
    let specificType = options.type;
    let HappyClass = options.CustomClass;
    if (HappyClass) { delete options.CustomClass; }
    if (specificType) {
      HappyClass = this.customClasses[baseGroup][specificType];
      options[baseType + 'Type'] = specificType;
      delete options.type;
    }
    if ( ! HappyClass) { HappyClass = this.baseClasses[baseType]; }
    // HappyClass can be a default Happy Item Class or a
    // Custom Happy Item Class based on the specific type of the item
    // and wether a corresponding custom class exists in `customClasses`!
    // E.g. HappyClass === HappyField -OR- HappyClass === BirthdayField (custom)
    let happyItem = new HappyClass(options, this);
    if (happyItem.isTopLevel) { this.topLevelItems.push(happyItem); }
    if (this[baseGroup]) { this[baseGroup].push(happyItem); }
    this.items.push(happyItem);
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

  addDocument    (options) { return this.addItem('doc'         , options); }
  addForm        (options) { return this.addItem('form'        , options); }
  addField       (options) { return this.addItem('field'       , options); }
  addInput       (options) { return this.addItem('input'       , options); }
  addMessageGroup(options) { return this.addItem('messageGroup', options); }

  getDocument    (name) { return this.findItem(name, this.docs         ); }
  getForm        (name) { return this.findItem(name, this.forms        ); }
  getField       (name) { return this.findItem(name, this.fields       ); }
  getInput       (name) { return this.findItem(name, this.inputs       ); }
  getMessageGroup(name) { return this.findItem(name, this.messageGroups); }

  mount()    { this.topLevelItems.forEach(item => item.mount());    }
  dismount() { this.topLevelItems.forEach(item => item.dismount()); }

  firstUnhappyField() {
    for (let i=0,n=this.fields.length; i < n; i++) {
      let field = this.fields[i];
      if ( ! field.happy) { return field; }
    }
  }

}



class HappyItem {

  constructor(type, options = {}, happy$)
  {
    // F1.console.log('HappyItem::construct(), type =', type);
    this.happy$ = happy$;
    this.happyType = type;
    this.parent = options.parent;
    this.el = options.el;
    delete options.parent;
    delete options.el;

    this.options = options;

    if ( ! this.parent) { this.isTopLevel = true; }

    this.name = this.options.name;
    this.value = this.options.value;
    this.initialValue = this.options.initialValue;

    this.id = this.options.id || this.getId();

    this.mounted = false;

    this.children = [];

    this.nextId = 1;
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
    return this.happyType + this.happy$.nextId++;
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


  render()
  { // Override me
    return document.createElement('div');
  }


  mount(options = {})
  {
    // console.log('HappyItem::mount()');
    if (this.mounted) { return; }
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
    this.mounted = true;
    if (this.isTopLevel) {
      F1.console.log('Happy[', this.happyType, ']::mount() - ok', this); }
  }


  dismount()
  {
    if (this.el && this.isRenderedElement) {
      this.el.parentElement.removeChild(this.el);
      this.el = undefined;
    } else {
      if (this.el) { delete this.el.HAPPY; }
    }
    if (this.children) {
      this.children.forEach(child => child.dismount());
      this.children = undefined;
    }
    this.mounted = false;
    this.nextId = 1;
  }


  // Just to complete the interface...
  beforeUpdate() {/* Override me */}
  afterUpdate()  {/* Override me */}
  update()       {/* Override me */}

}



class HappyMessage extends HappyItem {

  constructor(options, happy$)
  {
    super('message', options, happy$);
    this.messageType = this.options.type || this.getType();
    // F1.console.log('HappyMessage::construct()');
  }


  getId()
  {
    return this.el.id || (this.parent.id + '_msg' + this.parent.nextId++);
  }


  getType()
  {
    if (this.el.classList.contains('error')) { return 'error'; }
    return 'info';
  }

}



class HappyMessageGroup extends HappyItem {

  constructor(options, happy$)
  {
    // F1.console.log('HappyMessageGroup::construct()');
    super('messageGroup', options, happy$);
  }


  getId()
  {
    let id = this.el ? this.el.id : undefined;
    return id || (this.parent.id + '_mgrp' + this.parent.nextMessagesId++);
  }


  getMessages()
  {
    let self = this, messages = [];
    let messageSelector = this.getOpt('messageSelector', '.message');
    let messageElements = this.el.querySelectorAll(messageSelector);
    messageElements.forEach(function(elMessage) {
      messages.push(new HappyMessage({ el: elMessage, parent: self }));
    });
    return messages;
  }


  getErrorMessages()
  {
    let errorMessages = [];
    this.messages.forEach(function(message) {
      if (message.type === 'error') { errorMessages.push(message); }
    });
    return errorMessages;
  }

  mount(options) {
    super.mount(options);
    this.messages = this.getMessages();
    this.messages.forEach(message => message.mount());
    this.errors = this.getErrorMessages();
    this.children = this.messages;
  }

}



class HappyCanValidate extends HappyItem {

  constructor(type, options, happy$)
  {
    // F1.console.log('HappyCanValidate::construct()');
    super(type, options, happy$);
    this.happy = true;
    this.modified = false;
    this.required = false;
    this.nextMessagesId = 1;
  }


  bindEvents()
  {
    if (this.isTopLevel) {
      this.el.addEventListener('submit'  , this.onSubmitHandler   , true);
      this.el.addEventListener('blur'    , this.onValidateHandler , true);
      this.el.addEventListener('change'  , this.onValidateHandler , true);
      this.el.addEventListener('keydown' , this.onKeyDownHandler  , true);
      this.el.addEventListener('focus'   , this.onFocusHandler    , true);
    }
  }


  unbindEvents()
  {
    if (this.isTopLevel) {
      this.el.removeEventListener('focus'   , this.onFocusHandler    , true);
      this.el.removeEventListener('keydown' , this.onKeyDownHandler  , true);
      this.el.removeEventListener('change'  , this.onValidateHandler , true);
      this.el.removeEventListener('blur'    , this.onValidateHandler , true);
      this.el.removeEventListener('submit'  , this.onSubmitHandler   , true);
    }
  }


  onFocusHandler(event)
  {
    // F1.console.log('HappyCanValidate::onFocusHandler()', event);
    let happyItem = event.target.HAPPY;
    if ( ! happyItem || happyItem.happyType !== 'input') { return; }
    let happyField = happyItem.parent;
    // Checklists, Radiolists and Selects should ignore blur events between OWN inputs.
    if (happyField === happyItem.happy$.currentField && happyField.ignoreBlur()) {
      return clearTimeout(happyField.delayBlurEventTimer);
    }
    happyItem.happy$.currentField = happyField;
    if (happyField.options.onFocus && happyField.options.onFocus(event)) { return; }
    // console.log('HappyCanValidate::onValidateHandler() field focus', happyField.id);
  }


  onKeyDownHandler(event)
  {
    // F1.console.log('HappyCanValidate::onKeyDownHandler()', event);
    let happyItem = event.target.HAPPY;
    if ( ! happyItem || happyItem.happyType !== 'input') { return; }
    let happyField = happyItem.parent;
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
  }


  // Here be dragons... You've been WARNED!
  onValidateHandler(event)
  {
    // F1.console.log('HappyCanValidate::onValidateHandler()', event);
    let happyItem = event.target.HAPPY;
    if ( ! happyItem || happyItem.happyType !== 'input') { return; }
    let happyField = happyItem.parent;

    if (event.type === 'blur') {
      // Delay the field-blur event action to check if we actually left this field.
      // The next input-focus event will clear the timer if we are still on the same field.
      happyField.delayBlurEventTimer = setTimeout(function () {
        let date = new Date(), now = date.getTime();
        if ((now - (happyField.lastUpdated || 0)) > 250) {
          // console.log('HappyCanValidate::onValidateHandler() blur', happyItem.id);
          happyField.lastUpdated = now;
          let skipUpdate = happyField.beforeUpdate(event);
          if (skipUpdate) { return; }
          happyField.validate(event);
          happyField.update(event);
          happyField.afterUpdate(event);
        }
      }, 150);
      return;
    }

    // event.type = change, event.type = input
    let date = new Date(), now = date.getTime();
    if ((now - (happyField.lastUpdated || 0)) > 250) {
      // console.log('HappyCanValidate::onValidateHandler()', event.type, happyItem.id);
      happyField.lastUpdated = now;
      let skipUpdate = happyField.beforeUpdate(event);
      if (skipUpdate) { return; }
      happyField.validate(event);
      happyField.update(event);
      happyField.afterUpdate(event);
    }
  }


  onSubmitHandler(event)
  {
    F1.console.log('HappyCanValidate::onSubmitHandler()', event);
    // Run validations + Stop event if validation fails...
    // event.preventDefault();
    // event.stopPropagation();
  }


  /**
   * For removal of all server-side messages before update?
   * To check if we have any errors direct from server-side HTML?
   */
  getMessageGroups(defaultSelector, elContainer)
  {
    // F1.console.log('HappyField::getMessages()');
    let happyField = this, messageGroups = [];
    let msgGroupSelector = this.getOpt('fieldMessageGroupSelector', defaultSelector);
    let msgGroupElements = elContainer.querySelectorAll(msgGroupSelector);
    msgGroupElements.forEach(function(msgGroupElement)
    {
      let messageGroup = happyField.happy$.addMessageGroup({
        el: msgGroupElement, parent: happyField
      });
      messageGroups.push(messageGroup);
    });
    return messageGroups;
  }


  getMessages()
  {
    let messages = [];
    this.messageGroups.forEach(function(messageGroup) {
      messages = messages.concat(messageGroup.messages);
    });
    return messages;
  }


  mount(options)
  {
    super.mount(options);
    this.bindEvents();
  }


  dismount()
  {
    super.dismount();
    if ( ! this.isRenderedElement) { this.unbindEvents(); }
  }
}



class HappyInput extends HappyCanValidate {

  constructor(options, happy$)
  {
    super('input', options, happy$);
    // F1.console.log('HappyInput::construct()');
  }


  getType()
  {
    return this.el.getAttribute('data-type') || this.el.type;
  }


  getLabel()
  {
    let el = this.el.previousElementSibling;
    if (el.nodeName === 'LABEL') { return el.innerText; }
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
    this.inputType = this.inputType || this.getType();
    let elContainer = this.getContainerElement();
    this.messageGroups = this.getMessageGroups('.input-messages', elContainer);
    this.messageGroups.forEach(messageGroup => messageGroup.mount());
    this.messages = this.getMessages();
  }

}



class HappyField extends HappyCanValidate {

  constructor(options, happy$)
  {
    // F1.console.log('HappyField::construct()');
    super('field', options, happy$);
  }


  getInputType(elInput)
  {
    return elInput.getAttribute('data-type') || elInput.type;
  }


  getInputs()
  {
    let happyField = this, happyInputs = [];
    let inputSelector = happyField.getOpt('inputSelector',
      'input:not(hidden):not([type="submit"]), textarea, select');
    let inputElements = happyField.el.querySelectorAll(inputSelector);
    for (let i = 0, n = inputElements.length; i < n; i++) {
      let elInput = inputElements[i];
      let inputType = happyField.getInputType(elInput);
      let happyInput = happyField.happy$.addInput({
        el: elInput, type: inputType, parent: happyField
      });
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
    let fieldTypes = (typeof fieldType === 'string') ? [fieldType] : fieldType;
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
    super.mount(options);
    this.fieldType = this.fieldType || this.getType();
    this.inputs = this.getInputs();
    this.children = this.inputs;
    this.inputs.forEach(input => input.mount());
    this.messageGroups = this.getMessageGroups('.field-messages', this.el);
    this.messageGroups.forEach(messageGroup => messageGroup.mount());
    this.messages = this.getMessages();
  }


  dismount()
  {
    super.dismount();
    this.inputs = undefined;
  }
}



class HappyForm extends HappyItem {

  constructor(options, happy$)
  {
    // F1.console.log('HappyForm::construct()');
    super('form', options, happy$);
  }


  getFieldType(elField)
  {
    return elField.getAttribute('data-type');
  }


  getFields()
  {
    let happyForm = this, formFields = [];
    let fieldSelector = happyForm.getOpt('fieldSelector', '.field');
    let fieldElements = happyForm.el.querySelectorAll(fieldSelector);
    for (let i = 0, n = fieldElements.length; i < n; i++) {
      let elField = fieldElements[i];
      let fieldType = happyForm.getFieldType(elField);
      let happyField = happyForm.happy$.addField({
        el: elField, type: fieldType, parent: happyForm });
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



class HappyDoc extends HappyCanValidate {

  constructor(options, happy$)
  {
    // F1.console.log('HappyDoc::construct()');
    super('doc', options, happy$);
  }


  getFormType(elForm)
  {
    return elForm.getAttribute('data-type');
  }


  getForms()
  {
    F1.console.log('HappyDoc::getForms()');
    let happyDoc = this, docForms = [];
    let formSelector = happyDoc.getOpt('formSelector', 'form');
    let formElements = happyDoc.el.querySelectorAll(formSelector);
    for (let i = 0, n = formElements.length; i < n; i++) {
      let elForm = formElements[i];
      let formType = happyDoc.getFormType(elForm);
      let happyForm = happyDoc.happy$.addForm({
        el: elForm, type: formType, parent: happyDoc
      });
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



window.Happy = Happy;