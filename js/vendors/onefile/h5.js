/* globals document, window */
/* eslint-env es6 */

/**
 * Happy5 JS
 * Simplify the concepts in Happy4 even further!
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  17 September 2018
 *
 */

class HappyElement {

  constructor (parent, options) {
    let noop = function (){};
    let noconsole = { log: noop, error: noop, dir: noop };
    this.nextId = 0;
    this.parent = parent;
    this.options = options || {};
    this.el = this.findDomElement();
    this.debug = this.options.debug || (this.parent ? this.parent.debug : false);
    this.console = (this.debug && window.console) ? window.console : noconsole;
    this.id = this.getId();
    //this.console.log('HappyElement:', this);
  }

  findDomElement ()  {
    let options = this.options;
    if (options.el) {
      return options.el;
    }
    if (options.fn && options.fn.findDomElement) {
      return options.fn.findDomElement(options);
    }
    if (options.selector) {
      return options.containerElement
        ? options.containerElement.querySelector(options.selector)
        : this.parent.el.querySelector(options.selector);
    }
  }

  findParentElement (el, selector) {
    if (typeof el.closest === 'undefined') {
      while ((el = el.parentElement) &&
        !((el.matches || el.matchesSelector).call(el, selector)));

      return el;
    }
    return el.closest(selector);
  }

  isDisabled () {
    if (this.options.disabled) { return this.options.disabled; }
    if (this.el) {
      return this.el.classList.contains('disabled') ||
        this.el.hasAttribute('disabled');
    }
    return false;
  }

  isReadOnly () {
    if (this.options.readonly) { return this.options.readonly; }
    if (this.el) {
      return this.el.classList.contains('readOnly') ||
        this.el.hasAttribute('readOnly');
    }
    return false;
  }

  isHidden () {
    if (this.options.hidden) { return this.options.hidden; }
    if (this.el) {
      return this.el.classList.contains('hidden') ||
        this.getType() === 'hidden';
    }
    return false;
  }

  getState () {
    let state = {};
    state.disabled = this.isDisabled();
    state.readOnly = this.isReadOnly();
    state.hidden = this.isHidden();
    return state;
  }

  getId () {
    if (this.options.id) { return this.options.id; }
    if (this.el && this.el.id) { return this.el.id; }
    return this.parent.nextId++;
  }

  getName () {
    if (this.options.name) { return this.options.name; }
    if (this.el && this.el.name) { return this.el.name; }
  }

  getLabel () {
    if (this.options.label) { return this.options.label; }
    if (this.el) {
      let label = this.el.getAttribute('data-label');
      if (typeof label === 'undefined') {
        label = this.el.querySelector('label').innerText;
      }
      return label;
    }
  }

  getType () {
    if (this.options.type) { return this.options.type; }
    if (this.el) {
      let type = this.el.getAttribute('data-type');
      if (typeof type === 'undefined') {
        type = this.el.getAttribute('type');
      }
      return type;
    }
    return 'text';
  }

  getParams () {
    if (this.options.params) { return this.options.params; }
    if (this.el) { return this.el.getAttribute('data-params'); }
  }

  getPrevElement () {
    return this.options.prev;
  }

  getNextElement () {
    return this.options.next;
  }

  show () {
    this.el.classList.remove('hidden');
  }

  hide () {
    this.el.classList.add('hidden');
  }

  remove () {
    this.el.parentElement.removeChild(this.el);
    return this.el;
  }

  enable () {
    this.el.disabled = false;
    this.el.classList.remove('disabled');
  }

  disable () {
    this.el.disabled = true;
    this.el.classList.add('disabled');
  }

  setReadOnly () {
    this.el.readOnly = true;
    this.el.classList.add('readOnly');
  }

} // end: HappyElement


// options: { el:? } - OR -
// options: { selector:?, containerElement:? }
// options: { text: 'Hello World', 'anchorElm': someElement, addMethod: 'after'}
class HappyMessage extends HappyElement {

  constructor (parent, options) {
    super(parent, options);
    if (this.el) { this.text = this.getText(); }
  }

   getText () {
    this.console.log('HappyMessage.getText:', messageText);
    return el.text;
  }

  place (messageText, anchorElm, addMethod) {
    addMethod = addMethod || 'append'; // before, after, prepend
    anchorElm = anchorElm || document.body;
    this.console.log('HappyMessage.add:', messageText, anchorElm, addMethod);
    this.el = document.createElement('span');
    el.id = this.options.messageID;
    el.text = messageText;
    if (addMethod === 'append') {
      anchorElm.appendElementChild(this.el);
    }
    else {
      // Do nothing for now...
    }
  }

  remove () {
    this.el.parentElement.removeElementChild(this.el);
  }

} // end: HappyMessage



class HappyInput extends HappyElement {

  constructor (parent, options) {
    super(parent, options);
    this.type = this.getType() || this.parent.type;
    this.messages = this.getMessages();
    this.state = this.getState();
  }

  getValue () {
    return this.el ? this.el.value : undefined;
  }

  getMessages () {
    let input = this;
    let field = input.parent;
    let messages = [];
    // Look for input-container
    //   - if (has container): Look inside container
    //   - else: Look inside field
    let messageElements = options.containerElement
      ? options.containerElement.querySelector(options.selector)
      : this.parent.el.querySelector(options.selector);

    messageElements.forEach(function(el) {
      messages.push(new HappyMessage({ el: el }));
    });
  }

} // end: HappyInput




