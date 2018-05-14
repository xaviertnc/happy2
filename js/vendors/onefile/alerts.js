window.F1 = window.F1 || { afterPageLoadScripts: [] };

/**
 * OneFile files are stand-alone libs that only require jQuery to work.
 *
 * F1.Alerts - Show page errors and notifications
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  09 May 2018
 *
 */

F1.Alerts = function (alertsContainerSelector, options)
{
  options = options || {};
  this.selector = alertsContainerSelector;
  this.fadeDuration = 3000;
  $.extend(this, options);
  this.bind('init');
  console.log('F1 Alerts Initialized:', this);
};


F1.Alerts.prototype.bind = function(init) {
  if ( ! init) { console.log('F1 Alerts Bind'); }
  this.$elm = $(this.selector);
  this.$elm.find('.alert').each(function () {
    var $alert = $(this);
    var ttl = $alert.data('ttl');
    var ttlTimer;
    $alert.click(function() { clearTimeout(ttlTimer); $alert.remove(); });
    if (ttl) {
      setTimeout(function() {
        $alert.fadeOut(this.fadeDuration, function() { $alert.remove(); });
      }, ttl);
    }
  });
}


F1.Alerts.prototype.add = function(message, type, ttl) {
  var ttlTimer, $alert = $('<div class="alert '+type+'" data-ttl="'+ttl+'">'+message+'</div>');
  $alert.click(function() { clearTimeout(ttlTimer); $alert.remove(); });
  this.$elm.append($alert);
  if (ttl) {
    ttlTimer = setTimeout(function() {
      $alert.fadeOut(this.fadeDuration, function() { $alert.remove(); });
    }, ttl);
  }
};

// end: F1.Alerts
