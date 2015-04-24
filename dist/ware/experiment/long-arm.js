var _ = require('../../lib/underscore.js');

var defaultOptions = {
  r: 0.2, //radius
  length: 1,
  margin: 0.1,
  segments: 5,
  mass: 0.1,
  color: 0x449977
};

function getObject(o) {
  o = _.defaults(o || {}, defaultOptions);
  console.log(defaultOptions);
  var body = function (y, mass) {
    return {
      mass: mass,
      material: 'segment', shape: 'segment',
      position: {y: y},
      connector: {
        top: {base: {y: o.length / 2}, up: {z: 1}, front: {y: 1}},
        bottom: {base: {y: -o.length / 2}, up: {z: 1}, front: {y: 1}}
      }
    };
  };

  var constraint = function (bodyA, bodyB) {
    return {
      type: 'servo', bodyA: bodyA, bodyB: bodyB, connectorA: 'top', connectorB: 'bottom',
      lowerLimit: -Math.PI / 2, upperLimit: Math.PI / 2
    };
  };

  var obj = {
    shape: {
      segment: {
        type: 'cylinder', r: o.r, dy: o.length - 2 * o.margin
      }
    },
    material: {
      segment: {type: 'phong', color: o.color }
    },
    body: {

    },
    constraint: {

    },
    method: {
      setAngle: {
        method: function (angle) {
          _.each(this.objects.constraint, function (c) {
            c.setAngle(angle);
          });
        }
      }
    }
  };
  obj.body['b0'] = body(0, 0);
  for (var i = 1; i < o.segments; i++) {
    obj.body['b' + i] = body(i * o.length, o.mass);
    obj.constraint['c' + i] = constraint('b' + (i - 1), 'b' + i);
  }
  return obj;
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
      angle: {type: 'range', min: -90, max: 90, step: 1, velocity: 5, change: function () {
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


