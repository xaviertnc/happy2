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
 * @prop: {string} busyImageUrl
 * @prop: {string} currentPath
 * @prop: {string} faviconUrl
 *
 * @param: {object} options    Insert dependancies, state and behaviour via this object.
 *   e.g. options = {
 *     siteName: 'Pjax Demo',
 *     viewports: ['#top-navbar', '#main-content'],
 *     baseUri: 'http://www.example.com/',
 *     csrfTokenMetaName: 'x-csrf-token',
 *     busyImageUrl: 'loading.ico'
 *   }
 */
F1.Pjax = function (options)
{
  options = options || {};

  if (options.busyImageUrl) {
    this.$favicon = $(options.faviconSelector || '#favicon');
  }

  if (options.csrfTokenMetaName) {
    this.$csrfMeta = $(document.head).find('meta[name=' + options.csrfTokenMetaName + ']');
    this.csrfToken = this.$csrfMeta.attr('content');
  }

  if ( ! options.$busyIndicator) {
    this.$busyIndicator = $(options.busySelector || '#busy-indicator');
  }

  $.extend(this, options);

  this.history = this.history || window.history;

  window.onpopstate = this.popStateHandler.bind(this);

  window.onbeforeunload = this.beforePageExit.bind(this);

  this.viewports = this.setupViewports(options.viewports);

  // console.log('F1 PJAX Initialized:', this);
};


/**
 * @param {Array} viewportDefinitions: [def1, def2, ...]
 *   Viewport definition types:
 *     string: The viewport's DOM selector string e.g. "#viewportElementId"
 *     object: { selector: '#mainview', opt1: opt1Val, ..., optN: optNVal }
 *   e.g. ['#vport1', '#vport2', ...] or [{ selector: '#vport1', 'updateMethod': 'replace' }, { ... }, ...]
 *
 * @return {Array} of ViewPort objects
 */
F1.Pjax.prototype.setupViewports = function(viewportDefinitions)
{
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
      viewports[i] = new F1.Pjax.Viewport(viewportSelector, viewportOptions);
    }
  }
  else
  {
    viewports.push(new F1.Pjax.Viewport()); // default viewport == <body>
  }
  return viewports;
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
  // console.log('Pjax.getCurrentPath(), this.currentLocation:', currentLocation, ', this.baseUri:', baseUri, ', path:', this.currentPath);
  return this.currentPath;
};


F1.Pjax.prototype.isCurrentLocation = function(testUrl)
{
  var currentLocation = this.getCurrentLocation();
  if (testUrl.length === currentLocation.length && testUrl === currentLocation) { return true; }
  if (currentLocation.length > testUrl.length) { currentLocation = this.getCurrentPath(); }
  var result = (testUrl === currentLocation);
  // console.log('Pjax.isCurrentLocation(), testUrl:', testUrl, ', currentLocation:', currentLocation, ', result:', result);
  return result;
};


F1.Pjax.prototype.isRedirectResponse = function(jqXHR)
{
  return (jqXHR.status === 202);
};


F1.Pjax.prototype.showBusyIndication = function()
{
  // console.log('Pjax.showBusyIndication(), busyImageUrl:', this.busyImageUrl, ', $favicon:', this.$favicon);
  if (this.busyImageUrl && this.$favicon) {
    this.$favicon.attr('href', this.busyImageUrl);
  }
  document.body.classList.add('busy');
  this.$busyIndicator.removeClass('hidden');
};


F1.Pjax.prototype.removeBusyIndication = function()
{
  // console.log('Pjax.removeBusyIndication()');
  this.$busyIndicator.addClass('hidden');
  document.body.classList.remove('busy');
  if (this.busyImageUrl && this.$favicon) {
    this.$favicon.attr('href', this.faviconUrl || 'favicon.ico');
  }
};


