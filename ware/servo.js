var utils = require('../util/utils.js');
module.exports.getObject = function (options) {
  console.warn('this servo is not ready to be used');
  return {
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
      id3: {type: 'phong', color: 0x333333 },
      id4: {type: 'phong', color: utils.randomColor() }
    },
    body: {
      id5: { mass: 0, shape: 'id1', material: 'id4'},
      id6: { mass: 1, shape: 'id2', material: 'id3', position: {x: 0, y: 0, z: 3}}
    },
    connector: {
      c1: {body: 'id5'},
      c2: {body: 'id6', base: {z: -3}}
    },
    constraint: {
      cons: {
        a: 'c1', b: 'c2', bodyA: 'id5', bodyB: 'id6'
      }
    }
  };
};