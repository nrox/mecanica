var utils = require('../util/test.js');
var Ammo = require('../lib/ammo.js');
var THREE = require('../lib/three.js');
var factory = require('../factory.js');
var _ = require('../lib/underscore.js');
var $ = require('../lib/jquery.js');
var Editor = require('../util/json-ui.js');

var test = {
};

function clearObjects() {
  factory.destroyAll();
  $('#triggers').empty();
}

function makeTest(bodyA, bodyB, connectorA, connectorB, type, constraint) {
  return function () {
    factory.setScope(type);
    var pack = {};
    pack.scene = {s1: {}};
    pack.body = {};
    pack.body[bodyA.id] = bodyA;
    pack.body[bodyB.id] = bodyB;
    pack.connector = {};
    pack.connector[connectorA.id] = connectorA;
    pack.connector[connectorB.id] = connectorB;
    pack.constraint = {};
    constraint = utils.deepCopy(constraint);
    constraint.type = constraint.id = type;
    pack.constraint[constraint.id] = constraint;
    pack.monitor = {m1: {camera: 'satellite', lookAt: bodyA.id, distance: 15}};
    pack.light = {
      l1: {position: {x: 5, z: -5}},
      l2: {position: {x: -7, y: 6, z: 5}, color: 0x8899bb},
      l3: {position: {y: -5, z: 1}, color: 0x445566}
    };
    factory.loadScene(pack, {
      axisHelper: 0,
      wireframe: false,
      webWorker: false,
      autoStart: true,
      connectorHelper: 0.7,
      canvasContainer: '#container'
    });
    if (inputs[type]) {
      inputs[type](type);
    }
  };
}

var inputs = {
  hinge: function (type) {
    var template = {
      servo: {
        'angle(°)': {type: 'range', min: -180, max: 180, step: 5}
      },
      motor: {
        velocity: {type: 'range', min: -5, max: 5, step: 1},
        binary: {type: 'range', min: 0, max: 50, step: 1}
      }
    };
    var ui = {
      servo: {
        'angle(°)': 0,
        set: function () {
          var c = factory.getObject('constraint', type);
          var angle = this.getValues().servo['angle(°)'];
          angle = angle * Math.PI / 180;
          factory.method.constraint.setAngle.call(c, angle);
        },
        relax: function () {
          var c = factory.getObject('constraint', type);
          factory.method.constraint.relax.call(c);
        }
      },
      motor: {
        velocity: 1,
        binary: 1,
        enable: function () {
          var c = factory.getObject('constraint', type);
          var values = this.getValues().motor;
          factory.method.constraint.enableMotor.call(c, values.velocity, values.binary);
        },
        disable: function () {
          var c = factory.getObject('constraint', type);
          factory.method.constraint.disableMotor.call(c);
        }
      }
    };
    var editor = new Editor();
    editor.useTemplate(template);
    editor.setValues(ui);
    editor.showEditor('#triggers');
  }
};

function addAllTests() {
  var bodyA = {
    id: 'a',
    group: 'body',
    type: 'basic',
    shape: { type: 'box', dx: 2, dz: 2, dy: 2, segments: 2 },
    position: {  x: 0.5, y: 0.5, z: 0.5 },
    rotation: { x: 0.5, y: 0.3, z: 0 },
    material: {type: 'phong', color: 0x338855, opacity: 0.5, transparent: true},
    mass: 0
  };
  var bodyB = {
    id: 'b',
    group: 'body',
    type: 'basic',
    shape: { type: 'box', dx: 2, dy: 2, dz: 2, segments: 2 },
    position: { x: -2, y: -2, z: -2},
    rotation: { x: 0, y: 0, z: 0 },
    material: {type: 'phong', color: 0x991122, opacity: 0.9, transparent: true},
    mass: 1
  };
  var connectorA = {
    id: 'cA',
    group: 'connector',
    type: 'relative',
    body: bodyA.id,
    base: {y: -1.01},
    up: {y: 1},
    front: {x: 1}
  };
  var connectorB = {
    id: 'cB',
    group: 'connector',
    type: 'relative',
    body: bodyB.id,
    base: {x: 1, y: 1, z: 1.01},
    up: {y: 1},
    front: {x: 1}
  };
  var constraintOptions = {
    a: connectorA.id,
    b: connectorB.id,
    bodyA: bodyA.id,
    bodyB: bodyB.id,
    ratio: 1,
    approach: true
  };
  var type;
  var ca, cb;
  //point
  type = 'point';
  test[type] = makeTest(bodyA, bodyB, connectorA, connectorB, type, constraintOptions);

  type = 'hinge';
  ca = utils.deepCopy(connectorA);
  cb = utils.deepCopy(connectorB);
  ca.base = {x: -1, y: -1, z: -1};
  ca.up = {z: 1};
  cb.base = {x: 1, y: 1, z: 1};
  cb.up = {z: 1};
  test[type] = makeTest(bodyA, bodyB, ca, cb, type, constraintOptions);

  type = 'slider';
  ca = utils.deepCopy(connectorA);
  cb = utils.deepCopy(connectorB);
  ca.base = {x: 0, y: 0, z: 0};
  ca.up = {z: 1};
  ca.front = {y: 1};
  cb.base = {x: 0, y: 0, z: 5};
  cb.up = {z: 1};
  cb.front = {y: 1};
  var bodyBCopy = utils.deepCopy(bodyB);
  bodyBCopy.position = {z: -5, x: 4, y: 5};
  test[type] = makeTest(bodyA, bodyBCopy, ca, cb, type, constraintOptions);

  type = 'gear';
  ca = utils.deepCopy(connectorA);
  cb = utils.deepCopy(connectorB);
  ca.base = {x: -1, y: -1, z: 0};
  ca.up = {z: 1};
  cb.base = {x: 1, y: 1, z: 0};
  cb.up = {z: 1};
  test[type] = makeTest(bodyA, bodyB, ca, cb, type, constraintOptions);

}

addAllTests();
//test.all = utils.all(test, 1);
module.exports.test = test;
module.exports.clearObjects = clearObjects;