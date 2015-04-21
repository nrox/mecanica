var _ = require('underscore');
var testUtils = require('./test-utils.js');

var tests = {
  'require ware/template.js': function () {
    var template = require('../dist/ware/template.js');
    testUtils.checkKeys(template, [
      'getObject', 'defaultOptions'
    ], 'require returned valid object');
    var object = template.getObject();
    testUtils.checkKeys(object, [
      'shape', 'material', 'body'
    ], 'generated system with getObject()');
    var options = template.defaultOptions;
    testUtils.checkKeys(options, [
      'mass', 'y'
    ], 'defaultOptions keys');
  },
  'require Ammo': function () {
    var ammo = require('../dist/lib/ammo.js');
    testUtils.checkKeys(ammo, [
      'btBoxShape', 'btCompoundShape', 'btCylinderShape'
    ], 'some ammo constructors');
  },
  'is working on node, not browser': function () {
    var utils = require('../dist/utils.js');
    testUtils.assert(utils.isNode() === true, 'is working on Node.js');
    testUtils.assert(utils.isBrowserWindow() === false, 'is not in a browser');
    testUtils.assert(utils.isBrowserWorker() === false, 'is not in a browser worker');
  },
  'instance of Mecanica': function () {
    var lib = require('../dist/mecanica.js');
    var mecanica = new lib.Mecanica();
    testUtils.checkKeys(mecanica, [
      'import', 'load', 'start'
    ], 'instance of Mecanica has expected keys');
  },
  'import scene, settings': function () {
    var lib = require('../dist/mecanica.js');
    var mecanica = new lib.Mecanica();
    mecanica.import('../dist/ware/settings/simple.js');
    testUtils.checkKeys(mecanica.getSome('settings'), [
      'axisHelper', 'wireframe'
    ], 'imported settings keys');
    mecanica.import('../dist/ware/scene/simple.js', {solver: 'dantzig'});
    testUtils.checkValues(mecanica.getSome('scene'), {
      solver: 'dantzig'
    }, 'custom solver for imported scene');
  },
  'importSystem ware/template.js': function () {
    var lib = require('../dist/mecanica.js');
    var file = '../dist/ware/template.js';
    var mecanica = new lib.Mecanica();
    mecanica.import('../dist/ware/settings/simple.js');
    mecanica.import('../dist/ware/scene/simple.js');
    mecanica.importSystem(file, file, {y: 1});
    testUtils.checkKeys(mecanica.getSystem(file), ['load', 'import', 'getSystem'], ' imported system');
    testUtils.checkKeys(mecanica.getSystem(file).getBody('box'), ['updateMotionState', 'syncPhysics'], 'imported body');
  },
  'start simulation with ware/template.js': function () {
    var lib = require('../dist/mecanica.js');
    var file = '../dist/ware/template.js';
    var mecanica = new lib.Mecanica();
    mecanica.import('../dist/ware/settings/simple.js');
    mecanica.import('../dist/ware/scene/simple.js');
    var system = mecanica.importSystem(file, file, {y: 1});
    var lastPos;
    system.afterStep = function () {
      var x = this.getBody('sphere').position.x;
      testUtils.different(x, lastPos, 'sphere.x: ' + x);
      lastPos = x;
    };
    mecanica.addToScene();
    mecanica.start();
    console.log('will start...');
    setTimeout(function () {
      //console.log('will stop...');
      mecanica.stop();
    }, 200);
  }
};

//tests['start simulation with ware/template.js']();

testUtils.all(tests)();
