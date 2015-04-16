var _ = require('../../lib/underscore.js');

var defaultOptions = {
  id: 'simple',
  type: 'global',
  uiContainer: '#triggers',
  canvasContainer: '#container',
  axisHelper: true,
  connectorHelper: 0.5
};

function getObject(options) {
  options = _.defaults(options || {}, defaultOptions);
  var settings = {settings: {}};
  settings.settings[options.id] = options;
  return settings;
}

module.exports.getObject = getObject;
module.exports.defaultOptions = defaultOptions;
