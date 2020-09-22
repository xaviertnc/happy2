/* globals F1 */
/* eslint-env es7 */

window.F1 = window.F1 || { afterPageLoadScripts: [] };

/**
 * F1.Back2Top - Scroll "Back to top", auto show, floating button.
 *   - When the user scrolls down 20px from the top of the document,
 *     show the button
 *
 * NOTE: Set <style> html { scroll-behaviour: smooth; } </style>
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  14 July 2019
 *
 */

F1.Back2Top = function (elementSelector, showOffset)
{
  this.showOffset = showOffset || 20;
  this.el = document.querySelector(elementSelector || '#back-to-top');
  window.addEventListener('scroll', this.scrollHandler.bind(this));
  F1.console.log('F1 Back2Top Initialized');
};


F1.Back2Top.prototype.scrollHandler = function()
{
  this.el.style.display = (document.body.scrollTop > this.showOffset ||
    document.documentElement.scrollTop > this.showOffset) ? 'block' : 'none';
};

// end: F1.Back2Top
