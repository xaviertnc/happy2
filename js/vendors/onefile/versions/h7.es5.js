"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _instanceof(left, right) { if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) { return right[Symbol.hasInstance](left); } else { return left instanceof right; } }

function _classCallCheck(instance, Constructor) { if (!_instanceof(instance, Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* globals document, F1, Happy */

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
var Happy =
/*#__PURE__*/
function () {
  function Happy() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Happy);

    this.baseClasses = {
      item: HappyItem,
      document: HappyDocument,
      form: HappyForm,
      field: HappyField,
      input: HappyInput
    };
    this.cleaners = {}; // and|or formatters

    this.validators = {};
    this.customClasses = {
      documents: {},
      forms: {},
      fields: {},
      inputs: {}
    };
    this.initVars();
    this.extend(options);
    window.Happy.instance = this;
  }

  _createClass(Happy, [{
    key: "initVars",
    value: function initVars() {
      this.items = [];
      this.inputs = [];
      this.fields = [];
      this.forms = [];
      this.documents = [];
      this.topLevelItems = [];
      this.currentField = undefined;
      this.nextId = 1;
    }
  }, {
    key: "extend",
    value: function extend() {
      var extendWithObj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return Object.assign(this, extendWithObj);
    }
  }, {
    key: "getClass",
    value: function getClass(baseType, specificType) {
      var HappyClass,
          baseGroup = baseType + 's';

      if (specificType) {
        HappyClass = this.customClasses[baseGroup][specificType];
      }

      return HappyClass || this.baseClasses[baseType];
    }
  }, {
    key: "guessElementHappyType",
    value: function guessElementHappyType(el) {
      return el.nodeName.toLowerCase() === 'form' ? 'form' : 'document';
    }
  }, {
    key: "addItem",
    value: function addItem(baseType) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var baseGroup = baseType + 's';
      var specificType = options.type;
      var HappyClass = options.CustomClass || this.getClass(baseType, specificType);
      delete options.CustomClass;
      delete options.type; // HappyClass can be a default Happy Item Class or a
      // Custom Happy Item Class based on the specific type of the item
      // and wether a corresponding custom class exists in `customClasses`!
      // E.g. HappyClass === HappyField -OR- HappyClass === BirthdayField (custom)

      var happyItem = new HappyClass(options, this);

      if (specificType) {
        happyItem[baseType + 'Type'] = specificType;
      }

      if (happyItem.isTopLevel) {
        this.topLevelItems.push(happyItem);
      }

      if (this[baseGroup]) {
        this[baseGroup].push(happyItem);
      }

      this.items.push(happyItem);
      return happyItem;
    } // happy.find('fullname')  - OR -
    // happy.find('fullname', happy.fields)

  }, {
    key: "find",
    value: function find(name) {
      var list = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.items;
      var found,
          itemIndex = 0;
      var itemCount = list.length;

      if (!itemCount) {
        return;
      }

      while (!found && itemIndex < itemCount) {
        var item = list[itemIndex];

        if (item.id === name || item.name === name) {
          found = item;
        }

        itemIndex++;
      }

      return found;
    }
  }, {
    key: "focusUnhappy",
    value: function focusUnhappy(selector) {
      var unhappyInput = document.querySelector(selector || '.unhappy > input');

      if (unhappyInput) {
        unhappyInput.focus();
      }
    }
  }, {
    key: "mount",
    value: function mount() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (!options.el) {
        throw new Error('A mount element is required!');
      }

      if (!this.items.length) {
        var baseType = options.type;

        if (baseType) {
          delete options.type;
        } else {
          baseType = this.guessElementHappyType(options.el);
        }

        var item = this.addItem(baseType, options);
        item.mount();
        return item;
      } else {
        this.topLevelItems.forEach(function (item) {
          return item.mount();
        });
      }
    }
  }, {
    key: "dismount",
    value: function dismount() {
      this.topLevelItems.forEach(function (item) {
        return item.dismount();
      });
      this.initVars();
    }
  }]);

  return Happy;
}(); // end: Happy


