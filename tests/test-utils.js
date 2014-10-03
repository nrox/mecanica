var _ = require('../lib/underscore.js');

module.exports = {

  /**
   * log all keys and value types defined in obj
   * @param obj the object
   * @param title log text
   */
  logKeys: function (obj, title) {
    title && console.log(title);
    for (var i in obj) {
      console.log('  ' + i + ' : ' + typeof obj[i]);
    }
  },

  /**
   * check if obj contains all properties in list keys
   * @param obj the object to check
   * @param keys an array of property names
   * @param title log text
   * @returns {boolean} true if all keys present, false otherwise
   */
  checkKeys: function (obj, keys, title) {
    title && console.log(title);
    var results = _.map(keys, function (property) {
      if (obj[property]===undefined) {
        title && console.log('  undefined: ' + property);
        return false;
      } else {
        return true;
      }
    });
    return _.every(results);
  },

  /**
   * Check if object obj values intersects with values in keyValue object
   * @param obj the object to check
   * @param keyValue the reference object
   * @param title log text
   * @returns {boolean} true if all values match, false otherwise
   */
  checkValues: function (obj, keyValue, title) {
    title && console.log(title);
    var results = _.map(keyValue, function (value, property) {
      if (obj[property]===undefined) {
        title && console.log('  undefined: ' + property);
        return false;
      } else if ((typeof obj[property] == 'function')) {
        var objValue = obj[property]();
        if (objValue !== value) {
          title && console.log('  mismatch: ' + property + '()');
          title && console.log('      want: ' + value);
          title && console.log('       got: ' + objValue);
          return false;
        } else {
          return true;
        }
      } else if (obj[property]!==value){
        title && console.log('  mismatch: ' + property + '()');
        title && console.log('      want: ' + value);
        title && console.log('       got: ' + obj[property]);
        return false;
      } else {
        return true;
      }
    });
    return _.every(results);
  }
};

