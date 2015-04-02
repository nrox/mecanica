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
      'include', 'options', 'maker', 'nextId',
      'hasUndefined', 'notifyUndefined', 'runsPhysics', 'runsWebGL', 'construct'
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
    testUtils.checkKeys(obj.objects, ['system', 'shape', 'body', 'constraint'], 'System: objects have their slots defined');
    testUtils.checkKeys(obj, [
      'include', 'options', 'make', 'getObject', 'getSettings'
    ], 'System instance methods');
  },
  Shape: function () {
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
    testUtils.checkKeys(obj, ['ammo', 'three'], 'box shape options');
  },
  Material: function () {
    var mecanica = require('../mecanica.js');
    var options = {
      type: 'basic',
      color: 0x223344
    };
    var system = new mecanica.System();
    var obj = new mecanica.Material(options, system);
    testUtils.checkValues(obj.options(), {
      color: 0x223344
    }, 'material options');
    testUtils.checkKeys(obj, ['three'], 'material three property');
  },
  Body: function () {
    var mecanica = require('../mecanica.js');
    var options = {
      shape: {type: 'box'},
      material: {color: 0x112233},
      mass: 1
    };
    var system = new mecanica.System();
    var obj = new mecanica.Body(options, system);
    obj.updateMotionState();
    testUtils.checkValues(obj.options(), {
      mass: 1
    }, 'body options');
    testUtils.checkKeys(obj, ['three', 'ammoTransform', 'ammo'], 'body three, ammo properties');
  },
  Connector: function () {
    var mecanica = require('../mecanica.js');
    var system = new mecanica.System();
    var body = new mecanica.Body({
      shape: {type: 'box'},
      material: {color: 0x112233},
      mass: 0
    }, system);
    var options = {
      body: body,
      base: {x: 1},
      up: {y: 1},
      front: {z: 1}
    };
    var obj = new mecanica.Connector(options, system);
    console.log(obj);
    testUtils.checkValues(obj.base, {
      x: 1
    }, 'connector options');
    testUtils.checkKeys(obj, ['body', 'base', 'up', 'front'], 'connector properties');
  },
  Constraint: function () {
    var mecanica = require('../mecanica.js');
    var system = new mecanica.System();
    system.make('body', {
      id: 'a',
      shape: {type: 'box'},
      material: {color: 0x112233},
      mass: 1,
      connector: {
        c: {up: {y: 1}, front: {z: 1}}
      }
    });
    system.make('body', {
      id: 'b',
      shape: {type: 'box'},
      material: {color: 0x112233},
      mass: 1,
      connector: {
        c: {up: {y: 1}, front: {z: 1}}
      }
    });
    var obj = new mecanica.Constraint({
      connectorA: 'c',
      connectorB: 'c',
      bodyA: 'a',
      bodyB: 'b'
    }, system);
    testUtils.checkValues(obj, {
      type: 'point'
    }, 'constraint default type');
    testUtils.checkValues(obj.options(), {
      connectorA: 'c', bodyB: 'b'
    }, 'constraint default type');
    testUtils.checkKeys(obj, ['add', 'remove', 'create'], 'constraint basic methods');
  }
};

test.all = testUtils.all(test);
module.exports.test = test;
module.exports.clearObjects = clearObjects;
