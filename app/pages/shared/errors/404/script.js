/* globals F1 */
/* eslint-env es7 */

window.F1 = window.F1 || { afterPageLoadScripts: [] };


F1.afterPageLoadScripts.push(function initPage1()
{

  F1.console.log('This is AFTER Error 404 page loaded succesfully!');

});
