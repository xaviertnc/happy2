/* global F1 */
if (!Element.prototype.addEventListener) {
  var oListeners = {};
  F1.runListeners = function(oEvent) {
    if (!oEvent) { oEvent = window.event; }
    for (var iLstId = 0, iElId = 0, oEvtListeners = oListeners[oEvent.type]; iElId < oEvtListeners.aEls.length; iElId++) {
      if (oEvtListeners.aEls[iElId] === this) {
        for (iLstId; iLstId < oEvtListeners.aEvts[iElId].length; iLstId++) { oEvtListeners.aEvts[iElId][iLstId].call(this, oEvent); }
        break;
      }
    }
  };
  Element.prototype.addEventListener = function (sEventType, fListener /*, useCapture (will be ignored!) */) {
    if (oListeners.hasOwnProperty(sEventType)) {
      var oEvtListeners = oListeners[sEventType];
      for (var nElIdx = -1, iElId = 0; iElId < oEvtListeners.aEls.length; iElId++) {
        if (oEvtListeners.aEls[iElId] === this) { nElIdx = iElId; break; }
      }
      if (nElIdx === -1) {
        oEvtListeners.aEls.push(this);
        oEvtListeners.aEvts.push([fListener]);
        this['on' + sEventType] = F1.runListeners;
      } else {
        var aElListeners = oEvtListeners.aEvts[nElIdx];
        if (this['on' + sEventType] !== F1.runListeners) {
          aElListeners.splice(0);
          this['on' + sEventType] = F1.runListeners;
        }
        for (var iLstId = 0; iLstId < aElListeners.length; iLstId++) {
          if (aElListeners[iLstId] === fListener) { return; }
        }
        aElListeners.push(fListener);
      }
    } else {
      oListeners[sEventType] = { aEls: [this], aEvts: [ [fListener] ] };
      this['on' + sEventType] = F1.runListeners;
    }
  };
  Element.prototype.removeEventListener = function (sEventType, fListener /*, useCapture (will be ignored!) */) {
    if (!oListeners.hasOwnProperty(sEventType)) { return; }
    var oEvtListeners = oListeners[sEventType];
    for (var nElIdx = -1, iElId = 0; iElId < oEvtListeners.aEls.length; iElId++) {
      if (oEvtListeners.aEls[iElId] === this) { nElIdx = iElId; break; }
    }
    if (nElIdx === -1) { return; }
    for (var iLstId = 0, aElListeners = oEvtListeners.aEvts[nElIdx]; iLstId < aElListeners.length; iLstId++) {
      if (aElListeners[iLstId] === fListener) { aElListeners.splice(iLstId, 1); }
    }
  };
}

if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    var el = this;
    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

if (!document.querySelectorAll) {
  document.querySelectorAll = function (selectors) {
    var style = document.createElement('style'), elements = [], element;
    document.documentElement.firstChild.appendChild(style);
    document._qsa = [];

    style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
    window.scrollBy(0, 0);
    style.parentNode.removeChild(style);

    while (document._qsa.length) {
      element = document._qsa.shift();
      element.style.removeAttribute('x-qsa');
      elements.push(element);
    }
    document._qsa = null;
    return elements;
  };
}

if (!document.querySelector) {
  document.querySelector = function (selectors) {
    var elements = document.querySelectorAll(selectors);
    return (elements.length) ? elements[0] : null;
  };
}

// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {

  Array.prototype.forEach = function(callback/*, thisArg*/) {

    var T, k;
    if (this === null) {
      throw new TypeError('this is null or not defined');
    }
    var O = Object(this);
    var len = O.length >>> 0;
    if (typeof callback !== 'function') {
      throw new TypeError(callback + ' is not a function');
    }
    if (arguments.length > 1) {
      T = arguments[1];
    }
    k = 0;
    while (k < len) {
      var kValue;
      if (k in O) {
        kValue = O[k];
        callback.call(T, kValue, k, O);
      }
      k++;
    }
  };
  // Specially for IE9!
  if (typeof NodeList.prototype.forEach !== 'function') {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }
}

