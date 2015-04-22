var testUtils = require('./test-utils.js');
var utils = require('../dist/utils.js');
var _ = require('../dist/lib/underscore.js');

var test = {
  console: function () {
    if (utils.isBrowserWindow()) {
      setConsole('.console');
    }
    console.log('example of console.log');
    console.error('example of console.error');
    console.warn('example of console.warn');
    console.info('example of console.info');
  }
};

var verify = {
  '../dist/lib/three.js': ['BoxGeometry', 'Vector3', 'Mesh'],
  '../dist/lib/ammo.js': ['btVector3'],
  '../dist/lib/underscore.js': ['each', 'map', 'pick', 'pluck'],
  '../dist/lib/jquery.js': ['ajax', 'css', 'attr', 'text', 'parseJSON', 'parseXML'],
  '../tests/test-utils.js': ['run', 'all'],
  '../dist/mecanica.js': ['UserInterface', 'Mecanica', 'System', 'Shape'],
  '../dist/utils.js': ['stringify', 'deepCopy', 'randomLinear'],
  '../dist/ware/experiment/basic2.js': ['getObject']
};

_.each(verify, function (list, script) {
  test[script] = function () {
    var obj = require(script);
    testUtils.checkKeys(obj, list, 'check keys in ' + script);
  };
});

test.all = testUtils.all(test);
module.exports.test = test;
testUtils.run(test, process.argv, __filename);