F1.Pjax.prototype.pushState = function(url, title)
{
  if ( ! this.history) {
    // console.error('Pjax.pushState(), Error: Missing history service!');
    return false;
  }
  if (this.beforePushState && this.beforePushState(url, this.history) === 'abort') { return false; }
  var state = { 'url': url, 'title': title || '' }; // Note: 'title' not supported in most browsers!
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
  // console.log('Pjax.popState() - beforePopState:', this.beforePopState, ', url:', url);
  if (this.beforePopState && this.beforePopState(url, this.history) === 'abort')
  {
    var state = { 'url': this.getCurrentLocation(), 'title': '' };
    this.history.pushState(state, state.title, state.url); // Undo popState
    return false;
  }
  if ( ! this.isCurrentLocation(url))
  {
    if (this.beforePageLoad && this.beforePageLoad(url, event) === 'abort') { return false; }
    this.showBusyIndication();
    this.loadPage({ url: url });
  }
  if (this.afterPopState) { this.afterPopState(url, this.history); }
};


F1.Pjax.prototype.setPageTitle = function(newPageTitle)
{
  if (this.siteName) { newPageTitle = newPageTitle + ' - ' + this.siteName; }
  document.title = newPageTitle;
};


// Override me!
F1.Pjax.prototype.setPageTitleUsingLink = function($link)
{
  var newPageTitle;
  if ( ! $link) { return false; }
  newPageTitle = $link.data('page-title');
  if ( ! newPageTitle) {
    newPageTitle = $link.find('span').first().text() || $link.text();
  }
  this.setPageTitle(newPageTitle);
};


// Override me!
F1.Pjax.prototype.pageHasUnsavedChanges = function ()
{
  // console.log('Pjax.pageHasUnsavedChanges()');
  return false;
}


F1.Pjax.prototype.beforePageExit = function (event)
{
  // console.log('Pjax.beforePageExit()');
  if (this.pageHasUnsavedChanges(event)) {
    return window.confirm(this.unsavedChangesMessage || 'You have unsaved changes! Ignore?');
  } else {
    return true;
  }
};


F1.Pjax.prototype.formSubmitHandler = function (event)
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
F1.Pjax.prototype.pageLinkClickHandler = function (event)
{
  var $link = $(this),
      linkUrl = $link.attr('href'),
      pjax = event.data;

  // console.log('F1.Pjax.pageLinkClickHandler(), link:', this) //, ', event:', event);

  pjax.stopDOMEvent(event);

  if ( ! pjax.isCurrentLocation(linkUrl))
  {
    if ( ! pjax.beforePageExit()) { return false; }
    if (pjax.beforePageLoad && pjax.beforePageLoad(linkUrl, event) === 'abort') { return false; }
    pjax.showBusyIndication();
    pjax.setPageTitleUsingLink($link);
    pjax.pushState(linkUrl);
    pjax.loadPage({ url: linkUrl });
  }
};


// Override me!
F1.Pjax.prototype.updatePageHead = function ($loadedHtml)
{
  if ($loadedHtml)
  {
    // console.log('updatePageHead(), $loadedHtml:', $loadedHtml);

    document.title = $loadedHtml.find('title').text();

    if (this.$csrfMeta) {
      this.csrfToken = $loadedHtml.find('meta[name="' + this.csrfTokenMetaName + '"]').attr('content');
      this.$csrfMeta.attr('content', this.csrfToken);
    }

    var $pageStyles = $(document.head).find('[data-rel="page"]');
    var $newPageStyles = $loadedHtml.find('style').first('[data-rel="page"]');

    if ($pageStyles.length) {
      if ($newPageStyles.length) {
        $pageStyles.text($newPageStyles.text());
      }
      else {
        $pageStyles.remove();
      }
    }
    else if ($newPageStyles.length) {
      $(document.head).append($newPageStyles);
    }
  }
}


F1.Pjax.prototype.bindForms = function (viewport, formSubmitHandler)
{
  var _pjax = this;
  formSubmitHandler = formSubmitHandler || this.formSubmitHandler;
  viewport.$elm.find('form.pjax').each(function() {
    var $form = $(this);
    // console.log('Binding PJAX form:', $form);
    $form.on('submit', _pjax, formSubmitHandler);
    $form.find('[type="submit"]').click(function(event) {
      _pjax.showBusyIndication();
      $form[0].submitElement = this;
      if (_pjax.beforeSubmit && _pjax.beforeSubmit(event, $form) === 'abort') { return false; }
    });
  });
};


