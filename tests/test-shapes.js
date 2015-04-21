var utils = require('test-utils.js');
var ammo = require('../dist/lib/ammo.js');
var three = require('../dist/lib/three.js');
var _ = require('../dist/lib/underscore.js');
var lib = require('../dist/mecanica.js');

function clearObjects() {
  $('#container').empty();
}

var test = {
};


function shape(type) {
  return function () {
    var system = {
      shape: {
        shape0: {
          type: type,
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
      }
    };
    var me = new lib.Mecanica();
    me.import('../ware/settings/tests.js');
    me.import('../ware/scene/simple.js');
    me.import('../ware/light/set3.js');
    me.loadSystem(system, 'system');
    me.import('../ware/monitor/satellite.js', {distance: 30});
    me.addToScene();
    me.start();
  };
}

_.each(lib.Shape.prototype.types, function (cons, type) {
  test[type] = shape(type);
});

test.all = utils.all(test);
module.exports.test = test;
module.exports.clearObjects = clearObjects;