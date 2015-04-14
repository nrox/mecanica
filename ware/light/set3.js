var _ = require('../../lib/underscore.js');

var defaultOptions = {
  distance: 5,
  color2: 0x8899bb,
  color3: 0x445566
};

function getObject(options) {
  options = _.defaults(options || {}, defaultOptions);
  return {
    light: {
      l1: {position: {x: options.distance, z: -options.distance}},
      l2: {position: {x: -1.3 * options.distance, y: options.distance * 1.1}, color: options.color2},
      l3: {position: {y: -options.distance, z: options.distance / 5}, color: options.color3}
    }
  };
}

module.exports.getObject = getObject;
module.exports.getDefaultOptions = defaultOptions;
