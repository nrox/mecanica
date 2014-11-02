/**
 * director.js rules the simulation and renders the world/environment
 * it can build worlds defined in /ware/ folder.
 * see ware/basic.js example
 */

var memo = {};
var _ = require('lib/underscore.js');
var Ammo = require('lib/ammo.js');
var THREE = require('lib/three.js');
var utils = require('utils.js');
var factory = require('factory.js');

factory.addLibrary(THREE);


function loadScene(json, options) {
  options = _.extend({
    axisHelper: 0,
    canvasContainer: 'body',
    webWorker: false,
    autoStart: false,
    renderFrequency: 30
  }, options || {});
  if (options.webWorker){
    factory.createWorker();
  } else {
    factory.addLibrary(Ammo);
  }
  factory.loadObjects(json, options);
  var scene = factory.getSome('scene');
  var monitor = factory.getSome('monitor');
  $(options.canvasContainer).append(monitor.renderer.three.domElement);

  memo.scene = scene;
  memo.camera = monitor.camera;
  memo.renderer = monitor.renderer;

  if (options.autoStart) {
    factory.startSimulation(options);
    startRender(options);
  }
}

function startRender(options) {
  options = _.extend({
    renderFrequency: 30
  }, options || {});
  var render = function () {
    memo.stid = setTimeout(function () {
      memo.rafid = requestAnimationFrame(render);
    }, 1000 / options.renderFrequency);
    moveCamera(memo.camera);
    memo.renderer.three.render(memo.scene.three, memo.camera.three);
  };
  render();
}

function stopRender() {
  cancelAnimationFrame(memo.rafid);
  clearTimeout(memo.stid);
}

function moveCamera(camera) {

  var distance;
  if (camera.type == 'tracker') {
    var requiredPosition = camera.three.position.clone();
    var bodyPosition = camera.lookAt.three.position;
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
    var origin = new THREE.Vector3();
    var phase = 0; //Math.PI * Math.random();
    var time = new Date().getTime();
    distance = 10;
    camera.three.position.x = distance * Math.sin(phase + time / 12234);
    camera.three.position.z = distance * Math.cos(phase + time / 12234);
    camera.three.position.y = -1 + 2 * Math.cos(phase + time / 13345);
    camera.three.lookAt(origin);

  }
}

module.exports = {
  loadScene: loadScene,
  startRender: startRender,
  stopRender: stopRender,
  moveCamera: moveCamera,
  factory: factory
};