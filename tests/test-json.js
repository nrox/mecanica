var testUtils = require('../util/test.js');
var utils = require('../util/utils.js');
var $ = require('../lib/jquery.js');
var _ = require('../lib/underscore.js');
var editor = require('../util/json-editor.js');

function clearObjects() {
  $('#container').empty();
}

var test = {
  'all types': function () {
    var template = {
      range: {type: 'range', min: '-5', max: '10', step: '2'},
      string: {type: 'string', width: '100px', input: 'text'},
      alert: {type: 'function', caption: 'alert hello!'},
      boolean1: {type: 'boolean', t: true, f: false},
      boolean2: {type: 'boolean', t: 'on', f: 'off'},
      boolean3: {type: 'boolean', t: 'yes', f: 'no'}
    };
    var obj = {
      range: 2,
      string: 'hello',
      alert: function () {
        alert('hello!')
      },
      boolean1: true,
      boolean2: 'off',
      boolean3: 'yes'
    };
    editor.useTemplate(template);
    editor.setValues(obj);
    editor.showEditor('#container');
  },
  'nested': function () {
    console.warn('TODO')
  },
  'factory settings': function () {
    var f = require('factory.js');
    editor.setValues(f.options(f.makeSome('settings')));
    editor.showEditor('#container');
  }
};

module.exports.test = test;
module.exports.clearObjects = clearObjects;
testUtils.run(test, process.argv, __filename);
