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

F1.Alerts = function (containerSelector, options)
{
  options = options || {};
  this.alertsContainerSelector = containerSelector || '#alerts';
  this.alertSelector = '.alert';
  this.fadeDuration = 2000;
  Object.assign(this, options);
};


F1.Alerts.prototype.removeAlert = function(elAlert) {
  elAlert.parentElement.removeChild(elAlert);
}


F1.Alerts.prototype.activateAlert = function(elAlert) {
  let ttlTimer;
  const self = this;
  const ttl = parseInt(elAlert.getAttribute('data-ttl'));
  if (ttl) {
    ttlTimer = setTimeout(function() {
      elAlert.style.transition = 'opacity ' + self.fadeDuration + 'ms';
      elAlert.style.opacity = 0;
      ttlTimer = setTimeout(function() { self.removeAlert(elAlert); }, self.fadeDuration);
    }, ttl);
  }
  elAlert.addEventListener('click', function() {
    clearTimeout(ttlTimer); self.removeAlert(elAlert);
  });
};


F1.Alerts.prototype.add = function(type, message, ttl) {
  let self = this, elAlert = document.createElement('div');
  elAlert.setAttribute('data-ttl', ttl);
  elAlert.className = 'alert ' + type;
  elAlert.innerHTML = message;
  this.el.appendChild(elAlert);
  this.activateAlert(elAlert);
};


F1.Alerts.prototype.init = function() {
  let self = this;
  this.el = document.querySelector(this.alertsContainerSelector);
  this.el.querySelectorAll(this.alertSelector).forEach(elAlert => self.activateAlert(elAlert));
  F1.console.log('F1 Alerts Initialized');
};


// end: F1.Alerts