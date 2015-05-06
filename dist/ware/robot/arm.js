var _ = require('../../lib/underscore.js');
var utils = require('../../utils.js');
var box = require('../shape/smooth-box.js');
var defaultOptions = {
  scale: 0.5,
  opacity: 0.8,
  binary: 10
};

function getObject(o) {
  o = _.defaults(o || {}, defaultOptions);
  console.warn('Remark: conceptual model - uses masks to avoid collision between arm segments');
  var r = 0.2;
  var s = o.scale;
  var gap = s * 0.001;
  var axisOffset = s / 3;
  var system = {
    support: box.getObject({
      r: r * s, dx: 3 * s, dy: s, dz: 3 * s, gap: gap,
      demo: false, removeSides: false
    }),
    base: box.getObject({
      r: r * s, dx: 3 * s, dy: 2 * s, dz: 3 * s, gap: gap,
      demo: false, removeSides: false
    }),
    upper: box.getObject({
      r: r * s, dx: 2 * s, dy: 4 * s, dz: 2 * s, gap: gap,
      demo: false, removeSides: false
    }),
    fore: box.getObject({
      r: r * s, dx: s, dy: 4 * s, dz: s, gap: gap,
      demo: false, removeSides: false
    })
  };

  var material = {
    red: {color: 0x883333, opacity: o.opacity},
    green: {color: 0x338833, opacity: o.opacity},
    blue: {color: 0x333388, opacity: o.opacity},
    gray: {color: 0x666666, opacity: o.opacity}
  };

  var body = {
    support: {
      position: {},
      shape: {system: 'support', id: 'smooth'},
      material: 'gray',
      mass: 0,
      mask: '1',
      connector: {
        top: {base: {y: s / 2}}
      }
    },
    base: {
      approach: {connector: 'bottom', targetBody: 'support', targetConnector: 'top'},
      shape: {system: 'base', id: 'smooth'},
      material: 'blue',
      mass: 1,
      mask: '10',
      connector: {
        top: {base: {y: s - axisOffset}, up: {z: 1}, front: {x: 1}},
        bottom: {base: {y: -s}}
      }
    },
    upper: {
      approach: {connector: 'bottom', targetBody: 'base', targetConnector: 'top'},
      shape: {system: 'upper', id: 'smooth'},
      material: 'green',
      mass: 1,
      mask: '100',
      connector: {
        top: {base: {y: 2.25 * s - axisOffset}, up: {z: 1}, front: {x: 1}},
        bottom: {base: {y: -2 * s}, up: {z: 1}, front: {x: 1}}
      }
    },
    fore: {
      approach: {connector: 'bottom', targetBody: 'upper', targetConnector: 'top'},
      shape: {system: 'fore', id: 'smooth'},
      material: 'red',
      mass: 1,
      mask: '1000',
      connector: {
        top: {base: {y: 2 * s}},
        bottom: {base: {y: -2 * s}, up: {z: 1}, front: {x: 1}}
      }
    },
    tool: {
      approach: {connector: 'center', targetBody: 'fore', targetConnector: 'top'},
      shape: {type: 'cylinder', dy: s, r: s, segments: 8},
      material: 'gray',
      mass: 1,
      mask: '10000',
      connector: {
        center: {}
      }
    }
  };

  var constraint = {
    pan: {
      type: 'servo', bodyA: 'support', bodyB: 'base', connectorA: 'top', connectorB: 'bottom', maxBinary: o.binary
    },
    upper: {
      type: 'servo', bodyA: 'base', bodyB: 'upper', connectorA: 'top', connectorB: 'bottom', maxBinary: o.binary
    },
    fore: {
      type: 'servo', bodyA: 'upper', bodyB: 'fore', connectorA: 'top', connectorB: 'bottom', maxBinary: o.binary
    },
    tool: {
      type: 'motor', bodyA: 'fore', bodyB: 'tool', connectorA: 'top', connectorB: 'center'
    }
  };

  return {
    settings: {
      debug: {freeze: false}
    },
    system: system,
    material: material,
    body: body,
    constraint: constraint
  };

}

function userInterface(options) {
  options = _.defaults(options || {}, {
    system: undefined,
    container: 'body'
  });

  var range = {
    pan: 175,
    upper: 90,
    fore: 120
  };

  function callback(segment) {
    return {
      type: 'range', min: -range[segment], max: range[segment], step: 1, velocity: 10, change: function () {
        var angle = this.getValues()[segment];
        var c = this.rootSystem.getSystem(options.system).getConstraint(segment);
        c.setAngle(angle * Math.PI / 180);
      }
    };
  }

  var timeout;

  function clear() {
    clearInterval(timeout);
    timeout = undefined;
  }

  return {
    values: {
      demo: function () {
        if (timeout) {
          clear();
        } else {
          var _this = this;
          var time = utils.seconds();
          timeout = setInterval(function () {
            _.each(['fore', 'upper', 'pan'], function (segment, index) {
              var angle = range[segment] * Math.sin((0.945 * index + 1) * utils.seconds(time) / 3);
              var c = _this.rootSystem.getSystem(options.system).getConstraint(segment);
              c.setAngle(angle * Math.PI / 180);
            })
          }, 100);
        }
      },
      pan: 0,
      upper: 0,
      fore: 0,
      motor: function () {
        this.rootSystem.getSystem(options.system).getConstraint('tool').enable(10,10);
      }
    },
    template: {
      pan: callback('pan'),
      upper: callback('upper'),
      fore: callback('fore')
    },
    container: options.container
  };
}

module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;
module.exports.userInterface = userInterface;


