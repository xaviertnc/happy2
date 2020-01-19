/* globals F1 */
/* eslint-env es7 */

/**
 * Happy-7 JS
 * Simplify the concepts in Happy4 even further!
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  13 Jun 2019
 * @updated: 13 Jul 2019
 *
 */

class Happy {

  constructor(options = {})
  {
    this.reset();
    this.baseDefs = {
      item     : HappyItem,
      document : HappyDocument,
      form     : HappyForm,
      field    : HappyField,
      input    : HappyInput
    };
    this.cleaners   = {}; // and|or formatters
    this.validators = {};
    this.customDefs = {
      documents : {},
      forms     : {},
      fields    : {},
      inputs    : {}
    };
    for (let prop in options) { this[prop] = options[prop]; }
    window.Happy.instance = this;
  }


  reset()
  {
    this.items         = []; // HappyItem == HappyJS Base Component
    this.inputs        = [];
    this.fields        = [];
    this.forms         = [];
    this.documents     = [];
    this.topLevelItems = [];
    this.currentField  = undefined;
    this.activated     = false;
    this.nextId        = 1;
  }


  getHappyClass(baseType, specificType)
  {
    let HappyClass, baseGroup = baseType + 's';
    if (specificType) { HappyClass = this.customDefs[baseGroup][specificType]; }
    return HappyClass || this.baseDefs[baseType];
  }


  guessElementHappyType(el)
  {
    return (el.nodeName.toLowerCase() === 'form') ? 'form' : 'document';
  }


  addItem(baseType, options = {})
  {
    let baseGroup = baseType + 's';
    let specificType = options.type;
    let HappyClass = options.CustomDef || this.getHappyClass(baseType, specificType);
    delete options.CustomDef;
    delete options.type;
    // HappyClass can be a BASE or EXTENDED Def/ES6Class depending on the type
    // of the component and whether a corresponding entry exists in `customDefs`!
    // E.g. HappyClass === HappyField (base) -OR- HappyClass === BirthdayField (custom)
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


  focusUnhappy(selector, elContext = document)
  {
    // F1.console.log('Happy::focusUnhappy(), selector =', selector);
    let unhappyInput = elContext.querySelector(selector || '.unhappy > input');
    if (unhappyInput) { unhappyInput.focus(); return true; }
  }


  focusOnFirstInput(unhappySelector, elContext)
  {
    if ( ! this.focusUnhappy(unhappySelector, elContext)) {
      this.inputs[0] && this.inputs[0].el.focus();
    }
  }


  activate(options = {})
  {
    if ( ! options.el) { throw new Error('Target DOM element required! i.e. options.el'); }
    if (this.activated) { throw new Error('Already active!'); }
    if ( ! this.items.length) {
      let baseType = options.type;
      if (baseType) { delete options.type; }
      else { baseType = this.guessElementHappyType(options.el); }
      let item = this.addItem(baseType, options);
      item.mount();
      this.activated = true;
      return item;
    }
    this.topLevelItems.forEach(item => item.mount());
    this.activated = true;
  }


  deactivate()
  {
    F1.console.log('Happy::deactivate()', this);
    this.topLevelItems.forEach(item => item.dismount());
    this.reset();
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
    this.children = [];
    this.happy = true;
    this.nextId = 1;
  }


  rateLimit(context, fn, params, interval) {
    let date = new Date(), now = date.getTime();
    if ((now - (context.lastUpdated || 0)) > interval) {
      context.lastUpdated = now;
      fn.apply(context, params);
    }
  }


  setOpt(key, value, def)
  {
    if (typeof this.options[key] !== 'undefined') { return; }
    if (typeof value !== 'undefined') { this.options[key] = value; }
    else { this.options[key] = def; }
  }


  getOpt(key, def)
  {
    if (this.options[key]) { return this.options[key]; }
    if (this.parent) { return this.parent.getOpt(key, def); }
    return def;
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
    if (this.happyType !== 'input' && this.happyType !== 'field' || this.subValidate) {
      for (let i=0, n=this.children.length; i < n; i++) {
        if ( ! this.children[i].happy) { return false; }
      }
      return true;
    }
    return this.happy;
  }


  getDomElement()
  {
    if (this.el) { return this.el; }
    if (this.options.selector) {
      let parentElement = this.parent ? this.parent.el : document.body;
      return parentElement.querySelector(this.options.selector);
    }
  }


  getSummaryContainers(options = {})
  {
    let containerElements = [];
    const elContext = options.elContext || document;
    if (options.selector) { containerElements = elContext.querySelectorAll(options.selector); }
    else if (options.elements) { containerElements = options.elements; }
    else { containerElements.push(options.el || this.el); }
    return containerElements;
  }


  getValue(init)
  {
    var rawValue = this.extractValue();
    let val = this.clean(rawValue);
    if (init) { this.initialValue = val; }
    return val;
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
   * E.g. <div data-validate="required|maxLength:2:Provide at least 2 chars">
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
  }


  /**
   * E.g. <div data-format="currency:R|2|,">
   */
  extractCleaners()
  {
    let cleanersAsString = this.el.getAttribute('data-format');
    if ( ! cleanersAsString) { return; }
    this.cleaners = cleanersAsString.split('|');
  }


  clean(raw)
  {
    if ( ! raw) { return raw; }
    let val = raw.trim();
    if ( ! this.cleaners) { return val; }
    for (let i = 0, n = this.cleaners.length; i < n; i++) {
      let fnCleaner = this.happy$.cleaners[this.cleaners[i]];
      if (fnCleaner) { val = fnCleaner.call(this, val); }
    }
    // F1.console.log('HappyItem::clean(), clean:', val);
    return val;
  }


  getNext(stepOut)
  {
    if (this.isTopLevel) { return; }
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
      if (stepOut) {
        let nextParent = parent.getNext();
        if (nextParent && nextParent.children.length) {
          return nextParent.children[0];
        }
      }
      return parent.children[0];
    }
    return parent.children[index];
  }


