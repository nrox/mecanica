var utils = require('./test-utils.js', undefined);
var Ammo = require('../lib/ammo.js', undefined);
var THREE = require('../lib/three.js', undefined);
var factory = require('../factory.js', undefined);
var _ = require('../lib/underscore.js', undefined);

factory.setDebug(true);
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
var distance = 20;
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
function makeTest(bodyOptions, fixedBodyOptions, constraintType, constraintOptions) {
  return function () {
    var scene = factory.make('scene', 'basic', {});
    var body = factory.make('body', 'basic', bodyOptions);
    var fixedBody = factory.make('body', 'basic', fixedBodyOptions);

    var camera = factory.make('camera', 'perspective', {});
    var renderer = factory.make('renderer', 'webgl', {});
    scene.ammo.addRigidBody(body.ammo);
    scene.three.add(body.three);
    scene.ammo.addRigidBody(fixedBody.ammo);
    scene.three.add(fixedBody.three);
    scene.three.add(new THREE.AxisHelper(5));

    var constraint = factory.make('constraint', constraintType, constraintOptions);
    scene.ammo.addConstraint(constraint.ammo);

    $(renderer.three.domElement).attr('renderer', constraintType);
    $('#container').append(renderer.three.domElement);
    var phase = 0; //Math.PI * Math.random();
    objects.scene[constraintType] = scene;
    objects.body[constraintType] = body;
    objects.fixedBody[constraintType] = fixedBody;
    objects.camera[constraintType] = camera;
    objects.renderer[constraintType] = renderer;
    var frequency = 30;
    var render = function () {
      var scene = objects.scene[constraintType];
      var body = objects.body[constraintType];
      var camera = objects.camera[constraintType];
      var renderer = objects.renderer[constraintType];

      //limit animation frame
      objects.timeout[constraintType] = setTimeout(function () {
        objects.animationFrame[constraintType] = requestAnimationFrame(render);
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

function moveCamera(camera, distance){
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
  var body = {
    id: 'b',
    shape: {
      type: 'box',
      dx: 1, dy: 1.2, dz: 1.4,
      segments: 8
    },
    position: { x: -1, y: -1, z: -1 },
    rotation: { x: 0, y: 0, z: 0 },
    material: {type: 'basic', wireframe: true, color: 0x991122},
    mass: 1
  };
  var fixedBody = {
    id: 'a',
    shape: {
      type: 'box',
      dx: 2, dz: 1.5, dy: 2.2,
      segments: 2
    },
    position: {  x: 2,  y: 2,   z: 2 },
    material: {type: 'basic', wireframe: true, color: 0x338855},
    mass: 0
  };
  var constraint = {
      point: {
        a: 'a', b:'b',
        posA: { y: -2},
        posB: {x: 0.5, z: -1}
      }
  };
  _.each(constraint, function (options, type) {
      test[type] = makeTest(body, fixedBody, type, options);
  });
}

addAllTests();
test.all = utils.all(test,1);
module.exports.test = test;
module.exports.clearObjects = clearObjects;