var _ = require('../../lib/underscore.js');

var defaultOptions = {
  maxVelocity: 10,
  maxBinary: 1,
  bodyLength: 3,
  bodyWidth: 4,
  bodyMass: 0.5,
  bodyHeight: 1,
  wheelDiameter: 4,
  wheelWidth: 0.5,
  wheelMass: 0.02,
  wheelMargin: 0.1,
  supportMass: 0.1
};

var getObject = function (o) {
  o = _.defaults(o || {}, defaultOptions);
  var sphereRadius = (o.wheelDiameter / 2 - o.bodyHeight / 2) / 2;
  return {
    position: {y: o.wheelDiameter / 2 + o.wheelMargin},
    shape: {
      body: {type: 'box', dx: o.bodyLength, dy: o.bodyHeight, dz: o.bodyWidth},
      wheel: {type: 'cylinder', r: o.wheelDiameter / 2, dy: o.wheelWidth},
      support: {type: 'sphere', r: sphereRadius}
    },
    material: {
      red: { type: 'phong', color: 0x772222 },
      green: { type: 'phong', color: 0x227722 },
      blue: { type: 'phong', color: 0x222277 }
    },
    body: {
      body: {
        shape: 'body', material: 'red', mass: o.bodyMass,
        connector: {
          left: {
            base: {x: o.bodyLength / 2, z: -o.bodyWidth / 2 - o.wheelMargin - o.wheelWidth / 2},
            up: {z: -1}, front: {y: 1}
          },
          right: {
            base: {x: o.bodyLength / 2, z: o.bodyWidth / 2 + o.wheelMargin + o.wheelWidth / 2},
            up: {z: -1}, front: {y: 1}
          },
          back: {
            base: {x: -o.bodyLength / 2, y: -o.bodyHeight / 2 - sphereRadius - o.wheelMargin}
          }
        }
      },
      left: {
        shape: 'wheel', material: 'blue', mass: o.wheelMass, friction: 1,
        connector: {
          axis: {}
        }
      },
      right: {
        shape: 'wheel', material: 'blue', mass: o.wheelMass, friction: 1,
        connector: {
          axis: {}
        }
      },
      support: {
        shape: 'support', material: 'green', mass: o.supportMass,
        connector: {
          center: {}
        }
      }
    },
    constraint: {
      left: {
        type: 'motor', approach: true, bodyA: 'body', bodyB: 'left', connectorA: 'left', connectorB: 'axis',
        maxBinary: o.maxBinary, maxVelocity: o.maxVelocity
      },
      right: {
        type: 'motor', approach: true, bodyA: 'body', bodyB: 'right', connectorA: 'right', connectorB: 'axis',
        maxBinary: o.maxBinary, maxVelocity: o.maxVelocity
      },
      back: {
        type: 'point', approach: true, bodyA: 'body', bodyB: 'support', connectorA: 'back', connectorB: 'center'
      }
    }
  };
};

var userInterface = function (options) {
  options = _.defaults(options || {}, {
    system: undefined,
    container: 'body'
  });

  function make(dir) {
    return {type: 'range', min: -10, max: 10, step: 1,
      change: function () {
        var v = this.getValues()[dir];
        var c = this.rootSystem.getSystem(options.system).getConstraint(dir);
        c.enable(v)
      }
    };
  }

  return {
    values: {
      left: 0,
      right: 0
    },
    template: {
      left: make('left'), right: make('right')
    },
    container: options.container
  };
};

module.exports.userInterface = userInterface;
module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;


