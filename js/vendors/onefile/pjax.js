/* globals window, document, F1, $ */

window.F1 = window.F1 || { afterPageLoadScripts: [] };

/**
 * OneFile files are stand-alone libs that only require jQuery to work.
 * Dependancies and custom behaviours can be added via the 'options' param.
 *
 * F1.Pjax - SIMPLE, SMOOTH and SEO friendly webpages using Ajax.
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  14 April 2018
 *
 * @prop: {array}  viewports   Array of Viewport objects. One per viewport to be updated after a page loads.
 * @prop: {string} siteName    Used to add after page titles. e.g. PageTitle = "PageName - SiteName"
 * @prop: {string} csrfToken   <head><meta name="?" content="KDX5ad302f3a5711"> Csrf meta tag name
 * @prop: {string} history     'window.history' or a custom history object/service.
 * @prop: {string} baseUri     Protocol + Hostname + Port + basePath
 * @prop: {string} errorsContainerSelector
 * @prop: {string} csrfTokenMetaName
 * @prop: {string} currentLocation
 * @prop: {string} busyFaviconUrl
 * @prop: {string} currentPath
 * @prop: {string} faviconUrl
 *
 * @param: {object} options    Insert dependancies, state and behaviour via this object.
 *   e.g. options = {
 *     siteName: 'Pjax Demo',
 *     viewports: ['#top-navbar', '#main-content'],
 *     baseUri: 'http://www.example.com/',
 *     csrfTokenMetaName: 'x-csrf-token',
 *     busyFaviconUrl: 'loading.ico'
 *   }
 */
F1.Pjax = function (options)
{
  //this.chrome   = navigator.userAgent.indexOf('Chrome') > -1;
  //this.explorer = navigator.userAgent.indexOf('MSIE') > -1;
  //this.firefox  = navigator.userAgent.indexOf('Firefox') > -1;
  //this.safari   = navigator.userAgent.indexOf("Safari") > -1;
  //this.camino   = navigator.userAgent.indexOf("Camino") > -1;
  //this.opera    = navigator.userAgent.toLowerCase().indexOf("op") > -1;
  //if ((this.chrome) && (this.safari)) { this.safari = false; }
  //if ((this.chrome) && (this.opera)) { this.chrome = false; }

  options = options || {};

  if (options.busyFaviconUrl) {
    this.$favicon = $(options.faviconSelector || '#favicon');
    this.faviconUrl = options.faviconUrl || this.$favicon[0].href;
  }

  if (options.csrfTokenMetaName) {
    this.elCsrfMeta = this.findDOMElement('meta[name=' +
      options.csrfTokenMetaName + ']', document.head);
    this.csrfToken = this.elCsrfMeta.getAttribute('content');
  }

  $.extend(this, options);

  this.history = this.history || window.history;

  window.onpopstate = this.popStateHandler.bind(this);

  if (this.pageHasUnsavedChanges) {
    window.onbeforeunload = this.beforePageExit.bind(this);
  }

  this.viewports = this.setupViewports(options.viewports);

  // console.log('F1 PJAX Initialized:', this);
};


/**
 * @param {Array} viewportDefinitions: [def1, def2, ...]
 *   Viewport definition types:
 *     string: The viewport's DOM selector string e.g. "#viewportElementId"
 *     object: { selector: '#mainview', opt1: opt1Val, ..., optN: optNVal }
 *   e.g. ['#vport1', '#vport2', ...] or [{ selector: '#vport1',
 *     'updateMethod': 'replace' }, { ... }, ...]
 *
 * @return {Array} of ViewPort objects
 */
F1.Pjax.prototype.setupViewports = function(viewportDefinitions)
{
  F1.console.log('F1 PJAX setupViewports:', viewportDefinitions);
  var viewports = [];
  if (viewportDefinitions)
  {
    var i, n, viewportDefinition, viewportSelector, viewportOptions = {};
    for (i=0, n=viewportDefinitions.length; i < n; i++)
    {
      viewportDefinition = viewportDefinitions[i];
      if (viewportDefinition.selector)
      {
        viewportSelector = viewportDefinition.selector;
        viewportOptions = viewportDefinition;
      }
      else
      {
        viewportSelector = viewportDefinition;
      }
      // F1.console.log('F1 PJAX setupViewports add viewport:', this,
      // viewportSelector, viewportOptions);
      viewports[i] = new F1.Pjax.Viewport(this, viewportSelector, viewportOptions);
    }
  }
  else
  {
    viewports.push(new F1.Pjax.Viewport(this)); // default viewport == <body>
  }
  return viewports;
};


