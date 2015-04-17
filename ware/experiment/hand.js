var _ = require('../../lib/underscore.js');
var utils = require('../../util/utils.js');

var defaultOptions = {
  fingerRadius: 0.5,
  fingerHeight: 5,
  fingerMass: 0.1,
  handHeight: 1,
  handDepth: 2,
  distance: 5
};

function getObject(options) {
  console.warn('some issues here: bodies disappear...');
  var o = _.defaults(options || {}, defaultOptions);
  var finger = {
    type: 'imported',
    url: '../../ware/experiment/finger.js',
    position: {x: -o.distance / 2},
    rotation: {y: Math.PI / 2},
    importOptions: {
      r: o.fingerRadius, tip: 2 * o.fingerHeight / 3, base: o.fingerHeight / 3,
      baseMass: o.fingerMass / 3, tipMass: 2 * o.fingerMass / 3
    }
  };
  var objects = {
    shape: {
      hand: { type: 'box', dx: o.distance + 2 * o.fingerRadius, dy: 0.99 * o.handHeight, dz: o.handDepth}
    },
    material: {
      hand: {type: 'phong', color: 0x337722 }
    },
    body: {
      hand: {position: {y: -o.handHeight / 2}, mass: 0, shape: 'hand', material: 'hand',
        connector: {
          left: {base: {x: -o.distance / 2, y: o.handHeight / 2}, up: {y: 1}, front: {x: 1}},
          center: {base: {x: 0, y: o.handHeight / 2}, up: {y: 1}, front: {x: 1}},
          right: {base: {x: o.distance / 2, y: o.handHeight / 2}, up: {y: 1}, front: {x: 1}}
        }
      }

    },
    system: {
      left: _.extend(utils.deepCopy(finger), {position: {x: -o.distance / 2}}),
      //center: _.extend(utils.deepCopy(finger), {position: {x: 0}}),
      //right: _.extend(utils.deepCopy(finger), {position: {x: o.distance / 2}})
      right: {
        body: {
          base: {
            mass: 1,
            shape: {type: 'cylinder', r: 2, dy: 1, segments: 5},
            material: {type: 'phong', color: 0x332288},
            position: {x: o.distance / 2, y: 1.001},
            connector: {
              bottom: {base: {y: -0.5}, up: {y: 1}, front: {x: 1}}
            }
          }}
      }
    },
    constraint: {
      leftPan: {
        type: 'servo', maxBinary: 1, maxVelocity: 1, lowerLimit: -Math.PI / 2, upperLimit: Math.PI / 2,
        bodyA: 'hand', bodyB: {system: ['left'], body: 'base'},
        connectorA: 'left', connectorB: 'bottom'
      },
      rightPan: {
        type: 'servo', maxBinary: 10, maxVelocity: 1, lowerLimit: -Math.PI / 2, upperLimit: Math.PI / 2,
        bodyA: 'hand',
        bodyB: {system: ['right'], body: 'base'},
        connectorA: 'right', connectorB: 'bottom'
      }
    },
    method: {
      leftPan: {
        method: function (angle) {
          this.getConstraint('leftPan').setAngle(angle);
        }
      },
      rightPan: {
        method: function (angle) {
          this.getConstraint('rightPan').setAngle(angle);
        }
      }
    }
  };
  return objects;
}

function userInterface(options) {
  options = _.defaults(options || {}, {
    system: undefined,
    container: 'body'
  });
  var uiOptions = {
    values: {},
    template: {},
    container: options.container
  };

  function addTemplateForFinger(id, obj) {
    var tilt = {type: 'range', min: -90, max: 90, step: 1, velocity: 5, onChange: function () {
      var angle = this.getValues()[id];
      this.rootSystem.getSystem(options.system).getSystem(id).setAngle(angle * Math.PI / 180);
    }};
    var pan = {type: 'range', min: -90, max: 90, step: 1, velocity: 5, onChange: function () {
      var angle = this.getValues()[id + 'Pan'];
      this.rootSystem.getSystem(options.system)[id + 'Pan'](angle * Math.PI / 180);
    }};
    obj.template[id] = tilt;
    obj.template[id + 'Pan'] = pan;
    obj.values[id] = 0;
    obj.values[id + 'Pan'] = 0;
  }

  addTemplateForFinger('left', uiOptions);
  //addTemplateForFinger('center', uiOptions);
  addTemplateForFinger('right', uiOptions);
  return uiOptions;
}

module.exports.userInterface = userInterface;
module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;


