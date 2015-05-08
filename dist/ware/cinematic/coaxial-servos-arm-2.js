var _ = require('../../lib/underscore.js');
var utils = require('../../utils.js');

var defaultOptions = {
  opacity: 0.9,
  t: 0.2,
  dy: 3,
  dx: 1,
  mass: 0.01
};

var getObject = function (o) {
  _.defaults(o || {}, defaultOptions);
  var gap = 0.1 * o.t;
  o.dz = o.t;
  var object = {
    settings: {
      local: {
        freeze: false,
        axisHelper: 0,
        connectorHelper: 0
      }
    },
    position: {y: -o.dy * 1.8},
    shape: {
      V: {type: 'box', dx: o.t, dy: o.dy, dz: o.t, gap: gap},
      H: {type: 'box', dx: o.dx, dy: o.t, dz: o.t, gap: gap},
      axis: {type: 'cylinder', r: o.t / 3, dy: 4 * o.dz}
    },
    material: {
      red: {color: 0x883333, opacity: o.opacity},
      green: {color: 0x338833, opacity: o.opacity},
      blue: {color: 0x333388, opacity: o.opacity},
      gray: {color: 0x666666, opacity: o.opacity}
    },
    body: {
      axis: {
        isTemplate: true,
        shape: 'axis', material: 'gray', mass: o.mass, mask: '1000', rotation: {x: Math.PI / 2},
        connector: {
          center: {}
        }
      },
      H: {
        isTemplate: true,
        shape: 'H', material: 'green', mass: o.mass, mask: '001', position: {x: 0, y: 0, z: 0},
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
        shape: 'V', material: 'green', mass: o.mass, mask: '010', position: {x: 0, y: 0, z: 0},
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
      'H,z=0,y=0': {type: 'copy', of: 'H', material: 'red', mass: 0, position: {x: 0, y: 0, z: 0}},
      'H,z=0,y=1': {type: 'copy', of: 'H', material: 'red', position: {x: 0, y: o.dy - o.t, z: 0}},
      'V,z=0,x=-1': {type: 'copy', of: 'V', material: 'red', position: {x: -o.dx / 2, y: (o.dy - o.t) / 2, z: 0}},
      'V,z=0,x=1': {type: 'copy', of: 'V', material: 'red', position: {x: o.dx / 2, y: (o.dy - o.t) / 2, z: 0}},
      //level z=-1, y=0
      'H,z=-1,y=0': {type: 'copy', of: 'H', material: 'blue', position: {x: 0, y: 0, z: -o.dz}},
      'H,z=-1,y=1': {type: 'copy', of: 'H', material: 'blue', position: {x: 0, y: o.dy - o.t, z: -o.dz}},
      'V,z=-1,x=-1': {type: 'copy', of: 'V', material: 'blue', position: {x: -o.dx / 2, y: (o.dy - o.t) / 2, z: -o.dz}},
      'V,z=-1,x=1': {type: 'copy', of: 'V', material: 'blue', position: {x: o.dx / 2, y: (o.dy - o.t) / 2, z: -o.dz}},
      //level z=-1, y=1
      'H,z=-1,y=2': {type: 'copy', of: 'H', material: 'blue', position: {x: 0, y: 2 * (o.dy - o.t), z: -o.dz}},
      'V,z=-1,x=-1,y=1': {type: 'copy', of: 'V', material: 'blue', mask: '100', position: {x: -o.dx / 2, y: 3 * (o.dy - o.t) / 2, z: -o.dz}},
      'V,z=-1,x=1,y=1': {type: 'copy', of: 'V', material: 'blue', mask: '100', position: {x: o.dx / 2, y: 3 * (o.dy - o.t) / 2, z: -o.dz}},
      //level z=-2, y= 0
      'H,z=-2,y=0': {type: 'copy', of: 'H', position: {x: 0, y: 0, z: -2 * o.dz}},
      'H,z=-2,y=1': {type: 'copy', of: 'H', position: {x: 0, y: o.dy - o.t, z: -2 * o.dz}},
      'V,z=-2,x=-1': {type: 'copy', of: 'V', position: {x: -o.dx / 2, y: (o.dy - o.t) / 2, z: -2 * o.dz}},
      'V,z=-2,x=1': {type: 'copy', of: 'V', position: {x: o.dx / 2, y: (o.dy - o.t) / 2, z: -2 * o.dz}},
      //level z=-2, y=1
      'H,z=-2,y=2': {type: 'copy', of: 'H', position: {x: 0, y: 2 * (o.dy - o.t), z: -2 * o.dz}},
      'V,z=-2,x=-1,y=1': {type: 'copy', of: 'V', mask: '100', position: {x: -o.dx / 2, y: 3 * (o.dy - o.t) / 2, z: -2 * o.dz}},
      'V,z=-2,x=1,y=1': {type: 'copy', of: 'V', mask: '100', position: {x: o.dx / 2, y: 3 * (o.dy - o.t) / 2, z: -2 * o.dz}},
      //tip
      'V,z=-2,x=1,y=2': {type: 'copy', of: 'V', position: {x: 0, y: 5 * (o.dy - o.t) / 2, z: -2 * o.dz}},
      //axis
      'A,y=0': {type: 'copy', of: 'axis'},
      'A,y=1': {type: 'copy', of: 'axis'},
      'A,y=2': {type: 'copy', of: 'axis'}
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
      'FIX,z=-1,x=-1,y=1/2': {type: 'servo', bodyA: 'H,z=-1,y=1', bodyB: 'V,z=-1,x=-1,y=1', connectorA: 'x=-1,z=0', connectorB: 'y=0', angle: 0},
      'hinge,z=-1,x=1,y=1/2': {type: 'hinge', bodyA: 'H,z=-1,y=1', bodyB: 'V,z=-1,x=1,y=1', connectorA: 'x=1,z=0', connectorB: 'y=0'},
      'hinge,z=-1,x=-1,y=2/2': {type: 'hinge', bodyA: 'H,z=-1,y=2', bodyB: 'V,z=-1,x=-1,y=1', connectorA: 'x=-1,z=0', connectorB: 'y=1'},
      'hinge,z=-1,x=1,y=2/2': {type: 'hinge', bodyA: 'H,z=-1,y=2', bodyB: 'V,z=-1,x=1,y=1', connectorA: 'x=1,z=0', connectorB: 'y=1'},
      //basic hinges level z=-2
      'hinge,z=-2,x=-1,y=0': {type: 'hinge', bodyA: 'H,z=-2,y=0', bodyB: 'V,z=-2,x=-1', connectorA: 'x=-1,z=0', connectorB: 'y=0'},
      'hinge,z=-2,x=1,y=0': {type: 'hinge', bodyA: 'H,z=-2,y=0', bodyB: 'V,z=-2,x=1', connectorA: 'x=1,z=0', connectorB: 'y=0'},
      'hinge,z=-2,x=-1,y=1': {type: 'hinge', bodyA: 'H,z=-2,y=1', bodyB: 'V,z=-2,x=-1', connectorA: 'x=-1,z=0', connectorB: 'y=1'},
      'hinge,z=-2,x=1,y=1': {type: 'hinge', bodyA: 'H,z=-2,y=1', bodyB: 'V,z=-2,x=1', connectorA: 'x=1,z=0', connectorB: 'y=1'},
      //basic hinges level z=-2, y=1
      'hinge,z=-2,x=-1,y=1/2': {type: 'hinge', bodyA: 'H,z=-2,y=1', bodyB: 'V,z=-2,x=-1,y=1', connectorA: 'x=-1,z=0', connectorB: 'y=0'},
      'hinge,z=-2,x=1,y=1/2': {type: 'hinge', bodyA: 'H,z=-2,y=1', bodyB: 'V,z=-2,x=1,y=1', connectorA: 'x=1,z=0', connectorB: 'y=0'},
      'hinge,z=-2,x=-1,y=2/2': {type: 'hinge', bodyA: 'H,z=-2,y=2', bodyB: 'V,z=-2,x=-1,y=1', connectorA: 'x=-1,z=0', connectorB: 'y=1'},
      'hinge,z=-2,x=1,y=2/2': {type: 'hinge', bodyA: 'H,z=-2,y=2', bodyB: 'V,z=-2,x=1,y=1', connectorA: 'x=1,z=0', connectorB: 'y=1'},
      //hinges from z=0 to z=-1
      'hinge,z=0/-1,x=0,y=0': {type: 'hinge', bodyA: 'H,z=0,y=0', bodyB: 'H,z=-1,y=0', connectorA: 'x=0,z=-1', connectorB: 'x=0,z=0'},
      'hinge,z=0/-1,x=0,y=1': {type: 'hinge', bodyA: 'H,z=0,y=1', bodyB: 'H,z=-1,y=1', connectorA: 'x=0,z=-1', connectorB: 'x=0,z=0'},
      //hinges from z=0 to z=-2
      'hinge,z=0/-2,x=0,y=0': {type: 'hinge', bodyA: 'H,z=0,y=0', bodyB: 'H,z=-2,y=0', connectorA: 'x=0,z=-2', connectorB: 'x=0,z=0'},
      'hinge,z=0/-2,x=0,y=1': {type: 'hinge', bodyA: 'H,z=0,y=1', bodyB: 'H,z=-2,y=1', connectorA: 'x=0,z=-2', connectorB: 'x=0,z=0'},
      //hinges from z=-1 to z=-2
      'hinge,z=-1/-2,x=0,y=0': {type: 'hinge', bodyA: 'H,z=-1,y=2', bodyB: 'H,z=-2,y=2', connectorA: 'x=0,z=-1', connectorB: 'x=0,z=0'},
      //tip
      'fix-tip': {type: 'servo', bodyA: 'H,z=-2,y=2', bodyB: 'V,z=-2,x=1,y=2', connectorA: 'x=0,z=0', connectorB: 'y=0', angle: 0},
      //axis
      'axis0': {type: 'hinge', bodyA: 'H,z=-1,y=0', bodyB: 'A,y=0', connectorA: 'x=0,z=0', connectorB: 'center', approach: true},
      'axis1': {type: 'hinge', bodyA: 'H,z=-1,y=1', bodyB: 'A,y=1', connectorA: 'x=0,z=0', connectorB: 'center', approach: true},
      'axis2': {type: 'hinge', bodyA: 'H,z=-1,y=2', bodyB: 'A,y=2', connectorA: 'x=0,z=0', connectorB: 'center', approach: true},
      //servos
      'servo,z=0': {type: 'servo', bodyA: 'H,z=0,y=0', bodyB: 'V,z=0,x=1', connectorA: 'x=1,z=0', connectorB: 'y=0', angle: 0, maxBinary: 1000},
      'servo,z=-1': {type: 'servo', bodyA: 'H,z=0,y=0', bodyB: 'H,z=-1,y=0', connectorA: 'x=0,z=-1', connectorB: 'x=0,z=0', angle: 0, maxBinary: 1000},
      'servo,z=-2': {type: 'servo', bodyA: 'H,z=0,y=0', bodyB: 'H,z=-2,y=0', connectorA: 'x=0,z=-2', connectorB: 'x=0,z=0', angle: 0, maxBinary: 1000}
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

  function servoUI(servo) {
    return {type: 'range', min: -45, max: 45, step: 1,
      change: function () {
        var angle = Math.PI * this.getValues()[servo] / 180;
        //console.log(this.getValues());
        serve.call(this, servo, angle);
      }
    };
  }

  return {
    values: {
      'servo,z=0': 0, 'servo,z=-1': 0, 'servo,z=-2': 0,
      demo: function () {
        var _this = this;
        if (this._demoRunning) {
          clearInterval(this._demoRunning);
          _this._demoRunning = false;
          return;
        }
        var time = utils.seconds();
        this._demoRunning = setInterval(function () {
          _.each(['servo,z=0', 'servo,z=-1', 'servo,z=-2'], function (servo, index) {
            var angle = 0.3 * Math.sin((1 + index * 0.5) * utils.seconds(time));
            angle += 0.35 * Math.sin((0.4 + index * 0.4) * utils.seconds(time))
            serve.call(_this, servo, angle);
          });
        }, 100);
      }
    },
    template: {
      'servo,z=0': servoUI('servo,z=0'),
      'servo,z=-1': servoUI('servo,z=-1'),
      'servo,z=-2': servoUI('servo,z=-2')
    },
    container: options.container
  };
};

module.exports.userInterface = userInterface;
module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;