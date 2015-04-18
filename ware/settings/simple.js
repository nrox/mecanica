var _ = require('../../lib/underscore.js');

var defaultOptions = {
  id: 'simple',
  type: 'global',
  canvasContainer: 'body',
  wireframe: false
};

function getObject(options) {
  options = _.defaults(options || {}, defaultOptions);
  var settings = {settings: {}};
  settings.settings[options.id] = options;
  return settings;
}

module.exports.getObject = getObject;
module.exports.defaultOptions = defaultOptions;
