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


/**
 * @param Bool|Object resetForm true|false OR { form: [formObj], fields: [fieldValuesObj], formGroup: "payments" }
 *
 * fieldValuesObj = { field1Name: Field1Value, Field2Name: Field2Value, ... }
 * e.g. {"ref": "p123", "amount": "1000.00"}
 *
 */
F1.Modal.prototype.show = function (modalSelector, event, resetForm)
{
  console.log('F1 Modal SHOW, resetForm:', resetForm);
  event.preventDefault();
  try {
    var $modal = $(modalSelector);
    var $inputs = $modal.find(':input');
    if (resetForm) {
      if (typeof resetForm === 'object') {
        var formGroup = resetForm.formGroup;
        var fields = resetForm.fields;
        if (formGroup) {
          for (var field in fields) {
            resetForm.form[formGroup][field].value = fields[field];
          }
        } else {
          for (var field in fields) {
            resetForm.form[field].value = fields[field];
          }
        }
      } else {
        $inputs.val('');
      }
    }
  } catch(err) {
    console.log('error:' + err.message);
  }
  $modal.removeClass('hidden');
  $inputs.first().focus();
  return false;
};


F1.Modal.prototype.dismiss = function (elm, event)
{
  event.preventDefault();
  $(elm).parents('.modal:first').addClass('hidden');
  return false;
};

// end: F1.Modal
