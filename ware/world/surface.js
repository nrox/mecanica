var _ = require('../../lib/underscore.js');

var defaultOptions = {
  dx: 100,
  dy: 2,
  dz: 100,
  color: 0x444444,
  position: {y: -1}
};

function getObject(options) {
  options = _.defaults(options || {}, defaultOptions);
  return {
    shape: {
      box: {
        type: 'box', dx: options.dx, dy: options.dy, dz: options.dz
      }
    },
    material: {
      box: {
        type: 'phong', color: options.color
      }
    },
    body: {
      surface: {
        mass: 0, shape: 'box', material: 'box', position: options.position
      }
    }

  };
}

module.exports.getObject = getObject;
module.exports.getDefaultOptions = defaultOptions;
