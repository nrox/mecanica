var _ = require('../lib/underscore.js');
module.exports.getObject = function (options) {
  console.warn('this servo is not ready to be used');
  options = _.defaults(options || {}, {
    id: 'servo',
    caseWidth: 0.4,
    caseHeight: 0.7,
    caseLength: 1.3,
    caseMass: 0,
    caseColor: 0x333333,
    shaftDiameter: 0.8,
    shaftHeight: 0.1,
    shaftMass: 0,
    shaftColor: 0x999999,
    shaftMargin: 0.15,
    tolerance: 0.001 //to avoid friction between shaft and case
  });
  return {
    settings: {
      debug: {
        connectorHelper: 0.3
      }
    },
    shape: {
      case: {
        type: 'box',
        dx: options.caseLength,
        dy: options.caseHeight,
        dz: options.caseWidth
      },
      shaft: {
        type: 'cylinder',
        dy: options.shaftHeight,
        r: options.shaftDiameter / 2,
        segments: 16
      }
    },
    material: {
      case: {type: 'phong', color: options.caseColor },
      shaft: {type: 'phong', color: options.shaftColor }
    },
    body: {
      case: {
        mass: options.caseMass, shape: 'case', material: 'case',
        connector: {
          toShaft: {
            base: {y: options.caseHeight / 2, x: options.caseLength / 2 - options.shaftMargin}
          }
        }
      },
      shaft: {
        mass: options.shaftMass, shape: 'shaft', material: 'shaft',
        position: {
          x: options.caseLength / 2 - options.shaftMargin,
          y: (options.caseHeight / 2 + options.shaftHeight / 2 + options.tolerance)
        },
        connector: {
          toCase: {
            base: {y: -(options.shaftHeight / 2 + options.tolerance)}
          }
        }
      }
    }/*,
     constraint: {
     servo: {
     type: 'servo',
     bodyA: 'case',
     a: 'toShaft',
     bodyB: 'shaft',
     b: 'toCase'
     }
     }*/, scene: {
      s1: {}
    },
    monitor: {
      cam: {camera: 'satellite', lookAt: 'case', axis: {x: 1, y: 0.5, z: 0.3}, distance: 5, inertia: 5}
    },
    light: {
      l1: {position: {x: 5, z: -5}},
      l2: {position: {x: -7, y: 6, z: 5}, color: 0x8899bb},
      l3: {position: {y: -5, z: 1}, color: 0x445566}
    },
    method: {
      setAngle: {
        //type: 'beforeStep',
        execute: "" + function (angle) {
          //angle in degrees
          //var s = getObject('constraint', 'servo');
          //s.setAngle(angle * 180 / Math.PI);
          //console.log(1);
        }
      }
    }
  };
};