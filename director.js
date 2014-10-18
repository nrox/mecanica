/**
 * director.js rules the simulation and renders the world/environment
 * it can build worlds defined in /ware/ folder.
 * see ware/basic.js example
 *
 * @type {exports}
 */

var factory = require('factory.js');
var Ammo = require('lib/ammo.js');
var THREE = require('lib/three.js');
factory.addLibrary(Ammo);
factory.addLibrary(THREE);
//factory.setDebug(true);

var trans = new Ammo.btTransform();
var origin = new THREE.Vector3();
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

  _.each(factory.objects.constraint, function (cons) {
    scene.ammo.addConstraint(cons.ammo);
  });

  var render = function () {
    setTimeout(function () {
      requestAnimationFrame(render);
    }, 1000 / frequency);
    scene.ammo.stepSimulation(1 / frequency, 10);
    _.each(factory.objects.body, function (body) {
      transferPhysics(body, trans);
    });
    moveCamera(camera);
    renderer.three.render(scene.three, camera.three);

  };
  render();
}

var l1 = 0;
function moveCamera(camera) {

  if (camera.type == 'tracker') {
    /* equation:
     *camera.three.position in line with camera.position
     * next camera.three.position? == camera.position * (a?)
     *camera.three.position at a distance of distance from body.three.position
     * |next camera.three.position? - body.three.position| == distance
     *so close as possible with previous camera.three.position
     * next camera.three.position so that
     * |next camera.three.position - camera.three.position| in minimum
     * solution:
     * the original position line is (tx0, ty0, tz0)
     * the distance to body from any point is d^2=(tx0-xb)^2 + (ty0-yb)^2 + (tz0-zb)^2
     * for the shortest distance between the line and body (d^2)/dt = 0
     * tx0^2-tx0*xb+tx0*xb + ... = 0
     *
     */
    var cameraPosition = camera.three.position.clone();
    var bodyPosition = camera.body.three.position;
    var axis = camera.axis.three;
    var requiredDistance = camera.distance;
    var projection = bodyPosition.clone().projectOnVector(axis);
    var distance = projection.distanceTo(bodyPosition);
    var normal = bodyPosition.clone().sub(projection);
    var extension;
    if (distance == 0) {
      cameraPosition.copy(axis.clone().multiplyScalar(requiredDistance));
    } else if (distance == requiredDistance) {
      cameraPosition.copy(projection);
    } else if (distance > requiredDistance) {
      extension = distance - requiredDistance;
      normal.normalize().multiplyScalar(extension);
      cameraPosition.copy(normal.add(projection));
    } else {
      extension = Math.sqrt(Math.pow(requiredDistance, 2) - Math.pow(normal.length(), 2));
      cameraPosition.copy(projection.add(axis.clone().multiplyScalar(extension)));
    }
    if (l1++ < 3) {
      console.log(distance, extension);
      console.log(camera.three.position);
    }
    camera.three.lookAt(camera.body.three.position);
  } else {
    var phase = 0; //Math.PI * Math.random();
    var time = new Date().getTime();
    var distance = 10;
    camera.three.position.x = distance * Math.sin(phase + time / 12234);
    camera.three.position.z = distance * Math.cos(phase + time / 12234);
    camera.three.position.y = -1 + 2 * Math.cos(phase + time / 13345);
    camera.three.lookAt(origin);

  }
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