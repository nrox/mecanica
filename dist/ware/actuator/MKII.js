var pencil = require('../../tools/pencil.js');

var defaultOptions = {
  servoBinary: 1000,
  servoVelocity: 1
};

var getObject = function (o, lib) {
  var validator = new lib.Validator;
  var _ = lib.getLibrary('_');

  o = _.defaults(o, defaultOptions);

  _.extend(o, {
    lengthUnits: 'mm',
    width: 48.5,
    size: 130,
    mass: 1
  });

  validator.settings('local', {
    freeze: true,
    connectorHelper: 0.75
  });

  var json = validator.getObject();
  json.lengthUnits = o.lengthUnits;
  return json;
};


var userInterface = function (options, lib) {
  var _ = lib.getLibrary('underscore');
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