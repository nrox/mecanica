var lib = require('../../../dist/mecanica.js');
var validator = new lib.Validator();

var defaultOptions = {
  lengthUnits: 'mm',
  color: 0x993333,
  mass: 0.01,
  radius: 10,
  size: 100
};

var getObject = function (o) {
  o = _.defaults(o, defaultOptions);

  validator.settings('local', {
    freeze: true,
    lengthUnits: o.lengthUnits
  });

  //cylinder
  validator.shape('pencil', {
    type: 'compound',
    parent: {type: 'cylinder', r: o.radius, dy: o.size},
    children: {
      cone: {
        type: 'cone',
        r: o.radius,
        dy: 2 * o.radius,
        rotation: {},
        position: {y: o.size / 2 + o.radius}
      }
    }
  });

  validator.material('pencil', {color: o.color});

  validator.body('pencil', {mass: o.mass, shape: 'pencil', material: 'pencil',
    connector: {
      center: {},
      bottom: {base: {y: -o.size / 2}}
    }
  });

  return validator.getObject();
};

module.exports.defaultOptions = defaultOptions;
module.exports.getObject = getObject;