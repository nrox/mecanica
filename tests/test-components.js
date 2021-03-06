var testUtils = require('./test-utils.js');
var ammo = require('../dist/lib/ammo.js');
var three = require('../dist/lib/three.js');
var _ = require('../dist/lib/underscore.js');

function clearObjects() {
  $('#container').empty();
}

var test = {
  Component: function () {
    var mecanica = require('../dist/mecanica.js');
    var obj = new mecanica.Component();
    testUtils.checkKeys(obj, [
      'include', 'options', 'maker', 'nextId',
      'hasUndefined', 'notifyUndefined', 'runsPhysics', 'runsRender', 'construct'
    ], 'Component methods');
  },
  Mecanica: function () {
    var mecanica = require('../dist/mecanica.js');
    var world = new mecanica.Mecanica();
    world.load({settings: {use: {simSpeed: 5 }}});
    testUtils.checkValues(world.getSettings(), {
      simSpeed: 5
    }, 'settings options');
    testUtils.checkKeys(world, [
      'import'
    ], 'own methods');
    testUtils.checkKeys(world, [
      'getSettings', 'make'
    ], 'inherited methods from System');
  },
  System: function () {
    var mecanica = require('../dist/mecanica.js');
    var obj = new mecanica.System({}, new mecanica.Mecanica());
    testUtils.checkKeys(obj, [ 'objects' ], 'System has objects property');
    testUtils.checkKeys(obj.objects, ['system', 'shape', 'body', 'constraint'], 'System: objects have their slots defined');
    testUtils.checkKeys(obj, [
      'include', 'options', 'make', 'getObject'
    ], 'System instance methods');
  },
  Vector: function () {
    var mecanica = require('../dist/mecanica.js');
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
    var mecanica = require('../dist/mecanica.js');
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
    var lib = require('../dist/mecanica.js');
    var mecanica = new lib.Mecanica();
    mecanica.load({
      settings: {
        use: {
          webWorker: true,
          renderFrequency: 15,
          lengthUnits: 'cm'
        }
      }
    });
    var obj = mecanica.getSettings();
    testUtils.checkValues(obj.options(), {
      webWorker: true, renderFrequency: 15, type: 'global'
    }, 'Settings instance default options');
    testUtils.checkKeys(obj, [
      'include', 'options'
    ], 'Settings instance methods');
    testUtils.checkKeys(obj, [
      'webWorker', 'axisHelper', 'reuseCanvas', 'connectorHelper', 'simSpeed'
    ], 'Settings instance assigned options');
    obj = mecanica.loadSystem({
      settings: {
        use: {
          lengthUnits: 'm'
        }
      },
      shape: {
        a: {
          type: 'box'
        }
      }
    }, 'child').getSome('settings');
    testUtils.checkValues(obj, {
      lengthUnits: 'm', webWorker: undefined
    }, 'local settings');
    var shape = mecanica.getSystem('child').getObject('shape', 'a');
    var v = new lib.Vector({x: 2, y: 3, z: -1});
    shape.applyLengthConversionRate(v);
    testUtils.checkValues(v, {
      x: 200, y: 300, z: -100
    }, ' apply length conversion rate to vector');
  },
  Shape: function () {
    var mecanica = require('../dist/mecanica.js');
    var generic = {
      type: undefined,
      dx: 1, dy: 1.2, dz: 3, r: 0.5, segments: 12
    };
    generic.type = 'box';
    var obj = new mecanica.Shape(generic, new mecanica.Mecanica());
    testUtils.checkValues(obj.options(), {
      dx: 1, dy: 1.2, dz: 3
    }, 'box shape options');
    testUtils.checkKeys(obj, ['ammo', 'three'], 'box shape options');
  },
  Material: function () {
    var lib = require('../dist/mecanica.js');
    var options = {
      type: 'basic',
      color: 0x223344
    };
    var obj = new lib.Material(options, new lib.Mecanica());
    testUtils.checkValues(obj.options(), {
      color: 0x223344
    }, 'material options');
    testUtils.checkKeys(obj, ['three'], 'material three property');
  },
  Body: function () {
    var mecanica = require('../dist/mecanica.js');
    var options = {
      shape: {type: 'box'},
      material: {color: 0x112233},
      mass: 1
    };
    var obj = new mecanica.Body(options, new mecanica.Mecanica());
    obj.updateMotionState();
    testUtils.checkValues(obj.options(), {
      mass: 1
    }, 'body options');
    testUtils.checkKeys(obj, ['three', 'ammoTransform', 'ammo'], 'body three, ammo properties');
  },
  Connector: function () {
    var mecanica = require('../dist/mecanica.js');
    var system = new mecanica.Mecanica();
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
    testUtils.checkValues(obj.base, {
      x: 1
    }, 'connector options');
    testUtils.checkKeys(obj, ['body', 'base', 'up', 'front'], 'connector properties');
  },
  Constraint: function () {
    var mecanica = require('../dist/mecanica.js');
    var me = new mecanica.Mecanica();
    var system = me.make({group: 'system', type: 'basic', id: 'top'});
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
    testUtils.checkKeys(obj, ['addToScene', 'removeFromScene', 'create'], 'constraint basic methods');
  },
  Method: function () {
    var mecanica = require('../dist/mecanica.js');
    var me = new mecanica.Mecanica();
    var system = me.make({group: 'system', type: 'basic', id: 'top'});
    system.make('method', {
      id: 'fun',
      method: function () {
        return this;
      }
    });
    testUtils.checkValues(me.getSystem('top')['fun'](), {
      id: system.id
    }, 'inside methods, this is the parent system');
  },
  Monitor: function () {
    console.warn('TODO');
  },
  Camera: function () {
    console.warn('TODO');
  },
  Renderer: function () {
    console.warn('TODO');
  },
  Light: function () {
    console.warn('TODO');
  },
  Vector: function () {
    console.warn('TODO');
  },
  Quaternion: function () {
    console.warn('TODO');
  },
  UserInterface: function () {
    var lib = require('../dist/mecanica.js');
    var mec = new lib.Mecanica({settings: {uiContainer: '#container'}});
    var values = {
      string1: "hello",
      boolean1: true,
      function1: function () {
        alert('hello')
      },
      destroy: function () {
        this.destroy();
      },
      folder1: {
        value1: 3,
        subfolder: {
          subfolder: {
            value2: 2
          }
        }
      }
    };
    var ui = new lib.UserInterface({
      values: values,
      container: '#container'
    }, mec);
  }
};

test.all = testUtils.all(test);
module.exports.test = test;
module.exports.clearObjects = clearObjects;
