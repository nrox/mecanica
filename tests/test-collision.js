var utils = require('./test.js');
var Ammo = require('../lib/ammo.js');
var THREE = require('../lib/three.js');
var factory = require('../factory.js');
var director = require('../director.js');
var _ = require('../lib/underscore.js');

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
  _.each(objects.scene, function (scene) {
    factory.destroy(scene);
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
    var body = factory.make('body', 'basic', bodyOptions);
    body.three.add(new THREE.AxisHelper(2));
    var floor = factory.make('body', 'basic', floorOptions);
    floor.three.add(new THREE.AxisHelper(5));

    var camera = factory.make('camera', 'tracker', {
      inertia: 0.5, body: body.id
    });
    var renderer = factory.make('renderer', 'webgl', {});
    scene.ammo.addRigidBody(body.ammo);
    scene.three.add(body.three);
    scene.ammo.addRigidBody(floor.ammo);
    scene.three.add(floor.three);
    $(renderer.three.domElement).attr('renderer', title);
    $('#container').append(renderer.three.domElement);
    objects.scene[title] = scene;
    objects.body[title] = body;
    objects.floor[title] = floor;
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
      director.moveCamera(camera);
      renderer.three.render(scene.three, camera.three);

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
    position: { x: 0.2, y: 5, z: 0.5 },
    rotation: { x: undefined, y: undefined, z: 0 },
    material: {type: 'basic', wireframe: true, color: 0x991122},
    mass: 0.1
  };
  var floor = {
    shape: {
      type: undefined,
      dx: 10, dz: 5, dy: 2, r: 9,
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
test.all = utils.all(test, 1);
module.exports.test = test;
module.exports.clearObjects = clearObjects;