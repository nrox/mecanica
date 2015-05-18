var lib = require('../../../dist/mecanica.js');
var validator = new lib.Validator();
var pencil = require('../../tools/pencil.js');

var defaultOptions = {
  lengthUnits: 'cm',
  painterRadius: 3,
  painterDepth: 2,
  painterMass: 0.1,
  pulleyRadius: 2,
  pulleyDepth: 1,
  pulleyDistance: 50
};

var getObject = function (o) {
  o = _.defaults(o, defaultOptions);

  validator.settings('local', {
    freeze: true
  });

  //painter
  validator.shape('painter', {type: 'cylinder', r: o.painterRadius, dy: o.painterDepth});
  validator.material('painter', {color: 0x555588});
  validator.body('painter', {mass: o.painterMass, shape: 'painter', material: 'painter', rotation: {x: -Math.PI / 2},
    connector: {
      center: {}
    }
  });

  //pulleys
  validator.material('pulley', {color: 0x558855});
  validator.shape('pulley', {type: 'cylinder', r: o.pulleyRadius, dy: o.pulleyDepth});
  validator.body('left', {mass: 0, material: 'pulley', shape: 'pulley', rotation: {x: -Math.PI / 2}, position: {y: o.pulleyDistance, x: -o.pulleyDistance / 2},
    connector: {
      center: {}
    }
  });
  validator.body('right', {type: 'copy', of: 'left', position: {y: o.pulleyDistance, x: o.pulleyDistance / 2}});

  var json = validator.getObject();

  json.lengthUnits = o.lengthUnits;

  return json;
};


var userInterface = function (options) {
  options = _.defaults(options || {}, {
    system: undefined,
    container: 'body'
  });

  return {
    values: {
    },
    template: {
    },
    container: options.container
  };
};

module.exports.userInterface = userInterface;
module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;