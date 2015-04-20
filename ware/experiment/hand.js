var _ = require('../../lib/underscore.js');
var utils = require('../../util/utils.js');

var defaultOptions = {
  fingerRadius: 0.5,
  fingerHeight: 5,
  fingerMass: 0.1,
  handHeight: 1,
  handDepth: 2,
  handRadius: 2
};

function getObject(options) {
  var o = _.defaults(options || {}, defaultOptions);
  var finger = function (angle) {
    var x = Math.sin(angle);
    var z = Math.cos(angle);
    return {
      type: 'imported',
      url: '../../ware/experiment/finger.js',
      position: {x: x * o.handRadius, z: z * o.handRadius},
      rotation: {y: angle},
      importOptions: {
        r: o.fingerRadius, tip: 2 * o.fingerHeight / 3, base: o.fingerHeight / 3,
        baseMass: o.fingerMass / 3, tipMass: 2 * o.fingerMass / 3
      }
    };
  };
  var constraint = function (system) {
    return {
      type: 'servo', maxBinary: 1, maxVelocity: 1, lowerLimit: -Math.PI / 2, upperLimit: Math.PI / 2,
      bodyA: 'hand', bodyB: {system: [system], body: 'base'},
      connectorA: system, connectorB: 'bottom',
      angle: 0
    };
  };
  var pan = function (system) {
    return {
      method: function (angle) {
        this.getConstraint(system + 'Pan').setAngle(angle);
      }
    };
  };
  var connector = function (angle) {
    var x = Math.sin(angle);
    var z = Math.cos(angle);
    return {
      base: {x: x * o.handRadius, z: z * o.handRadius, y: o.handHeight / 2},
      up: {y: 1},
      front: {x: x, z: z}
    };
  };
  var objects = {
    shape: {
      hand: { type: 'cylinder', dy: o.handHeight, r: o.handRadius + o.fingerRadius, segments: 16}
    },
    material: {
      hand: {type: 'phong', color: 0x337722 }
    },
    body: {
      hand: {position: {y: -o.handHeight / 2}, mass: 0, shape: 'hand', material: 'hand',
        connector: {
          left: connector(-2 * Math.PI / 3),
          center: connector(0),
          right: connector(2 * Math.PI / 3)
        }
      }

    },
    system: {
      left: finger(-2 * Math.PI / 3),
      center: finger(0),
      right: finger(2 * Math.PI / 3)
    },
    constraint: {
      leftPan: constraint('left'),
      centerPan: constraint('center'),
      rightPan: constraint('right')
    },
    method: {
      leftPan: pan('left'),
      centerPan: pan('center'),
      rightPan: pan('right'),
      afterStep: {
        method: function () {
          if (this._done === undefined) this._done = 0;
          if (this._done++ == 1) {
            console.log('base connector', this.getSystem('left').getBody('base').connector.c);
            console.log('tip  connector', this.getSystem('left').getBody('tip').connector.c);

          }
        }
      },
      beforeStep: {
        method: function () {
          if (this._done === undefined) this._done = 0;
          if (this._done++ == 0) {
            var position = this.getSystem('left').getBody('base').position;
            //console.log('base before', position.x);
          }
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
  addTemplateForFinger('center', uiOptions);
  addTemplateForFinger('right', uiOptions);
  return uiOptions;
}

module.exports.userInterface = userInterface;
module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;


