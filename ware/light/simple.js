var _ = require('../../lib/underscore.js');

var defaultOptions = {
  id: 'simple'
};

function getObject(options) {
  options = _.defaults(options || {}, defaultOptions);
  var lights = {light: {}};
  lights.light[options.id] = options;
  return lights;
}

module.exports.getObject = getObject;
module.exports.getDefaultOptions = defaultOptions;
