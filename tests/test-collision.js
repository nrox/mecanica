var utils = require('../util/test.js');
var factory = require('../factory.js');
var _ = require('../lib/underscore.js');
var $ = require('../lib/jquery.js');
var test = {
};

function clearObjects() {
  factory.destroyAll();
  $('[monitor]').remove();
}

function makeTest(bodyOptions, floorOptions, title) {
  return function () {
    factory.setScope(title);
    bodyOptions.rotation.x = 2 * Math.PI * Math.random();
    bodyOptions.rotation.y = 2 * Math.PI * Math.random();
    bodyOptions.rotation.z = 0;
    var pack = {};
    factory.updatePack(pack, 'scene', {});
    factory.updatePack(pack, 'body', 'basic', bodyOptions);
    factory.updatePack(pack, 'body', 'basic', floorOptions);
    factory.updatePack(pack, 'monitor', {
      camera: 'tracker', inertia: 0.2, lookAt: bodyOptions.id
    });
    factory.loadScene(pack, {
      webWorker: true,
      autoStart: true,
      canvasContainer: '#container'
    },$);
  };
}

function addAllTests() {
  var body = {
    id: 'body1',
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