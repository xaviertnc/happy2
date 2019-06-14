/* globals window, F1, Happy2, HappyInput, HappyField */
/* eslint-env es6 */

window.F1 = window.F1 || { afterPageLoadScripts: [] };


F1.afterPageLoadScripts.push(function initPage1() {

  let elHappyForm = document.body.querySelector('#form1');

  F1.clean = {
  	date   : function() {},
  	name   : function() {},
  	number : function() {}
  };

  F1.validate = {

  	fullname: function(field)
  	{
  		return false;
  	},

  	birthday: function(field)
  	{
  		return false;
  	}

  };

  F1.onSubmit = function(form, event)
  {
  	return false;
  };

  F1.happyForm = new HappyForm({
  	el: elHappyForm,
  	fieldSelector: '.field', // or fn()
  	inputSelector: '.input',  // or fn()
  	requiredText: 'required',
  	onSubmit: F1.onSubmit
  });

  F1.happyForm.addFields({
  	'fullname': {
  		clean: F1.clean.name,
  		validate: F1.validate.fullname
  	},
  	'birthday': {
  		clean: F1.clean.number,
  		validate: F1.validate.birthday
  	},
  	'radiolist': {
  	},
  	'checklist': {
  	},
  	'checkbox': {
  	},
  	'select': {
  	}
  });

  F1.console.log('F1 HappyForm Initialized:', F1.happyForm);
  F1.console.log('This is AFTER Page 1 loaded succesfully!');

});
