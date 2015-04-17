var _ = require('../../lib/underscore.js');

var defaultOptions = {
  mass: 1,
  dispersion: 3,
  y: 1
};

function getObject(options) {
  options = _.defaults(options || {}, defaultOptions);
  var d = options.dispersion;
  return {
    shape: {
      box: { type: 'box', dx: 1, dy: 1, dz: 1},
      sphere: { type: 'sphere', r: 1, segments: 16 },
      cone: { type: 'sphere', r: 1, dy: 1, segments: 16 },
      cylinder: {type: 'cylinder', dy: 1, r: 1, segments: 16},
      compound: {
        type: 'compound',
        parent: {
          type: 'sphere', r: 1
        },
        children: {
          child1: {
            type: 'box', dx: 2, dy: 0.5, dz: 1, position: {x: 1}, rotation: {z: 0.5}
          },
          child2: {
            type: 'cone', r: 2, dy: 0.5, position: {x: -1, y: 0.5}, rotation: {x: 0.5}
          }
        }
      }
    },
    material: {
      red: {type: 'phong', color: 0x772222 },
      green: {type: 'phong', color: 0x227722 },
      blue: {type: 'phong', color: 0x222277 }
    },
    body: {
      box: {position: {y: options.y}, mass: 0, shape: 'box', material: 'red', connector: {c: {}}},
      sphere: {position: {y: -d, z: d}, mass: options.mass, shape: 'sphere', material: 'red', connector: {c: {base: {y: d}}}},
      cone: { position: {y: -d, z: -d}, mass: options.mass, shape: 'cone', material: 'red', connector: {c: {base: {y: d}}}},
      cylinder: { position: {y: -d, z: d, x: d}, mass: options.mass, shape: 'cylinder', material: 'blue', connector: {c: {base: {y: d}}}},
      compound: { position: {y: -d, z: d, x: -d}, mass: options.mass, shape: 'compound', material: 'blue', connector: {c: {base: {y: d}}}}
    },
    constraint: {
      c1: { bodyA: 'box', bodyB: 'sphere', connectorA: 'c', connectorB: 'c'},
      c2: { bodyA: 'box', bodyB: 'cone', connectorA: 'c', connectorB: 'c'},
      c3: { bodyA: 'box', bodyB: 'cylinder', connectorA: 'c', connectorB: 'c'},
      c4: { bodyA: 'box', bodyB: 'compound', connectorA: 'c', connectorB: 'c'}
    }
  }
}


module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;


