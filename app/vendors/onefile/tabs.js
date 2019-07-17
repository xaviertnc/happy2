/* globals F1 */
/* eslint-env es7 */

window.F1 = window.F1 || { afterPageLoadScripts: [] };

/**
 * F1.Tabs - Tabs Nav Control
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  14 July 2019
 *
 */

F1.Tabs = function (options)
{
  Object.assign(this, options || {});
  this.selector = this.selector || '.tabs';
  this.tabSelector = this.tabSelector || '.tab';
  this.tabContentSelector = this.tabContentSelector || '.tab-content';
};


F1.Tabs.prototype.show = function(elTab, event)
{
  event.preventDefault();
  let elTabContent = document.querySelector('#' + elTab.getAttribute('data-content'));
  this.tabContentElements.forEach(elTabContent => elTabContent.classList.remove('active'));
  this.tabElements.forEach(elTab => elTab.classList.remove('active'));
  elTabContent.classList.add('active');
  elTab.classList.add('active');
};


F1.Tabs.prototype.init = function()
{
  var self = this;
  this.el = document.querySelector(this.selector);
  this.tabElements = this.el ? this.el.querySelectorAll(this.tabSelector) : [];
  this.tabContentElements = this.el ? document.querySelectorAll(this.tabContentSelector) : [];
  this.tabElements.forEach(function (elTab) {
    elTab.addEventListener('click', event => self.show(elTab, event));
  });
  F1.console.log('F1 Tabs Initialized');
};

// end: F1.Tabs
