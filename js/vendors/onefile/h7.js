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
    this.type = type;
    this.parent = options.parent || {};
    this.el = options.el || {};
    delete options.parent;
    delete options.el;

    this.options = options || {};

    if ( ! this.el) { this.el = this.getDomElement(); }

    this.id = this.type + HappyItem.nextId++;

    this.containerElement = this.getContainer();

    this.initialValue = null;
    this.value = null;

    this.required = false;
    this.modified = false;
    this.happy = true;

    this.prev = null;
    this.next = null;

    this.el.HAPPY = this;
  }


  getDomElement()
  {
    if (this.options.selector) {
      return document.querySelector(this.options.selector);
    }
  }


  getContainer()
  {
    if (this.options.containerSelector) {
      return document.querySelector(this.options.containerSelector);
    }
  }

}

HappyItem.nextId = 1;



class HappyMessage {

  constructor(options)
  {
  }

}



class HappyMessageGroup {

  constructor(options)
  {
  }

}



class HappyInput extends HappyItem  {

  constructor(options)
  {
    super('input', options);
    console.log('HappyInput::construct()', this);
  }

}



class HappyField extends HappyItem  {

  constructor(options)
  {
    super('field', options);
    this.fieldType = this.getType();
    this.inputs = [];
  }


  getType()
  {
    return this.el.getAttribute('data-type');
  }

}



class HappyForm extends HappyItem {

  constructor(options)
  {
    super('form', options);
    this.fields = [];
    console.log('HappyForm::construct()', this);
  }


  addFields(fieldDefs)
  {
    let form = this;

    if (form.options.fieldSelector) {
      form.fieldElements = document.querySelectorAll(form.options.fieldSelector);
    }

    form.fieldElements.forEach(fieldElement => {
      let field = new HappyField({ el: fieldElement, parent: form });
      form.fields.push(field);
    });
  }

}



class HappyDoc extends HappyItem {

  constructor(options)
  {
    console.log('HappyDoc::construct(), options:', options);
    super('doc', options);
  }


  addForms(formDefs)
  {
    console.log('HappyDoc::addForms()', formDefs);
  }

}