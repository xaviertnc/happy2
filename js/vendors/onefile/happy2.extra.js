/* globals moment, $, Happy2Ext */
window.Happy2Ext = { // Happy2Extra ...

  zaTel: function (val) {
    // console.log('zaTel(), val:', val);
    return /^0[1-9]\d{8}$/.test(val);
  },

  tel: function (val) {
    return /^\(?(\d{3})\)?[\- ]?\d{3}[\- ]?\d{4}$/.test(val);
  },

  // matches mm/dd/yyyy (requires leading 0's (which may be a bit silly, what do you think?)
  date: function (val) {
    return /^(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12][0-9]|3[01])\/(?:\d{4})/.test(val);
  },

  email: function (val) {
    //return /^(?:\w+\.?\+?)*\w+@(?:\w+\.)+\w+$/.test(val);
    var re;
    re = new RegExp('\\.coza$', 'i');
    if (re.test(val)) { return false; }
    re = new RegExp('^([\\w-]+(?:\\.[\\w-]+)*)@((?:[\\w-]+\\.)*\\w[\\w-]{0,66})\\.([a-z]{2,6}(?:\\.[a-z]{2})?)$', 'i');
    return re.test(val);
  },

  minLength: function (val, length) {
    return val.length >= length;
  },

  maxLength: function (val, length) {
    return val.length <= length;
  },

  length: function (val, length) {
    return val.length === length;
  },

  equal: function (val1, val2) {
    return (val1 == val2);
  },

  birthyear: function (val) {
    if (val.length !== 4) { return false; }
    var maxYear = moment().format('YYYY'), minYear = maxYear - 120;
    return (val >= minYear && val <= maxYear);
  },

  month: function (val) {
    if (val.length > 2) { return false; }
    return (val >= 1 && val <= 12);
  },

  day: function (val) {
    if (val.length > 2) { return false; }
    return (val >= 1 && val <= 31);
  },

  birthday: function (val) {
    var happyField = this, result = 1;
    //console.log('testBirthday(), happyField:', happyField);
    $.each(happyField.inputs, function (i, happyInput) {
      //console.log('testBirthday(), happyInput:', happyInput, ', type:', happyInput.type);
      switch (happyInput.type) {
      case 'date-birthyear': if ( ! Happy2Ext.birthyear(happyInput.$elm.val())) { result = -1; return false; } break;
      case 'date-month': if ( ! Happy2Ext.month(happyInput.$elm.val())) { result = -2; return false; } break;
      case 'date-day': if ( ! Happy2Ext.day(happyInput.$elm.val())) { result = -3; return false; } break;
      }
    });
    if (result === 1) {
      result = moment(val.replace(',', '-'), 'YYYY-MM-DD').isValid();
    }
    return result;
  },

  upperCaseFirst: function (val) {
    return val.charAt(0).toUpperCase() + val.slice(1);
  },

  cleanAlpha: function (val) {
    if (val && val.length) { return val.replace(/[^A-Za-z \-.]/g, '').trim(); }
  },

  cleanText: function (val) {
    if (val && val.length) { return val.replace(/[^A-Za-z0-9 '-]/g, '').trim(); }
  },

  cleanName: function (val) {
    if (val && val.length) { return val.replace(/[?$<>=@#!%\\]+/g, ''); }
  },

  cleanFirstName: function (val) {
    if (val && val.length) {
      val = Happy2Ext.cleanName(val);
      val = Happy2Ext.upperCaseFirst(val);
    }
    return val;
  },

  cleanNaturalNumber: function (val) {
    if (val && val.length) { return val.replace(/[^0-9]/g, ''); }
  },

  find: function ($elm, type, id) { var i, jqData = $elm.data(); //console.log('jQData:', jqData);
    for (i in jqData) { if (jqData.hasOwnProperty(i) && (jqData[i].happyType === type) && (!id || jqData[i].id === id)) { return jqData[i]; } }
  }

};
