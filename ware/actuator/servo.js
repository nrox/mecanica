var _ = require('../../lib/underscore.js');

var defaultOptions = {
  angle: 0,
  lowerLimit: 0,
  upperLimit: Math.PI,
  maxBinary: 10,
  maxVelocity: 0.5,
  caseWidth: 0.4,
  caseHeight: 0.7,
  caseLength: 1.3,
  caseMass: 0,
  caseColor: 0x333333,
  shaftDiameter: 1.2,
  shaftHeight: 0.1,
  shaftMass: 0.1,
  shaftColor: 0x999999,
  shaftMargin: 0.15,
  tolerance: 0.01 //to avoid friction between shaft and case
};

function getObject(options) {
  options = _.defaults(options || {}, defaultOptions);
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
            base: {y: options.caseHeight / 2, x: options.caseLength / 2 - options.shaftMargin},
            up: {y: 1}, front: {z: 1}
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
            base: {y: -(options.shaftHeight / 2 + options.tolerance)},
            up: {y: 1}, front: {z: 1}
          }
        }
      }
    },
    constraint: {
      servo: {
        type: 'servo',
        bodyA: 'case', bodyB: 'shaft',
        connectorA: 'toShaft', connectorB: 'toCase',
        angle: options.angle,
        lowerLimit: options.lowerLimit,
        upperLimit: options.upperLimit,
        maxBinary: options.maxBinary,
        maxVelocity: options.maxVelocity
      }
    },
    method: {
      setAngle: {
        method: function (angle) {
          this.getConstraint('servo').setAngle(angle);
        }
      }
    }
  };
}

function userInterface(options) {
  options = _.defaults(options || {}, {
    system: undefined,
    container: 'body'
  });
  return {
    values: {
      angle: 0
    },
    template: {
      angle: {type: 'range', min: 0, max: Math.PI, step: 0.01, velocity: 5, onChange: function () {
        var angle = this.getValues().angle;
        this.rootSystem.getSystem(options.system).setAngle(angle);
      }}
    },
    container: options.container
  };
}

module.exports.userInterface = userInterface;
module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;