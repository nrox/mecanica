var _ = require('../../lib/underscore.js');

var defaultOptions = {
  id: 'simple',
  type: 'global',
  uiContainer: '#triggers',
  canvasContainer: '#container',
  axisHelper: 100,
  connectorHelper: 0.75,
  wireframe: true
};

function getObject(options) {
  options = _.defaults(options || {}, defaultOptions);
  var settings = {settings: {}};
  settings.settings[options.id] = options;
  return settings;
}

module.exports.getObject = getObject;
module.exports.defaultOptions = defaultOptions;
