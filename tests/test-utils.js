var _ = require('../dist/lib/underscore.js');


module.exports = {

  logTitle: function (title) {
    title && console.log('\n' + title);
  },
  logStatus: function (status, title) {
    if (!title) return;
    if (!status) {
      console.error(title + ' - test result: FAILED');
    }
  },
  /**
   * log all keys and value types defined in obj
   * @param obj the object
   * @param title log text
   */
  logKeys: function (obj, title) {
    this.logTitle(title);
    var count = 0;
    _.each(obj, function (v, i) {
      count++;
      console.log('  ' + i + ' : ' + typeof v);
    });
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
    this.logTitle(title);
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
    this.logStatus(res, title);
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
    this.logTitle(title);
    var results = _.map(keyValue, function (value, property) {
      if ((typeof obj[property] == 'function')) {
        var objValue = obj[property]();
        if (objValue !== value) {
          title && console.log('  mismatch: ' + property + '()');
          title && console.log('      want: ' + value);
          title && console.log('       got: ' + objValue);
          return false;
        } else {
          title && console.log('        ok: ' + property + '() === ' + value);
          return true;
        }
      } else if (obj[property] !== value) {
        title && console.log('  mismatch: ' + property);
        title && console.log('      want: ' + value);
        title && console.log('       got: ' + obj[property]);
        return false;
      } else {
        title && console.log('        ok: ' + property + ' === ' + value);
        return true;
      }
    });
    var res = _.every(results);
    this.logStatus(res, title);
    return res;
  },

  /**
   * Check if object obj values intersects with values in keyValue object
   * @param obj the object to check
   * @param keyValue the reference object
   * @param title log text
   * @returns {boolean} true if all values match, false otherwise
   */
  checkAproximateValues: function (obj, keyValue, title) {
    this.logTitle(title);
    var results = _.map(keyValue, function (value, property) {
      var objValue;
      if ((typeof obj[property] == 'function')) {
        objValue = obj[property]();
      } else {
        objValue = obj[property];
      }
      if (Math.abs(objValue - value) > 0.000001) {
        title && console.log('  mismatch: ' + property);
        title && console.log('      want: ' + value);
        title && console.log('       got: ' + objValue);
        return false;
      } else {
        title && console.log('        ok: ' + property + ' =~ ' + value);
        return true;
      }
    });
    var res = _.every(results);
    this.logStatus(res, title);
    return res;
  },

  /**
   * if object is instance of function
   * @param obj the object
   * @param fun the function
   * @param title title to log
   * @returns {boolean}
   */
  instanceOf: function (obj, fun, title) {
    this.logTitle(title);
    var res = obj instanceof  fun;
    this.logStatus(res, title);
    return res;
  },

  /**
   *  run all tests in object
   * @param obj the object
   * @param timeout if > 0 tests are called with this interval
   * @param repeat to continuously repeat all tests
   * @returns {Function}
   */
  all: function (obj, timeout, repeat) {
    function run() {
      var keys = _.without(_.keys(obj), 'all');
      if (timeout && repeat) {
        setTimeout(run, keys.length * timeout);
      }
      for (var i = 0; i < keys.length; i++) {
        if (timeout) {
          setTimeout(obj[keys[i]], timeout * i);
        } else {
          console.info(keys[i]);
          obj[keys[i]]();
        }
      }
    }

    return run;
  },

  /**
   * Run each property of tests.
   * @param tests the object whose properties are tests functions without arguments
   * @param argv the node command line arguments. set argv[2] to name the property/test to perform
   * @param filename the name of the test file
   */
  run: function (tests, argv, filename) {
    var item = argv[2];
    if (item && tests[item]) {
      tests[item]();
    } else if (!this.isRunningOnBrowser()) {
      var file = basename(filename);
      console.info('to run tests in ' + file + ' use one of these commands:');
      _.each(tests, function (value, key) {
        console.log('node ' + file + ' ' + key);
      });
    }
  },

  randomColor: function () {
    var color = 0;
    for (var i = 0; i < 3; i++) {
      color = ( color << 8) | ~~(0xff * Math.random());
    }
    return color;
  },

  /**
   * return a copy of an object, using JSON.stringify and JSON.parse
   * @param json a json object
   * @returns {json}
   */
  deepCopy: function (json) {
    return JSON.parse(JSON.stringify(json));
  },

  isRunningOnBrowser: function () {
    return !!(typeof window !== 'undefined' && window.document);
  }
};

function basename(path) {
  return path.substr(path.lastIndexOf('/') + 1);
}

