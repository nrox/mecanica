var _ = require('../../lib/underscore.js');
var box = require('../shape/smooth-box.js');
var defaultOptions = {
  scale: 1
};

function getObject(o) {
  o = _.defaults(o || {}, defaultOptions);
  var r = 0.2;
  var s = o.scale;

  var system = {
    support: box.getObject({
      r: r * s, dx: 2 * s, dy: 0.5 * s, dz: 2 * s,
      demo: false, removeSides: false
    })
  };

  var material = {
    red: {color: 0x883333},
    green: {color: 0x338833},
    blue: {color: 0x333388},
    gray: {color: 0x666666}
  };

  var body = {
    support: {
      shape: {system: 'support', id: 'smooth'}, material: 'red', mass: 0
    }
  };

  return {
    system: system,
    material: material,
    body: body
  };

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
//module.exports.userInterface = userInterface;


