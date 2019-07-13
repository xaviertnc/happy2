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
    this.baseClasses   = {
      item     : HappyItem,
      document : HappyDocument,
      form     : HappyForm,
      field    : HappyField,
      input    : HappyInput
    };
    this.cleaners      = {}; // and|or formatters
    this.validators    = {};
    this.customClasses = {
      documents : {},
      forms     : {},
      fields    : {},
      inputs    : {}
    };
    this.initVars();
    this.extend(options);
    window.Happy.instance = this;
  }

  initVars()
  {
    this.items         = [];
    this.inputs        = [];
    this.fields        = [];
    this.forms         = [];
    this.documents     = [];
    this.topLevelItems = [];
    this.currentField  = undefined;
    this.nextId        = 1;
  }

  extend(extendWithObj = {})
  {
    return Object.assign(this, extendWithObj);
  }

  printf(tpl = '', args)
  {
    args = args || [];
    if (typeof args === 'string') { args = [args]; }
    return tpl ? tpl.replace(/{(\d+)}/g, function(match, number) {
      return (typeof args[number] !== 'undefined') ? args[number] : match;
    }) : tpl;
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
    return (el.nodeName.toLowerCase() === 'form') ? 'form' : 'document';
  }

  addItem(baseType, options = {})
  {
    // F1.console.log('Happy::addItem()');
    let baseGroup = baseType + 's';
    let specificType = options.type;
    let HappyClass = options.CustomClass || this.getClass(baseType, specificType);
    delete options.CustomClass;
    delete options.type;
    // HappyClass can be a default Happy Item Class or a
    // Custom Happy Item Class based on the specific type of the item
    // and wether a corresponding custom class exists in `customClasses`!
    // E.g. HappyClass === HappyField -OR- HappyClass === BirthdayField (custom)
    let happyItem = new HappyClass(options, this);
    if (specificType) { happyItem[baseType + 'Type'] = specificType; }
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


  focusUnhappy(selector) {
    let unhappyInput = document.querySelector(selector || '.unhappy > input');
    if (unhappyInput) { unhappyInput.focus(); }
  }


  mount(options = {})
  {
    if ( ! options.el) { throw new Error('A mount element is required!'); }
    if ( ! this.items.length) {
      let baseType = options.type;
      if (baseType) { delete options.type; }
      else { baseType = this.guessElementHappyType(options.el); }
      let item = this.addItem(baseType, options);
      item.mount();
      return item;
    } else {
      this.topLevelItems.forEach(item => item.mount());
    }

  }

  dismount() {
    this.topLevelItems.forEach(item => item.dismount());
    this.initVars();
  }

}
// end: Happy



class HappyRule {

  constructor(ruleDef) {
    let args = ruleDef.split(':');
    this.name = args.shift();
    this.args = args;
    this.arg = args.length ? args[0] : undefined;
  }

}
// end: HappyRule


class HappyItem {

  constructor(happyType, options = {}, happy$)
  {
    // F1.console.log('HappyItem::construct(), happyType =', happyType);
    this.el = options.el;
    this.parent = options.parent;
    this.happyType = happyType;
    delete options.parent;
    delete options.el;

    this.options = options;
    this.happy$ = happy$;

    if ( ! this.parent) { this.isTopLevel = true; }

    this.name = this.options.name; // Set in mount() if undefined
    this.id = this.options.id || this.extractId();

    this.mounted = false;
    this.happy = true;

    this.children = [];

    this.nextId = 1;
  }


  isType(typeList)
  {
    let typePropName = this.happyType + 'Type';
    if (typeof typeList === 'string') { typeList = [typeList]; }
    let ok = typeList.includes(this[typePropName]);
    return ok;
  }


  isModified()
  {
    if (this.happyType === 'input') { return this.value !== this.initialValue; }
    for (let i=0, n=this.children.length; i < n; i++) {
      if (this.children[i].isModified()) { return true; }
    }
    return false;
  }


