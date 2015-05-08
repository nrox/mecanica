(function () {

  var _ = require('../../lib/underscore.js');

  var defaultOptions = {
    angle: 179,
    mass1: 0.2,
    mass2: 0.2,
    length1: 3,
    length2: 3
  };

  function getObject(o) {
    //console.warn('pendulum energy seams decreasing with time. TODO: check default dampings');
    o = _.defaults(o || {}, defaultOptions);
    o.dx = 0.5;
    o.dz = 1;
    o.dy = o.dz / 2;
    return {
      position: {y: (o.length1 + o.length2) / 2},
      rotation: {x: Math.PI * o.angle / 180},
      shape: {
        support: { type: 'box', dx: o.dx, dy: 2 * o.dy, dz: o.dz, gap: 0.01},
        beam1: { type: 'box', dx: o.dx, dy: o.length1, dz: o.dz, gap: 0.01},
        beam2: { type: 'box', dx: o.dx, dy: o.length2, dz: o.dz, gap: 0.01}
      },
      material: {
        support: {type: 'phong', color: 0x222277, friction: 0},
        beam1: {type: 'phong', color: 0x772222, friction: 0},
        beam2: {type: 'phong', color: 0x227722, friction: 0}
      },
      body: {
        support: {
          mass: 0, shape: 'support', material: 'support', connector: {
            c1: {
              base: {x: o.dx / 2},
              up: {x: 1},
              front: {z: 1}
            }
          }},
        beam1: {
          linearDamping: 0, angularDamping: 0,
          position: {y: -o.length1 / 2 + o.dy, x: o.dx},
          mass: o.mass1, shape: 'beam1', material: 'beam1', connector: {
            c1: {
              base: {x: -o.dx / 2, y: o.length1 / 2 - o.dy},
              up: {x: 1},
              front: {z: 1}
            },
            c2: {
              base: {x: o.dx / 2, y: -o.length1 / 2 + o.dy},
              up: {x: 1},
              front: {z: 1}
            }
          }},
        beam2: {
          linearDamping: 0, angularDamping: 0,
          position: {y: -o.length1 - o.length2 / 2 + 3 * o.dy, x: 2 * o.dx}, mass: o.mass2, shape: 'beam2', material: 'beam2', connector: {
            c2: {
              base: {x: -o.dx / 2, y: o.length2 / 2 - o.dy},
              up: {x: 1},
              front: {z: 1}
            }
          }}
      },
      constraint: {
        c1: {type: 'hinge', bodyA: 'support', bodyB: 'beam1', connectorA: 'c1', connectorB: 'c1'},
        c2: {type: 'hinge', bodyA: 'beam1', bodyB: 'beam2', connectorA: 'c2', connectorB: 'c2'}
      }
    }
  }


  module.exports.defaultOptions = defaultOptions;
  module.exports.getObject = getObject;

})();