// Override me!
F1.Pjax.prototype.parseDocHtml = function(docHtmlStr)
{
  var newDoc = document.implementation.createHTMLDocument();
  newDoc.documentElement.innerHTML = docHtmlStr;
  return newDoc;
};


F1.Pjax.prototype.findDOMElement = function(selector, containerElement)
{
  var elContainer = (containerElement || document);
  return elContainer.querySelector(selector);
};


F1.Pjax.prototype.findDOMElementAll = function(selector, containerElement)
{
  var elContainer = (containerElement || document);
  return elContainer.querySelectorAll(selector);
};


F1.Pjax.prototype.stopDOMEvent = function(event, immediate)
{
  if (event) {
    event.preventDefault();
    event.cancelBubble = true;
    if (immediate) { event.stopImmediatePropagation(); }
    else { event.stopPropagation(); }
  }
  return false;
};


/**
 * @return {Object} Returns the 'window.location' object OR a custom compatable object.
 */
F1.Pjax.prototype.getLocation = function()
{
  return (this.history && this.history.emulate) ? this.history.location : window.location;
};


/**
 * @param {Bool} forceUpdate Ignore the 'cached' value.
 *
 * @return {String} The application's base uri as a string.
 */
F1.Pjax.prototype.getBaseUri = function(forceUpdate)
{
  if ( ! forceUpdate && this.baseUri) { return this.baseUri; }
  this.baseUri = document.head.baseURI;
  if ( ! this.baseUri) {
    this.baseUri = window.location.protocol + '//' + window.location.host + '/';
  }
  return this.baseUri;
};


/**
 * @param {Bool} forceUpdate Ignore the 'cached' value.
 *
 * @return {String} The current window location / uri as a string.
 */
F1.Pjax.prototype.getCurrentLocation = function(forceUpdate)
{
  if ( ! forceUpdate && this.currentLocation) { return this.currentLocation; }
  var winLocation = this.getLocation();
  this.currentLocation = winLocation.href ? winLocation.href : winLocation.toString();
  return this.currentLocation;
};


/**
 * @param {Bool} forceUpdate Ignore the 'cached' value.
 *
 * @return {String} The current page path as a string.
 *   CURRENT PATH == CURRENT URI - BASE URI
 *   e.g. Current Uri = https://www.example.com/myapp/path/to/mypage/index.html
 *        Base Uri = https://www.example.com/myapp
 *        Current Path = path/to/mypage
 */
F1.Pjax.prototype.getCurrentPath = function(forceUpdate)
{
  if ( ! forceUpdate && this.currentPath) { return this.currentPath; }
  var baseUri = this.getBaseUri(forceUpdate);
  var currentLocation = this.getCurrentLocation(forceUpdate);
  this.currentPath = currentLocation.substring(baseUri.length);
  // console.log('Pjax.getCurrentPath(), this.currentLocation:', currentLocation, ',
  // this.baseUri:', baseUri, ', path:', this.currentPath);
  return this.currentPath;
};


F1.Pjax.prototype.isCurrentLocation = function(testUrl)
{
  var currentLocation = this.getCurrentLocation();
  if (testUrl.length === currentLocation.length && testUrl === currentLocation) {
    return true; }
  if (currentLocation.length > testUrl.length) {
    currentLocation = this.getCurrentPath(); }
  var result = (testUrl === currentLocation);
  // console.log('Pjax.isCurrentLocation(), testUrl:', testUrl, ',
  // currentLocation:', currentLocation, ', result:', result);
  return result;
};


F1.Pjax.prototype.isRedirectResponse = function(xhr)
{
  return (xhr.status === 202);
};