class HappyField extends HappyElement {

  constructor (parent, options) {

    super(parent, options);

    this.name = this.getName();
    this.label = this.getLabel();
    this.type = this.getType();
    this.prev = this.getNext();
    this.next = this.getPrev();
    this.params = this.getParams();
    this.inputs = options.inputs || this.getInputs();
    this.value = this.getValue();
    this.initialValue = this.getInitialValue();
    this.validators = this.getValidators();
    this.messages = this.getMessages();
    this.state = this.getState();

  }


  validate (isSubmit) {

    let field = this;
    let currentState = this.state.happy ? 'happy' : 'unhappy';
    let validationErrors = [];
    let validationResult;

    // Loop through validators here + Set/Clear error messages
    this.validators.forEach(function (validator) {
      let validationMessage = validator.validate(field, isSubmit);
      if (validationMessage) {
        validationMessages.push(validationMessage);
        validationResult = 'unhappy';
      }
    });

    if (validationResult !== currentState) {
      this.updateHappy();
      this.state.happy = validationResult === 'happy' ? true : false;
      this.state.unhappy = !this.state.happy;
      if (this.state.happy) {
        this.onHappy();
      } else {
        this.onUnhappy();
      }
    }

    this.updateMessages(validationMessages);

    return this.state.happy;

  }


  getInitialValue () {

    return this.el.getAttribute('initial-value') || this.value;

  }


  isModified () {

    return this.el.classList.contains('modified');

  }


  isUnhappy () {

    return this.el.classList.contains('has-error');

  }


  getValidators () {

    return [];

  }


  getState () {

    let state = super.getState()
    state.modified = this.isModified();
    state.unhappy = this.isUnhappy();
    state.happy = !state.unhappy;
    return state;

  }


  getInputs () {

    let field = this;
    let inputs = [];
    let inputSelector = this.options.inputSelector || 'input:not(hidden):not([type="submit"]), textarea, select';
    let inputElements = this.el.querySelectorAll(inputSelector)

    inputElements.forEach(function (el) {
      inputs.push(new HappyInput(field, { 'el': el }));
    });

    return inputs;

  }


  getValue () {

    let fieldValue;

    if (this.inputs.length) {

      if (this.inputs.length > 1) {

        let inputValues = [];
        this.inputs.forEach(function (input) {
          let inputValue = input.getValue();
          if (inputValue) { inputValues.push(inputValue); }
        });

        fieldValue = inputValues.join(',');

      } else {

        fieldValue = this.inputs[0].getValue();

      }

    }

    return fieldValue;

  }


  getMessages () {

    let field = this;
    let messagesContainerSelector = this.options.messagesContainerSelector || '.field-messages';
    let messagesContainerElement = this.el.querySelector(messagesContainerSelector);
    this.messagesContainer = new HappyMessagesContainer(field, { el: messagesContainerElement });
    return this.messagesContainer.getMessages();

  }


  addMessage (message) {

  }


  removeMessage (message) {

  }


  updateMessages () {

  }


  update ()
  {

    let modified = this.isModified();
    let happy = this.validate();

    if (currentSate.disabled !== this.state.disabled) {
      this.updateDisabled();
    }

    if (currentSate.readonly !== this.state.readonly) {
      this.updateReadOnly();
    }

    if (currentSate.hidden !== this.state.hidden) {
      this.updateHidden();
    }

  }


  onBlur () {

  }


  onFocus () {

  }


  onModified () {

  }


  onHappy () {

  }


  onUnhappy () {

  }


  onSubmit () {

  }

}




class HappyForm extends HappyElement {

  constructor (options) {

    super(options.parent || { nextId: 0, debug: false }, options);
    this.fields = options.fields || this.getFields();
    this.state = this.getState();

  }


  getFields () {

    let form = this;
    let formFields = [];
    let fieldSelector = this.options.fieldSelector || '.field';
    let fieldElements = this.el.querySelectorAll(fieldSelector);

    fieldElements.forEach(function(el) {
      formFields.push(new HappyField(form, { 'el': el }));
    });

    return formFields;

  }


  isModified () {

    let form = this;
    let formModified = false;

    form.fields.forEach(function (field) {
      if (field.state.modified) { formModified = true; }
    });

    return formModified;

  }


  isUnhappy () {

    let form = this;
    let formUnhappy = false;

    form.fields.forEach(function (field) {
      if (field.state.unhappy) { formUnhappy = true; }
    });

    return formUnhappy;

  }


  getState () {

    let state = super.getState();
    state.modified = this.isModified();
    state.unhappy = this.isUnhappy();
    state.happy = !state.unhappy;

    return state;

  }


  onModified ()
  {

  }


  onSubmit ()
  {

  }

}




class HappyDocument extends HappyElement {

  constructor (options)
  {

    super(options.parent || { nextId: 0, debug: false }, options);
    this.forms = this.getForms();
    this.state = this.getState();

  }


  getForms (options) {

    return [];

  }


  onModified ()
  {

  }


  onSubmit ()
  {

  }

}
