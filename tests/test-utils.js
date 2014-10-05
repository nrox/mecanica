var _ = require('../lib/underscore.js');

module.exports = {

  /**
   * log all keys and value types defined in obj
   * @param obj the object
   * @param title log text
   */
  logKeys: function (obj, title) {
    title && console.log('\n' + title);
    var count = 0;
    for (var i in obj) {
      count++;
      console.log('  ' + i + ' : ' + typeof obj[i]);
    }
    title && console.log('  ' + count + ' properties');
  },

  /**
   * check if obj contains all properties in list keys
   * @param obj the object to check
   * @param keys an array of property names
   * @param title log text
   * @returns {boolean} true if all keys present, false otherwise
   */
  checkKeys: function (obj, keys, title) {
    title && console.log('\n' + title);
    var results = _.map(keys, function (property) {
      if (obj[property] === undefined) {
        title && console.log('  undefined: ' + property);
        return false;
      } else {
        title && console.log('         ok: ' + property);
        return true;
      }
    });
    var res = _.every(results);
    console.log('  success: ' + res);
    return res;
  },

  /**
   * Check if object obj values intersects with values in keyValue object
   * @param obj the object to check
   * @param keyValue the reference object
   * @param title log text
   * @returns {boolean} true if all values match, false otherwise
   */
  checkValues: function (obj, keyValue, title) {
    title && console.log('\n' + title);
    var results = _.map(keyValue, function (value, property) {
      if (obj[property] === undefined) {
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
      } else if (obj[property] !== value) {
        title && console.log('  mismatch: ' + property);
        title && console.log('      want: ' + value);
        title && console.log('       got: ' + obj[property]);
        return false;
      } else {
        return true;
      }
    });
    var res = _.every(results);
    console.log('  success: ' + res);
    return res;
  },

  /**
   *  run all tests in object
   * @param obj the object
   * @param timeout if > 0 tests are called with this interval
   * @returns {Function}
   */
  all: function (obj, timeout) {
    return function () {
      console.log('--testing all--');
      var keys = _.without(_.keys(obj), 'all');
      for (var i = 0; i < keys.length; i++) {
        if (timeout) {
          setTimeout(obj[keys[i]], timeout * i);
        } else {
          obj[keys[i]]();
        }
      }
    };
  },

  /**
   * Run each property of tests.
   * @param tests the object whose properties are tests functions without arguments
   * @param argv the node command line arguments. set argv[2] to name the property/test to perform
   * @param filename the name of the test file
   */
  run: function (tests, argv, filename) {
    var item = argv[2];
    if (tests[item]) {
      tests[item]();
    } else {
      var file = basename(filename);
      console.log('to run tests in ' + file + ' use one of these commands:');
      _.each(tests, function (value, key) {
        console.log('node ' + file + ' ' + key);
      });
    }
  }
};

function basename(path) {
  return path.substr(path.lastIndexOf('/') + 1);
}