// Override me!
F1.Pjax.prototype.bindPageLinks = function (viewport, pageLinkClickHandler)
{
  var _pjax = this;
  pageLinkClickHandler = pageLinkClickHandler || this.pageLinkClickHandler;
  viewport.$elm.find('.pagelink').each(function() {
    var $link = $(this);
    // console.log('Binding PJAX link:', $link);
    $link.on('click', _pjax, pageLinkClickHandler);
  });
};


F1.Pjax.prototype.updateViewports = function ($loadedHtml, jqXHR)
{
  // console.log('Pjax.updateViewports(), $loadedHtml:', $loadedHtml);
  var viewports = this.viewports, i, n = viewports.length;
  for (i=0; i < n; i++) { viewports[i].beforeUpdate(this, jqXHR);        }
  for (i=0; i < n; i++) { viewports[i].update(this, $loadedHtml, jqXHR); }
  for (i=0; i < n; i++) { viewports[i].afterUpdate(this, jqXHR);         }
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
}


F1.Pjax.prototype.showError = function (errorMessage)
{
  // console.error('Pjax.showError(), errorMessage =', errorMessage);
  var errorsContainerSelector = this.errorsContainerSelector || this.getMainViewport().selector || 'body';
  $(errorsContainerSelector).html(errorMessage);
};