  isHappy()
  {
    // F1.console.log('HappyItem::isHappy()');
    if (this.happyType === 'input') { return this.happy; }
    for (let i=0, n=this.children.length; i < n; i++) {
      if ( ! this.children[i].happy) { return false; }
    }
    return true;
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


  getDomElement()
  {
    if (this.el) { return this.el; }
    if (this.options.selector) {
      let parentElement = this.parent ? this.parent.el : document.body;
      return parentElement.querySelector(this.options.selector);
    }
  }


  extractId()
  {
    let idBase;
    switch(this.happyType) {
    case 'input'   : idBase = 'i'; break;
    case 'field'   : idBase = 'f'; break;
    case 'document': idBase = 'doc'; break;
    default: idBase = this.happyType; }
    if (this.parent && this.parent.nextId) {
      return this.parent.id + '_' + idBase + this.parent.nextId++;
    }
    return idBase + this.happy$.nextId++;
  }


  extractType()
  {
    return this.inputs.length ? this.inputs[0].inputType : 'text';
  }


  extractName()
  {
    return this.el.getAttribute('data-name') || this.el.name || this.el.id;
  }


  extractLabel()
  {
    return this.el.getAttribute('data-label');
  }


  extractValue()
  {
    let val;
    switch (this.inputType) {
    case 'radio'   :
    case 'checkbox': val = this.el.checked  ? (this.el.value || 1) : ''; break;
    case 'option'  : val = this.el.selected ? (this.el.value || 1) : ''; break;
    default        : val = this.el.value; }
    return val;
  }


  /**
   * E.g. <div data-validate="required|maxLength:2:Provide at least $1 chars">
   */
  extractRules()
  {
    let self = this; this.rules = this.rules || {};
    let rulesAsString = this.el.getAttribute('data-validate');
    let ruleDefs = rulesAsString ? rulesAsString.split('|') : [];
    ruleDefs.forEach(function createRule(ruleDef) {
      let rule = new HappyRule(ruleDef);
      self.rules[rule.name] = rule;
    });
    if ( ! this.rules.required && this.el.hasAttribute('required')) {
      this.rules.required = new HappyRule('required');
    }
    if ( ! this.rules.required && this.el.classList.contains('required')) {
      this.rules.required = new HappyRule('required');
    }
    // F1.console.log('HappyItem::extractRules(), rules:', this.id, this.rules);
  }


  /**
   * E.g. <div data-format="currency">
   */
  extractCleaners()
  {
    let cleanersAsString = this.el.getAttribute('data-format');
    if ( ! cleanersAsString) { return; }
    this.cleaners = cleanersAsString.split('|');
    // F1.console.log('HappyItem::extractCleaners(), cleaners:', this.cleaners);
  }


  clean(raw)
  {
    // F1.console.log('HappyItem::clean(),', this.id, ', raw:', raw);
    if ( ! raw) { return raw; }
    let val = raw.trim();
    if ( ! this.cleaners) { return val; }
    for (let i = 0, n = this.cleaners.length; i < n; i++) {
      let fnCleaner = this.happy$.cleaners[this.cleaners[i]];
      if (fnCleaner) { val = fnCleaner.call(this, val); }
    }
    F1.console.log('HappyItem::clean(), clean:', val);
    return val;
  }


  bindEvents()
  {
    if (this.isTopLevel) {
      this.el.addEventListener('focus'   , this.onFocusHandler   , true);
      this.el.addEventListener('blur'    , this.onBlurHandler    , true);
      this.el.addEventListener('change'  , this.onChangeHandler  , true);
      this.el.addEventListener('keydown' , this.onKeyDownHandler , true);
      this.el.addEventListener('submit'  , this.onSubmitHandler  , true);
    }
  }


  unbindEvents()
  {
    if (this.isTopLevel) {
      this.el.removeEventListener('submit'  , this.onSubmitHandler  , true);
      this.el.removeEventListener('keydown' , this.onKeyDownHandler , true);
      this.el.removeEventListener('change'  , this.onChangeHandler  , true);
      this.el.removeEventListener('blur'    , this.onBlurHandler    , true);
      this.el.removeEventListener('focus'   , this.onFocusHandler   , true);
    }
  }


  /**
   * NOTE: Only HappyFields should call this method!
   */
  validate(event, reason)
  {
    // F1.console.log('HappyItem::validate(),', this.id, reason, ', val =', this.value);
    let validateResults = [], fnCustomValidate = this.getOpt('validate');
    this.happy = true;
    if (fnCustomValidate) {
      validateResults = fnCustomValidate(event, reason);
    } else {
      let happy$ = this.happy$;
      if (this.subValidateInputs) {
        // F1.console.log('HappyItem::validate(), subValidateInputs');
        // If we have child inputs, first validate their rules!
        let inputsWithRules = [];
        for (let i = 0, n = this.inputs.length; i < n; i++) {
          let input = this.inputs[i];
          // F1.console.log('HappyItem::validate(), input.rules:', input.rules);
          for (let r in input.rules) {
            if (input.rules.hasOwnProperty(r)) {
              inputsWithRules.push(input);
              break;
            }
          }
        }
        // F1.console.log('HappyItem::validate(), inputsWithRules:', inputsWithRules);
        for (let i = 0, n = inputsWithRules.length; i < n; i++) {
          let inputHappy = true, input = this.inputs[i];
          for (let r in input.rules) {
            let ruleInfo = input.rules[r];
            // F1.console.log('HappyItem::validate(input), ruleInfo:', ruleInfo);
            let validator = happy$.validators[ruleInfo.name];
            if (validator) {
              // NOTE: We call the validator with HappyInput context!
              let message = validator.call(input, ruleInfo, reason);
              if (message) {
                if (ruleInfo.name === 'required') {
                  validateResults.unshift({ item: input, message: message });
                } else {
                  validateResults.push({ item: input, message: message });
                }
                inputHappy = false;
                this.happy = false;
              }
            }
          }
          input.happy = inputHappy;
        }
      }
      // Now test the field level rules.
      for (let r in this.rules) {
        let ruleInfo = this.rules[r];
        let validator = happy$.validators[ruleInfo.name];
        if (validator) {
          // NOTE: We call the validator with "this" === HappyField context!
          // We therefore have access to all field properties inside the
          // validator. E.g. this.happy$, this.type, this.el, this.value, etc.
          // F1.console.log('HappyItem::validate(field), ruleInfo:', ruleInfo);
          let message = validator.call(this, ruleInfo, reason);
          if (message) {
            if (ruleInfo.name === 'required') {
              validateResults.unshift({ item: this, message: message });
            } else {
              validateResults.push({ item: this, message: message });
            }
            this.happy = false;
          }
        }
      }
    }
    return validateResults;
  }


  rateLimit(context, fn, params, interval) {
    let date = new Date(), now = date.getTime();
    if ((now - (context.lastUpdated || 0)) > interval) {
      context.lastUpdated = now;
      fn.apply(context, params);
    }
  }


  onFocusHandler(event)
  {
    // F1.console.log('HappyItem::onFocusHandler()', event);
    let happyInput = event.target.HAPPY;
    if ( ! happyInput || happyInput.happyType !== 'input') { return; }
    let happyField = happyInput.parent, happy$ = happyInput.happy$;
    // Checklist, Radiolist and Select Fields should ignore blur events
    // between their OWN inputs. ignoreBlur() checks for these types.
    if (happyField === happy$.currentField && happyField.ignoreBlur()) {
      // Ignore any pending `onBlur` event if we are still on the SAME FIELD!
      return clearTimeout(happyField.delayBlurEventTimer);
    }
    happy$.currentField = happyField;
  }


  onBlurHandler(event)
  {
    // F1.console.log('HappyItem::onBlurHandler()', event);
    let happyInput = event.target.HAPPY;
    if ( ! happyInput || happyInput.happyType !== 'input') { return; }
    let happyField = happyInput.parent;
    // Delay the field-blur event action to check if we actually left this field.
    // The next input-focus event will clear the timer if we are still on the same field.
    happyField.delayBlurEventTimer = setTimeout(function () {
      happyField.rateLimit(happyField, happyField.update, [event, 'onBlur'], 150);
    });
  }


  onChangeHandler(event)
  {
    // F1.console.log('HappyItem::onChangeHandler()', event);
    let happyInput = event.target.HAPPY;
    if ( ! happyInput || happyInput.happyType !== 'input') { return; }
    let happyField = happyInput.parent;
    happyField.rateLimit(happyField, happyField.update, [event, 'onChange'], 150);
  }


  onKeyDownHandler(event)
  {
    // F1.console.log('HappyItem::onKeyDownHandler()', event);
    let happyInput = event.target.HAPPY;
    if ( ! happyInput || happyInput.happyType !== 'input') { return; }
    let happyField = happyInput.parent;
    // F1.console.log('HappyItem::onKeyDownHandler(), happyField', happyField);
    // Focus on the NEXT FIELD or INPUT when we press ENTER
    if (event.key === 'Enter' || event.when == 13 || event.keyCode == 13) {
      if (happyField.isType('memo')) { return; }
      event.stopImmediatePropagation();
      event.preventDefault();
      let nextHappyInput;
      if (happyField.isType(['checkbox','checklist','radiolist'])) {
        // Also "Check/Select" the FIELD INPUT if it's in the list above.
        happyInput.el.click();
      }
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


  onSubmitHandler(event)
  {
    F1.console.log('HappyItem::onSubmitHandler()', event);
    // Run validations + Stop event if validation fails...
    event.target.HAPPY.update(event, 'onSubmit');
    if ( ! this.happy) {
      event.preventDefault();
      event.stopPropagation();
    }
  }


  getNext(stepOver)
  {
    if (this.isTopLevel) { return; }
    // F1.console.log('HappyItem::getNext(), Start:', this.id);
    let parent = this.parent;
    let childCount = parent.children.length;
    if (childCount < 2) {
      if (parent.isTopLevel) { return; }
      let nextParent = parent.getNext();
      if (nextParent && nextParent.children.length) {
        return nextParent.children[0];
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


  getValue(init)
  {
    var rawValue = this.extractValue();
    let val = this.clean(rawValue);
    if (init) { this.initialValue = val; }
    return val;
  }


  render()
  {
    return document.createElement('div');
  }


  renderState()
  {
    let happyClass = this.getOpt('happyClass', 'happy');
    let unhappyClass = this.getOpt('unhappyClass', 'unhappy');
    let elStateZone = (this.happyType === 'input') ? this.el.parentElement : this.el;
    // F1.console.log('HappyItem::renderState(),', this.id, this.happy, elStateZone);
    if (this.isHappy()) {
      elStateZone.classList.add(happyClass);
      elStateZone.classList.remove(unhappyClass);
    }
    else {
      elStateZone.classList.add(unhappyClass);
      elStateZone.classList.remove(happyClass);
    }
    let modifiedClass = this.getOpt('modifiedClass', 'modified');
    if (this.modified) { elStateZone.classList.add(modifiedClass); }
    else { elStateZone.classList.remove(modifiedClass); }
  }


  addMessages(validateResults)
  {
    // F1.console.log('HappyItem::addMessages(), validateResults:', validateResults);
    let message, elMsg, elMessageZone, validateResult, happyItem;
    let msgGrpClass = this.getOpt('messageGroupClass', 'messages');
    let msgClass = this.getOpt('messageClass', 'message error');
    for (let i = 0, n = validateResults.length; i < n; i++) {
      validateResult = validateResults[i];
      happyItem = validateResult.item || this;
      happyItem.messages = happyItem.messages || [];
      if (happyItem.elMsgGrp) { continue; }
      elMsg = document.createElement('li');
      elMsg.className = msgClass;
      elMessageZone = (happyItem.happyType === 'input')
        ? happyItem.el.parentElement
        : happyItem.el.querySelector('.input-group');
      if ( ! elMessageZone) { elMessageZone = happyItem.el; }
      if ( ! happyItem.elMsgGrp) {
        happyItem.elMsgGrp = document.createElement('ul');
        happyItem.elMsgGrp.className = msgGrpClass;
        elMessageZone.appendChild(happyItem.elMsgGrp);
      }
      message = validateResult.message;
      elMsg.innerHTML = message;
      happyItem.elMsgGrp.appendChild(elMsg);
      happyItem.messages.push({ el: elMsg, elParent: elMessageZone, text: message });
    }
    for (let i = 0, n = validateResults.length; i < n; i++) {
      validateResult = validateResults[i];
      if (validateResult.item) { delete validateResult.item.elMsgGrp; }
    }
    delete this.elMsgGrp;
  }


  removeMessages()
  {
    let elMessageZone = this.el;
    let msgGrpSelector = '.' + this.getOpt('messageGroupClass', 'messages');
    let msgGrpElements = elMessageZone.querySelectorAll(msgGrpSelector);
    // F1.console.log('HappyItem::removeMessages(), msgGrpElements', msgGrpElements);
    msgGrpElements.forEach(elMsgGrp => elMsgGrp.parentElement.removeChild(elMsgGrp));
    this.inputs.forEach(input => input.messages = []);
    this.messages = [];
  }


  update(event, reason)
  {
    // F1.console.log('HappyItem::update(),', this.id, reason);
    this.value = this.getValue();
    this.modified = this.isModified();
    if (reason === 'isParent') {
      this.happy = this.isHappy();
    } else {
      let validateResults = this.validate(event, reason) || [];
      this.removeMessages();
      this.addMessages(validateResults);
      for (let i = 0, n = this.inputs.length; i < n; i++) {
        let input = this.inputs[i];
        input.modified = input.isModified();
        input.renderState();
      }
    }
    this.renderState();
    if ( ! this.isTopLevel) {
      this.parent.update(event, 'isParent');
    }
  }


  mount(options = {})
  {
    // F1.console.log('HappyItem::mount()');
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
    this.el.HAPPY = this;
    if (this.isTopLevel) {
      F1.console.log('Happy[', this.happyType, ']::mount() - ok', this);
    }
    this.mounted = true;
    this.bindEvents();
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
    this.nextId = 1;
    this.mounted = false;
    if ( ! this.isRenderedElement) {
      this.unbindEvents();
    }
  }

}
// end: HappyItem



class HappyInput extends HappyItem {

  constructor(options, happy$)
  {
    super('input', options, happy$);
    // F1.console.log('HappyInput::construct()');
  }


  extractLabel()
  {
    let el = this.el.previousElementSibling;
    if (el && el.nodeName === 'LABEL') {
      return el.innerHTML.replace(/\s*:$/,'');
    }
  }


  extractRules()
  {
    // F1.console.log('HappyInput::extractRules()');
    super.extractRules();
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
    // F1.console.log('HappyInput::extractRules(), rules:', this.name, this.rules);
  }


  mount(options)
  {
    super.mount(options);
    this.extractRules();
    this.extractCleaners();
    this.value = this.getValue('init');
    this.name = this.extractName();
    this.label = this.extractLabel();
  }

}



class HappyField extends HappyItem {

  constructor(options, happy$)
  {
    // F1.console.log('HappyField::construct()');
    super('field', options, happy$);
  }


  extractInputType(elInput)
  {
    return elInput.getAttribute('data-type') || elInput.type;
  }


  extractName()
  {
    let name;
    if (this.inputs.length === 1) { name = this.inputs[0].name; }
    else { name = this.el.getAttribute('data-name') || this.el.id; }
    return name;
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


  getValue(init)
  {
    let inputValues = [];
    for (let i = 0, n = this.inputs.length; i < n; i++) {
      let input = this.inputs[i];
      input.value = input.getValue(init);
      if (input.value || input.value === 0) { inputValues.push(input.value); }
    }
    let fieldValue = inputValues.join(',');
    if (init) { this.initialValue = fieldValue; }
    return fieldValue;
  }


  ignoreBlur()
  {
    return this.isType(['checkbox', 'checklist', 'radiolist', 'select', 'file']);
  }


  mount(options)
  {
    super.mount(options);
    this.extractRules();
    this.extractCleaners();
    this.extractInputs();
    this.inputs.forEach(input => input.mount());
    this.fieldType = this.fieldType || this.extractType();
    this.value = this.getValue('init');
    this.name = this.extractName();
    this.label = this.extractLabel();
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


  getValue()
  {
    let val = {};
    for (let i=0, n=this.fields.length; i < n; i++) {
      let field = this.fields[i];
      val[field.name || field.id] = field.value;
    }
    return val;
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



class HappyDocument extends HappyItem {

  constructor(options, happy$)
  {
    // F1.console.log('HappyDoc::construct()');
    super('document', options, happy$);
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