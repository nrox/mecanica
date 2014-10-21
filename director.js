/**
 * director.js rules the simulation and renders the world/environment
 * it can build worlds defined in /ware/ folder.
 * see ware/basic.js example
 *
 * @type {exports}
 */

var utils = require('utils.js');
var factory = require('factory.js');
var Ammo = require('lib/ammo.js');
var THREE = require('lib/three.js');
factory.addLibrary(Ammo);
factory.addLibrary(THREE);
//factory.setDebug(true);

var trans = new Ammo.btTransform();
var origin = new THREE.Vector3();
var frequency = 30;

function show(script, containerSelector) {
  var json = (typeof script == 'object') ? script : require('/ware/' + script);
  factory.saveObjects = true;
  factory.unpack(json);
  var scene = factory.getSome('scene') || factory.makeSome('scene');
  var camera = factory.getSome('camera') || factory.makeSome('camera');
  var renderer = factory.getSome('renderer') || factory.makeSome('renderer');
  $(containerSelector || 'body').append(renderer.three.domElement);

  _.each(factory.objects.body, function (body) {
    scene.three.add(body.three);
    scene.ammo.addRigidBody(body.ammo);
  });

  scene.three.add(new THREE.AxisHelper(5));
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

function moveCamera(camera) {

  var distance;
  if (camera.type == 'tracker') {
    var requiredPosition = camera.three.position.clone();
    var bodyPosition = camera.body.three.position;
    var axis = camera.axis.three;
    var requiredDistance = camera.distance;
    var projection = bodyPosition.clone().projectOnVector(axis);
    distance = projection.distanceTo(bodyPosition);
    var normal = bodyPosition.clone().sub(projection);
    var extension;
    if (distance == 0) {
      requiredPosition.copy(axis.clone().multiplyScalar(requiredDistance));
    } else if (distance == requiredDistance) {
      requiredPosition.copy(projection);
    } else if (distance > requiredDistance) {
      extension = distance - requiredDistance;
      normal.normalize().multiplyScalar(extension);
      requiredPosition.copy(normal.add(projection));
    } else {
      extension = Math.sqrt(Math.pow(requiredDistance, 2) - Math.pow(normal.length(), 2));
      requiredPosition.copy(projection.add(axis.clone().multiplyScalar(extension)));
    }
    //get saved time
    camera._lastTime = camera._lastTime || (new Date()).getTime();
    var curTime = (new Date()).getTime();
    var lapse = curTime - camera._lastTime;
    camera._lastTime = curTime; //save time
    var beta;
    if (lapse == 0) {
      beta = 10000;
    } else {
      beta = lapse / 1000 / (camera.inertia + 0.001);
    }
    //TODO use PID controller
    // pos = (ß * new + pos) / (1 + ß)
    camera.three.position.add(requiredPosition.multiplyScalar(beta)).divideScalar(1 + beta);
    camera._lastLookAt = camera._lastLookAt || bodyPosition.clone();
    camera.three.lookAt(camera._lastLookAt.add(bodyPosition.clone().multiplyScalar(beta)).divideScalar(1 + beta));

  } else {
    var phase = 0; //Math.PI * Math.random();
    var time = new Date().getTime();
    distance = 10;
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

var workerListener = {
  console: function () {
    var args = [];
    var type = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    console[type].apply(console, args);
  }
};

/**
 * usage:
 * var worker = createWorker('../webworker.js');
 * @param url
 * @returns {Worker}
 */
function createWorker(url) {
  //console.log(url);
  var worker = new Worker(url);
  worker.onmessage = function (e) {
    var request = e.data;
    if ((typeof request == 'object') && workerListener[request.action]) {
      if (request.action != 'result') {
        var result = workerListener[request.action].apply(self, request.arguments);
        var response = {};
        if (request.id) response.id = request.id;
        if (request.comment) response.comment = request.comment;
        response.result = result;
        worker.postMessage(response);
      }
    } else {
      console.log(utils.stringify(request));
    }
  };
  return worker;
}

/**
 * usage:
 * worker = dismissWorker(worker);
 * @param worker
 * @returns {undefined}
 */
function dismissWorker(worker) {
  worker && worker.terminate();
  return undefined;
}

module.exports = {
  show: show,
  moveCamera: moveCamera,
  createWorker: createWorker,
  dismissWorker: dismissWorker
};