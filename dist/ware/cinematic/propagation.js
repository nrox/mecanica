var _ = require('../../lib/underscore.js');
var utils = require('../../utils.js');

var defaultOptions = {
  opacity: 0.7,
  beamThickness: 0.4,
  longBeamLength: 6,
  beamDistance: 1,
  segmentMass: 0.1,
  freeze: false
};

var getObject = function (o) {
  _.defaults(o || {}, defaultOptions);

  var object = {
    settings: {
      local: {
        freeze: o.freeze,
        axisHelper: false
      }
    },
    shape: {
      vertical: {type: 'box', dy: o.longBeamLength, dx: o.beamThickness, dz: o.beamThickness},
      horizontal: {type: 'box', dy: o.beamThickness, dx: o.beamThickness, dz: 2 * o.beamDistance + o.beamThickness}
    },
    material: {
      red: {color: 0x883333, opacity: o.opacity},
      green: {color: 0x338833, opacity: o.opacity},
      blue: {color: 0x333388, opacity: o.opacity},
      gray: {color: 0x666666, opacity: o.opacity}
    },
    body: {
      vertical: {
        shape: 'vertical', material: 'red', mass: 0, mask: '1', position: {y: o.longBeamLength / 2 - o.beamThickness / 2},
        connector: {
          top: {
            base: {y: o.longBeamLength / 2 - o.beamThickness / 2},
            up: {x: 1}, front: {y: -1}
          },
          bottom: {
            base: {y: -o.longBeamLength / 2 + o.beamThickness / 2},
            up: {x: 1}, front: {y: -1}
          }
        }
      },
      horizontal: {
        shape: 'horizontal', material: 'blue', mass: o.segmentMass, mask: '10', position: {y: 0},
        connector: {
          center: {
            base: {},
            up: {x: 1}, front: {y: -1}
          },
          left: {
            base: {z: -o.beamDistance},
            up: {x: 1}, front: {y: -1}
          },
          right: {
            base: {z: o.beamDistance},
            up: {x: 1}, front: {y: -1}
          }
        }
      },
      left: {type: 'copy', of: 'vertical', mass: o.segmentMass, position: {y: o.longBeamLength / 2 - o.beamThickness / 2, z: -o.beamDistance}},
      right: {type: 'copy', of: 'vertical', mass: o.segmentMass, position: {y: o.longBeamLength / 2 - o.beamThickness / 2, z: o.beamDistance}},
      top: {type: 'copy', of: 'horizontal', mass: o.segmentMass, position: {y: o.longBeamLength - o.beamThickness}}
    },
    constraint: {
      servo: {
        type: 'servo', bodyA: 'horizontal', bodyB: 'vertical', connectorA: 'center', connectorB: 'bottom'
      },
      topCenter: {
        type: 'hinge', bodyA: 'top', bodyB: 'vertical', connectorA: 'center', connectorB: 'top'
      },
      bottomLeft: {
        type: 'hinge', bodyA: 'horizontal', bodyB: 'left', connectorA: 'left', connectorB: 'bottom'
      },
      bottomRight: {
        type: 'hinge', bodyA: 'horizontal', bodyB: 'right', connectorA: 'right', connectorB: 'bottom'
      },
      topLeft: {
        type: 'hinge', bodyA: 'top', bodyB: 'left', connectorA: 'left', connectorB: 'top'
      },
      topRight: {
        type: 'hinge', bodyA: 'top', bodyB: 'right', connectorA: 'right', connectorB: 'top'
      }
    }
  };

  return object;
};


var userInterface = function (options) {
  options = _.defaults(options || {}, {
    system: undefined,
    container: 'body'
  });
  return {
    values: {
      sweep: function () {
        var _this = this;
        var time = utils.seconds();
        setInterval(function () {
          var c = _this.rootSystem.getConstraint({system: options.system, id: 'servo'});
          c.setAngle(Math.sin(utils.seconds(time)));
        }, 100);
      }
    },
    container: options.container
  };
};

module.exports.userInterface = userInterface;
module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;