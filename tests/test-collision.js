var utils = require('../util/test.js');
var factory = require('../factory.js');
var _ = require('../lib/underscore.js');
var $ = require('../lib/jquery.js');
var test = {
};

function clearObjects() {
  factory.stopSimulation();
  factory.stopRender();
  factory.destroyAll();
  $('[monitor]').remove();
}

function makeTest(bodyOptions, floorOptions, title) {
  return function () {

    bodyOptions.rotation.x = 2 * Math.PI * Math.random();
    bodyOptions.rotation.y = 2 * Math.PI * Math.random();
    bodyOptions.rotation.z = 0;
    var body = factory.make('body', 'basic', bodyOptions);
    factory.make('body', 'basic', floorOptions);
    factory.make('monitor', {
      camera: 'tracker', inertia: 0.5, lookAt: body.id
    });
    var pack = factory.pack();
    factory.destroyAll();
    factory.loadScene(pack, {
      webWorker: false,
      autoStart: true,
      canvasContainer: '#container'
    },$);
  };
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
//test.all = utils.all(test, 1);
module.exports.test = test;
module.exports.clearObjects = clearObjects;