F1.Pjax.prototype.showBusyIndication = function()
{
  // console.log('Pjax.showBusyIndication(), busyImageUrl:',
  // this.busyImageUrl, ', $favicon:', this.$favicon);
  $(document.body).addClass('busy');
  if (this.busyFaviconUrl && this.$favicon) {
    this.$favicon.attr('href', this.busyFaviconUrl);
  }
};


F1.Pjax.prototype.removeBusyIndication = function()
{
  var self = this;
  if (this.busyFaviconUrl && this.$favicon) {
    setTimeout(function() {
      self.$favicon.attr('href', self.faviconUrl);
      $(document.body).removeClass('busy');
    }, 300);
  }
};


F1.Pjax.prototype.pushState = function(url, title)
{
  if ( ! this.history) {
    // console.error('Pjax.pushState(), Error: Missing history service!');
    return false;
  }
  if (this.beforePushState && this.beforePushState(url, this.history) === 'abort') {
    return false;
  }
  // Note: 'title' not supported in most browsers!
  var state = { 'url': url, 'title': title || '' };
  this.history.pushState(state, state.title, state.url);
  if (this.afterPushState) { this.afterPushState(url, this.history); }
  return true;
};


F1.Pjax.prototype.popStateHandler = function(event)
{
  // console.log('Pjax.popState() - Start - event.state:', event.state);
  if ( ! this.history) {
    // console.error('Pjax.popState(), Error: Missing history service!');
    return false;
  }
  var url = event.state ? event.state.url : '';
  // console.log('Pjax.popState() - beforePopState:', this.beforePopState,
  // ', url:', url);
  if (this.beforePopState && this.beforePopState(url, this.history) === 'abort')
  {
    var state = { 'url': this.getCurrentLocation(), 'title': '' };
    this.history.pushState(state, state.title, state.url); // Undo popState
    return false;
  }
  if ( ! this.isCurrentLocation(url))
  {
    if (this.beforePageLoad && this.beforePageLoad(url, event) === 'abort') {
      return false; }
    this.showBusyIndication();
    var self = this;
    setTimeout(function () { self.loadPage({ url: url }); }, 100);
  }
  if (this.afterPopState) { this.afterPopState(url, this.history); }
};


F1.Pjax.prototype.setPageTitle = function(newPageTitle)
{
  if (this.siteName) { newPageTitle = newPageTitle + ' - ' + this.siteName; }
  document.title = newPageTitle;
};


// Override me!
F1.Pjax.prototype.setPageTitleUsingLink = function(elLink)
{
  var newPageTitle, elLinkText;
  if ( ! elLink) { return false; }
  newPageTitle = elLink.getAttribute('data-page-title');
  if ( ! newPageTitle) {
    elLinkText = this.findDOMElement('span', elLink) || elLink;
    newPageTitle = elLinkText.innerText;
  }
  this.setPageTitle(newPageTitle);
};


// Define me if you want to check for unsaved changes!
// F1.Pjax.prototype.pageHasUnsavedChanges = function() {};


F1.Pjax.prototype.beforePageExit = function(event)
{
  // console.log('Pjax.beforePageExit()');
  if (this.pageHasUnsavedChanges && this.pageHasUnsavedChanges(event)) {
    return window.confirm(this.unsavedChangesMessage ||
      'You have unsaved changes! Ignore?');
  } else {
    return true;
  }
};


F1.Pjax.prototype.formSubmitHandler = function(event)
{
  var $form = $(this),
    pjax = event.data,
    serializedData,
    submitElement,
    submitAction,
    submitParams;
  // console.log('F1.Pjax.formSubmitHandler(), form:', this, ', event:', event);
  submitElement = $form[0].submitElement;
  // console.log('F1.Pjax.formSubmitHandler(), submitElement:', submitElement);
  submitAction = submitElement.name || '';
  if (submitElement.tagName.toLowerCase() === 'input') {
    // INPUT[type="submit"] elements use "input.value" for the button label,
    // so we have to define a "data-action-params" attribute if we need action params.
    submitParams = $(submitElement).data('action-params');
  } else {
    submitParams = submitElement.value;
  }
  if ($form.is('.no-ajax-post')) {
    if (submitAction) {
      $form.append('<input type="hidden" name="__ACTION__" value="' + submitAction + '">');
      $form.append('<input type="hidden" name="__PARAMS__" value="' + submitParams + '">');
    }
  } else {
    pjax.stopDOMEvent(event);
    serializedData = $form.serialize() || '';
    if (submitAction) {
      serializedData += serializedData.length ? '&' : '';
      serializedData += '__ACTION__=' + submitAction + '&__PARAMS__=' + submitParams;
    }
    // console.log('F1.Pjax.formSubmitHandler(), serializedData:', serializedData);
    var actionUrl = $form.attr('action');
    actionUrl = actionUrl || pjax.getCurrentLocation();
    pjax.postPage({ url: actionUrl, data: serializedData });
  }
};


