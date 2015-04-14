var _ = require('../../lib/underscore.js');

var defaultOptions = {
  id: 'simple'
};

function getObject(options) {
  options = _.defaults(options || {}, defaultOptions);
  var settings = {settings: {}};
  settings.settings[options.id] = options;
  return settings;
}

module.exports.getObject = getObject;
module.exports.getDefaultOptions = defaultOptions;
