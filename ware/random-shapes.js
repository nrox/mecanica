var utils = require('../util/utils.js');
module.exports.getObject = function () {
  return {
    shape: {
      id1: {
        type: utils.randomItem(['box','cone','sphere','cylinder']),
        dx: utils.randomLinear(1, 2),
        dy: utils.randomLinear(1, 2),
        dz: utils.randomLinear(1, 2),
        r: utils.randomLinear(0.5, 1),
        segments: ~~utils.randomLinear(8, 16)
      },
      id2: {
        type: utils.randomItem(['box','cone','sphere','cylinder']),
        dx: utils.randomLinear(1, 2),
        dy: utils.randomLinear(1, 2),
        dz: utils.randomLinear(1, 2),
        r: utils.randomLinear(0.5, 1),
        segments: ~~utils.randomLinear(8, 16)
      }
    },
    material: {
      id3: { wireframe: true, color: utils.randomColor() },
      id4: { wireframe: true, color: utils.randomColor() }
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
    },
    scene: {
      s1: {}
    },
    monitor: {
      cam: {camera: 'tracker', lookAt: 'id6', axis: {x: 1, y: 0.5, z: 0.3}, distance: 20, inertia: 5}
    }
  };
};