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

F1.Back2Top = function (triggerOffset, elementSelector)
{
  triggerOffset = triggerOffset || 20;
  var el = document.querySelector(elementSelector || '#back-to-top');
  var elDoc = document.documentElement || document.body;
  var scrollHandler = function() {
	  if (elDoc.scrollTop > triggerOffset) { elDoc.classList.add('top-hidden'); }
	  else { elDoc.classList.remove('top-hidden'); }
	};
  window.addEventListener('scroll', scrollHandler);
  F1.console.log('F1 Back2Top Initialized');
};

// end: F1.Back2Top