if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length >>> 0;
    var from = Number(arguments[1]) || 0;
    from = (from < 0)
      ? Math.ceil(from)
      : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}

if (!Array.prototype.includes) {
  Array.prototype.includes = function (value) {
    var returnValue = false;
    var pos = this.indexOf(value);
    if (pos >= 0) {
      returnValue = true;
    }
    return returnValue;
  };
}

/**
 * https://github.com/moagrius/classList
 * uses work by:
 * https://github.com/remy/polyfills/blob/master/classList.js
 * https://github.com/eligrey/classList.js/blob/master/classList.js
 */
(function(){
  // if we don't even support Element.prototype, quit now
  if(!('Element' in this || !Element.prototype)){
    return;
  }
  var tester = document.createElement('span');

  if(!('classList' in tester)){ // no support at all, polyfill entire API

    // IE8 doesn't have Array.indexOf
    var indexOf = function(list, element){
      for(var i = list.length - 1; i >= 0; i--){
        if(list[i] == element){
          break;
        }
      }
      return i;
    };

    // scope it so it's not hoisted, otherwise IE10 will fail to patch
    (function(){

      var DOMTokenList = function(element){
        this.element = element;
      };
      DOMTokenList.prototype.contains = function(name){
        var classes = this.element.className.split(/\s+/);
        return indexOf(classes, name) != -1;
      };
      DOMTokenList.prototype.add = function(){
        var classes = this.element.className.split(/\s+/);
        for(var i = arguments.length - 1; i >= 0; i--) {
          var name = arguments[i];
          if(indexOf(classes, name) == -1){
            classes.push(name);
          }
        }
        this.element.className = classes.join(' ');
      };
      DOMTokenList.prototype.remove = function(name){
        var classes = this.element.className.split(/\s+/);
        for(var i = arguments.length - 1; i >= 0; i--) {
          var index = indexOf(classes, name);
          if(index != -1){
            classes.splice(index, 1);
          }
        }
        this.element.className = classes.join(' ');
      };
      DOMTokenList.prototype.item = function(index){
        var classes = this.element.className.split(/\s+/);
        return classes[index];
      };
      DOMTokenList.prototype.toggle = function(name, force){
        var exists = this.contains(name);
        if(exists === force){
          return force;
        }
        if(exists){
          this.remove(name);
        } else {
          this.add(name);
        }
        return !exists;
      };
      // replaced with getter, not supported in IE8, will always return 0
      DOMTokenList.prototype.length = 0;

      if(Object.defineProperty) {
        Object.defineProperty(Element.prototype, 'classList',{
          get : function(){
            return new DOMTokenList(this);
          }
        });
        Object.defineProperty(DOMTokenList.prototype, 'length', function(){
          var classes = this.element.className.split(/\s+/);
          return classes.length;
        });
      } else if(Element.prototype.__defineGetter__){
        Element.prototype.__defineGetter__('classList', function(){
          return new DOMTokenList(this);
        });
      }

    })();

  } else {  // we have support, just patch methods as needed

    if('DOMTokenList' in this){  // this should be true if classList is detected

      // test and patch multiple argument support
      tester.classList.add('a', 'b');
      if(!tester.classList.contains('b')){
        var methods = ['add', 'remove'];
        var patch = function(definition, method){
          var historic = definition[method];
          definition[method] = function(){
            for(var i = arguments.length - 1; i >= 0; i--){
              var token = arguments[i];
              historic.call(this, token);
            }
          };
        };
        for(var i = methods.length - 1; i >= 0; i--){
          var method = methods[i];
          patch(DOMTokenList.prototype, method);
        }
      }

      // test and patch toggle with force
      tester.classList.toggle('c', false);
      if(tester.classList.contains('c')){
        var historic = DOMTokenList.prototype.toggle;
        DOMTokenList.prototype.toggle = function(token, force){
          if (arguments.length > 0 && this.contains(token) === force) {
            return force;
          }
          return historic.call(this, token);
        };
      }

    }

  }

})();