// Override me!
F1.Pjax.prototype.pageLinkClickHandler = function(event)
{
  var elLink = event.target, linkUrl = elLink.href, pjax = this;
  F1.console.log('F1.Pjax.pageLinkClickHandler(), link:', linkUrl, elLink);
  pjax.stopDOMEvent(event);
  if ( ! pjax.isCurrentLocation(linkUrl))
  {
    if ( ! pjax.beforePageExit()) { return false; }
    if (pjax.beforePageLoad && pjax.beforePageLoad(linkUrl, event) === 'abort') {
      return false; }
    pjax.showBusyIndication();
    pjax.setPageTitleUsingLink(elLink);
    pjax.pushState(linkUrl);
    setTimeout(function () {
      pjax.loadPage({ url: linkUrl });
    });
  }
};


F1.Pjax.prototype.bindForms = function(viewport, formSubmitHandler)
{
  var _pjax = this, i, n, j, k, pjaxFormElements;
  formSubmitHandler = formSubmitHandler || this.formSubmitHandler;
  pjaxFormElements = this.findDOMElementAll('form.pjax', viewport.elm);
  for (i=0, n=pjaxFormElements.length; i < n; i++) {
    var elPjaxForm = pjaxFormElements[i];
    // console.log('Binding PJAX form:', elPjaxForm);
    elPjaxForm.addEventListener('submit', formSubmitHandler);
    var submitButtons = this.findDOMElementAll('[type="submit"]', elPjaxForm);
    for (j=0, k=submitButtons.length; j < k; j++) {
      submitButtons[j].addEventListener('click', function(event) {
        _pjax.showBusyIndication();
        elPjaxForm.submitElement = this;
        if (_pjax.beforeSubmit && _pjax.beforeSubmit(event, elPjaxForm) === 'abort') {
          return false; }
      });
    }
  }
};


// Override me!
F1.Pjax.prototype.bindPageLinks = function(viewport, pageLinkClickHandler)
{
  var i, n, pageLinkElements;
  pageLinkClickHandler = pageLinkClickHandler || this.pageLinkClickHandler;
  pageLinkElements = this.findDOMElementAll('.pagelink',  viewport.el);
  for (i=0,n=pageLinkElements.length; i < n; i++) {
    var elPageLink = pageLinkElements[i];
    // F1.console.log('Binding PJAX page link:', viewport, elPageLink);
    elPageLink.addEventListener('click', pageLinkClickHandler.bind(this));
  }
};


F1.Pjax.prototype.updateViewports = function(elNewBody)
{
  F1.console.log('Pjax.updateViewports(), elNewBody:', elNewBody);
  var viewports = this.viewports, i, n = viewports.length;
  for (i=0; i < n; i++) { viewports[i].beforeUpdate(this);      }
  for (i=0; i < n; i++) { viewports[i].update(this, elNewBody); }
  for (i=0; i < n; i++) { viewports[i].afterUpdate(this);       }
};


F1.Pjax.prototype.bindViewports = function ()
{
  // console.log('Pjax.bindEvents()');
  var viewports = this.viewports, i, n = viewports.length;
  for (i=0; i < n; i++) { viewports[i].beforeBind(this); }
  for (i=0; i < n; i++) { viewports[i].bindEvents(this); }
  for (i=0; i < n; i++) { viewports[i].afterBind(this);  }
};


// Override me!
F1.Pjax.prototype.getMainViewport = function ()
{
  return this.viewports[1];
};


