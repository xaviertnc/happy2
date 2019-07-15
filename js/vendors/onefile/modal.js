/* globals F1 */
/* eslint-env es7 */

window.F1 = window.F1 || { afterPageLoadScripts: [] };

/**
 * F1.Modal - Modal behaviour methods
 *
 * @auth:  C. Moller <xavier.tnc@gmail.com>
 * @date:  14 July 2019
 *
 */

F1.Modal = function (options)
{
  options = options || {};
  Object.assign(this, options);
  F1.console.log('F1 Modal Initialized');
};


/**
 * @param Bool|Object resetForm true|false OR { form: [formObj], fields: [fieldValuesObj], formGroup: "payments" }
 *
 * fieldValuesObj = { field1Name: Field1Value, Field2Name: Field2Value, ... }
 * e.g. {"ref": "p123", "amount": "1000.00"}
 *
 */
F1.Modal.prototype.show = function (modalSelector, event, resetForm)
{
  F1.console.log('F1 Modal SHOW, resetForm:', resetForm);
  event.preventDefault();
  const elModal = document.querySelector(modalSelector);
  const inputElements = elModal.querySelectorAll('input, textarea, select');
  try {
    if (resetForm) {
      if (typeof resetForm === 'object') {
        const formGroup = resetForm.formGroup;
        const fields = resetForm.fields;
        if (formGroup) {
          for (let field in fields) {
            resetForm.form[formGroup][field].value = fields[field];
          }
        } else {
          for (let field in fields) {
            resetForm.form[field].value = fields[field];
          }
        }
      } else {
        inputElements.forEach(elInput => elInput.value = '');
      }
    }
  } catch(err) {
    F1.console.log('error:' + err.message);
  }
  if (elModal) {
    elModal.classList.remove('hidden');
    let elModalClose = elModal.querySelector('.modal-close');
    if (elModalClose) { elModalClose.MODAL = elModal; }
  }
  if (inputElements.length) { inputElements[0].focus(); }
};


F1.Modal.prototype.dismiss = function (elModalClose, event)
{
  event.preventDefault();
  elModalClose.MODAL.classList.add('hidden');
};

// end: F1.Modal
