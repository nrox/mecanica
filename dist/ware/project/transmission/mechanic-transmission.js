/**
 * Based on coaxial servo arm,
 * base material: wood
 */

var _ = require('../../../lib/underscore.js');
var utils = require('../../../utils.js');

var defaultOptions = {
  sW: 0.46, //segment width
  sD: 0.21, //segment depth
  vH: 4, //vertical segment height
  hW: 3 //horizontal segment span
};

var getObject = function (o) {
  _.defaults(o || {}, defaultOptions);
  var gap = 0.1 * o.sD;
  o.density = 0.45; //Kg/dm^3
  o.vMass = o.density * o.vH * o.sW * o.sD;
  o.hMass = o.density * o.hW * o.sW * o.sD;
  o.opacity = 1;7
  o.mass = 0.01;
  var object = {
    settings: {
      local: {
        lengthUnits: 'dm',
        freeze: false,
        axisHelper: 0,
        connectorHelper: 0
      }
    },
    position: {},
    shape: {
      V: {type: 'box', dx: o.sW, dy: o.vH, dz: o.sD, gap: gap},
      H: {type: 'box', dx: o.hW, dy: o.sW, dz: o.sD, gap: gap},
      axis: {type: 'cylinder', r: o.sW / 3, dy: 4 * o.sD}
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
        shape: 'axis', material: 'gray', mass: o.mass, rotation: {x: Math.PI / 2},
        connector: {
          center: {}
        }
      },
      H: {
        isTemplate: true,
        shape: 'H', material: 'green', mass: o.hMass,
        connector: {
          //left
          'x=-1,z=0': {
            base: {x: -o.hW / 2 + o.sW / 2, z: 0},
            up: {z: 1}, front: {x: 1}
          },
          'x=-1,z=-1': {
            base: {x: -o.hW / 2 + o.sW / 2, z: -o.sD},
            up: {z: 1}, front: {x: 1}
          },
          'x=-1,z=-2': {
            base: {x: -o.hW / 2 + o.sW / 2, z: -2 * o.sD},
            up: {z: 1}, front: {x: 1}
          },
          'x=-1,z=1': {
            base: {x: -o.hW / 2 + o.sW / 2, z: o.sD},
            up: {z: 1}, front: {x: 1}
          },
          //right
          'x=1,z=0': {
            base: {x: o.hW / 2 - o.sW / 2, z: 0},
            up: {z: 1}, front: {x: 1}
          },
          'x=1,z=-1': {
            base: {x: o.hW / 2 - o.sW / 2, z: -o.sD},
            up: {z: 1}, front: {x: 1}
          },
          'x=1,z=-2': {
            base: {x: o.hW / 2 - o.sW / 2, z: -2 * o.sD},
            up: {z: 1}, front: {x: 1}
          },
          'x=1,z=1': {
            base: {x: o.hW / 2 - o.sW / 2, z: o.sD},
            up: {z: 1}, front: {x: 1}
          },
          //center
          'x=0,z=0': {
            base: {x: 0, z: 0},
            up: {z: 1}, front: {x: 1}
          },
          'x=0,z=-1': {
            base: {x: 0, z: -o.sD},
            up: {z: 1}, front: {x: 1}
          },
          'x=0,z=-2': {
            base: {x: 0, z: -2 * o.sD},
            up: {z: 1}, front: {x: 1}
          },
          'x=0,z=-3': {
            base: {x: 0, z: -3 * o.sD},
            up: {z: 1}, front: {x: 1}
          },
          'x=0,z=1': {
            base: {x: 0, z: o.sD},
            up: {z: 1}, front: {x: 1}
          },
          'x=0,z=2': {
            base: {x: 0, z: 2 * o.sD},
            up: {z: 1}, front: {x: 1}
          }
        }
      },
      V: {
        isTemplate: true,
        shape: 'V', material: 'green', mass: o.vMass,
        connector: {
          'y=1': {
            base: {y: o.vH / 2 - o.sW / 2},
            up: {z: 1}, front: {x: 1}
          },
          'y=0': {
            base: {y: -o.vH / 2 + o.sW / 2},
            up: {z: 1}, front: {x: 1}
          }
        }
      },
      //level z=0
      'H,z=0,y=0': {type: 'copy', of: 'H', material: 'red', mass: 0, position: {x: 0, y: 0, z: 0}},
      'H,z=0,y=1': {type: 'copy', of: 'H', material: 'red', position: {x: 0, y: o.vH - o.sW, z: 0}},
      'V,z=0,x=-1': {type: 'copy', of: 'V', material: 'red', position: {x: -o.hW / 2 + o.sW / 2, y: (o.vH - o.sW) / 2, z: o.sD}},
      'V,z=0,x=1': {type: 'copy', of: 'V', material: 'red', position: {x: o.hW / 2 - o.sW / 2, y: (o.vH - o.sW) / 2, z: o.sD}},

      // level z=-1, y=0
      'H,z=-1,y=0': {type: 'copy', of: 'H', material: 'blue', position: {x: 0, y: 0, z: -o.sD}},
      'H,z=-1,y=1': {type: 'copy', of: 'H', material: 'blue', position: {x: 0, y: o.vH - o.sW, z: -o.sD}},
      'V,z=-1,x=-1': {type: 'copy', of: 'V', material: 'blue', position: {x: -o.hW / 2 + o.sW / 2, y: (o.vH - o.sW) / 2, z: -2 * o.sD}},
      'V,z=-1,x=1': {type: 'copy', of: 'V', material: 'blue', position: {x: o.hW / 2 - o.sW / 2, y: (o.vH - o.sW) / 2, z: -2 * o.sD}},

      //level z=-1, y=1
      'H,z=-1,y=2': {type: 'copy', of: 'H', material: 'blue', position: {x: 0, y: 2 * (o.vH - o.sW), z: -3 * o.sD}},
      'V,z=-1,x=0,y=1': {type: 'copy', of: 'V', material: 'blue', position: {x: 0, y: 3 * (o.vH - o.sW) / 2, z: -2 * o.sD}},

      //level z=-2, y= 0
      'H,z=-2,y=0': {type: 'copy', of: 'H', position: {x: 0, y: 0, z: -3 * o.sD}},
      'H,z=-2,y=1': {type: 'copy', of: 'H', position: {x: 0, y: o.vH - o.sW, z: -3 * o.sD}},
      'V,z=-2,x=-1': {type: 'copy', of: 'V', position: {x: -o.hW / 2 + o.sW / 2, y: (o.vH - o.sW) / 2, z: -4 * o.sD}},
      'V,z=-2,x=1': {type: 'copy', of: 'V', position: {x: o.hW / 2 - o.sW / 2, y: (o.vH - o.sW) / 2, z: -4 * o.sD}},

      //level z=-2, y=1
      'H,z=-2,y=2': {type: 'copy', of: 'H', position: {x: 0, y: 2 * (o.vH - o.sW), z: -4 * o.sD}},
      'V,z=-2,x=-1,y=1': {type: 'copy', of: 'V', position: {x: -o.hW / 2 + o.sW / 2, y: 3 * (o.vH - o.sW) / 2, z: -5 * o.sD}},
      'V,z=-2,x=1,y=1': {type: 'copy', of: 'V', position: {x: o.hW / 2 - o.sW / 2, y: 3 * (o.vH - o.sW) / 2, z: -5 * o.sD}},

      //tip
      'V,z=-2,x=1,y=2': {type: 'copy', of: 'V', position: {x: 0, y: 5 * (o.vH - o.sW) / 2, z: -5 * o.sD}},
      'H,z=-2,y=3': {type: 'copy', of: 'H', position: {x: 0, y: 3 * (o.vH - o.sW), z: -4 * o.sD}},
      /*
       //axis
       'A,y=0': {type: 'copy', of: 'axis'},
       'A,y=1': {type: 'copy', of: 'axis'},
       'A,y=2': {type: 'copy', of: 'axis'}
       */
    },
    constraint: {
      //basic hinges level z=0
      'hinge,z=0,x=-1,y=0': {type: 'hinge', bodyA: 'H,z=0,y=0', bodyB: 'V,z=0,x=-1', connectorA: 'x=-1,z=1', connectorB: 'y=0'},
      'hinge,z=0,x=1,y=0': {type: 'hinge', bodyA: 'H,z=0,y=0', bodyB: 'V,z=0,x=1', connectorA: 'x=1,z=1', connectorB: 'y=0'},
      'hinge,z=0,x=-1,y=1': {type: 'hinge', bodyA: 'H,z=0,y=1', bodyB: 'V,z=0,x=-1', connectorA: 'x=-1,z=1', connectorB: 'y=1'},
      'hinge,z=0,x=1,y=1': {type: 'hinge', bodyA: 'H,z=0,y=1', bodyB: 'V,z=0,x=1', connectorA: 'x=1,z=1', connectorB: 'y=1'},
      //hinges from z=0 to z=-1
      'hinge,z=0/-1,x=0,y=0': {type: 'hinge', bodyA: 'H,z=0,y=0', bodyB: 'H,z=-1,y=0', connectorA: 'x=0,z=-1', connectorB: 'x=0,z=0'},
      'hinge,z=0/-1,x=0,y=1': {type: 'hinge', bodyA: 'H,z=0,y=1', bodyB: 'H,z=-1,y=1', connectorA: 'x=0,z=-1', connectorB: 'x=0,z=0'},
      //basic hinges level z=-1, y=0
      'hinge,z=-1,x=-1,y=0': {type: 'hinge', bodyA: 'H,z=-1,y=0', bodyB: 'V,z=-1,x=-1', connectorA: 'x=-1,z=-1', connectorB: 'y=0'},
      'hinge,z=-1,x=1,y=0': {type: 'hinge', bodyA: 'H,z=-1,y=0', bodyB: 'V,z=-1,x=1', connectorA: 'x=1,z=-1', connectorB: 'y=0'},
      'hinge,z=-1,x=-1,y=1': {type: 'hinge', bodyA: 'H,z=-1,y=1', bodyB: 'V,z=-1,x=-1', connectorA: 'x=-1,z=-1', connectorB: 'y=1'},
      'hinge,z=-1,x=1,y=1': {type: 'hinge', bodyA: 'H,z=-1,y=1', bodyB: 'V,z=-1,x=1', connectorA: 'x=1,z=-1', connectorB: 'y=1'},
      //fix level 2
      'FIX,z=-1,x=-1,y=1/2': {type: 'servo', bodyA: 'H,z=-1,y=1', bodyB: 'V,z=-1,x=0,y=1', connectorA: 'x=0,z=-1', connectorB: 'y=0', angle: 0},
      'FIX,z=-1,x=-1,y=2/3': {type: 'servo', bodyA: 'H,z=-1,y=2', bodyB: 'V,z=-1,x=0,y=1', connectorA: 'x=0,z=1', connectorB: 'y=1', angle: 0},

      //basic hinges level z=-2(3), y=0
      'hinge,z=-2,x=-1,y=0': {type: 'hinge', bodyA: 'H,z=-2,y=0', bodyB: 'V,z=-2,x=-1', connectorA: 'x=-1,z=-1', connectorB: 'y=0'},
      'hinge,z=-2,x=1,y=0': {type: 'hinge', bodyA: 'H,z=-2,y=0', bodyB: 'V,z=-2,x=1', connectorA: 'x=1,z=-1', connectorB: 'y=0'},
      'hinge,z=-2,x=-1,y=1': {type: 'hinge', bodyA: 'H,z=-2,y=1', bodyB: 'V,z=-2,x=-1', connectorA: 'x=-1,z=-1', connectorB: 'y=1'},
      'hinge,z=-2,x=1,y=1': {type: 'hinge', bodyA: 'H,z=-2,y=1', bodyB: 'V,z=-2,x=1', connectorA: 'x=1,z=-1', connectorB: 'y=1'},
      //hinges from z=0 to z=-2
      'hinge,z=0/-2,x=0,y=0': {type: 'hinge', bodyA: 'H,z=0,y=0', bodyB: 'H,z=-2,y=0', connectorA: 'x=0,z=-3', connectorB: 'x=0,z=0'},
      'hinge,z=0/-2,x=0,y=1': {type: 'hinge', bodyA: 'H,z=0,y=1', bodyB: 'H,z=-2,y=1', connectorA: 'x=0,z=-3', connectorB: 'x=0,z=0'},

      //basic hinges level z=-2, y=2
      'hinge,z=-2,x=-1,y=1/2': {type: 'hinge', bodyA: 'H,z=-2,y=1', bodyB: 'V,z=-2,x=-1,y=1', connectorA: 'x=-1,z=-2', connectorB: 'y=0'},
      'hinge,z=-2,x=1,y=1/2': {type: 'hinge', bodyA: 'H,z=-2,y=1', bodyB: 'V,z=-2,x=1,y=1', connectorA: 'x=1,z=-2', connectorB: 'y=0'},
      'hinge,z=-2,x=-1,y=2/2': {type: 'hinge', bodyA: 'H,z=-2,y=2', bodyB: 'V,z=-2,x=-1,y=1', connectorA: 'x=-1,z=-1', connectorB: 'y=1'},
      'hinge,z=-2,x=1,y=2/2': {type: 'hinge', bodyA: 'H,z=-2,y=2', bodyB: 'V,z=-2,x=1,y=1', connectorA: 'x=1,z=-1', connectorB: 'y=1'},

      //hinges from z=-1 to z=-2
      'hinge,z=-1/-2,x=0,y=0': {type: 'hinge', bodyA: 'H,z=-1,y=2', bodyB: 'H,z=-2,y=2', connectorA: 'x=0,z=-1', connectorB: 'x=0,z=0'},

      //fix level 3
      'FIX,z=-2,x=-1,y=2/3': {type: 'servo', bodyA: 'H,z=-2,y=2', bodyB: 'V,z=-2,x=1,y=2', connectorA: 'x=0,z=-1', connectorB: 'y=0', angle: 0},
      'FIX,z=-2,x=-1,y=3/4': {type: 'servo', bodyA: 'H,z=-2,y=3', bodyB: 'V,z=-2,x=1,y=2', connectorA: 'x=0,z=-1', connectorB: 'y=1', angle: 0},

      //servos
      'servo,z=0': {type: 'servo', bodyA: 'H,z=0,y=0', bodyB: 'V,z=0,x=1', connectorA: 'x=1,z=1', connectorB: 'y=0', angle: 0, maxBinary: 1000},
      'servo,z=-1': {type: 'servo', bodyA: 'H,z=0,y=0', bodyB: 'H,z=-1,y=0', connectorA: 'x=0,z=-1', connectorB: 'x=0,z=0', angle: 0, maxBinary: 1000},
      'servo,z=-2': {type: 'servo', bodyA: 'H,z=0,y=0', bodyB: 'H,z=-2,y=0', connectorA: 'x=0,z=-3', connectorB: 'x=0,z=0', angle: 0, maxBinary: 1000}
    },


    //tip
    'fix-tip': {type: 'servo', bodyA: 'H,z=-2,y=2', bodyB: 'V,z=-2,x=1,y=2', connectorA: 'x=0,z=0', connectorB: 'y=0', angle: 0},
    //axis
    'axis0': {type: 'hinge', bodyA: 'H,z=-1,y=0', bodyB: 'A,y=0', connectorA: 'x=0,z=0', connectorB: 'center', approach: true},
    'axis1': {type: 'hinge', bodyA: 'H,z=-1,y=1', bodyB: 'A,y=1', connectorA: 'x=0,z=0', connectorB: 'center', approach: true},
    'axis2': {type: 'hinge', bodyA: 'H,z=-1,y=2', bodyB: 'A,y=2', connectorA: 'x=0,z=0', connectorB: 'center', approach: true},

    //}
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
    return {type: 'range', min: -130, max: 130, step: 1, speed: 5,
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