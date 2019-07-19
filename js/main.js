/* globals F1 */

// MAIN

F1.DEBUG = false;


if (F1.DEBUG && window.console) {
  F1.console = window.console;
} else {
  F1.console = {
    log: function noConsoleLog() {},
    dir: function noConsoleDir() {},
    error: function reportError(errMsg) { return new Error(errMsg); }
  };
}


// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
F1.debounce = function(func, wait, immediate) {
  var timeout;
  F1.console.log('Debounce Triggered');
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) {
        F1.console.log('Debounce: Executing the payload AFTER TIMER timeout.');
        func.apply(context, args);
      }
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      F1.console.log('Debounce: Executing the payload AT TIMER START.');
      func.apply(context, args);
    }
  };
};


F1.upDown = function(elInput, increment, range)
{
  let val = parseInt(elInput.value);
  let newVal = val + parseInt(increment || 0);
  range = range || { min:0, max:100 };
  if (range.max && newVal > range.max) { return; }
  if (typeof range.min !== 'undefined' && newVal < range.min) { return; }
  elInput.value = newVal;
};


F1.confirm = function(elm, event, message)
{
  if (elm.classList.contains('confirmed')) {
    elm.classList.remove('confirmed');
  }
  else {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (confirm(message || 'Are you sure?')) {
      elm.classList.add('confirmed');
      setTimeout(function () { elm.click(); }, 100);
    }
  }
};


F1.runScripts = function (scriptQueue)
{
  var i, result;
  if ( ! scriptQueue || ! scriptQueue.length) { return; }
  for (i = 0; i < scriptQueue.length; i++)
  {
    result = scriptQueue[i](); // run script
    if (typeof result !== 'undefined') { return result; } // abort queue if we have a result!
  }
};


F1.console.log('*** DOCUMENT READY ***');

F1.back2Top = new F1.Back2Top();

F1.alerts = new F1.Alerts();

F1.modal = new F1.Modal();

F1.tabs = new F1.Tabs();

F1.pjax = new F1.Pjax({
  siteName: 'Happy JS Demo',
  busyFaviconUrl: 'img/loading.ico',
  csrfTokenMetaName: 'X-CSRF-TOKEN',
  errorsContainerSelector: '#page-errors',
  viewports: ['#site-masthead', '#page-content'],
  afterPageLoadSuccess: function () {
    F1.console.log('Pjax.afterPageLoadSuccess()');
    F1.runScripts(F1.afterPageLoadScripts);
    F1.afterPageLoadScripts = [];
    F1.pjax.bindViewports();
    F1.alerts.init();
    F1.tabs.init();
  }
});


F1.runScripts(F1.afterPageLoadScripts);
F1.afterPageLoadScripts = [];
F1.pjax.bindViewports();
F1.alerts.init();
F1.tabs.init();
