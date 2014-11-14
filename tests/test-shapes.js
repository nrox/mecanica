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
          segments: 24,
          dx: 3,
          dy: 5,
          r: 4,
          //next objects are for compound
          parent: {
            type: 'box', dx: 5, dy: 1, dz: 1, segments: 2
          },
          children: {
            c1: {
              type: 'box',
              segments: 4,
              r: 1,
              dx: 2, dy: 2, dz: 2,
              rotation: {x: 1, y: 1, z: 1},
              position: {y: 0.3, z: 0.5, x: 1}
            },
            c2: {
              type: 'compound',
              position: {y: -0.3, z: -0.5, x: -1},
              rotation: {x: 1, y: 2, z: 1},
              parent: {
                type: 'cone',
                segments: 16,
                r: 2,
                dy: 5
              },
              children: {
                c3: {
                  type: 'sphere',
                  segments: 8,
                  r: 1,
                  position: {y: 3}
                }
              }
            }
          }
        }
      },
      body: {
        body0: {
          shape: 'shape0', material: {
            type: 'phong', color: 0xf56677, opacity: 0.7, transparent: true
          }
        }
      },
      light: {
        l1: {position: {x: 5, z: -5}},
        l2: {position: {x:-7, y:6}, color: 0x8899bb},
        l3: {position: {y: -5, z:1}, color: 0x445566}
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