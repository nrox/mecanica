var defaultOptions = {
  lengthUnits: 'mm',
  color: 0x993333,
  mass: 0,
  radius: 10,
  size: 100
};

var getObject = function (o, lib) {
  var validator = new lib.Validator();
  var _ = lib.getLibrary('_');

  o = _.defaults(o, defaultOptions);

  validator.settings('local', {
    freeze: false,
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