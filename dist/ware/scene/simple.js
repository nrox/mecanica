var _ = require('../../lib/underscore.js');

var defaultOptions = {
  id: 'simple',
  type: 'basic',
  solver: 'pgs'
};

function getObject(options) {
  options = _.defaults(options || {}, defaultOptions);
  var scenes = {scene: {}};
  scenes.scene[options.id] = options;
  return scenes;
}

module.exports.getObject = getObject;
module.exports.defaultOptions = defaultOptions;