  getPrev(stepOut)
  {
    if (this.isTopLevel) { return; }
    let childCount = this.parent.children.length;
    if (childCount < 2) { return; }
    let index = this.parent.children.indexOf(this);
    if ( ! index) {
      if (stepOut) {
        let prevParent = this.parent.getPrev();
        if (prevParent && prevParent.children.length) {
          return prevParent.children[prevParent.children.length - 1];
        }
      }
      return this.parent.children[childCount - 1];
    }
    return this.parent.children[index - 1];
  }


  focusUnhappy()
  {
    this.happy$.focusUnhappy(this.getOpt('unhappyInputSelector'), this.el);
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
      if (this.subValidate) {
        // If we have child inputs, first validate their rules!
        let inputsWithRules = [];
        for (let i = 0, n = this.inputs.length; i < n; i++) {
          let input = this.inputs[i];
          for (let r in input.rules) {
            if (input.rules.hasOwnProperty(r)) {
              inputsWithRules.push(input);
              break;
            }
          }
        }
        for (let i = 0, n = inputsWithRules.length; i < n; i++) {
          let inputHappy = true, input = this.inputs[i];
          for (let r in input.rules) {
            let ruleInfo = input.rules[r];
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


  onFocusHandler(event)
  {
    let happyInput = event.target.HAPPY;
    if ( ! happyInput || happyInput.happyType !== 'input') { return; }
    let happyField = happyInput.parent, happy$ = happyInput.happy$;
    happyInput.touched = true;
    happyField.touched = true;
    if (happyField === happy$.currentField && !happyField.subValidate) {
      // Ignore any pending `onBlur` event if we are still on the SAME FIELD!
      clearTimeout(happy$.delayBlurEventTimer); }
    happy$.currentField = happyField;
  }


  onBlurHandler(event)
  {
    let happyInput = event.target.HAPPY;
    if ( ! happyInput || happyInput.happyType !== 'input' ||
      happyInput.getOpt('ignoreBlurEvents')) { return; }
    let happyField = happyInput.parent, happy$ = happyInput.happy$;
    // Checklist, Radiolist and Select Fields should ignore blur events between their OWN inputs.
    // Delay the field-blur event action to allow testing if we actually left this field.
    // The next focus event will clear the timer and delayed action if we are still on the same field.
    happy$.delayBlurEventTimer = setTimeout(function () {
      if (happyField === happy$.currentField) { return; }
      happyField.rateLimit(happyField, happyField.check, [event, 'onBlur'], 150);
    }, 200);
  }


  onChangeHandler(event)
  {
    let happyInput = event.target.HAPPY;
    if ( ! happyInput || happyInput.happyType !== 'input' ||
      happyInput.getOpt('ignoreChangeEvents')) { return; }
    let happyField = happyInput.parent;
    happyField.happy$.delayChangeEventTimer = setTimeout(function () {
      happyField.rateLimit(happyField, happyField.check, [event, 'onChange'], 150);
    }, 200);
  }


  onKeyDownHandler(event)
  {
    let happyInput = event.target.HAPPY;
    if ( ! happyInput || happyInput.happyType !== 'input') { return; }
    let happyField = happyInput.parent;
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
    F1.console.log('HappyItem::onSubmitHandler(), start');
    const happyForm = event.target.HAPPY;
    const elSubmitTrigger = happyForm.el.submitTriggerElement;
    const checkHappy = elSubmitTrigger ? !elSubmitTrigger.hasAttribute('novalidate') : true;
    F1.console.log('HappyItem::onSubmitHandler(), elForm:', happyForm.el);
    F1.console.log('HappyItem::onSubmitHandler(), elSubmitTrigger:', elSubmitTrigger);
    if (happyForm && checkHappy) {
      clearTimeout(happyForm.happy$.delayBlurEventTimer);
      clearTimeout(happyForm.happy$.delayChangeEventTimer);
      const messages = happyForm.checkAll(event, 'isSubmit');
      if (messages.length) {
        const onUnhappySubmitFn = happyForm.getOpt('onUnhappySubmit');
        if (onUnhappySubmitFn && onUnhappySubmitFn(happyForm, messages, event) === 'end') { return; }
        happyForm.renderMessageSummary(messages, {
          elContext: happyForm.el,
          selector: happyForm.getOpt('summarySelector', '.message-summary'),
          htmlTag: happyForm.getOpt('summaryItemTag'),
          type: happyForm.getOpt('summaryType')
        });
        event.preventDefault();
        event.stopPropagation();
        setTimeout(function() { happyForm.focusUnhappy(); });
      }
    }
  }


  removeMessages()
  {
    // F1.console.log('HappyItem::removeMessages(),', this.id);
    const summarySelector = this.getOpt('summarySelector', '.message-summary');
    const summaryElements = document.querySelectorAll(summarySelector);
    summaryElements.forEach(function(elSummary) {
      if (elSummary.classList.contains('remove')) {
        elSummary.parentElement.removeChild(elSummary);
      } else {
        elSummary.innerHTML = '';
        elSummary.classList.add('hidden');
      }
    });
    const elMessageZone = this.el;
    const msgGrpSelector = '.' + this.getOpt('messageGroupClass', 'messages');
    const msgGrpElements = elMessageZone.querySelectorAll(msgGrpSelector);
    msgGrpElements.forEach(elMsgGrp => elMsgGrp.parentElement.removeChild(elMsgGrp));
    this.inputs.forEach(input => input.messages = []);
    this.messages = [];
  }


  addMessages(validateResults, onlyUpdateModel)
  {
    const happyItems = [];
    const msgGrpClass = this.getOpt('messageGroupClass', 'messages');
    const msgClass = this.getOpt('messageClass', 'message error');
    let message, elMsg, elMessageZone, validateResult, happyItem;
    for (let i = 0, n = validateResults.length; i < n; i++) {
      validateResult = validateResults[i];
      message = validateResult.message;
      happyItem = validateResult.item || this;
      happyItem.messages = happyItem.messages || [];
      if ( ! onlyUpdateModel && ! happyItem.elMsgGrp) { // (!elMsgGrp) == only render first msg.
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
        elMsg.innerHTML = message;
        happyItem.elMsgGrp.appendChild(elMsg);
      }
      happyItem.messages.push({
        el: elMsg, elParent: elMessageZone, text: message, happyItem: happyItem
      });
      happyItems.push(happyItem);
    }
    if ( ! onlyUpdateModel) {
      setTimeout(function(){
        // F1.console.log('addMessages::addMessages(), happyItems =', happyItems);
        happyItems.forEach(function(item) {
          if (item.elMsgGrp) {
            item.elMsgGrp.classList.add('animate');
            delete item.elMsgGrp;
          }
        });
      }, 150);
    }
  }


  renderState()
  {
    const happyClass = this.getOpt('happyClass', 'happy');
    const unhappyClass = this.getOpt('unhappyClass', 'unhappy');
    const elStateZone = (this.happyType === 'input') ? this.el.parentElement : this.el;
    // F1.console.log('HappyItem::renderState(),', this.id, this.happy, elStateZone);
    if (this.isHappy()) {
      if (this.touched && this.modified) { elStateZone.classList.add(happyClass); }
      else { elStateZone.classList.remove(happyClass); }
      elStateZone.classList.remove(unhappyClass);
    }
    else {
      elStateZone.classList.add(unhappyClass);
      elStateZone.classList.remove(happyClass);
    }
    const modifiedClass = this.getOpt('modifiedClass', 'modified');
    if (this.modified) { elStateZone.classList.add(modifiedClass); }
    else { elStateZone.classList.remove(modifiedClass); }
  }


  renderMessageSummary(happyMessages = [], options = {})
  {
    // F1.console.log('HappyItem::renderMessageSummary(),', this.id, happyMessages);
    const summaryContainers = this.getSummaryContainers(options);
    const htmlTag = options.htmlTag || 'div';
    const messageRenderedIndex = {};
    let html = '';
    if (options.type === 'short') { happyMessages = [happyMessages[0]]; } // Only one msg in summary!
    happyMessages.forEach(function(happyMessage) {
      const happyItem = happyMessage.happyItem;
      const messageText = happyMessage.text === 'required'
        ? (happyItem.label || 'Input') + ' is required.' // Prettify default required messages.
        : happyMessage.text;
      if ( ! messageRenderedIndex[happyItem.id]) { // Only one msg per field!
        html += '<' + htmlTag + '>' + messageText + '</' + htmlTag + '>';
      }
      messageRenderedIndex[happyItem.id] = true;
    });
    summaryContainers.forEach(function(elSummary) {
      if (elSummary.HAPPY) {
        const elContainer = document.createElement('div');
        elContainer.className = 'message-summary remove';
        elContainer.innerHTML = html;
        elSummary.appendChild(elContainer);
      } else {
        elSummary.innerHTML = html;
        elSummary.classList.remove('hidden');
      }
    });
  }


  render()
  {
    return document.createElement('div');
  }


  check(event, reason)
  {
    let messages = [];
    const reasonCheckOrSubmit = (reason === 'check' || reason === 'isSubmit');
    // F1.console.log('HappyItem::check(),', this.id, reason);
    this.value = this.getValue();
    this.modified = this.isModified();
    if (reason !== 'isParent') {
      const validateResults = this.validate(event, reason) || [];
      this.removeMessages();
      this.addMessages(validateResults); // , reasonCheckOrSubmit
      for (let i = 0, n = this.inputs.length; i < n; i++) {
        let input = this.inputs[i];
        input.modified = input.isModified();
        if (this.subValidate) {
          messages = messages.concat(input.messages);
        } else {
          input.happy = this.happy;
        }
        input.renderState();
      }
    } else {
      this.happy = this.isHappy();
    }
    this.renderState();
    if ( ! reasonCheckOrSubmit && this.parent) { this.parent.check(event, 'isParent'); }
    return messages.concat(this.messages || []);
  }


  checkAll(event, reason) // reason: 'check' or 'isSubmit'
  {
    // F1.console.log('HappyItem::checkAll(),', this.id, reason);
    let messages = [];
    if (this.happyType === 'document') {
      this.forms.forEach(function(form) {
        messages = messages.concat(form.checkAll(event, reason));
      });
    } else { // this.happyType === 'form'
      this.fields.forEach(function(field) {
        if ( ! messages.length) { // Only check until we find something!
          messages = messages.concat(field.check(event, reason));
        }
      });
    }
    this.renderState();
    messages = messages.concat(this.check(event, 'isParent'));
    return messages;
  }


  mount(options = {})
  {
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
  }


  extractLabel()
  {
    let label, el = this.el.previousElementSibling;
    if (el && el.nodeName === 'LABEL') { label = el.innerHTML.replace(/\s*:$/,''); }
    if (label) { return label; }
    el = this.el.closest('.subfield,.field');
    el = el.firstElementChild;
    if (el && el.nodeName === 'LABEL') { label = el.innerHTML.replace(/\s*:$/,''); }
    return label;
  }


  extractRules()
  {
    super.extractRules();
    if (this.el.hasAttribute('pattern')) {
      let pattern = this.el.getAttribute('pattern');
      this.rules.pattern = new HappyRule('pattern:' + pattern);
    }
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
    super('field', options, happy$);
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


  extractName()
  {
    let name;
    if (this.inputs.length === 1) { name = this.inputs[0].name; }
    else { name = this.el.getAttribute('data-name') || this.el.id; }
    return name;
  }


  extractLabel()
  {
    let label = this.el.getAttribute('data-label');
    if (label) { return label; }
    return this.inputs[0].label;
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
    clearTimeout(this.delayBlurEventTimer);
    this.inputs = undefined;
  }
}



class HappyForm extends HappyItem {

  constructor(options, happy$)
  {
    super('form', options, happy$);
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
    super('document', options, happy$);
  }


  extractFormType(elForm)
  {
    return elForm.getAttribute('data-type');
  }


  extractForms()
  {
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