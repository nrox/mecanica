var _ = require('../../../lib/underscore.js');
var utils = require('../../../utils.js');

var defaultOptions = {
  opacity: 0.7,
  beamThickness: 0.4,
  longBeamLength: 6,
  beamDistance: 1,
  segmentMass: 0.01
};

var getObject = function (o) {
  _.defaults(o || {}, defaultOptions);
  var gap = 0.01;
  var object = {
    settings: {
      debug: {
        axisHelper: 0,
        connectorHelper: 0
      }
    },
    shape: {
      vertical: {type: 'box', dy: o.longBeamLength, dx: o.beamThickness, dz: o.beamThickness, gap: gap},
      horizontal: {type: 'box', dy: o.beamThickness, dx: o.beamThickness, dz: 2 * o.beamDistance + o.beamThickness, gap: gap}
    },
    material: {
      red: {color: 0x883333, opacity: o.opacity},
      green: {color: 0x338833, opacity: o.opacity},
      blue: {color: 0x333388, opacity: o.opacity},
      gray: {color: 0x666666, opacity: o.opacity}
    },
    body: {
      vertical: {
        shape: 'vertical', material: 'red', mass: o.segmentMass, mask: '1', position: {y: o.longBeamLength / 2 - o.beamThickness / 2},
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
        shape: 'horizontal', material: 'blue', mass: 0, mask: '10', position: {y: 0},
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
          },
          far: {
            base: {x: -o.beamThickness},
            up: {x: 1}, front: {y: -1}
          }
        }
      },
      left: {type: 'copy', of: 'vertical', mass: o.segmentMass, position: {y: o.longBeamLength / 2 - o.beamThickness / 2, z: -o.beamDistance}},
      right: {type: 'copy', of: 'vertical', mass: o.segmentMass, position: {y: o.longBeamLength / 2 - o.beamThickness / 2, z: o.beamDistance}},
      top: {type: 'copy', of: 'horizontal', mass: o.segmentMass, position: {y: o.longBeamLength - o.beamThickness}},
      farBottom: {type: 'copy', of: 'horizontal', mass: o.segmentMass, position: {x: -o.beamThickness}},
      farTop: {type: 'copy', of: 'horizontal', mass: o.segmentMass, position: {x: -o.beamThickness, y: o.longBeamLength - o.beamThickness}},
      farLeft: {type: 'copy', of: 'vertical', mass: o.segmentMass, position: {x: -o.beamThickness, y: o.longBeamLength / 2 - o.beamThickness / 2, z: -o.beamDistance}},
      farRight: {type: 'copy', of: 'vertical', mass: o.segmentMass, position: {x: -o.beamThickness, y: o.longBeamLength / 2 - o.beamThickness / 2, z: o.beamDistance}},
      secondCenter: {type: 'copy', of: 'vertical', mass: o.segmentMass, position: {x: -o.beamThickness, y: 3 * o.longBeamLength / 2 - 3 * o.beamThickness / 2, z: 0}}
    },
    constraint: {
      servo0: {
        type: 'servo', bodyA: 'horizontal', bodyB: 'vertical', connectorA: 'center', connectorB: 'bottom', angle: 0
      },
      servo1: {
        type: 'servo', bodyA: 'horizontal', bodyB: 'farBottom', connectorA: 'far', connectorB: 'center', angle: 0
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
      },
      farTop: {
        type: 'hinge', bodyA: 'top', bodyB: 'farTop', connectorA: 'far', connectorB: 'center'
      },
      farBottomLeft: {
        type: 'hinge', bodyA: 'farBottom', bodyB: 'farLeft', connectorA: 'left', connectorB: 'bottom'
      },
      farBottomRight: {
        type: 'hinge', bodyA: 'farBottom', bodyB: 'farRight', connectorA: 'right', connectorB: 'bottom'
      },
      farTopLeft: {
        type: 'hinge', bodyA: 'farTop', bodyB: 'farLeft', connectorA: 'left', connectorB: 'top'
      },
      farTopRight: {
        type: 'hinge', bodyA: 'farTop', bodyB: 'farRight', connectorA: 'right', connectorB: 'top'
      },
      fixSecondCenter: {
        type: 'fixed', bodyA: 'farTop', bodyB: 'secondCenter', connectorA: 'center', connectorB: 'bottom'
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
  function serve(servo, angle) {
    var c = this.rootSystem.getConstraint({system: options.system, id: servo});
    c.setAngle(angle);
  }

  return {
    values: {
      sweep: function () {
        var _this = this;
        var time = utils.seconds();
        setInterval(function () {
          _.each(['servo0', 'servo1'], function (servo, index) {
            var angle = 0.75 * Math.sin((1 + index * 0.5) * utils.seconds(time));
            serve.call(_this, servo, angle);
          });
        }, 100);
      }
    },
    container: options.container
  };
};

module.exports.userInterface = userInterface;
module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;