// Override me!
F1.Pjax.prototype.updateDocument = function(newDocHtmlStr)
{
  // Parse the the new HTML so we have a DOM model to work with.
  var newDocument = this.parseDocHtml(newDocHtmlStr);
  // Update Page Title, Page CSRF Token and Page Specific in-line Styles
  if (newDocument.head)
  {
    // F1.console.log('updateDocumentHead(), newDocument.head:', newDocument.head);
    var elTitle = this.findDOMElement('title', newDocument.head);
    // F1.console.log('updateDocumentHead(), elTitle.innerText:', elTitle.innerText);
    if (elTitle) { document.title = elTitle.innerText; }
    if (this.elCsrfMeta) {
      var elNewCsrfMeta = this.findDOMElement('meta[name="' +
        this.csrfTokenMetaName + '"]', newDocument.head);
      // F1.console.log('updateDocumentHead(), elCsrfMeta:', this.elCsrfMeta);
      // F1.console.log('updateDocumentHead(), elNewCsrfMeta:', elNewCsrfMeta);
      if (elNewCsrfMeta) {
        this.csrfToken = elNewCsrfMeta.getAttribute('content');
        this.elCsrfMeta.setAttribute('content', this.csrfToken);
      } else {
        this.elCsrfMeta.setAttribute('content', '');
      }
    }
    var elCurrentStyles = this.findDOMElement('[data-rel="page"]', document.head);
    var elNewStyles = this.findDOMElement('[data-rel="page"]', newDocument.head);
    // F1.console.log('updateDocumentHead(), elCurrentStyles:', elCurrentStyles);
    // F1.console.log('updateDocumentHead(), elNewStyles:', elNewStyles);
    if (elCurrentStyles) {
      if (elNewStyles) {
        elCurrentStyles.innerHTML = elNewStyles.innerHTML;
      }
      else {
        elCurrentStyles.parentElement.removeChild(elCurrentStyles);
      }
    }
    else if (elCurrentStyles) {
      document.head.append(elNewStyles);
    }
  }
  // Update dynamic areas / viewports of the document body.
  if (newDocument.body)
  {
    this.updateViewports(newDocument.body);
  }
};


/**
 * If we requested a protected page without authorisation,
 * we typically get redirected away to a safe / public location.
 *  OR
 * We redirect to another or the same page after an ajax POST request.
 *
 * The server-side code determines the redirect URL and inserts the information
 * via a JSON response string or special header value like: X-PJAX-REDIRECT
 * or X-REDIRECT-TO
 *
 * JSON response string examples:
 *   "{ 'url':'/some/page' }"
 *   "{ 'redirect':'/some/page' }"
 *   "{ 'redirect':'http://some-external-page.com', 'external':1 }"
 *
 * @param {Object} xhr jQuery Ajax Response Object
 */
F1.Pjax.prototype.handleRedirect = function(xhr) {
  var extLink;
  var resp = xhr.responseText;
  var redirectUrl = xhr.getResponseHeader('X-REDIRECT-TO');
  if ( ! redirectUrl) {
    resp = (typeof resp === 'string') ? JSON.parse(resp) : resp;
    redirectUrl = resp.redirect || resp.url || '';
    extLink = !!resp.external;
    if (extLink) {
      // Redirect to an external page!
      return window.location.href = redirectUrl;
    }
  }
  // console.log('handleRedirect(), redirectUrl:', redirectUrl);
  if ( ! this.isCurrentLocation(redirectUrl)) {
    this.pushState(redirectUrl);
  }
  this.loadPage({ url: redirectUrl });
};


F1.Pjax.prototype.showError = function(errorMessage)
{
  // console.error('Pjax.showError(), errorMessage =', errorMessage);
  var errorsContainerSelector = this.errorsContainerSelector ||
    this.getMainViewport().selector || 'body';
  $(errorsContainerSelector).html(errorMessage);
};


/* Override me! */
F1.Pjax.prototype.getResponseErrorMessage = function(xhr)
{
  var elResponseContainer = document.createElement('div');
  elResponseContainer.innerHTML = xhr.response;
  var elErrorContainer = this.findDOMElement('.server-error', elResponseContainer);
  if (elErrorContainer) { return elErrorContainer.innerHTML; }
  return '<div class="error pjax-error">' +
           '<h3>Oops, something went wrong!</h3><hr>' +
           '<p>Error ' + xhr.status + ' - ' + xhr.statusText + '</p>' +
         '</div>';
};


