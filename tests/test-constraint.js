var utils = require('./test-utils.js', undefined);
var Ammo = require('../lib/ammo.js', undefined);
var THREE = require('../lib/three.js', undefined);
var factory = require('../factory.js', undefined);
var _ = require('../lib/underscore.js', undefined);

factory.addLibrary(Ammo);
factory.addLibrary(THREE);

var objects = {
  scene: {},
  timeout: {},
  animationFrame: {},
  renderer: {},
  camera: {},
  body: {},
  fixedBody: {}
};

var trans = new Ammo.btTransform();
var origin = new THREE.Vector3();
var distance = 15;
var test = {
};

function clearObjects() {
  if (utils.isRunningOnBrowser())
    _.each(objects.animationFrame, function (frame) {
      cancelAnimationFrame(frame);
    });
  _.each(objects.timeout, function (timeout) {
    clearTimeout(timeout);
  });
  _.each(objects.scene, function (scene, title) {
    if (!scene) return;
    while (scene.three.children.length) {
      var child = scene.three.children[0];
      child.geometry.dispose();
      child.material.dispose();
      scene.three.remove(child);
    }
    delete scene.three;
    Ammo.destroy(scene.btDefaultCollisionConfiguration);
    Ammo.destroy(scene.btCollisionDispatcher);
    Ammo.destroy(scene.btDbvtBroadphase);
    Ammo.destroy(scene.btSequentialImpulseConstraintSolver);
    delete scene.ammo;
  });
  _.each(['body', 'fixedBody', 'camera', 'renderer', 'scene'], function (objType) {
    _.each(objects[objType], function (obj, title) {
      objects[objType][title] = undefined;
    });
  });
  $("[renderer]").remove();
  //TODO destroy ammo objects in scene.ammo ?
}
function makeTest(bodyA, bodyB, connectorA, connectorB, type, constraint) {
  return function () {
    var scene = factory.make('scene', 'basic', {});
    var body = factory.make(bodyB);
    var fixedBody = factory.make(bodyA);
    factory.make(connectorA);
    factory.make(connectorB);
    var camera = factory.make('camera', 'perspective', {});
    var renderer = factory.make('renderer', 'webgl', {});
    scene.ammo.addRigidBody(body.ammo);
    scene.three.add(body.three);
    scene.ammo.addRigidBody(fixedBody.ammo);
    scene.three.add(fixedBody.three);
    scene.three.add(new THREE.AxisHelper(5));

    var constraintObject = factory.make('constraint', type, constraint);
    scene.ammo.addConstraint(constraintObject.ammo);
    //console.log(constraintObject);
    $(renderer.three.domElement).attr('renderer', type);
    $('#container').append(renderer.three.domElement);
    objects.scene[type] = scene;
    objects.body[type] = body;
    objects.fixedBody[type] = fixedBody;
    objects.camera[type] = camera;
    objects.renderer[type] = renderer;
    var frequency = 30;
    var render = function () {
      var scene = objects.scene[type];
      var body = objects.body[type];
      var camera = objects.camera[type];
      var renderer = objects.renderer[type];
      objects.timeout[type] = setTimeout(function () {
        objects.animationFrame[type] = requestAnimationFrame(render);
      }, 1000 / frequency);
      //timeStep < maxSubSteps * fixedTimeStep
      // 1/30 < 10 * 1/60
      scene.ammo.stepSimulation(1 / frequency, 10);
      transferPhysics(body, trans);
      transferPhysics(fixedBody, trans);
      moveCamera(camera, distance);
      renderer.three.render(scene.three, camera.three);
    };
    render();
  };
}

function moveCamera(camera, distance) {
  var phase = 0; //Math.PI * Math.random();
  var time = new Date().getTime();
  camera.three.position.x = distance * Math.sin(phase + time / 2234);
  camera.three.position.z = distance * Math.cos(phase + time / 2234);
  camera.three.position.y = -1 + 2 * Math.cos(phase + time / 3345);
  camera.three.lookAt(origin);
}


function transferPhysics(body, trans) {
  if (!trans) {
    trans = new Ammo.btTransform();
  }
  body.ammo.getMotionState().getWorldTransform(trans);
  var pos = trans.getOrigin();
  body.three.position.x = pos.x();
  body.three.position.y = pos.y();
  body.three.position.z = pos.z();
  var q = trans.getRotation();
  var quat = new THREE.Quaternion(q.x(), q.y(), q.z(), q.w());
  body.three.quaternion.copy(quat);
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
    mass: 0
  };
  var bodyB = {
    id: 'b',
    group: 'body',
    type: 'basic',
    shape: { type: 'box', dx: 2, dy: 2, dz: 2, segments: 16 },
    position: { x: -2, y: -2, z: -2},
    rotation: { x: 0, y: 0, z: 0 },
    material: {type: 'basic', wireframe: true, color: 0x991122},
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
    base: {x: 1, y: 1, z: 1},
    up: {y: 1},
    front: {x: 1}
  };
  var constraintOptions = {
    a: connectorA.id,
    b: connectorB.id
    //bodyA: bodyA.id,
    //bodyB: bodyB.id
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
test.all = utils.all(test, 1);
module.exports.test = test;
module.exports.clearObjects = clearObjects;