/**
 * Test mesh rendering
 */

var utils = require('./test-utils.js');
var ammo = require('../lib/ammo.js');
var three = require('../lib/three.js');
var factory = require('../factory.js');
var _ = require('../lib/underscore.js');
var scene, currentMesh;

factory.addLibrary(three);
factory.addLibrary(ammo);


function transferPhysics(body) {
  var trans = new ammo.btTransform();
  body.ammo.getMotionState().getWorldTransform(trans);
  var pos = trans.getOrigin();
  body.three.position.x = pos.x();
  body.three.position.y = pos.y();
  body.three.position.z = pos.z();
  var q = trans.getRotation();
  var quat = new three.Quaternion(q.x(), q.y(), q.z(), q.w());
  body.three.quaternion.copy(quat);
}

function bodyBasic(type) {
  return function () {
    var parameters = {
      mass: 0.2,
      shape: {
        type: type,
        dx: Math.random() + 1,
        dy: Math.random() + 1,
        dz: Math.random() + 1,
        r: Math.random() + 1,
        segments: ~~(Math.random() * 18 + 18)
      },
      material: {
        type: 'basic',
        color: utils.randomColor(),
        wireframe: true
      },
      position: {
        x: 0,
        y: 0,
        z: 0
      }
    };
    var body = factory.make('body', 'basic', parameters);
    if (!scene) scene = makeScene();
    transferPhysics(body);
    currentMesh = replaceMesh(currentMesh, body.three);
    console.log(type, ':');
    console.log(JSON.stringify(parameters, '  '));
  };
}

var test = {
};

_.each(factory.structure().shape, function (cons, type) {
  test[type] = bodyBasic(type);
});

function makeScene() {
  var scene = new three.Scene();
  scene.add(new three.AxisHelper(5));

  var camera = new three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  var renderer = new three.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  $('#container').append(renderer.domElement);

  camera.position.copy(new three.Vector3(3, 3, 3));
  camera.lookAt(new three.Vector3(3, 3, 3));
  var phase = Math.PI * Math.random();
  var origin = new three.Vector3();
  var render = function () {
    //limit animation frame
    setTimeout(function () {
      requestAnimationFrame(render);
    }, 50);

    //rotate the mesh
    if (currentMesh) {
      var time = new Date().getTime();
      var distance = 10;
      camera.position.x = distance * Math.sin(phase + time / 2234);
      camera.position.z = distance * Math.cos(phase + time / 2234);
      camera.position.y = distance * Math.cos(phase + time / 3345);
      camera.lookAt(origin);
    }

    renderer.render(scene, camera);
  };

  render();

  return scene;
}

function replaceMesh(currentMesh, newMesh) {
  if (currentMesh) scene.remove(currentMesh);
  scene.add(newMesh);
  return newMesh;
}

//test.all = utils.all(test, 3500, true);
module.exports.test = test;
utils.run(test, process.argv, __filename);

