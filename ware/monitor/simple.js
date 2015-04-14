var _ = require('../../lib/underscore.js');

var defaultOptions = {
  id: 'simple'
};

function getObject(options) {
  options = _.defaults(options || {}, defaultOptions);
  var monitors = {monitor: {}};
  monitors.monitor[options.id] = options;
  return monitors;
}

module.exports.getObject = getObject;
module.exports.getDefaultOptions = defaultOptions;
