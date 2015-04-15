var utils = require('../util/test.js');
var _ = require('../lib/underscore.js');
var $ = require('../lib/jquery.js');
var lib = require('../mecanica.js');

var test = {
};

function clearObjects() {
  $('#container').empty();
}

function makeTest(bodyOptions, floorOptions, title) {
  return function () {
    var me = new lib.Mecanica({type: 'empty'});
    me.import('../ware/settings/tests.js');
    me.import('../ware/scene/simple.js');
    me.import('../ware/light/set3.js');

    bodyOptions.rotation.x = 2 * Math.PI * Math.random();
    bodyOptions.rotation.y = 2 * Math.PI * Math.random();
    bodyOptions.rotation.z = 0;

    me.loadSystem({
      body: {
        falling: bodyOptions,
        floor: floorOptions
      }
    }, 'system');

    me.import('../ware/monitor/tracker.js', {
      lookAt: me.getSystem('system').getBody('falling'),
      distance: 30
    });
    me.addToScene();
    me.start();
  };
}

function addAllTests() {
  var body = {
    id: 'falling',
    shape: {
      type: undefined,
      r: 1, dx: 1, dy: 1.2, dz: 1.4,
      segments: undefined,
      //for compound only
      parent: {
        type: 'cone',
        r: 1, dx: 1, dy: 3, dz: 1.4, segments: 16
      },
      //for compound only
      children: {
        box: {
          type: 'box', dx: 1, dy: 1.2, dz: 1.4, segments: 4,
          rotation: {x: 1}, position: {z: 0.5}
        }
      }
    },
    position: { x: 0.2, y: 5, z: 0.5 },
    rotation: { x: undefined, y: undefined, z: 0 },
    material: {type: 'phong', color: 0x991122, transparent: true, opacity: 0.95},
    mass: 0.1
  };
  var floor = {
    id: 'floor',
    shape: {
      type: undefined,
      dx: 10, dz: 5, dy: 2, r: 9,
      segments: undefined,
      //for compound only
      parent: {
        type: 'cone',
        dx: 10, dz: 5, dy: 7, r: 10, segments: 64
      },
      //for compound only
      children: {
        box: {
          type: 'box', dx: 11, dz: 11, dy: 1, segments: 8
        }
      }
    },
    position: {
      x: 0.3,
      y: undefined,
      z: 0.1
    },
    material: {type: 'phong', color: 0x338855, transparent: true, opacity: 0.9},
    mass: 0
  };
  var bodySegments = {
    box: 4,
    sphere: 16,
    cone: 32,
    cylinder: 32,
    compound: 32
  };
  var floorSegments = {
    box: 8,
    sphere: 32,
    cone: 64,
    cylinder: 32,
    compound: 64
  };
  var floorY = {
    box: -5,
    sphere: -10,
    cone: -3,
    cylinder: -5,
    compound: -3
  };
  var shapes = ['box', 'sphere', 'cone', 'cylinder', 'compound'];
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