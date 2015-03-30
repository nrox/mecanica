var testUtils = require('../util/test.js');
var ammo = require('../lib/ammo.js');
var three = require('../lib/three.js');
var _ = require('../lib/underscore.js');

function clearObjects() {

}

var test = {
  Component: function () {
    var mecanica = require('../mecanica.js');
    var obj = new mecanica.Component();
    testUtils.checkKeys(obj, [
      'include', 'options','maker','nextId',
      'hasUndefined','notifyUndefined','runsPhysics','runsWebGL'
    ], 'Component methods');
  },
  Mecanica: function () {
    var mecanica = require('../mecanica.js');
    var world = new mecanica.Mecanica({worker: false});
    testUtils.checkValues(world.options(), {
      worker: false, server: false, render: true
    }, 'Mecanica instance options');
    testUtils.checkKeys(world, [
      'destroy', 'include', 'options'
    ], 'Mecanica instance methods');
    testUtils.checkKeys(world, [
      'worker', 'server', 'render'
    ], 'Mecanica instance assigned options');
  },
  Vector: function () {
    var mecanica = require('../mecanica.js');
    var vector = new mecanica.Vector({x: 1});
    testUtils.checkValues(vector.options(), {
      x: 1, y: 0, z: 0
    }, 'Vector instance default options');
    testUtils.checkKeys(vector, [
      'include', 'options', 'ammo', 'three'
    ], 'Vector instance methods');
    testUtils.checkKeys(vector, [
      'x', 'y', 'z'
    ], 'Vector instance assigned options');
  },
  Quaternion: function () {
    var mecanica = require('../mecanica.js');
    var quaternion = new mecanica.Quaternion({x: 1, w: 0.2});
    testUtils.checkValues(quaternion.options(), {
      x: 1, y: 0, z: 0, w: 0.2
    }, 'Quaternion instance default options');
    testUtils.checkKeys(quaternion, [
      'include', 'options', 'ammo', 'three'
    ], 'Quaternion instance methods');
    testUtils.checkKeys(quaternion, [
      'x', 'y', 'z', 'w'
    ], 'Quaternion instance assigned options');
  },
  Settings: function () {
    var mecanica = require('../mecanica.js');
    var obj = new mecanica.Settings({webWorker: true, renderFrequency: 15});
    testUtils.checkValues(obj.options(), {
      webWorker: true, renderFrequency: 15
    }, 'Settings instance default options');
    testUtils.checkKeys(obj, [
      'include', 'options'
    ], 'Settings instance methods');
    testUtils.checkKeys(obj, [
      'webWorker', 'axisHelper', 'reuseCanvas', 'connectorHelper', 'simSpeed'
    ], 'Settings instance assigned options');
    testUtils.logKeys(obj, 'Settings instance keys');
  },
  System: function () {
    var mecanica = require('../mecanica.js');
    var obj = new mecanica.System();
    testUtils.checkKeys(obj, [ 'objects' ], 'System has objects property');
    testUtils.checkKeys(obj.objects, ['system','shape','body','constraint'], 'System: objects have their slots defined');
    testUtils.checkKeys(obj, [
      'include', 'options', 'make', 'getObject'
    ], 'System instance methods');
  },
  Shape: function(){
    var mecanica = require('../mecanica.js');
    var generic = {
      type: undefined,
      dx: 1, dy: 1.2, dz: 3, r: 0.5, segments: 12
    };
    generic.type = 'box';
    var obj = new mecanica.Shape(generic);
    testUtils.checkValues(obj.options(), {
      dx: 1, dy: 1.2, dz: 3
    }, 'box shape options');
    testUtils.checkKeys(obj, ['ammo','three'], 'box shape options');
    console.log(obj);
  }
};


test.all = testUtils.all(test);
module.exports.test = test;
module.exports.clearObjects = clearObjects;
