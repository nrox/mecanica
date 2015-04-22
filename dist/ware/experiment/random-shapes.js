var utils = require('../../utils.js');

module.exports.defaultOptions = {};
module.exports.getObject = function () {
  return {
    rotation: {x: 1, y: -1},
    shape: {
      id1: {
        type: utils.randomItem(['box', 'cone', 'sphere', 'cylinder']),
        dx: utils.randomLinear(1, 3),
        dy: utils.randomLinear(1, 3),
        dz: utils.randomLinear(1, 3),
        r: utils.randomLinear(0.5, 2),
        segments: ~~utils.randomLinear(8, 16)
      },
      id2: {
        type: utils.randomItem(['box', 'cone', 'sphere', 'cylinder']),
        dx: utils.randomLinear(1, 2),
        dy: utils.randomLinear(1, 2),
        dz: utils.randomLinear(1, 2),
        r: utils.randomLinear(0.5, 1),
        segments: ~~utils.randomLinear(8, 16)
      }
    },
    material: {
      id3: {type: 'phong', color: utils.randomColor() },
      id4: {type: 'phong', color: utils.randomColor() }
    },
    body: {
      id5: { mass: 0, shape: 'id1', material: 'id4',  position: {x: 0, y: 0, z: -3}},
      id6: { mass: 0, shape: 'id2', material: 'id3', position: {x: 0, y: 0, z: 3}}
    }
  };
};