F1.Pjax.prototype.loadSuccessHandler = function(xhr)
{
  F1.console.log('F1.Pjax.loadSuccessHandler()');
  if (this.onPageLoadSuccess && this.onPageLoadSuccess(xhr) === 'abort') { return; }
  if (this.isRedirectResponse(xhr)) { return this.handleRedirect(xhr); }
  this.updateDocument(xhr.response);
  if (this.afterPageLoadSuccess) {
    this.afterPageLoadSuccess(xhr);
  }
};


F1.Pjax.prototype.loadFailedHandler = function(xhr)
{
  // console.error('Pjax.loadFailedHandler(), xhr =', xhr);
  var errorMessage = this.getResponseErrorMessage(xhr);
  if (this.onPageLoadFail && this.onPageLoadFail(xhr, errorMessage) === 'abort') { return; }
  return this.showError(errorMessage);
};


// Override me!
F1.Pjax.prototype.loadProgressHandler = function (progressEvent, xhr)
{
  F1.console.log('Pjax.loadProgressHandler()');
  return (progressEvent && xhr);
};


// Override me!
F1.Pjax.prototype.alwaysAfterLoadHandler = function(xhr)
{
  // console.log('Pjax.alwaysAfterLoadHandler()'); //, xhr =', xhr);
  if ( ! this.isRedirectResponse(xhr)) {
    this.getCurrentPath('force-update'); // Also force-updates 'this.currentLocation'
    this.removeBusyIndication();
  }
};


F1.Pjax.prototype.loadPage = function(options)
{
  options = options || {};
  var _pjax = this, xhr = new XMLHttpRequest();
  xhr.open('GET', options.url);
  xhr.onload = function() {
    var xhr = this;
    if (xhr.status === 200) { _pjax.loadSuccessHandler(xhr); }
    else { _pjax.loadFailedHandler(xhr); }
    _pjax.alwaysAfterLoadHandler(xhr);
  };
  xhr.onerror = function() {
    var xhr = this;
    _pjax.loadFailedHandler(xhr);
    _pjax.alwaysAfterLoadHandler(xhr);
  };
  xhr.onprogress = function(progressEvent) {
    _pjax.loadProgressHandler(progressEvent, this);
  };
  xhr.send();
};


F1.Pjax.prototype.postSuccessHandler = function(resp, statusText, xhr)
{
  // console.log('F1.Pjax.postSuccessHandler(), xhr:', xhr);
  if (this.onPostSuccess && this.onPostSuccess(xhr) === 'abort') { return; }
  return this.handleRedirect(xhr);
};


F1.Pjax.prototype.postFailedHandler = function(xhr)
{
  // console.error('Pjax.postFailedHandler(), xhr =', xhr);
  var errorMessage = this.getResponseErrorMessage(xhr);
  if (this.onPostFail && this.onPostFail(xhr, errorMessage) === 'abort') { return; }
  return this.showError(errorMessage);
};


// Override me!
F1.Pjax.prototype.alwaysAfterPostHandler = function(resp, statusText, xhr)
{
  return resp && statusText && xhr;
};


F1.Pjax.prototype.postPage = function(options)
{
  options = options || {};
  // options.data = options.data || {};
  // options.method = (typeof options.method !== 'undefined') ? options.method : 'POST';
  // options.dataType = options.dataType || 'json';
  // options.cache = false;
  // options.headers = {};
  // if (this.csrfTokenMetaName) {
  //   options.headers[this.csrfTokenMetaName] = this.csrfToken;
  // }
  // options.headers['X-HTTP-REFERER'] = this.getCurrentLocation();
  // // console.log('Pjax.postPage(), options:', options);
  // return $.ajax(options)
  //   .done(this.postSuccessHandler.bind(this))
  //   .fail(this.postFailedHandler.bind(this))
  //   .always(this.alwaysAfterPostHandler.bind(this));

  // var _pjax = this, xhr = new XMLHttpRequest();
  // var files = document.querySelector('[type=file]').files;
  // var formData = new FormData();
  // for (let i = 0; i < files.length; i++) {
  //   let file = files[i];
  //   formData.append('files[]', file);
  // }
  // xhr.open('POST', options.url);
  // xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  // xhr.addEventListener('load', function(xhr) {
  //   if (xhr.status === 200 && xhr.responseText !== newName) {
  //     alert('Something went wrong.  Name is now ' + xhr.responseText);
  //   }
  //   else if (xhr.status !== 200) {
  //     alert('Request failed.  Returned status of ' + xhr.status);
  //   }
  // });
  // xhr.onerror = function() {
  // }
  // xhr.send(formData);
  return options;
};


