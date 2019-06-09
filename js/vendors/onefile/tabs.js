window.F1 = window.F1 || { afterPageLoadScripts: [] };

/**
 * OneFile files are stand-alone libs that only require jQuery to work.
 *
 * F1.Tabs - Tabs Nav Control
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  09 September 2018
 *
 */

F1.Tabs = function (options)
{
  options = options || {};
  $.extend(this, options);
  console.log('F1 Tabs Initialized:', this);
};


F1.Tabs.prototype.show = function(elTab, event)
{
  event.preventDefault();
  var $tab = $(elTab);
  var $tabContent = $('#' + $tab.data('tab'));
  $('.tabs li').removeClass('active');
  $('.tab-content').removeClass('active');
  $tab.addClass('active');
  $tabContent.addClass('active').find(':input:fitst').focus();
  return false;
};


F1.Tabs.prototype.bind = function()
{
  var self = this;
  $('.tabs li').on('click', function (event) { self.show(this, event); });
}

// end: F1.Tabs