/* Override me! */
F1.Pjax.prototype.getResponseErrorMessage = function (jqXHR)
{
  var $errorMessageContainer = $('<div></div>').append(jqXHR.responseText).find('.server-error');
  if ($errorMessageContainer.length) { return $errorMessageContainer.html(); }
  return '<div class="error pjax-error">' +
           '<h3>Oops, something went wrong!</h3><hr>' +
           '<p>Error ' + jqXHR.status + ' - ' + jqXHR.statusText + '</p>' +
         '</div>';
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
 * @param {Object} jqXHR jQuery Ajax Response Object
 */
F1.Pjax.prototype.handleRedirect = function (jqXHR) {
  var extLink;
  var resp = jqXHR.responseText;
  var redirectUrl = jqXHR.getResponseHeader('X-REDIRECT-TO');
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


F1.Pjax.prototype.loadSuccessHandler = function (resp, statusText, jqXHR)
{
  // console.log('F1.Pjax.loadSuccessHandler(), jqXHR:', jqXHR);
  // console.log('F1.Pjax.loadSuccessHandler(), getAllResponseHeaders:', jqXHR.getAllResponseHeaders());
  if (this.onPageLoadSuccess && this.onPageLoadSuccess(jqXHR) === 'abort') { return; }
  if (this.isRedirectResponse(jqXHR)) { return this.handleRedirect(jqXHR); }
  var $loadedHtml = $('<response></response>').html(resp); // Parse response
  this.updatePageHead($loadedHtml, jqXHR);
  this.updateViewports($loadedHtml, jqXHR);
  if (this.afterPageLoadSuccess) { this.afterPageLoadSuccess($loadedHtml, jqXHR); }
};


F1.Pjax.prototype.loadFailedHandler = function (jqXHR)
{
  // console.error('Pjax.loadFailedHandler(), jqXHR =', jqXHR);
  var errorMessage = this.getResponseErrorMessage(jqXHR);
  if (this.onPageLoadFail && this.onPageLoadFail(jqXHR, errorMessage) === 'abort') { return; }
  return this.showError(errorMessage);
};


// Override me!
F1.Pjax.prototype.alwaysAfterLoadHandler = function (resp, statusText, jqXHR)
{
  // console.log('Pjax.alwaysAfterLoadHandler()'); //, jqXHR =', jqXHR);
  if ( ! this.isRedirectResponse(jqXHR)) {
    this.getCurrentPath('force-update'); // Also force-updates 'this.currentLocation'
    this.removeBusyIndication();
  }
};


F1.Pjax.prototype.loadPage = function (options)
{
  options = options || {};
  options.method = 'GET';
  options.dataType = options.dataType || 'html';
  options.cache = (typeof options.cache !== 'undefined') ? options.cache : false;
  // console.log('Pjax.loadPage(), options:', options);
  return $.ajax(options)
    .done(this.loadSuccessHandler.bind(this))
    .fail(this.loadFailedHandler.bind(this))
    .always(this.alwaysAfterLoadHandler.bind(this))
};


F1.Pjax.prototype.postSuccessHandler = function (resp, statusText, jqXHR)
{
  // console.log('F1.Pjax.postSuccessHandler(), jqXHR:', jqXHR);
  if (this.onPostSuccess && this.onPostSuccess(jqXHR) === 'abort') { return; }
  return this.handleRedirect(jqXHR);
};


F1.Pjax.prototype.postFailedHandler = function (jqXHR)
{
  // console.error('Pjax.postFailedHandler(), jqXHR =', jqXHR);
  var errorMessage = this.getResponseErrorMessage(jqXHR);
  if (this.onPostFail && this.onPostFail(jqXHR, errorMessage) === 'abort') { return; }
  return this.showError(errorMessage);
};


// Override me!
F1.Pjax.prototype.alwaysAfterPostHandler = function (resp, statusText, jqXHR)
{
  return resp && statusText && jqXHR;
};


F1.Pjax.prototype.postPage = function (options)
{
  options = options || {};
  options.data = options.data || {};
  options.method = (typeof options.method !== 'undefined') ? options.method : 'POST';
  options.dataType = options.dataType || 'json';
  options.cache = false;
  options.headers = {};
  if (this.csrfTokenMetaName) {
    options.headers[this.csrfTokenMetaName] = this.csrfToken;
  }
  options.headers['X-HTTP-REFERER'] = this.getCurrentLocation();
  // console.log('Pjax.postPage(), options:', options);
  return $.ajax(options)
    .done(this.postSuccessHandler.bind(this))
    .fail(this.postFailedHandler.bind(this))
    .always(this.alwaysAfterPostHandler.bind(this))
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

F1.Pjax.Viewport = function (viewElementSelector, options)
{
  this.selector = viewElementSelector || 'body';
  this.$elm = $(this.selector);
  options = options || {};
  $.extend(this, options);
  if ( ! this.updateMethod) { this.updateMethod = 'innerHTML'; }
}


// Override me!
F1.Pjax.Viewport.prototype.beforeUpdate = function (pjax, jqXHR)
{
  // check if update is allowed...?
  // console.log('Viewport:', this.selector, '- Before Update HTML');
  return pjax && jqXHR;
};


// Override me!
F1.Pjax.Viewport.prototype.update = function (pjax, $loadedHtml) // , jqXHR
{
  var viewport = this, newContent;
  // console.log('Viewport:', viewport.selector, '- Update HTML');
  if ( ! $loadedHtml) { return; }
  switch (viewport.updateMethod) {
    case 'innerHTML':
    default:
      newContent = $loadedHtml.find(viewport.selector).first().html();
      return viewport.$elm.html(newContent);
  }
};


// Override me!
F1.Pjax.Viewport.prototype.afterUpdate = function (pjax, jqXHR)
{
  // modify default updates...?
  // console.log('Viewport:', this.selector, '- After Update HTML');
  return pjax && jqXHR;
};


// Override me!
F1.Pjax.Viewport.prototype.beforeBind = function (pjax)
{
  // console.log('Viewport:', this.selector, '- Before Bind');
  return pjax;
};


// Override me!
F1.Pjax.Viewport.prototype.bindEvents = function (pjax)
{
  var viewport = this;
  // console.log('Viewport:', viewport.selector, '- Bind');
  pjax.bindForms(viewport);
  pjax.bindPageLinks(viewport);
  return;
};


// Override me!
F1.Pjax.Viewport.prototype.afterBind = function (pjax)
{
  // console.log('Viewport:', this.selector, '- After Bind');
  return pjax;
};

// End: F1.Pjax.Viewport
