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
      nested: {
        boolean1: false,
        string2: 'maria'
      },
      boolean3: 'yes'
    };
    editor.useTemplate(template);
    editor.setValues(obj);
    editor.showEditor('#container');
  },
  'factory settings': function () {
    var template = {
      axisHelper: {type: 'range', min: '0', max: '5', step: '0.5'},
      connectorHelper: {type: 'range', min: '0', max: '5', step: '0.5'},
      canvasContainer: 'body', //container for renderer,
      simSpeed:  {type: 'range', min: '0.1', max: '5', step: '0.1'},
      renderFrequency: {type: 'range', min: '0.1', max: '5', step: '0.1'},
      simFrequency: {type: 'range', min: '0.1', max: '5', step: '0.1'},
      shadowMapSize: 1024 //shadow map width and height
    };
    var defaultSettings = {
      wireframe: false, //show wireframes
      axisHelper: 0, //show an axis helper in the scene and all bodies
      connectorHelper: 0,
      canvasContainer: 'body', //container for renderer,
      reuseCanvas: true,
      webWorker: true, //use webworker if available
      autoStart: true, //auto start simulation and rendering
      simSpeed: 1, //simulation speed factor, 1 is normal, 0.5 is half, 2 is double...
      renderFrequency: 30, //frequency to render canvas
      simFrequency: 30, //frequency to run a simulation cycle,
      castShadow: true, //light cast shadows,
      shadowMapSize: 1024 //shadow map width and height
    };
    editor.useTemplate(template);
    editor.setValues(defaultSettings);
    editor.showEditor('#container');
  }
};

module.exports.test = test;
module.exports.clearObjects = clearObjects;
testUtils.run(test, process.argv, __filename);
