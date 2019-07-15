/* globals F1 */
/* eslint-env es7 */

window.F1 = window.F1 || { afterPageLoadScripts: [] };

/**
 * F1.Alerts - Show page errors and notifications
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  14 July 2019
 *
 */

F1.Alerts = function (alertsContainerSelector, options)
{
  options = options || {};
  this.alertsSelector = alertsContainerSelector || '#alerts';
  this.alertSelector = '.alert';
  this.fadeDuration = 3000;
  Object.assign(this, options);
};


F1.Alerts.prototype.mount = function(elAlert) {
  let self = this, ttl = elAlert.getAttribute('data-ttl'), ttlTimer;
  elAlert.addEventListener('click', function() {
    clearTimeout(ttlTimer);
    elAlert.parentElement.removeChild(elAlert);
  });
  if (ttl) {
    setTimeout(function() {
      elAlert.style.transition = self.fadeDuration;
      elAlert.style.opacity = 0;
      setTimeout(function() {
        elAlert.parentElement.removeChild(elAlert);
      }, self.fadeDuration);
    }, ttl);
  }
};


F1.Alerts.prototype.add = function(message, type, ttl) {
  let self = this, elAlert = document.createElement('div');
  elAlert.setAttribute('data-ttl', ttl);
  elAlert.className = 'alert ' + type;
  elAlert.innerHTML = message;
  elAlert.addEventListener('click', function() { self.mount(elAlert); });
};


F1.Alerts.prototype.init = function() {
  let self = this;
  this.el = document.querySelector(this.alertsSelector);
  this.el.querySelectorAll(this.alertSelector).forEach(elAlert => self.mount(elAlert));
  F1.console.log('F1 Alerts Initialized:', this);
};


// end: F1.Alerts