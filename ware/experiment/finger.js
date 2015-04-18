var _ = require('../../lib/underscore.js');

var defaultOptions = {
  r: 0.5, //radius
  tip: 3, //tip height
  base: 1, //base height
  colorTip: 0x883344,
  colorBase: 0x443377,
  tipMass: 0.1,
  baseMass: 0,
  gap: 0.01 //small gap to avoid friction
};

function getObject(o) {
  o = _.defaults(o || {}, defaultOptions);
  var tipCylinderHeight = (o.tip - 2 * o.r - o.gap);
  var jointThickness = 2 * o.r / 3 - 2 * o.gap;
  var jointPosition = -tipCylinderHeight / 2 - o.r - o.gap;
  var baseCylinderHeight = o.base - o.r - o.gap;
  var baseJointPosition = baseCylinderHeight / 2 + o.r + o.gap;
  return {
    shape: {
      tip: {
        type: 'compound',
        parent: {
          type: 'cylinder', r: o.r, dy: tipCylinderHeight
        },
        children: {
          edge: {
            type: 'sphere', r: o.r, position: {y: tipCylinderHeight / 2}
          },
          joint: {
            type: 'cylinder', r: o.r, dy: jointThickness, position: {y: jointPosition}, rotation: {x: Math.PI / 2}
          },
          jointSupport: {
            type: 'box', dz: jointThickness, dx: o.r, dy: (o.r + o.gap), position: {y: jointPosition + (o.r + o.gap) / 2}
          }
        }
      },
      base: {
        type: 'compound',
        parent: {
          type: 'cylinder', r: o.r, dy: baseCylinderHeight - o.gap
        },
        children: {
          joint1: {
            type: 'cylinder', r: o.r, dy: jointThickness, position: {y: baseJointPosition, z: 2 * o.r / 3}, rotation: {x: Math.PI / 2}
          },
          joint2: {
            type: 'cylinder', r: o.r, dy: jointThickness, position: {y: baseJointPosition, z: -2 * o.r / 3}, rotation: {x: Math.PI / 2}
          }
        }
      }
    },
    material: {
      tip: {type: 'phong', color: o.colorTip },
      base: {type: 'phong', color: o.colorBase }
    },
    body: {
      tip: {
        position: {y: o.base + o.r + o.gap + tipCylinderHeight / 2},
        mass: o.tipMass,
        shape: 'tip',
        material: 'tip',
        connector: {
          c: {
            base: {y: jointPosition},
            up: {z: -1},
            front: {y: 1}
          }
        }
      },
      base: {
        position: {y: baseCylinderHeight / 2},
        mass: o.baseMass,
        shape: 'base',
        material: 'base',
        connector: {
          c: {
            base: {y: baseCylinderHeight / 2 + o.r + o.gap},
            up: {z: -1},
            front: {y: 1}
          },
          bottom: {
            base: {y: -baseCylinderHeight / 2}
          }
        }
      }
    },
    constraint: {
      tilt: {
        type: 'servo', lowerLimit: -Math.PI / 2, upperLimit: Math.PI / 2, maxBinary: 10, maxVelocity: 1,
        connectorA: 'c', connectorB: 'c',
        bodyA: 'base', bodyB: 'tip'
      }
    },
    method: {
      setAngle: {
        method: function(angle){
          this.getConstraint('tilt').setAngle(angle);
        }
      }
    }
  }
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
      angle: {type: 'range', min: -90, max: 90, step: 1, velocity: 5, onChange: function () {
        var angle = this.getValues().angle;
        this.rootSystem.getSystem(options.system).setAngle(angle * Math.PI / 180);
      }}
    },
    container: options.container
  };
}

module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;
module.exports.userInterface = userInterface;


