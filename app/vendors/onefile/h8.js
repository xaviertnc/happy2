/**
 * F1 FORM MANAGER Extension
 * By: C. Moller <xavier.tnc@gmail.com>
 * Date: 24 Aug 2020
 */

(function(window/*, undefined*/){

  function rateLimit(context, fn, params, interval) { const date = new Date(), now = date.getTime();
      if ((now - (context.lastUpdated || 0)) > interval) { context.lastUpdated = now; fn.apply(context, params); }
  }

  //////// MESSAGE /////////
  const Message = function(context, type, text, tag) { const msgEl = document.createElement(tag || 'div');
    this.context = context; msgEl.innerHTML = text; msgEl.id = (context.modelType || 'f1msg') + '_' + type;
    msgEl.className = 'message ' + type; this.text = text; this.mounted = 0; this.el = msgEl; };
  Message.prototype = { modelType: 'message',
    // mountMethod = [Str] OR e.g [f(msg){mount(msg.el, msg.anchorElement);msg.mounted=1;return msg.el;}]
    show: function(anchorEl, mountMethod) {
      const msg = this; if (typeof mountMethod === 'function') { return mountMethod(msg); }
      anchorEl = anchorEl || this.el.parentElement; msg.anchorElement = anchorEl;
      switch (mountMethod) {
      case 'before' : anchorEl.parentElement.insertBefore(msg.el, anchorEl); break;
      case 'after'  : anchorEl.parentElement.insertBefore(msg.el, anchorEl.nextElementSibling); break;
      case 'prepend': anchorEl.prependChild(msg.el); break;
      default: anchorEl.appendChild(msg.el); }
      msg.mounted = 1; },
    update: function(newText) { this.text = newText; if (this.el) { this.el.innerHTML = newText; } },
    remove: function() { this.el.parentElement.removeChild(this.el); this.mounted = 0; }
  };

  //////// VALIDATOR /////////
  const Validator = function(name, props) {
    this.id = name; this.validateFn = props.validateFn;
    this.messageFn = props.messageFn || function(o){ return o.label?o.label+' is invalid.':'invalid'; };
    this.summaryMessageFn = props.summaryMessageFn || this.messageFn; };
  Validator.prototype = { modelType: 'validator',
    validate: function(model, isSubmit, args, event) { return this.validateFn(model, isSubmit, args, event); },
    getMessage: function(model, isSubmit, args, event) { return this.messageFn(model, isSubmit, args, event); },
    getSummaryMessage: function(model, isSubmit, args, event) { return this.sumaryMsgTemplateFn(model, isSubmit, args, event); }
  };

  //////// ACTION BUTTON /////////
  const ActionButton = function(parent, el) { this.el = el; el.f1Model = this; this.parent = parent;
    this.type = parent ? parent.detectActionButtonType(el) : this.detectType();
    F1.extend(this, this.type + '_' + this.modelType); this.state = { enabled: 0 };
    this.detectID(); this.detectEnabled(); this.action = this.detectAction(); };
  ActionButton.prototype = { modelType: 'action-button',
    detectType: function() { this.type = this.el.getAttribute('type'); },
    detectID: function() { this.id = this.el.id || ('action' + ActionButton.nextId++); },
    detectEnabled: function() { return this.state.enabled = this.el.enabled; },
    detectAction: function() { return this.action = this.el.value; },
    update: function() { this.parent.update(); },
    updateDOM: function() {}
  }; ActionButton.nextId = 1;

  //////// INPUT /////////
  const Input = function(parentField, el) {
    this.el = el; el.f1Model = this; this.parentField = parentField; this.autoValidate = true;
    this.type = parentField ? parentField.detectInputType(el) : this.detectType();
    F1.extend(this, this.type + '_' + this.modelType); this.detectID();
    if (this.type === 'checkbox' || this.type === 'radio') { this.isCheckOrRadio = true; }
    else { this.detectRequired(); this.detectValidateRules(); this.detectLabel(); }
    this.messages = {}; this.state = { modified: 0, unhappy: 0 }; };
  Input.prototype = { modelType: 'input',
    getValue: function(init) { this.value = this.el.value; if (init) { this.initialValue = this.value; } /*console.log('Input.getValue(', this.id, '):', this.value);*/ return this.value; },
    setValue: function(val) { this.el.value = this.value = val; },
    detectRequired: function() { this.required = this.el.hasAttribute('required'); },
    detectValidateRules: function() { this.validations = {}; },
    detectLabel: function() { this.labelEl = this.el.parentElement.querySelector('.input-label'); this.label = this.labelEl ? this.labelEl.innerHTML : null; return this.label; },
    detectType: function() { this.type = this.el.getAttribute('type') || 'text'; },
    detectID: function() { this.id = this.el.id || ('input' + Input.nextId++); },
    // Also add required if set.
    validate: function(isSubmit) { if (this.value) { console.log('Validating INPUT:', this.id, ', isSubmit:', isSubmit); } },
    addMessage: function(/*message, anchorSelector, mountStyle*/) {},
    update: function() { this.getValue(); this.validate(); this.parentField.update(); },
    updateDOM: function() {}
  }; Input.nextId = 1;

  //////// FIELD /////////
  const Field = function(parentForm, el) {
    this.el = el; el.f1Model = this; this.parentForm = parentForm; this.messages = {};
    this.validationRules = []; this.subValidate = 0; this.state = { modified: 0, unhappy: 0 };
    this.type = parentForm ? parentForm.detectFieldType(el) : this.detectType();
    F1.extend(this, this.type + '_' + this.modelType);
    this.detectID(); this.detectLabel(); this.detectInputs(); this.detectRequired();
    if (this.beforeInit) { this.beforeInit(); } this.getValue('init'); if (this.afterInit) { this.afterInit(); } };
  Field.prototype = { modelType: 'field',
    detectInputType: function(inputEl) { return inputEl.getAttribute('type') || 'text'; },
    detectInputs: function() {
      this.inputs = {}; this.inputsArray = []; this.inputSelector = this.inputSelector || '.input'; this.inputElements = this.el.querySelectorAll(this.inputSelector);
      for (let i = 0; i < this.inputElements.length; i++) { const input = new Input(this, this.inputElements[i]); this.inputs[input.id] = input; this.inputsArray.push(input); } },
    detectRequired: function() { this.required = this.el.classList.contains('required'); },
    detectValidationRules: function(forceUpdate) { if (this.validationRules.length && ! forceUpdate) { return; }
      const rules = [], validateInfo = this.parentForm.parseRules(this.el.getAttribute('data-validate'));
      let foundDefault = 0; for (let i=0, n=validateInfo.length; i < n; i++) { let ruleInfo = validateInfo[i];
        if (ruleInfo.rule === this.type) { foundDefault = 1; ruleInfo.isDefault = 1; } rules.push(ruleInfo); }
      if (this.required) { this.validationRules.push({rule: this.requiredRule || 'required', args: 1}); }
      if ( ! foundDefault) { this.validationRules.push({rule: this.type, args: 1}); }
      this.validationRules.concat(rules); },
    detectLabel: function() { this.labelEl = this.el.querySelector('.field-label'); this.label = this.labelEl ? this.labelEl.innerHTML : null; return this.label; },
    detectType: function() { this.type = this.el.getAttribute('type') || 'text'; },
    detectID: function() { this.id = this.el.id || ('field' + Field.nextId++); },
    setValue: function(val) { return val; },
    getValue: function(init) { const values = [], i0 = this.inputsArray[0] || {};
      if (i0.isCheckOrRadio) {
        this.inputsArray.forEach(function(input){ if (input.el.checked) { values.push(input.getValue()); } });
      } else { this.inputsArray.forEach(function(input){ let v = input.getValue(); if(v.length){values.push(v);} }); }
      this.value = values.join('|'); if (init) { this.initialValue = this.value; }
      console.log('FIELD.getValue(', this.id, ') =', this.value); return this.value; },
    getValidator: function(rule) { return this.parentForm.getValidator(rule); },
    validate: function(isSubmit, event) {
      let ruleInfo, validator, unhappy, errorText, errorSummaryText; this.detectValidationRules(); this.getValue();
      console.log('VALIDATE FIELD:', this.id, ', isSubmit:', isSubmit, this);
      // console.log('Default Validation Rules:', this.validationRules);
      for (let i=0, n=this.validationRules.length; i < n; i++) {
        ruleInfo = this.validationRules[i]; validator = this.getValidator(ruleInfo.rule);
        // console.log('RuleInfo:', ruleInfo, ', Validator:', validator, ', value:', this.value);
        unhappy = validator && ! validator.validate(this, isSubmit, ruleInfo.args, event);
        // console.log('Unhappy:', unhappy);
        if (unhappy) { break; }
      }
      if (unhappy) {
        errorText = validator.getMessage(this, isSubmit, ruleInfo.args, event);
        if (this.errorSummaryAnchorSelector) { errorSummaryText = validator.getSummaryMessage(this, isSubmit, ruleInfo.args, event); }
        if (this.messages.error) { this.messages.error.update(errorText); }
        else {
          const errorMessage = new Message(this, 'error', errorText);
          const errorMessageAnchorEl = this.errorMessageAnchorSelector ? this.el.querySelector(this.errorMessageAnchorSelector) : this.el;
          errorMessage.show(errorMessageAnchorEl, this.errorMessageMountMethod);
          this.messages.error = errorMessage;
        }
        if (this.messages.errorSummary) { this.messages.errorSummary.update(errorSummaryText); }
        else if (errorSummaryText) {
          const errorSummaryMessage = new Message(this, 'error-summary', errorSummaryText);
          const errorSummaryAnchorEl = this.el.querySelector(this.errorSummaryAnchorSelector);
          errorSummaryMessage.show(errorSummaryAnchorEl, this.errorSummaryMountMethod || 'append');
          this.messages.errorSummary = errorSummaryMessage;
        }
      } else {
        if (this.messages.error) { this.messages.error.remove(); }
        if (this.messages.errorsummary) { this.messages.errorsummary.remove(); }
        this.messages.error = null; this.messages.errorsummary = null; return true;
      } },
    addMessage: function(/*message, anchorSelector, mountStyle*/) {},
    update: function() { this.getValue(); this.validate(); this.parentForm.update(); },
    updateDOM: function() {}
  }; Field.nextId = 1;

  //////// FORM /////////
  // Override any FORM methods using the contructor "options" param.
  // E.g. form = new F1.Form(el, { detectFieldType: function(el){...} });
  const Form = function(el, props) {
    props = props || {}; this.el = el; this.el.f1Model = this;
    this.id = el.id || 'form' + Form.nextId++; this.state = { modified: 0, unhappy: 0 };
    this.messages = {}; this.validators = {}; this.initialValues = props.initialValues || {};
    for (let key in props) { this[key] = props[key]; } this.detectFields();
    this.detectActionButtons(); this.init(this.initialValues); };
  Form.prototype = { modelType: 'form',
    init: function(initialValues) {
      this.initialValues = initialValues || this.getInitialValues();
      const serverUnhappy = this.detectServerUnhappy();
      if (serverUnhappy) { this.removeMessages(); }
      for (let fieldID in this.initialValues) {
        const field = this.fields(fieldID);
        field.initialValue = this.initialValues[fieldID];
        field.value = field.initialValue;
        if (serverUnhappy) {
          field.validate();
          // LW: Die volgende mag dalk reeds in field.validate() gedoen word...
          if (field.state.unhappy ) { this.state.unhappy++;   }
          if (field.state.modified) { this.state.modified++;  }
        }
      }
      if (this.state.modified || this.state.unhappy) { this.updateDOM(); }
      this.bindEvents(); },
    parseRules: function(s) { if ( ! (s && s.length)) { return []; } var o = [], rules = s.split(';'); if ( ! rules[1]) { return [{ rule:s, args:1 }]; }
      rules.forEach(function(rule){ var r = rule.split('|'); if(r[1]) { o.push({ rule:r[0], args:r[1] }); } else { o.push({ rule:r[0], args:1 }); } });
      return o; },
    addMessage: function(/*message, anchorSelector, mountStyle*/) {},
    detectServerUnhappy: function() {},
    // NB: Type detection is IMPORTANT! "Type" determines how to extend the base class.
    detectFieldType: function(el) { return el.getAttribute('type') || 'text'; },
    detectFields: function() {
      this.fields = {}; this.fieldsArray = []; this.fieldSelector = this.fieldSelector || '.field'; this.fieldElements = this.el.querySelectorAll(this.fieldSelector);
      for (let i = 0; i < this.fieldElements.length; i++) { const field = new Field(this, this.fieldElements[i]); this.fields[field.id] = field; this.fieldsArray.push(field); } },
    detectActionButtonType: function(el) { return el.getAttribute('type') || 'submit'; },
    detectActionButtons: function() {
      this.buttons = {}; this.buttonsArray = []; this.buttonSelector = this.buttonSelector || '.action-button'; this.buttonElements = this.el.querySelectorAll(this.buttonSelector);
      for (let i = 0; i < this.buttonElements.length; i++) { const button = new ActionButton(this, this.buttonElements[i]); this.buttons[button.id] = button; this.buttonsArray.push(button); } },
    getValidator: function(validatorID) { return this.validators[validatorID]; },
    getInitialValues: function() { return {}; },
    getValues: function() { const values = {}; for (let fieldID in this.fields) { const field = this.fields[fieldID]; values[fieldID] = field.getValue(); } return values; },
    onFocusHandler: function(event) {
      const inputModel = event.target.f1Model; if (!inputModel||inputModel.modelType!=='input') { return; }
      const fieldModel = inputModel.parentField, formModel = fieldModel.parentForm; inputModel.touched = true; fieldModel.touched = true;
      // Ignore any pending `onBlur` event if we are still on the SAME FIELD and sub-validate is false!
      if (fieldModel === formModel.currentField && !fieldModel.subValidate) {
        clearTimeout(formModel.delayBlurEventTimer); formModel.delayBlurEventTimer = null; }
      formModel.currentField = fieldModel; console.log('onFocus:', fieldModel.id, inputModel.id); },
    onBlurHandler: function(event) {
      const inputModel = event.target.f1Model; if (!inputModel||inputModel.modelType!=='input'||inputModel.noValidateOnBlur) { return; }
      const fieldModel = inputModel.parentField, formModel = fieldModel.parentForm;
      // Delay the field-blur event action to allow testing if we actually left this field.
      // The next focus event will clear the timer if we are still on the same field.
      formModel.delayBlurEventTimer = setTimeout(function blurTimeout() {
        if (fieldModel === formModel.currentField) { rateLimit(fieldModel, fieldModel.validate, [false, event], 150); }
        else { fieldModel.validate(false, event); }
      }, 200);
      console.log('onBlur:', fieldModel.id, inputModel.id); },
    onChangeHandler: function(event) { console.log('onChangeHandler() Says Hi!', event); },
    onKeyDownHandler: function(event) { console.log('onKeyDownHandler() Says Hi!', event); },
    onSubmitHandler: function(event) { console.log('onSubmitHandler() Says Hi!', event); },
    bindEvents: function() {
      this.el.addEventListener('focus'   , this.onFocusHandler   , true);
      this.el.addEventListener('blur'    , this.onBlurHandler    , true);
      this.el.addEventListener('change'  , this.onChangeHandler  , true);
      this.el.addEventListener('keydown' , this.onKeyDownHandler , true);
      this.el.addEventListener('submit'  , this.onSubmitHandler  , true); },
    unbindEvents: function() {
      this.el.removeEventListener('submit'  , this.onSubmitHandler  , true);
      this.el.removeEventListener('keydown' , this.onKeyDownHandler , true);
      this.el.removeEventListener('change'  , this.onChangeHandler  , true);
      this.el.removeEventListener('blur'    , this.onBlurHandler    , true);
      this.el.removeEventListener('focus'   , this.onFocusHandler   , true); },
    validate: function(/*isSubmit*/) {},
    firstUnhappyInput: function() {},
    removeMessages: function() {},
    updateDOM: function() {},
    onSubmit: function() {},
    onChange: function() {}
  }; Form.nextId = 1;

  window.F1.registerClass('Message', Message);
  window.F1.registerClass('Validator', Validator);
  window.F1.registerClass('ActionButton', ActionButton);
  window.F1.registerClass('Input', Input);
  window.F1.registerClass('Field', Field);
  window.F1.registerClass('Form', Form);

}(this));
