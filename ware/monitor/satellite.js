var _ = require('../../lib/underscore.js');

var defaultOptions = {
  id: 'satellite',
  camera: 'satellite',
  lookAt: {},
  axis: {x: 5, y: 7, z: 10},
  distance: 15
};

function getObject(options) {
  options = _.defaults(options || {}, defaultOptions);
  var monitors = {monitor: {}};
  monitors.monitor[options.id] = options;
  return monitors;
}

module.exports.getObject = getObject;
module.exports.getDefaultOptions = defaultOptions;
