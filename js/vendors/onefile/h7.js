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

  constructor(options = {})
  {
    this.nextId        = 1;
    this.documents     = [];
    this.forms         = [];
    this.fields        = [];
    this.inputs        = [];
    this.items         = [];
    this.topLevelItems = [];
    this.cleaners      = {}; // and|or formatters
    this.validators    = {};
    this.baseClasses   = {
      item        : HappyItem,
      document    : HappyDoc,
      form        : HappyForm,
      field       : HappyField,
      input       : HappyInput
    };
    this.customClasses = {
      documents   : {},
      forms       : {},
      fields      : {},
      inputs      : {}
    };
    this.extend(options);
    this.currentField = undefined;
    window.Happy.instance = this;
  }

  extend(extendWithObj = {})
  {
    return Object.assign(this, extendWithObj);
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


  isType(typeList)
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
// end: HappyItem



class HappyRule {

  constructor(ruleDef) {
    let args = ruleDef.split(':');
    this.name = args.shift();
    this.args = args;
    this.arg = args.length ? args[0] : undefined;
  }

}
// end: HappyRule



class HappyCanValidate extends HappyItem {

  constructor(type, options, happy$)
  {
    // F1.console.log('HappyCanValidate::construct()');
    super(type, options, happy$);
    this.nextMessagesId = 1;
  }


  bindEvents()
  {
    if (this.isTopLevel) {
      this.el.addEventListener('submit'  , this.onSubmitHandler  , true);
      this.el.addEventListener('blur'    , this.onBlurHandler    , true);
      this.el.addEventListener('change'  , this.onChangeHandler  , true);
      this.el.addEventListener('keydown' , this.onKeyDownHandler , true);
      this.el.addEventListener('focus'   , this.onFocusHandler   , true);
    }
  }


  unbindEvents()
  {
    if (this.isTopLevel) {
      this.el.removeEventListener('focus'   , this.onFocusHandler   , true);
      this.el.removeEventListener('keydown' , this.onKeyDownHandler , true);
      this.el.removeEventListener('change'  , this.onChangeHandler  , true);
      this.el.removeEventListener('blur'    , this.onBlurHandler    , true);
      this.el.removeEventListener('submit'  , this.onSubmitHandler  , true);
    }
  }


  onFocusHandler(event)
  {
    // F1.console.log('HappyCanValidate::onFocusHandler()', event);
    let happyInput = event.target.HAPPY;
    if ( ! happyInput || happyInput.happyType !== 'input') { return; }
    let happyField = happyInput.parent, happy$ = happyInput.happy$;
    // Checklists, Radiolists and Selects should ignore blur events between OWN inputs.
    if (happyField === happy$.currentField && happyField.ignoreBlur()) {
      return clearTimeout(happyField.delayBlurEventTimer);
    }
    happy$.currentField = happyField;
    if (happyField.options.onFocus) { happyField.options.onFocus(event); }
  }


  onKeyDownHandler(event)
  {
    // F1.console.log('HappyCanValidate::onKeyDownHandler()', event);
    let happyInput = event.target.HAPPY;
    if ( ! happyInput || happyInput.happyType !== 'input') { return; }
    let happyField = happyInput.parent;
    if (happyField.options.onKeyDown && happyField.options.onKeyDown(event)) { return; }
    // Focus on the NEXT FIELD or INPUT when we press ENTER
    if (event.key === 'Enter' || event.when == 13 || event.keyCode == 13) {
      if (happyField.isType(['memo'])) { return; }
      event.stopImmediatePropagation();
      event.preventDefault();
      let nextHappyInput;
      if (happyField.isType(['checkbox','checklist','radiolist'])) {
        // Also "Check/Select" the FIELD INPUT if it's in the list above.
        happyInput.el.click();
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
        nextHappyInput = happyInput.getNext(true);
      }
      if (nextHappyInput) { nextHappyInput.el.focus(); }
    }

    else if (event.key === 'ArrowDown' && happyField.isType('checklist')) {
      // Focus on the NEXT INPUT if we press Arrow Down on a checklist field
      let nextHappyInput = happyInput.getNext();
      if (nextHappyInput) { nextHappyInput.el.focus(); }
    }

    else if (event.key === 'ArrowUp' && happyField.isType('checklist')) {
      // Focus on the PREV INPUT if we press Arrow Up on a checklist field
      let prevHappyInput = happyInput.getPrev();
      if (prevHappyInput) { prevHappyInput.el.focus(); }
    }
  }


  onChangeHandler(event)
  {
    // F1.console.log('HappyCanValidate::onChangeHandler()', event);
    let happyInput = event.target.HAPPY;
    if ( ! happyInput || happyInput.happyType !== 'input') { return; }
    let happyField = happyInput.parent;
    let date = new Date(), now = date.getTime();
    if ((now - (happyField.lastUpdated || 0)) > 250) {
      // console.log('HappyCanValidate::onChangeHandler()', event.type, happyInput.id);
      happyField.lastUpdated = now;
      let skipUpdate = happyField.beforeUpdate(event);
      if (skipUpdate) { return; }
      happyField.validate(event);
      happyField.update(event);
      happyField.afterUpdate(event);
    }
  }


  onBlurHandler(event)
  {
    // F1.console.log('HappyCanValidate::onBlurHandler()', event);
    let happyInput = event.target.HAPPY;
    if ( ! happyInput || happyInput.happyType !== 'input') { return; }
    let happyField = happyInput.parent;
    // Delay the field-blur event action to check if we actually left this field.
    // The next input-focus event will clear the timer if we are still on the same field.
    happyField.delayBlurEventTimer = setTimeout(function () {
      let date = new Date(), now = date.getTime();
      if ((now - (happyField.lastUpdated || 0)) > 250) {
        // console.log('HappyCanValidate::onBlurHandler() blur', happyInput.id);
        happyField.lastUpdated = now;
        let skipUpdate = happyField.beforeUpdate(event);
        if (skipUpdate) { return; }
        happyField.validate(event);
        happyField.update(event);
        happyField.afterUpdate(event);
      }
    }, 150);
  }


  onSubmitHandler(event)
  {
    F1.console.log('HappyCanValidate::onSubmitHandler()', event);
    // Run validations + Stop event if validation fails...
    // event.preventDefault();
    // event.stopPropagation();
  }


  /**
   * E.g. <div data-validate="{'required':true,'maxlen':2}">
   */
  extractRules()
  {
    let self = this; self.rules = self.rules || {};
    let rulesAsString = this.el.getAttribute('data-validate');
    if ( ! rulesAsString) { return; }
    let ruleDefs = rulesAsString.split('|');
    ruleDefs.forEach(function createRule(ruleDef) {
      let rule = new HappyRule(ruleDef);
      self.rules[rule.name] = rule;
    });
    // F1.console.log('HappyCanValidate::extractRules(), rules:', self.rules);
  }


  mount(options)
  {
    super.mount(options);
    this.extractRules();
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


  extractValue()
  {

  }


  validate()
  {

  }


  extractRules()
  {
    // F1.console.log('HappyInput::extractRules()');
    this.rules = {};
    if (this.el.hasAttribute('required') ||
      this.parent.el.classList.contains('required')) {
      this.rules.required = new HappyRule('required');
    }
    if (this.el.hasAttribute('min')) {
      let min = this.el.getAttribute('min');
      this.rules.min = new HappyRule('min:' + min);
    }
    if (this.el.hasAttribute('max')) {
      let max = this.el.getAttribute('max');
      this.rules.max = new HappyRule('max:' + max);
    }
    if (this.el.hasAttribute('pattern')) {
      let pattern = this.el.getAttribute('pattern');
      this.rules.pattern = new HappyRule('pattern:' + pattern);
    }
    super.extractRules();
    // F1.console.log('HappyInput::extractRules(), rules:', this.name, this.rules);
  }


  mount(options)
  {
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
    let happyField = this; happyField.inputs = [];
    let inputSelector = happyField.getOpt('inputSelector',
      'input:not(hidden):not([type="submit"]), textarea, select');
    let inputElements = happyField.el.querySelectorAll(inputSelector);
    for (let i = 0, n = inputElements.length; i < n; i++) {
      let elInput = inputElements[i];
      let inputType = happyField.extractInputType(elInput);
      let happyInput = happyField.happy$.addItem('input', {
        el: elInput, type: inputType, parent: happyField
      });
      happyField.inputs.push(happyInput);
    }
    happyField.children = happyField.inputs;
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
    return this.isType(['checkbox', 'checklist', 'radiolist', 'select', 'file']);
  }


  validate()
  {

  }


  mount(options)
  {
    super.mount(options);
    this.fieldType = this.fieldType || this.extractType();
    this.extractInputs();
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
    let happyForm = this; happyForm.fields = [];
    let fieldSelector = happyForm.getOpt('fieldSelector', '.field');
    let fieldElements = happyForm.el.querySelectorAll(fieldSelector);
    for (let i = 0, n = fieldElements.length; i < n; i++) {
      let elField = fieldElements[i];
      let fieldType = happyForm.extractFieldType(elField);
      let happyField = happyForm.happy$.addItem('field', {
        el: elField, type: fieldType, parent: happyForm });
      happyForm.fields.push(happyField);
    }
    happyForm.children = happyForm.fields;
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
    this.extractFields();
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
    let happyDoc = this; happyDoc.forms = [];
    let formSelector = happyDoc.getOpt('formSelector', 'form');
    let formElements = happyDoc.el.querySelectorAll(formSelector);
    for (let i = 0, n = formElements.length; i < n; i++) {
      let elForm = formElements[i];
      let formType = happyDoc.extractFormType(elForm);
      let happyForm = happyDoc.happy$.addItem('form', {
        el: elForm, type: formType, parent: happyDoc
      });
      happyDoc.forms.push(happyForm);
    }
    happyDoc.children = happyDoc.forms;
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
    this.extractForms();
    this.forms.forEach(form => form.mount());
  }


  dismount()
  {
    super.dismount();
    this.forms = undefined;
  }

}



window.Happy = Happy;