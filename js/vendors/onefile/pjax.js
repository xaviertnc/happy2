/* globals window, document, F1 */

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
  // Shallow extend
  for (var propName in (options || {})) {
    this[propName] = options[propName];
  }

  //this.chrome   = navigator.userAgent.indexOf('Chrome') > -1;
  //this.explorer = navigator.userAgent.indexOf('MSIE') > -1;
  //this.firefox  = navigator.userAgent.indexOf('Firefox') > -1;
  //this.safari   = navigator.userAgent.indexOf("Safari") > -1;
  //this.camino   = navigator.userAgent.indexOf("Camino") > -1;
  //this.opera    = navigator.userAgent.toLowerCase().indexOf("op") > -1;
  //if ((this.chrome) && (this.safari)) { this.safari = false; }
  //if ((this.chrome) && (this.opera)) { this.chrome = false; }

  if (this.busyFaviconUrl) {
    var faviconSelector = this.faviconSelector || '#favicon';
    this.elFavicon = this.findDOMElement(faviconSelector, document.head);
    this.faviconUrl = options.faviconUrl || this.elFavicon.href;
  }

  if (this.csrfTokenMetaName) {
    var csrfSelector = 'meta[name=' + this.csrfTokenMetaName + ']';
    this.elCsrfMeta = this.findDOMElement(csrfSelector, document.head);
    this.csrfToken = this.elCsrfMeta.getAttribute('content');
  }

  window.onpopstate = this.popStateHandler.bind(this);

  if (this.pageHasUnsavedChanges)
  { // Check if this function is defined, THEN set "onbeforeunload"!
    window.onbeforeunload = this.beforePageExit.bind(this);
  }

  this.viewports = this.setupViewports(options.viewports);

  this.history = this.history || window.history;

  // console.log('F1 PJAX Initialized:', this);
};


// Override me!
F1.Pjax.prototype.parseDocHtml = function(docHtmlStr)
{
  var newDoc = document.implementation.createHTMLDocument();
  newDoc.documentElement.innerHTML = docHtmlStr;
  return newDoc;
};


F1.Pjax.prototype.addClass = function(el, className)
{
  el.classList.add(className);
};


F1.Pjax.prototype.removeClass = function(el, className)
{
  el.classList.remove(className);
};


