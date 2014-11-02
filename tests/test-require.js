var utils = require('./test-utils.js');
var _ = require('../lib/underscore.js');

var test = {
  console: function () {
    setConsole('.console');
    console.log('example of console.log');
    console.error('example of console.error');
    console.warn('example of console.warn');
    console.info('example of console.info');
  }
};

var verify = {
  'three.js': ['BoxGeometry', 'Vector3', 'Mesh'],
  'ammo.js': ['btVector3'],
  'underscore.js': ['each', 'map', 'pick', 'pluck'],
  'jquery.js': ['ajax', 'css', 'attr', 'text', 'parseJSON', 'parseXML'],
  'test-utils.js': ['run', 'all'],
  'factory.js': ['addLibrary', 'make', 'structure', 'options'],
  'utils.js': ['stringify', 'deepCopy'],
  '/ware/basic.js': ['shape', 'scene']
};

_.each(verify, function (list, script) {
  test[script] = function () {
    var obj = require(script);
    utils.checkKeys(obj, list, 'check keys in ' + script);
  };
});

test.all = utils.all(test);
module.exports.test = test;
utils.run(test, process.argv, __filename);

