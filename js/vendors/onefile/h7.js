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

    this.name = this.el.id || HappyItem.nextId++;

    this.containerElement = this.getContainer();

    this.initialValue = null;
    this.value = null;

    this.modified = false;
    this.happy = true;

    this.prev = null;
    this.next = null;

    this.el.HAPPY = this;
  }


  getDomElement()
  {
    if (this.options.elementSelector) {
      return document.querySelector(this.options.elementSelector);
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



class HappyInput {

  constructor(options) {
  }

}



class HappyField {

  constructor(options) {
  }

}



class HappyForm extends HappyItem {

  constructor(options) {
    super('form', options);
    this.fields = [];
    console.log('HappyForm::construct()', this);
  }


  addField(field) {

  }


  addFieldsByType(fieldTypeDef) {

  }

}



class HappyDoc extends HappyItem {

  constructor(options) {
    console.log('HappyDoc::construct(), options:', options);
    super('doc', options);
  }


  addForm(form) {

  }


  addFormsByType(formTypeDef) {

  }

}