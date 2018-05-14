window.F1 = window.F1 || { afterPageLoadScripts: [] };

/**
 * OneFile files are stand-alone libs that only require jQuery to work.
 *
 * F1.Modal - Modal behaviour methods
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  14 April 2018
 *
 */

F1.Modal = function (options)
{
  options = options || {};
  $.extend(this, options);
  console.log('F1 Modal Initialized:', this);
};


F1.Modal.prototype.dismiss = function(elm, event)
{
  event.preventDefault();
  $(elm).parents('.modal:first').toggle('hidden');
  return false;
};

// end: F1.Modal
