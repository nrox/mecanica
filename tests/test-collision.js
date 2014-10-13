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
  floor: {}
};

var trans = new Ammo.btTransform();
var origin = new THREE.Vector3();
var distance = 10;
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
  _.each(['body', 'floor', 'camera', 'renderer', 'scene'], function (objType) {
    _.each(objects[objType], function (obj, title) {
      objects[objType][title] = undefined;
    });
  });
  $("[renderer]").remove();
  //TODO destroy ammo objects in scene.ammo ?
}
function makeTest(bodyOptions, floorOptions, title) {
  return function () {
    var scene = factory.make('scene', 'basic', {});
    bodyOptions.rotation.x = 2 * Math.PI * Math.random();
    bodyOptions.rotation.y = 2 * Math.PI * Math.random();
    bodyOptions.rotation.z = 0;
    _.each(bodyOptions.position, function (value, key, position) {
      position[key] += 1.6 * Math.random() - 0.8;
    });
    var body = factory.make('body', 'basic', bodyOptions);
    var floor = factory.make('body', 'basic', floorOptions);

    var camera = factory.make('camera', 'perspective', {});
    var renderer = factory.make('renderer', 'webgl', {});
    scene.ammo.addRigidBody(body.ammo);
    scene.three.add(body.three);
    scene.ammo.addRigidBody(floor.ammo);
    scene.three.add(floor.three);
    scene.three.add(new THREE.AxisHelper(5));
    $(renderer.three.domElement).attr('renderer', title);
    $('#container').append(renderer.three.domElement);
    var phase = Math.PI * Math.random();
    objects.scene[title] = scene;
    objects.body[title] = body;
    objects.camera[title] = camera;
    objects.renderer[title] = renderer;
    var frequency = 30;
    var render = function () {
      var scene = objects.scene[title];
      var body = objects.body[title];
      var camera = objects.camera[title];
      var renderer = objects.renderer[title];

      //limit animation frame
      objects.timeout[title] = setTimeout(function () {
        objects.animationFrame[title] = requestAnimationFrame(render);
      }, 1000 / frequency);
      //timeStep < maxSubSteps * fixedTimeStep
      // 1/30 < 10 * 1/60
      scene.ammo.stepSimulation(1 / frequency, 10);
      transferPhysics(body, trans);
      renderer.three.render(scene.three, camera.three);
      var time = new Date().getTime();
      camera.three.position.x = distance * Math.sin(phase + time / 2234);
      camera.three.position.z = distance * Math.cos(phase + time / 2234);
      camera.three.position.y = -1 + 2 * Math.cos(phase + time / 3345);
      camera.three.lookAt(origin);
    };
    render();
  };
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
    shape: {
      type: undefined,
      r: 1, dx: 1, dy: 1.2, dz: 1.4,
      segments: undefined
    },
    position: { x: 0, y: 5, z: 0 },
    rotation: { x: undefined, y: undefined, z: 0 },
    material: {type: 'basic', wireframe: true, color: 0x991122},
    mass: 0.1
  };
  var floor = {
    shape: {
      type: undefined,
      dx: 10, dz: 5, dy: 3, r: 9,
      segments: undefined
    },
    position: {
      x: 0.3,
      y: undefined,
      z: 0.1
    },
    material: {type: 'basic', wireframe: true, color: 0x338855},
    mass: 0
  };
  var bodySegments = {
    box: 4,
    sphere: 16,
    cone: 32,
    cylinder: 32
  };
  var floorSegments = {
    box: 8,
    sphere: 32,
    cone: 64,
    cylinder: 32
  };
  var floorY = {
    box: -5,
    sphere: -10,
    cone: -3,
    cylinder: -5
  };
  var shapes = ['box', 'sphere', 'cone', 'cylinder'];
  _.each(shapes, function (floorType) {
    _.each(shapes, function (bodyType) {
      floor.shape.type = floorType;
      floor.shape.segments = floorSegments[floorType];
      floor.position.y = floorY[floorType];
      body.shape.type = bodyType;
      body.shape.segments = bodySegments[bodyType];
      var title = bodyType + ' on ' + floorType;
      test[title] = makeTest(utils.deepCopy(body), utils.deepCopy(floor), title);
    });
  });
}

addAllTests();
test.all = utils.all(test,1);
module.exports.test = test;
module.exports.clearObjects = clearObjects;