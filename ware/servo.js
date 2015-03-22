var _ = require('../lib/underscore.js');
module.exports.getObject = function (options) {
  console.warn('this servo is not ready to be used');
  options = _.defaults(options, {
    id: 'servo',
    caseWidth: 1,
    caseHeight: 0.5,
    caseLength: 2,
    caseMass: 0.9,
    caseColor: 0x333333,
    shaftDiameter: 0.5,
    shaftHeight: 0.1,
    shaftMass: 0.1,
    shaftColor: 0x999999,
    shaftMargin: 0.15,
    tolerance: 0.001 //to avoid friction between shaft and case
  });
  //TODO find a way to include methods into systems
  var method = {

  };
  return {
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
        segments: 8
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
        },
        shaft: {
          mass: options.shaftMass, shape: 'shaft', material: 'shaft',
          position: {y: (options.caseHeight / 2 + options.shaftHeight / 2 + options.tolerance)},
          connector: {
            toCase: {
              base: {y: -(options.shaftHeight/2 + options.tolerance)}
            }
          }
        }
      }
    },
    constraint: {
      servo: {
        type: 'servo',
        bodyA: 'case',
        a: 'toShaft',
        bodyB: 'shaft',
        b: 'toCase'
      }
    }
  };
};