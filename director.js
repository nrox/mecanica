var factory = require('factory.js');
var Ammo = require('lib/ammo.js');
var THREE = require('lib/three.js');
factory.addLibrary(Ammo);
factory.addLibrary(THREE);

var trans = new Ammo.btTransform();
var origin = new THREE.Vector3();
var distance = 10;
var frequency = 30;

function show(script) {
  var json = require('/ware/' + script);
  factory.saveObjects = true;
  factory.unpack(json);
  var scene = factory.getSome('scene') || factory.makeSome('scene');
  var camera = factory.getSome('camera') || factory.makeSome('camera');
  var renderer = factory.getSome('renderer') || factory.makeSome('renderer');
  $('#container').append(renderer.three.domElement);

  _.each(factory.objects.body, function (body) {
    scene.three.add(body.three);
    scene.ammo.addRigidBody(body.ammo);
  });

  var render = function () {
    setTimeout(function () {
      requestAnimationFrame(render);
    }, 1000 / frequency);
    scene.ammo.stepSimulation(1 / frequency, 10);
    _.each(factory.objects.body, function(body){
      transferPhysics(body, trans);
    });
    moveCamera(camera, distance);
    renderer.three.render(scene.three, camera.three);

  };
  render();
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

module.exports = {
  show: show
}