var utils = require('../util/test.js');
var Ammo = require('../lib/ammo.js');
var THREE = require('../lib/three.js');
var factory = require('../factory.js');
var _ = require('../lib/underscore.js');
var $ = require('../lib/jquery.js');
var test = {
};

function clearObjects() {
  factory.stopSimulation();
  factory.stopRender();
  factory.destroyAll();
  $('[monitor]').remove();
}

function makeTest(bodyA, bodyB, connectorA, connectorB, type, constraint) {
  return function () {
    factory.make(bodyB);
    factory.make(bodyA);
    factory.make(connectorA);
    factory.make(connectorB);
    factory.make('constraint', type, constraint);
    factory.make('monitor', {camera: 'satellite', lookAt: bodyA.id, distance: 15});
    var pack = factory.pack();
    factory.destroyAll();
    factory.loadScene(pack,{
      webWorker: true,
      autoStart: true,
      canvasContainer: '#container'
    }, $);
  };
}

function addAllTests() {
  var bodyA = {
    id: 'a',
    group: 'body',
    type: 'basic',
    shape: { type: 'box', dx: 2, dz: 2, dy: 2, segments: 16 },
    position: {  x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    material: {type: 'basic', wireframe: true, color: 0x338855},
    mass: 0,
    axisHelper: 4
  };
  var bodyB = {
    id: 'b',
    group: 'body',
    type: 'basic',
    shape: { type: 'box', dx: 2, dy: 2, dz: 2, segments: 16 },
    position: { x: -2, y: -2, z: -2},
    rotation: { x: 0, y: 0, z: 0 },
    material: {type: 'basic', wireframe: true, color: 0x991122},
    mass: 1,
    axisHelper: 3
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
    base: {x: 1, y: 1, z: 1},
    up: {y: 1},
    front: {x: 1}
  };
  var constraintOptions = {
    a: connectorA.id,
    b: connectorB.id,
    bodyA: bodyA.id,
    bodyB: bodyB.id
  };
  var type;
  var ca, cb;
  //point constraint
  type = 'point';
  test[type] = makeTest(bodyA, bodyB, connectorA, connectorB, type, constraintOptions);
  //hinge constraint
  type = 'hinge';
  ca = utils.deepCopy(connectorA);
  cb = utils.deepCopy(connectorB);
  ca.base = {x: -1, y: -1, z: 0};
  ca.up = {z: 1};
  cb.base = {x: 1, y: 1, z: 0};
  cb.up = {z: 1};
  test[type] = makeTest(bodyA, bodyB, ca, cb, type, constraintOptions);

  //slider constraint
  type = 'slider';
  ca = utils.deepCopy(connectorA);
  cb = utils.deepCopy(connectorB);
  ca.base = {x: -1, y: -1, z: 0};
  ca.up = {z: 1};
  ca.front = {y: 1};
  cb.base = {x: 1, y: 1, z: 0};
  cb.up = {z: 1};
  cb.front = {y: 1};
  var bodyACopy = utils.deepCopy(bodyA);
  bodyACopy.rotation.z = 0.04;
  test[type] = makeTest(bodyACopy, bodyB, ca, cb, type, constraintOptions);

}

addAllTests();
//test.all = utils.all(test, 1);
module.exports.test = test;
module.exports.clearObjects = clearObjects;