var HappyRule = function HappyRule(ruleDef) {
  _classCallCheck(this, HappyRule);

  var args = ruleDef.split(':');
  this.name = args.shift();
  this.args = args;
  this.arg = args.length ? args[0] : undefined;
}; // end: HappyRule


var HappyItem =
/*#__PURE__*/
function () {
  function HappyItem(happyType) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var happy$ = arguments.length > 2 ? arguments[2] : undefined;

    _classCallCheck(this, HappyItem);

    this.el = options.el;
    this.parent = options.parent;
    this.happyType = happyType;
    delete options.parent;
    delete options.el;
    this.options = options;
    this.happy$ = happy$;

    if (!this.parent) {
      this.isTopLevel = true;
    }

    this.name = this.options.name; // Set in mount() if undefined

    this.id = this.options.id || this.extractId();
    this.mounted = false;
    this.children = [];
    this.happy = true;
    this.nextId = 1;
  }

  _createClass(HappyItem, [{
    key: "rateLimit",
    value: function rateLimit(context, fn, params, interval) {
      var date = new Date(),
          now = date.getTime();

      if (now - (context.lastUpdated || 0) > interval) {
        context.lastUpdated = now;
        fn.apply(context, params);
      }
    }
  }, {
    key: "ignoreBlur",
    value: function ignoreBlur() {
      return this.isType(['checkbox', 'checklist', 'radiolist', 'select', 'file']);
    }
  }, {
    key: "setOpt",
    value: function setOpt(key, value, def) {
      if (typeof this.options[key] !== 'undefined') {
        return;
      }

      if (typeof value !== 'undefined') {
        this.options[key] = value;
      } else {
        this.options[key] = def;
      }
    }
  }, {
    key: "getOpt",
    value: function getOpt(key, def) {
      if (this.options[key]) {
        return this.options[key];
      }

      if (this.parent) {
        return this.parent.getOpt(key, def);
      }

      return def;
    }
  }, {
    key: "isType",
    value: function isType(typeList) {
      var typePropName = this.happyType + 'Type';

      if (typeof typeList === 'string') {
        typeList = [typeList];
      }

      var ok = typeList.includes(this[typePropName]);
      return ok;
    }
  }, {
    key: "isModified",
    value: function isModified() {
      if (this.happyType === 'input') {
        return this.value !== this.initialValue;
      }

      for (var i = 0, n = this.children.length; i < n; i++) {
        if (this.children[i].isModified()) {
          return true;
        }
      }

      return false;
    }
  }, {
    key: "isHappy",
    value: function isHappy() {
      if (this.happyType === 'input') {
        return this.happy;
      }

      for (var i = 0, n = this.children.length; i < n; i++) {
        if (!this.children[i].happy) {
          return false;
        }
      }

      return true;
    }
  }, {
    key: "getDomElement",
    value: function getDomElement() {
      if (this.el) {
        return this.el;
      }

      if (this.options.selector) {
        var parentElement = this.parent ? this.parent.el : document.body;
        return parentElement.querySelector(this.options.selector);
      }
    }
  }, {
    key: "getValue",
    value: function getValue(init) {
      var rawValue = this.extractValue();
      var val = this.clean(rawValue);

      if (init) {
        this.initialValue = val;
      }

      return val;
    }
  }, {
    key: "extractId",
    value: function extractId() {
      var idBase;

      switch (this.happyType) {
        case 'input':
          idBase = 'i';
          break;

        case 'field':
          idBase = 'f';
          break;

        case 'document':
          idBase = 'doc';
          break;

        default:
          idBase = this.happyType;
      }

      if (this.parent && this.parent.nextId) {
        return this.parent.id + '_' + idBase + this.parent.nextId++;
      }

      return idBase + this.happy$.nextId++;
    }
  }, {
    key: "extractType",
    value: function extractType() {
      return this.inputs.length ? this.inputs[0].inputType : 'text';
    }
  }, {
    key: "extractName",
    value: function extractName() {
      return this.el.getAttribute('data-name') || this.el.name || this.el.id;
    }
  }, {
    key: "extractLabel",
    value: function extractLabel() {
      return this.el.getAttribute('data-label');
    }
  }, {
    key: "extractValue",
    value: function extractValue() {
      var val;

      switch (this.inputType) {
        case 'radio':
        case 'checkbox':
          val = this.el.checked ? this.el.value || 1 : '';
          break;

        case 'option':
          val = this.el.selected ? this.el.value || 1 : '';
          break;

        default:
          val = this.el.value;
      }

      return val;
    }
    /**
     * E.g. <div data-validate="required|maxLength:2:Provide at least 2 chars">
     */

  }, {
    key: "extractRules",
    value: function extractRules() {
      var self = this;
      this.rules = this.rules || {};
      var rulesAsString = this.el.getAttribute('data-validate');
      var ruleDefs = rulesAsString ? rulesAsString.split('|') : [];
      ruleDefs.forEach(function createRule(ruleDef) {
        var rule = new HappyRule(ruleDef);
        self.rules[rule.name] = rule;
      });

      if (!this.rules.required && this.el.hasAttribute('required')) {
        this.rules.required = new HappyRule('required');
      }

      if (!this.rules.required && this.el.classList.contains('required')) {
        this.rules.required = new HappyRule('required');
      }
    }
    /**
     * E.g. <div data-format="currency:R|2|,">
     */

  }, {
    key: "extractCleaners",
    value: function extractCleaners() {
      var cleanersAsString = this.el.getAttribute('data-format');

      if (!cleanersAsString) {
        return;
      }

      this.cleaners = cleanersAsString.split('|');
    }
  }, {
    key: "clean",
    value: function clean(raw) {
      if (!raw) {
        return raw;
      }

      var val = raw.trim();

      if (!this.cleaners) {
        return val;
      }

      for (var i = 0, n = this.cleaners.length; i < n; i++) {
        var fnCleaner = this.happy$.cleaners[this.cleaners[i]];

        if (fnCleaner) {
          val = fnCleaner.call(this, val);
        }
      } // F1.console.log('HappyItem::clean(), clean:', val);


      return val;
    }
  }, {
    key: "getNext",
    value: function getNext(stepOut) {
      if (this.isTopLevel) {
        return;
      }

      var parent = this.parent;
      var childCount = parent.children.length;

      if (childCount < 2) {
        if (parent.isTopLevel) {
          return;
        }

        var nextParent = parent.getNext();

        if (nextParent && nextParent.children.length) {
          return nextParent.children[0];
        }
      }

      var index = parent.children.indexOf(this) + 1;

      if (index >= childCount) {
        if (stepOut) {
          var _nextParent = parent.getNext();

          if (_nextParent && _nextParent.children.length) {
            return _nextParent.children[0];
          }
        }

        return parent.children[0];
      }

      return parent.children[index];
    }
  }, {
    key: "getPrev",
    value: function getPrev(stepOut) {
      if (this.isTopLevel) {
        return;
      }

      var childCount = this.parent.children.length;

      if (childCount < 2) {
        return;
      }

      var index = this.parent.children.indexOf(this);

      if (!index) {
        if (stepOut) {
          var prevParent = this.parent.getPrev();

          if (prevParent && prevParent.children.length) {
            return prevParent.children[prevParent.children.length - 1];
          }
        }

        return this.parent.children[childCount - 1];
      }

      return this.parent.children[index - 1];
    }
    /**
     * NOTE: Only HappyFields should call this method!
     */

  }, {
    key: "validate",
    value: function validate(event, reason) {
      // F1.console.log('HappyItem::validate(),', this.id, reason, ', val =', this.value);
      var validateResults = [],
          fnCustomValidate = this.getOpt('validate');
      this.happy = true;

      if (fnCustomValidate) {
        validateResults = fnCustomValidate(event, reason);
      } else {
        var happy$ = this.happy$;

        if (this.subValidateInputs) {
          // If we have child inputs, first validate their rules!
          var inputsWithRules = [];

          for (var i = 0, n = this.inputs.length; i < n; i++) {
            var input = this.inputs[i];

            for (var r in input.rules) {
              if (input.rules.hasOwnProperty(r)) {
                inputsWithRules.push(input);
                break;
              }
            }
          }

          for (var _i = 0, _n = inputsWithRules.length; _i < _n; _i++) {
            var inputHappy = true,
                _input = this.inputs[_i];

            for (var _r in _input.rules) {
              var ruleInfo = _input.rules[_r];
              var validator = happy$.validators[ruleInfo.name];

              if (validator) {
                // NOTE: We call the validator with HappyInput context!
                var message = validator.call(_input, ruleInfo, reason);

                if (message) {
                  if (ruleInfo.name === 'required') {
                    validateResults.unshift({
                      item: _input,
                      message: message
                    });
                  } else {
                    validateResults.push({
                      item: _input,
                      message: message
                    });
                  }

                  inputHappy = false;
                  this.happy = false;
                }
              }
            }

            _input.happy = inputHappy;
          }
        } // Now test the field level rules.


        for (var _r2 in this.rules) {
          var _ruleInfo = this.rules[_r2];
          var _validator = happy$.validators[_ruleInfo.name];

          if (_validator) {
            // NOTE: We call the validator with "this" === HappyField context!
            // We therefore have access to all field properties inside the
            // validator. E.g. this.happy$, this.type, this.el, this.value, etc.
            var _message = _validator.call(this, _ruleInfo, reason);

            if (_message) {
              if (_ruleInfo.name === 'required') {
                validateResults.unshift({
                  item: this,
                  message: _message
                });
              } else {
                validateResults.push({
                  item: this,
                  message: _message
                });
              }

              this.happy = false;
            }
          }
        }
      }

      return validateResults;
    }
  }, {
    key: "bindEvents",
    value: function bindEvents() {
      if (this.isTopLevel) {
        this.el.addEventListener('focus', this.onFocusHandler, true);
        this.el.addEventListener('blur', this.onBlurHandler, true);
        this.el.addEventListener('change', this.onChangeHandler, true);
        this.el.addEventListener('keydown', this.onKeyDownHandler, true);
        this.el.addEventListener('submit', this.onSubmitHandler, true);
      }
    }
  }, {
    key: "unbindEvents",
    value: function unbindEvents() {
      if (this.isTopLevel) {
        this.el.removeEventListener('submit', this.onSubmitHandler, true);
        this.el.removeEventListener('keydown', this.onKeyDownHandler, true);
        this.el.removeEventListener('change', this.onChangeHandler, true);
        this.el.removeEventListener('blur', this.onBlurHandler, true);
        this.el.removeEventListener('focus', this.onFocusHandler, true);
      }
    }
  }, {
    key: "onFocusHandler",
    value: function onFocusHandler(event) {
      var happyInput = event.target.HAPPY;

      if (!happyInput || happyInput.happyType !== 'input') {
        return;
      }

      var happyField = happyInput.parent,
          happy$ = happyInput.happy$; // Checklist, Radiolist and Select Fields should ignore blur events
      // between their OWN inputs. ignoreBlur() checks for these types.

      if (happyField === happy$.currentField && happyField.ignoreBlur()) {
        // Ignore any pending `onBlur` event if we are still on the SAME FIELD!
        return clearTimeout(happyField.delayBlurEventTimer);
      }

      happy$.currentField = happyField;
    }
  }, {
    key: "onBlurHandler",
    value: function onBlurHandler(event) {
      var happyInput = event.target.HAPPY;

      if (!happyInput || happyInput.happyType !== 'input') {
        return;
      }

      var happyField = happyInput.parent; // Delay the field-blur event action to check if we actually left this field.
      // The next input-focus event will clear the timer if we are still on the same field.

      happyField.delayBlurEventTimer = setTimeout(function () {
        happyField.rateLimit(happyField, happyField.update, [event, 'onBlur'], 150);
      });
    }
  }, {
    key: "onChangeHandler",
    value: function onChangeHandler(event) {
      var happyInput = event.target.HAPPY;

      if (!happyInput || happyInput.happyType !== 'input') {
        return;
      }

      var happyField = happyInput.parent;
      happyField.rateLimit(happyField, happyField.update, [event, 'onChange'], 150);
    }
  }, {
    key: "onKeyDownHandler",
    value: function onKeyDownHandler(event) {
      var happyInput = event.target.HAPPY;

      if (!happyInput || happyInput.happyType !== 'input') {
        return;
      }

      var happyField = happyInput.parent; // Focus on the NEXT FIELD or INPUT when we press ENTER

      if (event.key === 'Enter' || event.when == 13 || event.keyCode == 13) {
        if (happyField.isType('memo')) {
          return;
        }

        event.stopImmediatePropagation();
        event.preventDefault();
        var nextHappyInput;

        if (happyField.isType(['checkbox', 'checklist', 'radiolist'])) {
          // Also "Check/Select" the FIELD INPUT if it's in the list above.
          happyInput.el.click();
        }

        if (happyField.fieldType === 'radiolist') {
          // Jump to the NEXT FIELD's first input.
          var nextHappyField = happyField.getNext(true);

          if (nextHappyField) {
            nextHappyInput = nextHappyField.inputs[0];
          }
        } else {
          // Jump to the NEXT INPUT
          nextHappyInput = happyInput.getNext(true);
        }

        if (nextHappyInput) {
          nextHappyInput.el.focus();
        }
      } else if (event.key === 'ArrowDown' && happyField.isType('checklist')) {
        // Focus on the NEXT INPUT if we press Arrow Down on a checklist field
        var _nextHappyInput = happyInput.getNext();

        if (_nextHappyInput) {
          _nextHappyInput.el.focus();
        }
      } else if (event.key === 'ArrowUp' && happyField.isType('checklist')) {
        // Focus on the PREV INPUT if we press Arrow Up on a checklist field
        var prevHappyInput = happyInput.getPrev();

        if (prevHappyInput) {
          prevHappyInput.el.focus();
        }
      }
    }
  }, {
    key: "onSubmitHandler",
    value: function onSubmitHandler(event) {
      F1.console.log('HappyItem::onSubmitHandler()', event); // Run validations + Stop event if validation fails...

      event.target.HAPPY.update(event, 'onSubmit');

      if (!this.happy) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }, {
    key: "removeMessages",
    value: function removeMessages() {
      var elMessageZone = this.el;
      var msgGrpSelector = '.' + this.getOpt('messageGroupClass', 'messages');
      var msgGrpElements = elMessageZone.querySelectorAll(msgGrpSelector);
      msgGrpElements.forEach(function (elMsgGrp) {
        return elMsgGrp.parentElement.removeChild(elMsgGrp);
      });
      this.inputs.forEach(function (input) {
        return input.messages = [];
      });
      this.messages = [];
    }
  }, {
    key: "addMessages",
    value: function addMessages(validateResults) {
      var message, elMsg, elMessageZone, validateResult, happyItem;
      var msgGrpClass = this.getOpt('messageGroupClass', 'messages');
      var msgClass = this.getOpt('messageClass', 'message error');

      for (var i = 0, n = validateResults.length; i < n; i++) {
        validateResult = validateResults[i];
        happyItem = validateResult.item || this;
        happyItem.messages = happyItem.messages || [];

        if (happyItem.elMsgGrp) {
          continue;
        }

        elMsg = document.createElement('li');
        elMsg.className = msgClass;
        elMessageZone = happyItem.happyType === 'input' ? happyItem.el.parentElement : happyItem.el.querySelector('.input-group');

        if (!elMessageZone) {
          elMessageZone = happyItem.el;
        }

        if (!happyItem.elMsgGrp) {
          happyItem.elMsgGrp = document.createElement('ul');
          happyItem.elMsgGrp.className = msgGrpClass;
          elMessageZone.appendChild(happyItem.elMsgGrp);
        }

        message = validateResult.message;
        elMsg.innerHTML = message;
        happyItem.elMsgGrp.appendChild(elMsg);
        happyItem.messages.push({
          el: elMsg,
          elParent: elMessageZone,
          text: message
        });
      }

      for (var _i2 = 0, _n2 = validateResults.length; _i2 < _n2; _i2++) {
        validateResult = validateResults[_i2];

        if (validateResult.item) {
          delete validateResult.item.elMsgGrp;
        }
      }

      delete this.elMsgGrp;
    }
  }, {
    key: "renderState",
    value: function renderState() {
      var happyClass = this.getOpt('happyClass', 'happy');
      var unhappyClass = this.getOpt('unhappyClass', 'unhappy');
      var elStateZone = this.happyType === 'input' ? this.el.parentElement : this.el; // F1.console.log('HappyItem::renderState(),', this.id, this.happy, elStateZone);

      if (this.isHappy()) {
        elStateZone.classList.add(happyClass);
        elStateZone.classList.remove(unhappyClass);
      } else {
        elStateZone.classList.add(unhappyClass);
        elStateZone.classList.remove(happyClass);
      }

      var modifiedClass = this.getOpt('modifiedClass', 'modified');

      if (this.modified) {
        elStateZone.classList.add(modifiedClass);
      } else {
        elStateZone.classList.remove(modifiedClass);
      }
    }
  }, {
    key: "render",
    value: function render() {
      return document.createElement('div');
    }
  }, {
    key: "update",
    value: function update(event, reason) {
      // F1.console.log('HappyItem::update(),', this.id, reason);
      this.value = this.getValue();
      this.modified = this.isModified();

      if (reason === 'isParent') {
        this.happy = this.isHappy();
      } else {
        var validateResults = this.validate(event, reason) || [];
        this.removeMessages();
        this.addMessages(validateResults);

        for (var i = 0, n = this.inputs.length; i < n; i++) {
          var input = this.inputs[i];
          input.modified = input.isModified();
          input.renderState();
        }
      }

      this.renderState();

      if (!this.isTopLevel) {
        this.parent.update(event, 'isParent');
      }
    }
  }, {
    key: "mount",
    value: function mount() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (this.mounted) {
        return;
      }

      var parent = this.parent || {};
      var appendTo = options.appendTo;
      this.el = this.el || this.getDomElement() || options.el;

      if (!this.el) {
        // No existing element... Mount as rendered element
        if (!appendTo) {
          appendTo = parent.el || document.body;
        }

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
  }, {
    key: "dismount",
    value: function dismount() {
      if (this.el && this.isRenderedElement) {
        this.el.parentElement.removeChild(this.el);
        this.el = undefined;
      } else {
        if (this.el) {
          delete this.el.HAPPY;
        }
      }

      if (this.children) {
        this.children.forEach(function (child) {
          return child.dismount();
        });
        this.children = undefined;
      }

      this.nextId = 1;
      this.mounted = false;

      if (!this.isRenderedElement) {
        this.unbindEvents();
      }
    }
  }]);

  return HappyItem;
}(); // end: HappyItem


var HappyInput =
/*#__PURE__*/
function (_HappyItem) {
  _inherits(HappyInput, _HappyItem);

  function HappyInput(options, happy$) {
    _classCallCheck(this, HappyInput);

    return _possibleConstructorReturn(this, _getPrototypeOf(HappyInput).call(this, 'input', options, happy$));
  }

  _createClass(HappyInput, [{
    key: "extractLabel",
    value: function extractLabel() {
      var el = this.el.previousElementSibling;

      if (el && el.nodeName === 'LABEL') {
        return el.innerHTML.replace(/\s*:$/, '');
      }
    }
  }, {
    key: "extractRules",
    value: function extractRules() {
      _get(_getPrototypeOf(HappyInput.prototype), "extractRules", this).call(this);

      if (this.el.hasAttribute('min')) {
        var min = this.el.getAttribute('min');
        this.rules.min = new HappyRule('min:' + min);
      }

      if (this.el.hasAttribute('max')) {
        var max = this.el.getAttribute('max');
        this.rules.max = new HappyRule('max:' + max);
      }

      if (this.el.hasAttribute('pattern')) {
        var pattern = this.el.getAttribute('pattern');
        this.rules.pattern = new HappyRule('pattern:' + pattern);
      }
    }
  }, {
    key: "mount",
    value: function mount(options) {
      _get(_getPrototypeOf(HappyInput.prototype), "mount", this).call(this, options);

      this.extractRules();
      this.extractCleaners();
      this.value = this.getValue('init');
      this.name = this.extractName();
      this.label = this.extractLabel();
    }
  }]);

  return HappyInput;
}(HappyItem);

var HappyField =
/*#__PURE__*/
function (_HappyItem2) {
  _inherits(HappyField, _HappyItem2);

  function HappyField(options, happy$) {
    _classCallCheck(this, HappyField);

    return _possibleConstructorReturn(this, _getPrototypeOf(HappyField).call(this, 'field', options, happy$));
  }

  _createClass(HappyField, [{
    key: "getValue",
    value: function getValue(init) {
      var inputValues = [];

      for (var i = 0, n = this.inputs.length; i < n; i++) {
        var input = this.inputs[i];
        input.value = input.getValue(init);

        if (input.value || input.value === 0) {
          inputValues.push(input.value);
        }
      }

      var fieldValue = inputValues.join(',');

      if (init) {
        this.initialValue = fieldValue;
      }

      return fieldValue;
    }
  }, {
    key: "extractName",
    value: function extractName() {
      var name;

      if (this.inputs.length === 1) {
        name = this.inputs[0].name;
      } else {
        name = this.el.getAttribute('data-name') || this.el.id;
      }

      return name;
    }
  }, {
    key: "extractInputType",
    value: function extractInputType(elInput) {
      return elInput.getAttribute('data-type') || elInput.type;
    }
  }, {
    key: "extractInputs",
    value: function extractInputs() {
      var happyField = this;
      happyField.inputs = [];
      var inputSelector = happyField.getOpt('inputSelector', 'input:not(hidden):not([type="submit"]), textarea, select');
      var inputElements = happyField.el.querySelectorAll(inputSelector);

      for (var i = 0, n = inputElements.length; i < n; i++) {
        var elInput = inputElements[i];
        var inputType = happyField.extractInputType(elInput);
        var happyInput = happyField.happy$.addItem('input', {
          el: elInput,
          type: inputType,
          parent: happyField
        });
        happyField.inputs.push(happyInput);
      }

      happyField.children = happyField.inputs;
    }
  }, {
    key: "mount",
    value: function mount(options) {
      _get(_getPrototypeOf(HappyField.prototype), "mount", this).call(this, options);

      this.extractRules();
      this.extractCleaners();
      this.extractInputs();
      this.inputs.forEach(function (input) {
        return input.mount();
      });
      this.fieldType = this.fieldType || this.extractType();
      this.value = this.getValue('init');
      this.name = this.extractName();
      this.label = this.extractLabel();
    }
  }, {
    key: "dismount",
    value: function dismount() {
      _get(_getPrototypeOf(HappyField.prototype), "dismount", this).call(this);

      this.inputs = undefined;
    }
  }]);

  return HappyField;
}(HappyItem);

var HappyForm =
/*#__PURE__*/
function (_HappyItem3) {
  _inherits(HappyForm, _HappyItem3);

  function HappyForm(options, happy$) {
    _classCallCheck(this, HappyForm);

    return _possibleConstructorReturn(this, _getPrototypeOf(HappyForm).call(this, 'form', options, happy$));
  }

  _createClass(HappyForm, [{
    key: "getValue",
    value: function getValue() {
      var val = {};

      for (var i = 0, n = this.fields.length; i < n; i++) {
        var field = this.fields[i];
        val[field.name || field.id] = field.value;
      }

      return val;
    }
  }, {
    key: "extractFieldType",
    value: function extractFieldType(elField) {
      return elField.getAttribute('data-type');
    }
  }, {
    key: "extractFields",
    value: function extractFields() {
      var happyForm = this;
      happyForm.fields = [];
      var fieldSelector = happyForm.getOpt('fieldSelector', '.field');
      var fieldElements = happyForm.el.querySelectorAll(fieldSelector);

      for (var i = 0, n = fieldElements.length; i < n; i++) {
        var elField = fieldElements[i];
        var fieldType = happyForm.extractFieldType(elField);
        var happyField = happyForm.happy$.addItem('field', {
          el: elField,
          type: fieldType,
          parent: happyForm
        });
        happyForm.fields.push(happyField);
      }

      happyForm.children = happyForm.fields;
    }
  }, {
    key: "mount",
    value: function mount(options) {
      _get(_getPrototypeOf(HappyForm.prototype), "mount", this).call(this, options);

      this.extractFields();
      this.fields.forEach(function (field) {
        return field.mount();
      });
    }
  }, {
    key: "dismount",
    value: function dismount() {
      _get(_getPrototypeOf(HappyForm.prototype), "dismount", this).call(this);

      this.fields = undefined;
    }
  }]);

  return HappyForm;
}(HappyItem);

var HappyDocument =
/*#__PURE__*/
function (_HappyItem4) {
  _inherits(HappyDocument, _HappyItem4);

  function HappyDocument(options, happy$) {
    _classCallCheck(this, HappyDocument);

    return _possibleConstructorReturn(this, _getPrototypeOf(HappyDocument).call(this, 'document', options, happy$));
  }

  _createClass(HappyDocument, [{
    key: "extractFormType",
    value: function extractFormType(elForm) {
      return elForm.getAttribute('data-type');
    }
  }, {
    key: "extractForms",
    value: function extractForms() {
      var happyDoc = this;
      happyDoc.forms = [];
      var formSelector = happyDoc.getOpt('formSelector', 'form');
      var formElements = happyDoc.el.querySelectorAll(formSelector);

      for (var i = 0, n = formElements.length; i < n; i++) {
        var elForm = formElements[i];
        var formType = happyDoc.extractFormType(elForm);
        var happyForm = happyDoc.happy$.addItem('form', {
          el: elForm,
          type: formType,
          parent: happyDoc
        });
        happyDoc.forms.push(happyForm);
      }

      happyDoc.children = happyDoc.forms;
    }
  }, {
    key: "mount",
    value: function mount(options) {
      _get(_getPrototypeOf(HappyDocument.prototype), "mount", this).call(this, options);

      this.extractForms();
      this.forms.forEach(function (form) {
        return form.mount();
      });
    }
  }, {
    key: "dismount",
    value: function dismount() {
      _get(_getPrototypeOf(HappyDocument.prototype), "dismount", this).call(this);

      this.forms = undefined;
    }
  }]);

  return HappyDocument;
}(HappyItem);

window.Happy = Happy;