F1.Pjax.prototype.goBack = function(event, distance)
{
  this.stopDOMEvent(event);
  distance = distance ? (-1 * distance) : -1;
  if (this.history) { this.history.go(distance); }
  return false;
};

// End: F1.Pjax


//-------------------------------------
// F1.Pjax.Viewport - Requires F1.Pjax
//-------------------------------------

F1.Pjax.Viewport = function(pjax, viewElementSelector, options)
{
  this.selector = viewElementSelector || 'body';
  this.el = pjax.findDOMElement(this.selector);
  F1.console.log('Viewport::construct()', this);
  for (var optName in (options || {})) { this[optName] = options[optName]; }
  if ( ! this.updateMethod) { this.updateMethod = 'innerHTML'; }
};


F1.Pjax.Viewport.prototype.nodeName = function(el, name)
{
  return el.nodeName && el.nodeName.toUpperCase() === name.toUpperCase();
};


F1.Pjax.Viewport.prototype.evalScriptElement = function(elScript)
{
  var data = (elScript.text || elScript.textContent || elScript.innerHTML || '');
  var elTempScript = document.createElement('script');
  elTempScript.appendChild(document.createTextNode(data));
  document.head.insertBefore(elTempScript, document.head.firstChild);
  document.head.removeChild(elTempScript);
  if (elScript.parentNode) { elScript.parentNode.removeChild(elScript); }
};


F1.Pjax.Viewport.prototype.evalScripts = function(elHtmContent)
{
  var i, n, contentNodes = elHtmContent.childNodes, scriptElements = [];
  for (i=0; contentNodes[i]; i++) {
    var evalScript = (!contentNodes[i].type ||
      contentNodes[i].type === 'text/javascript');
    if (evalScript && this.nodeName(contentNodes[i], 'script')) {
      scriptElements.push(contentNodes[i]);
    }
  }
  for (i=0, n=scriptElements.length; i < n; i++) {
    this.evalScriptElement(scriptElements[i]);
  }
};


// Override me!
F1.Pjax.Viewport.prototype.beforeUpdate = function(pjax)
{
  // check if update is allowed...?
  F1.console.log('Viewport:', this.selector, '- Before Update HTML');
  return pjax;
};


// Override me!
F1.Pjax.Viewport.prototype.update = function(pjax, elNewBody)
{
  var viewport = this, elNewViewport;
  F1.console.log('Viewport:', viewport.selector, '- Update HTML');
  if ( ! elNewBody) { return; }
  switch (viewport.updateMethod) {
  case 'innerHTML':
  default:
    elNewViewport = pjax.findDOMElement(viewport.selector, elNewBody);
    viewport.el.innerHTML = elNewViewport.innerHTML;
    this.evalScripts(elNewViewport);
  }
};


// Override me!
F1.Pjax.Viewport.prototype.afterUpdate = function(pjax)
{
  // modify default updates...?
  // console.log('Viewport:', this.selector, '- After Update HTML');
  return pjax;
};


// Override me!
F1.Pjax.Viewport.prototype.beforeBind = function(pjax)
{
  // console.log('Viewport:', this.selector, '- Before Bind');
  return pjax;
};


// Override me!
F1.Pjax.Viewport.prototype.bindEvents = function(pjax)
{
  var viewport = this;
  F1.console.log('Viewport:', viewport.selector, '- Bind');
  pjax.bindForms(viewport);
  pjax.bindPageLinks(viewport);
  return;
};


// Override me!
F1.Pjax.Viewport.prototype.afterBind = function(pjax)
{
  // console.log('Viewport:', this.selector, '- After Bind');
  return pjax;
};

// End: F1.Pjax.Viewport