F1.Pjax.prototype.findDOMElement = function(selector, containerElement)
{
  var elContainer = (containerElement || document);
  return elContainer.querySelector(selector);
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


F1.Pjax.prototype.createInputElement = function(type, name, value) {
  var el = document.createElement('input');
  el.type = type;
  el.name = name;
  el.value = value;
  return el;
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


// Override me!
F1.Pjax.prototype.bindForms = function(viewport, formSubmitHandler)
{
  var pjax = this, i, n, j, k, pjaxFormElements;
  pjaxFormElements = this.findDOMElementAll('form.pjax', viewport.el);
  // F1.console.log('Binding PJAX viewport.elm:', viewport.el);
  for (i=0, n=pjaxFormElements.length; i < n; i++) {
    var elPjaxForm = pjaxFormElements[i];
    // F1.console.log('Binding PJAX form:', elPjaxForm);
    elPjaxForm.addEventListener('submit', formSubmitHandler ||
      function (event) { var elForm = this; pjax.formSubmitHandler(event, elForm); });
    var submitButtons = this.findDOMElementAll('[type="submit"]', elPjaxForm);
    for (j=0, k=submitButtons.length; j < k; j++) {
      submitButtons[j].addEventListener('click', function(event) {
        pjax.showBusyIndication();
        elPjaxForm.submitElement = this;
        if (pjax.beforeSubmit && pjax.beforeSubmit(event, elPjaxForm) === 'abort') {
          return false; }
      });
    }
  }
};


F1.Pjax.prototype.bindViewports = function ()
{
  // console.log('Pjax.bindEvents()');
  var viewports = this.viewports, i, n = viewports.length;
  for (i=0; i < n; i++) { viewports[i].beforeBind(this); }
  for (i=0; i < n; i++) { viewports[i].bindEvents(this); }
  for (i=0; i < n; i++) { viewports[i].afterBind(this);  }
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


F1.Pjax.prototype.showBusyIndication = function()
{
  // console.log('Pjax.showBusyIndication(), busyImageUrl:',
  // this.busyImageUrl, ', elFavicon:', this.elFavicon);
  this.addClass(document.body, 'busy');
  if (this.busyFaviconUrl && this.elFavicon) {
    this.elFavicon.setAttribute('href', this.busyFaviconUrl);
  }
};


F1.Pjax.prototype.removeBusyIndication = function()
{
  var pjax = this;
  if (pjax.busyFaviconUrl && pjax.elFavicon) {
    setTimeout(function() {
      pjax.elFavicon.setAttribute('href', pjax.faviconUrl);
      pjax.removeClass(document.body, 'busy');
    }, 300);
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
    else if (elNewStyles) {
      document.head.appendChild(elNewStyles);
    }
  }
  // Update dynamic areas / viewports of the document body.
  if (newDocument.body)
  {
    this.updateViewports(newDocument.body);
  }
};


// Override me!
F1.Pjax.prototype.getMainViewport = function ()
{
  return this.viewports[1];
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


// override me!
F1.Pjax.prototype.formSubmitHandler = function(event, elForm)
{
  this.stopDOMEvent(event);
  // F1.console.log('F1.Pjax.formSubmitHandler(), this:', this);
  // F1.console.log('F1.Pjax.formSubmitHandler(), event:', event);
  // F1.console.log('F1.Pjax.formSubmitHandler(), elForm:', elForm);
  if (elForm.submitElement) {
    var submitParams, submitAction = elForm.submitElement.name || '';
    // NOTE: elForm.submitElement is set in Pjax.bindForms() below
    // via the submit element's onClick handler.
    if (elForm.submitElement.tagName.toLowerCase() === 'input') {
      // INPUT[type="submit"] elements use "input.value" for the button label,
      // so we have to define a "data-action-params" attribute if we need action params.
      submitParams = elForm.submitElement.getAttribute('data-action-params');
    } else {
      submitParams = elForm.submitElement.value;
    }
    if (submitAction) {
      elForm.appendChild(this.createInputElement('hidden', '__ACTION__', submitAction));
      elForm.appendChild(this.createInputElement('hidden', '__PARAMS__', submitParams));
    }
  }
  return this.postFormData(elForm);
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
  var resp = xhr.response;
  var redirectUrl = xhr.getResponseHeader('X-REDIRECT-TO');
  // F1.console.log('Pjax.handleRedirect(), redirectUrl =', redirectUrl);
  // F1.console.log('Pjax.handleRedirect(), xhr =', xhr);
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
  var el = this.findDOMElement(errorsContainerSelector);
  el.innerHTML = errorMessage;
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


F1.Pjax.prototype.loadSuccessHandler = function(xhr, progressEvent)
{
  // F1.console.log('F1.Pjax.loadSuccessHandler()');
  if (this.onPageLoadSuccess && this.onPageLoadSuccess(xhr, progressEvent) === 'abort') { return; }
  if (this.isRedirectResponse(xhr)) { return this.handleRedirect(xhr); }
  this.updateDocument(xhr.response);
  if (this.afterPageLoadSuccess) {
    this.afterPageLoadSuccess(xhr);
  }
};


F1.Pjax.prototype.loadFailedHandler = function(xhr, progressEvent)
{
  // console.error('Pjax.loadFailedHandler(), xhr =', xhr);
  var errorMessage = this.getResponseErrorMessage(xhr);
  if (this.onPageLoadFail && this.onPageLoadFail(xhr, progressEvent, errorMessage) === 'abort') { return; }
  return this.showError(errorMessage);
};


// Override me!
F1.Pjax.prototype.loadProgressHandler = function (xhr, progressEvent)
{
  // F1.console.log('Pjax.loadProgressHandler()');
  return (progressEvent && xhr);
};


// Override me!
F1.Pjax.prototype.alwaysAfterLoadHandler = function(xhr, progressEvent)
{
  // console.log('Pjax.alwaysAfterLoadHandler()'); //, xhr =', xhr);
  if (this.onAlwaysAfterLoad && this.onAlwaysAfterLoad(xhr, progressEvent) === 'abort') { return; }
  if ( ! this.isRedirectResponse(xhr)) {
    this.getCurrentPath('force-update'); // Also force-updates 'this.currentLocation'
    this.removeBusyIndication();
  }
};


F1.Pjax.prototype.loadPage = function(options)
{
  options = options || {};
  var pjax = this, xhr = new XMLHttpRequest();
  xhr.open('GET', options.url);
  xhr.setRequestHeader('X-REQUESTED-WITH', 'PJAX');
  xhr.onload = function(progressEvent) {
    var xhr = this;
    if (xhr.status === 200) { pjax.loadSuccessHandler(xhr, progressEvent); }
    else { pjax.loadFailedHandler(xhr, progressEvent); }
    pjax.alwaysAfterLoadHandler(xhr, progressEvent);
  };
  xhr.onerror = function() {
    var xhr = this;
    pjax.loadFailedHandler(xhr);
    pjax.alwaysAfterLoadHandler(xhr);
  };
  xhr.onprogress = function(progressEvent) {
    pjax.loadProgressHandler(this, progressEvent);
  };
  xhr.send();
};


F1.Pjax.prototype.postSuccessHandler = function(xhr, progressEvent)
{
  // F1.console.log('F1.Pjax.postSuccessHandler(), xhr:', xhr);
  if (this.onPostSuccess && this.onPostSuccess(xhr, progressEvent) === 'abort') { return; }
  return this.handleRedirect(xhr);
};


F1.Pjax.prototype.postFailedHandler = function(xhr, progressEvent)
{
  F1.console.error('Pjax.postFailedHandler(), xhr =', xhr, ', progressEvent =', progressEvent);
  var errorMessage = this.getResponseErrorMessage(xhr);
  if (this.onPostFail && this.onPostFail(xhr, errorMessage) === 'abort') { return; }
  return this.showError(errorMessage);
};


// Override me!
F1.Pjax.prototype.alwaysAfterPostHandler = function(xhr, progressEvent)
{
  return xhr && progressEvent;
};


F1.Pjax.prototype.postFormData = function(elForm)
{
  var pjax = this;
  var xhr = new XMLHttpRequest();
  var formData = new FormData(elForm);
  var postUrl = elForm.action || pjax.getCurrentLocation();
  xhr.open('post', postUrl);
  // NOTE: FormData handles input serialization including file inputs!
  // TODO: Should we check for files in submit and change the conent type accordingly?
  // xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  if (pjax.csrfTokenMetaName) {
    xhr.setRequestHeader(pjax.csrfTokenMetaName, pjax.csrfToken); }
  xhr.setRequestHeader('X-HTTP-REFERER', postUrl);
  xhr.setRequestHeader('X-REQUESTED-WITH', 'PJAX');
  xhr.onload = function(progressEvent) {
    var xhr = this;
    if (xhr.status === 200 || xhr.status === 202) {
      pjax.postSuccessHandler(xhr, progressEvent);
    } else {
      pjax.postFailedHandler(xhr, progressEvent);
    }
    pjax.alwaysAfterPostHandler(xhr, progressEvent);
  };
  xhr.onerror = pjax.postFailedHandler;
  return xhr.send(formData);
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
  // F1.console.log('Viewport::construct()', this);
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
  // F1.console.log('Viewport:', this.selector, '- Before Update HTML');
  return pjax;
};


// Override me!
F1.Pjax.Viewport.prototype.update = function(pjax, elNewBody)
{
  var viewport = this, elNewViewport;
  // F1.console.log('Viewport:', viewport.selector, '- Update HTML');
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
  // F1.console.log('Viewport:', this.selector, '- After Update HTML');
  return pjax;
};


// Override me!
F1.Pjax.Viewport.prototype.beforeBind = function(pjax)
{
  // F1.console.log('Viewport:', this.selector, '- Before Bind');
  return pjax;
};


// Override me!
F1.Pjax.Viewport.prototype.bindEvents = function(pjax)
{
  var viewport = this;
  // F1.console.log('Viewport:', viewport.selector, '- Bind');
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
