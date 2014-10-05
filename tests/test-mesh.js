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

function shape(type) {
  return function () {
    var parameters = {
      dx: Math.random() + 0.1,
      dy: Math.random() + 0.1,
      dz: Math.random() + 0.1,
      r: Math.random() + 0.1,
      segments: ~~(Math.random() * 18 + 6)
    };
    document.getElementById('status').innerHTML = type + ' :<br />' + JSON.stringify(parameters);
    var s = new factory.Shape(type, parameters);
    var m = new factory.Material('basic', {color: utils.randomColor(), wireframe: true});

    var mesh = new three.Mesh(s.three, m.three);
    //utils.logKeys(mesh, 'mesh.properties');
    //utils.logKeys(mesh.prototype, 'mesh.prototype properties');
    //utils.logKeys(s.three, 'mesh.three properties');
    if (!scene) scene = makeScene();
    currentMesh = replaceMesh(currentMesh, mesh);
    console.log(type);
  };
}

var test = {
};

_.each(factory.description.shape, function (desc, type) {
  if ((typeof desc == 'object') && desc.constructors)
    test[type] = shape(type);
});

function makeScene() {
  var scene = new three.Scene();
  var camera = new three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  var renderer = new three.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera.position.z = 5;

  var render = function () {
    //limit animation frame
    setTimeout(function () {
      requestAnimationFrame(render);
    }, 50);

    //rotate the mesh
    if (currentMesh) {
      currentMesh.rotation.x += 0.01;
      currentMesh.rotation.y += 0.03;
      currentMesh.rotation.z -= 0.02;
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

test.all = utils.all(test, 3500, true);
utils.run(test, process.argv, __filename);

