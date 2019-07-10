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

  getClass(baseType, specificType) {
    let HappyClass, baseGroup = baseType + 's';
    if (specificType) { HappyClass = this.customClasses[baseGroup][specificType]; }
    HappyClass = HappyClass || this.baseClasses[baseType];
    // F1.console.log('Happy::getClass()', HappyClass, ', baseType:', baseType,
    //   ', specificType:', specificType);
    return HappyClass;
  }

  guessElementHappyType(el) {
    return (el.nodeName.toLowerCase() === 'form') ? 'form' : 'doc';
  }

  addItem(baseType, options = {})
  {
    // F1.console.log('Happy::addItem()');
    let baseGroup = baseType + 's';
    let specificType = options.type;
    let HappyClass = options.CustomClass || this.getClass(baseType, specificType);
    delete options.CustomClass;
    if (specificType) {
      options[baseType + 'Type'] = specificType; delete options.type;
    }
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

  // happy.find('fullname')  - OR -
  // happy.find('fullname', happy.fields)
  find(name, list = this.items)
  {
    let found, itemIndex = 0;
    let itemCount = list.length; if (!itemCount) { return; }
    while (!found && itemIndex < itemCount) {
      let item = list[itemIndex];
      if (item.id === name || item.name === name) { found = item; }
      itemIndex++;
    }
    return found;
  }

  extractMessageType(elMessage)
  {
    if (elMessage.classList.contains('error')) { return 'error'; }
    return 'info';
  }

  mount(elHappyItem, baseType, options = {})
  {
    if ( ! this.items.length) {
      options.el = elHappyItem;
      baseType = baseType || this.guessElementHappyType(elHappyItem);
      let item = this.addItem(baseType, options);
      item.mount();
      return item;
    } else {
      this.topLevelItems.forEach(item => item.mount());
    }
  }

  dismount() { this.topLevelItems.forEach(item => item.dismount()); }

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

    this.id = this.options.id || this.extractId();

    this.mounted = false;

    this.children = [];

    this.nextId = 1;
  }


  extend(extendWithObj = {})
  {
    return Object.assign(this, extendWithObj);
  }


  hasType(typeList)
  {
    let typePropName = this.happyType + 'Type';
    if (typeof typeList === 'string') { typeList = [typeList]; }
    return typeList.includes(this[typePropName]);
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


  extractId()
  {
    if (this.parent && this.parent.nextId) {
      return this.parent.id + '_' + this.happyType + this.parent.nextId++;
    }
    return this.happyType + this.happy$.nextId++;
  }


  extractName()
  {
    return this.el.getAttribute('data-name') || this.el.name || this.el.id;
  }


  extractType()
  {
    return this.el.getAttribute('data-type') || this.el.type;
  }


  getDomElement()
  {
    if (this.el) { return this.el; }
    if (this.options.selector) {
      let parentElement = this.parent ? this.parent.el : document.body;
      return parentElement.querySelector(this.options.selector);
    }
  }


  /**
   * A Message Zone is the DOM context within which
   * we will search for messages for this item.
   * INPUTS elements can't have messages as children,
   * so we use the PARENT ITEM element as a message zone.
   * HIGHER LEVEL ITEM elements can be their own message zone.
   */
  getMessageZoneElement()
  {
    let elMessagesZone;
    let msgZoneSelector = this.getOpt('messageZoneSelector');
    if (msgZoneSelector) {
      if (this.isTopLevel) {
        elMessagesZone = document.querySelector(msgZoneSelector);
      } else {
        elMessagesZone = this.parent.el.querySelector(msgZoneSelector);
      }
    }
    if ( ! elMessagesZone) {
      if (this.happyType === 'input') {
        elMessagesZone = this.el.parentElement;
      } else {
        elMessagesZone = this.el;
      }
    }
    return elMessagesZone;
  }


  getNext(stepOver)
  {
    if (this.isTopLevel) { return; }
    // F1.console.log('HappyItem::getNext()', this.id);
    let parent = this.parent;
    let childCount = parent.children.length;
    if (childCount < 2) {
      if (parent.isTopLevel) { return; }
      let nextParentParent = parent.parent.getNext();
      // F1.console.log('HappyItem::getNext(), nextParentParent:', nextParentParent);
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
    this.el = (this.el || this.getDomElement()) || options.el;
    if ( ! this.el) {
      // No existing element... Mount as rendered element
      if ( ! appendTo) { appendTo = parent.el || document.body; }
      this.el = this.render();
      appendTo.append(this.el);
      this.isRenderedElement = true;
    }
    this.name = this.extractName();
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
    this.messageType = this.options.type || happy$.extractMessageType(this.el);
    // F1.console.log('HappyMessage::construct()');
  }


  extractId()
  {
    return this.el.id || (this.parent.id + '_msg' + this.parent.nextId++);
  }

}



class HappyMessageGroup extends HappyItem {

  constructor(options, happy$)
  {
    // F1.console.log('HappyMessageGroup::construct()');
    super('messageGroup', options, happy$);
    this.messageGroupType = this.options.type || this.extractType();
  }


  extractId()
  {
    let id = this.el ? this.el.id : undefined;
    return id || (this.parent.id + '_mgrp' + this.parent.nextMessagesId++);
  }


  extractMessages()
  {
    this.messages = [];
    let self = this, happy$ = this.happy$;
    let messageSelector = this.getOpt('messageSelector', '.message');
    let messageElements = this.el.querySelectorAll(messageSelector);
    messageElements.forEach(function(elMsg) {
      let msgType = happy$.extractMessageType(elMsg);
      let MsgClass = happy$.getClass('message', msgType);
      let msg = new MsgClass({ el: elMsg, type: msgType, parent: self },
        happy$);
      self.messages.push(msg);
    });
    this.children = this.messages;
  }


  getErrorMessages()
  {
    return this.messages.filter(message => message.messageType === 'error');
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


  extractHappyState()
  {

  }


  extractModifiedState()
  {

  }


  extractMessageGroupType(elMsgGroup) {
    return elMsgGroup.getAttribute('data-type') || 'default';
  }


  /**
   * For removal of all server-side messages before update?
   * To check if we have any errors direct from server-side HTML?
   */
  extractMessageGroups()
  {
    this.messageGroups = [];
    let happyItem = this, happy$ = this.happy$;
    let elMessageZone = happyItem.getMessageZoneElement();
    let msgGrpSelector = this.options.messageGroupSelector; // MUST be a local option!
    if ( ! msgGrpSelector) { return; } // A selector MUST be defined!
    let msgGroupElements = elMessageZone.querySelectorAll(msgGrpSelector);
    msgGroupElements.forEach(function(msgGroupElement)
    {
      let groupType = happyItem.extractMessageGroupType(msgGroupElement);
      let MsgGrpClass = happy$.getClass('messageGroup', groupType);
      let msgGrp = new MsgGrpClass({
        el: msgGroupElement, type: groupType, parent: happyItem
      }, happy$);
      happyItem.messageGroups.push(msgGrp);
      msgGrp.extractMessages();
    });
    if ( ! msgGroupElements.length) {
      // Add a default message group, if we can't find one!
      let msgGrp = new HappyMessageGroup ({
        el: elMessageZone, type: 'default', parent: happyItem
      }, happy$);
      happyItem.messageGroups.push(msgGrp);
      msgGrp.extractMessages();
    }
  }


  getMessages()
  {
    // F1.console.log('HappyCanValidate::getErrorMessages()');
    let messages = [];
    this.messageGroups.forEach(function(msgGroup) {
      messages = messages.concat(msgGroup.messages);
    });
    this.children.forEach(function(child) {
      messages = messages.concat(child.getMessages());
    });
    return messages;
  }


  getErrorMessages()
  {
    // F1.console.log('HappyCanValidate::getErrorMessages()');
    let errorMessages = [];
    this.messageGroups.forEach(function(msgGroup) {
      errorMessages = errorMessages.concat(msgGroup.getErrorMessages());
    });
    this.children.forEach(function(child) {
      errorMessages = errorMessages.concat(child.getErrorMessages());
    });
    return errorMessages;
  }


  mount(options)
  {
    super.mount(options);
    this.extractMessageGroups();
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


  extractLabel()
  {
    let el = this.el.previousElementSibling;
    if (el.nodeName === 'LABEL') { return el.innerText; }
  }


  extractInitialValue()
  {

  }


  extractValue()
  {

  }


  validate()
  {

  }


  mount(options)
  {
    // We need to force a default here, since we use this option
    // in a generic method that is NOT type dependant!
    this.setOpt('messageGroupSelector',
      this.getOpt('messageGroupSelector', '.input-messages')
    );
    super.mount(options);
    this.inputType = this.inputType || this.extractType();
  }

}



class HappyField extends HappyCanValidate {

  constructor(options, happy$)
  {
    // F1.console.log('HappyField::construct()');
    super('field', options, happy$);
  }


  extractInputType(elInput)
  {
    return elInput.getAttribute('data-type') || elInput.type;
  }


  extractInputs()
  {
    let happyField = this, happyInputs = [];
    let inputSelector = happyField.getOpt('inputSelector',
      'input:not(hidden):not([type="submit"]), textarea, select');
    let inputElements = happyField.el.querySelectorAll(inputSelector);
    for (let i = 0, n = inputElements.length; i < n; i++) {
      let elInput = inputElements[i];
      let inputType = happyField.extractInputType(elInput);
      let happyInput = happyField.happy$.addItem('input', {
        el: elInput, type: inputType, parent: happyField
      });
      happyInputs.push(happyInput);
    }
    return happyInputs;
  }


  extractName()
  {
    return this.el.name;
  }


  extractLabel()
  {
    return this.el.getAttribute('data-label');
  }


  extractValue()
  {

  }


  ignoreBlur()
  {
    return this.hasType(['checkbox', 'checklist', 'radiolist', 'select', 'file']);
  }


  validate()
  {

  }


  mount(options)
  {
    this.setOpt('messageGroupSelector',
      this.getOpt('messageGroupSelector', '.field-messages')
    );
    super.mount(options);
    this.fieldType = this.fieldType || this.extractType();
    this.inputs = this.extractInputs();
    this.children = this.inputs;
    this.inputs.forEach(input => input.mount());
  }


  dismount()
  {
    super.dismount();
    this.inputs = undefined;
  }
}



class HappyForm extends HappyCanValidate {

  constructor(options, happy$)
  {
    // F1.console.log('HappyForm::construct()');
    super('form', options, happy$);
  }


  extractFieldType(elField)
  {
    return elField.getAttribute('data-type');
  }


  extractFields()
  {
    let happyForm = this, formFields = [];
    let fieldSelector = happyForm.getOpt('fieldSelector', '.field');
    let fieldElements = happyForm.el.querySelectorAll(fieldSelector);
    for (let i = 0, n = fieldElements.length; i < n; i++) {
      let elField = fieldElements[i];
      let fieldType = happyForm.extractFieldType(elField);
      let happyField = happyForm.happy$.addItem('field', {
        el: elField, type: fieldType, parent: happyForm });
      formFields.push(happyField);
    }
    return formFields;
  }


  extractValue()
  {

  }


  validate()
  {

  }


  mount(options)
  {
    super.mount(options);
    this.fields = this.extractFields();
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


  extractFormType(elForm)
  {
    return elForm.getAttribute('data-type');
  }


  extractForms()
  {
    F1.console.log('HappyDoc::extractForms()');
    let happyDoc = this, docForms = [];
    let formSelector = happyDoc.getOpt('formSelector', 'form');
    let formElements = happyDoc.el.querySelectorAll(formSelector);
    for (let i = 0, n = formElements.length; i < n; i++) {
      let elForm = formElements[i];
      let formType = happyDoc.extractFormType(elForm);
      let happyForm = happyDoc.happy$.addItem('form', {
        el: elForm, type: formType, parent: happyDoc
      });
      docForms.push(happyForm);
    }
    return docForms;
  }



  extractValue()
  {

  }


  validate()
  {

  }


  mount(options)
  {
    F1.console.log('HappyDoc::mount()');
    super.mount(options);
    this.forms = this.extractForms();
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