var _ = require('../lib/underscore.js');

var defaultOptions = {
  position: {x: 0, y: -3, z: 0},
  height: 2,
  mass1: 0.5,
  mass2: 0.2,
  beamMass: 0.1,
  length1: 4,
  length2: 7,
  depth: 1,
  thickness: 0.5,
  restitution: 0.01
};

function getObject(o) {
  o = _.defaults(o || {}, defaultOptions);
  o.gap = o.thickness;
  function radiusForMass(mass) {
    return mass + 0.5;
  }

  return {
    settings: {
      local: {
        freeze: false,
        axisHelper: false
      }
    },
    position: o.position,
    shape: {
      base: { type: 'box', dx: o.length1 + o.length2, dy: o.thickness, dz: o.depth},
      support: { type: 'box', dx: o.thickness, dy: o.height, dz: o.depth},
      beam: { type: 'box', dx: o.length1 + o.length2, dy: o.thickness, dz: o.depth},
      weight1: { type: 'sphere', r: radiusForMass(o.mass1)},
      weight2: { type: 'sphere', r: radiusForMass(o.mass2)}
    },
    material: {
      support: {type: 'phong', color: 0x222277, restitution: o.restitution},
      beam: {type: 'phong', color: 0x772222, restitution: o.restitution},
      weight1: {type: 'phong', color: 0x227722, restitution: o.restitution},
      weight2: {type: 'phong', color: 0x227777, restitution: o.restitution}
    },
    body: {
      base: {
        mass: 0, shape: 'base', material: 'support',
        position: {x: (o.length2 - o.length1) / 2},
      },
      support: {
        position: {y: o.height / 2},
        mass: 0, shape: 'support', material: 'support',
        connector: {
          pivot: {
            base: {y: o.height / 2 + o.gap},
            up: {z: 1},
            front: {x: 1}
          }
        }
      },
      beam: {
        mass: o.beamMass, shape: 'beam', material: 'beam',
        position: {y: o.height + o.gap, x: (o.length2 - o.length1) / 2},
        connector: {
          pivot: {
            base: {x: -(o.length2 - o.length1) / 2},
            up: {z: 1},
            front: {x: 1}
          },
          toWeight1: {
            base: {x: -o.length1 - (o.length2 - o.length1) / 2, y: o.thickness / 2}
          },
          toWeight2: {
            base: {x: o.length2 - (o.length2 - o.length1) / 2, y: o.thickness / 2}
          }
        }
      },
      weight1: {
        mass: o.mass1, shape: 'weight1', material: 'weight1',
        position: {x: -o.length1, y: o.height + o.gap + o.thickness / 2 + radiusForMass(o.mass1)},
        connector: {
          bottom: {base: {y: -radiusForMass(o.mass1)}}
        }
      },
      weight2: {
        mass: o.mass2, shape: 'weight2', material: 'weight2',
        position: {x: o.length2, y: o.height + o.gap + o.thickness / 2 + radiusForMass(o.mass2)},
        connector: {
          bottom: {base: {y: -radiusForMass(o.mass2)}}
        }
      }
    },
    constraint: {
      support: {
        type: 'hinge', bodyA: 'support', connectorA: 'pivot', bodyB: 'beam', connectorB: 'pivot'
      },
      weight1: {
        type: 'hinge', bodyA: 'beam', connectorA: 'toWeight1', bodyB: 'weight1', connectorB: 'bottom'
      },
      weight2: {
        type: 'hinge', bodyA: 'beam', connectorA: 'toWeight2', bodyB: 'weight2', connectorB: 'bottom'
      }
    }
  }
}


module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;


