var _ = require('../../lib/underscore.js');

var defaultOptions = {
  width: 100,
  height: 5,
  depth: 100,
  thickness: 1,
  color: 0x555544,
  opacity: 0.5,
  position: {y: -1},
  mass: 0
};

function getObject(o) {
  o = _.defaults(o || {}, defaultOptions);
  return {
    shape: {
      base: {
        type: 'box', dx: o.width, dy: o.thickness, dz: o.depth
      },
      sideZ: {
        type: 'box', dx: o.width, dy: o.height, dz: o.thickness
      },
      sideX: {
        type: 'box', dx: o.thickness, dy: o.height, dz: o.depth
      },
      compound: {
        type: 'compound', parent: 'base', children: {
          sideZ0: {shape: 'sideZ', position: {y: o.thickness, z: o.depth / 2 - o.thickness / 2}},
          sideZ1: {shape: 'sideZ', position: {y: o.thickness, z: -o.depth / 2 + o.thickness / 2}},
          sideX0: {shape: 'sideX', position: {y: o.thickness, x: o.width / 2 - o.thickness / 2}},
          sideX1: {shape: 'sideX', position: {y: o.thickness, x: -o.width / 2 + o.thickness / 2}}
        }
      }
    },
    material: {
      box: {
        type: 'phong', color: o.color, opacity: o.opacity, friction: 10
      }
    },
    body: {
      base: {
        mass: 0, shape: 'compound', material: 'box', position: o.position
      }
    }

  };
}

module.exports.getObject = getObject;
module.exports.defaultOptions = defaultOptions;
