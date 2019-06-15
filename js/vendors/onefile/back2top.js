window.F1 = window.F1 || { afterPageLoadScripts: [] };

/**
 * OneFile files are stand-alone libs that only require jQuery to work.
 *
 * F1.Back2Top - Scroll "Back to top", auto show, floating button.
 *   - When the user scrolls down 20px from the top of the document,
 *     show the button
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  14 April 2018
 *
 */

F1.Back2Top = function (elementSelector, options)
{
  this.selector = elementSelector || '#back-to-top';
  this.$elm = $(this.selector);
  this.style = this.$elm[0].style;
  this.showTop = 20;
  options = options || {};
  $.extend(this, options);
  $(window).on('scroll', this, this.scrollHandler.bind(this));
  F1.console.log('F1 Back2Top Initialized:', this);
};


F1.Back2Top.prototype.scrollHandler = function(event)
{
  var display = this.style.display;
  if (document.body.scrollTop > this.showTop || document.documentElement.scrollTop > this.showTop) {
    if ( ! display || display === 'none' ) { this.style.display = 'block'; }
  } else {
    if (display === 'block') { this.style.display = 'none'; }
  }
};

// end: F1.Modal
