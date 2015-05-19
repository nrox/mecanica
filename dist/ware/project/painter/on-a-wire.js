var lib = require('../../../dist/mecanica.js');
var validator = new lib.Validator();
var pencil = require('../../tools/pencil.js');

var defaultOptions = {
  lengthUnits: 'dm',
  painterRadius: 0.3,
  painterDepth: 0.2,
  painterMass: 1,
  pulleyRadius: 0.2,
  pulleyDepth: 0.1,
  pulleyDistance: 5,
  pencilSize: 0.2,
  pencilRadius: 0.05
};

var getObject = function (o) {
  o = _.defaults(o, defaultOptions);

  validator.settings('local', {
    freeze: true,
    connectorHelper: 0.75
  });

  validator.system('pencil', _.extend(pencil.getObject({
    lengthUnits: o.lengthUnits,
    color: 0x993333,
    mass: 1,
    radius: o.pencilRadius,
    size: o.pencilSize
  }), {
    rotation: {x: Math.PI / 2},
    position: {z: -o.pencilSize / 2}
  }));

  //painter
  validator.shape('painter', {type: 'cylinder', r: o.painterRadius, dy: o.painterDepth});
  validator.material('painter', {color: 0x555588});
  validator.body('painter', {mass: o.painterMass, shape: 'painter', material: 'painter',
    approach: {connector: 'top', targetBody: {system: 'pencil', id: 'pencil'}, targetConnector: 'bottom'},
    connector: {
      center: {},
      top: {base: {y: o.painterDepth / 2}}
    }
  });

  //pulleys
  validator.material('pulley', {color: 0x558855});
  validator.shape('pulley', {type: 'cylinder', r: o.pulleyRadius, dy: o.pulleyDepth});
  validator.body('left', {mass: 0, material: 'pulley', shape: 'pulley',
    rotation: {x: -Math.PI / 2},
    position: {y: o.pulleyDistance, x: -o.pulleyDistance / 2},
    connector: {
      center: {}
    }
  });
  validator.body('right', {type: 'copy', of: 'left', position: {y: o.pulleyDistance, x: o.pulleyDistance / 2}});

  validator.constraint('pencil', {type: 'hinge', bodyA: 'painter', bodyB: {system: 'pencil', id: 'pencil'}, connectorA: 'top', connectorB: 'bottom'});

  var json = validator.getObject();

  json.lengthUnits = o.lengthUnits;

  return json;
};


var userInterface = function (options, mecanica) {
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