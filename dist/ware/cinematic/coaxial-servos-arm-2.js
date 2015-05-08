var _ = require('../../lib/underscore.js');
var utils = require('../../utils.js');

var defaultOptions = {
  opacity: 0.7,
  t: 0.2,
  dy: 3,
  dx: 2,
  mass: 0.01,
  freeze: false,
  axisHelper: 0.5,
  connectorHelper: 0.3
};

var getObject = function (o) {
  _.defaults(o || {}, defaultOptions);
  var gap = 0.1 * o.t;
  o.dz = o.t;
  var object = {
    settings: {
      local: {
        freeze: o.freeze,
        axisHelper: o.axisHelper,
        connectorHelper: o.connectorHelper
      }
    },
    shape: {
      V: {type: 'box', dx: o.t, dy: o.dy, dz: o.t, gap: gap},
      H: {type: 'box', dx: o.dx, dy: o.t, dz: o.t, gap: gap}
    },
    material: {
      red: {color: 0x883333, opacity: o.opacity},
      green: {color: 0x338833, opacity: o.opacity},
      blue: {color: 0x333388, opacity: o.opacity},
      gray: {color: 0x666666, opacity: o.opacity}
    },
    body: {
      H: {
        isTemplate: true,
        shape: 'H', material: 'blue', mass: 0, mask: '001', position: {x: 0, y: 0, z: 0},
        connector: {
          //left
          'x=-1,z=0': {
            base: {x: -o.dx / 2, z: 0},
            up: {z: 1}, front: {x: 1}
          },
          //right
          'x=1,z=0': {
            base: {x: o.dx / 2, z: 0},
            up: {z: 1}, front: {x: 1}
          },
          //center
          'x=0,z=0': {
            base: {x: 0, z: 0},
            up: {z: 1}, front: {x: 1}
          },
          //far -1dz
          'x=0,z=-1': {
            base: {x: 0, z: -o.dz},
            up: {z: 1}, front: {x: 1}
          },
          //far -2dz
          'x=0,z=-2': {
            base: {x: 0, z: -2 * o.dz},
            up: {z: 1}, front: {x: 1}
          }
        }
      },
      V: {
        isTemplate: true,
        shape: 'V', material: 'red', mass: o.mass, mask: '010', position: {x: 0, y: 0, z: 0},
        connector: {
          'y=1': {
            base: {y: o.dy / 2 - o.t / 2},
            up: {z: 1}, front: {x: 1}
          },
          'y=0': {
            base: {y: -o.dy / 2 + o.t / 2},
            up: {z: 1}, front: {x: 1}
          }
        }
      },
      //level z=0
      'H,z=0,y=0': {type: 'copy', of: 'H', mass: 0, position: {x: 0, y: 0, z: 0}},
      'H,z=0,y=1': {type: 'copy', of: 'H', mass: o.mass, position: {x: 0, y: o.dy - o.t, z: 0}},
      'V,z=0,x=-1': {type: 'copy', of: 'V', mass: o.mass, position: {x: -o.dx / 2, y: (o.dy - o.t) / 2, z: 0}},
      'V,z=0,x=1': {type: 'copy', of: 'V', mass: o.mass, position: {x: o.dx / 2, y: (o.dy - o.t) / 2, z: 0}},
      //level z=-1, y=0
      'H,z=-1,y=0': {type: 'copy', of: 'H', mass: o.mass, position: {x: 0, y: 0, z: -o.dz}},
      'H,z=-1,y=1': {type: 'copy', of: 'H', mass: o.mass, position: {x: 0, y: o.dy - o.t, z: -o.dz}},
      'V,z=-1,x=-1': {type: 'copy', of: 'V', mass: o.mass, position: {x: -o.dx / 2, y: (o.dy - o.t) / 2, z: -o.dz}},
      'V,z=-1,x=1': {type: 'copy', of: 'V', mass: o.mass, position: {x: o.dx / 2, y: (o.dy - o.t) / 2, z: -o.dz}},
      //level z=-1, y=1
      'H,z=-1,y=2': {type: 'copy', of: 'H', mass: o.mass, position: {x: 0, y: 2 * (o.dy - o.t), z: -o.dz}},
      'V,z=-1,x=-1,y=1': {type: 'copy', of: 'V', mask: '100', mass: o.mass, position: {x: -o.dx / 2, y: 3 * (o.dy - o.t) / 2, z: -o.dz}},
      'V,z=-1,x=1,y=1': {type: 'copy', of: 'V', mask: '100', mass: o.mass, position: {x: o.dx / 2, y: 3 * (o.dy - o.t) / 2, z: -o.dz}},
      //level z=-2
      'H,z=-2,y=0': {type: 'copy', of: 'H', mass: o.mass, position: {x: 0, y: 0, z: -2 * o.dz}},
      'H,z=-2,y=1': {type: 'copy', of: 'H', mass: o.mass, position: {x: 0, y: o.dy - o.t, z: -2 * o.dz}},
      'V,z=-2,x=-1': {type: 'copy', of: 'V', mass: o.mass, position: {x: -o.dx / 2, y: (o.dy - o.t) / 2, z: -2 * o.dz}},
      'V,z=-2,x=1': {type: 'copy', of: 'V', mass: o.mass, position: {x: o.dx / 2, y: (o.dy - o.t) / 2, z: -2 * o.dz}},
    },
    constraint: {
      //basic hinges level z=0
      'hinge,z=0,x=-1,y=0': {type: 'hinge', bodyA: 'H,z=0,y=0', bodyB: 'V,z=0,x=-1', connectorA: 'x=-1,z=0', connectorB: 'y=0'},
      'hinge,z=0,x=1,y=0': {type: 'hinge', bodyA: 'H,z=0,y=0', bodyB: 'V,z=0,x=1', connectorA: 'x=1,z=0', connectorB: 'y=0'},
      'hinge,z=0,x=-1,y=1': {type: 'hinge', bodyA: 'H,z=0,y=1', bodyB: 'V,z=0,x=-1', connectorA: 'x=-1,z=0', connectorB: 'y=1'},
      'hinge,z=0,x=1,y=1': {type: 'hinge', bodyA: 'H,z=0,y=1', bodyB: 'V,z=0,x=1', connectorA: 'x=1,z=0', connectorB: 'y=1'},
      //basic hinges level z=-1, y=0
      'hinge,z=-1,x=-1,y=0': {type: 'hinge', bodyA: 'H,z=-1,y=0', bodyB: 'V,z=-1,x=-1', connectorA: 'x=-1,z=0', connectorB: 'y=0'},
      'hinge,z=-1,x=1,y=0': {type: 'hinge', bodyA: 'H,z=-1,y=0', bodyB: 'V,z=-1,x=1', connectorA: 'x=1,z=0', connectorB: 'y=0'},
      'hinge,z=-1,x=-1,y=1': {type: 'hinge', bodyA: 'H,z=-1,y=1', bodyB: 'V,z=-1,x=-1', connectorA: 'x=-1,z=0', connectorB: 'y=1'},
      'hinge,z=-1,x=1,y=1': {type: 'hinge', bodyA: 'H,z=-1,y=1', bodyB: 'V,z=-1,x=1', connectorA: 'x=1,z=0', connectorB: 'y=1'},
      //basic hinges level z=-1, y=1
      'hinge,z=-1,x=-1,y=1/2': {type: 'hinge', bodyA: 'H,z=-1,y=1', bodyB: 'V,z=-1,x=-1,y=1', connectorA: 'x=-1,z=0', connectorB: 'y=0'},
      'hinge,z=-1,x=1,y=1/2': {type: 'hinge', bodyA: 'H,z=-1,y=1', bodyB: 'V,z=-1,x=1,y=1', connectorA: 'x=1,z=0', connectorB: 'y=0'},
      'hinge,z=-1,x=-1,y=2/2': {type: 'hinge', bodyA: 'H,z=-1,y=2', bodyB: 'V,z=-1,x=-1,y=1', connectorA: 'x=-1,z=0', connectorB: 'y=1'},
      'hinge,z=-1,x=1,y=2/2': {type: 'hinge', bodyA: 'H,z=-1,y=2', bodyB: 'V,z=-1,x=1,y=1', connectorA: 'x=1,z=0', connectorB: 'y=1'},
      //basic hinges level z=-2
      'hinge,z=-2,x=-1,y=0': {type: 'hinge', bodyA: 'H,z=-2,y=0', bodyB: 'V,z=-2,x=-1', connectorA: 'x=-1,z=0', connectorB: 'y=0'},
      'hinge,z=-2,x=1,y=0': {type: 'hinge', bodyA: 'H,z=-2,y=0', bodyB: 'V,z=-2,x=1', connectorA: 'x=1,z=0', connectorB: 'y=0'},
      'hinge,z=-2,x=-1,y=1': {type: 'hinge', bodyA: 'H,z=-2,y=1', bodyB: 'V,z=-2,x=-1', connectorA: 'x=-1,z=0', connectorB: 'y=1'},
      'hinge,z=-2,x=1,y=1': {type: 'hinge', bodyA: 'H,z=-2,y=1', bodyB: 'V,z=-2,x=1', connectorA: 'x=1,z=0', connectorB: 'y=1'},
      //hinges from z=0 to z=-1
      'hinge,z=0/-1,x=0,y=0': {type: 'hinge', bodyA: 'H,z=0,y=0', bodyB: 'H,z=-1,y=0', connectorA: 'x=0,z=-1', connectorB: 'x=0,z=0'},
      'hinge,z=0/-1,x=0,y=1': {type: 'hinge', bodyA: 'H,z=0,y=1', bodyB: 'H,z=-1,y=1', connectorA: 'x=0,z=-1', connectorB: 'x=0,z=0'},
      //hinges from z=0 to z=-2
      'hinge,z=0/-2,x=0,y=0': {type: 'hinge', bodyA: 'H,z=0,y=0', bodyB: 'H,z=-2,y=0', connectorA: 'x=0,z=-2', connectorB: 'x=0,z=0'},
      'hinge,z=0/-2,x=0,y=1': {type: 'hinge', bodyA: 'H,z=0,y=1', bodyB: 'H,z=-2,y=1', connectorA: 'x=0,z=-2', connectorB: 'x=0,z=0'},

      //servos
      'servo,z=0': {type: 'servo', bodyA: 'H,z=0,y=0', bodyB: 'V,z=0,x=1', connectorA: 'x=1,z=0', connectorB: 'y=0', angle: 0},
      'servo,z=-1': {type: 'servo', bodyA: 'H,z=0,y=0', bodyB: 'H,z=-1,y=0', connectorA: 'x=0,z=-1', connectorB: 'x=0,z=0', angle: 0},
      'servo,z=-2': {type: 'servo', bodyA: 'H,z=0,y=0', bodyB: 'H,z=-2,y=0', connectorA: 'x=0,z=-2', connectorB: 'x=0,z=0', angle: 0}
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
          _.each(['servo,z=0', 'servo,z=-1', 'servo,z=-2'], function (servo, index) {
            var angle = 0.3 * Math.sin((1 + index * 0.5) * utils.seconds(time));
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