var utils = require('../util/test.js');
var ammo = require('../lib/ammo.js');
var three = require('../lib/three.js');
var factory = require('../factory.js');
var _ = require('../lib/underscore.js');

factory.addLibrary(ammo);
factory.addLibrary(three);

function shape(type) {
  return function () {
    var obj = {
      shape: {
        shape0: {
          segments: 12,
          dx: 3,
          dy: 5,
          r: 4,
          parent: {
            type: 'box', dx: 5, dy: 1, dz: 1, segments: 2
          },
          children: {
            c1: {
              type: 'sphere', r: 1
            }
          }
        }
      },
      body: {
        body0: {
          shape: 'shape0'
        }
      },
      monitor: {
        m1: {
          camera: 'satellite', inertia: 0.2, lookAt: 'body0'
        }
      }
    };
    obj.shape.shape0.type = type;
    factory.setScope(type);
    factory.loadScene(obj, {
      webWorker: false,
      autoStart: true,
      wireframe: true,
      axisHelper: true,
      canvasContainer: '#container'
    });
  };
}

function clearObjects() {
  factory.destroyAll();
}

var test = {
};

_.each(factory.constructor.shape, function (cons, type) {
  test[type] = shape(type);
});

test.all = utils.all(test);
module.exports.test = test;
module.exports.clearObjects = clearObjects;