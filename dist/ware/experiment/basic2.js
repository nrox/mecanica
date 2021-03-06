var _ = require('../../lib/underscore.js');
var defaultOptions = {
  coneY: 1.8,
  coneRadius: 2
};

function getObject(options) {
  options = _.defaults(options || {}, defaultOptions);
  return {
    settings: {
      over: {
        wireframe: false
      }
    },
    shape: {
      fixed: { type: 'sphere', r: 1.5, segments: 32 },
      satellite: { type: 'sphere', r: 1, segments: 16 }
    },
    material: {
      id3: {type: 'phong', color: 0x772244 },
      id4: {type: 'phong', color: 0x224477 }
    },
    body: {
      id5: { mass: 0, shape: 'fixed', material: 'id4',
        connector: {c1: {}}
      },
      id6: { mass: 1, shape: 'satellite', material: 'id3', position: {x: 0, y: 0, z: 3},
        connector: {c2: {base: {z: -3}}}
      }
    },
    system: {
      subsystem: {
        shape: {
          shape1: {type: 'cone', dy: 2, r: options.coneRadius, segments: 32}
        },
        material: {
          m1: {type: 'phong', color: 0x776644}
        },
        body: {
          body2: {shape: 'shape1', material: 'm1', mass: 0, position: {y: options.coneY}}
        }
      }
    },
    constraint: {
      cons: {
        connectorA: 'c1', connectorB: 'c2', bodyA: 'id5', bodyB: 'id6'
      }
    }
  }
}

module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;


